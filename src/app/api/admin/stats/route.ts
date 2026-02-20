import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [churches, users, resources, activeLoans, pendingRequests] =
    await Promise.all([
      prisma.church.count(),
      prisma.user.count(),
      prisma.resource.count(),
      prisma.loan.count({ where: { status: { in: ["ACTIVE", "OVERDUE"] } } }),
      prisma.loanRequest.count({ where: { status: "PENDING" } }),
    ]);

  return NextResponse.json({
    churches,
    users,
    resources,
    activeLoans,
    pendingRequests,
  });
}
