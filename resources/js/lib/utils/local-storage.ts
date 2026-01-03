import type { TablePreferences } from '@/types/datatable';
import { DEFAULT_PREFERENCES, TABLE_PREFERENCES_SCHEMA_VERSION } from '@/lib/schemas/table-preferences';

export function loadPreferences(key: string): TablePreferences {
    try {
        const data = localStorage.getItem(key);
        if (!data) {
            return {
                ...DEFAULT_PREFERENCES,
                version: TABLE_PREFERENCES_SCHEMA_VERSION,
                updatedAt: new Date().toISOString()
            };
        }

        const parsed = JSON.parse(data);
        return sanitizePreferences(parsed);
    } catch {
        return {
            ...DEFAULT_PREFERENCES,
            version: TABLE_PREFERENCES_SCHEMA_VERSION,
            updatedAt: new Date().toISOString()
        };
    }
}

export function savePreferences(key: string, preferences: TablePreferences): void {
    try {
        localStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
        console.error('Failed to save preferences:', error);
    }
}

export function deletePreferences(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to delete preferences:', error);
    }
}

export function sanitizePreferences(preferences: any, availableColumnIds?: string[]): TablePreferences {
    const sanitized: TablePreferences = {
        columnVisibility: typeof preferences?.columnVisibility === 'object' && preferences.columnVisibility !== null
            ? { ...preferences.columnVisibility }
            : {},
        columnOrder: Array.isArray(preferences?.columnOrder) ? [...preferences.columnOrder] : [],
        columnPinning: {
            left: Array.isArray(preferences?.columnPinning?.left) ? [...preferences.columnPinning.left] : [],
            right: Array.isArray(preferences?.columnPinning?.right) ? [...preferences.columnPinning.right] : [],
        },
        sorting: Array.isArray(preferences?.sorting) ? preferences.sorting.map((s: any) => ({ ...s })) : [],
        perPage: typeof preferences?.perPage === 'number' ? preferences.perPage : 10,
        version: preferences?.version || TABLE_PREFERENCES_SCHEMA_VERSION,
        updatedAt: preferences?.updatedAt || new Date().toISOString(),
    };

    // Filter by available column IDs if provided
    if (availableColumnIds && availableColumnIds.length > 0) {
        const validIds = new Set(availableColumnIds);

        // Filter columnVisibility
        sanitized.columnVisibility = Object.fromEntries(
            Object.entries(sanitized.columnVisibility).filter(([id]) => validIds.has(id))
        );

        // Filter columnOrder
        sanitized.columnOrder = sanitized.columnOrder.filter(id => validIds.has(id));

        // Filter columnPinning
        sanitized.columnPinning.left = sanitized.columnPinning.left.filter(id => validIds.has(id));
        sanitized.columnPinning.right = sanitized.columnPinning.right.filter(id => validIds.has(id));

        // Filter sorting
        sanitized.sorting = sanitized.sorting.filter(sort => validIds.has(sort.id));
    }

    return sanitized;
}

/**
 * Safely get item from localStorage
 */
export function getLocalStorageItem<T>(key: string): T | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        return null;
    }
}

/**
 * Safely set item in localStorage
 */
export function setLocalStorageItem<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
        return false;
    }
}

/**
 * Safely remove item from localStorage
 */
export function removeLocalStorageItem(key: string): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        window.localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error);
        return false;
    }
}
