'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { getCourse, getCourseWorkspaceAnalytics } from '@/lib/api';
import type { CourseWorkspaceAnalytics } from '@/lib/api';
import {
    Users, GraduationCap, Award, CheckCircle, BarChart3,
    TrendingUp, Target, BookOpen,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line,
} from 'recharts';

function StatCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
    return (
        <Card className="hover:border-primary/50 transition-colors shadow-sm">
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

export default function CourseAnalytics() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<any>(null);
    const [analytics, setAnalytics] = useState<CourseWorkspaceAnalytics | null>(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (user?.role !== 'super_admin' && user?.role !== 'org_admin' && user?.role !== 'course_provider')
                router.push('/dashboard');
            else fetchData();
        }
    }, [isAuthenticated, isLoading, user, courseId]);

    const fetchData = async () => {
        setIsFetching(true);
        const [courseRes, analyticsRes] = await Promise.all([
            getCourse(courseId),
            getCourseWorkspaceAnalytics(courseId),
        ]);
        if (courseRes.data) setCourse(courseRes.data);
        if (analyticsRes.data) setAnalytics(analyticsRes.data);
        setIsFetching(false);
    };

    if (!user || !['super_admin', 'org_admin', 'course_provider'].includes(user.role)) return null;

    if (isLoading || isFetching) return (
        <div className="flex flex-col gap-6 w-full">
            <Skeleton className="h-[100px] w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[130px] rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-[300px] rounded-xl" />
            </div>
        </div>
    );

    if (!course) return <div className="p-8 text-center text-red-500">Course not found.</div>;

    const s = analytics?.summary;
    const lo = analytics?.learner_overview;

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Course Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-t-4 border-t-primary">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-500 text-sm">Course analytics and performance metrics</p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 flex-wrap">
                    <div className="text-sm">
                        <span className="text-gray-400 font-medium">Level:</span>
                        <span className="ml-2 capitalize font-bold text-gray-700">{course.level}</span>
                    </div>
                    <div className="text-sm">
                        <span className="text-gray-400 font-medium">Language:</span>
                        <span className="ml-2 uppercase font-bold text-gray-700">{course.language}</span>
                    </div>
                    <div className="text-sm">
                        <span className="text-gray-400 font-medium">Modules:</span>
                        <span className="ml-2 font-bold text-gray-700">{course.modules?.length || 0}</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard icon={<Users className="size-4" />} label="Enrolled" value={s?.total_enrolled?.toLocaleString() || '0'} sub="Total learners" color="blue" />
                <StatCard icon={<TrendingUp className="size-4" />} label="Active" value={s?.active?.toLocaleString() || '0'} sub="In progress" color="amber" />
                <StatCard icon={<CheckCircle className="size-4" />} label="Completed" value={s?.completed?.toLocaleString() || '0'} sub="Fully completed" color="green" />
                <StatCard icon={<Target className="size-4" />} label="Completion" value={s ? `${s.completion_percentage}%` : '0%'} sub="Rate" color="purple" />
                <StatCard icon={<Award className="size-4" />} label="Certificates" value={s?.certificates_issued?.toLocaleString() || '0'} sub="Issued" color="emerald" />
                <StatCard icon={<BarChart3 className="size-4" />} label="Avg Score" value={s ? `${s.average_assessment_score}%` : '0%'} sub="Assessments" color="rose" />
            </div>

            {/* Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-md"><TrendingUp className="size-4" /></div>
                            <div>
                                <CardTitle>Enrollment Trend</CardTitle>
                                <CardDescription>Monthly enrollments (last 6 months)</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {analytics?.enrollment_trend && analytics.enrollment_trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={analytics.enrollment_trend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Enrollments" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">No enrollment trend data available</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-100 text-green-600 rounded-md"><Award className="size-4" /></div>
                            <div>
                                <CardTitle>Completion Trend</CardTitle>
                                <CardDescription>Monthly completions (last 6 months)</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {analytics?.completion_trend && analytics.completion_trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={analytics.completion_trend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Completions" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">No completion trend data available</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Learner Overview */}
            <Card className="shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-md"><Users className="size-4" /></div>
                        <div>
                            <CardTitle>Learner Overview</CardTitle>
                            <CardDescription>Summary of learner progress in this course</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {lo ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 rounded-xl p-5 text-center border border-blue-100">
                                <div className="text-3xl font-bold text-blue-600">{lo.total.toLocaleString()}</div>
                                <p className="text-sm text-blue-700 font-medium mt-1">Total Learners</p>
                                <p className="text-xs text-blue-500 mt-1">All enrolled users</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-5 text-center border border-green-100">
                                <div className="text-3xl font-bold text-green-600">{lo.completed.toLocaleString()}</div>
                                <p className="text-sm text-green-700 font-medium mt-1">Completed</p>
                                <p className="text-xs text-green-500 mt-1">Finished the course</p>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-5 text-center border border-amber-100">
                                <div className="text-3xl font-bold text-amber-600">{lo.in_progress.toLocaleString()}</div>
                                <p className="text-sm text-amber-700 font-medium mt-1">In Progress</p>
                                <p className="text-xs text-amber-500 mt-1">Still actively learning</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[150px] text-muted-foreground text-sm">No learner data available</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
