import React from 'react';

interface LoadingSkeletonProps {
    className?: string;
    count?: number;
}

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-shimmer rounded-md ${className}`} />
);

export const CardSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="pt-4">
            <Skeleton className="h-9 w-full rounded-lg" />
        </div>
    </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex gap-8">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-24" />
                ))}
            </div>
        </div>
        <div className="divide-y divide-gray-100">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex gap-8">
                    {Array.from({ length: cols }).map((_, j) => (
                        <Skeleton key={j} className="h-4 w-24" />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

export const StatsCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        </div>
    </div>
);

export const PageSkeleton: React.FC = () => (
    <div className="space-y-8 animate-in fade-in">
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-8 w-96" />
                <Skeleton className="h-4 w-64" />
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StatsCardSkeleton key={i} />
                ))}
            </div>
            <TableSkeleton rows={4} cols={4} />
        </div>
    </div>
);

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = '', count = 1 }) => (
    <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
        ))}
    </div>
);
