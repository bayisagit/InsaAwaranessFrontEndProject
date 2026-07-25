'use client';

import React from 'react';
import { PageHero } from '@/components/PageHero';

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
    const isCenter = className.includes('text-center');

    return (
        <PageHero
            title={title}
            description={description}
            breadcrumb={breadcrumbs}
            actions={actions}
            className={className}
            center={isCenter}
            size="sm"
        />
    );
};
