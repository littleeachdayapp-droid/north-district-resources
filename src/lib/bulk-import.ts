import Papa from "papaparse";
import * as XLSX from "xlsx";
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
  newTagNames: string[];
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

// Header alias map: alternate column names → canonical field names
const HEADER_ALIASES: Record<string, string> = {
  composer: "authorComposer",
  author: "authorComposer",
  "author/composer": "authorComposer",
  "title (spanish)": "titleEs",
  "title (es)": "titleEs",
  "spanish title": "titleEs",
  "description (spanish)": "descriptionEs",
  "description (es)": "descriptionEs",
  qty: "quantity",
  "max loan weeks": "maxLoanWeeks",
  "loan weeks": "maxLoanWeeks",
};

function normalizeHeader(header: string): string {
  const trimmed = header.trim();
  const lower = trimmed.toLowerCase();
  return HEADER_ALIASES[lower] || trimmed;
}

// Alias maps: common alternate names → canonical enum values
const SUBCATEGORY_ALIASES: Record<string, string> = {
  // Music
  CHORAL: "CHOIR_ANTHEM",
  CHOIR: "CHOIR_ANTHEM",
  ANTHEM: "CHOIR_ANTHEM",
  BELL: "HANDBELL",
  BELLS: "HANDBELL",
  HANDBELLS: "HANDBELL",
  HYMN: "HYMNAL",
  HYMNBOOK: "HYMNAL",
  SHEET: "SHEET_MUSIC",
  SCORE: "SHEET_MUSIC",
  TRACK: "ACCOMPANIMENT",
  ACCOMPANIMENT_TRACK: "ACCOMPANIMENT",
  OTHER: "OTHER_MUSIC",
  // Study
  BIBLE: "BIBLE_STUDY",
  CURRICULUM: "CURRICULUM_KIT",
  DVD: "DVD_VIDEO",
  VIDEO: "DVD_VIDEO",
  GUIDE: "LEADER_GUIDE",
  YOUTH: "YOUTH_CURRICULUM",
  CHILDREN: "CHILDREN_CURRICULUM",
  KIDS: "CHILDREN_CURRICULUM",
};

const FORMAT_ALIASES: Record<string, string> = {
  SHEET_MUSIC: "SHEET",
  SCORE: "SHEET",
  SHEETS: "SHEET",
  DISC: "DVD",
  VIDEO: "DVD",
  AUDIO: "CD",
  EBOOK: "DIGITAL",
  PDF: "DIGITAL",
  ONLINE: "DIGITAL",
  BUNDLE: "KIT",
  SET: "KIT",
  MISC: "OTHER",
};

export function parseCSV(
  file: File
): Promise<{ rows: Record<string, string>[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => normalizeHeader(header),
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

  // Subcategory — must match category (with alias normalization)
  let subcategory: string | null = null;
  if (raw.subcategory && raw.category) {
    const allowed =
      SUBCATEGORIES_BY_CATEGORY[raw.category as Category] || [];
    const normalized = SUBCATEGORY_ALIASES[raw.subcategory] || raw.subcategory;
    if (allowed.includes(normalized)) {
      subcategory = normalized;
    } else {
      errors.push("errorInvalidSubcategory");
    }
  }

  // Format (with alias normalization)
  let format: string | null = null;
  if (raw.format) {
    const normalized = FORMAT_ALIASES[raw.format] || raw.format;
    if ((FORMATS as readonly string[]).includes(normalized)) {
      format = normalized;
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

  // Tags — split on comma or semicolon
  const tagIds: string[] = [];
  const newTagNames: string[] = [];
  if (raw.tags) {
    const tagNames = raw.tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    for (const name of tagNames) {
      const match = existingTags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      );
      if (match) {
        tagIds.push(match.id);
      } else {
        newTagNames.push(name);
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
      newTagNames,
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

export async function parseXLSX(
  file: File
): Promise<{ rows: Record<string, string>[]; errors: string[] }> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { rows: [], errors: ["No sheets found in workbook."] };
    }
    const sheet = workbook.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    // Convert all values to strings and normalize headers
    const rows: Record<string, string>[] = jsonRows.map((row) => {
      const stringRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        stringRow[normalizeHeader(key)] = value == null ? "" : String(value);
      }
      return stringRow;
    });

    return { rows, errors: [] };
  } catch {
    return { rows: [], errors: ["Could not read Excel file. Please check the format."] };
  }
}

export function generateExcelTemplate(category?: string): ArrayBuffer {
  const headers = [...CSV_COLUMNS];

  const exampleRows =
    category === "STUDY"
      ? [
          {
            category: "STUDY",
            title: "Disciple Bible Study",
            titleEs: "",
            authorComposer: "John Smith",
            publisher: "Cokesbury",
            description: "A comprehensive Bible study",
            descriptionEs: "",
            subcategory: "BIBLE_STUDY",
            format: "BOOK",
            quantity: 5,
            maxLoanWeeks: 4,
            tags: "Bible Study",
          },
          {
            category: "STUDY",
            title: "Short-Term Disciple",
            titleEs: "",
            authorComposer: "Various",
            publisher: "Abingdon",
            description: "6-week Bible study overview",
            descriptionEs: "",
            subcategory: "BIBLE_STUDY",
            format: "KIT",
            quantity: 3,
            maxLoanWeeks: 6,
            tags: "Bible Study",
          },
        ]
      : [
          {
            category: "MUSIC",
            title: "The Faith We Sing",
            titleEs: "",
            authorComposer: "",
            publisher: "",
            description: "Hymnal supplement",
            descriptionEs: "",
            subcategory: "HYMNAL",
            format: "BOOK",
            quantity: 10,
            maxLoanWeeks: 4,
            tags: "Contemporary",
          },
          {
            category: category === "MUSIC" ? "MUSIC" : "STUDY",
            title:
              category === "MUSIC"
                ? "Handel's Messiah"
                : "Short-Term Disciple",
            titleEs: "",
            authorComposer: category === "MUSIC" ? "G.F. Handel" : "Various",
            publisher: category === "MUSIC" ? "" : "Abingdon",
            description:
              category === "MUSIC"
                ? "Complete cantata score"
                : "6-week Bible study overview",
            descriptionEs: "",
            subcategory: category === "MUSIC" ? "CANTATA" : "BIBLE_STUDY",
            format: category === "MUSIC" ? "SHEET" : "KIT",
            quantity: category === "MUSIC" ? 2 : 3,
            maxLoanWeeks: category === "MUSIC" ? 8 : 6,
            tags: "",
          },
        ];

  const worksheet = XLSX.utils.json_to_sheet(exampleRows, { header: headers });

  // Set column widths for readability
  worksheet["!cols"] = headers.map((h) => ({
    wch: Math.max(h.length + 2, 14),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resources");

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
