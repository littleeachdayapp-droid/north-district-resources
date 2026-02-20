import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Username must be lowercase letters, numbers, and underscores only"),
  password: z.string().min(6).max(100),
  displayName: z.string().min(1).max(100),
  role: z.enum(["EDITOR", "ADMIN"]),
  churchId: z.string().optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      churchId: true,
      church: { select: { id: true, name: true, nameEs: true } },
      createdAt: true,
    },
    orderBy: { displayName: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.parse(body);

    // Editors must have a church
    if (parsed.role === "EDITOR" && !parsed.churchId) {
      return NextResponse.json(
        { error: "Editors must be assigned to a church." },
        { status: 400 }
      );
    }

    // Check for duplicate username
    const existing = await prisma.user.findUnique({
      where: { username: parsed.username },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: parsed.username,
        passwordHash,
        displayName: parsed.displayName,
        role: parsed.role,
        churchId: parsed.churchId || null,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
        churchId: true,
        church: { select: { id: true, name: true, nameEs: true } },
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
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
