'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';

interface ArticleData {
    id: string;
    module: string;
    content: string;
    category?: string;
    difficulty?: string;
    language?: string;
    version?: string;
    order: number;
}

interface ModuleOption { id: string; title: string; }

export default function AdminArticlesPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [articles, setArticles] = useState<ArticleData[]>([]);
    const [modules, setModules] = useState<ModuleOption[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const [actionError, setActionError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Filter states
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    // Article API schema: only module, content, order
    const [formData, setFormData] = useState({
        module: '',
        content: '',
        order: 0
    });


    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.role !== 'super_admin' && user?.role !== 'course_provider') {

                router.push('/dashboard');
            } else {
                fetchArticles();
                fetchModules();
            }
        }
    }, [isAuthenticated, isLoading, user, router, page]);

    const fetchModules = async () => {
        const { data } = await apiFetch('/api/v1/modules/?page_size=100');
        if (data?.results) setModules(data.results);
        else if (Array.isArray(data)) setModules(data);
    };

    const fetchArticles = async () => {
        setIsFetching(true);
        setError('');
        const query = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
            search: searchTerm,
            ordering: '-order'
        }).toString();

        const { data, error: apiError, status } = await apiFetch(`/api/v1/articles/?${query}`);

        if (apiError || status !== 200) {
            setError(apiError || 'Failed to fetch articles');
        } else if (data?.results && Array.isArray(data.results)) {
            setArticles(data.results);
            setTotalCount(data.count || 0);
        } else if (Array.isArray(data)) {
            setArticles(data);
            setTotalCount(data.length);
        }
        setIsFetching(false);
    };

    const handleOpenModal = (article?: ArticleData) => {
        setActionError('');
        if (article) {
            setSelectedArticle(article);
            setFormData({ module: article.module, content: article.content, order: article.order });
        } else {
            setSelectedArticle(null);
            setFormData({ module: '', content: '', order: 0 });
        }

        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedArticle(null);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionError('');
        setIsActionLoading(true);

        const isEditing = !!selectedArticle;
        const endpoint = `/api/v1/articles/${isEditing ? `${selectedArticle.id}/` : ''}`;
        const method = isEditing ? 'PATCH' : 'POST';

        // Only send API-supported fields: module, content, order
        const payload = {
            module: formData.module,
            content: formData.content,
            order: Number(formData.order)
        };


        const { error: apiError, status } = await apiFetch(endpoint, {
            method,
            body: JSON.stringify(payload)
        });

        if (apiError || (status !== 200 && status !== 201)) {
            setActionError(apiError || `Failed to ${isEditing ? 'update' : 'create'} article.`);
        } else {
            fetchArticles();
            handleCloseModal();
        }
        setIsActionLoading(false);
    };

    const handleDeleteArticle = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsActionLoading(true);
        setError('');

        const { error: apiError, status } = await apiFetch(`/api/v1/articles/${itemToDelete}/`, {
            method: 'DELETE'
        });

        if (apiError || status !== 204) {
            setError(apiError || 'Failed to delete article.');
        } else {
            fetchArticles();
        }
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setIsActionLoading(false);
    };

    if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (!user || (user.role !== 'super_admin' && user.role !== 'course_provider')) return null;


    // Local search filter — only filter by content text (module filter is done server-side)
    const filteredArticles = searchTerm
        ? articles.filter(a => a.content.toLowerCase().includes(searchTerm.toLowerCase()))
        : articles;


    const getModuleName = (id: string) => modules.find(m => m.id === id)?.title || id;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Articles Management</h1>
                        <p className="text-gray-500">Manage training module articles and content.</p>
                    </div>
                    <div>
                        <Button variant="primary" onClick={() => handleOpenModal()}>Add New Article</Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filter */}
                <div className="w-full lg:w-64 shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Content</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Module</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {modules.map(module => (
                                    <label key={module.id} className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={selectedModules.includes(module.id)}
                                            onChange={() => {
                                                setSelectedModules(prev =>
                                                    prev.includes(module.id) ? prev.filter(id => id !== module.id) : [...prev, module.id]
                                                );
                                            }}
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors leading-tight">{module.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Category</h3>
                            <div className="space-y-2">
                                {['general', 'technical', 'behavioral', 'compliance'].map(cat => (
                                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={selectedCategories.includes(cat)}
                                            onChange={() => {
                                                setSelectedCategories(prev =>
                                                    prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                                );
                                            }}
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors capitalize">{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Difficulty</h3>
                            <div className="space-y-2">
                                {['beginner', 'intermediate', 'advanced'].map(diff => (
                                    <label key={diff} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={selectedDifficulties.includes(diff)}
                                            onChange={() => {
                                                setSelectedDifficulties(prev =>
                                                    prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
                                                );
                                            }}
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors capitalize">{diff}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Language</h3>
                            <div className="space-y-2">
                                {['en', 'am', 'om'].map(lang => (
                                    <label key={lang} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={selectedLanguages.includes(lang)}
                                            onChange={() => {
                                                setSelectedLanguages(prev =>
                                                    prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
                                                );
                                            }}
                                        />
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors uppercase">{lang}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {(selectedModules.length > 0 || selectedCategories.length > 0 || selectedDifficulties.length > 0 || selectedLanguages.length > 0 || searchTerm) && (
                            <button
                                onClick={() => { setSelectedModules([]); setSelectedCategories([]); setSelectedDifficulties([]); setSelectedLanguages([]); setSearchTerm(''); }}
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
                                        <th className="px-6 py-4">Content Preview</th>
                                        <th className="px-6 py-4">Module</th>
                                        <th className="px-6 py-4 text-center">Order</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredArticles.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No articles found matching your criteria.</td></tr>
                                    ) : filteredArticles.map(a => (
                                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 italic truncate max-w-[300px]">"{a.content.substring(0, 80)}..."</td>
                                            <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{getModuleName(a.module)}</td>
                                            <td className="px-6 py-4 text-center">{a.order}</td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button onClick={() => handleOpenModal(a)} className="text-secondary hover:text-primary font-medium mr-3 transition-colors">Edit</button>
                                                <button onClick={() => handleDeleteArticle(a.id)} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedArticle ? "Edit Article" : "Add New Article"}
            >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {actionError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                            {actionError}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Module <span className="text-red-500">*</span></label>
                        <select
                            className="block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white font-medium"
                            value={formData.module}
                            onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                            required
                            disabled={isActionLoading}
                        >
                            <option value="">Select Module</option>
                            {modules.map(m => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Article Content <span className="text-primary">*</span>
                        </label>
                        <textarea
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 min-h-[120px] resize-y"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                            disabled={isActionLoading}
                            placeholder="Enter article content here..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Display Order</label>
                        <input
                            type="number"
                            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-primary focus:border-primary outline-none"
                            value={formData.order}
                            onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            disabled={isActionLoading}
                        />
                    </div>


                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isActionLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>
                            {isActionLoading ? 'Saving...' : selectedArticle ? 'Save Changes' : 'Create Article'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Article"
                message="Are you sure you want to delete this article? This action cannot be undone."
                confirmText="Delete"
                isLoading={isActionLoading}
            />
        </div>
    );
}
