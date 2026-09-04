'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    AllowedEmailDomain,
    getAllowedEmailDomains,
    createAllowedEmailDomain,
    updateAllowedEmailDomain,
    deleteAllowedEmailDomain
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function EmailDomainsAdminPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [domains, setDomains] = useState<AllowedEmailDomain[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [domainToDelete, setDomainToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.role !== 'super_admin') {
                router.push('/dashboard');
            } else {
                fetchDomains();
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    const fetchDomains = async () => {
        setIsFetching(true);
        setError('');
        try {
            const { data, error: apiError } = await getAllowedEmailDomains();
            if (apiError || !data) {
                setError(apiError || 'Failed to fetch email domains');
            } else {
                setDomains(data);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsFetching(false);
        }
    };

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsActionLoading(true);
        setActionError('');
        
        let cleanedDomain = newDomain.trim().toLowerCase();
        if (cleanedDomain.startsWith('@')) {
            cleanedDomain = cleanedDomain.substring(1);
        }

        const { data, error: apiError } = await createAllowedEmailDomain({ domain: cleanedDomain, is_active: true });
        
        if (apiError || !data) {
            setActionError(apiError || 'Failed to add domain');
        } else {
            setNewDomain('');
            setIsAddModalOpen(false);
            fetchDomains();
        }
        setIsActionLoading(false);
    };

    const handleToggleStatus = async (domain: AllowedEmailDomain) => {
        const { error: apiError } = await updateAllowedEmailDomain(domain.id, { is_active: !domain.is_active });
        if (!apiError) {
            fetchDomains();
        } else {
            setError(apiError);
        }
    };

    const confirmDelete = async () => {
        if (!domainToDelete) return;
        setIsActionLoading(true);
        const { error: apiError } = await deleteAllowedEmailDomain(domainToDelete);
        
        if (apiError) {
            setError(apiError);
        } else {
            fetchDomains();
        }
        
        setIsActionLoading(false);
        setIsDeleteModalOpen(false);
        setDomainToDelete(null);
    };

    if (isLoading || isFetching) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || user.role !== 'super_admin') return null;

    return (
        <div className="min-h-screen bg-muted pb-20">
            {/* Header */}
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Allowed Email Domains</h1>
                        <p className="text-muted-foreground">Restrict registration to specific institutional email domains.</p>
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)}>+ Add Domain</Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        <span className="text-blue-500 text-xl">ℹ️</span>
                        <div>
                            <h3 className="font-bold text-blue-900 mb-1">How this works</h3>
                            <p className="text-sm text-blue-800">
                                If the list below is <strong>empty</strong>, any user with any email domain can register. 
                                However, as soon as you add at least one domain to this list, the system will immediately 
                                <strong> block</strong> all other domains during registration.
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
                        {error}
                    </div>
                )}

                {/* Domains Table */}
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground">
                        <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Domain</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date Added</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {domains.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                        No domains configured. Open registration is currently active.
                                    </td>
                                </tr>
                            ) : (
                                domains.map((domain) => (
                                    <tr key={domain.id} className="hover:bg-muted transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            @{domain.domain}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border uppercase ${
                                                domain.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {domain.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(domain.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <button
                                                onClick={() => handleToggleStatus(domain)}
                                                className="text-primary hover:underline font-medium text-sm"
                                            >
                                                {domain.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDomainToDelete(domain.id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="text-red-600 hover:underline font-medium text-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Allowed Domain">
                <form onSubmit={handleAddDomain} className="space-y-4">
                    {actionError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                            {actionError}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-1">Email Domain</label>
                        <div className="flex rounded-xl overflow-hidden border border-border">
                            <span className="bg-muted px-4 py-2 border-r border-border text-muted-foreground font-bold flex items-center">@</span>
                            <input 
                                type="text" 
                                placeholder="e.g. insa.gov.et"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                className="flex-1 px-4 py-2 outline-none focus:ring-0 bg-card text-foreground"
                                required
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Do not include the @ symbol (e.g. type "insa.gov.et", not "@insa.gov.et")</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3 mt-6 min-w-fit">
                        <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={isActionLoading}>Add Domain</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Domain"
                message="Are you sure you want to delete this domain? This may affect users trying to register."
                confirmText="Delete"
                variant="danger"
                isLoading={isActionLoading}
            />
        </div>
    );
}
