import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { localizedField } from "@/lib/locale-utils";
import { ResourceCard } from "@/components/ResourceCard";
import { Link } from "@/i18n/navigation";

export default async function ChurchProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("churches");
  const tc = await getTranslations("common");

  const church = await prisma.church.findUnique({
    where: { id },
    include: {
      resources: {
        include: {
          church: {
            select: { id: true, name: true, nameEs: true, city: true },
          },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!church) notFound();

  const name = localizedField(locale, church.name, church.nameEs);
  const fullAddress = [church.address, church.city, church.state, church.zip]
    .filter(Boolean)
    .join(", ");
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/churches"
        className="text-sm text-accent-600 hover:text-accent-700 font-medium inline-flex items-center gap-1 mb-6"
      >
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {tc("back")}
      </Link>

      <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-6 sm:p-8 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4">
          {name}
        </h1>

        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-4">
          {church.pastor && (
            <div>
              <dt className="text-xs font-medium text-primary-400 uppercase">
                {t("pastor")}
              </dt>
              <dd className="text-primary-700">{church.pastor}</dd>
            </div>
          )}
          {church.phone && (
            <div>
              <dt className="text-xs font-medium text-primary-400 uppercase">
                {t("phone")}
              </dt>
              <dd className="text-primary-700">
                <a href={`tel:${church.phone}`} className="hover:text-accent-600">
                  {church.phone}
                </a>
              </dd>
            </div>
          )}
          {church.email && (
            <div>
              <dt className="text-xs font-medium text-primary-400 uppercase">
                {t("email")}
              </dt>
              <dd className="text-primary-700">
                <a
                  href={`mailto:${church.email}`}
                  className="hover:text-accent-600"
                >
                  {church.email}
                </a>
              </dd>
            </div>
          )}
          {fullAddress && (
            <div>
              <dt className="text-xs font-medium text-primary-400 uppercase">
                {t("address")}
              </dt>
              <dd className="text-primary-700">{fullAddress}</dd>
            </div>
          )}
        </dl>

        {fullAddress && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700 font-medium"
          >
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {t("viewOnMap")}
          </a>
        )}
      </div>

      {/* Church resources */}
      <h2 className="text-xl font-bold text-primary-800 mb-4">
        {t("resourcesFromChurch", { churchName: name })}
      </h2>
      {church.resources.length === 0 ? (
        <p className="text-primary-500">
          {t("resourceCount", { count: 0 })}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {church.resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
