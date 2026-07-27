'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { getCourse } from '@/lib/api';
import { ModulesManager } from '@/components/admin/ModulesManager';
import { AssessmentsManager } from '@/components/admin/AssessmentsManager';

export default function CourseWorkspacePage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (user?.role !== 'super_admin' && user?.role !== 'org_admin' && user?.role !== 'course_provider')
                router.push('/dashboard');
            else fetchCourseData();
        }
    }, [isAuthenticated, isLoading, user, courseId]);

    const fetchCourseData = async () => {
        setIsFetching(true);
        const { data: cData } = await getCourse(courseId);
        if (cData) setCourse(cData);
        setIsFetching(false);
    };

    if (!user || !['super_admin', 'org_admin', 'course_provider'].includes(user.role)) return null;
    if (isLoading || isFetching) return <div className="p-8 text-center">Loading course workspace...</div>;
    if (!course) return <div className="p-8 text-center text-red-500">Course not found.</div>;

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Context Header */}
            <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-6 border-t-4 border-t-primary">
                <h1 className="text-2xl font-bold text-foreground mb-2">{course.title}</h1>
                <p className="text-muted-foreground">{course.description || 'No description provided.'}</p>
                <div className="mt-4 pt-4 border-t border-border flex gap-4">
                    <div className="text-sm">
                        <span className="text-muted-foreground font-medium">Level:</span>
                        <span className="ml-2 capitalize font-bold text-foreground">{course.level}</span>
                    </div>
                    <div className="text-sm">
                        <span className="text-muted-foreground font-medium">Language:</span>
                        <span className="ml-2 uppercase font-bold text-foreground">{course.language}</span>
                    </div>
                </div>
            </div>

            {/* Embedded Modules Manager */}
            <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                <ModulesManager lockedCourseId={courseId} />
            </div>

            {/* Course Exams Section */}
            <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                <div className="px-6 pt-6 pb-2 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Course Exams</h2>
                    <p className="text-sm text-muted-foreground">Manage final exams for this course.</p>
                </div>
                <AssessmentsManager lockedCourseId={courseId} />
            </div>
        </div>
    );
}
