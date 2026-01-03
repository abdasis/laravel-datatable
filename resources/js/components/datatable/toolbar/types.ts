import type { DatatableFilterConfig } from '@/types/datatable'
import type { Column, ColumnFiltersState } from '@tanstack/react-table'
import type { ReactNode } from 'react'

export type FilterVariant = 'select' | 'multi_select' | 'date' | 'date_range' | 'text' | 'number' | 'number_range' | string;
export type FilterInputType = 'select' | 'date' | 'date_range' | 'text' | 'number' | 'number_range';

export type ColumnWithFilterMeta<TData> = Column<TData> & {
    columnDef: Column<TData>['columnDef'] & {
        header?: string | (() => ReactNode) | unknown;
        meta?: {
            filterVariant?: FilterVariant;
            filterOptions?: { value: string | number; label: string }[];
            filterTitle?: string;
        };
    };
};

export type ResolvedFilterDefinition<TData> = {
    column: ColumnWithFilterMeta<TData>;
    label: string;
    type: FilterInputType;
    options?: { value: string | number; label: string }[];
};

export type FilteredColumnName = {
    columnName: string;
    columnId: string;
    filterValue: string;
    filterVariant: FilterInputType;
};

export type ToolbarFilterConfig<TData> = DatatableFilterConfig<TData>;
export type ToolbarColumnFiltersState = ColumnFiltersState;
