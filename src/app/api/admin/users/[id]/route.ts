import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity-log";

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  role: z.enum(["EDITOR", "ADMIN"]).optional(),
  churchId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).max(100).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateUserSchema.parse(body);

    // Prevent deactivating self
    if (parsed.isActive === false && id === user.id) {
      return NextResponse.json(
        { error: "You cannot deactivate yourself." },
        { status: 400 }
      );
    }

    // If changing to EDITOR, must have a church
    if (parsed.role === "EDITOR" && parsed.churchId === null) {
      return NextResponse.json(
        { error: "Editors must be assigned to a church." },
        { status: 400 }
      );
    }

    // Check target user exists
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If switching to EDITOR and no churchId provided, check existing
    if (parsed.role === "EDITOR" && parsed.churchId === undefined && !target.churchId) {
      return NextResponse.json(
        { error: "Editors must be assigned to a church." },
        { status: 400 }
      );
    }

    // Build update data
    const data: Record<string, unknown> = {};
    if (parsed.displayName !== undefined) data.displayName = parsed.displayName;
    if (parsed.role !== undefined) data.role = parsed.role;
    if (parsed.churchId !== undefined) data.churchId = parsed.churchId;
    if (parsed.isActive !== undefined) data.isActive = parsed.isActive;
    if (parsed.password) {
      data.passwordHash = await bcrypt.hash(parsed.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
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

    logActivity({
      userId: user.id,
      action: "UPDATE_USER",
      entityType: "User",
      entityId: id,
      details: `Updated user "${updated.displayName}"`,
    });

    return NextResponse.json(updated);
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
