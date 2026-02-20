import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { notifyNewRequest } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";

const createRequestSchema = z.object({
  resourceId: z.string().min(1),
  neededByDate: z.string().optional().nullable(),
  returnByDate: z.string().optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const direction = params.get("direction"); // incoming | outgoing
  const status = params.get("status");

  const isAdmin = user.role === "ADMIN";
  const churchId = params.get("churchId") || user.churchId;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (!isAdmin && user.churchId) {
    if (direction === "incoming") {
      // Requests for resources owned by my church
      where.resource = { churchId: user.churchId };
    } else if (direction === "outgoing") {
      // Requests my church made
      where.requestingChurchId = user.churchId;
    } else {
      // All requests involving my church
      where.OR = [
        { requestingChurchId: user.churchId },
        { resource: { churchId: user.churchId } },
      ];
    }
  } else if (isAdmin && churchId) {
    if (direction === "incoming") {
      where.resource = { churchId };
    } else if (direction === "outgoing") {
      where.requestingChurchId = churchId;
    }
  }

  const requests = await prisma.loanRequest.findMany({
    where,
    include: {
      resource: {
        select: { id: true, title: true, churchId: true, church: { select: { id: true, name: true, nameEs: true } } },
      },
      requestingChurch: {
        select: { id: true, name: true, nameEs: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.churchId) {
    return NextResponse.json(
      { error: "No church associated with user" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createRequestSchema.parse(body);

    // Check resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: parsed.resourceId },
      select: { id: true, churchId: true, availabilityStatus: true },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Cannot request own church's resource
    if (resource.churchId === user.churchId) {
      return NextResponse.json(
        { error: "Cannot request your own church's resource" },
        { status: 400 }
      );
    }

    // Must be available
    if (resource.availabilityStatus !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Resource is not available for loan" },
        { status: 400 }
      );
    }

    // No duplicate pending request
    const existing = await prisma.loanRequest.findFirst({
      where: {
        resourceId: parsed.resourceId,
        requestingChurchId: user.churchId,
        status: "PENDING",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A pending request already exists for this resource" },
        { status: 409 }
      );
    }

    const loanRequest = await prisma.loanRequest.create({
      data: {
        resourceId: parsed.resourceId,
        requestingChurchId: user.churchId,
        neededByDate: parsed.neededByDate ? new Date(parsed.neededByDate) : null,
        returnByDate: parsed.returnByDate ? new Date(parsed.returnByDate) : null,
        message: parsed.message || null,
      },
      include: {
        resource: {
          select: { id: true, title: true, church: { select: { id: true, name: true, nameEs: true } } },
        },
        requestingChurch: {
          select: { id: true, name: true, nameEs: true },
        },
      },
    });

    logActivity({
      userId: user.id,
      action: "CREATE_LOAN_REQUEST",
      entityType: "LoanRequest",
      entityId: loanRequest.id,
      details: `Requested loan for "${loanRequest.resource.title}"`,
    });

    notifyNewRequest(loanRequest.id);

    return NextResponse.json(loanRequest, { status: 201 });
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
