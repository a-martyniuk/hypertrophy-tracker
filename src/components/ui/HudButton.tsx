import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
    icon?: ReactNode;
}

export const HudButton = ({
    children,
    variant = 'primary',
    isLoading = false,
    icon,
    className = '',
    disabled,
    ...props
}: Props) => {
    const baseClass = "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

    let variantClass = "";
    switch (variant) {
        case 'primary':
            variantClass = "btn-primary"; // Defined in index.css
            break;
        case 'secondary':
            variantClass = "btn-secondary"; // Defined in index.css
            break;
        case 'danger':
            variantClass = "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20";
            break;
        case 'ghost':
            variantClass = "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white";
            break;
    }

    return (
        <button
            className={`${baseClass} ${variantClass} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
            {!isLoading && icon && <span className="btn-icon">{icon}</span>}
            {children}
        </button>
    );
};
