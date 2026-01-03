// Main Datatable Component
export { default as Datatable } from './components/datatable/table';

// Datatable Sub-components (if needed for customization)
export { default as DatatableFooter } from './components/datatable/footer';
export { default as DatatableToolbar } from './components/datatable/toolbar';

// Types
export type {
    DatatableProps,
    DatatableFilterConfig,
    PaginatedData,
    TablePreferences,
} from './types/datatable';

// Hooks
export { useTablePreferences } from './components/datatable/use-table-preferences';

// Constants
export {
    TABLE_PREFERENCES_DEFAULT_PER_PAGE,
    TABLE_PREFERENCES_PER_PAGE_OPTIONS,
    TABLE_PREFERENCES_MAX_PINNED_COLUMNS,
    TABLE_PREFERENCES_MAX_SORTING_COLUMNS,
    TABLE_PREFERENCES_SCHEMA_VERSION,
} from './lib/constants/datatable';

// Utilities
export {
    loadPreferences,
    savePreferences,
    deletePreferences,
    sanitizePreferences,
} from './lib/utils/local-storage';
