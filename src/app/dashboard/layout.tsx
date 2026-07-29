'use client';

import React from 'react';
import { DashboardLayoutBase } from '@/components/DashboardLayoutBase';

import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // If we are inside a learner course workspace, we don't use the global dashboard layout
    // We will let the course page handle its own LMS-style sidebar layout.
    const isLearnerWorkspace = pathname?.match(/^\/dashboard\/courses\/([a-zA-Z0-9_-]+)(?:\/.*)?$/);
    
    if (isLearnerWorkspace) {
        return <>{children}</>;
    }
    
    return <DashboardLayoutBase searchPlaceholder="Search across platform...">{children}</DashboardLayoutBase>;
}
