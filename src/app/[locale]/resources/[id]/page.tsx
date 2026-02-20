import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { localizedField } from "@/lib/locale-utils";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { RequestLoanButton } from "@/components/RequestLoanButton";
import { Link } from "@/i18n/navigation";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("resources");
  const tc = await getTranslations("common");
  const tCat = await getTranslations("categories");
  const tSub = await getTranslations("subcategories");
  const tFmt = await getTranslations("formats");

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      church: true,
      tags: { include: { tag: true } },
      loans: {
        where: { status: { in: ["ACTIVE", "OVERDUE"] } },
        include: {
          borrowingChurch: {
            select: { id: true, name: true, nameEs: true },
          },
        },
        take: 1,
      },
    },
  });

  if (!resource) notFound();

  const activeLoan = resource.loans[0] || null;
  const title = localizedField(locale, resource.title, resource.titleEs);
  const description = localizedField(
    locale,
    resource.description,
    resource.descriptionEs
  );
  const churchName = localizedField(
    locale,
    resource.church.name,
    resource.church.nameEs
  );

  const categoryColor =
    resource.category === "MUSIC"
      ? "bg-music-100 text-music-800 border-music-200"
      : "bg-study-100 text-study-800 border-study-200";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={resource.category === "MUSIC" ? "/music" : "/study"}
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

      <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <span
              className={`inline-flex px-2.5 py-1 text-xs font-medium rounded border ${categoryColor}`}
            >
              {tCat(resource.category as "MUSIC" | "STUDY")}
            </span>
            <AvailabilityBadge status={resource.availabilityStatus} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">
            {title}
          </h1>

          {resource.authorComposer && (
            <p className="text-lg text-primary-500 mb-4">
              {resource.authorComposer}
            </p>
          )}

          <p className="text-sm text-primary-500 mb-6">
            {t("ownedBy")}{" "}
            <Link
              href={`/churches/${resource.church.id}`}
              className="text-accent-600 hover:text-accent-700 font-medium"
            >
              {churchName}
            </Link>
          </p>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-primary-800 mb-2">
              {t("description")}
            </h2>
            <p className="text-primary-600 leading-relaxed">
              {description || t("noDescription")}
            </p>
          </div>

          {/* Details grid */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-primary-800 mb-3">
              {t("details")}
            </h2>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {resource.subcategory && (
                <div>
                  <dt className="text-xs font-medium text-primary-400 uppercase">
                    {tc("subcategory")}
                  </dt>
                  <dd className="text-primary-700">
                    {tSub(resource.subcategory as never)}
                  </dd>
                </div>
              )}
              {resource.format && (
                <div>
                  <dt className="text-xs font-medium text-primary-400 uppercase">
                    {tc("format")}
                  </dt>
                  <dd className="text-primary-700">
                    {tFmt(resource.format as never)}
                  </dd>
                </div>
              )}
              {resource.publisher && (
                <div>
                  <dt className="text-xs font-medium text-primary-400 uppercase">
                    Publisher
                  </dt>
                  <dd className="text-primary-700">{resource.publisher}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-primary-400 uppercase">
                  {tc("quantity")}
                </dt>
                <dd className="text-primary-700">{resource.quantity}</dd>
              </div>
              {resource.maxLoanWeeks && (
                <div>
                  <dt className="text-xs font-medium text-primary-400 uppercase">
                    {tc("loanPeriod")}
                  </dt>
                  <dd className="text-primary-700">
                    {resource.maxLoanWeeks} {tc("weeks")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Tags */}
          {resource.tags.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-primary-800 mb-3">
                {tc("tags")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="bg-accent-100 text-accent-700 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {localizedField(locale, tag.name, tag.nameEs)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Active loan info */}
          {activeLoan && (
            <div className="bg-on-loan/10 border border-on-loan/30 rounded-lg p-4">
              <p className="text-sm font-medium text-primary-700">
                {t("currentlyOnLoan")}
              </p>
              <p className="text-sm text-primary-500 mt-1">
                {t("borrowedBy")}:{" "}
                {localizedField(
                  locale,
                  activeLoan.borrowingChurch.name,
                  activeLoan.borrowingChurch.nameEs
                )}
              </p>
            </div>
          )}

          {/* Request loan button */}
          <RequestLoanButton
            resourceId={resource.id}
            resourceChurchId={resource.churchId}
            availabilityStatus={resource.availabilityStatus}
          />

          {/* Availability notes */}
          {resource.availabilityNotes && (
            <div className="mt-4 bg-primary-100 rounded-lg p-4">
              <p className="text-sm font-medium text-primary-700">
                {t("availabilityNotes")}
              </p>
              <p className="text-sm text-primary-600 mt-1">
                {resource.availabilityNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
