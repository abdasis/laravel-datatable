export type HeaderDropPosition = 'before' | 'after';

export interface HeaderDragOverState {
    columnId: string;
    position: HeaderDropPosition;
}

import type { Column } from '@tanstack/react-table'
import type { ReactNode } from 'react'

export interface DatatableSkeletonRenderContext<TData> {
    rowIndex: number;
    column: Column<TData, unknown>;
}

export type DatatableColumnSkeleton<TData> = ReactNode | ((context: DatatableSkeletonRenderContext<TData>) => ReactNode);

export interface DatatableColumnMeta<TData = unknown> {
    align?: 'left' | 'right' | 'center' | 'start' | 'end' | 'justify';
    noWrap?: boolean;
    skeleton?: DatatableColumnSkeleton<TData>;
    allowSorting?: boolean;
    allowPinning?: boolean;
    allowVisibility?: boolean;
    allowReorder?: boolean;
    enableHeaderMenu?: boolean;
}
