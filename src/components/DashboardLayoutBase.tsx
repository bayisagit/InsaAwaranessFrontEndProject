'use client';

import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Search, Bell, User, Settings, LogOut, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface DashboardLayoutBaseProps {
    children: React.ReactNode;
    searchPlaceholder?: string;
}

export function DashboardLayoutBase({ children, searchPlaceholder = "Search across platform..." }: DashboardLayoutBaseProps) {
    const { user, logout } = useAuth();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogout = () => setIsLogoutModalOpen(true);
    const confirmLogout = () => {
        logout();
        setIsLogoutModalOpen(false);
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col flex-1 overflow-hidden h-screen bg-gray-50">
                <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 shadow-sm z-10 sticky top-0">
                    <SidebarTrigger className="-ml-1" />
                    
                    <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-gray-900 ml-2" asChild>
                        <Link href="/" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>Back to Home</span>
                        </Link>
                    </Button>
                    
                    <div className="flex-1 flex items-center justify-between ml-4">
                        {/* Search */}
                        <div className="max-w-md w-full hidden sm:block relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={searchPlaceholder}
                                className="w-full bg-gray-50/50 pl-9 md:w-[300px] lg:w-[400px] focus-visible:ring-1 focus-visible:ring-primary"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 ml-auto">
                            <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-900" asChild>
                                <Link href="/notifications">
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                                </Link>
                            </Button>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
                                        <Avatar className="h-9 w-9 border border-gray-200">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                                {user?.first_name?.[0] || 'U'}
                                                {user?.last_name?.[0] || ''}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">{user?.first_name || 'User'} {user?.last_name || ''}</p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user?.email || 'user@example.com'}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile" className="flex flex-row items-center w-full cursor-pointer">
                                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>Profile</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/settings" className="flex flex-row items-center w-full cursor-pointer">
                                                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>Settings</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="flex flex-row items-center w-full text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
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
                title="Log Out"
                message="Are you sure you want to log out of your account?"
                confirmText="Log Out"
                variant="danger"
            />
        </SidebarProvider>
    );
}
