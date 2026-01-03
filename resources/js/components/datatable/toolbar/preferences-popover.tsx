import React from 'react'
import { useLaravelReactI18n } from 'laravel-react-i18n'

import { TOAST_DURATION } from '@/components/datatable/toolbar/constants'
import type { ColumnWithFilterMeta } from '@/components/datatable/toolbar/types'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import { useIsMobile } from '@/hooks/use-mobile'
import { TABLE_PREFERENCES_MAX_PINNED_COLUMNS, TABLE_PREFERENCES_MAX_SORTING_COLUMNS } from '@/lib/constants/datatable'
import { cn } from '@/lib/utils'
import {
	EditTableIcon,
	FilterVerticalFreeIcons,
	ReloadIcon,
	SlidersVerticalIcon,
	SortByDown02Icon,
	SortByUp02Icon,
	Sorting05Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { SortingState, Table } from '@tanstack/react-table'
import { ChevronDown, ChevronUp, Clock3, GripVertical, Pin, PinOff, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface DragOverState {
    columnId: string;
    position: 'above' | 'below';
}

interface ToolbarPreferencesPopoverProps<TData> {
    hasUnsavedChanges?: boolean;
    perPage?: number;
    perPageOptions?: number[];
    onPerPageChange?: (value: number) => void;
    sortingState: SortingState;
    table: Table<TData>;
    resolveColumnLabel: (column: ColumnWithFilterMeta<TData>, explicitLabel?: string) => string;
    handleSortPriorityMove: (columnId: string, direction: 'up' | 'down') => void;
    handleToggleSortDirection: (columnId: string) => void;
    handleRemoveSort: (columnId: string) => void;
    handleResetSorting: () => void;
    canResetSorting: boolean;
    sortSelectValue: string | undefined;
    setSortSelectValue: (value: string | undefined) => void;
    handleAddSortColumn: (value: string) => void;
    canAddMoreSorting: boolean;
    availableSortColumns: { id: string; label: string }[];
    totalPinnedColumns: number;
    pinLimitReached: boolean;
    handlePinColumn: (columnId: string, position: 'left' | 'right' | 'none') => void;
    toggleAllColumnsVisibility: (value: boolean) => void;
    orderedColumns: ColumnWithFilterMeta<TData>[];
    handleMoveColumnOrder: (columnId: string, direction: 'up' | 'down') => void;
    handleResetColumnOrder: () => void;
    canResetColumnOrder: boolean;
    draggingColumnId: string | null;
    setDraggingColumnId: React.Dispatch<React.SetStateAction<string | null>>;
    dragOverState: DragOverState | null;
    setDragOverState: React.Dispatch<React.SetStateAction<DragOverState | null>>;
    handleReorderColumns: (sourceColumnId: string, targetColumnId: string, position: 'above' | 'below') => void;
    onSavePreferences?: () => void;
    canSavePreferences?: boolean;
    handleResetPreferences: () => void;
    shouldEnableReset: boolean;
    formattedLastUpdated: string | null;
}

export function ToolbarPreferencesPopover<TData>({
    hasUnsavedChanges,
    perPage,
    perPageOptions,
    onPerPageChange,
    sortingState,
    table,
    resolveColumnLabel,
    handleSortPriorityMove,
    handleToggleSortDirection,
    handleRemoveSort,
    handleResetSorting,
    canResetSorting,
    sortSelectValue,
    setSortSelectValue,
    handleAddSortColumn,
    canAddMoreSorting,
    availableSortColumns,
    totalPinnedColumns,
    pinLimitReached,
    handlePinColumn,
    toggleAllColumnsVisibility,
    orderedColumns,
    handleMoveColumnOrder,
    handleResetColumnOrder,
    canResetColumnOrder,
    draggingColumnId,
    setDraggingColumnId,
    dragOverState,
    setDragOverState,
    handleReorderColumns,
    onSavePreferences,
    canSavePreferences,
    handleResetPreferences,
    shouldEnableReset,
    formattedLastUpdated,
}: ToolbarPreferencesPopoverProps<TData>) {
    const { t } = useLaravelReactI18n();
    const allowDrag = orderedColumns.length > 1;
    const isMobile = useIsMobile();
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

    const guardToggleAllColumns = (value: boolean) => {
        if (!value) {
            toast.warning(t('datatable.visibility.min_one_visible'), {
                duration: TOAST_DURATION,
                position: 'bottom-right',
            });
            return;
        }

        toggleAllColumnsVisibility(value);
    };

    const handleColumnVisibilityChange = (columnId: string, nextVisibility: boolean) => {
        const column = table.getColumn(columnId);

        if (!column) {
            return;
        }

        if (!nextVisibility) {
            const visibleColumns = table.getVisibleFlatColumns();
            if (visibleColumns.length === 1 && visibleColumns[0].id === column.id) {
                toast.warning(t('datatable.visibility.min_one_visible'), {
                    duration: TOAST_DURATION,
                    position: 'bottom-right',
                });
                return;
            }
        }

        column.toggleVisibility(nextVisibility);
    };

    const triggerButton = (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                className={cn(
                    'z-0 ml-auto h-8 w-auto gap-1 border-slate-200/80 px-3 text-sm select-none focus-visible:ring-0',
                    hasUnsavedChanges && 'border-amber-300 bg-amber-50 text-amber-700',
                )}
            >
                <HugeiconsIcon icon={SlidersVerticalIcon} size={14} />
                <span className="hidden md:block">{t('datatable.preferences.title')}</span>
            </Button>
            {hasUnsavedChanges && <span className="absolute -top-1 -right-1 inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />}
        </div>
    );

    const headerClassName = cn('flex-shrink-0 border-b border-slate-100 bg-white', isMobile ? 'px-3 py-2.5' : 'p-3');
    const bodyClassName = cn('flex-1 min-h-0 space-y-4', isMobile ? 'px-3 py-3' : 'p-3 pr-4');
    const footerClassName = cn('flex-shrink-0 border-t border-slate-100 bg-white space-y-2.5', isMobile ? 'px-4 py-3' : 'px-4 py-3');

    const preferencesContent = (
        <div className="flex h-full max-h-full flex-col overflow-hidden">
            <div className={headerClassName}>
                <div className="flex items-center justify-between gap-2">
                    <h5 className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <HugeiconsIcon icon={EditTableIcon} size={14} />
                        {t('datatable.preferences.customize_table')}
                    </h5>
                    {isMobile && (
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600">
                                <X className="h-4 w-4" />
                                <span className="sr-only">{t('datatable.preferences.close')}</span>
                            </Button>
                        </DrawerClose>
                    )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{t('datatable.preferences.description')}</p>
            </div>

            <div className={cn(bodyClassName, "overflow-y-auto")}>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-slate-700">{t('datatable.rows_per_page.title')}</h5>
                    </div>
                    <Select
                        value={perPage !== undefined ? String(perPage) : undefined}
                        onValueChange={(value) => onPerPageChange?.(Number(value))}
                        disabled={!onPerPageChange || !perPageOptions || perPageOptions.length === 0}
                    >
                        <SelectTrigger className="h-7 w-full text-xs shadow-none">
                            <SelectValue placeholder={t('datatable.rows_per_page.select_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {(perPageOptions ?? []).map((option) => (
                                <SelectItem key={option} value={String(option)} className="text-xs">
                                    {t('datatable.rows_per_page.option', { count: option })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <HugeiconsIcon icon={Sorting05Icon} size={14} />
                            <span>{t('datatable.sorting.title')}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleResetSorting} disabled={!canResetSorting}>
                            <HugeiconsIcon icon={ReloadIcon} size={12} className="mr-1" />
                            {t('datatable.sorting.reset')}
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {sortingState.length === 0 ? (
                            <p className="rounded border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">
                                {t('datatable.sorting.no_rules')}
                            </p>
                        ) : (
                            sortingState.map((sort, index) => {
                                const column = table.getColumn(sort.id) as ColumnWithFilterMeta<TData> | undefined;
                                const label = column ? resolveColumnLabel(column, column.columnDef.meta?.filterTitle) : sort.id;

                                return (
                                    <div
                                        key={sort.id}
                                        className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="h-5 w-5 shrink-0 justify-center rounded-full border-slate-300 text-[10px] font-medium text-slate-600"
                                            >
                                                {index + 1}
                                            </Badge>
                                            <span className="truncate text-xs font-medium text-slate-700">{label}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-500 hover:text-slate-700"
                                                onClick={() => handleSortPriorityMove(sort.id, 'up')}
                                                disabled={index === 0}
                                                aria-label={t('datatable.sorting.increase_priority')}
                                            >
                                                <ChevronUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-500 hover:text-slate-700"
                                                onClick={() => handleSortPriorityMove(sort.id, 'down')}
                                                disabled={index === sortingState.length - 1}
                                                aria-label={t('datatable.sorting.decrease_priority')}
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-500 hover:text-slate-700"
                                                onClick={() => handleToggleSortDirection(sort.id)}
                                                aria-label={t('datatable.sorting.change_direction')}
                                            >
                                                <HugeiconsIcon icon={sort.desc ? SortByDown02Icon : SortByUp02Icon} size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-500 hover:text-rose-600"
                                                onClick={() => handleRemoveSort(sort.id)}
                                                aria-label={t('datatable.sorting.remove')}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={sortSelectValue}
                            onValueChange={(value) => {
                                setSortSelectValue(value);
                                handleAddSortColumn(value);
                            }}
                            disabled={!canAddMoreSorting || availableSortColumns.length === 0}
                        >
                            <SelectTrigger className="h-7 w-full text-xs shadow-none">
                                <SelectValue placeholder={t('datatable.sorting.add_column')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {availableSortColumns.map((option) => (
                                        <SelectItem key={option.id} value={option.id} className="text-xs">
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <span className="text-[11px] text-slate-500">
                            {sortingState.length}/{TABLE_PREFERENCES_MAX_SORTING_COLUMNS}
                        </span>
                    </div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h5 className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <HugeiconsIcon icon={EditTableIcon} size={14} />
                            {t('datatable.visibility.title')}
                        </h5>
                        <span className="text-[11px] text-slate-500">
                            Pin {totalPinnedColumns}/{TABLE_PREFERENCES_MAX_PINNED_COLUMNS}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <Toggle
                            size="sm"
                            variant="outline"
                            className="h-7 cursor-pointer py-1 text-xs capitalize data-[state=on]:bg-white"
                            aria-label={t('datatable.visibility.select_all')}
                            pressed={table.getIsAllColumnsVisible()}
                            onPressedChange={guardToggleAllColumns}
                        >
                            {t('datatable.visibility.select_all')}
                        </Toggle>
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                const pinPosition = column.getIsPinned();
                                const isPinnedLeft = pinPosition === 'left';
                                const isPinnedRight = pinPosition === 'right';
                                const columnLabel = column.columnDef.header?.toString() ?? column.id;
                                const canPin = typeof column.getCanPin === 'function' ? column.getCanPin() : true;

                                return (
                                    <div key={column.id} className="relative inline-flex">
                                        <Toggle
                                            variant={column.getIsVisible() ? 'outline' : undefined}
                                            size="sm"
                                            className="data-[state=on]:border-slate-150 h-7 cursor-pointer bg-white py-1 pr-8 text-xs font-normal text-nowrap capitalize shadow-xs data-[state=on]:bg-white data-[state=on]:shadow-xs"
                                            aria-label={t('datatable.visibility.set_visibility', { label: columnLabel })}
                                            pressed={column.getIsVisible()}
                                            onPressedChange={(value) => handleColumnVisibilityChange(column.id as string, value)}
                                        >
                                            <span className="flex items-center gap-1">
                                                {columnLabel}
                                                {isPinnedLeft && <Pin size={12} className="text-blue-600" />}
                                                {isPinnedRight && <Pin size={12} className="-scale-x-100 text-blue-600" />}
                                            </span>
                                        </Toggle>
                                        {column.getIsVisible() && canPin && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            'absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 rounded-full border border-transparent p-0 transition-colors hover:bg-slate-100',
                                                            pinPosition ? 'text-blue-600' : 'text-slate-400',
                                                        )}
                                                        onClick={(event) => event.stopPropagation()}
                                                        aria-label={t('datatable.pinning.set_pin')}
                                                    >
                                                        <Pin size={12} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    <DropdownMenuLabel>{t('datatable.pinning.pin_column')}</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onSelect={() => handlePinColumn(column.id as string, 'left')}
                                                        disabled={isPinnedLeft || (!pinPosition && pinLimitReached)}
                                                    >
                                                        <Pin className="mr-2 h-3.5 w-3.5" />
                                                        {t('datatable.pinning.pin_left_short')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() => handlePinColumn(column.id as string, 'right')}
                                                        disabled={isPinnedRight || (!pinPosition && pinLimitReached)}
                                                    >
                                                        <Pin className="mr-2 h-3.5 w-3.5 -scale-x-100" />
                                                        {t('datatable.pinning.pin_right_short')}
                                                    </DropdownMenuItem>
                                                    {pinPosition && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onSelect={() => handlePinColumn(column.id as string, 'none')}>
                                                                <PinOff className="mr-2 h-3.5 w-3.5" />
                                                                {t('datatable.pinning.unpin')}
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                    <p className="text-[11px] text-slate-500">
                        {pinLimitReached
                            ? t('datatable.pinning.limit_reached')
                            : t('datatable.pinning.max_columns', { count: TABLE_PREFERENCES_MAX_PINNED_COLUMNS }) + '.'}
                    </p>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h5 className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <HugeiconsIcon icon={FilterVerticalFreeIcons} size={14} />
                            {t('datatable.order.title')}
                        </h5>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={handleResetColumnOrder}
                            disabled={!canResetColumnOrder}
                        >
                            <HugeiconsIcon icon={ReloadIcon} size={12} className="mr-1" />
                            {t('datatable.order.reset')}
                        </Button>
                    </div>
                    <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                        {orderedColumns.length === 0 ? (
                            <p className="rounded border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">
                                {t('datatable.order.no_columns')}
                            </p>
                        ) : (
                            orderedColumns.map((column, index) => {
                                const columnId = column.id as string | undefined;

                                if (!columnId) {
                                    return null;
                                }

                                const label = column.columnDef.header?.toString() ?? columnId;
                                const isVisible = column.getIsVisible();
                                const pinPosition = column.getIsPinned();
                                const isDragging = draggingColumnId === columnId;
                                const isDragOver = dragOverState?.columnId === columnId;
                                const dropPosition = isDragOver ? dragOverState?.position : null;

                                const updateDragOverPosition = (event: React.DragEvent<HTMLDivElement>) => {
                                    event.preventDefault();

                                    const bounds = event.currentTarget.getBoundingClientRect();
                                    const position: 'above' | 'below' = event.clientY <= bounds.top + bounds.height / 2 ? 'above' : 'below';

                                    setDragOverState((prev) => {
                                        if (prev?.columnId === columnId && prev.position === position) {
                                            return prev;
                                        }

                                        return { columnId, position };
                                    });
                                };

                                const handleDropOnColumn = (event: React.DragEvent<HTMLDivElement>) => {
                                    event.preventDefault();
                                    event.stopPropagation();

                                    const sourceId = event.dataTransfer.getData('text/plain') || draggingColumnId;
                                    const position: 'above' | 'below' =
                                        dropPosition ??
                                        (event.clientY <= event.currentTarget.getBoundingClientRect().top + event.currentTarget.offsetHeight / 2
                                            ? 'above'
                                            : 'below');

                                    if (!sourceId) {
                                        return;
                                    }

                                    handleReorderColumns(sourceId, columnId, position);
                                    setDragOverState(null);
                                    setDraggingColumnId(null);
                                    event.dataTransfer.clearData();
                                };

                                const handleDragLeaveColumn = (event: React.DragEvent<HTMLDivElement>) => {
                                    const related = event.relatedTarget as Node | null;

                                    if (related && event.currentTarget.contains(related)) {
                                        return;
                                    }

                                    setDragOverState((prev) => (prev?.columnId === columnId ? null : prev));
                                };

                                return (
                                    <div
                                        key={columnId}
                                        className={cn(
                                            'relative flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 transition-colors',
                                            isDragOver ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white',
                                            isDragging && 'opacity-60',
                                        )}
                                        onDragOver={allowDrag ? updateDragOverPosition : undefined}
                                        onDragEnter={allowDrag ? updateDragOverPosition : undefined}
                                        onDragLeave={allowDrag ? handleDragLeaveColumn : undefined}
                                        onDrop={allowDrag ? handleDropOnColumn : undefined}
                                    >
                                        {isDragOver && dropPosition === 'above' && (
                                            <span className="absolute inset-x-2 -top-[3px] h-0.5 rounded-full bg-blue-500" aria-hidden />
                                        )}
                                        {isDragOver && dropPosition === 'below' && (
                                            <span className="absolute inset-x-2 -bottom-[3px] h-0.5 rounded-full bg-blue-500" aria-hidden />
                                        )}
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div
                                                className="flex h-6 w-6 items-center justify-center text-slate-400"
                                                draggable={allowDrag}
                                                onDragStart={(event) => {
                                                    if (!allowDrag) {
                                                        return;
                                                    }

                                                    setDraggingColumnId(columnId);
                                                    event.dataTransfer.effectAllowed = 'move';
                                                    event.dataTransfer.setData('text/plain', columnId);
                                                }}
                                                onDragEnd={() => {
                                                    setDragOverState(null);
                                                    setDraggingColumnId(null);
                                                }}
                                            >
                                                <GripVertical className="h-4 w-4 cursor-grab text-slate-400 active:cursor-grabbing" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-medium text-slate-700">{label}</p>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                                                    {!isVisible && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-dashed px-1.5 py-0 text-[10px] font-medium text-slate-500"
                                                        >
                                                            {t('datatable.visibility.hidden')}
                                                        </Badge>
                                                    )}
                                                    {pinPosition === 'left' && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] font-medium text-blue-600"
                                                        >
                                                            {t('datatable.pinning.pin_left_short')}
                                                        </Badge>
                                                    )}
                                                    {pinPosition === 'right' && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] font-medium text-blue-600"
                                                        >
                                                            {t('datatable.pinning.pin_right_short')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-500 hover:text-slate-700"
                                                onClick={() => handleMoveColumnOrder(columnId, 'up')}
                                                disabled={index === 0}
                                                aria-label={t('datatable.order.move_up')}
                                            >
                                                <ChevronUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-500 hover:text-slate-700"
                                                onClick={() => handleMoveColumnOrder(columnId, 'down')}
                                                disabled={index === orderedColumns.length - 1}
                                                aria-label={t('datatable.order.move_down')}
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <div className={footerClassName}>
                {formattedLastUpdated ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{t('datatable.preferences.last_saved', { time: formattedLastUpdated })}</span>
                    </div>
                ) : (
                    <div className="text-[11px] text-slate-500">{t('datatable.preferences.never_saved')}</div>
                )}
                <div className={cn('flex items-center gap-2', onSavePreferences ? 'justify-between' : 'justify-end')}>
                    {onSavePreferences && (
                        <Button size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium shadow-sm" onClick={onSavePreferences} disabled={!canSavePreferences}>
                            <Save className="h-3.5 w-3.5" />
                            {t('datatable.preferences.save')}
                        </Button>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium" disabled={!shouldEnableReset}>
                                {t('datatable.preferences.reset')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('datatable.reset_dialog.title')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('datatable.reset_dialog.description')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('datatable.reset_dialog.cancel')}</AlertDialogCancel>
                                <AlertDialogAction className="bg-rose-500 text-white hover:bg-rose-600" onClick={handleResetPreferences}>
                                    {t('datatable.reset_dialog.confirm')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
                <DrawerContent className="flex h-[min(85vh,600px)] max-h-[85vh] flex-col overflow-hidden rounded-t-xl border border-slate-100 bg-white">
                    {preferencesContent}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
            <PopoverContent
                onOpenAutoFocus={(event) => event.preventDefault()}
                className="flex h-[min(80vh,520px)] max-h-[80vh] min-h-0 w-[380px] max-w-[min(90vw,380px)] flex-col overflow-hidden rounded-md border-slate-100 p-0 shadow-md"
                align="end"
            >
                {preferencesContent}
            </PopoverContent>
        </Popover>
    );
}
