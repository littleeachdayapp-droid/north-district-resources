import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const inviteRegisterSchema = z.object({
  token: z.string().min(1),
  displayName: z.string().min(1).max(100),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = inviteRegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const { token, displayName, username, password } = result.data;

    // Find the invite
    const invite = await prisma.churchInvite.findUnique({
      where: { token },
      include: { church: { select: { id: true, name: true, isActive: true } } },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite link", code: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invite has already been used", code: "INVITE_USED" },
        { status: 400 }
      );
    }

    if (new Date() > invite.expiresAt) {
      await prisma.churchInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This invite has expired. Please ask your church admin to send a new one.", code: "INVITE_EXPIRED" },
        { status: 400 }
      );
    }

    if (!invite.church.isActive) {
      return NextResponse.json(
        { error: "This church is no longer active", code: "CHURCH_INACTIVE" },
        { status: 400 }
      );
    }

    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken", code: "USERNAME_TAKEN" },
        { status: 409 }
      );
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findFirst({ where: { email: invite.email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user — email already verified since they clicked the invite link
    await prisma.user.create({
      data: {
        displayName,
        email: invite.email,
        username,
        passwordHash,
        churchId: invite.church.id,
        role: invite.role,
        isActive: true,
        emailVerified: true,
      },
    });

    // Mark invite as accepted
    await prisma.churchInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    return NextResponse.json({
      success: true,
      churchName: invite.church.name,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
