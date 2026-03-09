import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sendChurchInvite } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";

const inviteSchema = z.object({
  email: z.string().email().max(255),
  locale: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("ADMIN");
  const { id: churchId } = await params;

  const church = await prisma.church.findUnique({
    where: { id: churchId },
    select: { id: true, name: true, isActive: true, registrationStatus: true },
  });

  if (!church || !church.isActive || church.registrationStatus !== "APPROVED") {
    return NextResponse.json({ error: "Church not found or not active" }, { status: 404 });
  }

  const body = await request.json();
  const result = inviteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const { email, locale } = result.data;

  // Check if email already has an account
  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists", code: "EMAIL_EXISTS" },
      { status: 409 }
    );
  }

  // Check for existing pending invite to same church
  const existingInvite = await prisma.churchInvite.findFirst({
    where: { churchId, email, status: "PENDING" },
  });
  if (existingInvite) {
    return NextResponse.json(
      { error: "An invite for this email is already pending", code: "INVITE_PENDING" },
      { status: 409 }
    );
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.churchInvite.create({
    data: {
      churchId,
      email,
      token,
      role: "EDITOR",
      status: "PENDING",
      invitedBy: user.id,
      expiresAt,
    },
  });

  sendChurchInvite(email, token, church.name, locale || "en");

  logActivity({ userId: user.id, action: "INVITE_USER", entityType: "ChurchInvite", entityId: invite.id, details: `Invited ${email} to ${church.name}` });

  return NextResponse.json({ success: true, inviteId: invite.id }, { status: 201 });
}

// GET pending invites for a church
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireRole("ADMIN");
  const { id: churchId } = await params;

  const invites = await prisma.churchInvite.findMany({
    where: { churchId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      status: true,
      role: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return NextResponse.json(invites);
}
