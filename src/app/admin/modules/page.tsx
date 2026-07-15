'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';

interface Module {
    id: string;
    course: string;
    title: string;
    order: number;
}


interface Course {
    id: string;
    title: string;
}

const SELECT_CLS = "block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white";

export default function AdminModulesPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [modules, setModules] = useState<Module[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);

    const [form, setForm] = useState({
        course: '',
        title: '',
        order: 0
    });


    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Filtering states
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
    else if (user?.role !== 'super_admin' && user?.role !== 'course_provider') router.push('/dashboard');

            else {
                fetchCourses();
                fetchModules();
            }
        }
    }, [isAuthenticated, isLoading, user, router, page]);

    const fetchCourses = async () => {
        const { data } = await apiFetch('/api/v1/courses/?page_size=100');
        if (data?.results) setCourses(data.results);
        else if (Array.isArray(data)) setCourses(data);
    };

    const fetchModules = async () => {
        setIsFetching(true);
        setError('');
        const query = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
            search: searchTerm,
            ordering: 'order'
        }).toString();

        const { data, error: e } = await apiFetch(`/api/v1/modules/?${query}`);
        if (e) setError(e);
        else if (data?.results) {
            setModules(data.results);
            setTotalCount(data.count || 0);
        } else if (Array.isArray(data)) {
            setModules(data);
            setTotalCount(data.length);
        }
        setIsFetching(false);
    };

    const openModal = (mod?: Module) => {
        setActionError('');
        if (mod) {
            setSelectedModule(mod);
            setForm({
                course: mod.course,
                title: mod.title,
                order: mod.order
            });
        } else {
            setSelectedModule(null);
            setForm({
                course: courses[0]?.id || '',
                title: '',
                order: modules.length + 1
            });
        }
        setIsModalOpen(true);
    };


    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setActionError('');
        setIsActionLoading(true);

        const isEditing = !!selectedModule;
        const endpoint = `/api/v1/modules/${isEditing ? `${selectedModule.id}/` : ''}`;

        // Only send API-supported fields: course, title, order
        const payload = { course: form.course, title: form.title, order: form.order };

        const { error: apiErr, status } = await apiFetch(endpoint, {
            method: isEditing ? 'PATCH' : 'POST',
            body: JSON.stringify(isEditing ? { title: form.title, order: form.order } : payload)
        });

        if (apiErr || (status !== 200 && status !== 201)) {
            setActionError(apiErr || 'Failed to save module.');
        } else {
            fetchModules();
            setIsModalOpen(false);
        }
        setIsActionLoading(false);
    };

    const handleDelete = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsActionLoading(true);
        const { error: e, status } = await apiFetch(`/api/v1/modules/${itemToDelete}/`, { method: 'DELETE' });
        if (e || status !== 204) setError(e || 'Failed to delete module.');
        else fetchModules();
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setIsActionLoading(false);
    };

    const getCourseName = (courseId: string) => {
        return courses.find(c => c.id === courseId)?.title || courseId;
    };

    if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!user || (user.role !== 'super_admin' && user.role !== 'course_provider')) return null;


    const filteredModules = modules.filter(m => {
        const matchesCourse = selectedCourses.length === 0 || selectedCourses.includes(m.course);
        const matchesSearch = !searchTerm || m.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCourse && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Modules Management</h1>
                        <p className="text-gray-500">Organize courses into structured learning modules.</p>
                    </div>
                    <Button variant="primary" onClick={() => openModal()}>Add Module</Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filter */}
                <div className="w-full lg:w-64 shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search by module title..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Parent Course</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {courses.map(course => (
                                    <label key={course.id} className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={selectedCourses.includes(course.id)}
                                            onChange={() => {
                                                setSelectedCourses(prev =>
                                                    prev.includes(course.id) ? prev.filter(id => id !== course.id) : [...prev, course.id]
                                                );
                                            }}
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors leading-tight">{course.title}</span>
                                    </label>
                                ))}
                                {courses.length === 0 && <p className="text-gray-400 text-xs italic">No courses available.</p>}
                            </div>
                        </div>

                        {(selectedCourses.length > 0 || searchTerm) && (
                            <button
                                onClick={() => { setSelectedCourses([]); setSearchTerm(''); }}
                                className="text-xs text-primary font-bold hover:text-primary-hover transition-colors flex items-center gap-1"
                            >
                                ✕ Clear all filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>}

                    <div className="relative">
                        {isFetching && (
                            <div className="absolute inset-0 bg-white/60 z-10 flex items-start justify-center pt-16 rounded-xl">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        )}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Title</th>
                                        <th className="px-6 py-4">Course</th>
                                        <th className="px-6 py-4 text-center">Order</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredModules.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No modules found matching your criteria.</td></tr>
                                    ) : filteredModules.map(m => (
                                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{m.title}</td>
                                            <td className="px-6 py-4 text-gray-600 truncate max-w-[250px]">{getCourseName(m.course)}</td>
                                            <td className="px-6 py-4 text-center">{m.order}</td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button onClick={() => openModal(m)} className="text-secondary hover:text-primary font-medium mr-3 transition-colors">Edit</button>
                                                <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalCount > pageSize && !selectedCourses.length && !searchTerm && (
                            <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                                <span className="text-sm text-gray-500">Showing {modules.length} of {totalCount} modules</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page <= 1 || isFetching}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(page * pageSize) >= totalCount || isFetching}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedModule ? 'Edit Module' : 'Add Module'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{actionError}</div>}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Course</label>
                        <select
                            className={SELECT_CLS}
                            value={form.course}
                            onChange={e => setForm({ ...form, course: e.target.value })}
                            disabled={isActionLoading}
                            required
                        >
                            <option value="" disabled>Select a course</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Module Title"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        required
                        disabled={isActionLoading}
                        placeholder="e.g., Introduction to Phishing"
                    />

                    <Input
                        label="Display Order"
                        type="number"
                        value={form.order}
                        onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                        required
                        disabled={isActionLoading}
                    />

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>
                            {isActionLoading ? 'Saving...' : selectedModule ? 'Save Changes' : 'Create Module'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Module"
                message="Are you sure you want to delete this module? This action cannot be undone."
                confirmText="Delete"
                isLoading={isActionLoading}
            />
        </div>
    );
}
