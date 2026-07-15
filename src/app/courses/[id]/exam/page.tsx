'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getCertificateExams, CertificateExam } from '@/lib/api';
import { AssessmentViewer } from '@/components/AssessmentViewer';

export default function CourseExamDiscoveryPage() {
    const { id: courseId } = useParams<{ id: string }>();
    const router = useRouter();
    const [exam, setExam] = useState<CertificateExam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (courseId) findExam();
    }, [courseId]);

    const findExam = async () => {
        setIsLoading(true);

        // Try direct listing first (works if user has admin/provider role)
        const listRes = await getCertificateExams({ course: courseId, page_size: 10 });
        const results = (listRes.data as any)?.results ?? (Array.isArray(listRes.data) ? listRes.data : []);

        if (Array.isArray(results) && results.length > 0) {
            setExam(results[0]);
            setIsLoading(false);
            return;
        }

        // Fallback: try a learner-accessible endpoint (some APIs expose exam info via enrollment/course)
        const courseRes = await apiFetch<any>(`/api/v1/courses/${courseId}/`);
        const certExamId = courseRes.data?.certificate_exam?.id ?? courseRes.data?.certificate_exam;
        if (certExamId) {
            const examRes = await apiFetch<CertificateExam>(`/api/v1/certificate-exams/${certExamId}/`);
            if (examRes.data) {
                setExam(examRes.data);
                setIsLoading(false);
                return;
            }
        }

        setNotFound(true);
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-gray-500 font-medium">Loading exam…</p>
            </div>
        );
    }

    if (notFound || !exam) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-6">📋</div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-3">No Exam Available</h2>
                    <p className="text-gray-500 mb-6">
                        This course doesn't have a certificate exam yet, or it hasn't been published.
                        Please check back later or contact your administrator.
                    </p>
                    <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                        ← Back to Course
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <Link href={`/courses/${courseId}`} className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-2 mb-2">
                            ← Exit Exam
                        </Link>
                        <h1 className="text-3xl font-extrabold text-gray-900">{exam.title}</h1>
                        <p className="text-gray-500 mt-1">Course Certification Assessment</p>
                    </div>
                    <div className="bg-orange-50 text-orange-700 px-5 py-3 rounded-2xl border border-orange-100 flex items-center gap-3">
                        <span className="text-2xl">🏆</span>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-400">Passing Score</span>
                            <span className="font-extrabold text-lg">{exam.passing_score ?? 70}%</span>
                        </div>
                    </div>
                </header>

                <AssessmentViewer
                    certificateExamId={exam.id}
                    onComplete={() => { /* results shown inline by AssessmentViewer */ }}
                />

                <footer className="mt-10 text-center text-gray-400 text-sm">
                    Score {exam.passing_score ?? 70}% or higher to earn your certificate.
                </footer>
            </div>
        </div>
    );
}
