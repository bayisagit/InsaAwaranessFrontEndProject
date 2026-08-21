'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from './ConfirmModal';
import { ThemeToggle } from './theme/ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslations } from 'next-intl';

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
 <Link href={href} onClick={onClick} className={`relative py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
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
 className={`flex items-center gap-1 transition-colors py-2 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${active ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
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
 className="absolute left-0 right-0 -bottom-1 h-0.5 bg-primary rounded-full cursor-pointer"
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
 className="absolute top-full left-0 mt-1 w-56 bg-card rounded-xl shadow-lg shadow-black/10 dark:shadow-none border border-border py-2 z-[60]"
 onMouseLeave={() => setIsOpen(false)}
 >
 {links.map(link => (
 <Link
 key={link.href}
 href={link.href}
 className={`flex items-center px-4 py-2.5 text-sm hover:bg-muted hover:text-foreground transition-colors ${pathname === link.href ? 'text-primary font-semibold' : 'text-card-foreground'}`}
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
 <Link href={href} onClick={onClick} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive ? 'text-primary bg-primary/10 border-r-2 border-primary' : 'text-muted-foreground hover:bg-muted'}`}>
 {children}
 </Link>
 );
};

const MobileSection: React.FC<{ label: string; links: { label: string; href: string }[]; onClick: () => void }> = ({ label, links, onClick }) => {
 const [expanded, setExpanded] = useState(false);
 return (
 <div>
 <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full px-6 py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted cursor-pointer" aria-expanded={expanded}>
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
 const t = useTranslations('nav');
 const tCommon = useTranslations('common');
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
 <header className="w-full h-16 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-12 sticky top-0 z-50 transition-colors duration-200">
 <div className="flex items-center gap-2">
 <Link href="/" className="flex items-center gap-2">
 <Image src="/logo.png" alt="INSA" width={32} height={32} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
 <span className="font-bold text-lg text-foreground tracking-tight hidden sm:inline">INSA Cyber Awareness</span>
 <span className="font-bold text-lg text-foreground tracking-tight sm:hidden">INSA</span>
 </Link>
 </div>

 <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
 <NavLink href="/" exact>{t('home')}</NavLink>
 <NavLink href="/about">{t('about')}</NavLink>
 <NavLink href="/contact">{t('contact')}</NavLink>
 <NavLink href="/courses">{t('courses')}</NavLink>
 <NavLink href="/resources">{t('resources')}</NavLink>
 <NavDropdown label={t('awareness')} links={[
 { label: t('allTopics'), href: '/awareness' },
 { label: t('phishingProtection'), href: '/awareness/phishing-protection' },
 { label: t('passwordHygiene'), href: '/awareness/password-hygiene' },
 { label: t('secureBrowsing'), href: '/awareness/secure-browsing' },
 { label: t('dataPrivacy'), href: '/awareness/data-privacy' },
 { label: t('incidentResponse'), href: '/awareness/incident-response' },
 { label: t('cyberHygieneBasics'), href: '/awareness/cyber-hygiene-basics' },
 ]} active={['/awareness'].some(href => pathname?.startsWith(href))} />
 <NavDropdown label={t('tools')} links={[
 { label: t('toolsHub'), href: '/tools' },
 { label: t('alerts'), href: '/alerts' },
 { label: t('campaigns'), href: '/campaigns' },
 ]} active={['/tools', '/alerts', '/campaigns'].some(href => pathname?.startsWith(href))} />
 </nav>

 <div className="flex items-center gap-3">
 <LanguageSwitcher />
 <ThemeToggle />
 <div className="hidden md:flex items-center gap-4">
 {rightAction || (
 isAuthenticated ? (
 <div className="flex items-center gap-4">
 <Link href={isAnyAdmin ? "/admin" : "/dashboard"} className="text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors px-4 py-1.5 rounded-full">{t('dashboard')}</Link>
 <button onClick={handleLogout} className="text-sm font-medium text-primary hover:transition-colors border border-primary px-4 py-1.5 rounded-full cursor-pointer hover:bg-primary/10 transition-colors">
 {t('logout')}
 </button>
 </div>
 ) : (
 <>
 <Link href="/apply" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 transition-colors px-4 py-1.5 border border-border hover:border-primary rounded-full">
 {t('apply')}
 </Link>
 <Link href="/login" className="text-sm font-medium bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full transition-colors shadow-sm shadow-black/5 dark:shadow-none">
 {t('signIn')}
 </Link>
 </>
 )
 )}
 </div>

 <button
 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
 className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
 className="fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] bg-background border-l border-border z-50 overflow-y-auto shadow-2xl md:hidden"
 >
 <div className="py-4">
 <div className="space-y-1">
 <MobileNavItem href="/" onClick={closeMobile}>{t('home')}</MobileNavItem>
 <MobileNavItem href="/about" onClick={closeMobile}>{t('about')}</MobileNavItem>
 <MobileNavItem href="/contact" onClick={closeMobile}>{t('contact')}</MobileNavItem>
 <MobileNavItem href="/courses" onClick={closeMobile}>{t('courses')}</MobileNavItem>
 <MobileNavItem href="/resources" onClick={closeMobile}>{t('resources')}</MobileNavItem>
 <MobileNavItem href="/awareness" onClick={closeMobile}>{t('awareness')}</MobileNavItem>
 <MobileNavItem href="/tools" onClick={closeMobile}>{t('tools')}</MobileNavItem>
 <MobileNavItem href="/alerts" onClick={closeMobile}>{t('alerts')}</MobileNavItem>
 <MobileNavItem href="/campaigns" onClick={closeMobile}>{t('campaigns')}</MobileNavItem>
 </div>
 </div>

 <div className="border-t border-border mt-4 pt-4 px-6 space-y-3">
 {isAuthenticated ? (
 <>
 <Link href={isAnyAdmin ? "/admin" : "/dashboard"} onClick={closeMobile} className="block text-center text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors px-5 py-2.5 rounded-full mb-3 cursor-pointer">{t('dashboard')}</Link>
 <button onClick={() => { closeMobile(); handleLogout(); }} className="w-full text-sm font-medium text-primary border border-primary px-4 py-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer">
 {t('logout')}
 </button>
 </>
 ) : (
 <>
 <Link href="/apply" onClick={closeMobile} className="block text-center text-sm font-medium text-foreground hover:text-primary transition-colors duration-200 transition-colors px-5 py-2.5 border border-border hover:border-primary rounded-full mb-3 cursor-pointer">
 {t('apply')}
 </Link>
 <Link href="/login" onClick={closeMobile} className="block text-center text-sm font-medium bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full transition-colors shadow-sm shadow-black/5 dark:shadow-none cursor-pointer">
 {t('signIn')}
 </Link>
 </>
 )}
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>

 <ConfirmModal
 isOpen={isLogoutModalOpen}
 onClose={() => setIsLogoutModalOpen(false)}
 onConfirm={confirmLogout}
 title={t('logout')}
 message={tCommon('logoutConfirm')}
 confirmText={t('logout')}
 variant="danger"
 />
 </header>
 );
};
