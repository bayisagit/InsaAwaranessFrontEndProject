'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { getCourse, updateCourse, apiFetch, assignCourseProvider, assignCourseOrganization } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { toast } from 'react-hot-toast';
import { Building2, UserCheck, Search } from 'lucide-react';

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
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
    const [initialOrgs, setInitialOrgs] = useState<string[]>([]);
    const [initialProvider, setInitialProvider] = useState<string>('');
    const [orgSearchQuery, setOrgSearchQuery] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        course_provider: '',
        language: 'en',
        level: 'Beginner',
        status: 'draft',
        is_active: true,
        thumbnail_url: ''
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
    const isSuperAdmin = user?.role === 'super_admin';

    const fetchData = async () => {
        setIsFetching(true);
        try {
            const [courseRes, usersRes, orgsRes] = await Promise.all([
                getCourse(courseId),
                apiFetch('/api/auth/users/?page_size=200'),
                apiFetch('/api/v1/organizations/?page_size=100'),
            ]);

            const course = courseRes.data;
            let currentProviderId = '';
            if (course) {
                currentProviderId = (typeof course.course_provider === 'object' && course.course_provider !== null)
                    ? (course.course_provider as any).id
                    : (course.course_provider || '');

                const existingOrgIds: string[] = course.organizations && course.organizations.length > 0
                    ? course.organizations.map((o: any) => typeof o === 'object' ? o.id : o)
                    : (course.organization ? [typeof course.organization === 'object' ? (course.organization as any).id : course.organization] : []);

                setSelectedOrgs(existingOrgIds);
                setInitialOrgs(existingOrgIds);
                setInitialProvider(currentProviderId);

                setForm({
                    title: course.title || '',
                    description: course.description || '',
                    course_provider: currentProviderId,
                    language: course.language || 'en',
                    level: course.level || 'Beginner',
                    status: course.status || 'draft',
                    is_active: course.is_active ?? true,
                    thumbnail_url: course.thumbnail_url || '',
                });
                setOriginalStatus(course.status || 'draft');
            }

            let loadedProviders: UserData[] = [];
            if (usersRes.data?.results) {
                const allUsers: UserData[] = usersRes.data.results;
                loadedProviders = allUsers.filter(u => u.role === 'course_provider');
            } else if (Array.isArray(usersRes.data)) {
                const allUsers: UserData[] = usersRes.data;
                loadedProviders = allUsers.filter(u => u.role === 'course_provider');
            }

            // Ensure assigned provider exists in dropdown options
            if (course && currentProviderId) {
                const exists = loadedProviders.some(p => p.id === currentProviderId);
                if (!exists) {
                    if (user && user.id === currentProviderId) {
                        loadedProviders.push({
                            id: user.id,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            email: user.email,
                            role: user.role
                        });
                    } else {
                        loadedProviders.push({
                            id: currentProviderId,
                            first_name: course.course_provider_name || 'Assigned Provider',
                            last_name: '',
                            email: course.course_provider_email || '',
                            role: 'course_provider'
                        });
                    }
                }
            }
            setProviders(loadedProviders);

            if (orgsRes.data?.results) {
                setOrgs(orgsRes.data.results);
            } else if (Array.isArray(orgsRes.data)) {
                setOrgs(orgsRes.data);
            }
        } catch (err) {
            console.error('Failed to load course settings:', err);
            toast.error('Failed to load course settings data.');
        } finally {
            setIsFetching(false);
        }
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

            // Reassign provider if changed (super_admin only)
            if (isSuperAdmin && form.course_provider !== initialProvider) {
                const { error: providerErr } = await assignCourseProvider(courseId, form.course_provider || null);
                if (providerErr) {
                    toast.error(`Failed to assign provider: ${providerErr}`);
                } else {
                    setInitialProvider(form.course_provider);
                }
            }

            // Reassign organizations if changed (super_admin only)
            if (isSuperAdmin) {
                const orgsChanged = selectedOrgs.length !== initialOrgs.length || selectedOrgs.some(id => !initialOrgs.includes(id));
                if (orgsChanged) {
                    const { error: orgErr } = await assignCourseOrganization(
                        courseId,
                        selectedOrgs.length > 0 ? selectedOrgs[0] : null,
                        selectedOrgs
                    );
                    if (orgErr) {
                        toast.error(`Failed to update organizations: ${orgErr}`);
                    } else {
                        setInitialOrgs(selectedOrgs);
                    }
                }
            }

            toast.success('Course settings saved successfully!');
        } catch {
            toast.error('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user || !['super_admin', 'org_admin', 'course_provider'].includes(user.role)) return null;
    if (isLoading || isFetching) {
        return (
            <div className="flex justify-center items-center min-h-[30vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
        );
    }

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
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Assignments</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Assign a course provider and specify which organizations have access.</p>
                        </div>
                        {!isSuperAdmin && (
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                                View Only (Super Admin Managed)
                            </span>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Course Provider Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-primary" />
                                Course Provider
                            </label>
                            <select
                                className={SELECT_CLS}
                                value={form.course_provider}
                                onChange={e => setForm({ ...form, course_provider: e.target.value })}
                                disabled={!isSuperAdmin || isSaving}
                            >
                                <option value="">Not assigned</option>
                                {providers.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.first_name} {p.last_name} ({p.email})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isSuperAdmin
                                    ? 'The provider responsible for authoring and maintaining this course curriculum.'
                                    : 'The assigned provider for this course. Only super administrators can reassign.'}
                            </p>
                        </div>

                        {/* Organizations Multi-select */}
                        <div className="space-y-3 pt-2 border-t border-border">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    Organization Access
                                </label>
                                {isSuperAdmin && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOrgs(orgs.map(o => o.id))}
                                            className="text-xs font-medium text-primary hover:underline cursor-pointer"
                                        >
                                            Select All
                                        </button>
                                        <span className="text-muted-foreground text-xs">•</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOrgs([])}
                                            className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            Clear (Make Public)
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Status badge */}
                            <div className="px-3 py-2 rounded-lg bg-muted border border-border text-xs flex items-center justify-between">
                                <span className="text-muted-foreground">Access Scope:</span>
                                {selectedOrgs.length === 0 ? (
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Public / All (Accessible to all organizations)
                                    </span>
                                ) : (
                                    <span className="font-semibold text-primary">
                                        Restricted to {selectedOrgs.length} organization{selectedOrgs.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {/* Search box */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    placeholder="Search organizations..."
                                    value={orgSearchQuery}
                                    onChange={e => setOrgSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            {/* Organizations list */}
                            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-border rounded-xl p-2 bg-muted/20">
                                {orgs
                                    .filter(o => o.name.toLowerCase().includes(orgSearchQuery.toLowerCase()))
                                    .map(o => {
                                        const isChecked = selectedOrgs.includes(o.id);
                                        return (
                                            <label
                                                key={o.id}
                                                className={`flex items-center justify-between p-2.5 rounded-lg transition-all border text-sm ${
                                                    !isSuperAdmin ? 'cursor-default' : 'cursor-pointer'
                                                } ${
                                                    isChecked
                                                        ? 'bg-primary/10 border-primary/30 text-foreground font-medium'
                                                        : 'bg-card border-border hover:bg-muted/50 text-muted-foreground'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        disabled={!isSuperAdmin || isSaving}
                                                        onChange={() => {
                                                            if (!isSuperAdmin) return;
                                                            if (isChecked) {
                                                                setSelectedOrgs(selectedOrgs.filter(id => id !== o.id));
                                                            } else {
                                                                setSelectedOrgs([...selectedOrgs, o.id]);
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer disabled:cursor-not-allowed"
                                                    />
                                                    <span>{o.name}</span>
                                                </div>
                                                {isChecked && (
                                                    <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/15">
                                                        Assigned
                                                    </span>
                                                )}
                                            </label>
                                        );
                                    })}
                                {orgs.filter(o => o.name.toLowerCase().includes(orgSearchQuery.toLowerCase())).length === 0 && (
                                    <div className="text-center py-6 text-sm text-muted-foreground">
                                        No organizations found matching "{orgSearchQuery}"
                                    </div>
                                )}
                            </div>
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