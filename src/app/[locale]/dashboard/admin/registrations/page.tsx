import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegistrationsClient } from "./RegistrationsClient";

export default async function RegistrationsPage() {
  await requireRole("ADMIN");

  const pendingChurches = await prisma.church.findMany({
    where: { registrationStatus: "PENDING" },
    include: {
      users: {
        select: { displayName: true, email: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <RegistrationsClient initialChurches={pendingChurches} />;
}
