'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';

export function NavigationWrapper({
    children,
    Header,
    Footer,
}: {
    children: React.ReactNode;
    Header: React.ReactNode;
    Footer: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAppLayout = pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/profile') || pathname?.startsWith('/notifications');

    if (isAppLayout) {
        return <>{children}</>;
    }

    return (
        <>
            {Header}
            <div className="flex-1 flex flex-col w-full">{children}</div>
            <div className="pb-16 md:pb-0">{Footer}</div>
            <MobileBottomNav />
        </>
    );
}
