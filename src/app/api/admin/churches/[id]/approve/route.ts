import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { notifyChurchApproved, notifyChurchRejected } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { action, rejectionReason } = await request.json();

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Action must be APPROVE or REJECT" },
        { status: 400 }
      );
    }

    const church = await prisma.church.findUnique({
      where: { id },
    });

    if (!church) {
      return NextResponse.json(
        { error: "Church not found" },
        { status: 404 }
      );
    }

    if (church.registrationStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Church is not pending approval" },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      await prisma.church.update({
        where: { id },
        data: {
          registrationStatus: "APPROVED",
          isActive: true,
        },
      });

      logActivity({
        userId: user.id,
        action: "APPROVE_CHURCH",
        entityType: "Church",
        entityId: id,
        details: `Approved church registration: ${church.name}`,
      });

      notifyChurchApproved(id);
    } else {
      await prisma.church.update({
        where: { id },
        data: {
          registrationStatus: "REJECTED",
          rejectionReason: rejectionReason || null,
        },
      });

      logActivity({
        userId: user.id,
        action: "REJECT_CHURCH",
        entityType: "Church",
        entityId: id,
        details: `Rejected church registration: ${church.name}${rejectionReason ? ` — ${rejectionReason}` : ""}`,
      });

      notifyChurchRejected(id, rejectionReason);
    }

    return NextResponse.json({ success: true, action });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
