import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import {
  CATEGORIES,
  ALL_SUBCATEGORIES,
  FORMATS,
  AVAILABILITY_STATUSES,
} from "@/lib/constants";
import { logActivity } from "@/lib/activity-log";

const createResourceSchema = z.object({
  category: z.enum(CATEGORIES),
  title: z.string().min(1).max(500),
  titleEs: z.string().max(500).optional().nullable(),
  authorComposer: z.string().max(300).optional().nullable(),
  publisher: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  descriptionEs: z.string().max(2000).optional().nullable(),
  subcategory: z.enum(ALL_SUBCATEGORIES).optional().nullable(),
  format: z.enum(FORMATS).optional().nullable(),
  quantity: z.number().int().min(1).default(1),
  maxLoanWeeks: z.number().int().min(1).max(52).optional().nullable(),
  availabilityStatus: z.enum(AVAILABILITY_STATUSES).default("AVAILABLE"),
  availabilityNotes: z.string().max(500).optional().nullable(),
  churchId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const search = params.get("search") || "";
  const category = params.get("category");
  const subcategory = params.get("subcategory");
  const churchId = params.get("churchId");
  const availability = params.get("availability");
  const tagIds = params.get("tags")?.split(",").filter(Boolean) || [];
  const sort = params.get("sort") || "newest";
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(params.get("limit") || "12")));

  const where: Prisma.ResourceWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { authorComposer: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (category) where.category = category;
  if (subcategory) where.subcategory = subcategory;
  if (churchId) where.churchId = churchId;
  if (availability) where.availabilityStatus = availability;

  if (tagIds.length > 0) {
    where.tags = { some: { tagId: { in: tagIds } } };
  }

  const orderBy: Prisma.ResourceOrderByWithRelationInput =
    sort === "title"
      ? { title: "asc" }
      : sort === "author"
        ? { authorComposer: "asc" }
        : { createdAt: "desc" };

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: {
        church: { select: { id: true, name: true, nameEs: true, city: true } },
        tags: { include: { tag: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.resource.count({ where }),
  ]);

  return NextResponse.json({
    resources,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createResourceSchema.parse(body);

    // Determine churchId: editors use their own church, admins can specify
    let churchId: string;
    if (user.role === "ADMIN" && parsed.churchId) {
      churchId = parsed.churchId;
    } else if (user.churchId) {
      churchId = user.churchId;
    } else {
      return NextResponse.json(
        { error: "No church associated with user" },
        { status: 400 }
      );
    }

    const { tagIds, ...resourceData } = parsed;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { churchId: _ignoredChurchId, ...data } = resourceData;

    const resource = await prisma.resource.create({
      data: {
        ...data,
        churchId,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: {
        church: { select: { id: true, name: true, nameEs: true, city: true } },
        tags: { include: { tag: true } },
      },
    });

    logActivity({
      userId: user.id,
      action: "CREATE_RESOURCE",
      entityType: "Resource",
      entityId: resource.id,
      details: `Created resource "${parsed.title}"`,
    });

    return NextResponse.json(resource, { status: 201 });
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
