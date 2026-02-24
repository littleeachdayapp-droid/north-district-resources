import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        church: {
          select: { id: true, name: true, nameEs: true, registrationStatus: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Block login if email not verified
    if (user.email && !user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    // Block login if church is pending/rejected
    if (user.church && user.church.registrationStatus !== "APPROVED") {
      const code = user.church.registrationStatus === "PENDING"
        ? "CHURCH_PENDING"
        : "CHURCH_REJECTED";
      return NextResponse.json(
        { error: "Your church registration is still being reviewed.", code },
        { status: 403 }
      );
    }

    // Block inactive users (admin-deactivated)
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await setAuthCookie({
      userId: user.id,
      username: user.username,
      role: user.role,
      churchId: user.churchId,
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      churchId: user.churchId,
      church: user.church
        ? { id: user.church.id, name: user.church.name, nameEs: user.church.nameEs }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
