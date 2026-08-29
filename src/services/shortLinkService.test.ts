import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateShortSlug, createShortReportLink, fetchShortReportPayload } from './shortLinkService';

vi.mock(import('firebase/firestore'), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        doc: vi.fn(),
        getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
        setDoc: vi.fn().mockResolvedValue(undefined)
    };
});

describe('shortLinkService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('generates clean, URL-safe slug with athlete name', () => {
        const slug = generateShortSlug('Alexis Martyniuk', 'sample-payload-12345');
        expect(slug).toMatch(/^alexisma-[a-z0-9]+$/);
    });

    it('creates and caches short report link locally and returns valid URL', async () => {
        const payload = 'WzIsIkFsZXhpcyBNYXJ0eW5pdWsiLDAsW1tdXV0=';
        const url = await createShortReportLink('Alexis Martyniuk', payload);
        expect(url).toContain('#/s/');
        expect(url).toContain('alexisma-');

        // Fetch back from local cache
        const slug = url.split('#/s/')[1].split('?')[0];
        const retrieved = await fetchShortReportPayload(slug);
        expect(retrieved).toBe(payload);
    });

    it('supports duel query params in short link', async () => {
        const payload = 'WzIsIlR1IiwxLFtbXV1d';
        const url = await createShortReportLink('Tu', payload, 'versus', 'steve_reeves_1950');
        expect(url).toContain('tab=versus');
        expect(url).toContain('rival=steve_reeves_1950');
    });
});
