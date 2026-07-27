'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, Lesson, Module, getLessonProgress, createLessonProgress, updateLessonProgress } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { AssessmentViewer } from '@/components/AssessmentViewer';
import { LinkifyText } from '@/components/LinkifyText';

// Using imported Lesson interface from lib/api

// Using imported Module interface from lib/api

export default function LessonDetailPage() {
    const { id: courseId, moduleId, lessonId } = useParams<{ id: string; moduleId: string; lessonId: string }>();
    const router = useRouter();

    const { user, isAuthenticated } = useAuth();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [module, setModule] = useState<Module | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [progressId, setProgressId] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);
    const [watchedSeconds, setWatchedSeconds] = useState(0);
    const [progressSaving, setProgressSaving] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (lessonId) fetchData();
    }, [lessonId]);

    useEffect(() => {
        if (lesson && user) fetchProgress();
    }, [lesson, user]);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');

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

                if (Array.isArray(foundModule.lessons)) {
                    const foundLesson = foundModule.lessons.find((l: any) => l.id === lessonId);
                    if (foundLesson) {
                        setLesson(foundLesson);
                    } else {
                        const lessonRes = await apiFetch<any>(`/api/v1/lessons/${lessonId}/`);
                        if (lessonRes.data) setLesson(lessonRes.data);
                        else setError('Lesson not found.');
                    }
                }
            } else {
                setError('Module not found in this course.');
            }
        }
        setIsLoading(false);
    };

    const fetchProgress = async () => {
        const { data, error: e } = await getLessonProgress({ lesson: lesson!.id });
        if (e) return;
        if (data && data.results.length > 0) {
            const p = data.results[0];
            setProgressId(p.id);
            setCompleted(p.completed);
            setWatchedSeconds(p.watched_seconds);
        }
    };

    const handleToggleComplete = async () => {
        if (progressSaving) return;
        setProgressSaving(true);
        const newCompleted = !completed;
        if (progressId) {
            const { error: e } = await updateLessonProgress(progressId, { completed: newCompleted });
            if (!e) setCompleted(newCompleted);
        } else {
            const { data, error: e } = await createLessonProgress({
                lesson: lesson!.id,
                completed: newCompleted,
                watched_seconds: Math.floor(watchedSeconds),
            });
            if (!e && data) {
                setProgressId(data.id);
                setCompleted(newCompleted);
            }
        }
        setProgressSaving(false);
    };

    const handleVideoTimeUpdate = () => {
        if (videoRef.current) {
            setWatchedSeconds(videoRef.current.currentTime);
        }
    };

    const saveVideoProgress = async () => {
        if (!lesson || lesson.content_type !== 'video' || watchedSeconds <= 0) return;
        if (progressId) {
            await updateLessonProgress(progressId, { watched_seconds: Math.floor(watchedSeconds) });
        } else {
            const { data } = await createLessonProgress({
                lesson: lesson.id,
                completed: false,
                watched_seconds: Math.floor(watchedSeconds),
            });
            if (data) setProgressId(data.id);
        }
    };

    useEffect(() => {
        if (lesson?.content_type === 'video') {
            saveTimerRef.current = setInterval(saveVideoProgress, 30000);
            return () => {
                if (saveTimerRef.current) clearInterval(saveTimerRef.current);
            };
        }
    }, [lesson, watchedSeconds]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-card flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="min-h-screen bg-card flex items-center justify-center p-6 text-center">
                <div>
                    <div className="text-4xl mb-4">📖</div>
                    <p className="text-red-600 font-bold mb-4">{error || 'Lesson not found.'}</p>
                    <Link href={`/courses/${courseId}/modules/${moduleId}`} className="text-primary hover:underline font-bold">← Return to Module</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-card pb-32">
            {/* Top Reader Bar */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-border">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/courses/${courseId}/modules/${moduleId}`} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2">
                        ← Back to Module
                    </Link>
                    <div className="text-center flex-1 mx-4">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest block mb-0.5">{module?.title || 'Lesson'}</span>
                        <h2 className="text-sm font-bold text-foreground truncate max-w-[300px]">{lesson.title}</h2>
                    </div>
                    <div className="w-20"></div> {/* Spacer */}
                </div>
            </div>

            <article className="max-w-3xl mx-auto px-6 mt-16">
                <header className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${lesson.content_type === 'video' ? 'bg-blue-50 text-blue-600' :
                            lesson.content_type === 'article' ? 'bg-green-50 text-green-600' :
                                'bg-purple-50 text-purple-600'
                            }`}>
                            {lesson.content_type}
                        </span>

                        {lesson.content_type === 'assessment' && (
                            <Button
                                variant="primary"
                                size="sm"
                                className="rounded-full shadow-lg shadow-black/10 dark:shadow-none shadow-primary/20"
                                onClick={() => document.getElementById('assessment-section')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Take Quiz Now 📝
                            </Button>
                        )}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
                        {lesson.title}
                    </h1>
                </header>

                <div className="lesson-content">
                    {lesson.content_type === 'article' && lesson.content && (
                        <div className="prose prose-lg max-w-none text-foreground leading-relaxed font-serif">
                            {lesson.content.split('\n').map((para: string, i: number) => (
                                <p key={i} className="mb-6"><LinkifyText text={para} /></p>
                            ))}
                        </div>
                    )}

                    {lesson.content_type === 'video' && lesson.media_url && (
                        <div className="mb-8">
                            <div className="aspect-video bg-background rounded-3xl overflow-hidden shadow-2xl mb-8 border border-border">
                                <video
                                    ref={videoRef}
                                    src={lesson.media_url}
                                    controls
                                    onTimeUpdate={handleVideoTimeUpdate}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {lesson.content && (
                                <div className="prose prose-lg max-w-none text-foreground leading-relaxed font-serif bg-muted p-8 rounded-3xl">
                                    {lesson.content.split('\n').map((para: string, i: number) => (
                                        <p key={i} className="mb-4 last:mb-0"><LinkifyText text={para} /></p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {lesson.content_type === 'image' && lesson.image_url && (
                        <div className="mb-8 text-center">
                            <img
                                src={lesson.image_url}
                                alt={lesson.title || 'Lesson Image'}
                                className="max-w-full rounded-3xl shadow-xl mx-auto border border-border"
                            />
                            {lesson.content && (
                                <div className="mt-8 text-left prose prose-lg max-w-none text-foreground leading-relaxed font-serif bg-muted p-8 rounded-3xl">
                                    {lesson.content.split('\n').map((para: string, i: number) => (
                                        <p key={i} className="mb-4 last:mb-0"><LinkifyText text={para} /></p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {lesson.content_type === 'assessment' && (
                        <div className="mt-8" id="assessment-section">
                            <AssessmentViewer lessonId={lessonId} />
                        </div>
                    )}
                </div>

                <div className="mt-24 pt-12 border-t border-border flex flex-col items-center gap-6">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] text-center block">END OF LESSON</span>
                    <div className="flex flex-col items-center gap-3">
                        {isAuthenticated && (
                            <Button
                                variant={completed ? 'outline' : 'primary'}
                                className={`rounded-full px-10 ${completed ? '' : 'shadow-lg shadow-black/10 dark:shadow-none shadow-primary/20'}`}
                                onClick={handleToggleComplete}
                                disabled={progressSaving}
                            >
                                {progressSaving ? 'Saving...' : completed ? '✓ Marked Complete' : 'Mark as Complete'}
                            </Button>
                        )}
                        {lesson.content_type === 'video' && watchedSeconds > 0 && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                                Watched: {Math.floor(watchedSeconds / 60)}m {Math.floor(watchedSeconds % 60)}s
                            </span>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <Link href={`/courses/${courseId}/modules/${moduleId}`}>
                            <Button variant="outline" className="rounded-full px-8 underline decoration-primary/30 underline-offset-4">Return to Module</Button>
                        </Link>
                    </div>
                </div>
            </article>
        </div>
    );
}
