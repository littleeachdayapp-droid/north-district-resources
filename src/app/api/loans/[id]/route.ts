import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { LOAN_STATUSES } from "@/lib/constants";
import { notifyLoanReturned, notifyLoanOverdue, notifyLoanLost } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";

const updateLoanSchema = z.object({
  status: z.enum(LOAN_STATUSES),
  notes: z.string().max(1000).optional().nullable(),
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

  const loan = await prisma.loan.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      resourceId: true,
      lendingChurchId: true,
      borrowingChurchId: true,
      resource: { select: { title: true } },
    },
  });

  if (!loan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only lending church or admin can update loan status
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && loan.lendingChurchId !== user.churchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Can only update active or overdue loans
  if (loan.status !== "ACTIVE" && loan.status !== "OVERDUE") {
    return NextResponse.json(
      { error: "Loan is not active" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateLoanSchema.parse(body);

    if (parsed.status === "RETURNED") {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.loan.update({
          where: { id },
          data: {
            status: "RETURNED",
            returnDate: new Date(),
            notes: parsed.notes || null,
          },
        });

        await tx.resource.update({
          where: { id: loan.resourceId },
          data: { availabilityStatus: "AVAILABLE" },
        });

        return updated;
      });

      logActivity({
        userId: user.id,
        action: "RETURN_LOAN",
        entityType: "Loan",
        entityId: id,
        details: `Returned loan for "${loan.resource.title}"`,
      });

      notifyLoanReturned(id);

      return NextResponse.json(result);
    } else if (parsed.status === "OVERDUE") {
      const updated = await prisma.loan.update({
        where: { id },
        data: {
          status: "OVERDUE",
          notes: parsed.notes || null,
        },
      });

      logActivity({
        userId: user.id,
        action: "MARK_OVERDUE",
        entityType: "Loan",
        entityId: id,
        details: `Marked loan overdue for "${loan.resource.title}"`,
      });

      notifyLoanOverdue(id);

      return NextResponse.json(updated);
    } else if (parsed.status === "LOST") {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.loan.update({
          where: { id },
          data: {
            status: "LOST",
            notes: parsed.notes || null,
          },
        });

        await tx.resource.update({
          where: { id: loan.resourceId },
          data: { availabilityStatus: "UNAVAILABLE" },
        });

        return updated;
      });

      logActivity({
        userId: user.id,
        action: "MARK_LOST",
        entityType: "Loan",
        entityId: id,
        details: `Marked loan lost for "${loan.resource.title}"`,
      });

      notifyLoanLost(id);

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
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
