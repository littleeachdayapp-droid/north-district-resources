import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const churches = await prisma.church.findMany({
    where: { isActive: true, registrationStatus: "APPROVED" },
    include: {
      _count: { select: { resources: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(churches);
}
