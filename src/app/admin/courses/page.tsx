'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
 getCourses, createCourse, updateCourse, deleteCourse,
 getOrganizations, assignCourseProvider, assignCourseOrganization, duplicateCourse,
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
import { useTranslations } from 'next-intl';
import {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
 MoreVertical,
 Pencil,
 Building2,
 UserCheck,
 Copy,
 Trash2,
 ExternalLink,
 CheckCircle2,
 XCircle,
 Send,
 Undo2,
} from 'lucide-react';

interface UserData { id: string; email: string; first_name: string; last_name: string; role: string; }

const SELECT_CLS = "block w-full rounded-lg border border-border py-2.5 px-3 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card disabled:opacity-75 disabled:bg-muted/50 disabled:cursor-not-allowed";
const STATUS_COLORS: Record<string, string> = {
 published: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
 draft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
 submitted: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
 archived: 'bg-muted text-muted-foreground border border-border',
};

export default function AdminCoursesPage() {
 const { user, isAuthenticated, isLoading } = useAuth();
 const t = useTranslations('adminCourses');
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
 language: 'en', level: 'Beginner', status: 'draft', is_active: true, thumbnail_url: '',
 payment_type: 'free', course_price: ''
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
 const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
 const [orgSearchQuery, setOrgSearchQuery] = useState('');

 // Duplicate Course modal
 const [duplicateCourseItem, setDuplicateCourseItem] = useState<Course | null>(null);

 // Rejection reason modal
 const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
 const [rejectCourseId, setRejectCourseId] = useState<string | null>(null);
 const [rejectionReason, setRejectionReason] = useState('');

 // Filters
 const [statusFilter, setStatusFilter] = useState<string>('');
 const [orgFilter, setOrgFilter] = useState<string>('');
 const [providerFilter, setProviderFilter] = useState<string>('');
 const [searchQuery, setSearchQuery] = useState('');
 const [dateFilter, setDateFilter] = useState('');
 const [sortBy, setSortBy] = useState('Newest');

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
 thumbnail_url: course.thumbnail_url || '',
 payment_type: (course as any).payment_type || 'free',
 course_price: (course as any).course_price || ''
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
 language: 'en', level: 'Beginner', status: 'draft', is_active: true, thumbnail_url: '',
 payment_type: 'free', course_price: ''
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
 payment_type: form.payment_type,
 course_price: form.payment_type === 'paid' && form.course_price ? parseFloat(form.course_price) : null,
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
 toast.success(isEditing ? t('courseUpdated') : t('courseCreatedSuccess'));
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
 else { toast.success(t('courseDeleted')); fetchCourses(); }
 setIsDeleteModalOpen(false); setItemToDelete(null); setIsActionLoading(false);
 };

 const handleStatusUpdate = async (id: string, newStatus: string) => {
 setIsActionLoading(true);
 const { error: apiErr } = await updateCourse(id, { status: newStatus as any });
 if (apiErr) toast.error(apiErr);
 else { toast.success(`${t('course')} ${newStatus}.`); fetchCourses(); }
 setIsActionLoading(false);
 };

 const handleAssignProvider = async () => {
 if (!assignProviderCourse || !selectedProvider) return;
 setIsActionLoading(true);
 const { error: e } = await assignCourseProvider(assignProviderCourse.id, selectedProvider);
 if (e) toast.error(e);
 else { toast.success(t('providerAssigned')); fetchCourses(); setIsAssignProviderOpen(false); }
 setIsActionLoading(false);
 };

 const openAssignOrgModal = (course: Course) => {
 setAssignOrgCourse(course);
 const existingIds = course.organizations?.map(o => o.id) || (course.organization ? [course.organization] : []);
 setSelectedOrgs(existingIds);
 setOrgSearchQuery('');
 setIsAssignOrgOpen(true);
 };

 const handleAssignOrg = async () => {
 if (!assignOrgCourse) return;
 setIsActionLoading(true);
 const { error: e } = await assignCourseOrganization(
 assignOrgCourse.id,
 selectedOrgs.length > 0 ? selectedOrgs[0] : null,
 selectedOrgs
 );
 if (e) toast.error(e);
 else {
 toast.success(selectedOrgs.length > 0 ? `Course assigned to ${selectedOrgs.length} organization(s)` : 'Course made public (unlinked)');
 fetchCourses();
 setIsAssignOrgOpen(false);
 }
 setIsActionLoading(false);
 };

 const handleDuplicateConfirm = async () => {
 if (!duplicateCourseItem) return;
 setIsActionLoading(true);
 const { error: e } = await duplicateCourse(duplicateCourseItem.id);
 if (e) {
 toast.error(e || 'Failed to duplicate course');
 } else {
 toast.success(`Course "${duplicateCourseItem.title}" duplicated successfully!`);
 fetchCourses();
 }
 setIsActionLoading(false);
 setDuplicateCourseItem(null);
 };

 const handleSubmitConfirm = (id: string) => {
 setSubmitConfirmId(id);
 };

 const handleSubmitForReview = async () => {
 if (!submitConfirmId) return;
 setIsActionLoading(true);
 const { error: e } = await submitCourseForReview(submitConfirmId);
 if (e) toast.error(e);
 else { toast.success(t('courseSubmitted')); fetchCourses(); }
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
 else { toast.success(t('submissionWithdrawn')); fetchCourses(); }
 setIsActionLoading(false);
 setWithdrawConfirmId(null);
 };

 const handleApprove = async (id: string) => {
 setIsActionLoading(true);
 const { error: e } = await approveCourse(id);
 if (e) toast.error(e);
 else { toast.success(t('courseApproved')); fetchCourses(); }
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
 else { toast.success(t('courseRejected')); fetchCourses(); setIsRejectModalOpen(false); }
 setIsActionLoading(false);
 };

 if (isLoading || isFetching) return (
 <div className="flex justify-center items-center min-h-[50vh]">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
 </div>
 );
 if (!user || !['super_admin', 'org_admin', 'course_provider'].includes(user.role)) return null;

 let filteredCourses = courses.filter(c => {
 const matchesStatus = !statusFilter || c.status === statusFilter;
 const matchesOrg = !orgFilter || c.organization === orgFilter;
 const matchesProvider = !providerFilter || c.course_provider === providerFilter;
 const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase());
 
 let matchesDate = true;
 if (dateFilter) {
 const createdDate = new Date(c.created_at || Date.now());
 const now = new Date();
 const diffTime = Math.abs(now.getTime() - createdDate.getTime());
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
 
 if (dateFilter === '7days') matchesDate = diffDays <= 7;
 else if (dateFilter === '30days') matchesDate = diffDays <= 30;
 else if (dateFilter === 'this_year') matchesDate = createdDate.getFullYear() === now.getFullYear();
 }

 return matchesStatus && matchesOrg && matchesProvider && matchesSearch && matchesDate;
 });

 if (sortBy === 'Alphabetical') {
 filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
 } else if (sortBy === 'Newest') {
 filteredCourses.sort((a, b) => {
 const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
 const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
 return dateB - dateA;
 });
 } else if (sortBy === 'Oldest') {
 filteredCourses.sort((a, b) => {
 const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
 const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
 return dateA - dateB;
 });
 }

 const isSuperAdmin = user.role === 'super_admin';
 const canManage = isSuperAdmin || user.role === 'course_provider';

 return (
 <div className="min-h-screen bg-muted pb-20">
 <div className="bg-card border-b border-border">
 <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
 <div>
 <h1 className="text-3xl font-bold text-foreground mb-1">{t('coursesManagement')}</h1>
 <p className="text-muted-foreground">{t('coursesDesc')}</p>
 </div>
 <div className="w-full lg:w-72 shrink-0">
 <input
 type="text"
 placeholder={t('searchCourse')}
 className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 />
 </div>
 </div>
 </div>

 {canManage && (
 <ExpandableCreateSection
 title={t('addNewCourse')}
 isOpen={isCreateExpanded}
 onToggle={toggleCreate}
 isSuccess={!!createdCourseId}
 successTitle={t('courseCreatedSuccess')}
 successDescription={t('courseCreatedDesc')}
 nextSteps={createdCourseId ? [
 { label: t('addModule'), href: `/admin/modules?create=true&courseId=${createdCourseId}`, icon: '📂' },
 { label: t('addCourseExam'), href: `/admin/assessments?create=true&parent_type=course_exam&courseId=${createdCourseId}`, variant: 'secondary', icon: '🎓' }
 ] : []}
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

 <Input label={t('title')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} autoFocus />

 <CloudinaryUpload
 label={t('courseThumbnail')}
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
 <label className="block text-sm font-semibold text-foreground mb-1">{t('description')}</label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px] resize-y"
 placeholder={t('description')}
 value={form.description}
 onChange={e => setForm({ ...form, description: e.target.value })}
 disabled={isActionLoading}
 />
 </div>

 {isSuperAdmin && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('organization')} <span className="text-muted-foreground font-normal">{t('optional')}</span></label>
 <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} disabled={isActionLoading}>
 <option value="">{t('none')}</option>
 {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
 </select>
 </div>
 )}

 {isSuperAdmin && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('courseProvider')} <span className="text-primary">*</span></label>
 <select className={SELECT_CLS} value={form.course_provider} onChange={e => setForm({ ...form, course_provider: e.target.value })} disabled={isActionLoading} required>
 <option value="">{t('selectProvider')}</option>
 {providers.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>)}
 </select>
 {providers.length === 0 && <p className="text-[10px] text-red-500 mt-1">{t('noCourseProviderFound')}</p>}
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('language')}</label>
 <select className={SELECT_CLS} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} disabled={isActionLoading}>
 <option value="en">{t('english')}</option>
 <option value="am">{t('amharic')}</option>
 <option value="om">{t('oromo')}</option>
 <option value="so">{t('somali')}</option>
 <option value="ti">{t('tigrinya')}</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('level')}</label>
 <select className={SELECT_CLS} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} disabled={isActionLoading}>
 <option value="Beginner">{t('beginner')}</option>
 <option value="Intermediate">{t('intermediate')}</option>
 <option value="Advanced">{t('advanced')}</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('status')}</label>
 <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isActionLoading}>
 <option value="draft">{t('draft')}</option>
 <option value="submitted">{t('submitted')}</option>
 <option value="published">{t('published')}</option>
 <option value="archived">{t('archived')}</option>
 </select>
 </div>
 </div>

 {isSuperAdmin && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('paymentType')}</label>
 <select className={SELECT_CLS} value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value })} disabled={isActionLoading}>
 <option value="free">{t('free')}</option>
 <option value="paid">{t('paid')}</option>
 </select>
 </div>
 {form.payment_type === 'paid' && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('coursePriceEtb')}</label>
 <input type="number" step="0.01" className={SELECT_CLS} value={form.course_price} onChange={e => setForm({ ...form, course_price: e.target.value })} disabled={isActionLoading} required />
 </div>
 )}
 </div>
 )}

 <div className="pt-4 flex flex-wrap justify-end gap-3 min-w-fit">
 <Button type="button" variant="outline" onClick={() => setIsCreateExpanded(false)} disabled={isActionLoading}>{t('cancel')}</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? t('saving') : t('createCourse')}</Button>
 </div>
 </form>
 </ExpandableCreateSection>
 )}

 {/* Filter Bar */}
 <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-8">
 <div className="flex flex-wrap items-center gap-4 mb-6">
 <div className="flex items-center gap-2">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('status')}</label>
 <select
 className="rounded-lg border border-border py-1.5 px-3 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card"
 value={statusFilter}
 onChange={e => setStatusFilter(e.target.value)}
 >
 <option value="">{t('all')}</option>
 <option value="draft">{t('draft')}</option>
 <option value="submitted">{t('submitted')}</option>
 <option value="published">{t('published')}</option>
 <option value="archived">{t('archived')}</option>
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
 <option value="">{t('all')}</option>
 {orgs.map(o => (
 <option key={o.id} value={o.id}>{o.name}</option>
 ))}
 </select>
 </div>
 )}
 {isSuperAdmin && (
 <div className="flex items-center gap-2">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('provider')}</label>
 <select
 className="rounded-lg border border-border py-1.5 px-2 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card max-w-[140px]"
 value={providerFilter}
 onChange={e => setProviderFilter(e.target.value)}
 >
 <option value="">{t('all')}</option>
 {providers.map(p => (
 <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.role})</option>
 ))}
 </select>
 </div>
 )}
 <div className="flex items-center gap-2">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date Added</label>
 <select
 className="rounded-lg border border-border py-1.5 px-3 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card"
 value={dateFilter}
 onChange={e => setDateFilter(e.target.value)}
 >
 <option value="">Any time</option>
 <option value="7days">Last 7 days</option>
 <option value="30days">Last 30 days</option>
 <option value="this_year">This year</option>
 </select>
 </div>
 <div className="flex items-center gap-2">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sort By</label>
 <select
 className="rounded-lg border border-border py-1.5 px-3 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card"
 value={sortBy}
 onChange={e => setSortBy(e.target.value)}
 >
 <option value="Newest">Newest First</option>
 <option value="Oldest">Oldest First</option>
 <option value="Alphabetical">Alphabetical (A-Z)</option>
 </select>
 </div>
 {(statusFilter || orgFilter || providerFilter || searchQuery || dateFilter) && (
 <button
 onClick={() => { setStatusFilter(''); setOrgFilter(''); setProviderFilter(''); setSearchQuery(''); setDateFilter(''); }}
 className="text-xs text-primary font-bold hover:text-primary transition-colors duration-200-hover cursor-pointer"
 >
 {t('clearFilters')}
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
 <th className="px-4 py-3">{t('level')}</th>
 <th className="px-4 py-3">{t('language')}</th>
 <th className="px-4 py-3">Organization</th>
 <th className="px-4 py-3">{t('status')}</th>
 <th className="px-4 py-3 text-right">{t('actions')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredCourses.length === 0 ? (
 <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('noCoursesFound')}</td></tr>
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
 {user?.role === 'org_admin' && (c as any).payment_type === 'paid' && !(c as any).is_unlocked ? (
 <Link href={`/dashboard/courses/${c.id}/payment`} className="hover:text-primary transition-colors hover:underline">
 <span>{c.title}</span>
 </Link>
 ) : (
 <Link href={`/admin/courses/${c.id}`} className="hover:text-primary transition-colors hover:underline">
 <span>{c.title}</span>
 </Link>
 )}
 </div>
 </td>
 <td className="px-4 py-3 capitalize">{c.level || '—'}</td>
 <td className="px-4 py-3 uppercase text-xs">{c.language || '—'}</td>
 <td className="px-4 py-3 text-xs">
 {c.organizations && c.organizations.length > 0 ? (
 <div className="flex flex-wrap gap-1 max-w-[220px]">
 {c.organizations.slice(0, 2).map(o => (
 <span key={o.id} className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium border border-blue-500/20 truncate max-w-[130px]" title={o.name}>
 {o.name}
 </span>
 ))}
 {c.organizations.length > 2 && (
 <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold" title={c.organizations.slice(2).map(o => o.name).join(', ')}>
 +{c.organizations.length - 2} more
 </span>
 )}
 </div>
 ) : c.organization ? (
 <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium border border-blue-500/20">
 {orgs.find(o => o.id === c.organization)?.name || 'Linked'}
 </span>
 ) : (
 <span className="text-muted-foreground italic text-xs">Public / All</span>
 )}
 </td>
 <td className="px-4 py-3 whitespace-nowrap">
  <div className="flex flex-col gap-1 items-start">
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border whitespace-nowrap ${STATUS_COLORS[c.status] || 'bg-muted text-muted-foreground border-border'}`}>
  {c.status || 'draft'}
  </span>
  {(c as any).payment_type === 'paid' && (
  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 whitespace-nowrap">
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
  {(c as any).is_unlocked ? 'PAID' : `${(c as any).currency || 'ETB'} ${(c as any).course_price}`}
  </span>
  )}
  </div>
  </td>
  <td className="px-4 py-3 text-right whitespace-nowrap">
  <div className="flex items-center justify-end gap-2">
  {user?.role === 'org_admin' && (c as any).payment_type === 'paid' && !(c as any).is_unlocked && (
  <Link href={`/dashboard/courses/${c.id}/payment`} className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1">
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
  Unlock
  </Link>
  )}

  {/* Quick Review actions for superadmin */}
  {c.status === 'submitted' && isSuperAdmin && (
  <>
  <button
  onClick={() => handleApprove(c.id)}
  disabled={isActionLoading}
  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors cursor-pointer"
  title={t('approve')}
  >
  <CheckCircle2 className="w-3.5 h-3.5" />
  {t('approve')}
  </button>
  <button
  onClick={() => openRejectModal(c.id)}
  disabled={isActionLoading}
  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors cursor-pointer"
  title={t('reject')}
  >
  <XCircle className="w-3.5 h-3.5" />
  {t('reject')}
  </button>
  </>
  )}

  {/* Provider submit/withdraw quick action */}
  {c.status === 'draft' && user.role === 'course_provider' && (
  <button
  onClick={() => handleSubmitConfirm(c.id)}
  disabled={isActionLoading}
  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-xs font-medium transition-colors cursor-pointer"
  >
  <Send className="w-3.5 h-3.5" />
  {t('submit')}
  </button>
  )}
  {c.status === 'submitted' && user.role === 'course_provider' && (
  <button
  onClick={() => handleWithdrawConfirm(c.id)}
  disabled={isActionLoading}
  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-medium transition-colors cursor-pointer"
  >
  <Undo2 className="w-3.5 h-3.5" />
  {t('withdraw')}
  </button>
  )}

  {/* Quick Workspace link button */}
  <Link
  href={`/admin/courses/${c.id}`}
  className="px-2.5 py-1 text-xs font-medium text-foreground bg-muted/60 hover:bg-muted border border-border rounded-lg transition-colors inline-flex items-center gap-1"
  title="Open Course Workspace"
  >
  <span>Manage</span>
  <ExternalLink className="w-3 h-3 text-muted-foreground" />
  </Link>

  {/* Unified Dropdown Menu for More Actions */}
  <DropdownMenu>
  <DropdownMenuTrigger className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/70 hover:border-border transition-all cursor-pointer outline-none focus:ring-1 focus:ring-primary flex items-center justify-center" aria-label="More actions">
  <MoreVertical className="w-4 h-4" />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48 bg-card border border-border shadow-lg rounded-xl p-1 z-50">
  <DropdownMenuGroup>
  {canManage && (
  <DropdownMenuItem
  onClick={() => openModal(c)}
  className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted cursor-pointer transition-colors"
  >
  <Pencil className="w-3.5 h-3.5 text-primary" />
  <span>{t('edit')} Details</span>
  </DropdownMenuItem>
  )}
  {isSuperAdmin && (
  <DropdownMenuItem
  onClick={() => openAssignOrgModal(c)}
  className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted cursor-pointer transition-colors"
  >
  <Building2 className="w-3.5 h-3.5 text-blue-500" />
  <span>Organizations</span>
  </DropdownMenuItem>
  )}
  {isSuperAdmin && (
  <DropdownMenuItem
  onClick={() => { setAssignProviderCourse(c); setSelectedProvider(c.course_provider || ''); setIsAssignProviderOpen(true); }}
  className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted cursor-pointer transition-colors"
  >
  <UserCheck className="w-3.5 h-3.5 text-purple-500" />
  <span>{t('provider')}</span>
  </DropdownMenuItem>
  )}
  {canManage && (
  <DropdownMenuItem
  onClick={() => setDuplicateCourseItem(c)}
  className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted cursor-pointer transition-colors"
  >
  <Copy className="w-3.5 h-3.5 text-emerald-500" />
  <span>Duplicate Course</span>
  </DropdownMenuItem>
  )}
  </DropdownMenuGroup>
  {canManage && (
  <>
  <DropdownMenuSeparator className="my-1 border-t border-border" />
  <DropdownMenuItem
  onClick={() => handleDelete(c.id)}
  className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-500/10 cursor-pointer transition-colors"
  >
  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
  <span>{t('delete')}</span>
  </DropdownMenuItem>
  </>
  )}
  </DropdownMenuContent>
  </DropdownMenu>
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
 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('edit')}>
 <form onSubmit={handleSubmit} className="space-y-4">
 {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{actionError}</div>}

 <Input label={t('title')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isActionLoading} autoFocus />

 <CloudinaryUpload
 label={t('courseThumbnail')}
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
 <label className="block text-sm font-semibold text-foreground mb-1">{t('description')}</label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px] resize-y"
 placeholder={t('description')}
 value={form.description}
 onChange={e => setForm({ ...form, description: e.target.value })}
 disabled={isActionLoading}
 />
 </div>

 {isSuperAdmin && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('organization')} <span className="text-muted-foreground font-normal">{t('optional')}</span></label>
 <select className={SELECT_CLS} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} disabled={isActionLoading}>
 <option value="">{t('none')}</option>
 {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
 </select>
 </div>
 )}

 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('language')}</label>
 <select className={SELECT_CLS} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} disabled={isActionLoading}>
 <option value="en">{t('english')}</option>
 <option value="am">{t('amharic')}</option>
 <option value="om">{t('oromo')}</option>
 <option value="so">{t('somali')}</option>
 <option value="ti">{t('tigrinya')}</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('level')}</label>
 <select className={SELECT_CLS} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} disabled={isActionLoading}>
 <option value="Beginner">{t('beginner')}</option>
 <option value="Intermediate">{t('intermediate')}</option>
 <option value="Advanced">{t('advanced')}</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('status')}</label>
 <select className={SELECT_CLS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={isActionLoading || (!!selectedCourse && selectedCourse.status === 'submitted')}>
 <option value="draft">{t('draft')}</option>
 <option value="submitted">{t('submitted')}</option>
 <option value="published">{t('published')}</option>
 <option value="archived">{t('archived')}</option>
 </select>
 </div>
 </div>

 {isSuperAdmin && (
 <div className="grid grid-cols-2 gap-3 mt-3">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('paymentType')}</label>
 <select className={SELECT_CLS} value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value })} disabled={isActionLoading}>
 <option value="free">{t('free')}</option>
 <option value="paid">{t('paid')}</option>
 </select>
 </div>
 {form.payment_type === 'paid' && (
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('coursePriceEtb')}</label>
 <input type="number" step="0.01" className={SELECT_CLS} value={form.course_price} onChange={e => setForm({ ...form, course_price: e.target.value })} disabled={isActionLoading} required />
 </div>
 )}
 </div>
 )}

 <div className="pt-4 flex flex-wrap justify-end gap-3 min-w-fit">
 <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}>{t('cancel')}</Button>
 <Button type="submit" variant="primary" disabled={isActionLoading}>{isActionLoading ? t('saving') : t('saveChanges')}</Button>
 </div>
 </form>
 </Modal>

 {/* Assign Provider Modal */}
 <Modal isOpen={isAssignProviderOpen} onClose={() => setIsAssignProviderOpen(false)} title={t('reassignCourseProvider')}>
 <div className="space-y-4">
 <p className="text-sm text-muted-foreground">{t('selectNewProvider')} <strong>{assignProviderCourse?.title}</strong></p>
 <select className={SELECT_CLS} value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}>
 <option value="">{t('selectProvider')}</option>
 {providers.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>)}
 </select>
 <div className="flex flex-wrap justify-end gap-3 pt-2 min-w-fit">
 <Button variant="outline" onClick={() => setIsAssignProviderOpen(false)}>{t('cancel')}</Button>
 <Button variant="primary" onClick={handleAssignProvider} disabled={!selectedProvider || isActionLoading}>{isActionLoading ? t('assigning') : t('assign')}</Button>
 </div>
 </div>
 </Modal>

 {/* Assign Organization Modal */}
 <Modal isOpen={isAssignOrgOpen} onClose={() => setIsAssignOrgOpen(false)} title="Assign Organizations">
 <div className="space-y-4">
 <div>
 <p className="text-sm text-muted-foreground">
 Choose which organizations have access to <strong>{assignOrgCourse?.title}</strong>.
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 Tip: Uncheck all organizations to make this course <strong>Public</strong> (available to anyone).
 </p>
 </div>

 {/* Search and Quick Filters */}
 <div className="flex items-center gap-2">
 <div className="relative flex-1">
 <input
 type="text"
 placeholder="Search organizations..."
 value={orgSearchQuery}
 onChange={e => setOrgSearchQuery(e.target.value)}
 className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
 />
 <svg className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
 </svg>
 </div>
 <button
 type="button"
 onClick={() => setSelectedOrgs(orgs.map(o => o.id))}
 className="px-2.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20 whitespace-nowrap"
 >
 Select All
 </button>
 <button
 type="button"
 onClick={() => setSelectedOrgs([])}
 className="px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors border border-border whitespace-nowrap"
 >
 Clear (Public)
 </button>
 </div>

 {/* Selected counter banner */}
 <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-muted/60 border border-border">
 <span className="text-muted-foreground">
 {selectedOrgs.length === 0 ? (
 <span className="font-medium text-emerald-600 dark:text-emerald-400">Public (No organization restrictions)</span>
 ) : (
 <span>Selected: <strong className="text-foreground">{selectedOrgs.length}</strong> organization{selectedOrgs.length > 1 ? 's' : ''}</span>
 )}
 </span>
 </div>

 {/* Organizations Checkbox List */}
 <div className="max-h-60 overflow-y-auto space-y-1.5 border border-border rounded-xl p-2 bg-muted/20">
 {orgs
 .filter(o => o.name.toLowerCase().includes(orgSearchQuery.toLowerCase()))
 .map(o => {
 const isChecked = selectedOrgs.includes(o.id);
 return (
 <label
 key={o.id}
 className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border text-sm ${
 isChecked
 ? 'bg-primary/10 border-primary/30 text-foreground font-medium'
 : 'bg-card border-border hover:bg-muted/50 text-muted-foreground'
 }`}
 >
 <div className="flex items-center gap-3">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={() => {
 if (isChecked) {
 setSelectedOrgs(selectedOrgs.filter(id => id !== o.id));
 } else {
 setSelectedOrgs([...selectedOrgs, o.id]);
 }
 }}
 className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer"
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

 <div className="flex flex-wrap justify-end gap-3 pt-2 min-w-fit">
 <Button variant="outline" onClick={() => setIsAssignOrgOpen(false)}>{t('cancel')}</Button>
 <Button variant="primary" onClick={handleAssignOrg} disabled={isActionLoading}>
 {isActionLoading ? t('saving') : 'Save Assignments'}
 </Button>
 </div>
 </div>
 </Modal>

 {/* Duplicate Course Confirm Modal */}
 <ConfirmModal
 isOpen={!!duplicateCourseItem}
 onClose={() => setDuplicateCourseItem(null)}
 onConfirm={handleDuplicateConfirm}
 title="Duplicate Course"
 message={`Are you sure you want to duplicate "${duplicateCourseItem?.title}"? All modules, lessons, quizzes, and exams will be duplicated into a new draft course.`}
 confirmText="Duplicate Course"
 variant="info"
 isLoading={isActionLoading}
 />

 <ConfirmModal
 isOpen={!!submitConfirmId}
 onClose={() => setSubmitConfirmId(null)}
 onConfirm={handleSubmitForReview}
 title={t('submitForReview')}
 message={t('submitConfirmMessage')}
 confirmText={t('submit')}
 variant="warning"
 isLoading={isActionLoading}
 />

 <ConfirmModal
 isOpen={!!withdrawConfirmId}
 onClose={() => setWithdrawConfirmId(null)}
 onConfirm={handleWithdraw}
 title={t('withdrawSubmission')}
 message={t('withdrawConfirmMessage')}
 confirmText={t('withdraw')}
 variant="warning"
 isLoading={isActionLoading}
 />

 <ConfirmModal
 isOpen={isDeleteModalOpen}
 onClose={() => setIsDeleteModalOpen(false)}
 onConfirm={handleDeleteConfirm}
 title={t('deleteCourse')}
 message={t('deleteConfirmMessage')}
 confirmText={t('delete')}
 isLoading={isActionLoading}
 />

 {/* Rejection Reason Modal */}
 <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title={t('rejectCourse')}>
 <div className="space-y-4">
 <p className="text-sm text-muted-foreground">{t('rejectReasonDesc')}</p>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">{t('rejectionReason')} <span className="text-red-500">*</span></label>
 <textarea
 className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] resize-y"
 placeholder={t('explainRejection')}
 value={rejectionReason}
 onChange={e => setRejectionReason(e.target.value)}
 disabled={isActionLoading}
 />
 </div>
 <div className="flex flex-wrap justify-end gap-3 pt-2 min-w-fit">
 <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} disabled={isActionLoading}>{t('cancel')}</Button>
 <Button variant="primary" onClick={handleRejectConfirm} disabled={!rejectionReason.trim() || isActionLoading}>{isActionLoading ? t('rejecting') : t('reject')}</Button>
 </div>
 </div>
 </Modal>
 </div>
 );
}
