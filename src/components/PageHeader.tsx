'use client';

import React from 'react';
import Link from 'next/link';

interface Breadcrumb {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, breadcrumbs, actions, className = '' }) => {
    return (
        <div className={`bg-white border-b border-gray-200 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="min-w-0">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-1.5 truncate max-w-full" aria-label="Breadcrumb">
                            {breadcrumbs.map((crumb, i) => (
                                <React.Fragment key={crumb.label}>
                                    {i > 0 && (
                                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                    {crumb.href ? (
                                        <Link href={crumb.href} className="hover:text-primary transition-colors whitespace-nowrap">{crumb.label}</Link>
                                    ) : (
                                        <span className="text-gray-900 font-medium truncate">{crumb.label}</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>
                    )}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">{title}</h1>
                    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                </div>
                {actions && <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">{actions}</div>}
            </div>
        </div>
    );
};
