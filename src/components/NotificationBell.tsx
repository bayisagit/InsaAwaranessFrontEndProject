'use client';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Notification {
    id: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export function NotificationBell() {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();
        // Set up polling every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const fetchNotifications = async () => {
        try {
            const { data, status } = await apiFetch('/api/v1/notifications/');
            if (status === 200 && data) {
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { status } = await apiFetch(`/api/v1/notifications/${id}/mark_read/`, {
                method: 'POST'
            });
            if (status === 200 || status === 201 || status === 204) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="relative flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground outline-none">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-background"></span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Notifications ({unreadCount})</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className="max-h-80 overflow-y-auto block">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3 cursor-default" onSelect={(e) => e.preventDefault()}>
                                <div className="flex w-full justify-between gap-2">
                                    <span className={`text-sm ${notification.is_read ? 'text-muted-foreground' : 'font-semibold'}`}>
                                        {notification.message}
                                    </span>
                                </div>
                                <div className="flex w-full justify-between items-center mt-1">
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(notification.created_at).toLocaleDateString()}
                                    </span>
                                    {!notification.is_read && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification.id);
                                            }}
                                        >
                                            Mark as read
                                        </Button>
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
