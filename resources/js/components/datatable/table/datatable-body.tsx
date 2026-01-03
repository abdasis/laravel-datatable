import { Checkbox } from '@/components/ui/checkbox'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Column, Table as TableInstance } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { Edit, RotateCcw, Trash2, UserCircle } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { useLaravelReactI18n } from 'laravel-react-i18n'

import NoDataIllustration from '../assets/no-data.svg'
import type { DatatableColumnMeta, DatatableSkeletonRenderContext } from './types'
import { getAlignmentClass } from './utils'

interface DatatableBodyProps<TData> {
    table: TableInstance<TData>;
    loading: boolean;
    pageSize: number;
}

function resolveSkeletonAlignmentClass(alignment?: DatatableColumnMeta['align']): string | undefined {
    if (!alignment) {
        return undefined;
    }

    if (alignment === 'right' || alignment === 'end') {
        return 'justify-end';
    }

    if (alignment === 'center') {
        return 'justify-center';
    }

    return 'justify-start';
}

function resolveSkeletonContent<TData>(column: Column<TData, unknown>, rowIndex: number): { content: ReactNode; alignmentClass?: string } {
    const meta = column.columnDef.meta as DatatableColumnMeta<TData> | undefined;
    const alignmentClass = resolveSkeletonAlignmentClass(meta?.align);

    const context: DatatableSkeletonRenderContext<TData> = {
        rowIndex,
        column,
    };

    if (meta?.skeleton) {
        const skeleton = meta.skeleton;
        return {
            content: typeof skeleton === 'function' ? skeleton(context) : skeleton,
            alignmentClass,
        };
    }

    return {
        content: <div className="h-4 w-full rounded bg-slate-200/80" aria-hidden />,
        alignmentClass,
    };
}

export function DatatableBody<TData>({ table, loading, pageSize }: DatatableBodyProps<TData>) {
    const { t } = useLaravelReactI18n();
    const visibleColumns = table.getVisibleLeafColumns();
    const skeletonColumns = visibleColumns.length > 0 ? visibleColumns : table.getAllLeafColumns();
    const totalVisibleColumns = visibleColumns.length > 0 ? visibleColumns.length : skeletonColumns.length;

    if (loading) {
        const skeletonRowCount = Math.max(1, pageSize || table.getState().pagination?.pageSize || 10);

        return (
            <TableBody className="px-6">
                {Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                    <TableRow key={`skeleton-row-${rowIndex}`} className="h-12 animate-pulse border-slate-100">
                        <TableCell className="ps-4">
                            <div className="h-4 w-4 rounded bg-slate-200/80" aria-hidden />
                        </TableCell>
                        {skeletonColumns.map((column, colIndex) => {
                            const columnId = column.id ?? column.columnDef.id ?? column.columnDef.header?.toString() ?? `skeleton-col-${colIndex}`;
                            const meta = column.columnDef.meta as DatatableColumnMeta<TData> | undefined;
                            const alignmentClass = getAlignmentClass(meta?.align);
                            const cellClasses = cn(
                                'min-h-8 px-6 ps-10 font-normal text-zinc-600',
                                column.columnDef.header === 'Aksi' && 'text-right',
                                alignmentClass,
                                meta?.noWrap && 'text-nowrap',
                            );
                            const { content, alignmentClass: skeletonAlignment } = resolveSkeletonContent(column, rowIndex);

                            return (
                                <TableCell key={columnId} className={cellClasses} aria-hidden>
                                    <div className={cn('flex w-full items-center', skeletonAlignment ?? 'justify-start')}>{content}</div>
                                </TableCell>
                            );
                        })}
                    </TableRow>
                ))}
            </TableBody>
        );
    }

    if (table.getRowModel().rows.length === 0) {
        return (
            <TableBody className="px-6">
                <TableRow className="bg-white hover:bg-white">
                    <TableCell colSpan={Math.max(1, totalVisibleColumns) + 1} className="py-16 text-center">
                        <img src={NoDataIllustration} className="mx-auto h-52" alt={t('datatable.no_data')} />
                        <h4 className="text-primary/80 mt-5 text-lg font-semibold">{t('datatable.no_data')}</h4>
                        <p className="text-sm font-light text-slate-500">
                            {t('datatable.no_data_description')}
                        </p>
                    </TableCell>
                </TableRow>
            </TableBody>
        );
    }

    return (
        <TableBody className="px-6">
            {table.getRowModel().rows.map((row) => {
                const isRowSelected = row.getIsSelected();

                return (
                    <Fragment key={row.id}>
                        <ContextMenu>
                            <ContextMenuTrigger asChild>
                                <TableRow
                                    key={row.id}
                                    className={cn(
                                        'group h-8 border-l-2 border-slate-100 border-l-transparent transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/60',
                                        isRowSelected &&
                                            'border-l-blue-500 bg-blue-50/70 hover:bg-blue-100/70 dark:border-l-blue-400/80 dark:bg-blue-500/10 dark:hover:bg-blue-500/15',
                                    )}
                                >
                                    <TableCell className="ps-4">
                                        <Checkbox
                                            checked={row.getIsSelected()}
                                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                                            aria-label="Select row"
                                            className={cn(
                                                'invisible cursor-pointer shadow-none group-hover:visible data-[state=checked]:visible data-[state=checked]:border-blue-500/40 data-[state=checked]:bg-blue-500/10 data-[state=checked]:text-blue-500/80',
                                            )}
                                        />
                                    </TableCell>
                                    {row.getVisibleCells().map((cell) => {
                                        const cellMeta = cell.column.columnDef.meta as DatatableColumnMeta<TData> | undefined;
                                        const cellAlignmentClass = getAlignmentClass(cellMeta?.align);

                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={cn(
                                                    'px-6 ps-10 font-normal text-zinc-600',
                                                    cell.column.columnDef.header == 'Aksi' && 'text-right',
                                                    cellAlignmentClass,
                                                    cellMeta?.noWrap && 'text-nowrap',
                                                )}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-64">
                                <ContextMenuItem>
                                    <Edit size={16} className="mr-2" />
                                    {t('datatable.context_menu.edit')}
                                    <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
                                </ContextMenuItem>
                                <ContextMenuItem>
                                    <RotateCcw size={16} className="mr-2" />
                                    {t('datatable.context_menu.rotate_office')}
                                    <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
                                </ContextMenuItem>
                                <ContextMenuItem>
                                    <UserCircle size={16} className="mr-2" />
                                    {t('datatable.context_menu.change_position')}
                                    <ContextMenuShortcut>Ctrl+J</ContextMenuShortcut>
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem className="text-rose-500">
                                    <Trash2 size={16} className="mr-2" />
                                    {t('datatable.context_menu.delete')}
                                    <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    </Fragment>
                );
            })}
        </TableBody>
    );
}
