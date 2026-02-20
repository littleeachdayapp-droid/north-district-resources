import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";

const updateChurchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  nameEs: z.string().max(200).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional(),
  zip: z.string().max(10).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  pastor: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
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
    const parsed = updateChurchSchema.parse(body);

    const existing = await prisma.church.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    const church = await prisma.church.update({
      where: { id },
      data: parsed,
      include: {
        _count: { select: { resources: true, users: true } },
      },
    });

    logActivity({
      userId: user.id,
      action: "UPDATE_CHURCH",
      entityType: "Church",
      entityId: id,
      details: `Updated church "${church.name}"`,
    });

    return NextResponse.json(church);
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
