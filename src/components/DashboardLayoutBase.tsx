'use client';

import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Search, Bell, User, Settings, LogOut, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useTranslations } from 'next-intl';
import { NotificationBell } from '@/components/NotificationBell';

interface DashboardLayoutBaseProps {
    children: React.ReactNode;
    searchPlaceholder?: string;
}

export function DashboardLayoutBase({ children }: DashboardLayoutBaseProps) {
    const { user, logout } = useAuth();
    const t = useTranslations('dashboard');
    const tCommon = useTranslations('common');
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogout = () => setIsLogoutModalOpen(true);
    const confirmLogout = () => {
        logout();
        setIsLogoutModalOpen(false);
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col flex-1 overflow-hidden h-screen bg-muted">
                <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 shadow-sm shadow-black/5 dark:shadow-none z-10 sticky top-0">
                    <SidebarTrigger className="-ml-1" />
                    <Link href="/" className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground ml-2">
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>{t('backToHome')}</span>
                        </Button>
                    </Link>
                    
                    <div className="flex-1 flex items-center justify-between ml-4">
                        {/* Search */}
                        <div className="max-w-md w-full hidden sm:block relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={t('searchDashboard')}
                                className="w-full bg-gray-50/50 pl-9 md:w-[300px] lg:w-[400px] focus-visible:ring-1 focus-visible:ring-primary"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 ml-auto">
                            <NotificationBell />
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger className="relative h-9 w-9 rounded-full ml-1 hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none">
                                    <Avatar className="h-9 w-9 border border-border">
                                        {user?.profile_photo ? (
                                            <AvatarImage src={user.profile_photo} alt="Profile" className="h-full w-full object-cover rounded-full" />
                                        ) : null}
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                            {user?.first_name?.[0] || 'U'}
                                            {user?.last_name?.[0] || ''}
                                        </AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end">
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-bold leading-none text-emerald-500">
                                                    {user?.role ? user.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'User'}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user?.email || 'user@example.com'}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem>
                                            <Link href="/profile" className="flex flex-row items-center w-full cursor-pointer">
                                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>{t('profile')}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="flex flex-row items-center w-full text-red-500 focus:text-red-500 dark:focus:text-red-400 focus:bg-red-500/10 cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>{t('logOut')}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>
                
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </SidebarInset>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                title={t('logOut')}
                message={tCommon('logoutConfirm')}
                confirmText={t('logOut')}
                variant="danger"
            />
        </SidebarProvider>
    );
}
