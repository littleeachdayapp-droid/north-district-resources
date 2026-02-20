import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const direction = params.get("direction"); // lent | borrowed
  const status = params.get("status");

  const isAdmin = user.role === "ADMIN";

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (!isAdmin && user.churchId) {
    if (direction === "lent") {
      where.lendingChurchId = user.churchId;
    } else if (direction === "borrowed") {
      where.borrowingChurchId = user.churchId;
    } else {
      where.OR = [
        { lendingChurchId: user.churchId },
        { borrowingChurchId: user.churchId },
      ];
    }
  } else if (isAdmin) {
    const churchId = params.get("churchId");
    if (churchId) {
      if (direction === "lent") {
        where.lendingChurchId = churchId;
      } else if (direction === "borrowed") {
        where.borrowingChurchId = churchId;
      } else {
        where.OR = [
          { lendingChurchId: churchId },
          { borrowingChurchId: churchId },
        ];
      }
    }
  }

  const loans = await prisma.loan.findMany({
    where,
    include: {
      resource: {
        select: { id: true, title: true },
      },
      borrowingChurch: {
        select: { id: true, name: true, nameEs: true },
      },
      lendingChurch: {
        select: { id: true, name: true, nameEs: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ loans });
}
