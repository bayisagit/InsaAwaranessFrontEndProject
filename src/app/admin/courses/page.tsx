'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getCourses, createCourse, updateCourse, deleteCourse,
    getOrganizations, assignCourseProvider, assignCourseOrganization,
    submitCourseForReview, approveCourse, rejectCourse, withdrawCourse,
    apiFetch, Course, Organization
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { toast } from 'react-hot-toast';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';

interface UserData { id: string; email: string; first_name: string; last_name: string; role: string; }

const SELECT_CLS = "block w-full rounded-lg border border-border py-2.5 px-3 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card disabled:opacity-75 disabled:bg-muted/50 disabled:cursor-not-allowed";
const STATUS_COLORS: Record<string, string> = {
    published: 'bg-green-50 text-green-700',
    draft: 'bg-yellow-50 text-yellow-700',
    submitted: 'bg-blue-50 text-blue-700',
    archived: 'bg-muted/50 text-muted-foreground',
};

export default function AdminCoursesPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [courses, setCourses] = useState<Course[]>([]);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [providers, setProviders] = useState<UserData[]>([]);
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');

    // Course create/edit modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [form, setForm] = useState({
        title: '', description: '', organization: '', course_provider: '',
        language: 'en', level: 'Beginner', status: 'draft', is_active: true, thumbnail_url: ''
    });

    // Submit confirm
    const [submitConfirmId, setSubmitConfirmId] = useState<string | null>(null);

    // Withdraw confirm
    const [withdrawConfirmId, setWithdrawConfirmId] = useState<string | null>(null);

    // Delete confirm
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Expandable Create
    const [isCreateExpanded, setIsCreateExpanded] = useState(false);
    const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

    // Assign Provider modal
    const [isAssignProviderOpen, setIsAssignProviderOpen] = useState(false);
    const [assignProviderCourse, setAssignProviderCourse] = useState<Course | null>(null);
    const [selectedProvider, setSelectedProvider] = useState('');

    // Assign Organization modal
    const [isAssignOrgOpen, setIsAssignOrgOpen] = useState(false);
    const [assignOrgCourse, setAssignOrgCourse] = useState<Course | null>(null);
    const [selectedOrg, setSelectedOrg] = useState('');

    // Rejection reason modal
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectCourseId, setRejectCourseId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [orgFilter, setOrgFilter] = useState<string>('');
    const [providerFilter, setProviderFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCourses = useCallback(async () => {
        setIsFetching(true); setError('');
        const { data, error: e } = await getCourses();
        if (e) setError(e);
        else if (data?.results) setCourses(data.results);
        else if (Array.isArray(data)) setCourses(data as Course[]);
        setIsFetching(false);
    }, []);

    const fetchOrgs = useCallback(async () => {
        const { data } = await getOrganizations({ page_size: 100 });
        if (data?.results) setOrgs(data.results);
        else if (Array.isArray(data)) setOrgs(data as Organization[]);
    }, []);

    const fetchUsers = useCallback(async () => {
        const { data } = await apiFetch('/api/auth/users/?page_size=200');
        let all: UserData[] = data?.results ?? (Array.isArray(data) ? data : []);
        setProviders(all.filter(u => u.role === 'course_provider'));
        setAllUsers(all);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (!['super_admin', 'org_admin', 'course_provider'].includes(user?.role || '')) router.push('/dashboard');
            else { fetchCourses(); fetchOrgs(); fetchUsers(); }
        }
    }, [isAuthenticated, isLoading, user, router, fetchCourses, fetchOrgs, fetchUsers]);

    useEffect(() => {
        if (user?.role === 'org_admin' && user?.organization_id && orgs.length > 0) {
            setOrgFilter(user.organization_id);
        }
    }, [user, orgs]);

    const openModal = (course?: Course) => {
        setActionError('');
        if (course) {
            setIsCreateExpanded(false);
            setCreatedCourseId(null);
            setSelectedCourse(course);
            setForm({
                title: course.title,
                description: course.description || '',
                organization: course.organization || '',
                course_provider: course.course_provider || '',
                language: course.language || 'en',
                level: course.level || 'Beginner',
                status: course.status || 'draft',
                is_active: course.is_active !== false,
                thumbnail_url: course.thumbnail_url || ''
            });
            setIsModalOpen(true);
        }
    };

    const toggleCreate = () => {
        if (!isCreateExpanded) {
            setSelectedCourse(null);
            setCreatedCourseId(null);
            setForm({
                title: '', description: '',
                organization: '',
                course_provider: user?.role === 'course_provider' ? (user?.id || '') : '',
                language: 'en', level: 'Beginner', status: 'draft', is_active: true, thumbnail_url: ''
            });
            setActionError('');
        }
        setIsCreateExpanded(!isCreateExpanded);
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault(); setActionError(''); setIsActionLoading(true);
        const isEditing = !!selectedCourse;

        // Build payload per API docs — never send read-only fields
        const payload: Record<string, any> = {
            title: form.title,
            description: form.description || undefined,
            level: form.level || undefined,
            language: form.language,
            status: form.status,
            is_active: form.is_active,
            ...(form.thumbnail_url ? { thumbnail_url: form.thumbnail_url } : {}),
        };

        if (!isEditing) {
            // course_provider required for super_admin; ignored for course_provider (backend overrides)
            if (user?.role === 'super_admin') {
                if (form.course_provider) payload.course_provider = form.course_provider;
                if (form.organization) payload.organization = form.organization;
            }
            // course_provider role: DO NOT send organization (backend returns 400)
        } else {
            // On edit: super_admin can change org/status; course_provider cannot change org or provider
            if (user?.role === 'super_admin') {
                if (form.organization !== undefined) payload.organization = form.organization || null;
            }
        }

        const { data, error: apiErr } = isEditing
            ? await updateCourse(selectedCourse!.id, payload)
            : await createCourse(payload);

        if (apiErr) {
            setActionError(apiErr);
        } else {
            toast.success(isEditing ? 'Course updated.' : 'Course created.');
            fetchCourses();
            if (isEditing) {
                setIsModalOpen(false);
            } else {
                if (data?.id) {
                    setCreatedCourseId(data.id);
                } else {
                    setIsCreateExpanded(false);
                }
            }
        }
        setIsActionLoading(false);
    };

    const handleDelete = (id: string) => { setItemToDelete(id); setIsDeleteModalOpen(true); };
    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        setIsActionLoading(true);
        const { error: err } = await deleteCourse(itemToDelete);
        if (err) { toast.error(err); setError(err); }
        else { toast.success('Course deleted.'); fetchCourses(); }
        setIsDeleteModalOpen(false); setItemToDelete(null); setIsActionLoading(false);
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setIsActionLoading(true);
        const { error: apiErr } = await updateCourse(id, { status: newStatus as any });
        if (apiErr) toast.error(apiErr);
        else { toast.success(`Course ${newStatus}.`); fetchCourses(); }
        setIsActionLoading(false);
    };

    const handleAssignProvider = async () => {
        if (!assignProviderCourse || !selectedProvider) return;
        setIsActionLoading(true);
        const { error: e } = await assignCourseProvider(assignProviderCourse.id, selectedProvider);
        if (e) toast.error(e);
        else { toast.success('Course provider assigned.'); fetchCourses(); setIsAssignProviderOpen(false); }
        setIsActionLoading(false);
    };

    const handleAssignOrg = async () => {
        if (!assignOrgCourse) return;
        setIsActionLoading(true);
        const { error: e } = await assignCourseOrganization(assignOrgCourse.id, selectedOrg || null);
        if (e) toast.error(e);
        else { toast.success('Organization assigned.'); fetchCourses(); setIsAssignOrgOpen(false); }
        setIsActionLoading(false);
    };

    const handleSubmitConfirm = (id: string) => {
        setSubmitConfirmId(id);
    };

    const handleSubmitForReview = async () => {
        if (!submitConfirmId) return;
        setIsActionLoading(true);
        const { error: e } = await submitCourseForReview(submitConfirmId);
        if (e) toast.error(e);
        else { toast.success('Course submitted for review.'); fetchCourses(); }
        setIsActionLoading(false);
        setSubmitConfirmId(null);
    };

    const handleWithdrawConfirm = (id: string) => {
        setWithdrawConfirmId(id);
    };

    const handleWithdraw = async () => {
        if (!withdrawConfirmId) return;
        setIsActionLoading(true);
        const { error: e } = await withdrawCourse(withdrawConfirmId);
        if (e) toast.error(e);
        else { toast.success('Course submission withdrawn. It is now a draft again.'); fetchCourses(); }
        setIsActionLoading(false);
        setWithdrawConfirmId(null);
    };

    const handleApprove = async (id: string) => {
        setIsActionLoading(true);
        const { error: e } = await approveCourse(id);
        if (e) toast.error(e);
        else { toast.success('Course approved and published.'); fetchCourses(); }
        setIsActionLoading(false);
    };

    const openRejectModal = (id: string) => {
        setRejectCourseId(id);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectConfirm = async () => {
        if (!rejectCourseId || !rejectionReason.trim()) return;
        setIsActionLoading(true);
        const { error: e } = await rejectCourse(rejectCourseId, rejectionReason);
        if (e) toast.error(e);
        else { toast.success('Course rejected.'); fetchCourses(); setIsRejectModalOpen(false); }
        setIsActionLoading(false);
    };

    if (isLoading || isFetching) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
    );
    if (!user || !['super_admin', 'org_admin', 'course_provider'].includes(user.role)) return null;

    const filteredCourses = courses.filter(c => {
        const matchesStatus = !statusFilter || c.status === statusFilter;
        const matchesOrg = !orgFilter || c.organization === orgFilter;
        const matchesProvider = !providerFilter || c.course_provider === providerFilter;
        const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesOrg && matchesProvider && matchesSearch;
    });

    const isSuperAdmin = user.role === 'super_admin';
    const canManage = isSuperAdmin || user.role === 'course_provider';

    return (
        <div className="min-h-screen bg-muted pb-20">
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-1">Courses Management</h1>
                        <p className="text-muted-foreground">Create and manage cybersecurity training courses.</p>
                    </div>
                    <div className="w-full lg:w-72 shrink-0">
                        <input
                            type="text"
                            placeholder="Search course title…"
                            className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {canManage && (
            <ExpandableCreateSection
                title="Add New Course"
                isOpen={isCreateExpanded}
                onToggle={toggleCreate}
                isSuccess={!!createdCourseId}
                successTitle="Course Created Successfully!"
                successDescription="Great! You can now start building the structure of your course."
                nextSteps={createdCourseId ? [
                    { label: 'Add a Module', href: `/admin/modules?create=true&courseId=${createdCourseId}`, icon: '📂' },
                    { label: 'Add Course Exam', href: `/admin/assessments?create=true&parent_type=course_exam&courseId=${createdCourseId}`, variant: 'secondary', icon: '🎓' }
                ] : []}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

                    <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} autoFocus />

                    <CloudinaryUpload
                        label="Course Thumbnail"
                        folder="lms-course-thumbnails"
                        resourceType="image"
                        value={form.thumbnail_url || ''}
                        onUploadSuccess={url => setForm({ ...form, thumbnail_url: url })}
                        disabled={isActionLoading}
                    />
                    {form.thumbnail_url && (
                        <div className="rounded-xl overflow-hidden border border-border h-32 w-48 mt-2">
                            <img src={form.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-1">Description</label>
                        <textarea
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px] resize-y"
                            placeholder="Course description…"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            disabled={isActionLoading}
                        />
                    </div>

                    {isSuperAdmin && (
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Organization <span className="text-muted-foreground font-normal">(optional)</span></label>
                            <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} disabled={isActionLoading}>
                                <option value="">None</option>
                                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    )}

                    {isSuperAdmin && (
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Course Provider <span className="text-primary">*</span></label>
                            <select className={SELECT_CLS} value={form.course_provider} onChange={e => setForm({ ...form, course_provider: e.target.value })} disabled={isActionLoading} required>
                                <option value="">Select provider</option>
                                {providers.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>)}
                            </select>
                            {providers.length === 0 && <p className="text-[10px] text-red-500 mt-1">No course provider users found.</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Language</label>
                            <select className={SELECT_CLS} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} disabled={isActionLoading}>
                                <option value="en">English (en)</option>
                                <option value="am">Amharic (am)</option>
                                <option value="om">Oromo (om)</option>
                                <option value="so">Somali (so)</option>
                                <option value="ti">Tigrinya (ti)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Level</label>
                            <select className={SELECT_CLS} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} disabled={isActionLoading}>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Status</label>
                            <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isActionLoading}>
                                <option value="draft">Draft</option>
                                <option value="submitted">Submitted</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving…' : 'Create Course'}</Button>
                    </div>
                </form>
            </ExpandableCreateSection>
            )}

            {/* Filter Bar */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-8">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                        <select
                            className="rounded-lg border border-border py-1.5 px-3 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    {user?.role !== 'org_admin' && (
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Organization</label>
                        <select
                            className="rounded-lg border border-border py-1.5 px-2 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card min-w-[200px]"
                            value={orgFilter}
                            onChange={e => setOrgFilter(e.target.value)}
                        >
                            <option value="">All</option>
                            {orgs.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>
                    )}
                    {isSuperAdmin && (
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Provider</label>
                        <select
                            className="rounded-lg border border-border py-1.5 px-2 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card max-w-[140px]"
                            value={providerFilter}
                            onChange={e => setProviderFilter(e.target.value)}
                        >
                            <option value="">All</option>
                            {allUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                    )}
                    {(statusFilter || orgFilter || providerFilter || searchQuery) && (
                        <button
                            onClick={() => { setStatusFilter(''); setOrgFilter(''); setProviderFilter(''); setSearchQuery(''); }}
                            className="text-xs text-primary font-bold hover:text-primary-hover"
                        >
                            ✕ Clear filters
                        </button>
                    )}
                </div>

                {/* Main Content */}
                <div>
                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}
                    <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                        <table className="w-full text-left text-sm text-muted-foreground">
                            <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
                                <tr>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Level</th>
                                    <th className="px-4 py-3">Language</th>
                                    <th className="px-4 py-3">Organization</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredCourses.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No courses found.</td></tr>
                                ) : filteredCourses.map(c => (
                                    <tr key={c.id} className="hover:bg-muted transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            <div className="flex items-center gap-3">
                                                {c.thumbnail_url ? (
                                                    <img src={c.thumbnail_url} alt={c.title} className="w-10 h-10 rounded-xl object-cover border border-border shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                                                    </div>
                                                )}
                                                <Link href={`/admin/courses/${c.id}`} className="hover:text-primary transition-colors hover:underline">
                                                    <span>{c.title}</span>
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 capitalize">{c.level || '—'}</td>
                                        <td className="px-4 py-3 uppercase text-xs">{c.language || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {c.organization ? (orgs.find(o => o.id === c.organization)?.name || c.organization) : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status] || 'bg-muted/50 text-muted-foreground'}`}>
                                                {c.status || 'draft'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                            {canManage && (
                                                <button onClick={() => openModal(c)} className="px-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors">Edit</button>
                                            )}
                                            {c.status === 'draft' && user.role === 'course_provider' && (
                                                <button onClick={() => handleSubmitConfirm(c.id)} disabled={isActionLoading} className="px-2 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg text-xs font-bold transition-colors">Submit</button>
                                            )}
                                            {c.status === 'submitted' && user.role === 'course_provider' && (
                                                <button onClick={() => handleWithdrawConfirm(c.id)} disabled={isActionLoading} className="px-2 py-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700 rounded-lg text-xs font-bold transition-colors">Withdraw</button>
                                            )}
                                            {c.status === 'submitted' && isSuperAdmin && (
                                                <>
                                                <button onClick={() => handleApprove(c.id)} disabled={isActionLoading} className="px-2 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-lg text-xs font-bold transition-colors">Approve</button>
                                                <button onClick={() => openRejectModal(c.id)} disabled={isActionLoading} className="px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-xs font-bold transition-colors">Reject</button>
                                                </>
                                            )}
                                            {isSuperAdmin && (
                                                <button onClick={() => { setAssignProviderCourse(c); setSelectedProvider(c.course_provider || ''); setIsAssignProviderOpen(true); }} className="px-2 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg text-xs font-bold transition-colors">Provider</button>
                                            )}
                                            {canManage && (
                                                <button onClick={() => handleDelete(c.id)} className="px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-xs font-bold transition-colors">Delete</button>
                                            )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Course">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

                    <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} autoFocus />

                    <CloudinaryUpload
                        label="Course Thumbnail"
                        folder="lms-course-thumbnails"
                        resourceType="image"
                        value={form.thumbnail_url || ''}
                        onUploadSuccess={url => setForm({ ...form, thumbnail_url: url })}
                        disabled={isActionLoading}
                    />
                    {form.thumbnail_url && (
                        <div className="rounded-xl overflow-hidden border border-border h-32">
                            <img src={form.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-1">Description</label>
                        <textarea
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px] resize-y"
                            placeholder="Course description…"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            disabled={isActionLoading}
                        />
                    </div>

                    {isSuperAdmin && (
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Organization <span className="text-muted-foreground font-normal">(optional)</span></label>
                            <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} disabled={isActionLoading}>
                                <option value="">None</option>
                                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Language</label>
                            <select className={SELECT_CLS} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} disabled={isActionLoading}>
                                <option value="en">English (en)</option>
                                <option value="am">Amharic (am)</option>
                                <option value="om">Oromo (om)</option>
                                <option value="so">Somali (so)</option>
                                <option value="ti">Tigrinya (ti)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Level</label>
                            <select className={SELECT_CLS} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} disabled={isActionLoading}>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Status</label>
                            <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isActionLoading || (!!selectedCourse && selectedCourse.status === 'submitted')}>
                                <option value="draft">Draft</option>
                                <option value="submitted">Submitted</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving…' : 'Save Changes'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Assign Provider Modal */}
            <Modal isOpen={isAssignProviderOpen} onClose={() => setIsAssignProviderOpen(false)} title="Reassign Course Provider">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Select a new course provider for: <strong>{assignProviderCourse?.title}</strong></p>
                    <select className={SELECT_CLS} value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}>
                        <option value="">Select provider</option>
                        {providers.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>)}
                    </select>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setIsAssignProviderOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAssignProvider} disabled={!selectedProvider || isActionLoading}>{isActionLoading ? 'Assigning…' : 'Assign'}</Button>
                    </div>
                </div>
            </Modal>

            {/* Assign Organization Modal */}
            <Modal isOpen={isAssignOrgOpen} onClose={() => setIsAssignOrgOpen(false)} title="Assign Organization">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Link organization for: <strong>{assignOrgCourse?.title}</strong></p>
                    <select className={SELECT_CLS} value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
                        <option value="">Unlink (none)</option>
                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setIsAssignOrgOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAssignOrg} disabled={isActionLoading}>{isActionLoading ? 'Saving…' : 'Save'}</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={!!submitConfirmId}
                onClose={() => setSubmitConfirmId(null)}
                onConfirm={handleSubmitForReview}
                title="Submit for Review"
                message="Are you sure you want to submit this course for review? Once submitted, it will be locked and only a System Administrator can approve or reject it. You will not be able to edit it until the review is complete."
                confirmText="Submit"
                variant="warning"
                isLoading={isActionLoading}
            />

            <ConfirmModal
                isOpen={!!withdrawConfirmId}
                onClose={() => setWithdrawConfirmId(null)}
                onConfirm={handleWithdraw}
                title="Withdraw Submission"
                message="Are you sure you want to withdraw this course from review? It will be moved back to Draft so you can make changes. You will need to submit it again for review when ready."
                confirmText="Withdraw"
                variant="warning"
                isLoading={isActionLoading}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Course"
                message="Are you sure you want to delete this course? This action cannot be undone."
                confirmText="Delete"
                isLoading={isActionLoading}
            />

            {/* Rejection Reason Modal */}
            <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Course">
                <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Provide a reason for rejecting this course. The course provider will see this feedback.</p>
                <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Rejection Reason <span className="text-red-500">*</span></label>
                    <textarea
                    className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] resize-y"
                    placeholder="Explain why the course is being rejected…"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    disabled={isActionLoading}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                    <Button variant="primary" onClick={handleRejectConfirm} disabled={!rejectionReason.trim() || isActionLoading}>{isActionLoading ? 'Rejecting…' : 'Reject'}</Button>
                </div>
                </div>
            </Modal>
        </div>
    );
}
