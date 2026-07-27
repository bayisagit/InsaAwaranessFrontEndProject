'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getModule } from '@/lib/api';
import { LessonsManager } from '@/components/admin/LessonsManager';
import { AssessmentsManager } from '@/components/admin/AssessmentsManager';

export default function CourseModuleDetailPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;
    const moduleId = params.moduleId as string;

    const [moduleData, setModuleData] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (moduleId) fetchData();
        }
    }, [isAuthenticated, isLoading, moduleId]);

    const fetchData = async () => {
        setIsFetching(true);
        const { data: mData } = await getModule(moduleId);
        if (mData) {
            if (mData.course !== courseId) {
                router.push(`/admin/courses/${courseId}/modules`);
                return;
            }
            setModuleData(mData);
        }
        setIsFetching(false);
    };

    if (isLoading || isFetching) return <div className="flex justify-center items-center min-h-[30vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
    if (!moduleData) return <div className="p-8 text-center text-red-500">Module not found.</div>;

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-6 border-t-4 border-t-primary">
                <h1 className="text-2xl font-bold text-foreground mb-2">{moduleData.title}</h1>
                <p className="text-muted-foreground">{moduleData.description || 'No description provided.'}</p>
                <div className="mt-4 pt-4 border-t border-border flex gap-4">
                    <div className="text-sm">
                        <span className="text-muted-foreground font-medium">Order:</span>
                        <span className="ml-2 font-bold text-foreground">{moduleData.order}</span>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                <div className="px-6 pt-6 pb-2 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Lessons</h2>
                    <p className="text-sm text-muted-foreground">Manage lessons in this module.</p>
                </div>
                <LessonsManager lockedModuleId={moduleId} lockedCourseId={courseId} />
            </div>

            <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                <div className="px-6 pt-6 pb-2 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Module Quizzes</h2>
                    <p className="text-sm text-muted-foreground">Manage quizzes for this module.</p>
                </div>
                <AssessmentsManager lockedModuleId={moduleId} />
            </div>
        </div>
    );
}
