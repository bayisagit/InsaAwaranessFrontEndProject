'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getMemberships, createMembership, updateMembership, deleteMembership, getOrganizations, apiFetch, Membership, Organization } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';
import { toast } from 'react-hot-toast';

interface UserData { id: string; email: string; first_name: string; last_name: string; }

const SELECT_CLS = "block w-full rounded-lg border border-border py-2.5 px-3 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card font-medium";
const ALLOWED_ROLES = ['super_admin', 'org_admin', 'course_provider'];

export default function AdminMembershipsPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterOrg, setFilterOrg] = useState(''); // UUID or ''
    const [filterRole, setFilterRole] = useState(''); // 'admin' | 'member' | ''
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateExpanded, setIsCreateExpanded] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);

    const [form, setForm] = useState({
        user: '',
        organization: '',
        org_role: 'member',
        department: '',
        employee_id: '',
        is_primary: false
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) router.push('/login');
            else if (!ALLOWED_ROLES.includes(user?.role || '')) router.push('/dashboard');
            else {
                fetchRelatedData();
                fetchMemberships();
            }
        }
    }, [isAuthenticated, isLoading, user, router, page, searchTerm, filterOrg, filterRole]);

    const fetchRelatedData = async () => {
        const [uRes, oRes] = await Promise.all([
            apiFetch('/api/auth/users/?page_size=100'),
            getOrganizations({ page_size: 100 })
        ]);
        if (uRes.data?.results) setUsers(uRes.data.results);
        else if (Array.isArray(uRes.data)) setUsers(uRes.data);

        if (oRes.data?.results) setOrgs(oRes.data.results);
        else if (Array.isArray(oRes.data)) setOrgs(oRes.data);
    };

    const fetchMemberships = async () => {
        setIsFetching(true);
        setError('');
        const params: Record<string, any> = {
            page: page.toString(),
            page_size: pageSize.toString(),
        };
        if (searchTerm.trim()) params.search = searchTerm.trim();
        // Org admins are automatically scoped by the backend, but we can
        // pre-filter super_admins by org when a filter is selected.
        if (filterOrg) params.organization = filterOrg;
        if (filterRole) params.org_role = filterRole;

        const { data, error: e } = await getMemberships(params);
        if (e) setError(e);
        else if (data?.results) {
            setMemberships(data.results);
            setTotalCount(data.count || 0);
        } else if (Array.isArray(data)) {
            setMemberships(data as Membership[]);
            setTotalCount((data as Membership[]).length);
        }
        setIsFetching(false);
    };

    const openModal = (m: Membership) => {
        setActionError('');
        setIsCreateExpanded(false);
        setSelectedMembership(m);
        setForm({
            user: m.user,
            organization: m.organization,
            org_role: m.org_role,
            department: m.department || '',
            employee_id: m.employee_id || '',
            is_primary: m.is_primary
        });
        setIsModalOpen(true);
    };

    const toggleCreate = () => {
        if (!isCreateExpanded) {
            setActionError('');
            setSelectedMembership(null);
            setForm({
                user: '',
                organization: '',
                org_role: 'member',
                department: '',
                employee_id: '',
                is_primary: false
            });
        }
        setIsCreateExpanded(!isCreateExpanded);
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setActionError('');
        setIsActionLoading(true);

        const isEditing = !!selectedMembership;
        const payload = {
            user: form.user,
            organization: form.organization,
            org_role: form.org_role as 'admin' | 'member',
            department: form.department || undefined,
            employee_id: form.employee_id || undefined,
            is_primary: form.is_primary,
        };

        const { error: apiErr, status } = isEditing
            ? await updateMembership(selectedMembership.id, payload)
            : await createMembership(payload);

        if (apiErr || (status !== 200 && status !== 201)) {
            setActionError(apiErr || 'Failed to save membership.');
        } else {
            toast.success(isEditing ? 'Membership updated.' : 'Membership created.');
            fetchMemberships();
            if (isEditing) {
                setIsModalOpen(false);
            } else {
                setIsCreateExpanded(false);
            }
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
        const { error: e, status } = await deleteMembership(itemToDelete);
        if (e || status !== 204) {
            toast.error(e || 'Failed to delete membership.');
        } else {
            toast.success('Membership removed.');
            fetchMemberships();
        }
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setIsActionLoading(false);
    };

    const getUserLabel = (id: string) => {
        const u = users.find(x => x.id === id);
        return u ? `${u.first_name} ${u.last_name} (${u.email})` : id;
    };

    const getOrgName = (id: string) => {
        return orgs.find(o => o.id === id)?.name || id;
    };

    if (isLoading || isFetching) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!user || !ALLOWED_ROLES.includes(user.role)) return null;

    return (
        <div className="min-h-screen bg-muted pb-20">
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-1">Memberships</h1>
                        <p className="text-muted-foreground">Manage user roles and departmental links within organizations.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4 items-end">
                    <div className="max-w-xs flex-1">
                        <Input
                            placeholder="Search by email, department, ID…"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    {user.role === 'super_admin' && (
                        <select
                            className={SELECT_CLS + ' max-w-[220px]'}
                            value={filterOrg}
                            onChange={e => { setFilterOrg(e.target.value); setPage(1); }}
                        >
                            <option value="">All Organizations</option>
                            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    )}
                    <select
                        className={SELECT_CLS + ' max-w-[160px]'}
                        value={filterRole}
                        onChange={e => { setFilterRole(e.target.value); setPage(1); }}
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                    </select>
                </div>

                <ExpandableCreateSection
                    title="Link User"
                    isOpen={isCreateExpanded}
                    onToggle={toggleCreate}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">User</label>
                            <select
                                className={SELECT_CLS}
                                value={form.user}
                                onChange={e => setForm({ ...form, user: e.target.value })}
                                disabled={isActionLoading}
                                required
                                autoFocus
                            >
                                <option value="" disabled>Select a user</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Organization</label>
                            <select
                                className={SELECT_CLS}
                                value={form.organization}
                                onChange={e => setForm({ ...form, organization: e.target.value })}
                                disabled={isActionLoading}
                                required
                            >
                                <option value="" disabled>Select organization</option>
                                {orgs.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1">Org Role</label>
                                <select
                                    className={SELECT_CLS}
                                    value={form.org_role}
                                    onChange={e => setForm({ ...form, org_role: e.target.value as any })}
                                    disabled={isActionLoading}
                                    required
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                        checked={form.is_primary}
                                        onChange={e => setForm({ ...form, is_primary: e.target.checked })}
                                        disabled={isActionLoading}
                                    />
                                    <span className="text-sm font-semibold text-foreground">Set as Primary</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Department"
                                value={form.department}
                                onChange={e => setForm({ ...form, department: e.target.value })}
                                disabled={isActionLoading}
                                placeholder="e.g., IT Security"
                            />
                            <Input
                                label="Employee ID"
                                value={form.employee_id}
                                onChange={e => setForm({ ...form, employee_id: e.target.value })}
                                disabled={isActionLoading}
                                placeholder="e.g., INSA-1234"
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>Cancel</Button>
                            <Button type="submit" variant="primary" disabled={isActionLoading}>
                                {isActionLoading ? 'Saving...' : 'Link User'}
                            </Button>
                        </div>
                    </form>
                </ExpandableCreateSection>

                <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
                    <table className="w-full text-left text-sm text-muted-foreground">
                        <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Organization</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">ID / Dept</th>
                                <th className="px-6 py-4 text-center">Primary</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {memberships.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No memberships yet.</td></tr>
                            ) : memberships.map(m => (
                                <tr key={m.id} className="hover:bg-muted transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">{getUserLabel(m.user)}</td>
                                    <td className="px-6 py-4 text-muted-foreground font-medium">{getOrgName(m.organization)}</td>
                                    <td className="px-6 py-4 uppercase text-[10px] font-bold">
                                        <span className={`px-2 py-0.5 rounded-full ${m.org_role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-muted text-muted-foreground border border-border'}`}>
                                            {m.org_role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono">
                                        {m.employee_id || 'N/A'} <br />
                                        <span className="text-muted-foreground font-sans italic">{m.department || 'No dept'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {m.is_primary ? (
                                            <span className="text-green-500 font-bold">✓</span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button onClick={() => openModal(m)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors">Edit</button>
                                        <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalCount > pageSize && (
                    <div className="mt-6 flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                        <span className="text-sm text-muted-foreground">Showing {memberships.length} of {totalCount} results</span>
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Membership">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-1">User</label>
                        <select
                            className={SELECT_CLS}
                            value={form.user}
                            onChange={e => setForm({ ...form, user: e.target.value })}
                            disabled={true}
                            required
                        >
                            <option value="" disabled>Select a user</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-1">Organization</label>
                        <select
                            className={SELECT_CLS}
                            value={form.organization}
                            onChange={e => setForm({ ...form, organization: e.target.value })}
                            disabled={true}
                            required
                        >
                            <option value="" disabled>Select organization</option>
                            {orgs.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">Org Role</label>
                            <select
                                className={SELECT_CLS}
                                value={form.org_role}
                                onChange={e => setForm({ ...form, org_role: e.target.value as any })}
                                disabled={isActionLoading}
                                required
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                    checked={form.is_primary}
                                    onChange={e => setForm({ ...form, is_primary: e.target.checked })}
                                    disabled={isActionLoading}
                                />
                                <span className="text-sm font-semibold text-foreground">Set as Primary</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Department"
                            value={form.department}
                            onChange={e => setForm({ ...form, department: e.target.value })}
                            disabled={isActionLoading}
                            placeholder="e.g., IT Security"
                        />
                        <Input
                            label="Employee ID"
                            value={form.employee_id}
                            onChange={e => setForm({ ...form, employee_id: e.target.value })}
                            disabled={isActionLoading}
                            placeholder="e.g., INSA-1234"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={isActionLoading}>
                            {isActionLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Remove Membership"
                message="Are you sure you want to remove this membership? This user will lose access to the organization's resources."
                confirmText="Remove"
                isLoading={isActionLoading}
            />
        </div>
    );
}
