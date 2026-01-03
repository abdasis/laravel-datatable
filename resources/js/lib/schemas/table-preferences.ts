import { TablePreferences } from '@/types/datatable';
import { TABLE_PREFERENCES_DEFAULT_PER_PAGE, TABLE_PREFERENCES_SCHEMA_VERSION } from '@/lib/constants/datatable';

export { TABLE_PREFERENCES_SCHEMA_VERSION };

export const DEFAULT_PREFERENCES: Omit<TablePreferences, 'version' | 'updatedAt'> = {
    columnVisibility: {},
    columnOrder: [],
    columnPinning: {
        left: [],
        right: [],
    },
    sorting: [],
    perPage: TABLE_PREFERENCES_DEFAULT_PER_PAGE,
};
