import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

interface Props {
    children: ReactNode;
    className?: string;
    title?: string;
    hoverEffect?: boolean;
    style?: CSSProperties;
}

export const HudCard = ({ children, className = '', title, hoverEffect = true, style }: Props) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={hoverEffect ? { scale: 1.01, borderColor: 'var(--primary-color)' } : {}}
            transition={{ duration: 0.4 }}
            className={`card ${hoverEffect ? '' : 'no-hover'} ${className}`}
            style={style}
        >
            {title && <h3 className="mb-4 text-lg font-semibold text-primary">{title}</h3>}
            {children}
        </motion.div>
    );
};
