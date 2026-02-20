import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");

  const [churches, users, resources, activeLoans, pendingRequests] =
    await Promise.all([
      prisma.church.count(),
      prisma.user.count(),
      prisma.resource.count(),
      prisma.loan.count({ where: { status: { in: ["ACTIVE", "OVERDUE"] } } }),
      prisma.loanRequest.count({ where: { status: "PENDING" } }),
    ]);

  return (
    <AdminDashboardClient
      user={{ displayName: user.displayName }}
      stats={{ churches, users, resources, activeLoans, pendingRequests }}
    />
  );
}
