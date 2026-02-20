import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BulkImportClient } from "./BulkImportClient";

export default async function BulkImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";

  const [churches, tags] = await Promise.all([
    isAdmin
      ? prisma.church.findMany({
          where: { isActive: true },
          select: { id: true, name: true, nameEs: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.tag.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <BulkImportClient
      isAdmin={isAdmin}
      churches={churches}
      userChurchId={user.churchId}
      tags={tags}
    />
  );
}
