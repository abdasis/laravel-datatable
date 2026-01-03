import React from 'react'
import { useLaravelReactI18n } from 'laravel-react-i18n'

import type { ResolvedFilterDefinition } from '@/components/datatable/toolbar/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { ReloadIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ColumnFiltersState, Table } from '@tanstack/react-table'
import { Filter, X } from 'lucide-react'

interface ToolbarFilterSheetProps<TData> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filterCount: number;
    resolvedFilters: ResolvedFilterDefinition<TData>[];
    renderFilterField: (definition: ResolvedFilterDefinition<TData>) => React.ReactNode;
    onResetFilters: () => void;
    table: Table<TData>;
}

export function ToolbarFilterSheet<TData>({
    open,
    onOpenChange,
    filterCount,
    resolvedFilters,
    renderFilterField,
    onResetFilters,
    table,
}: ToolbarFilterSheetProps<TData>) {
    const { t } = useLaravelReactI18n();
    const columnFilters = table.getState().columnFilters as ColumnFiltersState;

    if (resolvedFilters.length === 0) {
        return null;
    }

    return (
        <Sheet open={open} modal={false} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 border-slate-200/80 px-3 text-sm">
                    <Filter size={14} />
                    <span>{t('datatable.toolbar.filter')}</span>
                    {filterCount > 0 && <span className="rounded-full bg-blue-500/10 px-1.5 text-xs font-medium text-blue-600">{filterCount}</span>}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex px-0 rounded-xl w-full border-gray-100 flex-col bg-white sm:max-w-md !inset-y-2 !right-2 !h-[calc(100vh-1rem)]">
                <SheetHeader className="border-b pb-6 px-6 border-slate-100">
                    <SheetTitle>{t('datatable.filter_sheet.title')}</SheetTitle>
                    <SheetDescription>{t('datatable.filter_sheet.description')}</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-4">
                    <div className="flex flex-col gap-4">
                        {resolvedFilters.map((definition) => {
                            const columnFiltersState = columnFilters.some((filter) => filter.id === definition.column.id);

                            return (
                                <div key={definition.column.id} className="space-y-2 rounded-md border border-slate-100 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label className="text-sm font-medium text-slate-700">{definition.label}</Label>
                                        {columnFiltersState && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-slate-600"
                                                onClick={() => definition.column.setFilterValue(undefined)}
                                                aria-label={t('datatable.filter_sheet.remove_filter', { label: definition.label })}
                                            >
                                                <X size={14} />
                                            </Button>
                                        )}
                                    </div>
                                    {renderFilterField(definition)}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <SheetFooter className="border-t border-slate-100 pt-4 px-4 ">
                    <div className="flex w-full items-center justify-between gap-2">
                        <Button variant="outline" size="sm" className="h-8" onClick={onResetFilters} disabled={filterCount === 0}>
                            <HugeiconsIcon icon={ReloadIcon} size={12} className="mr-1" />
                            {t('datatable.filter_sheet.reset')}
                        </Button>
                        <SheetClose asChild>
                            <Button size="sm" className="h-8 px-4">
                                {t('datatable.filter_sheet.done')}
                            </Button>
                        </SheetClose>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
