import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, locale } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email, emailVerified: false },
    });

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({ success: true });
    }

    // Rate limit: 1 resend per hour
    if (user.verificationExpiry) {
      const tokenAge = Date.now() - (user.verificationExpiry.getTime() - 24 * 60 * 60 * 1000);
      if (tokenAge < 60 * 60 * 1000) {
        return NextResponse.json(
          { error: "Please wait before requesting another verification email", code: "RATE_LIMITED" },
          { status: 429 }
        );
      }
    }

    const { token, expiry } = generateVerificationToken();

    await prisma.user.update({
      where: { id: user.id },
      data: {
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
