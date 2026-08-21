import React from 'react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export default function Loading() {
    return (
        <div className="p-6 lg:p-12 animate-in fade-in">
            <div className="space-y-6">
                <LoadingSkeleton count={3} />
            </div>
        </div>
    );
}
