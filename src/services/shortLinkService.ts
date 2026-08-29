import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { getPublicShareBaseUrl } from '../utils/shareEncoder';

const LOCAL_SHORT_CACHE_KEY = 'hypertrophy_short_links_cache';

const getLocalCache = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(LOCAL_SHORT_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const saveLocalCache = (cache: Record<string, string>) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(LOCAL_SHORT_CACHE_KEY, JSON.stringify(cache));
    } catch {}
};

/**
 * Generates a deterministic, URL-safe 6-character hash from a payload string.
 */
export const generateShortSlug = (name: string, payload: string): string => {
    const cleanName = (name || 'atleta')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 8);

    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
        hash = (hash << 5) - hash + payload.charCodeAt(i);
        hash |= 0;
    }
    const hex = Math.abs(hash).toString(36).slice(0, 5);
    return cleanName ? `${cleanName}-${hex}` : `s-${hex}`;
};

/**
 * Creates or retrieves a native, zero-interstitial short link stored in Firestore.
 * Generates a ~50-character clean URL on your own domain: https://hypertrophyracker.alexismartyniuk.com.ar/#/s/{slug}
 */
export const createShortReportLink = async (
    name: string,
    encodedPayload: string,
    tab?: string,
    rival?: string
): Promise<string> => {
    if (!encodedPayload) return '';

    const slug = generateShortSlug(name, encodedPayload);
    const baseUrl = getPublicShareBaseUrl();
    const queryParams: string[] = [];
    if (tab) queryParams.push(`tab=${encodeURIComponent(tab)}`);
    if (rival) queryParams.push(`rival=${encodeURIComponent(rival)}`);
    const queryStr = queryParams.length ? `?${queryParams.join('&')}` : '';

    const nativeShortUrl = `${baseUrl}#/s/${slug}${queryStr}`;

    // Cache locally
    const cache = getLocalCache();
    cache[slug] = encodedPayload;
    saveLocalCache(cache);

    // Save to Firestore if available for cross-device access
    if (isFirebaseConfigured) {
        try {
            const reportRef = doc(db, 'shared_reports', slug);
            await setDoc(reportRef, {
                id: slug,
                data: encodedPayload,
                name: name || 'Atleta',
                createdAt: Date.now()
            }, { merge: true });
        } catch (err) {
            console.warn('[shortLinkService] Fallo al guardar en Firestore (usando fallback local):', err);
        }
    }

    return nativeShortUrl;
};

/**
 * Fetches an athlete telemetry payload by its short slug.
 */
export const fetchShortReportPayload = async (slug: string): Promise<string | null> => {
    if (!slug) return null;

    // Check local cache first (0ms)
    const cache = getLocalCache();
    if (cache[slug]) {
        return cache[slug];
    }

    // Check Firestore
    if (isFirebaseConfigured) {
        try {
            const reportRef = doc(db, 'shared_reports', slug);
            const snapshot = await getDoc(reportRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data?.data) {
                    // Update local cache
                    cache[slug] = data.data;
                    saveLocalCache(cache);
                    return data.data as string;
                }
            }
        } catch (err) {
            console.error('[shortLinkService] Error al obtener shared_report de Firestore:', err);
        }
    }

    return null;
};
