import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResourceListPage } from "@/components/ResourceListPage";

export default async function MusicPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("resources");
  const tc = await getTranslations("common");
  const sp = await searchParams;

  return (
    <ResourceListPage
      category="MUSIC"
      title={t("musicResources")}
      noResultsText={tc("noResults")}
      searchParams={sp}
    />
  );
}
