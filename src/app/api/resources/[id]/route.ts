import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import {
  CATEGORIES,
  ALL_SUBCATEGORIES,
  FORMATS,
  AVAILABILITY_STATUSES,
} from "@/lib/constants";

const updateResourceSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  title: z.string().min(1).max(500).optional(),
  titleEs: z.string().max(500).optional().nullable(),
  authorComposer: z.string().max(300).optional().nullable(),
  publisher: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  descriptionEs: z.string().max(2000).optional().nullable(),
  subcategory: z.enum(ALL_SUBCATEGORIES).optional().nullable(),
  format: z.enum(FORMATS).optional().nullable(),
  quantity: z.number().int().min(1).optional(),
  maxLoanWeeks: z.number().int().min(1).max(52).optional().nullable(),
  availabilityStatus: z.enum(AVAILABILITY_STATUSES).optional(),
  availabilityNotes: z.string().max(500).optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      church: true,
      tags: { include: { tag: true } },
      loans: {
        where: { status: { in: ["ACTIVE", "OVERDUE"] } },
        include: {
          borrowingChurch: {
            select: { id: true, name: true, nameEs: true },
          },
        },
        take: 1,
      },
    },
  });

  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(resource);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { churchId: true },
  });

  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Editors can only edit their own church's resources
  if (user.role !== "ADMIN" && resource.churchId !== user.churchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateResourceSchema.parse(body);
    const { tagIds, ...data } = parsed;

    const updated = await prisma.$transaction(async (tx) => {
      // Update tags if provided
      if (tagIds !== undefined) {
        await tx.resourceTag.deleteMany({ where: { resourceId: id } });
        if (tagIds.length > 0) {
          await tx.resourceTag.createMany({
            data: tagIds.map((tagId) => ({ resourceId: id, tagId })),
          });
        }
      }

      return tx.resource.update({
        where: { id },
        data,
        include: {
          church: {
            select: { id: true, name: true, nameEs: true, city: true },
          },
          tags: { include: { tag: true } },
        },
      });
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { churchId: true },
  });

  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Editors can only delete their own church's resources
  if (user.role !== "ADMIN" && resource.churchId !== user.churchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.resource.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
