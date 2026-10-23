'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ExternalLink, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

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
                const notificationsArray = Array.isArray(data) ? data : (data.results || []);
                setNotifications(notificationsArray);
                setUnreadCount(notificationsArray.filter((n: Notification) => !n.is_read).length);
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

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        setIsOpen(false);
        router.push('/notifications');
    };

    const handleViewAll = () => {
        setIsOpen(false);
        router.push('/notifications');
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger
                className="relative flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground outline-none transition-colors cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-background"></span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 shadow-lg border border-border">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                    <button
                        type="button"
                        onClick={handleViewAll}
                        className="text-sm font-semibold hover:text-primary transition-colors text-left flex items-center gap-2 cursor-pointer group"
                    >
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <span className="text-[11px] font-bold text-white bg-primary px-1.5 py-0.2 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleViewAll}
                        className="text-xs text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                        <span>View all</span>
                        <ExternalLink className="h-3 w-3" />
                    </button>
                </div>

                {/* Notifications List */}
                <DropdownMenuGroup className="max-h-80 overflow-y-auto divide-y divide-border/50">
                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <Bell className="h-8 w-8 text-muted-foreground/30 stroke-1" />
                            <span>No notifications yet</span>
                            <button
                                type="button"
                                onClick={handleViewAll}
                                className="text-xs text-primary hover:underline font-medium mt-1 cursor-pointer"
                            >
                                Open notifications page →
                            </button>
                        </div>
                    ) : (
                        notifications.slice(0, 5).map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex flex-col items-start gap-1 p-3.5 transition-colors cursor-pointer ${
                                    notification.is_read
                                        ? 'bg-transparent hover:bg-accent/40 text-muted-foreground'
                                        : 'bg-primary/5 hover:bg-primary/10 text-foreground font-medium'
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex w-full justify-between items-start gap-2">
                                    <div className="flex items-start gap-2 flex-1">
                                        {!notification.is_read && (
                                            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                        )}
                                        <span className={`text-xs sm:text-sm line-clamp-2 ${notification.is_read ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}>
                                            {notification.message}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex w-full justify-between items-center mt-1.5 pl-4">
                                    <span className="text-[11px] text-muted-foreground">
                                        {new Date(notification.created_at).toLocaleDateString()}
                                    </span>
                                    {!notification.is_read ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto px-1.5 py-0.5 text-[11px] text-primary hover:bg-primary/10 hover:underline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification.id);
                                            }}
                                        >
                                            Mark as read
                                        </Button>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                                            <CheckCheck className="h-3 w-3" /> Read
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuGroup>

                {/* Footer */}
                <DropdownMenuSeparator className="m-0" />
                <div className="p-2 bg-muted/30 text-center">
                    <button
                        type="button"
                        onClick={handleViewAll}
                        className="w-full py-1.5 text-xs font-semibold text-primary hover:bg-background/80 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        <span>View all notifications</span>
                        <span>→</span>
                    </button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
