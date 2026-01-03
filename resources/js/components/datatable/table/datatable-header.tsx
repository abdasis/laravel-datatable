import { Checkbox } from '@/components/ui/checkbox'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Table as TableInstance } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { GripVertical } from 'lucide-react'
import React from 'react'
import { useLaravelReactI18n } from 'laravel-react-i18n'

import { ColumnHeaderActions } from './column-header-actions'
import type { DatatableColumnMeta, HeaderDragOverState, HeaderDropPosition } from './types'
import { getAlignmentClass } from './utils'

interface DatatableHeaderProps<TData> {
    table: TableInstance<TData>;
    canDragHeaders: boolean;
    draggingHeaderId: string | null;
    setDraggingHeaderId: React.Dispatch<React.SetStateAction<string | null>>;
    headerDragOverState: HeaderDragOverState | null;
    setHeaderDragOverState: React.Dispatch<React.SetStateAction<HeaderDragOverState | null>>;
    effectiveColumnOrder: string[];
    onMoveColumn: (columnId: string, direction: 'left' | 'right') => void;
    onResetColumn: (columnId: string) => void;
    onHeaderReorder: (sourceColumnId: string, targetColumnId: string, position: HeaderDropPosition) => void;
}

export function DatatableHeader<TData>({
    table,
    canDragHeaders,
    draggingHeaderId,
    setDraggingHeaderId,
    headerDragOverState,
    setHeaderDragOverState,
    effectiveColumnOrder,
    onMoveColumn,
    onResetColumn,
    onHeaderReorder,
}: DatatableHeaderProps<TData>) {
    const { t } = useLaravelReactI18n();

    return (
        <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 px-6 font-medium text-nowrap text-slate-700 dark:text-slate-300">
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                    key={headerGroup.id}
                    className="group border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 px-6 font-medium text-nowrap text-slate-700 dark:text-slate-300 hover:from-slate-100 hover:to-slate-200/50 dark:hover:from-slate-800 dark:hover:to-slate-700/50"
                >
                    <TableHead className="w-[10px] ps-4">
                        <Checkbox
                            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                            className={cn(
                                'invisible cursor-pointer shadow-none group-hover:visible data-[state=checked]:visible data-[state=checked]:border-blue-500/40 data-[state=checked]:bg-blue-500/10 data-[state=checked]:text-blue-500/80 data-[state=indeterminate]:visible data-[state=indeterminate]:text-blue-500',
                            )}
                        />
                    </TableHead>
                    {headerGroup.headers.map((header) => {
                        const columnId = header.column.id as string | undefined;
                        const isDragSource = Boolean(columnId && draggingHeaderId === columnId);
                        const isDragTarget = Boolean(columnId && headerDragOverState?.columnId === columnId);
                        const dropPosition = isDragTarget ? headerDragOverState?.position : null;

                        const headerMeta = header.column.columnDef.meta as DatatableColumnMeta | undefined;
                        const allowHeaderReorder = headerMeta?.allowReorder ?? true;
                        const headerAlignmentClass = getAlignmentClass(headerMeta?.align);

                        const handleDragOver = (event: React.DragEvent<HTMLTableCellElement>) => {
                            if (!canDragHeaders || !allowHeaderReorder || !draggingHeaderId || !columnId || draggingHeaderId === columnId) {
                                return;
                            }

                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';

                            const bounds = event.currentTarget.getBoundingClientRect();
                            const position: HeaderDropPosition = event.clientX <= bounds.left + bounds.width / 2 ? 'before' : 'after';

                            setHeaderDragOverState((previous) => {
                                if (previous?.columnId === columnId && previous.position === position) {
                                    return previous;
                                }

                                return { columnId, position };
                            });
                        };

                        const handleDrop = (event: React.DragEvent<HTMLTableCellElement>) => {
                            if (!canDragHeaders || !allowHeaderReorder || !columnId) {
                                return;
                            }

                            event.preventDefault();
                            event.stopPropagation();

                            const sourceId = event.dataTransfer.getData('text/plain') || draggingHeaderId;

                            if (!sourceId) {
                                return;
                            }

                            const sourceColumn = table.getAllLeafColumns().find((leafColumn) => leafColumn.id === sourceId);
                            const sourceMeta = sourceColumn?.columnDef.meta as DatatableColumnMeta | undefined;
                            const allowSourceReorder = sourceMeta?.allowReorder ?? true;

                            if (!allowSourceReorder) {
                                return;
                            }

                            const bounds = event.currentTarget.getBoundingClientRect();
                            const position: HeaderDropPosition =
                                dropPosition ?? (event.clientX <= bounds.left + bounds.width / 2 ? 'before' : 'after');

                            onHeaderReorder(sourceId, columnId, position);
                            setHeaderDragOverState(null);
                            setDraggingHeaderId(null);
                            event.dataTransfer.clearData();
                        };

                        const handleDragLeave = (event: React.DragEvent<HTMLTableCellElement>) => {
                            const related = event.relatedTarget as Node | null;

                            if (related && event.currentTarget.contains(related)) {
                                return;
                            }

                            setHeaderDragOverState((previous) => (previous?.columnId === columnId ? null : previous));
                        };

                        const handleDragEnd = () => {
                            setHeaderDragOverState(null);
                            setDraggingHeaderId(null);
                        };

                        const headerClasses = cn(
                            'relative bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 px-6 ps-2 font-medium text-nowrap text-slate-700 dark:text-slate-300 hover:from-slate-100 hover:to-slate-200/50 dark:hover:from-slate-800 dark:hover:to-slate-700/50',
                            header.column.columnDef.header == 'Aksi' ? 'text-right' : '',
                            headerAlignmentClass,
                            isDragTarget && 'ring-1 ring-blue-400 dark:ring-blue-500',
                            isDragSource && 'opacity-60',
                        );

                        return (
                            <TableHead
                                className={headerClasses}
                                key={header.id}
                                colSpan={header.colSpan}
                                onDragEnter={!header.isPlaceholder && canDragHeaders && allowHeaderReorder ? handleDragOver : undefined}
                                onDragOver={!header.isPlaceholder && canDragHeaders && allowHeaderReorder ? handleDragOver : undefined}
                                onDragLeave={!header.isPlaceholder && canDragHeaders && allowHeaderReorder ? handleDragLeave : undefined}
                                onDrop={!header.isPlaceholder && canDragHeaders && allowHeaderReorder ? handleDrop : undefined}
                            >
                                {header.isPlaceholder ? null : (
                                    <div className="group relative flex min-h-[30px] items-center justify-between gap-2">
                                        {isDragTarget && dropPosition === 'before' && (
                                            <span
                                                className="pointer-events-none absolute inset-y-1 left-0 w-0.5 rounded-full bg-blue-500"
                                                aria-hidden
                                            />
                                        )}
                                        {isDragTarget && dropPosition === 'after' && (
                                            <span
                                                className="pointer-events-none absolute inset-y-1 right-0 w-0.5 rounded-full bg-blue-500"
                                                aria-hidden
                                            />
                                        )}
                                        <div className="flex flex-1 items-center gap-2 truncate">
                                            {canDragHeaders && allowHeaderReorder && columnId && (
                                                <button
                                                    type="button"
                                                    className="pointer-events-none flex h-6 w-6 items-center justify-center rounded border border-transparent text-slate-400 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 hover:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
                                                    draggable
                                                    onDragStart={(event) => {
                                                        event.stopPropagation();
                                                        if (!columnId || !allowHeaderReorder) {
                                                            return;
                                                        }

                                                        setDraggingHeaderId(columnId);
                                                        setHeaderDragOverState(null);
                                                        event.dataTransfer.effectAllowed = 'move';
                                                        event.dataTransfer.setData('text/plain', columnId);
                                                    }}
                                                    onDragEnd={handleDragEnd}
                                                    onMouseDown={(event) => event.stopPropagation()}
                                                    onClick={(event) => event.preventDefault()}
                                                    aria-label={t('datatable.order.drag_hint')}
                                                >
                                                    <GripVertical className="h-4 w-4 cursor-grab active:cursor-grabbing" />
                                                </button>
                                            )}
                                            <div className="flex-1 truncate">{flexRender(header.column.columnDef.header, header.getContext())}</div>
                                        </div>
                                        <ColumnHeaderActions
                                            column={header.column}
                                            table={table}
                                            effectiveColumnOrder={effectiveColumnOrder}
                                            onMoveColumn={onMoveColumn}
                                            onResetColumn={onResetColumn}
                                        />
                                    </div>
                                )}
                            </TableHead>
                        );
                    })}
                </TableRow>
            ))}
        </TableHeader>
    );
}
