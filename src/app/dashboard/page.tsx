'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiFetch, enrollInCourse, getEnrollments, getCourses, getAlerts, createTrainingRequest, getTrainingRequests } from '@/lib/api';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { StatCard } from '@/components/StatCard';
import { AnimatedSection } from '@/components/AnimatedSection';
import { EmptyState } from '@/components/EmptyState';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { LinkifyText } from '@/components/LinkifyText';

interface Enrollment {
 id: string;
 course: {
 id: string;
 title: string;
 level?: string;
 };
 progress: number;
 last_accessed: string;
}

interface Alert {
 id: string;
 title: string;
 message: string;
 severity: string;
 published_at: string;
}

interface Course {
 id: string;
 title: string;
 description: string;
 level: string;
 status: string;
 thumbnail_url?: string;
 payment_type?: string;
 course_price?: string;
 currency?: string;
}

export default function DashboardPage() {
 const { user, isAuthenticated, isLoading } = useAuth();
 const router = useRouter();
 const t = useTranslations('dashboard');
 const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
 const [alerts, setAlerts] = useState<Alert[]>([]);
 const [isFetching, setIsFetching] = useState(true);
 const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
 const [actionLoading, setActionLoading] = useState<string | null>(null);
 const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
 const [myRequests, setMyRequests] = useState<any[]>([]);
 const [requestFormData, setRequestFormData] = useState({
 description: '',
 attachment_url: ''
 });
 const [error, setError] = useState('');
 const [showProfileModal, setShowProfileModal] = useState(false);

 useEffect(() => {
 if (!isLoading) {
 if (!isAuthenticated) {
 router.push('/login');
 return;
 }
 if (user?.role === 'super_admin' || user?.role === 'org_admin' || user?.role === 'course_provider') {
 router.push('/admin');
 return;
 }
 fetchDashboardData();
 fetchMyRequests();
 const interval = setInterval(fetchDashboardData, 60000);
 return () => clearInterval(interval);
 }
 }, [isAuthenticated, isLoading, user, router]);

 const fetchDashboardData = async () => {
 setIsFetching(true);
 const [enrollRes, alertsRes, coursesRes] = await Promise.all([
 apiFetch('/api/v1/enrollments/?page_size=100'),
 apiFetch('/api/v1/alerts/?page_size=5'),
 apiFetch('/api/v1/courses/?page_size=100')
 ]);

 if (enrollRes.data?.results) setEnrollments(enrollRes.data.results);
 else if (Array.isArray(enrollRes.data)) setEnrollments(enrollRes.data);

 if (alertsRes.data?.results) setAlerts(alertsRes.data.results);
 else if (Array.isArray(alertsRes.data)) setAlerts(alertsRes.data);

 let availableCourses: any[] = [];
 if (coursesRes.data?.results) availableCourses = coursesRes.data.results;
 else if (Array.isArray(coursesRes.data)) availableCourses = coursesRes.data;

 // Hydrate enrollments with full course data for real-time title/thumbnail
 if (availableCourses.length > 0) {
 setEnrollments(prev => prev.reduce((acc: any[], e: any) => {
 const cId = typeof e.course === 'object' ? e.course.id : e.course;
 const fullCourse = availableCourses.find(c => c.id === cId);
 if (fullCourse) {
 acc.push({ ...e, course: fullCourse });
 }
 return acc;
 }, []));

 const enrolledCourseIds = new Set(
 (enrollRes.data?.results || (Array.isArray(enrollRes.data) ? enrollRes.data : []))
 .map((e: any) => typeof e.course === 'object' ? e.course.id : e.course)
 );
 setRecommendedCourses(
 availableCourses.filter((c: any) => !enrolledCourseIds.has(c.id) && c.status === 'published')
 );
 }

 setIsFetching(false);
 };

 const fetchMyRequests = async () => {
 const { data } = await getTrainingRequests();
 if (data?.results) setMyRequests(data.results);
 else if (Array.isArray(data)) setMyRequests(data);
 };

 const handleEnroll = async (courseId: string) => {
 if (!user) return;
 setActionLoading(courseId);
 setError('');
 const { data, error: err, status } = await enrollInCourse(courseId, user.id);
 if (status === 400 && (data as any)?.status === 'profile_required') {
 setShowProfileModal(true);
 setActionLoading(null);
 return;
 }
 if (err || (status !== 200 && status !== 201)) {
 setError(err || 'Failed to enroll. You might already be enrolled.');
 } else {
 fetchDashboardData();
 }
 setActionLoading(null);
 };

 const handleRequestSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setActionLoading('request');

 const payload: any = {
 description: requestFormData.description,
 organization: (user as any)?.organization_id || (user as any)?.organization,
 attachment_url: requestFormData.attachment_url || ""
 };

 const { error: err, status, data } = await createTrainingRequest(payload) as any;

 if (err || status !== 201) {
 setError(err || (data ? JSON.stringify(data) : 'Failed to submit training request.'));
 } else {
 setIsRequestModalOpen(false);
 setRequestFormData({ description: '', attachment_url: '' });
 fetchMyRequests();
 }
 setActionLoading(null);
 };

 if (isLoading || !isAuthenticated) return null;
 if (user && (user.role === 'super_admin' || user.role === 'org_admin' || user.role === 'course_provider')) {
 return (
 <div className="flex justify-center items-center min-h-screen">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
 </div>
 );
 }

 const fullName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email || 'User';

 const stats = {
 totalCourses: enrollments.length,
 completedCourses: enrollments.filter(e => e.progress === 100).length,
 avgProgress: enrollments.length > 0
 ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
 : 0
 };

 return (
 <>
 <div className="w-full pb-10">
 <div className="max-w-7xl mx-auto">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
 <div>
 <h1 className="text-3xl font-bold text-primary mb-1">{t('welcomeBack', { name: user?.first_name || t('user') })}</h1>
 <p className="text-muted-foreground">
 {t.rich('activeSessions', { count: enrollments.filter(e => e.progress < 100).length, span: (chunks) => <span className="font-bold text-orange-500">{chunks}</span> })}
 </p>
 </div>
 <button className="bg-card border border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-green-50 transition-colors shadow-sm shadow-black/5 dark:shadow-none relative overflow-hidden group cursor-pointer">
 <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
 <span className="relative z-10">{t('liveDashboard')} &bull; {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
 <div className="absolute inset-0 bg-green-50/0 group-hover:bg-green-50/50 transition-colors"></div>
 </button>
 </div>

 {/* Global Alert Banner */}
 <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-sm shadow-black/5 dark:shadow-none relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-orange-100 dark:from-orange-500/20 to-transparent pointer-events-none"></div>
 <div className="w-10 h-10 rounded-full bg-card text-orange-500 flex items-center justify-center shrink-0 shadow-sm shadow-black/5 dark:shadow-none mt-0.5">
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
 </svg>
 </div>
 <div className="flex-1 relative z-10">
 <div className="flex items-center gap-3 mb-1">
 <h3 className="font-bold text-foreground">{alerts[0]?.title || t('nationalThreatAdvisory')}</h3>
 <span className="bg-orange-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">{t('actionRequired')}</span>
 </div>
 <p className="text-sm text-foreground max-w-4xl">
 {alerts[0]?.message || 'Phishing campaigns targeting public sector employees increased by 42%. Verify all communications immediately through the official portal.'}
 </p>
 </div>
 <Link href="/dashboard/alerts" className="relative z-10">
 <button className="bg-card border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-50 dark:hover:bg-orange-500/10 shrink-0 mt-2 sm:mt-0 cursor-pointer">
 {t('viewBriefing')}
 </button>
 </Link>
 </div>
 </div>

 <div className="max-w-7xl mx-auto mt-8">
 {error && (
 <div role="alert" className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-8 flex items-center justify-between">
 <span>{error}</span>
 <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 p-0.5 cursor-pointer" aria-label="Dismiss error">
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>
 )}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Left Column (Main Content) */}
 <div className="lg:col-span-2 space-y-8">
 <AnimatedSection delay={0.1}>
 <div className="grid grid-cols-3 gap-4">
 <StatCard
 icon={
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
 </svg>
 }
 label={t('enrolled')}
 value={stats.totalCourses}
 color="blue"
 />
 <StatCard
 icon={
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 }
 label={t('completed')}
 value={stats.completedCourses}
 color="green"
 />
 <StatCard
 icon={
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
 </svg>
 }
 label={t('avgProgress')}
 value={`${stats.avgProgress}%`}
 color="purple"
 />
 </div>
 </AnimatedSection>

 {/* Stats Row */}
 <AnimatedSection delay={0.2}>
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-lg font-bold text-foreground">{t('resumingCourses')}</h2>
 <Link href="/courses/enrolled" className="text-xs font-bold text-primary hover:underline">{t('seeAllEnrolled')}</Link>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {enrollments.slice(0, 2).map((enrollment: any, idx) => {
 const courseId = typeof enrollment.course === 'object' ? enrollment.course.id : enrollment.course;
 const resumeUrl = `/courses/${courseId}`;

 return (
 <Link key={enrollment.id} href={resumeUrl} className="bg-card rounded-2xl p-6 border border-border hover:shadow-md shadow-black/10 dark:shadow-none hover:border-primary/30 transition-all group flex gap-4 cursor-pointer relative overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
 <div className="w-16 h-16 shrink-0 bg-muted/50 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-red-50 transition-all overflow-hidden border border-gray-50">
 {enrollment.course?.thumbnail_url ? (
 <img src={enrollment.course.thumbnail_url} alt={typeof enrollment.course === 'object' ? enrollment.course.title : 'Course thumbnail'} className="w-full h-full object-cover" />
 ) : (
 <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
 </svg>
 )}
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{typeof enrollment.course === 'object' ? enrollment.course.title : t('researchingCourse')}</h4>
 <p className="text-xs text-muted-foreground mb-2">{t('progress', { progress: enrollment.progress })}</p>
 <div className="w-full bg-muted/50 rounded-full h-1.5 mb-1 overflow-hidden">
 <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${enrollment.progress}%` }}></div>
 </div>
 <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-2">
 <span>{t('completedPercent', { progress: enrollment.progress })}</span>
 <span className="text-primary group-hover:underline cursor-pointer">{t('resume')}</span>
 </div>
 </div>
 </Link>
 );
 })}
 {enrollments.length === 0 && !isFetching && (
 <div className="md:col-span-2">
 <EmptyState
 icon={
 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
 </svg>
 }
 title={t('noCoursesEnrolled')}
 action={{ label: t('exploreCourses'), onClick: () => router.push('/courses') }}
 />
 </div>
 )}
 </div>
 </AnimatedSection>

 {/* Recommended Courses */}
 <AnimatedSection delay={0.3}>
 <div>
 <div className="flex justify-between items-center mb-4">
 <div className="flex items-center gap-2">
 <h2 className="text-lg font-bold text-foreground border-l-4 border-orange-500 pl-3">{t('topRecommendations')}</h2>
 <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-bold">{recommendedCourses.length}</span>
 </div>
 <Link href="/courses" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">{t('viewFullCatalog')}</Link>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 {recommendedCourses.map((course) => (
 <div key={course.id} className="bg-card rounded-2xl border border-border shadow-sm shadow-black/5 dark:shadow-none overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
 <div className="h-32 bg-secondary relative overflow-hidden border-b border-border flex items-center justify-center">
 {course.thumbnail_url ? (
 <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
 ) : (
 <>
 <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0MCcgaGVpZ2h0PSc0MCc+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSdncmFkMScgeDE9JzAlJyB5MT0nMCUnIHgyPScxMDAlJyB5Mj0nMCUnPjxzdG9wIG9mZnNldD0nMCUnIHN0eWxlPSdzdG9wLWNvbG9yOiNmZmY7c3RvcC1vcGFjaXR5OjEuMCcgLz48c3RvcCBvZmZzZXQ9JzEwMCUnIHN0eWxlPSdzdG9wLWNvbG9yOiMwMDA7c3RvcC1vcGFjaXR5OjEuMCcgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0nNDAnJyBoZWlnaHQ9JzQwJScgZmlsbD0ndXJsKCNncmFkMSknIGZpbGwtb3BhY2l0eT0nMC4xJy8+PC9zdmc+')] mix-blend-overlay"></div>
 <div className="w-24 h-24 border-[8px] border-blue-500/80 rounded-full border-t-transparent animate-spin-slow"></div>
 </>
 )}

 <div className="absolute bottom-3 left-3 flex gap-2">
 <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm shadow-black/5 dark:shadow-none">{t('new')}</span>
 <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm shadow-sm shadow-black/5 dark:shadow-none ${(course as any).level === 'beginner' ? 'bg-green-500/50' : (course as any).level === 'medium' ? 'bg-yellow-500/50' : 'bg-red-500/50'
 }`}>
 {(course as any).level || 'beginner'}
 </span>
 </div>
 </div>
 <div className="p-5 flex flex-col flex-1">
 <h3 className="font-bold text-foreground mb-2">{course.title}</h3>
 <p className="text-xs text-muted-foreground mb-6 flex-1 line-clamp-2">
 <LinkifyText text={course.description} />
 </p>
 {(course as any).payment_type === 'paid' ? (
 <div className="w-full bg-muted text-muted-foreground border border-border py-2.5 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2">
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
 {t('lockedPrice', { currency: course.currency || 'ETB', price: course.course_price ?? 0 })}
 </div>
 ) : (
 <button
 onClick={() => handleEnroll(course.id)}
 disabled={actionLoading === course.id}
 className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm shadow-black/5 dark:shadow-none disabled:opacity-50 cursor-pointer"
 >
 {actionLoading === course.id ? t('enrolling') : t('enrollNow')}
 </button>
 )}
 </div>
 </div>
 ))}
 {recommendedCourses.length === 0 && !isFetching && (
 <div className="sm:col-span-2">
 <EmptyState
 icon={
 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 }
 title={t('noNewRecommendations')}
 description={t('checkBackLater')}
 />
 </div>
 )}
 </div>
 </div>
 </AnimatedSection>
</div>

 {/* Right Column (Sidebar) */}
 <div className="lg:col-span-1 space-y-8">
 {/* Quick Actions */}
 <AnimatedSection delay={0.4}>
 <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-4">{t('quickActions')}</h2>
 <div className="space-y-3">
 <Link href="/tools/phishing" className="bg-card border text-left border-border p-4 rounded-xl flex items-center gap-4 hover:border-primary/30 hover:shadow-sm shadow-black/5 dark:shadow-none cursor-pointer transition-all group w-full cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
 <div className="w-10 h-10 rounded-full bg-red-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
 </svg>
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-foreground text-sm">{t('phishingTest')}</h4>
 <p className="text-xs text-muted-foreground">{t('phishingTestDesc')}</p>
 </div>
 <svg className="w-4 h-4 text-gray-300 group-hover:text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </Link>

 <Link href="/tools/password-strength" className="bg-card border text-left border-border p-4 rounded-xl flex items-center gap-4 hover:border-primary/30 hover:shadow-sm shadow-black/5 dark:shadow-none cursor-pointer transition-all group w-full cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
 </svg>
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-foreground text-sm">{t('passwordCheck')}</h4>
 <p className="text-xs text-muted-foreground">{t('passwordCheckDesc')}</p>
 </div>
 <svg className="w-4 h-4 text-gray-300 group-hover:text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </Link>

 <div className="bg-card border text-left border-border p-4 rounded-xl flex items-center gap-4 hover:border-primary/30 hover:shadow-sm shadow-black/5 dark:shadow-none cursor-pointer transition-all group w-full cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out" onClick={() => setIsRequestModalOpen(true)}>
 <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors shrink-0">
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
 </svg>
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-foreground text-sm">{t('requestTraining')}</h4>
 <p className="text-xs text-muted-foreground">{t('requestTrainingDesc')}</p>
 </div>
 <svg className="w-4 h-4 text-gray-300 group-hover:text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </div>
 </div>
 </AnimatedSection>

 {/* Recent Requests Status */}
 {myRequests.length > 0 && (
 <div>
 <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-4">{t('myRequests')}</h2>
 <div className="space-y-3">
 {myRequests.slice(0, 3).map(req => (
 <div key={req.id} className="bg-card border border-border p-4 rounded-xl shadow-sm shadow-black/5 dark:shadow-none">
 <div className="flex justify-between items-start mb-1">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[120px]">
 <LinkifyText text={req.description} />
 </span>
 <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${req.status === 'approved' ? 'bg-green-50 text-green-600' :
 req.status === 'rejected' ? 'bg-red-50 text-red-600' :
 'bg-yellow-50 text-yellow-600'
 }`}>
 {req.status || 'pending'}
 </span>
 </div>
 <p className="text-[10px] text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Latest Intelligence */}
 <div>
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-sm font-bold text-primary tracking-wider uppercase">{t('latestIntelligence')}</h2>
 <button className="text-muted-foreground hover:text-muted-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" aria-label="Refresh intelligence">
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
 </svg>
 </button>
 </div>
 <div className="bg-card border border-border rounded-2xl p-5 shadow-sm shadow-black/5 dark:shadow-none relative hover:shadow-md shadow-black/10 dark:shadow-none transition-shadow cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
 <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gray-50 flex justify-end p-2 rounded-tr-2xl text-gray-300 pointer-events-none">
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
 </svg>
 </div>

 <div className="space-y-4">
 {alerts.slice(0, 3).map((alert, i) => (
 <div key={alert.id} className={i !== 2 ? "border-b border-border pb-4" : ""}>
 <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
 <span className={alert.severity === 'high' ? 'text-red-500' : 'text-primary'}>
 {alert.severity}
 </span>
 <span>{new Date(alert.published_at).toLocaleDateString()}</span>
 </div>
 <p className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-200 cursor-pointer leading-tight transition-colors line-clamp-2">
 {alert.title}
 </p>
 </div>
 ))}
 {alerts.length === 0 && !isFetching && (
 <p className="text-xs text-muted-foreground text-center py-4">{t('noActiveAdvisories')}</p>
 )}
 </div>

 <div className="mt-5 pt-4 border-t border-border text-center">
 <Link href="/alerts" className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:underline">
 {t('viewFullIntelBriefing')}
 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </Link>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <Modal
 isOpen={isRequestModalOpen}
 onClose={() => setIsRequestModalOpen(false)}
 title={t('requestCustomTraining')}
 >
 <form onSubmit={handleRequestSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">
 {t('trainingDescription')}
 </label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 min-h-[120px]"
 placeholder={t('trainingDescPlaceholder')}
 value={requestFormData.description}
 onChange={(e) => setRequestFormData({ ...requestFormData, description: e.target.value })}
 required
 />
 </div>

 <div className="space-y-1">
 <label className="block text-sm font-semibold text-foreground mb-1">
 {t('supportingDocument')}
 </label>
 <CloudinaryUpload
 onUploadSuccess={(url) => setRequestFormData({ ...requestFormData, attachment_url: url })}
 />
 {requestFormData.attachment_url && (
 <p className="text-xs text-green-600 font-medium flex items-center gap-1">
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 </svg>
 {t('fileUploadedSuccess')}
 </p>
 )}
 </div>

 <div className="pt-4 flex justify-end gap-3">
 <Button type="button" variant="outline" onClick={() => setIsRequestModalOpen(false)} disabled={actionLoading === 'request'}>
 {t('cancel')}
 </Button>
 <Button type="submit" variant="primary" disabled={actionLoading === 'request'}>
 {actionLoading === 'request' ? t('submitting') : t('submitRequest')}
 </Button>
 </div>
 </form>
 </Modal>

 <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title={t('completeYourProfile')}>
 <div className="text-center py-4">
 <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
 <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
 </svg>
 </div>
 <h3 className="text-lg font-bold text-foreground mb-2">{t('profileRequired')}</h3>
 <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
 {t('profileRequiredDesc')}
 </p>
 <div className="flex flex-col gap-3">
 <Button
 variant="primary"
 onClick={() => {
 setShowProfileModal(false);
 router.push('/profile');
 }}
 className="w-full py-3"
 >
 {t('completeProfileBtn')}
 </Button>
 <Button
 variant="secondary"
 onClick={() => setShowProfileModal(false)}
 className="w-full py-3"
 >
 {t('cancel')}
 </Button>
 </div>
 </div>
 </Modal>
 </>
 );
}
