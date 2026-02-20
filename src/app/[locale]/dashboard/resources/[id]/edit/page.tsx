import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditResourceClient } from "./EditResourceClient";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const isAdmin = user.role === "ADMIN";

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      tags: { select: { tagId: true } },
    },
  });

  if (!resource) redirect("/dashboard");

  // Editors can only edit their own church's resources
  if (!isAdmin && resource.churchId !== user.churchId) {
    redirect("/dashboard");
  }

  const churches = isAdmin
    ? await prisma.church.findMany({
        where: { isActive: true },
        select: { id: true, name: true, nameEs: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <EditResourceClient
      resource={{
        id: resource.id,
        category: resource.category,
        title: resource.title,
        titleEs: resource.titleEs || "",
        authorComposer: resource.authorComposer || "",
        publisher: resource.publisher || "",
        description: resource.description || "",
        descriptionEs: resource.descriptionEs || "",
        subcategory: resource.subcategory || "",
        format: resource.format || "",
        quantity: resource.quantity,
        maxLoanWeeks: resource.maxLoanWeeks,
        availabilityStatus: resource.availabilityStatus,
        availabilityNotes: resource.availabilityNotes || "",
        churchId: resource.churchId,
        tagIds: resource.tags.map((t) => t.tagId),
      }}
      isAdmin={isAdmin}
      churches={churches}
    />
  );
}
