import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Bulletproof ScrollToTop utility.
 * Guarantees that mobile browsers (iOS Safari, Chrome Android, Samsung Internet)
 * reset scroll to (0, 0) immediately upon route or tab transition, preventing
 * the viewport from inheriting previous scroll offsets.
 */
export const ScrollToTop = () => {
    const { pathname, search, hash } = useLocation();

    useLayoutEffect(() => {
        const forceScrollTop = () => {
            try {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
            } catch {
                window.scrollTo(0, 0);
            }

            if (document.documentElement) {
                document.documentElement.scrollTop = 0;
                document.documentElement.scrollLeft = 0;
            }

            if (document.body) {
                document.body.scrollTop = 0;
                document.body.scrollLeft = 0;
            }

            const scrollTargets = document.querySelectorAll(
                '.content, .app-container, #root, main, .analysis-view, .measurement-form, .dashboard-view'
            );
            scrollTargets.forEach(el => {
                el.scrollTop = 0;
                el.scrollLeft = 0;
            });
        };

        // 1. Instant execution before paint
        forceScrollTop();

        // 2. Microtask & Animation frame triggers
        const rafId = requestAnimationFrame(forceScrollTop);

        // 3. Staggered triggers to account for Framer Motion exit/enter transitions
        const t1 = setTimeout(forceScrollTop, 50);
        const t2 = setTimeout(forceScrollTop, 150);
        const t3 = setTimeout(forceScrollTop, 300);

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [pathname, search, hash]);

    return null;
};
