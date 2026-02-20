import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  const where = category
    ? { category: { in: [category, "BOTH"] } }
    : {};

  const tags = await prisma.tag.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
}
