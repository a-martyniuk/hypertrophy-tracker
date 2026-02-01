import { useState, useEffect, RefObject } from 'react';
import type { BodyMeasurements } from '../../types/measurements';

export interface ConnectorLine {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export const useMeasurementLines = (
    containerRef: RefObject<HTMLElement>,
    measurements: BodyMeasurements,
    sex: 'male' | 'female' = 'male'
) => {
    const [lines, setLines] = useState<ConnectorLine[]>([]);

    useEffect(() => {
        let rafId: number;
        const updateLines = () => {
            if (!containerRef.current) return;

            // Feature Flag: Disable arrows on mobile (<1000px) to prevent clutter
            if (window.innerWidth < 1000) {
                setLines([]);
                return;
            }

            const containerRect = containerRef.current.getBoundingClientRect();
            const newLines: ConnectorLine[] = [];

            const connections = [
                { input: 'input-neck', part: 'junction-neck' },
                { input: 'input-back', part: 'junction-back' },
                { input: 'input-pecho', part: 'junction-pecho' },
                { input: 'input-waist', part: 'junction-waist' },
                { input: 'input-hips', part: 'junction-hips' },
                { input: 'input-arm', part: 'junction-arm-left', side: 'left' },
                { input: 'input-arm', part: 'junction-arm-right', side: 'right' },
                { input: 'input-forearm', part: 'junction-forearm-left', side: 'left' },
                { input: 'input-forearm', part: 'junction-forearm-right', side: 'right' },
                { input: 'input-wrist', part: 'junction-wrist-left', side: 'left' },
                { input: 'input-wrist', part: 'junction-wrist-right', side: 'right' },
                { input: 'input-thigh', part: 'junction-thigh-left', side: 'left' },
                { input: 'input-thigh', part: 'junction-thigh-right', side: 'right' },
                { input: 'input-calf', part: 'junction-calf-left', side: 'left' },
                { input: 'input-calf', part: 'junction-calf-right', side: 'right' },
                { input: 'input-ankle', part: 'junction-ankle-left', side: 'left' },
                { input: 'input-ankle', part: 'junction-ankle-right', side: 'right' },
            ];

            connections.forEach(conn => {
                const inputEl = document.getElementById(conn.input);
                const partEl = document.getElementById(conn.part);

                if (inputEl && partEl) {
                    const iRect = inputEl.getBoundingClientRect();
                    const pRect = partEl.getBoundingClientRect();

                    // Anchor on input box (edge closest to silhouette)
                    const isLeft = iRect.left < (containerRect.left + containerRect.width / 2);
                    const x1 = isLeft ? iRect.right - containerRect.left : iRect.left - containerRect.left;
                    const y1 = iRect.top + iRect.height / 2 - containerRect.top;

                    const x2 = pRect.left + pRect.width / 2 - containerRect.left;
                    const y2 = pRect.top + pRect.height / 2 - containerRect.top;

                    newLines.push({
                        id: `${conn.input}-${conn.part}-${conn.side || ''}`,
                        x1, y1, x2, y2
                    });
                }
            });

            setLines(newLines);
        };

        const debouncedUpdate = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateLines);
        };

        const observer = new ResizeObserver(debouncedUpdate);
        if (containerRef.current) {
            observer.observe(containerRef.current);
            // Also observe the SVG specifically if possible
            const svg = document.getElementById('silhouette-svg-root');
            if (svg) observer.observe(svg);
        }

        // Initial triggers
        debouncedUpdate();
        setTimeout(debouncedUpdate, 100);
        setTimeout(debouncedUpdate, 500); // After animations settle

        window.addEventListener('scroll', debouncedUpdate, true);
        window.addEventListener('resize', debouncedUpdate, true);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', debouncedUpdate, true);
            window.removeEventListener('resize', debouncedUpdate, true);
        };
    }, [measurements, sex, containerRef]);

    return lines;
};
