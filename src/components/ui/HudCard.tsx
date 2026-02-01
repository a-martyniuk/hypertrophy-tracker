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
        <div
            className={`card ${hoverEffect ? '' : 'no-hover'} ${className}`}
            style={style}
        >
            {title && <h3 className="mb-4 text-lg font-semibold text-primary">{title}</h3>}
            {children}
        </div>
    );
};
