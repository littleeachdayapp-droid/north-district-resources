/**
 * Returns the localized value for a bilingual DB field.
 * Falls back to the English value if the localized value is null/empty.
 */
export function localizedField(
  locale: string,
  enValue: string | null | undefined,
  esValue: string | null | undefined
): string {
  if (locale === "es" && esValue) return esValue;
  return enValue || "";
}
