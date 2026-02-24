import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
      include: {
        church: { select: { registrationStatus: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token", code: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    if (user.verificationExpiry && user.verificationExpiry < new Date()) {
      return NextResponse.json(
        { error: "Token has expired", code: "TOKEN_EXPIRED" },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({
        verified: true,
        alreadyVerified: true,
        churchPending: user.church?.registrationStatus === "PENDING",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isActive: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    const churchPending = user.church?.registrationStatus === "PENDING";

    return NextResponse.json({ verified: true, churchPending });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
