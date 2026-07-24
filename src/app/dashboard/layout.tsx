'use client';

import React from 'react';
import { DashboardLayoutBase } from '@/components/DashboardLayoutBase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayoutBase searchPlaceholder="Search across platform...">{children}</DashboardLayoutBase>;
}
