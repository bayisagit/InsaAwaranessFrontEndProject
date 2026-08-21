import React from 'react';

interface LoadingSkeletonProps {
    className?: string;
    count?: number;
}

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-shimmer rounded-lg ${className}`} />
);

export const CardSkeleton: React.FC = () => (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="pt-4">
            <Skeleton className="h-9 w-full rounded-xl" />
        </div>
    </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="bg-muted px-6 py-4 border-b border-border">
            <div className="flex gap-8">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-24" />
                ))}
            </div>
        </div>
        <div className="divide-y divide-border">
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
    <div className="bg-card rounded-xl border border-border p-5">
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
        <div className="bg-card border-b border-border">
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

export const WorkspaceSkeleton: React.FC = () => (
    <div className="flex h-screen bg-muted/30 w-full overflow-hidden animate-in fade-in">
        {/* Sidebar Skeleton */}
        <div className="w-64 border-r border-border bg-card shrink-0 hidden md:flex flex-col">
            <div className="h-16 border-b border-border p-5 flex items-center">
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-3 space-y-4 mt-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="space-y-2 pt-4">
                    <Skeleton className="h-3 w-16 mb-2" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 border-b border-border bg-card/80 px-6 flex items-center justify-between shrink-0">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-9 w-9 rounded-full" />
            </header>
            <div className="flex-1 p-6 lg:p-12 overflow-y-auto space-y-8">
                <div className="space-y-4 max-w-4xl">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="space-y-4 mt-8 max-w-4xl">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-4xl">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        </div>
    </div>
);

export const AssessmentSkeleton: React.FC = () => (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-8 animate-in fade-in">
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
        </div>
        
        <div className="py-6 space-y-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
            </div>
        </div>
        
        <div className="flex justify-between items-center pt-6 border-t border-border">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
    </div>
);
