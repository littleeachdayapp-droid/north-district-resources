"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  parseCSV,
  parseXLSX,
  validateRow,
  generateTemplate,
  generateExcelTemplate,
  type ValidatedRow,
} from "@/lib/bulk-import";

interface BulkImportClientProps {
  isAdmin: boolean;
  churches: { id: string; name: string; nameEs: string | null }[];
  userChurchId: string | null;
  tags: { id: string; name: string }[];
}

type Step = "upload" | "preview" | "results";

interface ImportResult {
  created: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export function BulkImportClient({
  isAdmin,
  churches,
  userChurchId,
  tags,
}: BulkImportClientProps) {
  const t = useTranslations("bulkImport");
  const tAuth = useTranslations("auth");

  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [churchId, setChurchId] = useState(isAdmin ? "" : (userChurchId || ""));
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => r.valid);
  const errorRows = rows.filter((r) => !r.valid);
  const warningRows = rows.filter((r) => r.valid && r.warnings.length > 0);
  const newTagRows = rows.filter((r) => r.valid && r.data.newTagNames.length > 0);

  const handleDownloadTemplate = () => {
    const csv = generateTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resource-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcelTemplate = async () => {
    const data = await generateExcelTemplate();
    const blob = new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resource-import-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const processFile = useCallback(
    async (file: File) => {
      setParseErrors([]);
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isExcel = ext === "xlsx" || ext === "xls";
      const { rows: parsed, errors } = isExcel
        ? await parseXLSX(file)
        : await parseCSV(file);
      if (errors.length > 0) {
        setParseErrors(errors);
        return;
      }
      if (parsed.length === 0) {
        setParseErrors([t("noValidRows")]);
        return;
      }

      const validated = parsed.map((row, i) => validateRow(row, i, tags));
      setRows(validated);
      setStep("preview");
    },
    [tags, t]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    const ext = file?.name.split(".").pop()?.toLowerCase();
    if (file && (ext === "csv" || ext === "xlsx" || ext === "xls")) {
      await processFile(file);
    }
  };

  const handleRemoveInvalid = () => {
    setRows(rows.filter((r) => r.valid));
  };

  const handleImport = async () => {
    if (isAdmin && !churchId) return;

    setImporting(true);
    setImportProgress(0);

    const resources = validRows.map((r) => ({
      category: r.data.category,
      title: r.data.title,
      titleEs: r.data.titleEs,
      authorComposer: r.data.authorComposer,
      publisher: r.data.publisher,
      description: r.data.description,
      descriptionEs: r.data.descriptionEs,
      subcategory: r.data.subcategory,
      format: r.data.format,
      quantity: r.data.quantity,
      maxLoanWeeks: r.data.maxLoanWeeks,
      tagIds: r.data.tagIds,
      newTagNames: r.data.newTagNames,
    }));

    try {
      const res = await fetch("/api/resources/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resources,
          ...(isAdmin ? { churchId } : {}),
        }),
      });

      if (res.ok) {
        const data: ImportResult = await res.json();
        setResult(data);
        setImportProgress(resources.length);
      } else {
        const err = await res.json();
        setResult({
          created: 0,
          failed: resources.length,
          errors: [{ row: -1, error: err.error || "Import failed" }],
        });
      }
    } catch {
      setResult({
        created: 0,
        failed: resources.length,
        errors: [{ row: -1, error: "Network error" }],
      });
    }

    setImporting(false);
    setStep("results");
  };

  const handleReset = () => {
    setStep("upload");
    setRows([]);
    setParseErrors([]);
    setResult(null);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Step indicators
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: t("stepUpload") },
    { key: "preview", label: t("stepPreview") },
    { key: "results", label: t("stepResults") },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">
            {t("pageTitle")}
          </h1>
          <Link
            href={"/dashboard" as never}
            className="text-sm text-accent-600 hover:text-accent-700"
          >
            {tAuth("backToDashboard")}
          </Link>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                i === stepIndex
                  ? "bg-accent-100 text-accent-800"
                  : i < stepIndex
                    ? "bg-green-100 text-green-800"
                    : "bg-primary-100 text-primary-400"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === stepIndex
                    ? "bg-accent-500 text-white"
                    : i < stepIndex
                      ? "bg-green-500 text-white"
                      : "bg-primary-300 text-white"
                }`}
              >
                {i < stepIndex ? "\u2713" : i + 1}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-primary-300" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="space-y-6">
          {/* Download template */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <p className="text-sm text-primary-600 mb-3">
              {t("downloadTemplateDesc")}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 bg-white border border-primary-300 text-primary-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-50 transition-colors"
              >
                {t("downloadTemplate")}
              </button>
              <button
                onClick={handleDownloadExcelTemplate}
                className="inline-flex items-center gap-2 bg-white border border-primary-300 text-primary-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-50 transition-colors"
              >
                {t("downloadExcelTemplate")}
              </button>
            </div>
          </div>

          {/* File upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragOver
                ? "border-accent-400 bg-accent-50"
                : "border-primary-300 bg-white"
            }`}
          >
            <p className="text-primary-500 mb-4">{t("dragDrop")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-primary-700 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-primary-800 transition-colors"
            >
              {t("selectFile")}
            </button>
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-800 mb-2">
                {t("parseError")}
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Preview & Validate */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Summary bar + action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-primary-700">
                {t("summaryBar", {
                  valid: validRows.length,
                  errors: errorRows.length,
                  newTags: newTagRows.length,
                })}
              </span>
              {errorRows.length > 0 && (
                <button
                  onClick={handleRemoveInvalid}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  {t("removeInvalid")}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-primary-300 text-primary-700 rounded-md text-sm font-medium hover:bg-primary-50 transition-colors"
              >
                {tAuth("cancel")}
              </button>
              <button
                onClick={handleImport}
                disabled={
                  validRows.length === 0 ||
                  importing ||
                  (isAdmin && !churchId)
                }
                className="px-6 py-2 bg-primary-700 text-white rounded-md text-sm font-medium hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing
                  ? t("importing")
                  : t("importButton", { count: validRows.length })}
              </button>
            </div>
          </div>

          {/* Admin church selector */}
          {isAdmin && (
            <div className="bg-white border border-primary-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-primary-700 mb-2">
                {t("selectChurch")}
              </label>
              <select
                value={churchId}
                onChange={(e) => setChurchId(e.target.value)}
                className="w-full max-w-sm px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
              >
                <option value="">{tAuth("selectChurch")}</option>
                {churches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {isAdmin && !churchId && (
                <p className="text-xs text-red-600 mt-1">
                  {t("churchRequired")}
                </p>
              )}
            </div>
          )}

          {/* Preview table */}
          <div className="overflow-x-auto border border-primary-200 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary-50 border-b border-primary-200 text-left text-primary-600">
                  <th className="py-2 px-3 font-medium">{t("columnRow")}</th>
                  <th className="py-2 px-3 font-medium">
                    {t("columnCategory")}
                  </th>
                  <th className="py-2 px-3 font-medium">
                    {t("columnTitle")}
                  </th>
                  <th className="py-2 px-3 font-medium hidden md:table-cell">
                    {t("columnSubcategory")}
                  </th>
                  <th className="py-2 px-3 font-medium hidden md:table-cell">
                    {t("columnFormat")}
                  </th>
                  <th className="py-2 px-3 font-medium hidden sm:table-cell">
                    {t("columnQuantity")}
                  </th>
                  <th className="py-2 px-3 font-medium">{t("columnStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.rowIndex}
                    className={`border-b border-primary-100 ${
                      !row.valid
                        ? "bg-red-50"
                        : row.data.newTagNames.length > 0
                          ? "bg-blue-50"
                          : "hover:bg-primary-50"
                    }`}
                  >
                    <td className="py-2 px-3 text-primary-400">
                      {row.rowIndex + 1}
                    </td>
                    <td className="py-2 px-3">{row.data.category}</td>
                    <td className="py-2 px-3 font-medium text-primary-800">
                      {row.data.title || "—"}
                    </td>
                    <td className="py-2 px-3 hidden md:table-cell text-primary-500">
                      {row.data.subcategory || "—"}
                    </td>
                    <td className="py-2 px-3 hidden md:table-cell text-primary-500">
                      {row.data.format || "—"}
                    </td>
                    <td className="py-2 px-3 hidden sm:table-cell">
                      {row.data.quantity}
                    </td>
                    <td className="py-2 px-3">
                      {!row.valid ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            {t("hasErrors")}
                          </span>
                          <ul className="mt-1 text-xs text-red-600">
                            {row.errors.map((err, i) => (
                              <li key={i}>
                                {t(err as "errorMissingCategory")}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : row.data.newTagNames.length > 0 ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            {t("valid")}
                          </span>
                          <ul className="mt-1 text-xs text-blue-600">
                            {row.data.newTagNames.map((tag, i) => (
                              <li key={i}>
                                {t("newTagWillCreate", { tag })}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          {t("valid")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Step 3: Results */}
      {step === "results" && result && (
        <div className="space-y-6">
          <div className="bg-white border border-primary-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-primary-800 mb-4">
              {t("resultTitle")}
            </h2>

            <div className="flex gap-6 mb-4">
              {result.created > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-primary-700">
                    {t("resultCreated", { count: result.created })}
                  </span>
                </div>
              )}
              {result.failed > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-primary-700">
                    {t("resultFailed", { count: result.failed })}
                  </span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm font-medium text-red-800 mb-2">
                  {t("resultErrors")}
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      {err.row >= 0
                        ? `${t("columnRow")} ${err.row + 1}: ${err.error}`
                        : err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              href={"/dashboard" as never}
              className="px-4 py-2 bg-primary-700 text-white rounded-md text-sm font-medium hover:bg-primary-800 transition-colors"
            >
              {t("backToDashboard")}
            </Link>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-primary-300 text-primary-700 rounded-md text-sm font-medium hover:bg-primary-50 transition-colors"
            >
              {t("importMore")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
