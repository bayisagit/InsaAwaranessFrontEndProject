'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { getCourse, updateCourse, apiFetch, assignCourseProvider, assignCourseOrganization } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { toast } from 'react-hot-toast';

const SELECT_CLS = "block w-full rounded-lg border border-border py-2.5 px-3 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card disabled:opacity-75 disabled:bg-muted/50 disabled:cursor-not-allowed";

interface UserData { id: string; email: string; first_name: string; last_name: string; role: string; }
interface OrgOption { id: string; name: string; }

export default function CourseSettingsPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;

    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [providers, setProviders] = useState<UserData[]>([]);
    const [orgs, setOrgs] = useState<OrgOption[]>([]);
    const [form, setForm] = useState({
        title: '', description: '', organization: '', course_provider: '',
        language: 'en', level: 'Beginner', status: 'draft', is_active: true, thumbnail_url: ''
    });
    const [originalStatus, setOriginalStatus] = useState('draft');

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (user?.role !== 'super_admin' && user?.role !== 'org_admin' && user?.role !== 'course_provider')
                router.push('/dashboard');
            else if (courseId) fetchData();
        }
    }, [isAuthenticated, isLoading, user, courseId]);

    const isReadOnly = user?.role === 'org_admin';

    const fetchData = async () => {
        setIsFetching(true);
        const { data: course } = await getCourse(courseId);
        if (course) {
            setForm({
                title: course.title || '',
                description: course.description || '',
                organization: course.organization || '',
                course_provider: course.course_provider || '',
                language: course.language || 'en',
                level: course.level || 'Beginner',
                status: course.status || 'draft',
                is_active: course.is_active ?? true,
                thumbnail_url: course.thumbnail_url || '',
            });
            setOriginalStatus(course.status || 'draft');
        }

        const [provRes, orgRes] = await Promise.all([
            apiFetch('/api/v1/users/?role=course_provider&page_size=100'),
            apiFetch('/api/v1/organizations/?page_size=100'),
        ]);
        if (provRes.data?.results) setProviders(provRes.data.results);
        else if (Array.isArray(provRes.data)) setProviders(provRes.data);
        if (orgRes.data?.results) setOrgs(orgRes.data.results);
        else if (Array.isArray(orgRes.data)) setOrgs(orgRes.data);

        setIsFetching(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error: e } = await updateCourse(courseId, {
                title: form.title,
                description: form.description,
                language: form.language,
                level: form.level,
                status: form.status as any,
                thumbnail_url: form.thumbnail_url || undefined,
            });
            if (e) { toast.error(e); setIsSaving(false); return; }

            if (form.course_provider && form.course_provider !== form.course_provider) {
                await assignCourseProvider(courseId, form.course_provider);
            }
            if (form.organization) {
                await assignCourseOrganization(courseId, form.organization);
            }

            toast.success('Settings saved successfully!');
        } catch {
            toast.error('Failed to save settings.');
        }
        setIsSaving(false);
    };

    if (!user || !['super_admin', 'org_admin', 'course_provider'].includes(user.role)) return null;
    if (isLoading || isFetching) return <div className="flex justify-center items-center min-h-[30vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Course Settings</h1>
                <p className="text-muted-foreground mt-1">Configure course metadata, provider, and organization assignments.</p>
            </div>

            {isReadOnly && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" /></svg>
                    You are viewing this course in read-only mode. Settings cannot be modified.
                </div>
            )}

            <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-6 space-y-6">
                <h2 className="text-lg font-bold text-foreground border-b border-border pb-3">Basic Information</h2>

                <Input label="Course Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isReadOnly} />
                <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Description</label>
                    <textarea className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px] resize-y disabled:opacity-75 disabled:bg-muted/50 disabled:cursor-not-allowed"
                        placeholder="Course description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} disabled={isReadOnly} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-1">Language</label>
                        <select className={SELECT_CLS} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} disabled={isReadOnly}>
                            <option value="en">English</option>
                            <option value="fr">French</option>
                            <option value="ar">Arabic</option>
                            <option value="es">Spanish</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-1">Level</label>
                        <select className={SELECT_CLS} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} disabled={isReadOnly}>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="All Levels">All Levels</option>
                        </select>
                    </div>
                </div>

                <CloudinaryUpload label="Thumbnail Image" resourceType="image" value={form.thumbnail_url}
                    onUploadSuccess={(url) => setForm({ ...form, thumbnail_url: url })} disabled={isReadOnly} />
            </div>

            {!isReadOnly && (
                <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-6 space-y-6">
                    <h2 className="text-lg font-bold text-foreground border-b border-border pb-3">Status & Visibility</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Status</label>
                            <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">
                                {originalStatus === 'published' && form.status !== 'published' ? 'Unpublishing will hide the course from learners.' : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-6">
                            <input type="checkbox" id="is_active" className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                            <label htmlFor="is_active" className="text-sm font-semibold text-foreground cursor-pointer">Course is active</label>
                        </div>
                    </div>
                </div>
            )}

            {!isReadOnly && (
                <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-6 space-y-6">
                    <h2 className="text-lg font-bold text-foreground border-b border-border pb-3">Assignments</h2>
                    <p className="text-sm text-muted-foreground">Assign a course provider and organization to this course.</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Course Provider</label>
                            <select className={SELECT_CLS} value={form.course_provider} onChange={e => setForm({ ...form, course_provider: e.target.value })}>
                                <option value="">Not assigned</option>
                                {providers.map(p => (
                                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Organization</label>
                            <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })}>
                                <option value="">Not assigned</option>
                                {orgs.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {!isReadOnly && (
                <div className="flex flex-wrap justify-end gap-3 pt-4 min-w-fit">
                    <Button variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            )}
        </div>
    );
}