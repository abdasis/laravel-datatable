import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { TABLE_PREFERENCES_MAX_PINNED_COLUMNS } from '@/lib/constants/datatable'
import type { Column as TableColumn, Table as TableInstance } from '@tanstack/react-table'
import {
	ArrowDownWideNarrow,
	ArrowUpWideNarrow,
	Eye,
	EyeOff,
	MoveLeft,
	MoveRight,
	Pin,
	PinOff,
	RotateCcw,
	Settings2,
} from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { useLaravelReactI18n } from 'laravel-react-i18n'

import type { DatatableColumnMeta } from './types'

interface ColumnHeaderActionsProps<TData> {
    column: TableColumn<TData, unknown>;
    table: TableInstance<TData>;
    effectiveColumnOrder: string[];
    onMoveColumn: (columnId: string, direction: 'left' | 'right') => void;
    onResetColumn: (columnId: string) => void;
}

export function ColumnHeaderActions<TData>({ column, table, effectiveColumnOrder, onMoveColumn, onResetColumn }: ColumnHeaderActionsProps<TData>) {
    const { t } = useLaravelReactI18n();
    const [open, setOpen] = React.useState(false);
    const columnId = column.id as string | undefined;
    const meta = column.columnDef.meta as DatatableColumnMeta | undefined;

    if (!columnId || meta?.enableHeaderMenu === false) {
        return null;
    }

    const allowSorting = meta?.allowSorting ?? true;
    const allowVisibility = meta?.allowVisibility ?? true;
    const allowPinning = meta?.allowPinning ?? true;
    const allowReorder = meta?.allowReorder ?? true;

    const canSort = allowSorting && column.getCanSort();
    const sortState = column.getIsSorted();
    const canHide = allowVisibility && column.getCanHide();
    const isVisible = column.getIsVisible();
    const canPin = allowPinning && (typeof column.getCanPin === 'function' ? column.getCanPin() : true);
    const pinState = column.getIsPinned();
    const isPinnedLeft = pinState === 'left';
    const isPinnedRight = pinState === 'right';
    const isPinned = isPinnedLeft || isPinnedRight;
    const totalPinned = (table.getState().columnPinning.left?.length ?? 0) + (table.getState().columnPinning.right?.length ?? 0);

    const currentIndex = effectiveColumnOrder.indexOf(columnId);
    const canMoveLeft = allowReorder && currentIndex > 0;
    const canMoveRight = allowReorder && currentIndex >= 0 && currentIndex < effectiveColumnOrder.length - 1;

    const hasAnyAction = canSort || canHide || canPin || canMoveLeft || canMoveRight || isPinned || sortState === 'asc' || sortState === 'desc';

    if (!hasAnyAction) {
        return null;
    }

    const handleToggleVisibility = () => {
        if (!canHide) {
            return;
        }

        if (isVisible) {
            const visibleColumns = table.getVisibleLeafColumns();

            if (visibleColumns.length <= 1) {
                toast.warning(t('datatable.visibility.min_one_visible'), {
                    duration: 2000,
                    position: 'bottom-right',
                });
                return;
            }
        }

        column.toggleVisibility(!isVisible);
        setOpen(false);
    };

    const handlePin = (position: 'left' | 'right' | 'none') => {
        if (!canPin) {
            return;
        }

        if (position === 'none') {
            column.pin(false);
            setOpen(false);
            return;
        }

        if (!isPinned && totalPinned >= TABLE_PREFERENCES_MAX_PINNED_COLUMNS) {
            toast.warning(t('datatable.pinning.max_columns', { count: TABLE_PREFERENCES_MAX_PINNED_COLUMNS }), {
                duration: 2000,
                position: 'bottom-right',
            });
            return;
        }

        column.pin(position);
        setOpen(false);
    };

    const handleSort = (direction: 'asc' | 'desc') => {
        if (!canSort) {
            return;
        }

        column.toggleSorting(direction === 'desc');
        setOpen(false);
    };

    const handleClearSort = () => {
        if (!canSort) {
            return;
        }

        column.clearSorting();
        setOpen(false);
    };

    const handleMove = (direction: 'left' | 'right') => {
        if (!allowReorder) {
            return;
        }

        onMoveColumn(columnId, direction);
        setOpen(false);
    };

    const handleReset = () => {
        onResetColumn(columnId);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-transparent focus-visible:opacity-100"
                >
                    <Settings2 className="h-4 w-4 text-slate-500" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2" sideOffset={6}>
                <div className="flex flex-col gap-2 text-xs">
                    {canSort && (
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{t('datatable.sorting.title')}</p>
                            <div className="grid gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 justify-start gap-1 px-2 text-left text-xs leading-tight font-medium"
                                    disabled={sortState === 'asc'}
                                    onClick={() => handleSort('asc')}
                                >
                                    <ArrowUpWideNarrow className="h-4 w-4" />
                                    {t('datatable.sorting.sort_asc')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 justify-start gap-1 px-2 text-left text-xs leading-tight font-medium"
                                    disabled={sortState === 'desc'}
                                    onClick={() => handleSort('desc')}
                                >
                                    <ArrowDownWideNarrow className="h-4 w-4" />
                                    {t('datatable.sorting.sort_desc')}
                                </Button>
                                {sortState !== false && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 justify-start gap-1 px-2 text-left text-xs leading-tight font-medium"
                                        onClick={handleClearSort}
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        {t('datatable.sorting.clear')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    {canSort && (canHide || canPin || canMoveLeft || canMoveRight) && <Separator />}
                    {canHide && (
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{t('datatable.visibility.title')}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 justify-start gap-1 px-2 text-left text-xs leading-tight font-medium"
                                onClick={handleToggleVisibility}
                            >
                                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                {isVisible ? t('datatable.visibility.hide_column') : t('datatable.visibility.show_column')}
                            </Button>
                        </div>
                    )}
                    {canHide && (canPin || canMoveLeft || canMoveRight) && <Separator />}
                    {canPin && (
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{t('datatable.pinning.title')}</p>
                            <div className="grid gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 justify-start gap-1 px-2 text-left text-xs leading-tight font-medium"
                                    onClick={() => handlePin('left')}
                                    disabled={isPinnedLeft}
                                >
                                    <Pin className="h-4 w-4" />
                                    {t('datatable.pinning.pin_left')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 justify-start gap-1 px-2 text-left text-xs leading-tight font-medium"
                                    onClick={() => handlePin('right')}
                                    disabled={isPinnedRight}
                                >
                                    <Pin className="h-4 w-4 rotate-180" />
                                    {t('datatable.pinning.pin_right')}
                                </Button>
                                {isPinned && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 justify-start gap-1 px-2 text-left text-xs leading-tight font-medium"
                                        onClick={() => handlePin('none')}
                                    >
                                        <PinOff className="h-4 w-4" />
                                        {t('datatable.pinning.unpin')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    {canPin && (canMoveLeft || canMoveRight) && <Separator />}
                    {(canMoveLeft || canMoveRight) && (
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{t('datatable.order.title')}</p>
                            <div className="grid gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 justify-start gap-1 px-2 text-left text-xs leading-tight font-medium"
                                    onClick={() => handleMove('left')}
                                    disabled={!canMoveLeft}
                                >
                                    <MoveLeft className="h-4 w-4" />
                                    {t('datatable.order.move_left')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 justify-start gap-1 px-2 text-left text-xs leading-tight font-medium"
                                    onClick={() => handleMove('right')}
                                    disabled={!canMoveRight}
                                >
                                    <MoveRight className="h-4 w-4" />
                                    {t('datatable.order.move_right')}
                                </Button>
                            </div>
                        </div>
                    )}
                    {(canSort || canHide || canPin || canMoveLeft || canMoveRight) && <Separator />}
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{t('datatable.column_actions.reset')}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 justify-start gap-1 px-2 text-left text-xs leading-tight font-medium"
                            onClick={handleReset}
                        >
                            <RotateCcw className="h-4 w-4" />
                            {t('datatable.column_actions.reset_column')}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
