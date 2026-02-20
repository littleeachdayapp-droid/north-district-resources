"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  CATEGORIES,
  SUBCATEGORIES_BY_CATEGORY,
  FORMATS,
  AVAILABILITY_STATUSES,
  type Category,
} from "@/lib/constants";

interface Tag {
  id: string;
  name: string;
  nameEs: string | null;
  category: string;
}

interface Church {
  id: string;
  name: string;
  nameEs: string | null;
}

export interface ResourceFormData {
  category: string;
  title: string;
  titleEs: string;
  authorComposer: string;
  publisher: string;
  description: string;
  descriptionEs: string;
  subcategory: string;
  format: string;
  quantity: number;
  maxLoanWeeks: number | null;
  availabilityStatus: string;
  availabilityNotes: string;
  churchId?: string;
  tagIds: string[];
}

interface ResourceFormProps {
  initialData?: Partial<ResourceFormData>;
  onSubmit: (data: ResourceFormData) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
  isAdmin?: boolean;
  churches?: Church[];
}

export function ResourceForm({
  initialData,
  onSubmit,
  submitLabel,
  submittingLabel,
  isAdmin,
  churches,
}: ResourceFormProps) {
  const t = useTranslations("auth");
  const tCat = useTranslations("categories");
  const tSub = useTranslations("subcategories");
  const tFmt = useTranslations("formats");
  const tAvail = useTranslations("availability");

  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);

  const [category, setCategory] = useState(initialData?.category || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [titleEs, setTitleEs] = useState(initialData?.titleEs || "");
  const [authorComposer, setAuthorComposer] = useState(
    initialData?.authorComposer || ""
  );
  const [publisher, setPublisher] = useState(initialData?.publisher || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [descriptionEs, setDescriptionEs] = useState(
    initialData?.descriptionEs || ""
  );
  const [subcategory, setSubcategory] = useState(
    initialData?.subcategory || ""
  );
  const [format, setFormat] = useState(initialData?.format || "");
  const [quantity, setQuantity] = useState(initialData?.quantity ?? 1);
  const [maxLoanWeeks, setMaxLoanWeeks] = useState<number | "">(
    initialData?.maxLoanWeeks ?? ""
  );
  const [availabilityStatus, setAvailabilityStatus] = useState(
    initialData?.availabilityStatus || "AVAILABLE"
  );
  const [availabilityNotes, setAvailabilityNotes] = useState(
    initialData?.availabilityNotes || ""
  );
  const [churchId, setChurchId] = useState(initialData?.churchId || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tagIds || []
  );

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => setTags(data))
      .catch(() => {});
  }, []);

  const subcategories = category
    ? SUBCATEGORIES_BY_CATEGORY[category as Category] || []
    : [];

  // Filter tags by category
  const filteredTags = category
    ? tags.filter((tag) => tag.category === category || tag.category === "BOTH")
    : tags;

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        category,
        title,
        titleEs: titleEs || "",
        authorComposer: authorComposer || "",
        publisher: publisher || "",
        description: description || "",
        descriptionEs: descriptionEs || "",
        subcategory: subcategory || "",
        format: format || "",
        quantity,
        maxLoanWeeks: maxLoanWeeks === "" ? null : maxLoanWeeks,
        availabilityStatus,
        availabilityNotes: availabilityNotes || "",
        churchId: churchId || undefined,
        tagIds: selectedTagIds,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-primary-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Admin church selector */}
      {isAdmin && churches && (
        <div>
          <label htmlFor="churchId" className={labelClass}>
            {t("church")} *
          </label>
          <select
            id="churchId"
            required
            value={churchId}
            onChange={(e) => setChurchId(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("selectChurch")}</option>
            {churches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category */}
      <div>
        <label htmlFor="category" className={labelClass}>
          {tCat("MUSIC")}/{tCat("STUDY")} *
        </label>
        <select
          id="category"
          required
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setSubcategory("");
          }}
          className={inputClass}
        >
          <option value="">{t("selectCategory")}</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {tCat(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategory */}
      {subcategories.length > 0 && (
        <div>
          <label htmlFor="subcategory" className={labelClass}>
            {t("selectSubcategory")}
          </label>
          <select
            id="subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("selectSubcategory")}</option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {tSub(sub)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className={labelClass}>
          {t("title")} *
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Title (Spanish) */}
      <div>
        <label htmlFor="titleEs" className={labelClass}>
          {t("titleEs")}
        </label>
        <input
          id="titleEs"
          value={titleEs}
          onChange={(e) => setTitleEs(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Author/Composer */}
      <div>
        <label htmlFor="authorComposer" className={labelClass}>
          {t("authorComposer")}
        </label>
        <input
          id="authorComposer"
          value={authorComposer}
          onChange={(e) => setAuthorComposer(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Publisher */}
      <div>
        <label htmlFor="publisher" className={labelClass}>
          {t("publisher")}
        </label>
        <input
          id="publisher"
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>
          {t("description")}
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Description (Spanish) */}
      <div>
        <label htmlFor="descriptionEs" className={labelClass}>
          {t("descriptionEs")}
        </label>
        <textarea
          id="descriptionEs"
          rows={3}
          value={descriptionEs}
          onChange={(e) => setDescriptionEs(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Format */}
      <div>
        <label htmlFor="format" className={labelClass}>
          {t("selectFormat")}
        </label>
        <select
          id="format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className={inputClass}
        >
          <option value="">{t("selectFormat")}</option>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {tFmt(f)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className={labelClass}>
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className={inputClass}
          />
        </div>

        {/* Max Loan Weeks */}
        <div>
          <label htmlFor="maxLoanWeeks" className={labelClass}>
            {t("maxLoanWeeks")}
          </label>
          <input
            id="maxLoanWeeks"
            type="number"
            min={1}
            max={52}
            value={maxLoanWeeks}
            onChange={(e) =>
              setMaxLoanWeeks(e.target.value ? parseInt(e.target.value) : "")
            }
            className={inputClass}
          />
        </div>
      </div>

      {/* Availability Status */}
      <div>
        <label htmlFor="availabilityStatus" className={labelClass}>
          {tAvail("AVAILABLE")}
        </label>
        <select
          id="availabilityStatus"
          value={availabilityStatus}
          onChange={(e) => setAvailabilityStatus(e.target.value)}
          className={inputClass}
        >
          {AVAILABILITY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {tAvail(status)}
            </option>
          ))}
        </select>
      </div>

      {/* Availability Notes */}
      <div>
        <label htmlFor="availabilityNotes" className={labelClass}>
          {t("availabilityNotes")}
        </label>
        <input
          id="availabilityNotes"
          value={availabilityNotes}
          onChange={(e) => setAvailabilityNotes(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Tags */}
      {filteredTags.length > 0 && (
        <div>
          <span className={labelClass}>Tags</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {filteredTags.map((tag) => (
              <label
                key={tag.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors ${
                  selectedTagIds.includes(tag.id)
                    ? "bg-accent-100 border-accent-400 text-accent-700"
                    : "bg-primary-50 border-primary-200 text-primary-600 hover:bg-primary-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                  className="sr-only"
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-primary-700 text-white py-2 px-6 rounded-md font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
