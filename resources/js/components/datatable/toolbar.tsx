import moment from 'moment'
import React from 'react'
import { useLaravelReactI18n } from 'laravel-react-i18n'

import { AppliedFilters } from '@/components/datatable/toolbar/applied-filters'
import { TOAST_DURATION } from '@/components/datatable/toolbar/constants'
import { ToolbarFilterSheet } from '@/components/datatable/toolbar/filter-sheet'
import { ToolbarPreferencesPopover } from '@/components/datatable/toolbar/preferences-popover'
import type {
	ColumnWithFilterMeta,
	FilteredColumnName,
	FilterInputType,
	FilterVariant,
	ResolvedFilterDefinition,
	ToolbarColumnFiltersState,
	ToolbarFilterConfig,
} from '@/components/datatable/toolbar/types'
import ReactSelectInput from '@/components/form/react-select-input'
import TextInput from '@/components/form/text-input'
import { Button } from '@/components/ui/button'
import { TABLE_PREFERENCES_MAX_PINNED_COLUMNS, TABLE_PREFERENCES_MAX_SORTING_COLUMNS } from '@/lib/constants/datatable'
import type { Column, Table } from '@tanstack/react-table'
import { Link2, Search, X } from 'lucide-react'
import { toast } from 'sonner'

interface TableToolbarProps<TData> {
    table: Table<TData>;
    filters?: ToolbarFilterConfig<TData>[];
    tableId?: string;
    hasUnsavedChanges?: boolean;
    onResetPreferences?: () => void;
    onSavePreferences?: () => void;
    canSavePreferences?: boolean;
    canResetPreferences?: boolean;
    lastUpdatedAt?: string;
    perPage?: number;
    perPageOptions?: number[];
    onPerPageChange?: (value: number) => void;
    sharePath?: string;
}

export default function TableToolbar<TData>({
    table,
    filters,
    tableId,
    hasUnsavedChanges,
    onResetPreferences,
    onSavePreferences,
    canSavePreferences,
    canResetPreferences,
    lastUpdatedAt,
    perPage,
    perPageOptions,
    onPerPageChange,
    sharePath,
}: TableToolbarProps<TData>) {
    const { t } = useLaravelReactI18n();
    const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false);

    const { columnOrder } = table.getState();

    const handleResetPreferences = () => {
        if (!onResetPreferences) {
            return;
        }

        onResetPreferences();
        toast.info(t('datatable.preferences.reset_to_default'), {
            duration: TOAST_DURATION,
            position: 'bottom-right',
        });
    };

    const normalizeFilterVariant = (variant?: FilterVariant): FilterInputType => {
        switch (variant) {
            case 'select':
            case 'multi_select':
                return 'select';
            case 'date':
                return 'date';
            case 'date_range':
                return 'date_range';
            case 'number':
                return 'number';
            case 'number_range':
                return 'number_range';
            default:
                return 'text';
        }
    };

    const resolveColumnLabel = React.useCallback((column: ColumnWithFilterMeta<TData>, explicitLabel?: string): string => {
        if (explicitLabel) {
            return explicitLabel;
        }

        if (column.columnDef.meta?.filterTitle) {
            return column.columnDef.meta.filterTitle;
        }

        if (typeof column.columnDef.header === 'string') {
            return column.columnDef.header;
        }

        return column.columnDef.header?.toString?.() ?? column.id;
    }, []);

    const buildFilterDefinition = React.useCallback(
        (column: ColumnWithFilterMeta<TData>, config?: ToolbarFilterConfig<TData>): ResolvedFilterDefinition<TData> | null => {
            if (!column.getCanFilter()) {
                return null;
            }

            const type = normalizeFilterVariant((config?.type as FilterVariant | undefined) ?? column.columnDef.meta?.filterVariant);
            const options = config?.options ?? column.columnDef.meta?.filterOptions;

            return {
                column,
                label: resolveColumnLabel(column, config?.label),
                type,
                options,
            };
        },
        [resolveColumnLabel],
    );

    const resolvedFilters = React.useMemo(() => {
        if (filters && filters.length > 0) {
            return filters
                .map((config: ToolbarFilterConfig<TData>) => {
                    const column = table.getColumn(config.columnId) as ColumnWithFilterMeta<TData> | undefined;
                    if (!column) {
                        return null;
                    }
                    return buildFilterDefinition(column, config);
                })
                .filter((definition: ResolvedFilterDefinition<TData> | null): definition is ResolvedFilterDefinition<TData> => Boolean(definition));
        }

        return table
            .getAllLeafColumns()
            .map((column: Column<TData>) => buildFilterDefinition(column as ColumnWithFilterMeta<TData>))
            .filter((definition: ResolvedFilterDefinition<TData> | null): definition is ResolvedFilterDefinition<TData> => Boolean(definition));
    }, [filters, table, buildFilterDefinition]);

    const filterDefinitionMap = React.useMemo(() => {
        return new Map<string, ResolvedFilterDefinition<TData>>(
            resolvedFilters.map((definition: ResolvedFilterDefinition<TData>) => [definition.column.id, definition]),
        );
    }, [resolvedFilters]);

    const filterApplied = table.getState().columnFilters as ToolbarColumnFiltersState;

    const formatFilterValue = (definition: ResolvedFilterDefinition<TData> | undefined, rawValue: unknown): string => {
        if (rawValue === undefined || rawValue === null || rawValue === '') {
            return '';
        }

        const type = definition?.type ?? 'text';

        if (type === 'select') {
            const selectLabel = definition?.options?.find((option) => String(option.value) === String(rawValue))?.label;
            return selectLabel ?? String(rawValue);
        }

        if (type === 'date') {
            return moment(rawValue).isValid() ? moment(rawValue).format('DD MMM YY') : String(rawValue);
        }

        if (type === 'date_range' && Array.isArray(rawValue)) {
            return rawValue
                .filter(Boolean)
                .map((value) => (moment(value).isValid() ? moment(value).format('DD MMM YY') : String(value)))
                .join(' - ');
        }

        if (type === 'number_range' && Array.isArray(rawValue)) {
            return rawValue.filter((value) => value !== undefined && value !== '').join(' - ');
        }

        return String(rawValue);
    };

    const filteredColumnNames: FilteredColumnName[] = filterApplied.map((filter) => {
        const column = table.getColumn(filter.id) as ColumnWithFilterMeta<TData> | undefined;
        const definition = column ? filterDefinitionMap.get(column.id) : undefined;

        return {
            columnName: column ? resolveColumnLabel(column, definition?.label) : filter.id,
            columnId: column?.id ?? filter.id,
            filterValue: formatFilterValue(definition, filter.value),
            filterVariant: definition?.type ?? 'text',
        };
    });

    const [sortSelectValue, setSortSelectValue] = React.useState<string | undefined>(undefined);

    const sortingState = table.getState().sorting;
    const columnPinningState = table.getState().columnPinning;

    const defaultColumnOrder = React.useMemo(
        () =>
            table
                .getAllLeafColumns()
                .map((column: Column<TData>) => column.id as string)
                .filter((id: string): id is string => Boolean(id)),
        [table],
    );

    const effectiveColumnOrder = columnOrder.length > 0 ? columnOrder : defaultColumnOrder;

    type DropPosition = 'above' | 'below';

    const [draggingColumnId, setDraggingColumnId] = React.useState<string | null>(null);
    const [dragOverState, setDragOverState] = React.useState<{ columnId: string; position: DropPosition } | null>(null);

    const buildCompleteColumnOrder = React.useCallback((): string[] => {
        const baseOrder = [...effectiveColumnOrder];

        table.getAllLeafColumns().forEach((column: Column<TData>) => {
            const id = column.id as string;

            if (id && !baseOrder.includes(id)) {
                baseOrder.push(id);
            }
        });

        return baseOrder;
    }, [effectiveColumnOrder, table]);

    const handleReorderColumns = React.useCallback(
        (sourceColumnId: string, targetColumnId: string, position: DropPosition) => {
            if (!sourceColumnId || !targetColumnId || sourceColumnId === targetColumnId) {
                return;
            }

            const completeOrder = buildCompleteColumnOrder();
            const sourceIndex = completeOrder.indexOf(sourceColumnId);
            let targetIndex = completeOrder.indexOf(targetColumnId);

            if (sourceIndex === -1 || targetIndex === -1) {
                return;
            }

            completeOrder.splice(sourceIndex, 1);

            if (sourceIndex < targetIndex) {
                targetIndex -= 1;
            }

            if (position === 'below') {
                targetIndex += 1;
            }

            targetIndex = Math.max(0, Math.min(targetIndex, completeOrder.length));

            completeOrder.splice(targetIndex, 0, sourceColumnId);

            table.setColumnOrder(completeOrder);
        },
        [buildCompleteColumnOrder, table],
    );

    const orderedColumns = React.useMemo(() => {
        const resolved: ColumnWithFilterMeta<TData>[] = [];
        const seen = new Set<string>();

        effectiveColumnOrder.forEach((columnId: string) => {
            const column = table.getColumn(columnId) as ColumnWithFilterMeta<TData> | undefined;
            if (column) {
                resolved.push(column);
                seen.add(columnId);
            }
        });

        table.getAllLeafColumns().forEach((column: Column<TData>) => {
            const columnId = column.id as string;
            if (columnId && !seen.has(columnId)) {
                resolved.push(column as ColumnWithFilterMeta<TData>);
            }
        });

        return resolved;
    }, [effectiveColumnOrder, table]);

    const availableSortColumns = React.useMemo(
        () =>
            table
                .getAllLeafColumns()
                .filter(
                    (column: Column<TData>) =>
                        column.getCanSort() && !sortingState.some((sort: (typeof sortingState)[number]) => sort.id === column.id),
                )
                .map((column: Column<TData>) => ({
                    id: column.id as string,
                    label: column.columnDef.header?.toString() ?? (column.id as string),
                }))
                .filter((option: { id: string; label: string }) => Boolean(option.id)),
        [table, sortingState],
    );

    const totalPinnedColumns = (columnPinningState.left?.length ?? 0) + (columnPinningState.right?.length ?? 0);
    const pinLimitReached = totalPinnedColumns >= TABLE_PREFERENCES_MAX_PINNED_COLUMNS;
    const canResetSorting = sortingState.length > 0;
    const canResetColumnOrder = columnOrder.length > 0;
    const canAddMoreSorting = sortingState.length < TABLE_PREFERENCES_MAX_SORTING_COLUMNS;

    const formattedLastUpdated = React.useMemo(() => {
        if (!lastUpdatedAt) {
            return null;
        }

        const parsed = moment(lastUpdatedAt);

        if (!parsed.isValid()) {
            return null;
        }

        return parsed.fromNow();
    }, [lastUpdatedAt]);

    const handlePinColumn = (columnId: string, position: 'left' | 'right' | 'none') => {
        const column = table.getColumn(columnId);

        if (!column) {
            return;
        }

        if (position === 'none') {
            column.pin(false);
            return;
        }

        const currentPinning = table.getState().columnPinning;
        const isCurrentlyPinned = column.getIsPinned() !== false;
        const pinnedCount = (currentPinning.left?.length ?? 0) + (currentPinning.right?.length ?? 0) - (isCurrentlyPinned ? 1 : 0);

        if (!isCurrentlyPinned && pinnedCount >= TABLE_PREFERENCES_MAX_PINNED_COLUMNS) {
            toast.warning(t('datatable.pinning.max_columns', { count: TABLE_PREFERENCES_MAX_PINNED_COLUMNS }), {
                duration: TOAST_DURATION,
                position: 'bottom-right',
            });
            return;
        }

        column.pin(position);
    };

    const handleMoveColumnOrder = (columnId: string, direction: 'up' | 'down') => {
        const baseOrder = [...effectiveColumnOrder];

        table.getAllLeafColumns().forEach((column: Column<TData>) => {
            const id = column.id as string;
            if (id && !baseOrder.includes(id)) {
                baseOrder.push(id);
            }
        });

        const currentIndex = baseOrder.indexOf(columnId);

        if (currentIndex === -1) {
            return;
        }

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= baseOrder.length) {
            return;
        }

        [baseOrder[currentIndex], baseOrder[targetIndex]] = [baseOrder[targetIndex], baseOrder[currentIndex]];

        table.setColumnOrder(baseOrder);
    };

    const handleToggleSortDirection = (columnId: string) => {
        const updatedSorting = sortingState.map((sort: (typeof sortingState)[number]) =>
            sort.id === columnId
                ? {
                      ...sort,
                      desc: !sort.desc,
                  }
                : sort,
        );

        table.setSorting(updatedSorting);
    };

    const handleRemoveSort = (columnId: string) => {
        const updatedSorting = sortingState.filter((sort: (typeof sortingState)[number]) => sort.id !== columnId);
        table.setSorting(updatedSorting);
    };

    const handleSortPriorityMove = (columnId: string, direction: 'up' | 'down') => {
        const currentIndex = sortingState.findIndex((sort: (typeof sortingState)[number]) => sort.id === columnId);

        if (currentIndex === -1) {
            return;
        }

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= sortingState.length) {
            return;
        }

        const updatedSorting = [...sortingState];
        const [movedSort] = updatedSorting.splice(currentIndex, 1);
        updatedSorting.splice(targetIndex, 0, movedSort);

        table.setSorting(updatedSorting);
    };

    const handleAddSortColumn = (columnId: string) => {
        if (!columnId) {
            return;
        }

        const targetColumn = table.getColumn(columnId);

        if (!targetColumn) {
            toast.warning(t('datatable.sorting.column_not_found'), {
                duration: TOAST_DURATION,
                position: 'bottom-right',
            });
            return;
        }

        if (sortingState.some((sort: (typeof sortingState)[number]) => sort.id === columnId)) {
            toast.info(t('datatable.sorting.column_exists'), {
                duration: TOAST_DURATION,
                position: 'bottom-right',
            });
            return;
        }

        if (sortingState.length >= TABLE_PREFERENCES_MAX_SORTING_COLUMNS) {
            toast.warning(t('datatable.sorting.max_columns', { count: TABLE_PREFERENCES_MAX_SORTING_COLUMNS }), {
                duration: TOAST_DURATION,
                position: 'bottom-right',
            });
            return;
        }

        table.setSorting([...sortingState, { id: columnId, desc: false }]);
        setSortSelectValue(undefined);
    };

    const handleResetSorting = () => {
        table.resetSorting();
    };

    const handleResetColumnOrder = () => {
        table.resetColumnOrder();
    };

    const renderFilterField = (definition: ResolvedFilterDefinition<TData>) => {
        const { column, type, options } = definition;
        const columnFilterValue = column.getFilterValue();

        switch (type) {
            case 'select': {
                const selectOptions = (options ?? []).map((option) => ({
                    value: String(option.value),
                    label: option.label,
                }));

                return (
                    <ReactSelectInput
                        options={selectOptions}
                        value={columnFilterValue ? String(columnFilterValue) : null}
                        onChange={(value) => {
                            if (Array.isArray(value)) {
                                column.setFilterValue(value);
                            } else {
                                column.setFilterValue(value || undefined);
                            }
                        }}
                        isClearable
                        placeholder={t('datatable.filter_sheet.select_placeholder', { label: definition.label })}
                    />
                );
            }
            case 'date':
                return (
                    <TextInput
                        type={'date'}
                        name={'date'}
                        value={(columnFilterValue as string) ?? ''}
                        onChange={(value) => column.setFilterValue(value || undefined)}
                        enableDebounce={false}
                        className={'shadow-none'}
                    />
                );
            case 'date_range': {
                const [start, end] = Array.isArray(columnFilterValue) ? columnFilterValue : ['', ''];
                return (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <TextInput
                            type={'date'}
                            name={'start_date'}
                            value={start ?? ''}
                            onChange={(value) => column.setFilterValue([value, end ?? ''])}
                            enableDebounce={false}
                            className={'shadow-none'}
                        />
                        <TextInput
                            type={'date'}
                            name={'end_date'}
                            value={end ?? ''}
                            onChange={(value) => column.setFilterValue([start ?? '', value])}
                            enableDebounce={false}
                            className={'shadow-none'}
                        />
                    </div>
                );
            }
            case 'number_range': {
                const [min, max] = Array.isArray(columnFilterValue) ? columnFilterValue : ['', ''];
                return (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <DebouncedInput
                            type="number"
                            value={min ?? ''}
                            onChange={(value) => column.setFilterValue([value, max ?? ''])}
                            className="shadow-none"
                        />
                        <DebouncedInput
                            type="number"
                            value={max ?? ''}
                            onChange={(value) => column.setFilterValue([min ?? '', value])}
                            className="shadow-none"
                        />
                    </div>
                );
            }
            case 'number':
                return (
                    <DebouncedInput
                        type="number"
                        value={(columnFilterValue ?? '') as string | number}
                        onChange={(value) => {
                            if (value === '') {
                                column.setFilterValue(undefined);
                            } else {
                                column.setFilterValue(Number(value));
                            }
                        }}
                        className="shadow-none"
                    />
                );
            default:
                return (
                    <DebouncedInput
                        value={(columnFilterValue ?? '') as string | number}
                        onChange={(value) => column.setFilterValue(value || undefined)}
                        placeholder={t('datatable.filter_sheet.text_placeholder', { label: definition.label })}
                        className="shadow-none"
                    />
                );
        }
    };

    const toggleAllColumnsVisibility = table.getToggleAllColumnsVisibilityHandler();
    const shouldEnableReset = Boolean(tableId && onResetPreferences && (canResetPreferences ?? false));
    const handleCopyShareLink = React.useCallback(async () => {
        if (!sharePath) {
            toast.info(t('datatable.toolbar.no_link_to_copy'), {
                duration: TOAST_DURATION,
                position: 'bottom-right',
            });
            return;
        }

        const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
        const finalUrl = origin ? `${origin}${sharePath}` : sharePath;

        const fallbackCopy = (text: string) => {
            if (typeof document === 'undefined') {
                throw new Error(t('datatable.toolbar.clipboard_unavailable'));
            }

            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', 'true');
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.opacity = '0';

            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (!successful) {
                throw new Error(t('datatable.toolbar.copy_fallback_failed'));
            }
        };

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(finalUrl);
            } else {
                fallbackCopy(finalUrl);
            }

            toast.success(t('datatable.toolbar.copy_link_success'), {
                duration: TOAST_DURATION,
                position: 'bottom-right',
            });
        } catch (error) {
            console.error('[TableToolbar] Failed to copy filter link', error);
            toast.error(t('datatable.toolbar.copy_link_failed'), {
                duration: TOAST_DURATION,
                position: 'bottom-right',
            });
        }
    }, [sharePath, t]);

    return (
        <div className="flex w-full flex-col gap-2 px-0 md:flex-row md:items-start md:justify-between">
            <div className="flex w-full flex-col gap-1.5 md:max-w-md md:flex-1">
                <div className="relative w-full md:w-64">
                    <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
                    <DebouncedInput
                        value={table.getState().globalFilter ?? ''}
                        onChange={(value) => table.setGlobalFilter(String(value))}
                        className="h-8 w-full rounded-md border border-input/50 bg-background pr-8 pl-8 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder={t('datatable.search')}
                    />
                    {table.getState().globalFilter && (
                        <Button
                            onClick={() => table.setGlobalFilter('')}
                            variant="ghost"
                            size="icon"
                            className="absolute top-1/2 right-1 h-5 w-5 -translate-y-1/2 rounded-sm p-0 hover:bg-accent"
                            aria-label={t('datatable.clear_search')}
                            title={t('datatable.clear_search')}
                        >
                            <X size={12} className="text-muted-foreground" />
                        </Button>
                    )}
                </div>
                {filteredColumnNames.length > 0 && (
                    <AppliedFilters
                        filters={filteredColumnNames}
                        onRemove={(columnId) => {
                            const updatedFilters = filterApplied.filter((filter) => filter.id !== columnId);
                            table.setColumnFilters(updatedFilters);
                        }}
                    />
                )}
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-1.5 md:w-auto">
                <ToolbarFilterSheet
                    open={isFilterSheetOpen}
                    onOpenChange={setIsFilterSheetOpen}
                    filterCount={filterApplied.length}
                    resolvedFilters={resolvedFilters}
                    renderFilterField={renderFilterField}
                    onResetFilters={() => table.resetColumnFilters()}
                    table={table}
                />

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyShareLink}
                    disabled={!sharePath}
                    className="hidden h-8 gap-1.5 px-2.5 sm:flex"
                    aria-label={t('datatable.toolbar.copy')}
                    title={t('datatable.toolbar.copy')}
                >
                    <Link2 size={13} />
                    <span className="hidden text-xs lg:inline">{t('datatable.toolbar.copy')}</span>
                </Button>

                <ToolbarPreferencesPopover
                    hasUnsavedChanges={hasUnsavedChanges}
                    perPage={perPage}
                    perPageOptions={perPageOptions}
                    onPerPageChange={onPerPageChange}
                    sortingState={sortingState}
                    table={table}
                    resolveColumnLabel={resolveColumnLabel}
                    handleSortPriorityMove={handleSortPriorityMove}
                    handleToggleSortDirection={handleToggleSortDirection}
                    handleRemoveSort={handleRemoveSort}
                    handleResetSorting={handleResetSorting}
                    canResetSorting={canResetSorting}
                    sortSelectValue={sortSelectValue}
                    setSortSelectValue={setSortSelectValue}
                    handleAddSortColumn={handleAddSortColumn}
                    canAddMoreSorting={canAddMoreSorting}
                    availableSortColumns={availableSortColumns}
                    totalPinnedColumns={totalPinnedColumns}
                    pinLimitReached={pinLimitReached}
                    handlePinColumn={handlePinColumn}
                    toggleAllColumnsVisibility={toggleAllColumnsVisibility}
                    orderedColumns={orderedColumns}
                    handleMoveColumnOrder={handleMoveColumnOrder}
                    handleResetColumnOrder={handleResetColumnOrder}
                    canResetColumnOrder={canResetColumnOrder}
                    draggingColumnId={draggingColumnId}
                    setDraggingColumnId={setDraggingColumnId}
                    dragOverState={dragOverState}
                    setDragOverState={setDragOverState}
                    handleReorderColumns={handleReorderColumns}
                    onSavePreferences={onSavePreferences}
                    canSavePreferences={canSavePreferences}
                    handleResetPreferences={handleResetPreferences}
                    shouldEnableReset={shouldEnableReset}
                    formattedLastUpdated={formattedLastUpdated}
                />
            </div>
        </div>
    );
}

function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: {
    value: string | number;
    onChange: (value: string | number) => void;
    debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
    const [value, setValue] = React.useState(initialValue);
    const isFirstRender = React.useRef(true);
    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    React.useEffect(() => {
        if (!isFirstRender.current) {
            const timeout = setTimeout(() => onChange(value), debounce);
            return () => clearTimeout(timeout);
        }
        isFirstRender.current = false;
    }, [value, debounce, onChange]);
    return <TextInput className={'border shadow-none'} {...props} name={props.name || 'debounced-input'} value={value as string} onChange={(value) => setValue(value)} />;
}
