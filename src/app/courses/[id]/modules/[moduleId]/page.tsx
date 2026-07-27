'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, Module, Lesson } from '@/lib/api';
import { Button } from '@/components/Button';

import { AssessmentViewer } from '@/components/AssessmentViewer';
import { LinkifyText } from '@/components/LinkifyText';

// Using imported Module and Lesson interfaces from lib/api

export default function ModuleContentPage() {
    const { id: courseId, moduleId } = useParams<{ id: string; moduleId: string }>();
    const router = useRouter();

    const [module, setModule] = useState<Module | null>(null);
    const [lessons, setLessons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (moduleId) fetchModuleData();
    }, [moduleId]);

    const fetchModuleData = async () => {
        setIsLoading(true);
        setError('');

        // Fetch the full course detail because learners might be blocked from direct module/lesson listing
        // but are allowed to see the course they are enrolled in.
        const courseRes = await apiFetch<any>(`/api/v1/courses/${courseId}/`);

        if (courseRes.error) {
            setError(courseRes.error);
            setIsLoading(false);
            return;
        }

        if (courseRes.data && Array.isArray(courseRes.data.modules)) {
            const foundModule = courseRes.data.modules.find((m: any) => m.id === moduleId);
            if (foundModule) {
                setModule(foundModule);
                // If lessons are nested in the module object, use them
                if (Array.isArray(foundModule.lessons)) {
                    setLessons(foundModule.lessons);
                } else {
                    // Final fallback: try to fetch lessons separately
                    const lessonsRes = await apiFetch<any>(`/api/v1/lessons/?module=${moduleId}&ordering=order`);
                    if (lessonsRes.data?.results) setLessons(lessonsRes.data.results);
                    else if (Array.isArray(lessonsRes.data)) setLessons(lessonsRes.data);
                }
            } else {
                setError('Module not found in this course.');
            }
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-card flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !module) {
        return (
            <div className="min-h-screen bg-card flex items-center justify-center p-6 text-center">
                <div>
                    <div className="text-4xl mb-4">📂</div>
                    <p className="text-red-600 font-bold mb-4">{error || 'Module not found.'}</p>
                    <Link href={`/courses/${courseId}`} className="text-primary hover:underline font-bold">← Return to Course</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted pb-32">
            {/* Top Reader Bar */}
            <div className="sticky top-16 z-30 bg-card border-b border-border">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/courses/${courseId}`} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors duration-200 transition-colors uppercase tracking-widest flex items-center gap-2">
                        ← Exit Module
                    </Link>
                    <div className="text-center flex-1 mx-4">
                        <h2 className="text-sm font-bold text-foreground truncate max-w-[300px]">{module.title}</h2>
                    </div>
                    <div className="w-20"></div> {/* Spacer */}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 mt-12">
                <header className="mb-12">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight">
                        {module.title}
                    </h1>
                </header>


                <div className="bg-card rounded-3xl border border-border shadow-sm shadow-black/5 dark:shadow-none overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Lessons</h2>
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase">{lessons.length} Total</span>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {lessons.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-muted-foreground font-medium">No lessons available in this module yet.</p>
                            </div>
                        ) : (
                            lessons
                                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                .map((lesson, i) => (
                                    <Link
                                        key={lesson.id}
                                        href={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
                                        className="flex items-center gap-5 p-6 hover:bg-muted transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-2xl bg-muted/50 text-muted-foreground flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{lesson.title}</h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${lesson.content_type === 'video' ? 'bg-blue-50 text-blue-600' :
                                                    lesson.content_type === 'article' ? 'bg-green-50 text-green-600' :
                                                        'bg-purple-50 text-purple-600'
                                                    }`}>
                                                    {lesson.content_type}
                                                </span>
                                            </div>
                                            {lesson.description && <p className="text-sm text-muted-foreground line-clamp-1"><LinkifyText text={lesson.description} /></p>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-gray-300 group-hover:text-primary transition-colors uppercase tracking-widest hidden sm:block">Start</span>
                                            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-gray-300 group-hover:border-primary group-hover:text-primary transition-all">
                                                →
                                            </div>
                                        </div>
                                    </Link>
                                ))
                        )}
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <Link href={`/courses/${courseId}`}>
                        <Button variant="outline" className="rounded-full px-8">← Back to Course Overview</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
