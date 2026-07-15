'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getCertificates, Certificate } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { LinkifyText } from '@/components/LinkifyText';

interface Module { id: string; title: string; description?: string; order?: number; }
interface Course { id: string; title: string; description?: string; difficulty?: string; level?: string; language?: string; status?: string; }
interface Enrollment { id: string; user: string; course: string; progress: number; status: string; }

export default function CourseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollSuccess, setEnrollSuccess] = useState('');
    const [enrollError, setEnrollError] = useState('');
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [certificate, setCertificate] = useState<Certificate | null>(null);


    useEffect(() => {
        if (id) fetchCourseData();
    }, [id]);

    const fetchCourseData = async () => {
        setIsLoading(true);
        const [courseRes, enrollRes] = await Promise.all([
            apiFetch(`/api/v1/courses/${id}/`),
            // Filter by course to avoid fetching all enrollments client-side
            isAuthenticated ? apiFetch(`/api/v1/enrollments/?course=${id}`) : Promise.resolve({ data: null })
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
            const foundEnrollment = results[0] || null; // already filtered by course
            setIsEnrolled(!!foundEnrollment);
            setEnrollment(foundEnrollment);

            // If enrolled and completed, fetch certificate
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
        // Build a verification URL using the public certificate_id token
        window.open(`/verify/${certificate.certificate_id}`, '_blank');
    };


    const handleEnroll = async () => {
        if (!isAuthenticated) { router.push('/login'); return; }
        setIsEnrolling(true); setEnrollError('');

        // Per API docs: only send user + course. Backend defaults progress=0, status=in_progress
        const { data, error: e, status } = await apiFetch('/api/v1/enrollments/', {
            method: 'POST',
            body: JSON.stringify({
                user: user?.id,
                course: id
            })
        });

        if (status === 400 && (data as any)?.status === 'profile_required') {
            // Public user must complete their background profile before enrolling
            router.push('/profile/background?next=' + encodeURIComponent(`/courses/${id}`));
            return;
        }

        if (e || (status !== 200 && status !== 201)) {
            setEnrollError(e || 'Enrollment failed. You may already be enrolled.');
        } else {
            setEnrollSuccess('You have been successfully enrolled! 🎉');
            setIsEnrolled(true);
            setEnrollment(data as Enrollment);
        }
        setIsEnrolling(false);
    };


    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Hero */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 lg:px-12 py-10">
                    <Link href="/courses" className="text-sm text-gray-500 hover:text-primary mb-4 inline-flex items-center gap-1 transition-colors">
                        ← Back to Training
                    </Link>
                    <div className="flex items-start justify-between gap-6 mt-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                {course.difficulty && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${difficultyColor[diff] || 'bg-gray-100 text-gray-600'}`}>
                                        {course.difficulty}
                                    </span>
                                )}
                                {course.language && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium uppercase">{course.language}</span>
                                )}
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900">{course.title}</h1>
                            {course.description && <p className="mt-3 text-gray-600 leading-relaxed"><LinkifyText text={course.description} /></p>}
                        </div>
                        <div className="shrink-0 w-64 space-y-3">
                            {enrollSuccess || isEnrolled ? (
                                <>
                                    <div className="bg-green-50 text-green-700 border border-green-100 rounded-xl p-4 text-sm text-center font-medium">
                                        {enrollSuccess || 'You are enrolled in this course ✅'}
                                    </div>

                                    {/* Always visible for enrolled learners — discovery page handles exam lookup */}
                                    <Link href={`/courses/${id}/exam`}>
                                        <Button variant="primary" className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
                                            🎓 Take Certificate Exam
                                        </Button>
                                    </Link>

                                    {enrollment?.status === 'completed' && (
                                        <Button variant="outline" onClick={handleDownloadCertificate} className="w-full mt-2 border-green-200 text-green-700 hover:bg-green-50">
                                            🏆 {certificate ? 'View Certificate' : 'Certificate Issued'}
                                        </Button>
                                    )}

                                </>
                            ) : (
                                <>
                                    {enrollError && <p className="text-xs text-red-600 mb-2">{enrollError}</p>}
                                    <Button variant="primary" disabled={isEnrolling} onClick={handleEnroll} className="w-full py-4 text-lg shadow-lg shadow-primary/20">
                                        {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules */}
            <div className="max-w-5xl mx-auto px-6 lg:px-12 mt-10">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Course Modules
                    <span className="text-sm font-normal text-gray-500 ml-2">({modules.length})</span>
                </h2>

                {modules.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6 text-4xl grayscale filter">📚</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Modules Available</h3>
                        <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                            This course currently doesn't have any modules. Our training team is working on the content. Please check back soon!
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
                                    className="block bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:border-primary/40 hover:shadow-md transition-all group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{module.title}</h3>
                                        {module.description && <p className="text-sm text-gray-500 mt-1"><LinkifyText text={module.description} /></p>}
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-300 group-hover:text-primary uppercase tracking-widest hidden sm:block">Start Reading</span>
                                        <span className="text-gray-300 group-hover:text-primary">→</span>
                                    </div>
                                </Link>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
