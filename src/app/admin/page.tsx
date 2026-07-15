'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCourses, getOrganizations, getTrainingRequests, getResources, getAnalyticsDashboard, Organization, apiFetch } from '@/lib/api';
import type { AnalyticsDashboard } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';

/* ─────────────────────── helpers ─────────────────────── */

const ICONS = {
    users: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    building: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>,
    card: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>,
    book: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
    chart: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
    shield: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
    tools: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-7.3 7.3a2.12 2.12 0 01-3-3l7.3-7.3m3.88 3.88l7.3-7.3a2.12 2.12 0 00-3-3l-7.3 7.3m3.88 3.88l-3.3 3.3m3.88-3.88l-3.88-3.88" /></svg>,
    package: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
    video: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25V7.5A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
    note: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
    newspaper: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V5.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.75 3 5.254 3 5.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" /></svg>,
    document: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    clipboard: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    announcement: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.875.875 0 01-1.03-.184c-.464-.515-.896-1.058-1.293-1.626m0-13.59c.253-.962.584-1.892.985-2.783.247-.55.06-1.21-.463-1.511l-.657-.38A.875.875 0 008.25 2.72c-.464.515-.896 1.058-1.293 1.626M12 6v12m-3-4.5h3m-1.5-9l1.5 1.5m-3 12l1.5-1.5m6-9l-1.5 1.5m1.5 9l-1.5-1.5" /></svg>,
    bell: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>,
    lightbulb: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>,
    hourglass: <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

const COLOR_MAP: Record<string, { text: string; bg: string }> = {
    blue: { text: 'text-blue-600', bg: 'bg-blue-500' },
    green: { text: 'text-green-600', bg: 'bg-green-500' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-500' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-500' },
    red: { text: 'text-red-600', bg: 'bg-red-500' },
    yellow: { text: 'text-yellow-600', bg: 'bg-yellow-500' },
};

const QuickLink = ({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) => (
    <Link href={href}>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:border-primary transition-all group h-full">
            <div className="mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            <div className="mt-6 flex items-center text-primary font-semibold text-sm">
                Manage Now
                <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    </Link>
);

const ProgressBar = ({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) => {
    const colors = COLOR_MAP[color] || COLOR_MAP.blue;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 font-medium">{label}</span>
                <span className={`${colors.text} font-bold`}>{value}</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className={`${colors.bg} h-full rounded-full`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

/* ─────────────────────── main ─────────────────────── */
export default function AdminDashboard() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [coursesCount, setCoursesCount] = useState('0');
    const [orgsCount, setOrgsCount] = useState('0');
    const [reqsCount, setReqsCount] = useState('0');
    const [resourcesCount, setResourcesCount] = useState('0');
    const [recentOrgs, setRecentOrgs] = useState<Organization[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (user?.role !== 'super_admin' && user?.role !== 'org_admin' && user?.role !== 'course_provider') router.push('/dashboard');
            else fetchData();
        }
    }, [isAuthenticated, isLoading, user, router]);

    const fetchData = async () => {
        setIsDataLoading(true);
        try {
            const promises: Promise<any>[] = [
                getCourses(),
                getOrganizations(),
                getTrainingRequests()
            ];

            if (user?.role !== 'org_admin') {
                promises.push(getResources());
            }

            if (user?.role === 'super_admin') {
                promises.push(getAnalyticsDashboard());
            }

            const results = await Promise.all(promises);
            const coursesRes = results[0];
            const orgsRes = results[1];
            const reqsRes = results[2];
            const resourcesRes = results[3];
            const analyticsRes = user?.role === 'super_admin' ? results[promises.length - 1] : null;

            setCoursesCount(coursesRes.data?.count?.toString() || '0');
            setOrgsCount(orgsRes.data?.count?.toString() || '0');
            setReqsCount(reqsRes.data?.count?.toString() || '0');

            if (resourcesRes) {
                setResourcesCount(resourcesRes.data?.count?.toString() || '0');
            }

            if (analyticsRes?.data) setAnalytics(analyticsRes.data);
            if (orgsRes.data?.results) setRecentOrgs(orgsRes.data.results.slice(0, 5));
        } catch (err) {
        } finally {
            setIsDataLoading(false);
        }
    };

    if (isLoading || isDataLoading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div aria-label="Loading" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!user || (user.role !== 'super_admin' && user.role !== 'org_admin' && user.role !== 'course_provider')) return null;

    const roleLabel: Record<string, string> = {
        super_admin: 'System Administrator',
        org_admin: 'Organization Administrator',
        course_provider: 'Course Provider',
    };

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PageHeader
                title={`Welcome back, ${user.first_name}`}
                description="Here&apos;s your personalized dashboard overview."
                breadcrumbs={[{ label: roleLabel[user.role] || user.role }]}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-6 sm:mt-10">

                {/* ═══════════ SUPER ADMIN DASHBOARD ═══════════ */}
                {user.role === 'super_admin' && (
                    <>
                        {/* Pending Training Requests Alert */}
                        {parseInt(reqsCount) > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-8 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white text-orange-500 flex items-center justify-center shadow-sm">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Pending Training Requests</h3>
                                        <p className="text-sm text-gray-600">There are {reqsCount} organization training requests awaiting your review.</p>
                                    </div>
                                </div>
                                <Link href="/admin/training-requests">
                                    <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors">
                                        Review Now
                                    </button>
                                </Link>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                label="Total Courses"
                                value={coursesCount}
                                color="blue"
                            />
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                                label="Organizations"
                                value={orgsCount}
                                color="green"
                            />
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                label="Training Requests"
                                value={reqsCount}
                                color="yellow"
                            />
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                label="Total Resources"
                                value={resourcesCount}
                                color="purple"
                            />
                        </div>

                        {/* Quick Links */}
                        <h2 className="text-xl font-bold text-gray-900 mb-6">System Management</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            <QuickLink icon={ICONS.users} title="User Management" description="View and manage all users, roles, and permissions." href="/admin/users" />
                            <QuickLink icon={ICONS.building} title="Organizations" description="Manage partner organizations and approve registrations." href="/admin/organizations" />
                            <QuickLink icon={ICONS.card} title="Payment Approvals" description="Review and process organization payment requests." href="/admin/payment-approvals" />
                            <QuickLink icon={ICONS.book} title="Courses & Content" description="Manage training courses, modules, and learning materials." href="/admin/courses" />
                            <QuickLink icon={ICONS.chart} title="Reports" description="View compliance reports and platform analytics." href="/admin/reports" />
                            <QuickLink icon={ICONS.shield} title="Audit Logs" description="Monitor system security events and user activity." href="/admin/audit-logs" />
                            <QuickLink icon={ICONS.tools} title="Awareness Tools" description="Configure and monitor interactive cybersecurity tools." href="/admin/awareness-tools" />
                        </div>

                        {/* Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                                    </span>
                                    Platform Overview
                                </h2>
                                <div className="space-y-4">
                                    {analytics ? (
                                        <>
                                            <ProgressBar label="Total Enrollments" value={analytics.enrollments.total.toLocaleString()} pct={100} color="blue" />
                                            <ProgressBar label="Average Progress" value={`${Math.round(analytics.enrollments.average_progress)}%`} pct={Math.round(analytics.enrollments.average_progress)} color="green" />
                                            <ProgressBar label="Average Quiz Score" value={`${Math.round(analytics.assessments.average_score)}%`} pct={Math.round(analytics.assessments.average_score)} color="purple" />
                                            <ProgressBar label="Certificates Issued" value={analytics.certificates.total.toLocaleString()} pct={Math.min(100, Math.round((analytics.certificates.total / (analytics.enrollments.total || 1)) * 100))} color="orange" />
                                        </>
                                    ) : (
                                        <p className="text-gray-400 text-sm">Loading analytics...</p>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                                    </span>
                                    Security Overview
                                </h2>
                                <div className="space-y-4">
                                    {analytics ? (
                                        <>
                                            <ProgressBar label="Total Users" value={analytics.users.total.toLocaleString()} pct={100} color="blue" />
                                            <ProgressBar label="Total Courses" value={analytics.courses.total.toLocaleString()} pct={100} color="green" />
                                            <ProgressBar label="Alerts Published" value={analytics.alerts.published.toLocaleString()} pct={analytics.alerts.total > 0 ? Math.round((analytics.alerts.published / analytics.alerts.total) * 100) : 0} color="red" />
                                            <ProgressBar label="Assessment Attempts" value={analytics.assessments.total_attempts.toLocaleString()} pct={Math.min(100, Math.round((analytics.assessments.total_attempts / (analytics.users.total || 1)) * 100))} color="purple" />
                                        </>
                                    ) : (
                                        <p className="text-gray-400 text-sm">Loading analytics...</p>
                                    )}
                                </div>
                                <Link href="/admin/audit-logs" className="mt-6 block text-center text-primary text-sm font-semibold hover:underline">
                                    View Full Security Audit Logs
                                </Link>
                            </div>
                        </div>

                        {/* Recent Organizations */}
                        <div className="mt-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Organizations</h2>
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-700">Latest Onboarded</span>
                                    <Link href="/admin/organizations" className="text-primary text-sm font-medium hover:underline">View All</Link>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {recentOrgs.length === 0 ? (
                                        <div className="p-6 text-center text-gray-500 text-sm">No recent data available.</div>
                                    ) : recentOrgs.map(org => (
                                        <div key={org.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                <span className="text-sm text-gray-600">Organization: <span className="font-medium text-gray-900">{org.name}</span></span>
                                            </div>
                                            <span className="text-xs text-gray-400">{new Date(org.created_at).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══════════ ORG ADMIN DASHBOARD ═══════════ */}
                {user.role === 'org_admin' && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>}
                                label="Members"
                                value={orgsCount}
                                color="blue"
                            />
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                label="Courses"
                                value={coursesCount}
                                color="green"
                            />
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                label="Training Requests"
                                value={reqsCount}
                                color="yellow"
                            />
                        </div>

                        {/* Quick Links */}
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Organization Management</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            <QuickLink icon={ICONS.users} title="Members" description="Manage organization memberships and user enrollments." href="/admin/memberships" />
                            <QuickLink icon={ICONS.clipboard} title="Training Requests" description="Submit and track training requests for your organization." href="/admin/training-requests" />
                            <QuickLink icon={ICONS.chart} title="Reports" description="View compliance and training progress reports." href="/admin/reports" />
                            <QuickLink icon={ICONS.book} title="Courses" description="Browse and manage available training courses." href="/admin/courses" />
                            <QuickLink icon={ICONS.announcement} title="Campaigns" description="View and manage awareness campaigns for your org." href="/admin/campaigns" />
                        </div>

                        {/* Org Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-green-50 text-green-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                                    </span>
                                    Organization Performance
                                </h2>
                                <div className="space-y-4">
                                    {analytics ? (
                                        <>
                                            <ProgressBar label="Total Enrollments" value={analytics.enrollments.total.toLocaleString()} pct={Math.min(100, Math.round((analytics.enrollments.total / (analytics.users.total || 1)) * 100))} color="green" />
                                            <ProgressBar label="Average Progress" value={`${Math.round(analytics.enrollments.average_progress)}%`} pct={Math.round(analytics.enrollments.average_progress)} color="blue" />
                                        </>
                                    ) : (
                                        <ProgressBar label="Enrollment Rate" value="—" pct={0} color="green" />
                                    )}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                    </span>
                                    Recent Activity
                                </h2>
                                <div className="divide-y divide-gray-100">
                                    {[
                                        { msg: 'New member enrolled in Cyber Hygiene', time: '1h ago' },
                                        { msg: 'Training request submitted for Q2', time: '3h ago' },
                                        { msg: '5 members completed Phishing Module', time: '1d ago' },
                                        { msg: 'New resource uploaded: Security Policy', time: '2d ago' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="py-3 flex justify-between items-center text-sm">
                                            <span className="text-gray-700">{item.msg}</span>
                                            <span className="text-xs text-gray-400 italic">{item.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══════════ COURSE PROVIDER DASHBOARD ═══════════ */}
                {user.role === 'course_provider' && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                label="My Courses"
                                value={coursesCount}
                                color="blue"
                            />
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                label="Resources"
                                value={resourcesCount}
                                color="green"
                            />
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                                label="Assessments"
                                value="—"
                                color="yellow"
                            />
                            <StatCard
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}
                                label="Articles"
                                value="—"
                                color="purple"
                            />
                        </div>

                        {/* Quick Links */}
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Content Management</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            <QuickLink icon={ICONS.book} title="Courses" description="Create and manage your cybersecurity training courses." href="/admin/courses" />
                            <QuickLink icon={ICONS.package} title="Modules" description="Define module descriptions and learning objectives." href="/admin/modules" />
                            <QuickLink icon={ICONS.video} title="Videos & Lessons" description="Upload training materials — videos, documents, and presentations." href="/admin/videos" />
                            <QuickLink icon={ICONS.note} title="Assessments" description="Create quizzes, add questions, and define passing scores." href="/admin/assessments" />
                            <QuickLink icon={ICONS.newspaper} title="Articles & Toolkits" description="Write cybersecurity awareness articles organized by category." href="/admin/articles" />
                            <QuickLink icon={ICONS.document} title="Resources" description="Upload and maintain cybersecurity awareness resources." href="/admin/resources" />
                        </div>

                        {/* Content Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                                    </span>
                                    Content Performance
                                </h2>
                                <div className="space-y-4">
                                    {analytics ? (
                                        <>
                                            <ProgressBar label="Courses Published" value={`${analytics.courses.by_status?.published || 0} / ${analytics.courses.total}`} pct={analytics.courses.total > 0 ? Math.round(((analytics.courses.by_status?.published || 0) / analytics.courses.total) * 100) : 0} color="blue" />
                                            <ProgressBar label="Average Quiz Score" value={`${Math.round(analytics.assessments.average_score)}%`} pct={Math.round(analytics.assessments.average_score)} color="green" />
                                            <ProgressBar label="Certificates Issued" value={analytics.certificates.total.toLocaleString()} pct={Math.min(100, Math.round((analytics.certificates.total / (analytics.users.total || 1)) * 100))} color="purple" />
                                        </>
                                    ) : (
                                        <ProgressBar label="Courses Published" value="—" pct={0} color="blue" />
                                    )}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                                    </span>
                                    Submission Status
                                </h2>
                                <div className="divide-y divide-gray-100">
                                    {[
                                        { msg: 'Course "Phishing 101" approved', status: 'published', time: '2h ago' },
                                        { msg: 'Course "Secure Coding" pending review', status: 'pending', time: '1d ago' },
                                        { msg: 'Article "Password Best Practices" published', status: 'published', time: '2d ago' },
                                        { msg: 'Module "Social Engineering" draft saved', status: 'draft', time: '3d ago' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="py-3 flex justify-between items-center text-sm">
                                            <span className="text-gray-700">{item.msg}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'published' ? 'bg-green-50 text-green-700' :
                                                item.status === 'pending' ? 'bg-blue-50 text-blue-700' :
                                                    'bg-yellow-50 text-yellow-700'
                                                }`}>{item.status}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/admin/courses" className="mt-6 block text-center text-primary text-sm font-semibold hover:underline">
                                    View All My Courses
                                </Link>
                            </div>
                        </div>

                        {/* Workflow Reminder */}
                        <div className="mt-8 bg-gradient-to-r from-primary/5 to-blue-50 p-6 rounded-2xl border border-primary/10">
                            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg> Content Workflow Reminder
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                As a Course Provider, your content goes through a review process:
                                <strong className="text-gray-800"> Draft → Submit for Review → System Admin Approval → Published</strong>.
                                You cannot publish content directly — all courses and resources must be approved by a System Administrator.
                            </p>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
