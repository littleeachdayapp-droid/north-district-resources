import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { REQUEST_STATUSES } from "@/lib/constants";
import { notifyRequestApproved, notifyRequestDenied, notifyRequestCancelled } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";

const updateRequestSchema = z.object({
  status: z.enum(REQUEST_STATUSES),
  responseMessage: z.string().max(1000).optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const loanRequest = await prisma.loanRequest.findUnique({
    where: { id },
    include: {
      resource: { select: { id: true, churchId: true, title: true } },
    },
  });

  if (!loanRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (loanRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: "Request is no longer pending" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateRequestSchema.parse(body);
    const isAdmin = user.role === "ADMIN";

    if (parsed.status === "APPROVED" || parsed.status === "DENIED") {
      // Only resource-owning church or admin can approve/deny
      if (!isAdmin && loanRequest.resource.churchId !== user.churchId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (parsed.status === "APPROVED") {
        // Create loan + update resource status in transaction
        const result = await prisma.$transaction(async (tx) => {
          const updated = await tx.loanRequest.update({
            where: { id },
            data: {
              status: "APPROVED",
              responseMessage: parsed.responseMessage || null,
            },
          });

          const loan = await tx.loan.create({
            data: {
              resourceId: loanRequest.resourceId,
              loanRequestId: id,
              borrowingChurchId: loanRequest.requestingChurchId,
              lendingChurchId: loanRequest.resource.churchId,
              dueDate: loanRequest.returnByDate,
            },
          });

          await tx.resource.update({
            where: { id: loanRequest.resourceId },
            data: { availabilityStatus: "ON_LOAN" },
          });

          return { request: updated, loan };
        });

        logActivity({
          userId: user.id,
          action: "APPROVE_REQUEST",
          entityType: "LoanRequest",
          entityId: id,
          details: `Approved loan request for "${loanRequest.resource.title}"`,
        });

        notifyRequestApproved(id);

        return NextResponse.json(result);
      } else {
        // DENIED
        const updated = await prisma.loanRequest.update({
          where: { id },
          data: {
            status: "DENIED",
            responseMessage: parsed.responseMessage || null,
          },
        });

        logActivity({
          userId: user.id,
          action: "DENY_REQUEST",
          entityType: "LoanRequest",
          entityId: id,
          details: `Denied loan request for "${loanRequest.resource.title}"`,
        });

        notifyRequestDenied(id);

        return NextResponse.json(updated);
      }
    } else if (parsed.status === "CANCELLED") {
      // Only requesting church or admin can cancel
      if (!isAdmin && loanRequest.requestingChurchId !== user.churchId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const updated = await prisma.loanRequest.update({
        where: { id },
        data: {
          status: "CANCELLED",
          responseMessage: parsed.responseMessage || null,
        },
      });

      logActivity({
        userId: user.id,
        action: "CANCEL_REQUEST",
        entityType: "LoanRequest",
        entityId: id,
        details: `Cancelled loan request for "${loanRequest.resource.title}"`,
      });

      notifyRequestCancelled(id);

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
