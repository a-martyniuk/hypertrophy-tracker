import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Universal ScrollToTop hook & component.
 * Ensures that on every route change (especially on mobile devices),
 * the window and all scrollable layout containers reset to top (0, 0) immediately.
 */
export const ScrollToTop = () => {
    const { pathname, search } = useLocation();

    useEffect(() => {
        // 1. Reset standard window and document viewport
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

        // 2. Reset scroll on specific app layout containers
        const containers = document.querySelectorAll('.content, .app-container, #root, main');
        containers.forEach(el => {
            el.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        });
    }, [pathname, search]);

    return null;
};
