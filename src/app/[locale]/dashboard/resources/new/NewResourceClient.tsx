"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ResourceForm, type ResourceFormData } from "@/components/ResourceForm";

interface Props {
  isAdmin: boolean;
  churches: { id: string; name: string; nameEs: string | null }[];
  userChurchId: string | null;
}

export function NewResourceClient({ isAdmin, churches, userChurchId }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();

  const handleSubmit = async (data: ResourceFormData) => {
    const body: Record<string, unknown> = {
      category: data.category,
      title: data.title,
      titleEs: data.titleEs || null,
      authorComposer: data.authorComposer || null,
      publisher: data.publisher || null,
      description: data.description || null,
      descriptionEs: data.descriptionEs || null,
      subcategory: data.subcategory || null,
      format: data.format || null,
      quantity: data.quantity,
      maxLoanWeeks: data.maxLoanWeeks,
      availabilityStatus: data.availabilityStatus,
      availabilityNotes: data.availabilityNotes || null,
      tagIds: data.tagIds,
    };

    if (isAdmin && data.churchId) {
      body.churchId = data.churchId;
    }

    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/dashboard" as never);
    } else {
      const err = await res.json();
      alert(err.error || t("loginError"));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={"/dashboard" as never}
        className="text-accent-600 hover:text-accent-700 text-sm mb-4 inline-block"
      >
        &larr; {t("backToDashboard")}
      </Link>
      <h1 className="text-2xl font-bold text-primary-800 mb-6">
        {t("addResource")}
      </h1>
      <ResourceForm
        onSubmit={handleSubmit}
        submitLabel={t("save")}
        submittingLabel={t("creating")}
        isAdmin={isAdmin}
        churches={churches}
        initialData={
          isAdmin ? undefined : { churchId: userChurchId || undefined }
        }
      />
    </div>
  );
}
