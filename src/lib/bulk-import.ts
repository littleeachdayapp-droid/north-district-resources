import Papa from "papaparse";
import {
  CATEGORIES,
  FORMATS,
  SUBCATEGORIES_BY_CATEGORY,
  type Category,
} from "./constants";

export const CSV_COLUMNS = [
  "category",
  "title",
  "titleEs",
  "authorComposer",
  "publisher",
  "description",
  "descriptionEs",
  "subcategory",
  "format",
  "quantity",
  "maxLoanWeeks",
  "tags",
] as const;

export interface ResourceImportRow {
  category: string;
  title: string;
  titleEs: string | null;
  authorComposer: string | null;
  publisher: string | null;
  description: string | null;
  descriptionEs: string | null;
  subcategory: string | null;
  format: string | null;
  quantity: number;
  maxLoanWeeks: number | null;
  tagIds: string[];
}

export interface ValidatedRow {
  rowIndex: number;
  valid: boolean;
  data: ResourceImportRow;
  errors: string[];
  warnings: string[];
}

interface ExistingTag {
  id: string;
  name: string;
}

export function parseCSV(
  file: File
): Promise<{ rows: Record<string, string>[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete(results) {
        const errors: string[] = [];
        if (results.errors.length > 0) {
          for (const err of results.errors) {
            errors.push(
              err.row !== undefined
                ? `Row ${err.row + 1}: ${err.message}`
                : err.message
            );
          }
        }
        resolve({
          rows: results.data as Record<string, string>[],
          errors,
        });
      },
      error(err: Error) {
        resolve({ rows: [], errors: [err.message] });
      },
    });
  });
}

export function validateRow(
  row: Record<string, string>,
  rowIndex: number,
  existingTags: ExistingTag[]
): ValidatedRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  const raw = {
    category: (row.category || "").trim().toUpperCase(),
    title: (row.title || "").trim(),
    titleEs: (row.titleEs || "").trim() || null,
    authorComposer: (row.authorComposer || "").trim() || null,
    publisher: (row.publisher || "").trim() || null,
    description: (row.description || "").trim() || null,
    descriptionEs: (row.descriptionEs || "").trim() || null,
    subcategory: (row.subcategory || "").trim().toUpperCase() || null,
    format: (row.format || "").trim().toUpperCase() || null,
    quantity: (row.quantity || "").trim(),
    maxLoanWeeks: (row.maxLoanWeeks || "").trim(),
    tags: (row.tags || "").trim(),
  };

  // Category — required
  if (!raw.category) {
    errors.push("errorMissingCategory");
  } else if (!CATEGORIES.includes(raw.category as Category)) {
    errors.push("errorInvalidCategory");
  }

  // Title — required
  if (!raw.title) {
    errors.push("errorMissingTitle");
  }

  // Subcategory — must match category
  let subcategory: string | null = null;
  if (raw.subcategory && raw.category) {
    const allowed =
      SUBCATEGORIES_BY_CATEGORY[raw.category as Category] || [];
    if (allowed.includes(raw.subcategory)) {
      subcategory = raw.subcategory;
    } else {
      errors.push("errorInvalidSubcategory");
    }
  }

  // Format
  let format: string | null = null;
  if (raw.format) {
    if ((FORMATS as readonly string[]).includes(raw.format)) {
      format = raw.format;
    } else {
      errors.push("errorInvalidFormat");
    }
  }

  // Quantity
  let quantity = 1;
  if (raw.quantity) {
    const parsed = parseInt(raw.quantity, 10);
    if (isNaN(parsed) || parsed < 1 || !Number.isInteger(parsed)) {
      errors.push("errorInvalidQuantity");
    } else {
      quantity = parsed;
    }
  }

  // Max loan weeks
  let maxLoanWeeks: number | null = null;
  if (raw.maxLoanWeeks) {
    const parsed = parseInt(raw.maxLoanWeeks, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 52) {
      errors.push("errorInvalidMaxLoanWeeks");
    } else {
      maxLoanWeeks = parsed;
    }
  }

  // Tags
  const tagIds: string[] = [];
  if (raw.tags) {
    const tagNames = raw.tags.split(",").map((t) => t.trim()).filter(Boolean);
    for (const name of tagNames) {
      const match = existingTags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      );
      if (match) {
        tagIds.push(match.id);
      } else {
        warnings.push(name); // tag name stored for warning display
      }
    }
  }

  return {
    rowIndex,
    valid: errors.length === 0,
    data: {
      category: raw.category,
      title: raw.title,
      titleEs: raw.titleEs,
      authorComposer: raw.authorComposer,
      publisher: raw.publisher,
      description: raw.description,
      descriptionEs: raw.descriptionEs,
      subcategory,
      format,
      quantity,
      maxLoanWeeks,
      tagIds,
    },
    errors,
    warnings,
  };
}

export function generateTemplate(category?: string): string {
  const headers = CSV_COLUMNS.join(",");

  const exampleRows = [
    category === "STUDY"
      ? "STUDY,Disciple Bible Study,,John Smith,Cokesbury,A comprehensive Bible study,,BIBLE_STUDY,BOOK,5,4,Bible Study"
      : "MUSIC,The Faith We Sing,,,,Hymnal supplement,,HYMNAL,BOOK,10,4,Contemporary",
    category === "MUSIC"
      ? "MUSIC,Handel's Messiah,,G.F. Handel,,Complete cantata score,,CANTATA,SHEET,2,8,"
      : "STUDY,Short-Term Disciple,,Various,Abingdon,6-week Bible study overview,,BIBLE_STUDY,KIT,3,6,Bible Study",
  ];

  return [headers, ...exampleRows].join("\n");
}
