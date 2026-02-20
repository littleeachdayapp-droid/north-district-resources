import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-primary-800 mb-4">404</h1>
      <p className="text-lg text-primary-500 mb-8">
        {t("notFoundMessage")}
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-4 py-2 bg-accent-500 text-white rounded-lg font-medium hover:bg-accent-600 transition-colors"
      >
        {t("goHome")}
      </Link>
    </div>
  );
}
