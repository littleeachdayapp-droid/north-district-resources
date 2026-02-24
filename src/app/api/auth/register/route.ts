import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";

const registerSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(100),
  churchId: z.string().min(1),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const { displayName, email, username, password, churchId, locale } = result.data;

    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken", code: "USERNAME_TAKEN" },
        { status: 409 }
      );
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findFirst({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered", code: "EMAIL_TAKEN" },
        { status: 409 }
      );
    }

    // Check church exists and is approved
    const church = await prisma.church.findUnique({
      where: { id: churchId },
    });
    if (!church || !church.isActive || church.registrationStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Church not found or not available for registration" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { token, expiry } = generateVerificationToken();

    await prisma.user.create({
      data: {
        displayName,
        email,
        username,
        passwordHash,
        churchId,
        role: "EDITOR",
        isActive: false,
        emailVerified: false,
        verificationToken: token,
        verificationExpiry: expiry,
      },
    });

    sendVerificationEmail(email, token, locale || "en");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
