import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shortenUrl } from './urlShortener';

describe('urlShortener', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('returns empty string if longUrl is empty', async () => {
        const res = await shortenUrl('');
        expect(res).toBe('');
    });

    it('shortens URL successfully with primary provider (TinyURL)', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => 'https://tinyurl.com/xyz123'
        } as any);

        const longUrl = 'https://hypertrophyracker.alexismartyniuk.com.ar/#/share?data=WzIsIkFsZXhpcyBN...';
        const res = await shortenUrl(longUrl);
        expect(res).toBe('https://tinyurl.com/xyz123');
    });

    it('falls back to is.gd if TinyURL fails', async () => {
        global.fetch = vi.fn()
            .mockRejectedValueOnce(new Error('TinyURL timeout'))
            .mockResolvedValueOnce({
                ok: true,
                text: async () => 'https://is.gd/abc456'
            } as any);

        const longUrl = 'https://hypertrophyracker.alexismartyniuk.com.ar/#/share?data=test2';
        const res = await shortenUrl(longUrl);
        expect(res).toBe('https://is.gd/abc456');
    });

    it('gracefully returns original URL if both providers fail', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const longUrl = 'https://hypertrophyracker.alexismartyniuk.com.ar/#/share?data=test3';
        const res = await shortenUrl(longUrl);
        expect(res).toBe(longUrl);
    });
});
