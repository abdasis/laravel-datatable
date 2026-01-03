import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { FilterHorizontalIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { X } from 'lucide-react'
import { useLaravelReactI18n } from 'laravel-react-i18n'
import type { FilteredColumnName } from './types'

interface AppliedFiltersProps {
    filters: FilteredColumnName[];
    onRemove: (columnId: string) => void;
}

export function AppliedFilters({ filters, onRemove }: AppliedFiltersProps) {
    const { t } = useLaravelReactI18n();

    if (filters.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {filters.map((column) => (
                <Badge
                    key={column.columnId}
                    className="flex h-6 items-center gap-1 rounded-sm border-slate-200 bg-white text-gray-700 shadow-none transition-colors hover:bg-slate-100/20"
                >
                    <HugeiconsIcon icon={FilterHorizontalIcon} size={12} className="text-slate-500" />
                    <Label className="text-xs">{column.columnName}</Label>
                    <Separator orientation="vertical" className="mx-1 bg-slate-200/80" />
                    <Label className="text-xs">{String(column.filterValue)}</Label>
                    <Button
                        onClick={() => onRemove(column.columnId)}
                        variant="ghost"
                        className="ms-1 h-4 px-0 [&_svg]:size-3"
                        aria-label={t('datatable.filter_sheet.remove_filter', { label: column.columnName })}
                    >
                        <X size={10} className="text-slate-500" />
                    </Button>
                </Badge>
            ))}
        </div>
    );
}
