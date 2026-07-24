'use client';

import React from 'react';
import { DashboardLayoutBase } from '@/components/DashboardLayoutBase';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayoutBase>{children}</DashboardLayoutBase>;
}
