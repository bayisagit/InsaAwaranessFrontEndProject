'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCourses, getOrganizations, getTrainingRequests, getResources, getAnalyticsDashboard, Organization } from '@/lib/api';
import type { AnalyticsDashboard } from '@/lib/api';
import { 
  Users, Building2, GraduationCap, FileText, 
  ShieldAlert, Award, FileCheck, BookOpen, Clock, ArrowRight,
  TrendingUp, Megaphone, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const ProgressBar = ({ label, value, pct, colorClass }: { label: string; value: string; pct: number; colorClass: string }) => {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground font-medium">{label}</span>
                <span className="font-bold">{value}</span>
            </div>
            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

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
        <div className="flex flex-col gap-6 w-full mt-4">
            <Skeleton className="h-[120px] w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)}
            </div>
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
            <div className="flex flex-col gap-1 md:flex-row md:items-end justify-between bg-white/50 backdrop-blur-sm rounded-xl p-6 border shadow-sm">
                <div>
                    <div className="flex items-center gap-2 text-sm text-primary font-medium mb-1">
                        <ShieldCheck className="size-4" />
                        {roleLabel[user.role] || user.role}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Welcome back, {user.first_name}
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                        Here is your personalized dashboard overview. Monitor platform activity, manage content, and oversee organizational health from one central location.
                    </p>
                </div>
                {user.role === 'super_admin' && parseInt(reqsCount) > 0 && (
                    <Button variant="destructive" className="mt-4 md:mt-0 gap-2 shadow-sm" asChild>
                        <Link href="/admin/training-requests">
                            <Clock className="size-4" />
                            {reqsCount} Pending Requests
                        </Link>
                    </Button>
                )}
            </div>

            {/* SUPER ADMIN DASHBOARD */}
            {user.role === 'super_admin' && (
                <>
                    {/* Primary Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                                <Users className="size-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics?.users.total.toLocaleString() || '0'}</div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <TrendingUp className="size-3 text-green-500" /> Active across platform
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Organizations</CardTitle>
                                <Building2 className="size-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{orgsCount}</div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <TrendingUp className="size-3 text-green-500" /> Registered partners
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
                                <GraduationCap className="size-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{coursesCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Available for enrollment
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Resources</CardTitle>
                                <BookOpen className="size-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{resourcesCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Toolkits & guidelines
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Platform Overview */}
                        <Card className="shadow-sm flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                                        <TrendingUp className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle>Platform Engagement</CardTitle>
                                        <CardDescription>Learning progress across all users</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                {analytics ? (
                                    <>
                                        <ProgressBar 
                                            label="Total Enrollments" 
                                            value={analytics.enrollments.total.toLocaleString()} 
                                            pct={100} 
                                            colorClass="bg-blue-500" 
                                        />
                                        <ProgressBar 
                                            label="Average Progress" 
                                            value={`${Math.round(analytics.enrollments.average_progress)}%`} 
                                            pct={Math.round(analytics.enrollments.average_progress)} 
                                            colorClass="bg-green-500" 
                                        />
                                        <ProgressBar 
                                            label="Average Quiz Score" 
                                            value={`${Math.round(analytics.assessments.average_score)}%`} 
                                            pct={Math.round(analytics.assessments.average_score)} 
                                            colorClass="bg-purple-500" 
                                        />
                                        <ProgressBar 
                                            label="Certificates Issued" 
                                            value={analytics.certificates.total.toLocaleString()} 
                                            pct={Math.min(100, Math.round((analytics.certificates.total / (analytics.enrollments.total || 1)) * 100))} 
                                            colorClass="bg-amber-500" 
                                        />
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-sm text-center py-8">Loading analytics...</p>
                                )}
                            </CardContent>
                            <CardFooter className="pt-4 border-t bg-muted/20">
                                <Button variant="ghost" className="w-full text-sm h-8" asChild>
                                    <Link href="/admin/reports">View Detailed Reports <ArrowRight className="ml-2 size-4" /></Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Recent Organizations */}
                        <Card className="shadow-sm flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-md">
                                        <Building2 className="size-4" />
                                    </div>
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
                                                    <span className="text-sm font-medium text-gray-900">{org.name}</span>
                                                    <span className="text-xs text-muted-foreground">Joined {new Date(org.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/organizations`}>Manage</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t bg-muted/20">
                                <Button variant="ghost" className="w-full text-sm h-8" asChild>
                                    <Link href="/admin/organizations">View All Organizations <ArrowRight className="ml-2 size-4" /></Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Quick Actions Grid */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Quick Actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center hover:border-primary hover:bg-primary/5" asChild>
                                <Link href="/admin/users">
                                    <Users className="size-5 text-blue-500 mb-1" />
                                    <span className="text-xs">Manage Users</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center hover:border-primary hover:bg-primary/5" asChild>
                                <Link href="/admin/organization-applications">
                                    <FileCheck className="size-5 text-green-500 mb-1" />
                                    <span className="text-xs">Org Applications</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center hover:border-primary hover:bg-primary/5" asChild>
                                <Link href="/admin/courses">
                                    <GraduationCap className="size-5 text-purple-500 mb-1" />
                                    <span className="text-xs">Courses & Content</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center hover:border-primary hover:bg-primary/5" asChild>
                                <Link href="/admin/campaigns">
                                    <Megaphone className="size-5 text-orange-500 mb-1" />
                                    <span className="text-xs">Campaigns</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center hover:border-primary hover:bg-primary/5" asChild>
                                <Link href="/admin/audit-logs">
                                    <ShieldAlert className="size-5 text-red-500 mb-1" />
                                    <span className="text-xs">Audit Logs</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center hover:border-primary hover:bg-primary/5" asChild>
                                <Link href="/admin/awareness-tools">
                                    <ShieldCheck className="size-5 text-teal-500 mb-1" />
                                    <span className="text-xs">Awareness Tools</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* ORG ADMIN DASHBOARD */}
            {user.role === 'org_admin' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Organization Members</CardTitle>
                                <Users className="size-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{orgsCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Available Courses</CardTitle>
                                <GraduationCap className="size-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{coursesCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
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
                        <Button variant="outline" className="h-16 justify-start px-4 hover:border-primary" asChild>
                            <Link href="/admin/memberships">
                                <Users className="size-5 text-blue-500 mr-3" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm">Members</span>
                                    <span className="text-[10px] text-muted-foreground">Manage organization users</span>
                                </div>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-16 justify-start px-4 hover:border-primary" asChild>
                            <Link href="/admin/training-requests">
                                <FileText className="size-5 text-amber-500 mr-3" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm">Requests</span>
                                    <span className="text-[10px] text-muted-foreground">Request custom training</span>
                                </div>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-16 justify-start px-4 hover:border-primary" asChild>
                            <Link href="/admin/reports">
                                <TrendingUp className="size-5 text-purple-500 mr-3" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm">Reports</span>
                                    <span className="text-[10px] text-muted-foreground">Compliance & progress</span>
                                </div>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-16 justify-start px-4 hover:border-primary" asChild>
                            <Link href="/admin/campaigns">
                                <Megaphone className="size-5 text-orange-500 mr-3" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm">Campaigns</span>
                                    <span className="text-[10px] text-muted-foreground">Awareness communications</span>
                                </div>
                            </Link>
                        </Button>
                    </div>
                </>
            )}

            {/* COURSE PROVIDER DASHBOARD */}
            {user.role === 'course_provider' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">My Courses</CardTitle>
                                <GraduationCap className="size-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{coursesCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Resources</CardTitle>
                                <BookOpen className="size-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{resourcesCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Assessments</CardTitle>
                                <FileCheck className="size-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">—</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Articles</CardTitle>
                                <FileText className="size-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">—</div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="mt-4 bg-amber-50/50 border border-amber-200/60 p-5 rounded-xl text-sm flex gap-3 shadow-sm">
                        <ShieldAlert className="size-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-amber-800 font-semibold block mb-1">Content Approval Workflow</strong>
                            <span className="text-amber-700/80 leading-relaxed">
                                Draft → Submit for Review → System Admin Approval → Published. You cannot publish content directly — all courses and resources must be approved by a System Administrator.
                            </span>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}
