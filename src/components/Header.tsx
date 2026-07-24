'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from './ConfirmModal';

interface HeaderProps {
    rightAction?: React.ReactNode;
}

const adminGroups = [
    {
        label: 'Content',
        roles: ['super_admin', 'course_provider'],
        links: [
            { label: 'Courses', href: '/admin/courses' },
            { label: 'Modules', href: '/admin/modules' },
            { label: 'Lessons', href: '/admin/lessons' },
            { label: 'Videos', href: '/admin/videos' },
            { label: 'Articles', href: '/admin/articles' },
            { label: 'Resources', href: '/admin/resources' },
        ]
    },
    {
        label: 'Users & Orgs',
        roles: ['super_admin', 'org_admin'],
        links: [
            { label: 'Users', href: '/admin/users' },
            { label: 'Organizations', href: '/admin/organizations', roles: ['super_admin'] },
            { label: 'Org Applications', href: '/admin/organization-applications', roles: ['super_admin'] },
            { label: 'Training Requests', href: '/admin/training-requests' },
            { label: 'Payment Approvals', href: '/admin/payment-approvals', roles: ['super_admin'] },
        ]
    },
    {
        label: 'Engagement',
        roles: ['super_admin', 'org_admin', 'course_provider'],
        links: [
            { label: 'Campaigns', href: '/admin/campaigns', roles: ['super_admin', 'org_admin'] },
            { label: 'Assessments', href: '/admin/assessments', roles: ['super_admin', 'course_provider'] },
            { label: 'Reports', href: '/admin/reports', roles: ['super_admin', 'org_admin'] },
            { label: 'Alerts', href: '/admin/alerts', roles: ['super_admin'] },
            { label: 'Awareness Tools', href: '/admin/awareness-tools', roles: ['super_admin'] },
            { label: 'Audit Logs', href: '/admin/audit-logs', roles: ['super_admin'] },
        ]
    }
];

const NavLink = ({ href, children, exact = false, onClick }: { href: string, children: React.ReactNode, exact?: boolean, onClick?: () => void }) => {
    const pathname = usePathname();
    const isActive = exact ? pathname === href : (pathname === href || pathname?.startsWith(href + '/'));

    return (
        <Link href={href} onClick={onClick} className={`relative py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}`}>
            {children}
            {isActive && (
                <motion.div
                    layoutId="navbar-underline"
                    className="absolute left-0 right-0 -bottom-1 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
        </Link>
    );
};

const NavDropdown: React.FC<{ label: string, links: { label: string, href: string }[], active: boolean }> = ({ label, links, active }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onMouseEnter={() => setIsOpen(true)}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1 transition-colors py-2 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${active ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {label}
                <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {active && (
                    <motion.div
                        layoutId="navbar-underline"
                        className="absolute left-0 right-0 -bottom-1 h-0.5 bg-primary rounded-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                        transition={{ duration: 0.12 }}
                        className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[60]"
                        onMouseLeave={() => setIsOpen(false)}
                    >
                        {links.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 hover:text-primary transition-colors ${pathname === link.href ? 'text-primary font-semibold' : 'text-gray-700'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MobileNavItem: React.FC<{ href: string; children: React.ReactNode; onClick: () => void }> = ({ href, children, onClick }) => {
    const pathname = usePathname();
    const isActive = pathname === href || pathname?.startsWith(href + '/');
    return (
        <Link href={href} onClick={onClick} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive ? 'text-primary bg-red-50 border-r-2 border-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
            {children}
        </Link>
    );
};

const MobileSection: React.FC<{ label: string; links: { label: string; href: string }[]; onClick: () => void }> = ({ label, links, onClick }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div>
            <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50" aria-expanded={expanded}>
                {label}
                <svg className={`w-4 h-4 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        {links.map(link => (
                            <MobileNavItem key={link.href} href={link.href} onClick={onClick}>{link.label}</MobileNavItem>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({ rightAction }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const pathname = usePathname();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isSystemAdmin = user?.role === 'super_admin';
    const isOrgAdmin = user?.role === 'org_admin';
    const isCourseProvider = user?.role === 'course_provider';
    const isAnyAdmin = isSystemAdmin || isOrgAdmin || isCourseProvider;

    const closeMobile = useCallback(() => setIsMobileMenuOpen(false), []);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        logout();
        setIsLogoutModalOpen(false);
    };

    return (
        <header className="w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-12 sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                        <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        </div>
                    </div>
                    <span className="font-bold text-lg text-gray-900 tracking-tight hidden sm:inline">CyberSafe Nation</span>
                    <span className="font-bold text-lg text-gray-900 tracking-tight sm:hidden">CSN</span>
                </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                <NavLink href="/" exact>Home</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/contact">Contact</NavLink>
                <NavLink href="/courses">Courses</NavLink>
                <NavLink href="/resources">Resources</NavLink>
                <NavDropdown label="Awareness" links={[
                    { label: 'All Topics', href: '/awareness' },
                    { label: 'Phishing Protection', href: '/awareness/phishing-protection' },
                    { label: 'Password Hygiene', href: '/awareness/password-hygiene' },
                    { label: 'Secure Browsing', href: '/awareness/secure-browsing' },
                    { label: 'Data Privacy', href: '/awareness/data-privacy' },
                    { label: 'Incident Response', href: '/awareness/incident-response' },
                    { label: 'Cyber Hygiene Basics', href: '/awareness/cyber-hygiene-basics' },
                ]} active={['/awareness'].some(href => pathname?.startsWith(href))} />
                <NavDropdown label="Tools" links={[
                    { label: 'Tools Hub', href: '/tools' },
                    { label: 'Alerts', href: '/alerts' },
                    { label: 'Campaigns', href: '/campaigns' },
                ]} active={['/tools', '/alerts', '/campaigns'].some(href => pathname?.startsWith(href))} />
            </nav>

            <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-4">
                    {rightAction || (
                        isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <Link href={isAnyAdmin ? "/admin" : "/dashboard"} className="text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors px-4 py-1.5 rounded-full">Dashboard</Link>
                                <button onClick={handleLogout} className="text-sm font-medium text-primary hover:transition-colors border border-primary px-4 py-1.5 rounded-full cursor-pointer hover:bg-red-50 transition-colors">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link href="/apply" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors px-4 py-1.5 border border-gray-300 hover:border-primary rounded-full">
                                    Apply
                                </Link>
                                <Link href="/login" className="text-sm font-medium bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full transition-colors shadow-sm">
                                    Sign In
                                </Link>
                            </>
                        )
                    )}
                </div>

                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={isMobileMenuOpen}
                >
                    {isMobileMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 bg-black/40 z-40 md:hidden"
                            onClick={closeMobile}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] bg-white border-l border-gray-200 z-50 overflow-y-auto shadow-2xl md:hidden"
                        >
                            <div className="py-4">
                                    <div className="space-y-1">
                                        <MobileNavItem href="/" onClick={closeMobile}>Home</MobileNavItem>
                                        <MobileNavItem href="/about" onClick={closeMobile}>About</MobileNavItem>
                                        <MobileNavItem href="/contact" onClick={closeMobile}>Contact</MobileNavItem>
                                        <MobileNavItem href="/courses" onClick={closeMobile}>Courses</MobileNavItem>
                                        <MobileNavItem href="/resources" onClick={closeMobile}>Resources</MobileNavItem>
                                        <MobileNavItem href="/awareness" onClick={closeMobile}>Awareness</MobileNavItem>
                                        <MobileNavItem href="/tools" onClick={closeMobile}>Tools</MobileNavItem>
                                        <MobileNavItem href="/alerts" onClick={closeMobile}>Alerts</MobileNavItem>
                                        <MobileNavItem href="/campaigns" onClick={closeMobile}>Campaigns</MobileNavItem>
                                    </div>

                                <div className="border-t border-gray-100 mt-4 pt-4 px-6 space-y-3">
                                    {isAuthenticated ? (
                                        <>
                                            <Link href={isAnyAdmin ? "/admin" : "/dashboard"} onClick={closeMobile} className="block text-center text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors px-5 py-2.5 rounded-full mb-3">Dashboard</Link>
                                            <button onClick={() => { closeMobile(); handleLogout(); }} className="w-full text-sm font-medium text-primary border border-primary px-4 py-2 rounded-full hover:bg-red-50 transition-colors cursor-pointer">
                                                Logout
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link href="/apply" onClick={closeMobile} className="block text-center text-sm font-medium text-gray-700 hover:text-primary transition-colors px-5 py-2.5 border border-gray-300 hover:border-primary rounded-full mb-3">
                                                Apply
                                            </Link>
                                            <Link href="/login" onClick={closeMobile} className="block text-center text-sm font-medium bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full transition-colors shadow-sm">
                                                Sign In
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                title="Log Out"
                message="Are you sure you want to log out of your account?"
                confirmText="Log Out"
                variant="danger"
            />
        </header>
    );
};
