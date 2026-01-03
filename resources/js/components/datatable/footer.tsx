import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TABLE_PREFERENCES_PER_PAGE_OPTIONS } from '@/lib/constants/datatable'
import { cn } from '@/lib/utils'
import { PaginatedData } from '@/types/datatable'
import {
	ArrowLeft01FreeIcons,
	ArrowLeftDoubleIcon,
	ArrowRight01Icon,
	ArrowRightDoubleFreeIcons,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Table } from '@tanstack/react-table'
import { Fragment } from 'react'
import { useLaravelReactI18n } from 'laravel-react-i18n'

interface TableFooterProps<TData> {
    table: Table<TData>;
    data: PaginatedData<TData>;
    perPage: number;
    handleChangePerPage: (value: number) => void;
}

export default function TableFooter<TData>({ table, data, perPage, handleChangePerPage }: TableFooterProps<TData>) {
    const { t } = useLaravelReactI18n();

    return (
        <>
            {data.meta && (
                <Fragment>
                    <div className="flex w-full flex-col items-center justify-between gap-2.5 md:flex-row md:gap-2">
                        <div className="left-section flex w-full items-center justify-center gap-1.5 md:w-auto md:flex-1 md:justify-start md:gap-2">
                            <button
                                className={cn(
                                    'border-light-subtle cursor-pointer rounded border bg-white p-1.5 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:p-2',
                                    data.meta.current_page == 1 && 'bg-gray-100',
                                )}
                                onClick={() => table.setPageIndex(0)}
                                disabled={data.meta.current_page == 1}
                                aria-label="First page"
                            >
                                {<HugeiconsIcon icon={ArrowLeftDoubleIcon} size={16} />}
                            </button>
                            <button
                                className={cn(
                                    'border-light-subtle cursor-pointer rounded border bg-white p-1.5 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:p-2',
                                    data.meta.current_page == 1 && 'bg-gray-100',
                                )}
                                onClick={() => table.setPageIndex(Math.max(0, data.meta.current_page - 2))}
                                disabled={data.meta.current_page === 1}
                                aria-label="Previous page"
                            >
                                <HugeiconsIcon icon={ArrowLeft01FreeIcons} size={16} />
                            </button>

                            {/* Mobile: Show current/total pages */}
                            <div className="flex items-center gap-1 text-sm font-medium text-slate-800 md:hidden">
                                <span className="font-semibold">{data.meta.current_page}</span>
                                <span>/</span>
                                <span className="font-semibold">{data.meta.last_page}</span>
                            </div>

                            <button
                                className={cn(
                                    'border-light-subtle cursor-pointer rounded border bg-white p-1.5 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:p-2',
                                    data.meta.current_page === data.meta.last_page && 'bg-gray-100',
                                )}
                                onClick={() => table.setPageIndex(Math.min(data.meta.last_page - 1, data.meta.current_page))}
                                disabled={data.meta.current_page === data.meta.last_page}
                                aria-label="Next page"
                            >
                                {<HugeiconsIcon icon={ArrowRight01Icon} size={16} />}
                            </button>
                            <button
                                className={cn(
                                    'border-light-subtle cursor-pointer rounded border bg-white p-1.5 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:p-2',
                                    data.meta.current_page === data.meta.last_page && 'bg-gray-100',
                                )}
                                onClick={() => table.setPageIndex(Math.max(0, data.meta.last_page - 1))}
                                disabled={data.meta.current_page === data.meta.last_page}
                                aria-label="Last page"
                            >
                                <HugeiconsIcon icon={ArrowRightDoubleFreeIcons} size={16} />
                            </button>

                            {/* Desktop: Show verbose page info */}
                            <div className="hidden items-center gap-1 text-sm font-medium text-slate-800 md:flex">
                                <span className={'text-sm font-semibold'}>{data.meta.current_page}</span>
                                {t('datatable.pagination.of')}
                                <span className={'text-sm font-semibold'}>{data.meta.last_page}</span>
                                {t('datatable.pagination.page')}
                            </div>
                            <div className="hidden items-center gap-1 text-sm font-medium text-slate-800 md:inline-flex">
                                <span>| {t('datatable.pagination.go_to_page')}</span>
                                <div>
                                    <Input
                                        min={1}
                                        max={data.meta.last_page}
                                        type="text"
                                        defaultValue={table.getState().pagination.pageIndex + 1}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            if (!Number.isNaN(value)) {
                                                const clamped = Math.min(Math.max(1, value), data.meta.last_page);
                                                table.setPageIndex(clamped - 1);
                                            }
                                        }}
                                        className="h-7 w-14 text-center focus-visible:ring-0"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="right-section flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
                            {/* Desktop: Show detailed info */}
                            <div className="hidden items-center gap-2 md:flex">
                                <div className="page-info flex gap-1 text-sm text-slate-700 shadow-none">
                                    {t('datatable.pagination.showing')} <strong>{data.meta.from ?? 0}</strong> {t('datatable.pagination.from')} <strong>{data.meta.to ?? 0}</strong> {t('datatable.pagination.data')}
                                </div>
                                <div>
                                    <Select value={String(perPage)} onValueChange={(value) => handleChangePerPage(Number(value))}>
                                        <SelectTrigger className={'h-7 w-full focus-visible:ring-0'}>
                                            <SelectValue placeholder={t('datatable.pagination.set_per_page')}></SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TABLE_PREFERENCES_PER_PAGE_OPTIONS.map((pageSize) => (
                                                <SelectItem value={String(pageSize)} key={pageSize}>
                                                    {t('datatable.pagination.rows_per_page', { count: pageSize })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Mobile: Show compact info with per-page selector */}
                            <div className="flex w-full items-center justify-between gap-1.5 text-sm text-slate-700 md:hidden">
                                <span>{t('datatable.pagination.total_data', { count: data.meta.total ?? 0 })}</span>
                                <Select value={String(perPage)} onValueChange={(value) => handleChangePerPage(Number(value))}>
                                    <SelectTrigger className={'h-7 w-24 text-xs focus-visible:ring-0'}>
                                        <SelectValue placeholder={t('datatable.pagination.rows')}></SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TABLE_PREFERENCES_PER_PAGE_OPTIONS.map((pageSize) => (
                                            <SelectItem value={String(pageSize)} key={pageSize}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </Fragment>
            )}
        </>
    );
}
