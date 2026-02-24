export const CATEGORIES = ["MUSIC", "STUDY"] as const;
export type Category = (typeof CATEGORIES)[number];

export const MUSIC_SUBCATEGORIES = [
  "HYMNAL",
  "SHEET_MUSIC",
  "CANTATA",
  "HANDBELL",
  "CHOIR_ANTHEM",
  "ACCOMPANIMENT",
  "INSTRUMENT",
  "OTHER_MUSIC",
] as const;

export const STUDY_SUBCATEGORIES = [
  "BIBLE_STUDY",
  "BOOK",
  "CURRICULUM_KIT",
  "DVD_VIDEO",
  "DEVOTIONAL",
  "LEADER_GUIDE",
  "YOUTH_CURRICULUM",
  "CHILDREN_CURRICULUM",
  "OTHER_STUDY",
] as const;

export const ALL_SUBCATEGORIES = [
  ...MUSIC_SUBCATEGORIES,
  ...STUDY_SUBCATEGORIES,
] as const;

export type Subcategory = (typeof ALL_SUBCATEGORIES)[number];

export const SUBCATEGORIES_BY_CATEGORY: Record<Category, readonly string[]> = {
  MUSIC: MUSIC_SUBCATEGORIES,
  STUDY: STUDY_SUBCATEGORIES,
};

export const AVAILABILITY_STATUSES = [
  "AVAILABLE",
  "ON_LOAN",
  "UNAVAILABLE",
] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const FORMATS = [
  "BOOK",
  "DVD",
  "CD",
  "DIGITAL",
  "SHEET",
  "KIT",
  "OTHER",
] as const;
export type Format = (typeof FORMATS)[number];

export const ROLES = ["EDITOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const LOAN_STATUSES = [
  "ACTIVE",
  "RETURNED",
  "OVERDUE",
  "LOST",
] as const;

export const REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "DENIED",
  "CANCELLED",
] as const;

export const TAG_CATEGORIES = ["MUSIC", "STUDY", "BOTH"] as const;

export const CHURCH_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ChurchStatus = (typeof CHURCH_STATUSES)[number];
