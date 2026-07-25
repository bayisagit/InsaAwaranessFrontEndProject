'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';

export default function DashboardCoursesPage() {
    const { user, isAuthenticated } = useAuth();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthenticated) fetchEnrollments();
    }, [isAuthenticated]);

    const fetchEnrollments = async () => {
        setIsLoading(true);
        const [enrollRes, coursesRes] = await Promise.all([
            apiFetch('/api/v1/enrollments/'),
            apiFetch('/api/v1/courses/')
        ]);

        let allCourses: any[] = [];
        if (coursesRes.data?.results) allCourses = coursesRes.data.results;
        else if (Array.isArray(coursesRes.data)) allCourses = coursesRes.data;

        let enrollmentData = enrollRes.data?.results || (Array.isArray(enrollRes.data) ? enrollRes.data : []);

        if (allCourses.length > 0) {
            enrollmentData = enrollmentData.map((e: any) => {
                const cId = typeof e.course === 'object' ? e.course.id : e.course;
                const fullCourse = allCourses.find(c => c.id === cId);
                return fullCourse ? { ...e, course: fullCourse } : e;
            });
        }

        setEnrollments(enrollmentData);
        if (enrollRes.error) setError(enrollRes.error);

        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">My Enrolled Courses</h1>
                    <p className="text-gray-500 mt-1">Manage and track your active training sessions</p>
                </div>
                <Link href="/courses">
                    <Button variant="primary" className="rounded-full px-6">Explore Catalog</Button>
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-8">
                    {error}
                </div>
            )}

            {enrollments.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center shadow-sm">
                    <div className="text-6xl mb-6 grayscale opacity-30">📚</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No active enrollments</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                        You haven't enrolled in any courses yet. Start your journey by exploring our course catalog.
                    </p>
                    <Link href="/dashboard/catalog">
                        <Button variant="primary" className="px-8 rounded-full shadow-lg">Browse Catalog</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {enrollments.map((enrollment) => {
                        const course = enrollment.course || {};
                        const courseId = typeof course === 'object' ? course.id : course;
                        const resumeUrl = `/courses/${courseId}`;

                        return (
                            <div key={enrollment.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all group flex flex-col">
                                <div className="relative h-40 bg-gray-100">
                                    {course.thumbnail_url ? (
                                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-100 to-gray-50 text-gray-200 group-hover:scale-110 transition-transform duration-500">
                                            📖
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{course.level || 'Beginner'}</span>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-1">{course.title || 'Course Details'}</h3>
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-xs font-semibold text-gray-500">Progress</span>
                                        <span className="text-xs font-bold text-primary">{enrollment.progress}%</span>
                                    </div>

                                    <div className="w-full bg-gray-50 h-2 rounded-full mb-8 overflow-hidden">
                                        <div
                                            className="bg-primary h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${enrollment.progress}%` }}
                                        />
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            ID: {courseId?.substring(0, 8)}...
                                        </div>
                                        <Link href={resumeUrl}>
                                            <Button variant="outline" className="text-xs px-5 rounded-full hover:bg-primary hover:text-white border-primary/30 text-primary font-bold transition-all">
                                                Resume &rarr;
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
