import { HelpCircle } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { Skeleton } from '../ui/Skeleton';
import type { ReactNode } from 'react';

interface StatCardProps {
    label: string;
    value: string | number | ReactNode;
    subtitle?: string | ReactNode;
    tooltipContent?: ReactNode;
    loading?: boolean;
    className?: string;
}

export const StatCard = ({ label, value, subtitle, tooltipContent, loading, className = '' }: StatCardProps) => {
    return (
        <div className={`stat-card glass ${className}`}>
            <style>{`
                .stat-card {
                    padding: 1.5rem;
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    position: relative;
                    z-index: 1;
                    transition: transform 0.2s ease, z-index 0s;
                }
                .stat-card:hover {
                    z-index: 20;
                     background: rgba(255, 255, 255, 0.03);
                    transform: translateY(-2px);
                }
                .stat-card label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                 .stat-card .value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-top: 0.5rem;
                    color: var(--text-primary);
                }
                 .stat-card .subtitle {
                    display: block;
                    margin-top: 0.25rem;
                    font-size: 0.75rem;
                     color: var(--text-secondary);
                    opacity: 0.8;
                }
            `}</style>
            <label>
                {label}
                {tooltipContent && (
                    <Tooltip content={tooltipContent} position="top">
                        <HelpCircle size={14} style={{ opacity: 0.6, cursor: 'help' }} />
                    </Tooltip>
                )}
            </label>
            <div className="value">
                {loading ? <Skeleton width={100} height={24} /> : value}
            </div>
            {subtitle && <span className="subtitle">{subtitle}</span>}
        </div>
    );
};
