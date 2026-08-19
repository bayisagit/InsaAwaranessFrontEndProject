'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCourses, getOrganizations, getTrainingRequests, getResources, getAnalyticsDashboard,
    getAnalyticsOverview, getEnrollmentGrowth, getUserGrowth, getCourseComparison, getTopCourses,
    Organization,
} from '@/lib/api';
import type {
    AnalyticsDashboard, AnalyticsOverview, GrowthDataPoint,
    CourseComparisonItem, TopCourseItem,
} from '@/lib/api';
import {
    Users, Building2, GraduationCap, FileText,
    ShieldAlert, Award, FileCheck, BookOpen, Clock, ArrowRight,
    TrendingUp, Megaphone, ShieldCheck, Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useTranslations } from 'next-intl';
import { AnimatedSection } from '@/components/AnimatedSection';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend,
} from 'recharts';

const CHART_COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function SummaryCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
    return (
        <Card className="hover:border-primary/50 transition-colors shadow-sm shadow-black/5 dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <span className={`text-${color}-500`}>{icon}</span>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const t = useTranslations('adminDashboard');
    const router = useRouter();

    const [coursesCount, setCoursesCount] = useState('0');
    const [orgsCount, setOrgsCount] = useState('0');
    const [reqsCount, setReqsCount] = useState('0');
    const [resourcesCount, setResourcesCount] = useState('0');
    const [recentOrgs, setRecentOrgs] = useState<Organization[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);

    // New analytics state
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [enrollmentGrowth, setEnrollmentGrowth] = useState<GrowthDataPoint[]>([]);
    const [userGrowth, setUserGrowth] = useState<GrowthDataPoint[]>([]);
    const [comparison, setComparison] = useState<CourseComparisonItem[]>([]);
    const [topCourses, setTopCourses] = useState<TopCourseItem[]>([]);

    // Filters
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterCourseIds, setFilterCourseIds] = useState('');
    const [allCourses, setAllCourses] = useState<{ id: string; title: string }[]>([]);

    const [isDataLoading, setIsDataLoading] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        if (user?.role !== 'super_admin') return;
        const [overviewRes, enrollGrowthRes, userGrowthRes, comparisonRes, topRes] = await Promise.all([
            getAnalyticsOverview(),
            getEnrollmentGrowth(12),
            getUserGrowth(12),
            getCourseComparison(filterDateFrom || filterDateTo ? {
                ...(filterDateFrom && { date_from: filterDateFrom }),
                ...(filterDateTo && { date_to: filterDateTo }),
            } : undefined),
            getTopCourses(10),
        ]);
        if (overviewRes.data) setOverview(overviewRes.data);
        if (enrollGrowthRes.data) setEnrollmentGrowth(enrollGrowthRes.data);
        if (userGrowthRes.data) setUserGrowth(userGrowthRes.data);
        if (comparisonRes.data) setComparison(comparisonRes.data);
        if (topRes.data) setTopCourses(topRes.data);
    }, [user, filterDateFrom, filterDateTo]);

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
                getCourses({ page_size: '200' }),
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

            if (coursesRes.data?.results) {
                setAllCourses(coursesRes.data.results.map((c: any) => ({ id: c.id, title: c.title })));
            }

            if (resourcesRes) {
                setResourcesCount(resourcesRes.data?.count?.toString() || '0');
            }

            if (analyticsRes?.data) setAnalytics(analyticsRes.data);
            if (orgsRes.data?.results) setRecentOrgs(orgsRes.data.results.slice(0, 5));

            if (user?.role === 'super_admin') {
                await fetchAnalytics();
            }
        } catch (err) {
        } finally {
            setIsDataLoading(false);
        }
    };

    const handleApplyFilter = () => {
        setIsDataLoading(true);
        fetchAnalytics().finally(() => setIsDataLoading(false));
    };

    const exportCSV = () => {
        if (!comparison.length) return;
        const headers = ['Course', 'Total Enrolled', 'Completed', 'Completion Rate (%)', 'Certificates Issued'];
        const rows = comparison.map(c => [
            c.course_title,
            c.total_enrolled,
            c.completed,
            c.completion_rate,
            c.certificates_issued,
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading || isDataLoading) return (
        <div className="flex flex-col gap-6 w-full mt-4">
            <Skeleton className="h-[120px] w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)}
            </div>
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
    );

    if (!user || (user.role !== 'super_admin' && user.role !== 'org_admin' && user.role !== 'course_provider')) return null;

    const roleLabel: Record<string, string> = {
        super_admin: t('roleSuperAdmin'),
        org_admin: t('roleOrgAdmin'),
        course_provider: t('roleCourseProvider'),
    };

    return (
        <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto w-full">

            {/* Welcome Section */}
            <div className="flex flex-col gap-1 md:flex-row md:items-end justify-between bg-card/50 backdrop-blur-sm rounded-xl p-6 border shadow-sm shadow-black/5 dark:shadow-none">
                <div>
                    <div className="flex items-center gap-2 text-sm text-primary font-medium mb-1">
                        <ShieldCheck className="size-4" />
                        {roleLabel[user.role] || user.role}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {t('welcomeBack', { name: user.first_name })}
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                        {t('welcomeDesc')}
                    </p>
                </div>
                {user.role === 'super_admin' && parseInt(reqsCount) > 0 && (
                    <Link href="/admin/training-requests">
                        <Button variant="destructive" className="mt-4 md:mt-0 gap-2 shadow-sm shadow-black/5 dark:shadow-none">
                            <Clock className="size-4" />
                            {t('pendingRequests', { count: reqsCount })}
                        </Button>
                    </Link>
                )}
            </div>

            {/* SUPER ADMIN DASHBOARD */}
            {user.role === 'super_admin' && (
                <>
                    {/* Summary Cards */}
                    <AnimatedSection delay={0.1}><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <SummaryCard icon={<Users className="size-4" />} label={t('totalUsers')} value={(overview?.total_users ?? analytics?.users.total ?? 0).toLocaleString()} sub={t('activeAcrossPlatform')} color="blue" />
                        <SummaryCard icon={<Building2 className="size-4" />} label={t('organizations')} value={(overview?.total_organizations ?? parseInt(orgsCount) ?? 0).toLocaleString()} sub={t('registeredPartners')} color="green" />
                        <SummaryCard icon={<GraduationCap className="size-4" />} label={t('totalCourses')} value={(overview?.total_courses ?? parseInt(coursesCount) ?? 0).toLocaleString()} sub={t('availableForEnrollment')} color="purple" />
                        <SummaryCard icon={<FileText className="size-4" />} label={t('totalEnrollments')} value={(overview?.total_enrollments ?? 0).toLocaleString()} sub={t('acrossAllCourses')} color="amber" />
                        <SummaryCard icon={<Award className="size-4" />} label={t('completions')} value={(overview?.total_completions ?? 0).toLocaleString()} sub={t('courseCompletions')} color="emerald" />
                        <SummaryCard icon={<FileCheck className="size-4" />} label={t('certificatesIssued')} value={(overview?.total_certificates ?? analytics?.certificates.total ?? 0).toLocaleString()} sub={t('certificatesIssued')} color="rose" />
                    </div></AnimatedSection>

                    {/* Growth Charts */}
                    <AnimatedSection delay={0.2}><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp className="size-4" /></div>
                                    <div>
                                        <CardTitle>{t('enrollmentGrowth')}</CardTitle>
                                        <CardDescription>{t('monthlyEnrollmentTrend')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {enrollmentGrowth.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={enrollmentGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name={t('enrollments')} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">{t('noEnrollmentData')}</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp className="size-4" /></div>
                                    <div>
                                        <CardTitle>{t('userGrowth')}</CardTitle>
                                        <CardDescription>{t('monthlyNewUserTrend')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {userGrowth.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={userGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name={t('users')} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">{t('noUserGrowthData')}</div>
                                )}
                            </CardContent>
                        </Card>
                    </div></AnimatedSection>

                    {/* Course Performance & Top Courses */}
                    <AnimatedSection delay={0.3}><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><GraduationCap className="size-4" /></div>
                                    <div>
                                        <CardTitle>{t('coursePerformance')}</CardTitle>
                                        <CardDescription>{t('enrollmentVsCompletion')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {comparison.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={comparison.slice(0, 8).map(c => ({
                                                ...c,
                                                short_title: c.course_title.length > 18
                                                    ? c.course_title.slice(0, 16) + '…'
                                                    : c.course_title,
                                            }))}
                                            margin={{ bottom: 40 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="short_title"
                                                tick={{ fontSize: 10 }}
                                                angle={-25}
                                                textAnchor="end"
                                                height={80}
                                                interval={0}
                                            />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="total_enrolled" fill="#2563eb" name={t('enrolled')} radius={[2, 2, 0, 0]} />
                                            <Bar dataKey="completed" fill="#10b981" name={t('completed')} radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">{t('noCourseData')}</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Award className="size-4" /></div>
                                    <div>
                                        <CardTitle>{t('topPerformingCourses')}</CardTitle>
                                        <CardDescription>{t('highestEnrollmentCourses')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {topCourses.length > 0 ? (
                                    <div className="space-y-3">
                                        {topCourses.slice(0, 7).map((course, idx) => {
                                            const maxEnroll = Math.max(...topCourses.map(c => c.total_enrolled));
                                            const pct = maxEnroll > 0 ? (course.total_enrolled / maxEnroll) * 100 : 0;
                                            return (
                                                <div key={course.course_id} className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}.</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="truncate font-medium text-foreground">{course.course_title}</span>
                                                            <span className="font-bold text-primary">{course.total_enrolled}</span>
                                                        </div>
                                                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">{t('noCourseData')}</div>
                                )}
                            </CardContent>
                        </Card>
                    </div></AnimatedSection>

                    {/* Filters & Course Comparison */}
                    <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                        <CardHeader>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><TrendingUp className="size-4" /></div>
                                    <div>
                                        <CardTitle>{t('courseComparison')}</CardTitle>
                                        <CardDescription>{t('compareEnrollmentMetrics')}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="block rounded-lg border border-border py-1.5 px-3 text-xs shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card" placeholder={t('from')} />
                                    <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="block rounded-lg border border-border py-1.5 px-3 text-xs shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card" placeholder={t('to')} />
                                    <select value={filterCourseIds} onChange={e => setFilterCourseIds(e.target.value)} className="block rounded-lg border border-border py-1.5 px-3 text-xs shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card">
                                        <option value="">{t('courseComparison')}</option>
                                        {allCourses.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                    <Button variant="outline" size="sm" onClick={handleApplyFilter}>{t('apply')}</Button>
                                    {/* <Button variant="outline" size="sm" onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setFilterCourseIds(''); }}>Reset</Button> */}
                                    <Button variant="default" size="sm" className="gap-2" onClick={exportCSV} disabled={!comparison.length}>
                                        <Download className="size-4" /> {t('exportCsv')}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {comparison.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="py-3 px-4 font-medium">{t('course')}</th>
                                                <th className="py-3 px-4 font-medium text-right">{t('enrolled')}</th>
                                                <th className="py-3 px-4 font-medium text-right">{t('completed')}</th>
                                                <th className="py-3 px-4 font-medium text-right">{t('completionRate')}</th>
                                                <th className="py-3 px-4 font-medium text-right">{t('certificatesIssued')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comparison.map(c => (
                                                <tr key={c.course_id} className="border-b hover:bg-muted/30 transition-colors">
                                                    <td className="py-3 px-4 font-medium text-foreground">
                                                        <Link href={`/admin/courses/${c.course_id}/analytics`} className="hover:text-primary transition-colors">
                                                            {c.course_title}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold">{c.total_enrolled.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-right">{c.completed.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className={`font-semibold ${c.completion_rate >= 50 ? 'text-green-600' : c.completion_rate >= 25 ? 'text-amber-600' : 'text-red-600'}`}>
                                                            {c.completion_rate}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">{c.certificates_issued.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">{t('noCourseComparisonData')}</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Platform Engagement (existing) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp className="size-4" /></div>
                                    <div>
                                        <CardTitle>{t('platformEngagement')}</CardTitle>
                                        <CardDescription>{t('learningProgressAcrossUsers')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                {analytics ? (
                                    <>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-muted-foreground font-medium">{t('totalEnrollments')}</span>
                                                <span className="font-bold">{analytics.enrollments.total.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-blue-500" style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-muted-foreground font-medium">{t('averageProgress')}</span>
                                                <span className="font-bold">{Math.round(analytics.enrollments.average_progress)}%</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.round(analytics.enrollments.average_progress)}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-muted-foreground font-medium">{t('averageQuizScore')}</span>
                                                <span className="font-bold">{Math.round(analytics.assessments.average_score)}%</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${Math.round(analytics.assessments.average_score)}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-muted-foreground font-medium">{t('certificatesIssued')}</span>
                                                <span className="font-bold">{analytics.certificates.total.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, Math.round((analytics.certificates.total / (analytics.enrollments.total || 1)) * 100))}%` }} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-sm text-center py-8">{t('loadingAnalytics')}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm shadow-black/5 dark:shadow-none flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Building2 className="size-4" /></div>
                                    <div>
                                        <CardTitle>{t('recentOrganizations')}</CardTitle>
                                        <CardDescription>{t('latestOnboardedPartners')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                <div className="divide-y">
                                    {recentOrgs.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground text-sm">{t('noRecentData')}</div>
                                    ) : recentOrgs.map(org => (
                                        <div key={org.id} className="p-4 px-6 hover:bg-muted/50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs">
                                                    {org.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-foreground">{org.name}</span>
                                                    <span className="text-xs text-muted-foreground">{t('joinedDate', { date: new Date(org.created_at).toLocaleDateString() })}</span>
                                                </div>
                                            </div>
                                            <Link href={`/admin/organizations`}>
                                                <Button variant="outline" size="sm">{t('manage')}</Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* {t('quickActions')} Grid */}
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-4 px-1">{t('quickActions')}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {[
                                { href: '/admin/users', icon: <Users className="size-5 text-blue-500 mb-1" />, label: t('manageUsers') },
                                { href: '/admin/organization-applications', icon: <FileCheck className="size-5 text-green-500 mb-1" />, label: t('orgApplications') },
                                { href: '/admin/courses', icon: <GraduationCap className="size-5 text-purple-500 mb-1" />, label: t('coursesAndContent') },
                                { href: '/admin/campaigns', icon: <Megaphone className="size-5 text-orange-500 mb-1" />, label: t('campaigns') },
                                { href: '/admin/audit-logs', icon: <ShieldAlert className="size-5 text-red-500 mb-1" />, label: t('auditLogs') },
                                { href: '/admin/awareness-tools', icon: <ShieldCheck className="size-5 text-teal-500 mb-1" />, label: t('awarenessTools') },
                            ].map(item => (
                                <Link key={item.href} href={item.href}>
                                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center hover:border-primary hover:bg-primary/5 w-full">
                                        {item.icon}
                                        <span className="text-xs">{item.label}</span>
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ORG ADMIN DASHBOARD */}
            {user.role === 'org_admin' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('organizationMembers')}</CardTitle>
                                <Users className="size-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{orgsCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('availableCourses')}</CardTitle>
                                <GraduationCap className="size-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{coursesCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('trainingRequests')}</CardTitle>
                                <FileText className="size-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reqsCount}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <Link href="/admin/users">
                            <div className="flex h-16 items-center px-4 rounded-xl bg-card border border-border shadow-sm cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-primary/50 w-full group">
                                <Users className="size-5 text-blue-500 mr-3 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">{t('members')}</span>
                                    <span className="text-[10px] text-muted-foreground">{t('manageOrgUsers')}</span>
                                </div>
                            </div>
                        </Link>
                        <Link href="/admin/training-requests">
                            <div className="flex h-16 items-center px-4 rounded-xl bg-card border border-border shadow-sm cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-primary/50 w-full group">
                                <FileText className="size-5 text-amber-500 mr-3 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">{t('requests')}</span>
                                    <span className="text-[10px] text-muted-foreground">{t('requestCustomTraining')}</span>
                                </div>
                            </div>
                        </Link>
                        <Link href="/admin/reports">
                            <div className="flex h-16 items-center px-4 rounded-xl bg-card border border-border shadow-sm cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-primary/50 w-full group">
                                <TrendingUp className="size-5 text-purple-500 mr-3 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">{t('reports')}</span>
                                    <span className="text-[10px] text-muted-foreground">{t('complianceAndProgress')}</span>
                                </div>
                            </div>
                        </Link>
                        <Link href="/admin/campaigns">
                            <div className="flex h-16 items-center px-4 rounded-xl bg-card border border-border shadow-sm cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md hover:border-primary/50 w-full group">
                                <Megaphone className="size-5 text-orange-500 mr-3 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">{t('campaigns')}</span>
                                    <span className="text-[10px] text-muted-foreground">{t('awarenessCommunications')}</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </>
            )}

            {/* COURSE PROVIDER DASHBOARD */}
            {user.role === 'course_provider' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('myCourses')}</CardTitle>
                                <GraduationCap className="size-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{coursesCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalResources')}</CardTitle>
                                <BookOpen className="size-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{resourcesCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('assessments')}</CardTitle>
                                <FileCheck className="size-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">—</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('articles')}</CardTitle>
                                <FileText className="size-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">—</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-4 bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl text-sm flex gap-3 shadow-sm shadow-black/5 dark:shadow-none">
                        <ShieldAlert className="size-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-amber-500 font-semibold block mb-1">{t('contentApprovalWorkflow')}</strong>
                            <span className="text-amber-500/80 leading-relaxed">
                                {t('contentApprovalDesc')}
                            </span>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}
