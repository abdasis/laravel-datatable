import { ColumnDef } from '@tanstack/react-table'

export type DatatableFilterConfig<TData> = {
    columnId: string;
    label?: string;
    type?: 'select' | 'date' | 'date_range' | 'text' | 'number';
    options?: { value: string | number; label: string }[];
    queryKey?: string;
};

export type DatatableProps<TData> = {
    data: PaginatedData<TData>;
    columns: ColumnDef<TData, any>[];
    filters?: DatatableFilterConfig<TData>[];
    /**
     * Unique identifier for the table (optional)
     * When provided, enables localStorage persistence for table preferences
     */
    tableId?: string;
    /**
     * Nama properti Inertia yang memuat data paginasi
     * Digunakan untuk partial reload agar hanya data yang relevan yang dimuat ulang
     */
    resourceKey?: string;

    /**
     * Properti tambahan yang ikut diminta ketika melakukan partial reload
     * Cocok untuk data turunan yang harus selalu konsisten dengan tabel
     */
    additionalResourceKeys?: string[];
};

export type PaginatedData<TData> = {
    data: TData[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };

    meta: {
        current_page: number;
        from: number;
        last_page: number;
        path: string;
        per_page: number;
        to: number;
        total: number;

        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
};

/**
 * User preferences for a data table, persisted in localStorage
 */
export interface TablePreferences {
    /**
     * Column visibility state mapping
     * Key: column ID, Value: true (visible) or false (hidden)
     * Missing keys default to visible
     */
    columnVisibility: Record<string, boolean>;

    /**
     * Ordered array of column IDs representing display sequence
     * Empty array means use table definition order
     */
    columnOrder: string[];

    /**
     * Column pinning configuration
     * Pinned columns remain fixed during horizontal scroll
     */
    columnPinning: {
        /** Column IDs pinned to left edge */
        left: string[];
        /** Column IDs pinned to right edge */
        right: string[];
    };

    /**
     * Multi-column sorting configuration
     * Order in array determines sort priority (first = primary sort)
     */
    sorting: Array<{
        /** Column ID to sort by */
        id: string;
        /** Sort direction: true = descending, false = ascending */
        desc: boolean;
    }>;

    /**
     * Schema version for migration handling
     * Increment when structure changes
     */
    version: number;

    /**
     * ISO 8601 timestamp of last update
     * Used for debugging and potential sync features
     */
    updatedAt: string;

    /**
     * Jumlah baris per halaman yang dipilih pengguna
     */
    perPage: number;
}
