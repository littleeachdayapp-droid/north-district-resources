import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChurchesClient } from "./ChurchesClient";

export default async function ChurchesPage() {
  await requireRole("ADMIN");

  const churches = await prisma.church.findMany({
    include: {
      _count: { select: { resources: true, users: true } },
    },
    orderBy: { name: "asc" },
  });

  return <ChurchesClient initialChurches={churches} />;
}
