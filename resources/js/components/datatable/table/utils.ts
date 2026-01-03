const ALIGNMENT_CLASS_MAP: Record<string, string> = {
    left: 'text-left',
    start: 'text-left',
    right: 'text-right',
    end: 'text-right',
    center: 'text-center',
    justify: 'text-justify',
};

export function getAlignmentClass(alignment?: string | null): string | undefined {
    if (!alignment) {
        return undefined;
    }

    return ALIGNMENT_CLASS_MAP[alignment] ?? undefined;
}
