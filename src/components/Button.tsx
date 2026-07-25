import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'social' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
}

const Spinner = () => (
    <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth = false, loading = false, iconLeft, iconRight, children, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

        const variants: Record<string, string> = {
            primary: 'bg-primary text-white hover:bg-primary-hover border border-transparent shadow-sm active:scale-[0.98]',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover hover:text-white border border-transparent shadow-sm active:scale-[0.98]',
            outline: 'bg-transparent border border-primary text-primary hover:bg-red-50 active:scale-[0.98]',
            ghost: 'bg-transparent text-gray-text hover:bg-gray-100 hover:text-foreground active:scale-[0.98]',
            social: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm active:scale-[0.98]',
            danger: 'bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-sm active:scale-[0.98]',
        };

        const sizes: Record<string, string> = {
            sm: 'h-9 px-3 text-sm gap-1.5',
            md: 'h-11 px-4 py-2 text-sm gap-2',
            lg: 'h-14 px-8 text-base gap-2.5',
        };

        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
                {...props}
            >
                {loading && <Spinner />}
                {!loading && iconLeft && <span className="shrink-0 flex items-center">{iconLeft}</span>}
                {children}
                {!loading && iconRight && <span className="shrink-0 flex items-center">{iconRight}</span>}
            </button>
        );
    }
);
Button.displayName = 'Button';
