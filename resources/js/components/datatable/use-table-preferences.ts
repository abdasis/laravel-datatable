import { TABLE_PREFERENCES_SCHEMA_VERSION } from '@/lib/constants/datatable'
import { DEFAULT_PREFERENCES } from '@/lib/schemas/table-preferences'
import { deletePreferences, loadPreferences, sanitizePreferences, savePreferences } from '@/lib/utils/local-storage'
import type { TablePreferences } from '@/types/datatable'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Return type for useTablePreferences hook
 */
export interface UseTablePreferencesReturn {
    /**
     * Current table preferences
     */
    preferences: TablePreferences;

    /**
     * Update preferences (supports partial updates)
     * Changes are automatically persisted to localStorage with debouncing
     */
    setPreferences: (updates: Partial<TablePreferences> | ((prev: TablePreferences) => TablePreferences)) => void;

    /**
     * Reset preferences to defaults and clear localStorage
     */
    resetPreferences: () => void;

    /**
     * Whether preferences are currently being loaded from localStorage
     */
    isLoading: boolean;

    /**
     * Error that occurred during load/save operations
     */
    error: Error | null;
}

function clonePreferences(preferences: Partial<TablePreferences>): TablePreferences {
    return {
        columnVisibility: { ...(preferences.columnVisibility || {}) },
        columnOrder: Array.isArray(preferences.columnOrder) ? [...preferences.columnOrder] : [],
        columnPinning: {
            left: Array.isArray(preferences.columnPinning?.left) ? [...preferences.columnPinning.left] : [],
            right: Array.isArray(preferences.columnPinning?.right) ? [...preferences.columnPinning.right] : [],
        },
        sorting: Array.isArray(preferences.sorting) ? preferences.sorting.map((sort) => ({ ...sort })) : [],
        perPage: preferences.perPage || 10,
        version: preferences.version || TABLE_PREFERENCES_SCHEMA_VERSION,
        updatedAt: preferences.updatedAt || new Date().toISOString(),
    };
}
/**
 * Manage persistent table preferences (column visibility, order, pinning, sorting, and per-page size)
 *
 * @param tableId - Unique identifier for the table (used as localStorage key)
 * @param availableColumnIds - Array of valid column IDs for sanitization (optional)
 * @returns Object with preferences state and update functions
 *
 * @example
 * ```tsx
 * const { preferences, setPreferences, resetPreferences } = useTablePreferences(
 *   'products-table',
 *   ['name', 'price', 'category']
 * );
 *
 * // Update column visibility
 * setPreferences({ columnVisibility: { name: false } });
 *
 * // Update with function
 * setPreferences((prev) => ({
 *   ...prev,
 *   sorting: [{ id: 'price', desc: true }],
 * }));
 *
 * // Reset to defaults
 * resetPreferences();
 * ```
 */
export function useTablePreferences(tableId?: string | null, availableColumnIds?: string[]): UseTablePreferencesReturn {
    const resolvedTableId = tableId?.trim() || null;
    const [preferences, setPreferencesState] = useState<TablePreferences>(() => clonePreferences(DEFAULT_PREFERENCES));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const skipNextSaveRef = useRef(false);

    // Load preferences from localStorage on mount
    useEffect(() => {
        if (!resolvedTableId) {
            setPreferencesState(clonePreferences(DEFAULT_PREFERENCES));
            setIsLoading(false);
            setError(null);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            let loaded = loadPreferences(resolvedTableId);

            // Sanitize if column IDs provided
            if (availableColumnIds && availableColumnIds.length > 0) {
                loaded = sanitizePreferences(loaded, availableColumnIds);
            }

            setPreferencesState(clonePreferences(loaded));
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            console.error('[useTablePreferences] Failed to load preferences:', error);

            // Fallback to defaults on error
            setPreferencesState(clonePreferences(DEFAULT_PREFERENCES));
        } finally {
            setIsLoading(false);
        }
    }, [resolvedTableId, availableColumnIds]);

    // Auto-save to localStorage when preferences change
    useEffect(() => {
        if (!resolvedTableId) {
            return;
        }

        // Don't save during initial load
        if (isLoading) {
            return;
        }

        if (skipNextSaveRef.current) {
            skipNextSaveRef.current = false;
            return;
        }

        try {
            setError(null);
            savePreferences(resolvedTableId, preferences);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            console.error('[useTablePreferences] Failed to save preferences:', error);
        }
    }, [preferences, resolvedTableId, isLoading]);

    /**
     * Update preferences with partial updates or updater function
     */
    const setPreferences = useCallback((updates: Partial<TablePreferences> | ((prev: TablePreferences) => TablePreferences)) => {
        setPreferencesState((prev) => {
            // Handle function updater
            if (typeof updates === 'function') {
                const resolved = updates(prev);
                const resolvedPinning = resolved.columnPinning ?? prev.columnPinning;
                const resolvedSorting = resolved.sorting ?? prev.sorting;

                return {
                    columnVisibility: { ...(resolved.columnVisibility ?? prev.columnVisibility) },
                    columnOrder: [...(resolved.columnOrder ?? prev.columnOrder)],
                    columnPinning: {
                        left: [...resolvedPinning.left],
                        right: [...resolvedPinning.right],
                    },
                    sorting: resolvedSorting.map((sort) => ({ ...sort })),
                    version: TABLE_PREFERENCES_SCHEMA_VERSION,
                    updatedAt: new Date().toISOString(),
                    perPage: resolved.perPage ?? prev.perPage,
                };
            }

            // Handle partial object update
            return {
                columnVisibility: { ...(updates.columnVisibility ?? prev.columnVisibility) },
                columnOrder: [...(updates.columnOrder ?? prev.columnOrder)],
                columnPinning: {
                    left: [...(updates.columnPinning ?? prev.columnPinning).left],
                    right: [...(updates.columnPinning ?? prev.columnPinning).right],
                },
                sorting: (updates.sorting ?? prev.sorting).map((sort) => ({ ...sort })),
                version: TABLE_PREFERENCES_SCHEMA_VERSION,
                updatedAt: new Date().toISOString(),
                perPage: updates.perPage ?? prev.perPage,
            };
        });
    }, []);

    /**
     * Reset preferences to defaults and clear localStorage
     */
    const resetPreferences = useCallback(() => {
        try {
            if (resolvedTableId) {
                deletePreferences(resolvedTableId);
            }
            skipNextSaveRef.current = true;
            setPreferencesState({
                ...clonePreferences(DEFAULT_PREFERENCES),
                version: TABLE_PREFERENCES_SCHEMA_VERSION,
                updatedAt: new Date().toISOString(),
            });
            setError(null);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            console.error('[useTablePreferences] Failed to reset preferences:', error);
        }
    }, [resolvedTableId]);

    return {
        preferences,
        setPreferences,
        resetPreferences,
        isLoading,
        error,
    };
}
