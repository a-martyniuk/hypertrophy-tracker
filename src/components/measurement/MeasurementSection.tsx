import React, { ReactNode } from 'react';

interface MeasurementSectionProps {
    title: string;
    children: ReactNode;
    className?: string;
}

export const MeasurementSection = ({ title, children, className = '' }: MeasurementSectionProps) => {
    return (
        <section className={`form-section ${className}`}>
            <h3>{title}</h3>
            <div className="hud-column">
                {children}
            </div>
        </section>
    );
};
