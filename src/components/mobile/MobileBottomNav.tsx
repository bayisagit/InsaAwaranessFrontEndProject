'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, GraduationCap, Wrench, ShieldAlert, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  // Hide on immersive full-screen flows (e.g. exam player / learning session)
  if (pathname?.startsWith('/learn/') || pathname?.startsWith('/exam/')) {
    return null;
  }

  const isAnyAdmin = user?.role === 'super_admin' || user?.role === 'org_admin' || user?.role === 'course_provider';
  const profileHref = isAuthenticated ? (isAnyAdmin ? '/admin' : '/dashboard') : '/login';
  const ProfileIcon = isAuthenticated ? LayoutDashboard : User;
  const profileLabel = isAuthenticated ? 'Dashboard' : 'Account';

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      exact: true,
    },
    {
      label: 'Courses',
      href: '/courses',
      icon: GraduationCap,
      exact: false,
    },
    {
      label: 'Tools',
      href: '/tools',
      icon: Wrench,
      exact: false,
    },
    {
      label: 'Alerts',
      href: '/alerts',
      icon: ShieldAlert,
      exact: false,
    },
    {
      label: profileLabel,
      href: profileHref,
      icon: ProfileIcon,
      exact: false,
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-1.5 px-2 select-none"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <motion.div
                    layoutId="mobile-bottom-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight transition-all duration-200 ${isActive ? 'font-bold text-primary' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
