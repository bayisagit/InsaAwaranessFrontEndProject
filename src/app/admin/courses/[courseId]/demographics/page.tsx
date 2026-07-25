'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { getCourse, getCourseEnrollmentDemographics } from '@/lib/api';
import type { DemographicDistribution } from '@/lib/api';
import {
    Users, Globe, Briefcase, Calendar, PieChart as PieChartIcon, Building2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#06b6d4", "#d946ef"];

function ChartCard({ title, description, icon, children, color }: {
    title: string; description: string; icon: React.ReactNode; children: React.ReactNode; color: string;
}) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className={`p-2 bg-${color}-100 text-${color}-600 rounded-md`}>{icon}</div>
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function renderBarChart(data: Record<string, number>) {
    const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
    if (chartData.length === 0) return <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No data</div>;
    return (
        <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[3, 3, 0, 0]} name="Count" />
            </BarChart>
        </ResponsiveContainer>
    );
}

function renderPieChart(data: Record<string, number>) {
    const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
    if (chartData.length === 0) return <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No data</div>;
    return (
        <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function CourseDemographics() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<any>(null);
    const [demographics, setDemographics] = useState<DemographicDistribution | null>(null);
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
        const [courseRes, demoRes] = await Promise.all([
            getCourse(courseId),
            getCourseEnrollmentDemographics(courseId),
        ]);
        if (courseRes.data) setCourse(courseRes.data);
        if (demoRes.data) setDemographics(demoRes.data);
        setIsFetching(false);
    };

    if (!user || !['super_admin', 'org_admin', 'course_provider'].includes(user.role)) return null;

    if (isLoading || isFetching) return (
        <div className="flex flex-col gap-6 w-full">
            <Skeleton className="h-[100px] w-full rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[320px] rounded-xl" />)}
            </div>
        </div>
    );

    if (!course) return <div className="p-8 text-center text-red-500">Course not found.</div>;

    const d = demographics;

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Course Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-t-4 border-t-primary">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-500 text-sm">Learner demographic distribution for this course</p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 flex-wrap items-center">
                    <div className="text-sm">
                        <span className="text-gray-400 font-medium">Level:</span>
                        <span className="ml-2 capitalize font-bold text-gray-700">{course.level}</span>
                    </div>
                    <div className="text-sm">
                        <span className="text-gray-400 font-medium">Language:</span>
                        <span className="ml-2 uppercase font-bold text-gray-700">{course.language}</span>
                    </div>
                    <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        {d?.total_enrolled ?? 0} learners with demographic data
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Nationality" description="Learner nationality distribution" icon={<Globe className="size-4" />} color="blue">
                    {d ? renderBarChart(d.nationality) : <Skeleton className="h-[260px]" />}
                </ChartCard>

                <ChartCard title="Employment Status" description="Current employment situation" icon={<Briefcase className="size-4" />} color="amber">
                    {d ? renderPieChart(d.employment_status) : <Skeleton className="h-[260px]" />}
                </ChartCard>

                <ChartCard title="Age Range" description="Learner age group distribution" icon={<Calendar className="size-4" />} color="purple">
                    {d ? renderBarChart(d.age_range) : <Skeleton className="h-[260px]" />}
                </ChartCard>

                <ChartCard title="Gender" description="Gender distribution of learners" icon={<PieChartIcon className="size-4" />} color="rose">
                    {d ? renderPieChart(d.gender) : <Skeleton className="h-[260px]" />}
                </ChartCard>
            </div>

            {/* Organization Breakdown — full width */}
            <ChartCard title="Organization Breakdown" description="Learner organization affiliation" icon={<Building2 className="size-4" />} color="teal">
                {d ? renderBarChart(d.organizations) : <Skeleton className="h-[260px]" />}
            </ChartCard>
        </div>
    );
}
