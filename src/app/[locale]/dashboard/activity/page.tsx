import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActivityClient } from "./ActivityClient";

const PAGE_SIZE = 20;

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const where = user.role === "ADMIN" ? {} : { userId: user.id };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, displayName: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return (
    <ActivityClient
      initialLogs={logs}
      initialPagination={{
        page: 1,
        limit: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      }}
      isAdmin={user.role === "ADMIN"}
    />
  );
}
