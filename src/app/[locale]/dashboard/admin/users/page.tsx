import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  await requireRole("ADMIN");

  const [users, churches] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
        churchId: true,
        church: { select: { id: true, name: true, nameEs: true } },
        createdAt: true,
      },
      orderBy: { displayName: "asc" },
    }),
    prisma.church.findMany({
      where: { isActive: true },
      select: { id: true, name: true, nameEs: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <UsersClient initialUsers={users} churches={churches} />;
}
