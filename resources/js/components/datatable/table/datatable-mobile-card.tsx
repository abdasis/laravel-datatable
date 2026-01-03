import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Row, Table as TableInstance } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { useLaravelReactI18n } from 'laravel-react-i18n'

import NoDataIllustration from '../assets/no-data.svg'

interface DatatableMobileCardProps<TData> {
    table: TableInstance<TData>;
    loading: boolean;
}

export function DatatableMobileCard<TData>({ table, loading }: DatatableMobileCardProps<TData>) {
    const { t } = useLaravelReactI18n();

    if (loading) {
        return (
            <div className="space-y-2.5 px-2.5 py-3.5">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="space-y-2">
                            <div className="h-4 w-3/4 rounded bg-slate-200" />
                            <div className="h-3 w-1/2 rounded bg-slate-100" />
                            <div className="h-3 w-2/3 rounded bg-slate-100" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (table.getRowModel().rows.length === 0) {
        return (
            <div className="px-2.5 py-10 text-center">
                <img src={NoDataIllustration} className="mx-auto h-32" alt={t('datatable.no_data')} />
                <h4 className="mt-4 text-sm font-semibold text-slate-700">{t('datatable.no_data')}</h4>
                <p className="mt-1 text-xs text-slate-500">{t('datatable.no_data_description')}</p>
            </div>
        );
    }

    const renderCardRow = (row: Row<TData>) => {
        const isRowSelected = row.getIsSelected();
        const cells = row.getVisibleCells();

        // Filter cells untuk non-action columns
        const dataCells = cells.filter((cell) => {
            const header = cell.column.columnDef.header;
            return header !== 'Aksi' && header !== '';
        });

        // Filter cells untuk action columns
        const actionCells = cells.filter((cell) => cell.column.columnDef.header === 'Aksi');

        return (
            <div
                key={row.id}
                className={cn(
                    'relative rounded-lg border bg-white p-3 shadow-sm transition-all active:scale-[0.98]',
                    isRowSelected ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-300/50' : 'border-slate-200 hover:border-slate-300',
                )}
            >
                {/* Checkbox di pojok kanan atas */}
                <div className="absolute top-2.5 right-2.5">
                    <Checkbox
                        checked={isRowSelected}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label={t('datatable.mobile.select_row')}
                        className={cn(
                            'h-5 w-5 cursor-pointer transition-colors',
                            'data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white',
                        )}
                    />
                </div>

                {/* Konten card */}
                <div className="space-y-1.5 pr-6">
                    {dataCells.map((cell, cellIndex) => {
                        const column = cell.column;
                        const columnDef = column.columnDef;
                        const label = typeof columnDef.header === 'string' ? columnDef.header : column.id;
                        const content = flexRender(columnDef.cell, cell.getContext());

                        // Item pertama sebagai judul/header utama
                        if (cellIndex === 0) {
                            return (
                                <div key={cell.id} className="pb-1.5">
                                    <div className="line-clamp-2 text-sm font-semibold text-slate-900">{content}</div>
                                </div>
                            );
                        }

                        return (
                            <div key={cell.id} className="flex items-start gap-1.5 text-xs">
                                <span className="min-w-[82px] flex-shrink-0 font-medium text-slate-500">{label}</span>
                                <span className="flex-1 font-normal text-slate-700">{content}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Action buttons di bagian bawah */}
                {actionCells.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
                        {actionCells.map((cell) => (
                            <div key={cell.id} className="flex flex-1 items-center justify-center gap-1.5">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-slate-50/50">
            {/* Header dengan info jumlah data */}
            <div className="border-b border-slate-200 bg-white px-2.5 py-2">
                <p className="text-xs font-medium text-slate-600">{t('datatable.items_displayed', { count: table.getRowModel().rows.length })}</p>
            </div>

            {/* Card list */}
            <div className="space-y-2.5 px-2.5 py-2.5">{table.getRowModel().rows.map(renderCardRow)}</div>
        </div>
    );
}
