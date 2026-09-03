'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getLesson, getModule } from '@/lib/api';
import DOMPurify from 'isomorphic-dompurify';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { AssessmentsManager } from '@/components/admin/AssessmentsManager';
import { VideoPlayer } from '@/components/VideoPlayer';

const SELECT_CLS = "block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card";

export default function CourseLessonDetailPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;
    const moduleId = params.moduleId as string;
    const lessonId = params.lessonId as string;

    const [lessonData, setLessonData] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [form, setForm] = useState({
        title: '',
        content_type: 'video',
        content: '',
        media_url: '',
        image_url: '',
        assessment_type: 'multiple_choice',
        assessment_payload: '',
        passing_score: 70,
        order: 0
    });

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (lessonId) fetchLessonData();
        }
    }, [isAuthenticated, isLoading, lessonId]);

    const fetchLessonData = async () => {
        setIsFetching(true);
        const { data: lData } = await getLesson(lessonId);
        if (lData) {
            if (lData.module !== moduleId) {
                router.push(`/admin/courses/${courseId}/modules/${moduleId}`);
                return;
            }
            setLessonData(lData);
            setForm({
                title: lData.title,
                content_type: lData.content_type,
                content: lData.content || '',
                media_url: lData.media_url || '',
                image_url: lData.image_url || '',
                assessment_type: lData.assessment_type || 'multiple_choice',
                assessment_payload: lData.assessment_payload
                    ? (typeof lData.assessment_payload === 'string'
                        ? lData.assessment_payload
                        : JSON.stringify(lData.assessment_payload, null, 2))
                    : '',
                passing_score: lData.passing_score ?? 70,
                order: lData.order
            });
        }
        setIsFetching(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionError('');
        setIsActionLoading(true);

        const payload: Record<string, any> = {
            title: form.title,
            content_type: form.content_type,
            order: form.order,
        };

        if (form.content_type === 'video') {
            payload.media_url = form.media_url;
            payload.content = form.content || '';
        } else if (form.content_type === 'article') {
            payload.content = form.content;
        } else if (form.content_type === 'image') {
            payload.image_url = form.image_url;
            payload.content = form.content || '';
        } else if (form.content_type === 'assessment') {
            try {
                const parsed = JSON.parse(form.assessment_payload);
                if (!parsed?.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
                    throw new Error('Payload must have a non-empty "questions" array.');
                }
                for (let i = 0; i < parsed.questions.length; i++) {
                    const q = parsed.questions[i];
                    if (!q.id || !q.type || !q.question || q.correct_answer === undefined)
                        throw new Error(`Question ${i + 1} missing required fields.`);
                    if (!['multiple_choice', 'true_false', 'matching'].includes(q.type))
                        throw new Error(`Question ${i + 1} has invalid type.`);
                }
                payload.assessment_payload = parsed;
                payload.assessment_type = form.assessment_type;
                payload.passing_score = form.passing_score;
            } catch (err: any) {
                setActionError(err.message || 'Invalid assessment payload JSON.');
                setIsActionLoading(false);
                return;
            }
        }

        const { error: apiErr, status } = await apiFetch(`/api/v1/lessons/${lessonId}/`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        if (apiErr || status !== 200) {
            setActionError(apiErr || 'Failed to update lesson.');
        } else {
            await fetchLessonData();
            setIsEditing(false);
        }
        setIsActionLoading(false);
    };

    if (isLoading || isFetching) return <div className="flex justify-center items-center min-h-[30vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
    if (!lessonData) return <div className="p-8 text-center text-red-500">Lesson not found.</div>;

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-6 border-t-4 border-t-primary">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">{lessonData.title}</h1>
                        <p className="text-muted-foreground capitalize">Type: {lessonData.content_type?.replace('_', ' ')}</p>
                    </div>
                    {!isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Lesson</Button>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex gap-4">
                    <div className="text-sm">
                        <span className="text-muted-foreground font-medium">Order:</span>
                        <span className="ml-2 font-bold text-foreground">{lessonData.order}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-3 space-y-6">
                    {/* Inline Content Editor */}
                    <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-6">
                        {isEditing ? (
                            <form onSubmit={handleSave} className="space-y-4">
                                <h2 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">Edit Lesson</h2>

                                {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100 mb-4">{actionError}</div>}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Input
                                            label="Lesson Title"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-1">Content Type</label>
                                        <select
                                            className={SELECT_CLS}
                                            value={form.content_type}
                                            onChange={(e) => setForm({ ...form, content_type: e.target.value as any })}
                                            required
                                        >
                                            <option value="video">Video</option>
                                            <option value="article">Article</option>
                                            <option value="image">Image</option>
                                            <option value="assessment">Assessment</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Input
                                            label="Order"
                                            type="number"
                                            value={form.order.toString()}
                                            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4 mt-4">
                                    {form.content_type === 'video' && (
                                        <div className="space-y-4">
                                            <label className="block text-sm font-semibold text-foreground">Video Content</label>
                                            <CloudinaryUpload
                                                onUploadSuccess={(url) => setForm({ ...form, media_url: url })}
                                                folder="lessons/videos"
                                                resourceType="video"
                                            />
                                            <Input
                                                label="Or Video URL"
                                                placeholder="https://..."
                                                value={form.media_url}
                                                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {form.content_type === 'article' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-1">Article Content</label>
                                            <textarea
                                                className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[300px]"
                                                placeholder="Write your article content here..."
                                                value={form.content}
                                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                                required
                                            />
                                        </div>
                                    )}

                                    {form.content_type === 'image' && (
                                        <div className="space-y-4">
                                            <label className="block text-sm font-semibold text-foreground">Image</label>
                                            <CloudinaryUpload
                                                onUploadSuccess={(url) => setForm({ ...form, image_url: url })}
                                                folder="lessons/images"
                                            />
                                            <Input
                                                label="Or Image URL"
                                                placeholder="https://..."
                                                value={form.image_url}
                                                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {form.content_type === 'assessment' && (
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-1">Assessment Type</label>
                                                <select
                                                    className={SELECT_CLS}
                                                    value={form.assessment_type}
                                                    onChange={(e) => setForm({ ...form, assessment_type: e.target.value as any })}
                                                    required
                                                >
                                                    <option value="multiple_choice">Multiple Choice</option>
                                                    <option value="true_false">True / False</option>
                                                    <option value="matching">Matching</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-1">Passing Score (%)</label>
                                                <input
                                                    type="number"
                                                    min={0} max={100}
                                                    className="block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card"
                                                    value={form.passing_score}
                                                    onChange={(e) => setForm({ ...form, passing_score: parseInt(e.target.value) || 0 })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-1">Assessment JSON Payload</label>
                                                <textarea
                                                    className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground font-mono text-xs focus:ring-2 focus:ring-primary outline-none min-h-[180px] resize-y"
                                                    placeholder='{"questions": [{"id":"q1","type":"multiple_choice","question":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."}],"correct_answer":"a"}]}'
                                                    value={form.assessment_payload}
                                                    onChange={(e) => setForm({ ...form, assessment_payload: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
                                    <Button type="button" variant="outline" onClick={() => { setIsEditing(false); fetchLessonData(); }}>Cancel</Button>
                                    <Button type="submit" variant="primary" disabled={isActionLoading}>
                                        {isActionLoading ? 'Saving...' : 'Save Lesson'}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <h2 className="text-lg font-bold text-foreground mb-4">Lesson Content</h2>
                                {lessonData.content_type === 'video' && lessonData.media_url ? (
                                    <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
                                        <VideoPlayer src={lessonData.media_url} className="w-full h-full object-contain" />
                                    </div>
                                ) : lessonData.content_type === 'image' && lessonData.image_url ? (
                                    <div className="rounded-xl overflow-hidden bg-muted/50 p-2 flex justify-center">
                                        <img src={lessonData.image_url} alt={lessonData.title} className="max-w-full h-auto object-contain rounded" />
                                    </div>
                                ) : lessonData.content_type === 'assessment' ? (
                                    <div className="bg-muted p-6 rounded-xl border border-border">
                                        <p className="font-bold text-foreground">Assessment: {lessonData.assessment_type}</p>
                                        <p className="text-sm text-muted-foreground">Passing Score: {lessonData.passing_score}%</p>
                                        <pre className="mt-4 text-xs bg-card p-4 border border-border rounded overflow-x-auto">
                                            {JSON.stringify(lessonData.assessment_payload, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="tiptap prose prose-sm max-w-none bg-muted p-6 rounded-xl border border-border min-h-[200px] overflow-x-auto break-words"
                                         dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lessonData.content || '<p class="text-muted-foreground italic">No content available.</p>', { ADD_ATTR: ['target', 'rel'] }) }} />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden mt-8">
                <div className="px-6 pt-6 pb-2 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Lesson Assessment</h2>
                    <p className="text-sm text-muted-foreground">Manage the assessment for this lesson.</p>
                </div>
                <AssessmentsManager lockedLessonId={lessonId} lockedCourseId={courseId} lockedModuleId={moduleId} />
            </div>
        </div>
    );
}
