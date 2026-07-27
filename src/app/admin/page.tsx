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
        super_admin: 'System Administrator',
        org_admin: 'Organization Administrator',
        course_provider: 'Course Provider',
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
                        Welcome back, {user.first_name}
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                        Here is your personalized dashboard overview. Monitor platform activity, manage content, and oversee organizational health from one central location.
                    </p>
                </div>
                {user.role === 'super_admin' && parseInt(reqsCount) > 0 && (
                    <Link href="/admin/training-requests">
                        <Button variant="destructive" className="mt-4 md:mt-0 gap-2 shadow-sm shadow-black/5 dark:shadow-none">
                            <Clock className="size-4" />
                            {reqsCount} Pending Requests
                        </Button>
                    </Link>
                )}
            </div>

            {/* SUPER ADMIN DASHBOARD */}
            {user.role === 'super_admin' && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <SummaryCard icon={<Users className="size-4" />} label="Total Users" value={(overview?.total_users ?? analytics?.users.total ?? 0).toLocaleString()} sub="Active across platform" color="blue" />
                        <SummaryCard icon={<Building2 className="size-4" />} label="Organizations" value={(overview?.total_organizations ?? parseInt(orgsCount) ?? 0).toLocaleString()} sub="Registered partners" color="green" />
                        <SummaryCard icon={<GraduationCap className="size-4" />} label="Total Courses" value={(overview?.total_courses ?? parseInt(coursesCount) ?? 0).toLocaleString()} sub="Available for enrollment" color="purple" />
                        <SummaryCard icon={<FileText className="size-4" />} label="Total Enrollments" value={(overview?.total_enrollments ?? 0).toLocaleString()} sub="Across all courses" color="amber" />
                        <SummaryCard icon={<Award className="size-4" />} label="Completions" value={(overview?.total_completions ?? 0).toLocaleString()} sub="Course completions" color="emerald" />
                        <SummaryCard icon={<FileCheck className="size-4" />} label="Certificates" value={(overview?.total_certificates ?? analytics?.certificates.total ?? 0).toLocaleString()} sub="Certificates issued" color="rose" />
                    </div>

                    {/* Growth Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp className="size-4" /></div>
                                    <div>
                                        <CardTitle>Enrollment Growth</CardTitle>
                                        <CardDescription>Monthly enrollment trend (last 12 months)</CardDescription>
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
                                            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Enrollments" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No enrollment data available</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp className="size-4" /></div>
                                    <div>
                                        <CardTitle>User Growth</CardTitle>
                                        <CardDescription>Monthly new user registrations (last 12 months)</CardDescription>
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
                                            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Users" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No user growth data available</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Course Performance & Top Courses */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><GraduationCap className="size-4" /></div>
                                    <div>
                                        <CardTitle>Course Performance</CardTitle>
                                        <CardDescription>Enrollment vs completion across courses</CardDescription>
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
                                            <Bar dataKey="total_enrolled" fill="#2563eb" name="Enrolled" radius={[2, 2, 0, 0]} />
                                            <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No course data available</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Award className="size-4" /></div>
                                    <div>
                                        <CardTitle>Top Performing Courses</CardTitle>
                                        <CardDescription>Highest enrollment courses</CardDescription>
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
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No course data available</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters & Course Comparison */}
                    <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                        <CardHeader>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><TrendingUp className="size-4" /></div>
                                    <div>
                                        <CardTitle>Course Comparison</CardTitle>
                                        <CardDescription>Compare enrollment metrics across courses</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="block rounded-lg border border-border py-1.5 px-3 text-xs shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card" placeholder="From" />
                                    <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="block rounded-lg border border-border py-1.5 px-3 text-xs shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card" placeholder="To" />
                                    <select value={filterCourseIds} onChange={e => setFilterCourseIds(e.target.value)} className="block rounded-lg border border-border py-1.5 px-3 text-xs shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card">
                                        <option value="">All Courses</option>
                                        {allCourses.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                    <Button variant="outline" size="sm" onClick={handleApplyFilter}>Apply</Button>
                                    {/* <Button variant="outline" size="sm" onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setFilterCourseIds(''); }}>Reset</Button> */}
                                    <Button variant="default" size="sm" className="gap-2" onClick={exportCSV} disabled={!comparison.length}>
                                        <Download className="size-4" /> Export CSV
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
                                                <th className="py-3 px-4 font-medium">Course</th>
                                                <th className="py-3 px-4 font-medium text-right">Enrolled</th>
                                                <th className="py-3 px-4 font-medium text-right">Completed</th>
                                                <th className="py-3 px-4 font-medium text-right">Completion Rate</th>
                                                <th className="py-3 px-4 font-medium text-right">Certificates</th>
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
                                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No course comparison data available. Try adjusting filters.</div>
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
                                        <CardTitle>Platform Engagement</CardTitle>
                                        <CardDescription>Learning progress across all users</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                {analytics ? (
                                    <>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-muted-foreground font-medium">Total Enrollments</span>
                                                <span className="font-bold">{analytics.enrollments.total.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-blue-500" style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-muted-foreground font-medium">Average Progress</span>
                                                <span className="font-bold">{Math.round(analytics.enrollments.average_progress)}%</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.round(analytics.enrollments.average_progress)}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-muted-foreground font-medium">Average Quiz Score</span>
                                                <span className="font-bold">{Math.round(analytics.assessments.average_score)}%</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${Math.round(analytics.assessments.average_score)}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="text-muted-foreground font-medium">Certificates Issued</span>
                                                <span className="font-bold">{analytics.certificates.total.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, Math.round((analytics.certificates.total / (analytics.enrollments.total || 1)) * 100))}%` }} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-sm text-center py-8">Loading analytics...</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm shadow-black/5 dark:shadow-none flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Building2 className="size-4" /></div>
                                    <div>
                                        <CardTitle>Recent Organizations</CardTitle>
                                        <CardDescription>Latest onboarded partners</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                <div className="divide-y">
                                    {recentOrgs.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground text-sm">No recent data available.</div>
                                    ) : recentOrgs.map(org => (
                                        <div key={org.id} className="p-4 px-6 hover:bg-muted/50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs">
                                                    {org.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-foreground">{org.name}</span>
                                                    <span className="text-xs text-muted-foreground">Joined {new Date(org.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <Link href={`/admin/organizations`}>
                                                <Button variant="outline" size="sm">Manage</Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions Grid */}
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-4 px-1">Quick Actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {[
                                { href: '/admin/users', icon: <Users className="size-5 text-blue-500 mb-1" />, label: 'Manage Users' },
                                { href: '/admin/organization-applications', icon: <FileCheck className="size-5 text-green-500 mb-1" />, label: 'Org Applications' },
                                { href: '/admin/courses', icon: <GraduationCap className="size-5 text-purple-500 mb-1" />, label: 'Courses & Content' },
                                { href: '/admin/campaigns', icon: <Megaphone className="size-5 text-orange-500 mb-1" />, label: 'Campaigns' },
                                { href: '/admin/audit-logs', icon: <ShieldAlert className="size-5 text-red-500 mb-1" />, label: 'Audit Logs' },
                                { href: '/admin/awareness-tools', icon: <ShieldCheck className="size-5 text-teal-500 mb-1" />, label: 'Awareness Tools' },
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
                                <CardTitle className="text-sm font-medium text-muted-foreground">Organization Members</CardTitle>
                                <Users className="size-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{orgsCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Available Courses</CardTitle>
                                <GraduationCap className="size-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{coursesCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Training Requests</CardTitle>
                                <FileText className="size-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reqsCount}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <Link href="/admin/memberships">
                            <Button variant="outline" className="h-16 justify-start px-4 hover:border-primary w-full">
                                <Users className="size-5 text-blue-500 mr-3" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm">Members</span>
                                    <span className="text-[10px] text-muted-foreground">Manage organization users</span>
                                </div>
                            </Button>
                        </Link>
                        <Link href="/admin/training-requests">
                            <Button variant="outline" className="h-16 justify-start px-4 hover:border-primary w-full">
                                <FileText className="size-5 text-amber-500 mr-3" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm">Requests</span>
                                    <span className="text-[10px] text-muted-foreground">Request custom training</span>
                                </div>
                            </Button>
                        </Link>
                        <Link href="/admin/reports">
                            <Button variant="outline" className="h-16 justify-start px-4 hover:border-primary w-full">
                                <TrendingUp className="size-5 text-purple-500 mr-3" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm">Reports</span>
                                    <span className="text-[10px] text-muted-foreground">Compliance & progress</span>
                                </div>
                            </Button>
                        </Link>
                        <Link href="/admin/campaigns">
                            <Button variant="outline" className="h-16 justify-start px-4 hover:border-primary w-full">
                                <Megaphone className="size-5 text-orange-500 mr-3" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm">Campaigns</span>
                                    <span className="text-[10px] text-muted-foreground">Awareness communications</span>
                                </div>
                            </Button>
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
                                <CardTitle className="text-sm font-medium text-muted-foreground">My Courses</CardTitle>
                                <GraduationCap className="size-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{coursesCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Resources</CardTitle>
                                <BookOpen className="size-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{resourcesCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Assessments</CardTitle>
                                <FileCheck className="size-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">—</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm shadow-black/5 dark:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Articles</CardTitle>
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
                            <strong className="text-amber-500 font-semibold block mb-1">Content Approval Workflow</strong>
                            <span className="text-amber-500/80 leading-relaxed">
                                Draft → Submit for Review → Submitted (pending) → Approve / Reject. Course providers can submit content for review; System Administrators can approve or reject with a reason. Rejected content returns to Draft with feedback. Archived content can be restored to Draft.
                            </span>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}
