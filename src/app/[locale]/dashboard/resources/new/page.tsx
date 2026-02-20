import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewResourceClient } from "./NewResourceClient";

export default async function NewResourcePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";

  const churches = isAdmin
    ? await prisma.church.findMany({
        where: { isActive: true },
        select: { id: true, name: true, nameEs: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <NewResourceClient
      isAdmin={isAdmin}
      churches={churches}
      userChurchId={user.churchId}
    />
  );
}
