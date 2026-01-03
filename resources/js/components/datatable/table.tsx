import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLaravelReactI18n } from 'laravel-react-i18n'

import TableFooter from '@/components/datatable/footer'
import { DatatableBody } from '@/components/datatable/table/datatable-body'
import { DatatableHeader } from '@/components/datatable/table/datatable-header'
import { DatatableMobileCard } from '@/components/datatable/table/datatable-mobile-card'
import type { HeaderDragOverState, HeaderDropPosition } from '@/components/datatable/table/types'
import TableToolbar from '@/components/datatable/toolbar'
import { useTablePreferences } from '@/components/datatable/use-table-preferences'
import { Table } from '@/components/ui/table'
import { useIsMobile } from '@/hooks/use-mobile'
import { TABLE_PREFERENCES_DEFAULT_PER_PAGE, TABLE_PREFERENCES_PER_PAGE_OPTIONS } from '@/lib/constants/datatable'
import { DEFAULT_PREFERENCES } from '@/lib/schemas/table-preferences'
import { cn } from '@/lib/utils'
import { DatatableFilterConfig, DatatableProps } from '@/types/datatable'
import type { FormDataConvertible, RequestPayload } from '@inertiajs/core'
import { router } from '@inertiajs/react'
import type { ColumnFiltersState, ColumnPinningState, SortingState, VisibilityState } from '@tanstack/react-table'
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	RowSelectionState,
	useReactTable,
} from '@tanstack/react-table'
import { toast } from 'sonner'

function appendQueryParam(searchParams: URLSearchParams, key: string, value: unknown): void {
    if (value === undefined || value === null || value === '') {
        return;
    }

    if (value instanceof Date) {
        searchParams.append(key, value.toISOString());
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((item) => appendQueryParam(searchParams, `${key}[]`, item));
        return;
    }

    if (typeof value === 'object') {
        if ((typeof File !== 'undefined' && value instanceof File) || (typeof Blob !== 'undefined' && value instanceof Blob)) {
            return;
        }

        Object.entries(value as Record<string, unknown>).forEach(([nestedKey, nestedValue]) => {
            appendQueryParam(searchParams, `${key}[${nestedKey}]`, nestedValue);
        });
        return;
    }

    searchParams.append(key, String(value));
}

function buildSharePath(path: string | undefined, params: RequestPayload): string | null {
    if (!path) {
        return null;
    }

    const searchParams = new URLSearchParams();
    const entries = Object.entries(params as Record<string, unknown>);

    entries.forEach(([key, value]) => {
        if (key === '_method') {
            return;
        }

        appendQueryParam(searchParams, key, value);
    });

    const queryString = searchParams.toString();
    return queryString ? `${path}?${queryString}` : path;
}

const createPreferenceSnapshot = (state: {
    columnVisibility?: VisibilityState | Record<string, boolean>;
    columnOrder?: string[];
    columnPinning?: ColumnPinningState;
    sorting?: SortingState;
    perPage?: number;
}) =>
    JSON.stringify({
        columnVisibility: state.columnVisibility ?? {},
        columnOrder: state.columnOrder ?? [],
        columnPinning: {
            left: state.columnPinning?.left ?? [],
            right: state.columnPinning?.right ?? [],
        },
        sorting: (state.sorting ?? []).map((sort) => ({
            id: String(sort.id),
            desc: Boolean(sort.desc),
        })),
        perPage: state.perPage ?? TABLE_PREFERENCES_DEFAULT_PER_PAGE,
    });

const DEFAULT_PREFERENCES_SNAPSHOT = createPreferenceSnapshot(DEFAULT_PREFERENCES);

const Datatable = <TData,>({ data, columns, filters, tableId, resourceKey, additionalResourceKeys }: DatatableProps<TData>) => {
    const { t } = useLaravelReactI18n();
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const isMobile = useIsMobile();

    const [loading, setLoading] = useState(false);
    const initialPerPage = data.meta?.per_page ?? TABLE_PREFERENCES_DEFAULT_PER_PAGE;
    const [perPage, setPerPage] = useState(initialPerPage);
    const isFirstRender = useRef(true);
    const lastRequestSignatureRef = useRef<string | null>(null);
    const [{ pageIndex, pageSize }, setPagination] = useState({
        pageIndex: (data.meta?.current_page || 1) - 1,
        pageSize: initialPerPage,
    });

    const availableColumnIds = useMemo(() => {
        const ids = columns
            .map((col) => {
                if (col.id) {
                    return String(col.id);
                }

                if ('accessorKey' in col && typeof col.accessorKey === 'string') {
                    return col.accessorKey;
                }

                return undefined;
            })
            .filter((id): id is string => Boolean(id));

        return Array.from(new Set(ids));
    }, [columns]);

    const preferencesTableId = useMemo(() => {
        if (tableId && tableId.trim().length > 0) {
            return tableId.trim();
        }

        if (data?.meta?.path) {
            return data.meta.path;
        }

        return undefined;
    }, [tableId, data?.meta?.path]);

    const {
        preferences,
        setPreferences,
        resetPreferences: resetSavedPreferences,
        isLoading: preferencesLoading,
        error: preferencesError,
    } = useTablePreferences(preferencesTableId, availableColumnIds);

    const [sorting, setSorting] = useState<SortingState>(preferences?.sorting ?? []);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(preferences?.columnVisibility ?? {});
    const [columnOrder, setColumnOrder] = useState<string[]>(preferences?.columnOrder ?? []);
    const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(preferences?.columnPinning ?? { left: [], right: [] });

    const savedSnapshot = useMemo(
        () =>
            preferences
                ? createPreferenceSnapshot({
                      columnVisibility: preferences.columnVisibility,
                      columnOrder: preferences.columnOrder,
                      columnPinning: preferences.columnPinning,
                      sorting: preferences.sorting,
                      perPage: preferences.perPage,
                  })
                : DEFAULT_PREFERENCES_SNAPSHOT,
        [preferences],
    );

    const currentSnapshot = useMemo(
        () =>
            createPreferenceSnapshot({
                columnVisibility,
                columnOrder,
                columnPinning,
                sorting,
                perPage,
            }),
        [columnVisibility, columnOrder, columnPinning, sorting, perPage],
    );

    const hasSavedPreferences = useMemo(
        () => (preferencesTableId ? savedSnapshot !== DEFAULT_PREFERENCES_SNAPSHOT : false),
        [preferencesTableId, savedSnapshot],
    );

    const isDirty = useMemo(() => savedSnapshot !== currentSnapshot, [savedSnapshot, currentSnapshot]);

    const canSavePreferences = Boolean(preferencesTableId && !preferencesLoading && isDirty);
    const canResetPreferencesValue = Boolean(preferencesTableId && (isDirty || hasSavedPreferences));

    const lastPreferenceErrorRef = useRef<string | null>(null);

    const pagination = useMemo(
        () => ({
            pageIndex,
            pageSize,
        }),
        [pageIndex, pageSize],
    );

    const filterConfigMap = useMemo(() => {
        if (!filters || filters.length === 0) {
            return new Map<string, DatatableFilterConfig<TData>>();
        }

        return new Map(filters.map((definition) => [definition.columnId, definition]));
    }, [filters]);

    const table = useReactTable({
        data: (data.data ?? []) as TData[],
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
        manualGrouping: true,
        enableRowSelection: true,
        filterFns: {},
        getFilteredRowModel: getFilteredRowModel(),
        enableFilters: true,
        enableColumnFilters: true,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnOrderChange: setColumnOrder,
        onColumnPinningChange: setColumnPinning,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        getRowId: (row) => row.id,
        state: {
            globalFilter,
            pagination,
            columnFilters,
            columnVisibility,
            sorting,
            rowSelection,
            columnOrder,
            columnPinning,
        },
    });

    const defaultColumnOrder = useMemo(
        () =>
            table
                .getAllLeafColumns()
                .map((column) => column.id as string)
                .filter(Boolean),
        [table],
    );

    const effectiveColumnOrder = columnOrder.length > 0 ? columnOrder : defaultColumnOrder;

    const [draggingHeaderId, setDraggingHeaderId] = useState<string | null>(null);
    const [headerDragOverState, setHeaderDragOverState] = useState<HeaderDragOverState | null>(null);

    const buildCompleteColumnOrder = useCallback((): string[] => {
        const baseOrder = [...effectiveColumnOrder];

        table.getAllLeafColumns().forEach((column) => {
            const id = column.id as string;

            if (id && !baseOrder.includes(id)) {
                baseOrder.push(id);
            }
        });

        return baseOrder;
    }, [effectiveColumnOrder, table]);

    const moveColumn = useCallback(
        (columnId: string, direction: 'left' | 'right') => {
            const sourceOrder = buildCompleteColumnOrder();
            const currentIndex = sourceOrder.indexOf(columnId);

            if (currentIndex === -1) {
                return;
            }

            const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

            if (targetIndex < 0 || targetIndex >= sourceOrder.length) {
                return;
            }

            const newOrder = [...sourceOrder];
            [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

            table.setColumnOrder(newOrder);
        },
        [buildCompleteColumnOrder, table],
    );

    const handleHeaderReorder = useCallback(
        (sourceColumnId: string, targetColumnId: string, position: HeaderDropPosition) => {
            if (!sourceColumnId || !targetColumnId || sourceColumnId === targetColumnId) {
                return;
            }

            const order = buildCompleteColumnOrder();
            const sourceIndex = order.indexOf(sourceColumnId);
            let targetIndex = order.indexOf(targetColumnId);

            if (sourceIndex === -1 || targetIndex === -1) {
                return;
            }

            order.splice(sourceIndex, 1);

            if (sourceIndex < targetIndex) {
                targetIndex -= 1;
            }

            if (position === 'after') {
                targetIndex += 1;
            }

            targetIndex = Math.max(0, Math.min(targetIndex, order.length));
            order.splice(targetIndex, 0, sourceColumnId);

            table.setColumnOrder(order);
        },
        [buildCompleteColumnOrder, table],
    );

    const handleResetColumn = useCallback(
        (columnId: string) => {
            const column = table.getColumn(columnId);

            if (!column) {
                return;
            }

            column.clearSorting();
            column.pin(false);

            if (!column.getIsVisible()) {
                column.toggleVisibility(true);
            }

            const baseOrder = (columnOrder.length > 0 ? [...columnOrder] : [...defaultColumnOrder]).filter((id) => id !== columnId);
            const defaultIndex = defaultColumnOrder.indexOf(columnId);

            if (defaultIndex >= 0) {
                baseOrder.splice(Math.min(defaultIndex, baseOrder.length), 0, columnId);
            } else {
                baseOrder.push(columnId);
            }

            table.setColumnOrder(baseOrder);
        },
        [columnOrder, defaultColumnOrder, table],
    );

    const handleResetPreferences = useCallback(() => {
        table.resetSorting();
        table.resetColumnVisibility();
        table.resetColumnOrder();
        table.resetColumnPinning();

        setSorting([]);
        setColumnVisibility({});
        setColumnOrder([]);
        setColumnPinning({ left: [], right: [] });
        setPerPage(TABLE_PREFERENCES_DEFAULT_PER_PAGE);
        setPagination({ pageIndex: 0, pageSize: TABLE_PREFERENCES_DEFAULT_PER_PAGE });

        if (preferencesTableId) {
            resetSavedPreferences();
        }
    }, [table, preferencesTableId, resetSavedPreferences]);

    const handleSavePreferences = useCallback(() => {
        if (!preferencesTableId) {
            return;
        }

        setPreferences((prev) => ({
            ...prev,
            columnVisibility: { ...columnVisibility },
            columnOrder: [...columnOrder],
            columnPinning: {
                left: [...(columnPinning.left ?? [])],
                right: [...(columnPinning.right ?? [])],
            },
            sorting: sorting.map((sort) => ({
                id: String(sort.id),
                desc: Boolean(sort.desc),
            })),
            perPage,
        }));

        toast.success(t('datatable.preferences.saved'), {
            duration: 2000,
            position: 'bottom-right',
        });
    }, [preferencesTableId, setPreferences, columnVisibility, columnOrder, columnPinning, sorting, perPage]);

    useEffect(() => {
        if (!preferencesTableId || !preferencesError) {
            lastPreferenceErrorRef.current = null;
            return;
        }

        if (lastPreferenceErrorRef.current === preferencesError.message) {
            return;
        }

        lastPreferenceErrorRef.current = preferencesError.message;

        toast.error(t('datatable.preferences.save_failed'), {
            duration: 4000,
            position: 'bottom-right',
        });
    }, [preferencesTableId, preferencesError]);

    const handleSetPerPage = (value: number) => {
        if (!TABLE_PREFERENCES_PER_PAGE_OPTIONS.includes(value as (typeof TABLE_PREFERENCES_PER_PAGE_OPTIONS)[number])) {
            return;
        }

        setPerPage(value);
        setPagination({
            pageIndex: 0,
            pageSize: value,
        });

        if (preferencesTableId) {
            setPreferences({ perPage: value });
        }
    };

    useEffect(() => {
        if (!preferencesTableId || preferencesLoading) {
            return;
        }

        setColumnVisibility(preferences.columnVisibility ?? {});
        setSorting(preferences.sorting ?? []);
        setColumnOrder(preferences.columnOrder ?? []);
        setColumnPinning(preferences.columnPinning ?? { left: [], right: [] });

        const preferredPerPage = preferences.perPage ?? TABLE_PREFERENCES_DEFAULT_PER_PAGE;
        if (preferredPerPage !== perPage) {
            setPerPage(preferredPerPage);
            setPagination({
                pageIndex: 0,
                pageSize: preferredPerPage,
            });
        }
    }, [preferencesTableId, preferences, preferencesLoading, perPage]);

    const formattedFilters = useMemo(() => {
        if (columnFilters.length === 0) {
            return undefined;
        }

        const resolved = columnFilters.reduce(
            (acc, filter) => {
                if (filter.id && filter.value !== undefined && filter.value !== null && filter.value !== '') {
                    acc[filter.id] = Array.isArray(filter.value) ? filter.value.join(',') : String(filter.value);
                }
                return acc;
            },
            {} as Record<string, string>,
        );

        return Object.keys(resolved).length > 0 ? resolved : undefined;
    }, [columnFilters]);

    const queryFilters = useMemo(() => {
        if (columnFilters.length === 0) {
            return undefined;
        }

        const resolved = columnFilters.reduce(
            (acc, filter) => {
                if (filter.id && filter.value !== undefined && filter.value !== null && filter.value !== '') {
                    const definition = filterConfigMap.get(filter.id);
                    if (definition?.queryKey) {
                        acc[definition.queryKey] = Array.isArray(filter.value) ? filter.value.join(',') : String(filter.value);
                    }
                }
                return acc;
            },
            {} as Record<string, string>,
        );

        return Object.keys(resolved).length > 0 ? resolved : undefined;
    }, [columnFilters, filterConfigMap]);

    const formattedSorting = useMemo(() => {
        if (sorting.length === 0) {
            return undefined;
        }

        const [primarySort] = sorting;

        return {
            orderBy: String(primarySort.id),
            type: primarySort.desc ? 'desc' : 'asc',
        } as const;
    }, [sorting]);

    const params = useMemo<RequestPayload>(() => {
        const nextParams: Record<string, FormDataConvertible> = {
            _method: 'get',
            page: String(pageIndex + 1),
            per_page: String(pageSize),
        };

        if (globalFilter) {
            nextParams.search = globalFilter;
        }

        if (formattedFilters) {
            nextParams.filter = formattedFilters;
        }

        if (queryFilters) {
            Object.entries(queryFilters).forEach(([key, value]) => {
                nextParams[key] = value;
            });
        }

        if (formattedSorting) {
            nextParams.sort = formattedSorting;
        }

        return nextParams;
    }, [formattedFilters, formattedSorting, globalFilter, pageIndex, pageSize, queryFilters]);

    const paramsSignature = useMemo(() => JSON.stringify({ path: data.meta.path, params }), [data.meta.path, params]);

    const sharePath = useMemo(() => buildSharePath(data.meta.path, params), [data.meta.path, params]);

    const partialReloadKeys = useMemo(() => {
        const keys = new Set<string>();

        if (resourceKey) {
            keys.add(resourceKey);
        }

        if (filters && filters.length > 0) {
            keys.add('filters');
        }

        additionalResourceKeys?.forEach((key) => {
            if (key) {
                keys.add(key);
            }
        });

        return keys.size > 0 ? Array.from(keys) : undefined;
    }, [resourceKey, filters, additionalResourceKeys]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            lastRequestSignatureRef.current = paramsSignature;
            return;
        }

        if (paramsSignature === lastRequestSignatureRef.current) {
            return;
        }

        lastRequestSignatureRef.current = paramsSignature;

        router.visit(data.meta.path, {
            method: 'post',
            data: params,
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: partialReloadKeys,
            showProgress: false,
            onStart: () => setLoading(true),
            onFinish: () => {
                setLoading(false);
            },
        });
    }, [data.meta.path, params, paramsSignature, partialReloadKeys]);

    const canDragHeaders = table.getAllLeafColumns().length > 1;

    return (
        <Fragment>
            <div className="flex w-full items-center border-t border-y-slate-100 bg-white px-2 py-2 md:px-4 md:py-2.5">
                <TableToolbar
                    table={table}
                    filters={filters}
                    hasUnsavedChanges={isDirty}
                    onResetPreferences={preferencesTableId ? handleResetPreferences : undefined}
                    onSavePreferences={preferencesTableId ? handleSavePreferences : undefined}
                    canSavePreferences={canSavePreferences}
                    canResetPreferences={canResetPreferencesValue}
                    lastUpdatedAt={preferences?.updatedAt}
                    perPage={perPage}
                    perPageOptions={Array.from(TABLE_PREFERENCES_PER_PAGE_OPTIONS)}
                    onPerPageChange={handleSetPerPage}
                    tableId={preferencesTableId}
                    sharePath={sharePath ?? undefined}
                />
            </div>
            <div className="w-full overflow-hidden border-y border-y-slate-100 shadow-none">
                {isMobile ? (
                    <>
                        <DatatableMobileCard table={table} loading={loading} />
                        <div className="flex items-center border-t bg-slate-50 px-2 py-2">
                            <TableFooter data={data} table={table} perPage={perPage} handleChangePerPage={handleSetPerPage} />
                        </div>
                    </>
                ) : (
                    <>
                        <Table>
                            <DatatableHeader
                                table={table}
                                canDragHeaders={canDragHeaders}
                                draggingHeaderId={draggingHeaderId}
                                setDraggingHeaderId={setDraggingHeaderId}
                                headerDragOverState={headerDragOverState}
                                setHeaderDragOverState={setHeaderDragOverState}
                                effectiveColumnOrder={effectiveColumnOrder}
                                onMoveColumn={moveColumn}
                                onResetColumn={handleResetColumn}
                                onHeaderReorder={handleHeaderReorder}
                            />
                            <DatatableBody table={table} loading={loading} pageSize={perPage} />
                        </Table>
                        <div className="flex items-center border-t bg-slate-100/20 px-4 py-6">
                            <TableFooter data={data} table={table} perPage={perPage} handleChangePerPage={handleSetPerPage} />
                        </div>
                    </>
                )}
            </div>
            {Object.keys(rowSelection).length > 0 && (
                <div
                    className={cn(
                        'floating-bottom fixed bottom-5 left-1/2 z-50 flex h-12 w-[90%] max-w-sm -translate-x-1/2 transform items-center justify-center rounded-lg border border-slate-200 bg-white px-4 shadow-lg transition-transform md:h-10 md:w-auto md:min-w-[200px]',
                        'translate-y-0 opacity-100 duration-150',
                    )}
                >
                    <span className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-none md:px-3 md:py-1">
                        {t('datatable.items_selected', { count: Object.keys(rowSelection).length })}
                    </span>
                </div>
            )}
        </Fragment>
    );
};

export default Datatable;
