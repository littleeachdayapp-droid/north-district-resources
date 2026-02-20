import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
