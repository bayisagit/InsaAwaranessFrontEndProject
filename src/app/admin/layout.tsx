'use client';

import React from 'react';
import { DashboardLayoutBase } from '@/components/DashboardLayoutBase';
import { CourseWorkspaceLayout } from '@/components/CourseWorkspaceLayout';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Check if we are inside a specific course, module, or lesson workspace
    // e.g. /admin/courses/123, /admin/modules/123, /admin/lessons/123
    const isWorkspace = pathname?.match(/^\/admin\/(courses|modules|lessons)\/([a-zA-Z0-9_-]+)(?:\/.*)?$/);
    
    if (isWorkspace) {
        return <CourseWorkspaceLayout>{children}</CourseWorkspaceLayout>;
    }
    
    return <DashboardLayoutBase searchPlaceholder="Search across dashboard...">{children}</DashboardLayoutBase>;
}
