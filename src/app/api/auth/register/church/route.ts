import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  generateVerificationToken,
  sendVerificationEmail,
  notifyAdminNewRegistration,
} from "@/lib/email";

const churchRegisterSchema = z.object({
  // Church fields
  churchName: z.string().min(1).max(200),
  churchNameEs: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zip: z.string().max(10).optional(),
  phone: z.string().max(20).optional(),
  churchEmail: z.string().email().max(255).optional(),
  pastor: z.string().max(100).optional(),
  // User account fields
  displayName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(100),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = churchRegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken", code: "USERNAME_TAKEN" },
        { status: 409 }
      );
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered", code: "EMAIL_TAKEN" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const { token, expiry } = generateVerificationToken();

    // Transaction: create church + user together
    const church = await prisma.$transaction(async (tx) => {
      const newChurch = await tx.church.create({
        data: {
          name: data.churchName,
          nameEs: data.churchNameEs || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || "TX",
          zip: data.zip || null,
          phone: data.phone || null,
          email: data.churchEmail || null,
          pastor: data.pastor || null,
          isActive: false,
          registrationStatus: "PENDING",
        },
      });

      await tx.user.create({
        data: {
          displayName: data.displayName,
          email: data.email,
          username: data.username,
          passwordHash,
          churchId: newChurch.id,
          role: "EDITOR",
          isActive: false,
          emailVerified: false,
          verificationToken: token,
          verificationExpiry: expiry,
        },
      });

      return newChurch;
    });

    sendVerificationEmail(data.email, token, data.locale || "en");
    notifyAdminNewRegistration(church.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
