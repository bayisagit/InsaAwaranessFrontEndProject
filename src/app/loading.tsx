import React from 'react';
import { PageSkeleton } from '@/components/LoadingSkeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-background">
            <PageSkeleton />
        </div>
    );
}
