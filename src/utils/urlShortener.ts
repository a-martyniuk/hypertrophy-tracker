/**
 * URL Shortening Service for Instagram, WhatsApp, TikTok, and Social Bio Sharing.
 * Converts long Base64 telemetry payloads into short 25-30 character links.
 */

const shortUrlCache = new Map<string, string>();

/**
 * Shortens a given URL using free public shortening APIs with multiple provider fallback.
 * Falls back gracefully to original URL if offline or network fails.
 */
export const shortenUrl = async (longUrl: string): Promise<string> => {
    if (!longUrl) return '';

    // Check memory cache
    if (shortUrlCache.has(longUrl)) {
        return shortUrlCache.get(longUrl)!;
    }

    // Check sessionStorage if available
    if (typeof window !== 'undefined') {
        try {
            const cached = sessionStorage.getItem('short_' + longUrl);
            if (cached) {
                shortUrlCache.set(longUrl, cached);
                return cached;
            }
        } catch {
            // Ignore storage errors
        }
    }

    const encoded = encodeURIComponent(longUrl);

    // Provider 1: TinyURL
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch('https://tinyurl.com/api-create.php?url=' + encoded, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const shortUrl = (await res.text()).trim();
            if (shortUrl && shortUrl.startsWith('http')) {
                shortUrlCache.set(longUrl, shortUrl);
                try {
                    sessionStorage.setItem('short_' + longUrl, shortUrl);
                } catch {}
                return shortUrl;
            }
        }
    } catch (e) {
        console.warn('[urlShortener] TinyURL provider failed, trying is.gd fallback:', e);
    }

    // Provider 2: is.gd fallback
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch('https://is.gd/create.php?format=simple&url=' + encoded, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const shortUrl = (await res.text()).trim();
            if (shortUrl && shortUrl.startsWith('http')) {
                shortUrlCache.set(longUrl, shortUrl);
                try {
                    sessionStorage.setItem('short_' + longUrl, shortUrl);
                } catch {}
                return shortUrl;
            }
        }
    } catch (e) {
        console.warn('[urlShortener] is.gd fallback failed:', e);
    }

    // Fallback to original long URL
    return longUrl;
};
