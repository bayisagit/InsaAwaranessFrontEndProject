import React from 'react';

interface StatCardProps {
    icon?: React.ReactNode;
    label: string;
    value: string | number;
    trend?: {
        direction: 'up' | 'down';
        value: string;
    };
    color?: 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'gray';
    className?: string;
}

const colorMap = {
    red: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
    yellow: { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
    gray: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-gray-500' },
};

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, color = 'blue', className = '' }) => {
    const c = colorMap[color];

    return (
        <div className={`bg-card p-3 sm:p-5 rounded-xl border border-border shadow-sm shadow-black/5 dark:shadow-none transition-all duration-200 hover:shadow-md shadow-black/10 dark:shadow-none hover:border-border ${className}`}>
            <div className="cursor-pointer hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all duration-200 ease-in-out flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1 truncate">{label}</p>
                    <p className="text-lg sm:text-2xl font-black text-foreground truncate">{value}</p>
                    {trend && (
                        <div className="flex items-center gap-1 mt-1 sm:mt-1.5">
                            <span className={`inline-flex items-center text-[10px] sm:text-xs font-medium ${trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                                <svg className={`w-3 h-3 mr-0.5 ${trend.direction === 'down' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                {trend.value}
                            </span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${c.bg} ${c.text} flex items-center justify-center shrink-0 self-start sm:self-auto [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-5 sm:[&>svg]:h-5`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};
