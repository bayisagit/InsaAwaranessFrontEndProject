'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch, Organization } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ExpandableCreateSection } from '@/components/ExpandableCreateSection';
import { useTranslations } from 'next-intl';

const SELECT_CLS = "block w-full rounded-lg border border-border py-2.5 px-3 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card disabled:opacity-75 disabled:bg-muted/50 disabled:cursor-not-allowed";

interface UserData {
 id: string;
 email: string;
 first_name: string;
 last_name: string;
 role: string;
 is_active: boolean;
 date_joined?: string;
}

export default function AdminUsersPage() {
 const { user, isAuthenticated, isLoading } = useAuth();
 const t = useTranslations('adminUsers');
 const router = useRouter();
 const [users, setUsers] = useState<UserData[]>([]);
 const [isFetching, setIsFetching] = useState(true);
 const [error, setError] = useState('');
 const [actionError, setActionError] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isCreateExpanded, setIsCreateExpanded] = useState(false);
 const [isActionLoading, setIsActionLoading] = useState(false);
 const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
 const [organizations, setOrganizations] = useState<Organization[]>([]);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [itemToDelete, setItemToDelete] = useState<string | null>(null);
 const [roleFilter, setRoleFilter] = useState<string>('');

 const [formData, setFormData] = useState({
 first_name: '',
 last_name: '',
 email: '',
 password: '',
 role: 'member',
 organization_id: '',
 preferred_language: 'en'
 });

 useEffect(() => {
 if (!isLoading) {
 if (!isAuthenticated) {
 router.push('/login');
 } else if (user?.role !== 'super_admin' && user?.role !== 'org_admin') {
 // Ensure only admins can access this page
 router.push('/dashboard');
 } else {
 fetchUsers();
 fetchOrganizations();
 }
 }
 }, [isAuthenticated, isLoading, user, router]);

 const fetchOrganizations = async () => {
 const { data } = await apiFetch('/api/v1/organizations/');
 if (data?.results) setOrganizations(data.results);
 else if (Array.isArray(data)) setOrganizations(data);
 };

 const fetchUsers = async () => {
 setIsFetching(true);
 setError('');
 const { data, error: apiError, status } = await apiFetch('/api/auth/users/');

 if (apiError || status !== 200) {
 setError(apiError || 'Failed to fetch users');
 } else if (Array.isArray(data)) {
 // Sometimes DRF returns paginated results { count, next, previous, results: [] }
 setUsers(data);
 } else if (data && Array.isArray(data.results)) {
 setUsers(data.results);
 }
 setIsFetching(false);
 };

 const openModal = (targetUser: UserData) => {
 setActionError('');
 setIsCreateExpanded(false);
 setSelectedUser(targetUser);
 setFormData({
 first_name: targetUser.first_name,
 last_name: targetUser.last_name,
 email: targetUser.email,
 password: '', // Leave blank for edit unless changing
 role: targetUser.role || 'member',
 organization_id: '', // Role-specific creation only usually
 preferred_language: 'en'
 });
 setIsModalOpen(true);
 };

 const toggleCreate = () => {
 if (!isCreateExpanded) {
 setActionError('');
 setSelectedUser(null);
 setFormData({
 first_name: '',
 last_name: '',
 email: '',
 password: '',
 role: user?.role === 'org_admin' ? 'member' : 'member', // Default to member
 organization_id: organizations[0]?.id || '',
 preferred_language: 'en'
 });
 }
 setIsCreateExpanded(!isCreateExpanded);
 };

 const handleCloseModal = () => {
 setIsModalOpen(false);
 setSelectedUser(null);
 };

 const handleFormSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setActionError('');
 setIsActionLoading(true);

 const isEditing = !!selectedUser;
 let endpoint = `/api/auth/users/${isEditing ? `${selectedUser.id}/` : ''}`;
 let method = isEditing ? 'PATCH' : 'POST';

 // Creation with specialized endpoints
 if (!isEditing) {
 method = 'POST';
 switch (formData.role) {
 case 'course_provider':
 endpoint = '/api/auth/users/course-providers/';
 break;
 case 'member':
 endpoint = '/api/auth/users/members/';
 break;
 case 'org_admin':
 endpoint = '/api/auth/users/org-admins/';
 break;
 case 'super_admin':
 endpoint = '/api/auth/users/super-admins/';
 break;
 default:
 endpoint = '/api/auth/users/';
 break;
 }
 }

 const payload: any = {
 first_name: formData.first_name,
 last_name: formData.last_name,
 email: formData.email,
 preferred_language: formData.preferred_language,
 };
 if (formData.organization_id) {
 payload.organization_id = formData.organization_id;
 }

 // For regular user creation (if any) or editing, we might need password/role
 if (endpoint === '/api/auth/users/' || isEditing) {
 if (formData.password) payload.password = formData.password;
 if (formData.role) payload.role = formData.role;
 }

 const { data, error: apiError, status } = await apiFetch(endpoint, {
 method,
 body: JSON.stringify(payload)
 });

 if (apiError || (status !== 200 && status !== 201)) {
 const displayError = status ? `Error ${status}: ${apiError}` : (apiError || 'An unexpected error occurred.');
 setActionError(displayError);
 } else {
 if (!isEditing && data?.default_password) {
 alert(`User created successfully!\nDefault Password: ${data.default_password}`);
 }
 fetchUsers();
 if (isEditing) {
 handleCloseModal();
 } else {
 setIsCreateExpanded(false);
 }
 }
 setIsActionLoading(false);
 };

 const handleDeleteUser = (id: string) => {
 setItemToDelete(id);
 setIsDeleteModalOpen(true);
 };

 const confirmDelete = async () => {
 if (!itemToDelete) return;
 setIsActionLoading(true);
 setError('');

 const { error: apiError, status } = await apiFetch(`/api/auth/users/${itemToDelete}/`, {
 method: 'DELETE'
 });

 if (apiError || status !== 204) {
 setError(apiError || 'Failed to delete user.');
 } else {
 fetchUsers();
 }
 setIsDeleteModalOpen(false);
 setItemToDelete(null);
 setIsActionLoading(false);
 };

 if (isLoading || isFetching) {
 return (
 <div className="flex justify-center items-center min-h-[50vh]">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
 </div>
 );
 }

 if (!user || (user.role !== 'super_admin' && user.role !== 'org_admin')) return null;

 return (
 <div className="min-h-screen bg-muted pb-20">
 {/* Header */}
 <div className="bg-card border-b border-border">
 <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
 <div>
 <h1 className="text-3xl font-bold text-foreground mb-2">Members</h1>
 <p className="text-muted-foreground">{t('userManagementDesc')}</p>
 </div>
 </div>
 </div>

 <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
 {error && (
 <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
 {error}
 </div>
 )}

 <ExpandableCreateSection
 title={t('addNewUser')}
 isOpen={isCreateExpanded}
 onToggle={toggleCreate}
 >
 <form onSubmit={handleFormSubmit} className="space-y-4">
 {actionError && (
 <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
 {actionError}
 </div>
 )}

 <div className="grid grid-cols-2 gap-4">
 <Input
 label={t('firstName')}
 name="first_name"
 value={formData.first_name}
 onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
 required
 disabled={isActionLoading}
 autoFocus
 />
 <Input
 label={t('lastName')}
 name="last_name"
 value={formData.last_name}
 onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
 required
 disabled={isActionLoading}
 />
 </div>

 <Input
 label={t('emailAddress')}
 type="email"
 name="email"
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 required
 disabled={isActionLoading}
 />

 <div className="grid grid-cols-2 gap-4">
 {user?.role === 'org_admin' ? (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">
 Organization
 </label>
 <div className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-muted-foreground font-medium text-sm">
 {user.organization_name || t('yourOrganization')}
 </div>
 </div>
 ) : (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">
 Organization
 </label>
 <select
 className={SELECT_CLS}
 value={formData.organization_id}
 onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
 disabled={isActionLoading}
 required={formData.role !== 'course_provider'}
 >
 <option value="">{t('selectOrganization')}</option>
 {organizations.map(org => (
 <option key={org.id} value={org.id}>{org.name}</option>
 ))}
 </select>
 </div>
 )}
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">
 Language
 </label>
 <select
 className={SELECT_CLS}
 value={formData.preferred_language}
 onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
 disabled={isActionLoading}
 >
 <option value="en">{t('english')}</option>
 <option value="am">{t('amharic')}</option>
 </select>
 </div>
 </div>

 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">
 User Role
 </label>
 {user?.role === 'org_admin' ? (
 <div className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-muted-foreground font-medium">
 Member
 </div>
 ) : (
 <select
 className={SELECT_CLS}
 value={formData.role}
 onChange={(e) => setFormData({ ...formData, role: e.target.value })}
 disabled={isActionLoading}
 >
 <option value="member">{t('member')}</option>
 <option value="course_provider">{t('courseProvider')}</option>
 <option value="org_admin">{t('organizationAdmin')}</option>
 <option value="super_admin">{t('superAdmin')}</option>
 <option value="public_user">{t('publicUser')}</option>
 </select>
 )}

 {formData.role === 'public_user' && (
 <Input
 label={t('password')}
 type="password"
 name="password"
 value={formData.password}
 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
 required={true}
 disabled={isActionLoading}
 />
 )}

 </div>

 <div className="pt-4 flex justify-end gap-3">
 <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>
 Cancel
 </Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>
 {isActionLoading ? t('saving') : t('createUser')}
 </Button>
 </div>
 </form>
 </ExpandableCreateSection>

  {/* Filter Bar */}
  {user?.role === 'super_admin' && (
      <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('role')}</label>
      <select
      className="rounded-lg border border-border py-1.5 px-3 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card"
      value={roleFilter}
      onChange={e => setRoleFilter(e.target.value)}
      >
      <option value="">{t('all')}</option>
      <option value="member">{t('member')}</option>
      <option value="course_provider">{t('courseProvider')}</option>
      <option value="org_admin">Org Admin</option>
      <option value="super_admin">{t('superAdmin')}</option>
      <option value="public_user">{t('publicUser')}</option>
      </select>
      </div>
      {roleFilter && (
      <button
      onClick={() => setRoleFilter('')}
      className="text-xs text-primary font-bold hover:text-primary transition-colors duration-200-hover cursor-pointer"
      >
      {t('clearFilter')}
      </button>
      )}
      </div>
  )}

 {/* User Table */}
 <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
 <table className="w-full text-left text-sm text-muted-foreground">
 <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
 <tr>
 <th className="px-4 py-3">{t('name')}</th>
 <th className="px-4 py-3">{t('email')}</th>
 <th className="px-4 py-3">{t('role')}</th>
 <th className="px-4 py-3">{t('status')}</th>
 <th className="px-4 py-3 text-right">{t('actions')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {users.length === 0 ? (
 <tr>
 <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
 No users found.
 </td>
 </tr>
 ) : (
 users.filter(u => u.id !== user?.id && (!roleFilter || u.role === roleFilter)).map((u) => (
 <tr key={u.id} className="hover:bg-muted transition-colors">
 <td className="px-4 py-3 font-medium text-foreground">
 {u.first_name} {u.last_name}
 </td>
 <td className="px-4 py-3">{u.email}</td>
 <td className="px-4 py-3">
 <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium border border-blue-100 uppercase">
 {u.role ? u.role.replace('_', ' ') : 'USER'}
 </span>
 </td>
 <td className="px-4 py-3">
 <span className={`px-2 py-1 rounded-full text-xs font-medium border ${u.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
 {u.is_active ? t('active') : t('inactive')}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 <div className="flex items-center justify-end gap-2">
 <button onClick={() => openModal(u)} className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">{t('edit')}</button>
 <button onClick={() => handleDeleteUser(u.id)} className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">{t('delete')}</button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>

 <Modal
 isOpen={isModalOpen}
 onClose={handleCloseModal}
 title={t('editUser')}
 >
 <form onSubmit={handleFormSubmit} className="space-y-4">
 {actionError && (
 <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
 {actionError}
 </div>
 )}

 <div className="grid grid-cols-2 gap-4">
 <Input
 label={t('firstName')}
 name="first_name"
 value={formData.first_name}
 onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
 required
 disabled={isActionLoading}
 autoFocus
 />
 <Input
 label={t('lastName')}
 name="last_name"
 value={formData.last_name}
 onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
 required
 disabled={isActionLoading}
 />
 </div>

 <Input
 label={t('emailAddress')}
 type="email"
 name="email"
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 required
 disabled={isActionLoading}
 />

 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">
 User Role
 </label>
 {user?.role === 'org_admin' ? (
 <div className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-muted-foreground font-medium">
 Member
 </div>
 ) : (
 <select
 className={SELECT_CLS}
 value={formData.role}
 onChange={(e) => setFormData({ ...formData, role: e.target.value })}
 disabled={isActionLoading}
 >
 <option value="member">{t('member')}</option>
 <option value="course_provider">{t('courseProvider')}</option>
 <option value="org_admin">{t('organizationAdmin')}</option>
 <option value="super_admin">{t('superAdmin')}</option>
 <option value="public_user">{t('publicUser')}</option>
 </select>
 )}
 </div>

 <Input
 label={t('newPasswordOptional')}
 type="password"
 name="password"
 value={formData.password}
 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
 required={false}
 disabled={isActionLoading}
 />

 <div className="pt-4 flex justify-end gap-3">
 <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isActionLoading}>
 Cancel
 </Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>
 {isActionLoading ? t('saving') : t('saveChanges')}
 </Button>
 </div>
 </form>
 </Modal>

 <ConfirmModal
 isOpen={isDeleteModalOpen}
 onClose={() => setIsDeleteModalOpen(false)}
 onConfirm={confirmDelete}
 title={t('deleteUser')}
 message={t('deleteConfirmMessage')}
 confirmText={t('delete')}
 isLoading={isActionLoading}
 />
 </div>
 );
}
