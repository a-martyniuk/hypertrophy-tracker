/**
 * Timezone-safe date formatting utility.
 * Prevents UTC-midnight date strings ('YYYY-MM-DD') from decrementing by 1 day
 * when displayed in Western Hemisphere timezones (e.g. UTC-3, UTC-5).
 */
export const formatDateSafe = (
    dateStr?: string,
    options?: Intl.DateTimeFormatOptions,
    locale: string = 'es-ES'
): string => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
        return new Date(dateStr).toLocaleDateString(locale, options);
    }
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(locale, options);
    }
    return new Date(dateStr).toLocaleDateString(locale, options);
};
