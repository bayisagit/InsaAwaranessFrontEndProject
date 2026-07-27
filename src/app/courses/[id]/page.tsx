'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { apiFetch, getCertificates, Certificate } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { LinkifyText } from '@/components/LinkifyText';

interface ModuleItem { id: string; title: string; description?: string; order?: number; }
interface Course { id: string; title: string; description?: string; difficulty?: string; level?: string; language?: string; status?: string; thumbnail_url?: string; modules?: ModuleItem[]; }
interface Enrollment { id: string; user: string; course: string; progress: number; status: string; }

export default function CourseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollSuccess, setEnrollSuccess] = useState('');
    const [enrollError, setEnrollError] = useState('');
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);


    useEffect(() => {
        if (id) fetchCourseData();
    }, [id]);

    const fetchCourseData = async () => {
        setIsLoading(true);
        const [courseRes, enrollRes] = await Promise.all([
            apiFetch(`/api/v1/courses/${id}/`),
            isAuthenticated ? apiFetch(`/api/v1/enrollments/?course=${id}&user=${user!.id}`) : Promise.resolve({ data: null })
        ]);

        if (courseRes.error) {
            setError(courseRes.error);
        } else if (courseRes.data) {
            setCourse(courseRes.data);
            if (Array.isArray(courseRes.data.modules)) {
                setModules(courseRes.data.modules);
            }
        }

        if (enrollRes?.data) {
            const results = enrollRes.data.results || (Array.isArray(enrollRes.data) ? enrollRes.data : []);
            const foundEnrollment = results[0] || null;
            setIsEnrolled(!!foundEnrollment);
            setEnrollment(foundEnrollment);

            if (foundEnrollment?.status === 'completed') {
                getCertificates({ enrollment: foundEnrollment.id }).then(certRes => {
                    const certs = certRes.data?.results ?? [];
                    if (certs.length > 0) setCertificate(certs[0]);
                }).catch(() => {});
            }
        }

        setIsLoading(false);
    };


    const handleDownloadCertificate = async () => {
        if (!certificate?.certificate_id) return;
        window.open(`/verify/${certificate.certificate_id}`, '_blank');
    };


    const handleEnroll = async () => {
        if (!isAuthenticated) {
            router.push(`/login?next=${encodeURIComponent(`/courses/${id}`)}`);
            return;
        }
        setIsEnrolling(true); setEnrollError('');

        const { data, error: e, status } = await apiFetch('/api/v1/enrollments/', {
            method: 'POST',
            body: JSON.stringify({
                user: user?.id,
                course: id
            })
        });

        if (status === 400 && (data as any)?.status === 'profile_required') {
            setShowProfileModal(true);
            setIsEnrolling(false);
            return;
        }

        if (e || (status !== 200 && status !== 201)) {
            setEnrollError(e || 'Enrollment failed. You may already be enrolled.');
        } else {
            setEnrollSuccess('You have been successfully enrolled!');
            setIsEnrolled(true);
            setEnrollment(data as Enrollment);
        }
        setIsEnrolling(false);
    };


    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 font-medium">{error || 'Course not found.'}</p>
                    <Link href="/courses" className="mt-4 text-primary hover:underline block">← Back to Courses</Link>
                </div>
            </div>
        );
    }

    const difficultyColor: Record<string, string> = { beginner: 'bg-green-50 text-green-700', medium: 'bg-yellow-50 text-yellow-700', advanced: 'bg-red-50 text-red-700' };
    const diff = course.difficulty?.toLowerCase() || '';

    return (
        <div className="min-h-screen bg-muted pb-20">
            {/* Hero */}
            <div className="bg-card border-b border-border">
                <div className="max-w-5xl mx-auto px-6 lg:px-12 py-10">
                    <Link href="/courses" className="text-sm text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1 transition-colors">
                        ← Back to Training
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 mt-2">
                        {/* Left: Thumbnail */}
                        <div className="lg:col-span-2">
                            {course.thumbnail_url ? (
                                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg shadow-black/10 dark:shadow-none border border-border bg-muted">
                                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg shadow-black/10 dark:shadow-none border border-border bg-gradient-to-br from-primary/5 to-blue-500/5 flex items-center justify-center">
                                    <GraduationCap className="w-16 h-16 text-primary/30" />
                                </div>
                            )}
                        </div>

                        {/* Right: Content */}
                        <div className="lg:col-span-3 flex flex-col justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    {course.language && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                            {course.language}
                                        </span>
                                    )}
                                    {course.difficulty && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${difficultyColor[diff] || 'bg-muted/50 text-muted-foreground'}`}>
                                            {course.difficulty}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground leading-tight max-w-2xl">{course.title}</h1>
                                {course.description && (
                                    <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
                                        <LinkifyText text={course.description} />
                                    </p>
                                )}
                            </div>

                            {/* Enrollment CTA */}
                            <div className="pt-2">
                                {enrollSuccess || isEnrolled ? (
                                    <div className="space-y-3">
                                        <div className="bg-green-50 text-green-700 border border-green-100 rounded-xl p-4 text-sm text-center font-medium">
                                            {enrollSuccess || 'You are enrolled in this course'}
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Link href={`/courses/${id}/exam`} className="flex-1">
                                                <Button variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
                                                    Take Certificate Exam
                                                </Button>
                                            </Link>
                                            {enrollment?.status === 'completed' && (
                                                <Button variant="outline" onClick={handleDownloadCertificate} className="flex-1 border-green-200 text-green-700 hover:bg-green-50">
                                                    {certificate ? 'View Certificate' : 'Certificate Issued'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-md">
                                        {enrollError && <p className="text-xs text-red-600 mb-2">{enrollError}</p>}
                                        <Button variant="primary" disabled={isEnrolling} onClick={handleEnroll} className="w-full py-4 text-lg rounded-xl shadow-lg shadow-black/10 dark:shadow-none shadow-primary/20">
                                            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                                            {!isEnrolling && <ArrowRight className="ml-2 size-5 inline" />}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Non-enrolled landing section */}
            {!isEnrolled && (
                <div className="max-w-5xl mx-auto px-6 lg:px-12 mt-10 space-y-10">
                    {/* Course Overview */}
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-4">Course Overview</h2>
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm shadow-black/5 dark:shadow-none">
                            <p className="text-muted-foreground leading-relaxed">
                                {course.description || 'This course provides comprehensive training on the subject. Enroll to access the full curriculum, interactive lessons, and assessment materials.'}
                            </p>
                        </div>
                    </div>

                    {/* Learning Objectives */}
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-4">Learning Objectives</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                'Understand fundamental concepts and best practices',
                                'Develop practical skills through hands-on exercises',
                                'Apply knowledge to real-world scenarios',
                                'Assess your understanding with quizzes and exams',
                            ].map((objective, i) => (
                                <div key={i} className="flex items-start gap-3 bg-card rounded-xl border border-border p-4 shadow-sm shadow-black/5 dark:shadow-none">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-foreground font-medium">{objective}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Enroll CTA */}
                    <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-3xl border border-primary/10 p-10 text-center shadow-sm shadow-black/5 dark:shadow-none">
                        <h3 className="text-2xl font-bold text-foreground mb-3">Ready to Get Started?</h3>
                        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                            Enroll in this course to access all modules, lessons, and assessment materials.
                        </p>
                        <Button variant="primary" disabled={isEnrolling} onClick={handleEnroll} className="px-10 py-4 text-lg shadow-xl shadow-primary/20">
                            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Enrolled modules */}
            {isEnrolled && (
                <div className="max-w-5xl mx-auto px-6 lg:px-12 mt-10">
                    <h2 className="text-xl font-bold text-foreground mb-6">
                        Course Modules
                        <span className="text-sm font-normal text-muted-foreground ml-2">({modules.length})</span>
                    </h2>

                    {modules.length === 0 ? (
                        <div className="bg-card rounded-2xl border border-border p-16 text-center shadow-sm shadow-black/5 dark:shadow-none">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6 text-4xl grayscale filter">
                                <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No Modules Available</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                This course currently doesn&apos;t have any modules. Our training team is working on the content. Please check back soon!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {modules
                                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                .map((module, i) => (
                                    <Link
                                        key={module.id}
                                        href={`/courses/${id}/modules/${module.id}`}
                                        className="block bg-card rounded-xl border border-border p-5 flex items-start gap-4 hover:border-primary/40 hover:shadow-md shadow-black/10 dark:shadow-none transition-all group"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{module.title}</h3>
                                            {module.description && <p className="text-sm text-muted-foreground mt-1"><LinkifyText text={module.description} /></p>}
                                        </div>
                                        <div className="ml-auto flex items-center gap-2 shrink-0">
                                            <span className="text-xs font-bold text-gray-300 group-hover:text-primary uppercase tracking-widest hidden sm:block">Start Reading</span>
                                            <span className="text-gray-300 group-hover:text-primary">→</span>
                                        </div>
                                    </Link>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* Profile Completion Modal */}
            <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="Complete Your Profile">
                <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Profile Required</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                        Please complete your background profile before enrolling in this course.
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
                            Complete Profile
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setShowProfileModal(false)}
                            className="w-full py-3"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
