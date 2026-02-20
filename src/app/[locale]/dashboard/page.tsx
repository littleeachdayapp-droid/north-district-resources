import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";

  const where = isAdmin ? {} : { churchId: user.churchId! };

  const resources = await prisma.resource.findMany({
    where,
    include: {
      church: { select: { id: true, name: true, nameEs: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const churches = isAdmin
    ? await prisma.church.findMany({
        where: { isActive: true },
        select: { id: true, name: true, nameEs: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <DashboardClient
      user={{
        displayName: user.displayName,
        role: user.role,
        churchId: user.churchId,
        churchName: user.church?.name || null,
      }}
      resources={resources}
      churches={churches}
    />
  );
}
