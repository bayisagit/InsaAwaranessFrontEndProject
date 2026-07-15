'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    getCourses, createCourse, updateCourse, deleteCourse,
    getOrganizations, assignCourseProvider, assignCourseOrganization,
    apiFetch, Course, Organization
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { toast } from 'react-hot-toast';

interface UserData { id: string; email: string; first_name: string; last_name: string; role: string; }

const SELECT_CLS = "block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white disabled:opacity-75 disabled:bg-gray-100 disabled:cursor-not-allowed";
const STATUS_COLORS: Record<string, string> = {
    published: 'bg-green-50 text-green-700',
    draft: 'bg-yellow-50 text-yellow-700',
    archived: 'bg-gray-100 text-gray-600',
};

export default function AdminCoursesPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [courses, setCourses] = useState<Course[]>([]);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [providers, setProviders] = useState<UserData[]>([]);
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

    // Delete confirm
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Assign Provider modal
    const [isAssignProviderOpen, setIsAssignProviderOpen] = useState(false);
    const [assignProviderCourse, setAssignProviderCourse] = useState<Course | null>(null);
    const [selectedProvider, setSelectedProvider] = useState('');

    // Assign Organization modal
    const [isAssignOrgOpen, setIsAssignOrgOpen] = useState(false);
    const [assignOrgCourse, setAssignOrgCourse] = useState<Course | null>(null);
    const [selectedOrg, setSelectedOrg] = useState('');

    // Filters
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
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
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (!['super_admin', 'course_provider'].includes(user?.role || '')) router.push('/dashboard');
            else { fetchCourses(); fetchOrgs(); fetchUsers(); }
        }
    }, [isAuthenticated, isLoading, user, router, fetchCourses, fetchOrgs, fetchUsers]);

    const openModal = (course?: Course) => {
        setActionError('');
        if (course) {
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
        } else {
            setSelectedCourse(null);
            setForm({
                title: '', description: '',
                organization: '',
                course_provider: user?.role === 'course_provider' ? (user?.id || '') : '',
                language: 'en', level: 'Beginner', status: 'draft', is_active: true, thumbnail_url: ''
            });
        }
        setIsModalOpen(true);
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

        const { error: apiErr } = isEditing
            ? await updateCourse(selectedCourse!.id, payload)
            : await createCourse(payload);

        if (apiErr) {
            setActionError(apiErr);
        } else {
            toast.success(isEditing ? 'Course updated.' : 'Course created.');
            fetchCourses();
            setIsModalOpen(false);
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

    if (isLoading || isFetching) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
    );
    if (!user || !['super_admin', 'course_provider'].includes(user.role)) return null;

    const filteredCourses = courses.filter(c => {
        const matchesStatus = selectedStatuses.length === 0 || (c.status && selectedStatuses.includes(c.status));
        const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const isSuperAdmin = user.role === 'super_admin';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Courses Management</h1>
                        <p className="text-gray-500">Create and manage cybersecurity training courses.</p>
                    </div>
                    <Button variant="primary" onClick={() => openModal()}>+ Add Course</Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filter */}
                <div className="w-full lg:w-64 shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search</label>
                            <input
                                type="text"
                                placeholder="Course title…"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Status</h3>
                            <div className="space-y-3">
                                {['draft', 'published', 'archived'].map(status => (
                                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={selectedStatuses.includes(status)}
                                            onChange={() => setSelectedStatuses(prev =>
                                                prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                                            )}
                                        />
                                        <span className="text-sm text-gray-600 capitalize">{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {(selectedStatuses.length > 0 || searchQuery) && (
                            <button
                                onClick={() => { setSelectedStatuses([]); setSearchQuery(''); }}
                                className="text-xs text-primary font-bold hover:text-primary-hover flex items-center gap-1"
                            >
                                ✕ Clear filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Level</th>
                                    <th className="px-6 py-4">Language</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredCourses.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No courses found.</td></tr>
                                ) : filteredCourses.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                {c.thumbnail_url ? (
                                                    <img src={c.thumbnail_url} alt={c.title} className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                                                    </div>
                                                )}
                                                <span>{c.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 capitalize">{c.level || '—'}</td>
                                        <td className="px-6 py-4 uppercase text-xs">{c.language || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {c.status || 'draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                            {/* Publish/Archive quick actions */}
                                            {isSuperAdmin && c.status === 'draft' && (
                                                <button onClick={() => handleStatusUpdate(c.id, 'published')} className="text-green-600 hover:text-green-800 font-medium transition-colors" disabled={isActionLoading}>Publish</button>
                                            )}
                                            {isSuperAdmin && c.status === 'published' && (
                                                <button onClick={() => handleStatusUpdate(c.id, 'archived')} className="text-gray-500 hover:text-gray-700 font-medium transition-colors" disabled={isActionLoading}>Archive</button>
                                            )}
                                            {/* Course provider can publish their own draft */}
                                            {user.role === 'course_provider' && c.status === 'draft' && c.course_provider === user.id && (
                                                <button onClick={() => handleStatusUpdate(c.id, 'published')} className="text-green-600 hover:text-green-800 font-medium transition-colors" disabled={isActionLoading}>Publish</button>
                                            )}
                                            <button onClick={() => openModal(c)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Edit</button>
                                            {isSuperAdmin && (
                                                <>
                                                    <button onClick={() => { setAssignProviderCourse(c); setSelectedProvider(c.course_provider || ''); setIsAssignProviderOpen(true); }} className="text-purple-600 hover:text-purple-800 font-medium transition-colors">Provider</button>
                                                    <button onClick={() => { setAssignOrgCourse(c); setSelectedOrg(c.organization || ''); setIsAssignOrgOpen(true); }} className="text-teal-600 hover:text-teal-800 font-medium transition-colors">Org</button>
                                                </>
                                            )}
                                            <button onClick={() => { router.push(`/admin/assessments?course=${c.id}`); }} className="text-primary hover:text-primary-hover font-medium transition-colors">Exam</button>
                                            <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create / Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCourse ? 'Edit Course' : 'Add Course'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}

                    <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} />

                    <CloudinaryUpload
                        label="Course Thumbnail"
                        folder="lms-course-thumbnails"
                        resourceType="image"
                        value={form.thumbnail_url || ''}
                        onUploadSuccess={url => setForm({ ...form, thumbnail_url: url })}
                        disabled={isActionLoading}
                    />
                    {form.thumbnail_url && (
                        <div className="rounded-xl overflow-hidden border border-gray-200 h-32">
                            <img src={form.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px] resize-y"
                            placeholder="Course description…"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            disabled={isActionLoading}
                        />
                    </div>

                    {/* Organization — super_admin create only (backend rejects if course_provider sends it) */}
                    {isSuperAdmin && !selectedCourse && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Organization <span className="text-gray-400 font-normal">(optional)</span></label>
                            <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} disabled={isActionLoading}>
                                <option value="">None</option>
                                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Course Provider — super_admin create only */}
                    {isSuperAdmin && !selectedCourse && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Course Provider <span className="text-primary">*</span></label>
                            <select className={SELECT_CLS} value={form.course_provider} onChange={e => setForm({ ...form, course_provider: e.target.value })} disabled={isActionLoading} required>
                                <option value="">Select provider</option>
                                {providers.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>)}
                            </select>
                            {providers.length === 0 && <p className="text-[10px] text-red-500 mt-1">No course provider users found.</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
                            <select className={SELECT_CLS} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} disabled={isActionLoading}>
                                <option value="en">English (en)</option>
                                <option value="am">Amharic (am)</option>
                                <option value="om">Oromo (om)</option>
                                <option value="so">Somali (so)</option>
                                <option value="ti">Tigrinya (ti)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Level</label>
                            <select className={SELECT_CLS} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} disabled={isActionLoading}>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                            <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isActionLoading}>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? 'Saving…' : selectedCourse ? 'Save Changes' : 'Create Course'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Assign Provider Modal */}
            <Modal isOpen={isAssignProviderOpen} onClose={() => setIsAssignProviderOpen(false)} title="Reassign Course Provider">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Select a new course provider for: <strong>{assignProviderCourse?.title}</strong></p>
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
                    <p className="text-sm text-gray-600">Link organization for: <strong>{assignOrgCourse?.title}</strong></p>
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
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Course"
                message="Are you sure you want to delete this course? This action cannot be undone."
                confirmText="Delete"
                isLoading={isActionLoading}
            />
        </div>
    );
}
