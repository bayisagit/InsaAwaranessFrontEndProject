'use client';

import React from 'react';
import { Button } from './Button';

interface PaginationProps {
    page: number;
    pageSize: number;
    totalCount: number;
    isLoading?: boolean;
    onPageChange: (page: number) => void;
    label?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    page,
    pageSize,
    totalCount,
    isLoading = false,
    onPageChange,
    label = 'items',
}) => {
    if (totalCount <= pageSize) return null;

    const totalPages = Math.ceil(totalCount / pageSize);
    const showingTo = Math.min(page * pageSize, totalCount);
    const showingFrom = (page - 1) * pageSize + 1;

    const getPageNumbers = () => {
        const pages: (number | '...')[] = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm shadow-black/5 dark:shadow-none">
            <span className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{showingFrom}–{showingTo}</span> of{' '}
                <span className="font-medium text-foreground">{totalCount}</span> {label}
            </span>
            <nav className="flex items-center gap-1" aria-label="Pagination">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1 || isLoading}
                    onClick={() => onPageChange(page - 1)}
                    aria-label="Previous page"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Button>
                {getPageNumbers().map((p, i) =>
                    p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-muted-foreground">...</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            disabled={isLoading}
                            className={`min-w-[36px] h-9 text-sm font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                p === page
                                    ? 'bg-primary text-white shadow-sm shadow-black/5 dark:shadow-none'
                                    : 'text-muted-foreground hover:bg-muted/50'
                            }`}
                            aria-current={p === page ? 'page' : undefined}
                        >
                            {p}
                        </button>
                    )
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => onPageChange(page + 1)}
                    aria-label="Next page"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Button>
            </nav>
        </div>
    );
};
