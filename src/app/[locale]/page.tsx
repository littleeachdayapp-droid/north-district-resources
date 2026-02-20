import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { ResourceCard } from "@/components/ResourceCard";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  const recentResources = await prisma.resource.findMany({
    where: { availabilityStatus: "AVAILABLE" },
    include: {
      church: { select: { id: true, name: true, nameEs: true, city: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary-800 text-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            {t("heroTitle")}
          </h1>
          <p className="text-lg sm:text-xl text-primary-200 max-w-2xl mx-auto">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Category Cards */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 sm:-mt-12">
        <div className="grid sm:grid-cols-2 gap-6">
          <Link
            href="/music"
            className="bg-white rounded-xl shadow-lg border-2 border-music-200 p-6 sm:p-8 hover:border-music-500 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎵</span>
              <h2 className="text-2xl font-bold text-music-800 group-hover:text-music-600">
                {t("browseMusic")}
              </h2>
            </div>
            <p className="text-primary-500">{t("musicDescription")}</p>
          </Link>

          <Link
            href="/study"
            className="bg-white rounded-xl shadow-lg border-2 border-study-200 p-6 sm:p-8 hover:border-study-500 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📖</span>
              <h2 className="text-2xl font-bold text-study-800 group-hover:text-study-600">
                {t("browseStudy")}
              </h2>
            </div>
            <p className="text-primary-500">{t("studyDescription")}</p>
          </Link>
        </div>
      </section>

      {/* View Churches Link */}
      <section className="max-w-5xl mx-auto px-4 mt-8 text-center">
        <Link
          href="/churches"
          className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-700 font-semibold"
        >
          {t("viewChurches")}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </section>

      {/* Recent Resources */}
      {recentResources.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-16">
          <h2 className="text-2xl font-bold text-primary-800 mb-6">
            {t("recentResources")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
