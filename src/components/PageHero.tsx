'use client';

import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeroProps {
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    badge?: string;
    breadcrumb?: BreadcrumbItem[];
    breadcrumbBack?: { label: string; href: string };
    actions?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    center?: boolean;
}

const sizeClasses: Record<string, string> = {
    sm: 'py-10',
    md: 'py-16 sm:py-20',
    lg: 'py-20 sm:py-24',
};

export const PageHero: React.FC<PageHeroProps> = ({
    title,
    description,
    badge,
    breadcrumb,
    breadcrumbBack,
    actions,
    children,
    className = '',
    size = 'md',
    center = false,
}) => {
    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{
                backgroundImage: "url('/smallbackground.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/55" />
            <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 ${sizeClasses[size]}`}>
                {breadcrumbBack && (
                    <Link
                        href={breadcrumbBack.href}
                        className="inline-flex items-center gap-1 text-sm text-gray-300 hover:text-white mb-4 transition-colors"
                    >
                        ← {breadcrumbBack.label}
                    </Link>
                )}
                {breadcrumb && breadcrumb.length > 0 && (
                    <nav className="flex items-center gap-1.5 text-sm text-gray-300 mb-4 truncate max-w-full" aria-label="Breadcrumb">
                        {breadcrumb.map((crumb, i) => (
                            <React.Fragment key={crumb.label}>
                                {i > 0 && (
                                    <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                                {crumb.href ? (
                                    <Link href={crumb.href} className="hover:text-white transition-colors whitespace-nowrap">{crumb.label}</Link>
                                ) : (
                                    <span className="text-white font-medium truncate">{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}
                <div className={`flex flex-col ${center ? 'items-center text-center' : 'items-start'} gap-4`}>
                    {badge && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest border border-white/20">
                            {badge}
                        </span>
                    )}
                    {typeof title === 'string' ? (
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-3xl">
                            {title}
                        </h1>
                    ) : (
                        title
                    )}
                    {description && (
                        typeof description === 'string' ? (
                            <p className="text-base sm:text-lg text-gray-200 max-w-2xl leading-relaxed">
                                {description}
                            </p>
                        ) : (
                            description
                        )
                    )}
                    {children && <div className="w-full">{children}</div>}
                    {actions && (
                        <div className={`flex items-center gap-3 flex-wrap pt-2 ${center ? 'justify-center' : ''}`}>
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
