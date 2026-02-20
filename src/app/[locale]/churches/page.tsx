import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ChurchCard } from "@/components/ChurchCard";

export const dynamic = "force-dynamic";

export default async function ChurchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("churches");

  const churches = await prisma.church.findMany({
    where: { isActive: true },
    include: { _count: { select: { resources: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary-800 mb-6">
        {t("churchDirectory")}
      </h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {churches.map((church) => (
          <ChurchCard key={church.id} church={church} />
        ))}
      </div>
    </div>
  );
}
