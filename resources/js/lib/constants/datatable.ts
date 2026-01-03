/**
 * Default number of rows per page
 */
export const TABLE_PREFERENCES_DEFAULT_PER_PAGE = 10 as const;

/**
 * Available options for rows per page
 */
export const TABLE_PREFERENCES_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Maximum number of columns that can be pinned
 */
export const TABLE_PREFERENCES_MAX_PINNED_COLUMNS = 3 as const;

/**
 * Maximum number of sorting columns
 */
export const TABLE_PREFERENCES_MAX_SORTING_COLUMNS = 3 as const;

/**
 * Toast notification duration in milliseconds
 */
export const TOAST_DURATION = 3000 as const;

/**
 * Table preferences schema version for migrations
 */
export const TABLE_PREFERENCES_SCHEMA_VERSION = 1 as const;
