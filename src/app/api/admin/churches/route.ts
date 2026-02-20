import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity-log";

const createChurchSchema = z.object({
  name: z.string().min(1).max(200),
  nameEs: z.string().max(200).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).default("TX"),
  zip: z.string().max(10).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  pastor: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const churches = await prisma.church.findMany({
    include: {
      _count: { select: { resources: true, users: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ churches });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createChurchSchema.parse(body);

    const church = await prisma.church.create({
      data: parsed,
      include: {
        _count: { select: { resources: true, users: true } },
      },
    });

    logActivity({
      userId: user.id,
      action: "CREATE_CHURCH",
      entityType: "Church",
      entityId: church.id,
      details: `Created church "${parsed.name}"`,
    });

    return NextResponse.json(church, { status: 201 });
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
