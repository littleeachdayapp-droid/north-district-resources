import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
