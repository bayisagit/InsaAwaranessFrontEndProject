'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  AuditLog,
  AuditLogStats,
  UserAdminDetail,
  getUserAdminDetail,
  getAuditLogs,
  getAuditLogStats,
  toggleUserStatus,
  resetUserPasswordAdmin,
  apiFetch,
} from '@/lib/api';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  KeyRound,
  AlertTriangle,
  Trash2,
  Copy,
  Check,
  Calendar,
  Shield,
  ShieldCheck,
  Bot,
  User as UserIcon,
  Clock,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
  Laptop,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Mail,
  Building,
  Phone,
  BookOpen,
  Award,
  Activity,
  Code,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'auth', label: 'Authentication' },
  { value: 'course', label: 'Course Activity' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'profile', label: 'Profile' },
  { value: 'admin', label: 'Administrative' },
  { value: 'security', label: 'Security' },
];

export default function UserDetailPage() {
  const params = useParams();
  const userId = params?.id as string;
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();

  // State
  const [targetUser, setTargetUser] = useState<UserAdminDetail | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats>({
    total: 0,
    success: 0,
    warning: 0,
    error: 0,
    categories: {},
  });
  const [activeTab, setActiveTab] = useState<'audit' | 'profile'>('audit');
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Pagination
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);

  // Modals & Action states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    preferred_language: 'en',
  });

  // Access Control: Super Admin Only
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (currentUser?.role !== 'super_admin') {
        toast.error('Access restricted to Super Admins only.');
        router.push('/dashboard');
      } else if (userId) {
        fetchUserDetails();
        fetchStats();
      }
    }
  }, [isLoading, isAuthenticated, currentUser, userId, router]);

  // Load audit logs when filters change
  useEffect(() => {
    if (userId && currentUser?.role === 'super_admin') {
      fetchLogs();
    }
  }, [userId, selectedStatus, selectedCategory, sortOrder]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const fetchUserDetails = async () => {
    setIsFetchingUser(true);
    const { data, error, status } = await getUserAdminDetail(userId);
    if (error || status !== 200 || !data) {
      toast.error(error || 'Failed to load user profile');
    } else {
      setTargetUser(data);
      setEditFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        preferred_language: data.preferred_language || 'en',
      });
    }
    setIsFetchingUser(false);
  };

  const fetchStats = async () => {
    const { data } = await getAuditLogStats(userId);
    if (data) {
      setStats(data);
    }
  };

  const fetchLogs = async (customUrl?: string) => {
    setIsFetchingLogs(true);
    let url = customUrl;
    if (!url) {
      const params: Record<string, string> = { user_id: userId };
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
      if (sortOrder === 'oldest') params.ordering = 'oldest';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const qs = new URLSearchParams(params).toString();
      url = `/api/v1/audit-logs/?${qs}`;
    }

    const { data, error } = await apiFetch<any>(url);
    if (error) {
      toast.error('Failed to load audit trail');
    } else if (Array.isArray(data)) {
      setLogs(data);
      setNextUrl(null);
      setPrevUrl(null);
    } else if (data?.results && Array.isArray(data.results)) {
      setLogs(data.results);
      setNextUrl(data.next);
      setPrevUrl(data.previous);
    }
    setIsFetchingLogs(false);
    setIsRefreshing(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchUserDetails(), fetchStats(), fetchLogs()]);
    toast.success('Activity trail refreshed');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogIds((prev) => ({
      ...prev,
      [logId]: !prev[logId],
    }));
  };

  // Action: Toggle Active / Suspend
  const handleToggleStatus = async () => {
    setIsActionLoading(true);
    const { data, error, status } = await toggleUserStatus(userId);
    if (error || status !== 200 || !data) {
      toast.error(error || 'Failed to update user status.');
    } else {
      toast.success(data.detail);
      if (targetUser) {
        setTargetUser({ ...targetUser, is_active: data.is_active });
      }
      setIsSuspendModalOpen(false);
      fetchStats();
      fetchLogs();
    }
    setIsActionLoading(false);
  };

  // Action: Reset Password
  const handleResetPassword = async () => {
    setIsActionLoading(true);
    const { data, error, status } = await resetUserPasswordAdmin(userId);
    if (error || status !== 200 || !data) {
      toast.error(error || 'Failed to reset password.');
    } else {
      toast.success(data.detail);
      if (data.temporary_password) {
        setGeneratedTempPassword(data.temporary_password);
      } else {
        setIsResetModalOpen(false);
      }
      fetchStats();
      fetchLogs();
    }
    setIsActionLoading(false);
  };

  // Action: Delete User
  const handleDeleteUser = async () => {
    setIsActionLoading(true);
    const { error, status } = await apiFetch(`/api/auth/users/${userId}/`, {
      method: 'DELETE',
    });
    if (error || status !== 204) {
      toast.error(error || 'Failed to delete user.');
      setIsActionLoading(false);
    } else {
      toast.success('User successfully deleted.');
      router.push('/admin/users');
    }
  };

  // Action: Edit Profile
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    const { data, error, status } = await apiFetch<any>(`/api/auth/users/${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(editFormData),
    });
    if (error || status !== 200) {
      toast.error(error || 'Failed to update user profile.');
    } else {
      toast.success('User profile updated successfully.');
      setIsEditModalOpen(false);
      fetchUserDetails();
      fetchLogs();
    }
    setIsActionLoading(false);
  };

  // Role Badge Style helper
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'org_admin':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
      case 'course_provider':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'member':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'public_user':
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }
  };

  // Category Badge Style helper
  const getCategoryBadgeStyle = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'auth':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
      case 'course':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      case 'assessment':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
      case 'admin':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
      case 'security':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'profile':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
    }
  };

  if (isLoading || isFetchingUser) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading user profile and activity records...</p>
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">User Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested user does not exist or has been removed.</p>
        <Link href="/admin/users">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to User Management
          </Button>
        </Link>
      </div>
    );
  }

  const fullName = `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim() || targetUser.email;
  const initial = (targetUser.first_name?.[0] || targetUser.email?.[0] || 'U').toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30 pb-24 font-sans text-foreground">
      {/* Top Header Breadcrumb & Actions */}
      <div className="bg-card border-b border-border/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Back link */}
          <div className="mb-3">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to User Management</span>
            </Link>
          </div>

          {/* User Title & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{fullName}</h1>
              {/* ID Badge */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {targetUser.short_id}
              </span>
              {/* Role Badge */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getRoleBadgeStyle(
                  targetUser.role
                )}`}
              >
                {targetUser.role_display || targetUser.role.replace('_', ' ')}
              </span>
              {/* Org / Manager Badge */}
              {targetUser.organization_name && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {targetUser.organization_name}
                </span>
              )}
              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  targetUser.is_active
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${targetUser.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {targetUser.is_active ? 'Active' : 'Suspended'}
              </span>
            </div>

            {/* Top Right Action Buttons (Matching Screenshot) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-card border border-border hover:bg-muted text-foreground transition-colors shadow-2xs cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                <span>Reset Password</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSuspendModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-2xs border cursor-pointer ${
                  targetUser.is_active
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{targetUser.is_active ? 'Suspend' : 'Activate'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6">
        {/* User Profile Banner Card (Matching Screenshot) */}
        <div className="bg-card rounded-2xl border border-border shadow-xs p-5 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Avatar, Name, Email copy, Join date, Signup method */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              <div className="relative shrink-0">
                {targetUser.profile_photo ? (
                  <img
                    src={targetUser.profile_photo}
                    alt={fullName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-border"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/5 text-primary border border-primary/20 flex items-center justify-center font-bold text-2xl sm:text-3xl uppercase select-none">
                    {initial}
                  </div>
                )}
                {/* Active Indicator Dot */}
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-card ${
                    targetUser.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  title={targetUser.is_active ? 'Online / Active' : 'Account Suspended'}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">{fullName}</h2>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    ID: {targetUser.short_id.replace('#', '')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span>{targetUser.email}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(targetUser.email, 'email')}
                      className="p-1 hover:text-foreground transition-colors cursor-pointer"
                      title="Copy email"
                    >
                      {copiedText === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{targetUser.date_joined_formatted || 'Joined Recently'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span className="capitalize">{targetUser.signup_method_display || targetUser.signup_method || 'Email & Password'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 3 Metric Cards (Courses Enrolled, Completed Courses, Assessments/Activity) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
              {/* Enrolled Courses Card */}
              <div className="bg-muted/50 dark:bg-muted/30 border border-border/80 rounded-xl px-4 py-3 sm:px-6 sm:py-4 text-center min-w-[100px] sm:min-w-[125px]">
                <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">
                  Courses Enrolled
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                  {targetUser.stats?.courses_enrolled ?? 0}
                </div>
              </div>

              {/* Completed Courses Card (Green themed) */}
              <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl px-4 py-3 sm:px-6 sm:py-4 text-center min-w-[100px] sm:min-w-[125px]">
                <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mb-1">
                  Completed Courses
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {targetUser.stats?.courses_completed ?? 0}
                </div>
              </div>

              {/* Assessments / Activity Card (Blue themed) */}
              <div className="bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 rounded-xl px-4 py-3 sm:px-6 sm:py-4 text-center min-w-[100px] sm:min-w-[125px]">
                <div className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase mb-1">
                  Assessments / Activity
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                  {targetUser.stats?.assessments_taken ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Matching Screenshot) */}
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile & Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Clock className="w-4 h-4 text-primary" />
            <span>Audit Logs ({stats.total || logs.length})</span>
          </button>
        </div>

        {/* TAB 1: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-5">
            {/* Audit Trail Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-5 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Audit Trail</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  System activity log of authentications, administrative actions, and security events.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">{stats.total} events</span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              {/* Search input */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by action, details, IP, or location..."
                  className="w-full bg-muted/40 border border-border rounded-xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Status Pills & Right Dropdowns (Matching Screenshot) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border/60">
                {/* Left: Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedStatus === 'all'
                        ? 'bg-foreground text-background shadow-xs'
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    All {stats.total}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatus('success')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedStatus === 'success'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Success {stats.success}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatus('warning')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedStatus === 'warning'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Warning {stats.warning}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatus('error')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedStatus === 'error'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Error {stats.error}
                  </button>
                </div>

                {/* Right: Category Dropdown & Sort */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="newest">Newest ▾</option>
                    <option value="oldest">Oldest ▾</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audit Logs List */}
            {isFetchingLogs ? (
              <div className="p-12 text-center bg-card border border-border rounded-2xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-xs text-muted-foreground">Filtering events...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-16 text-center bg-card border border-border rounded-2xl">
                <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-foreground">No Recorded Activity Events</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  No activity logs matched your current filters. Any new actions will appear here automatically.
                </p>
                {(selectedStatus !== 'all' || selectedCategory !== 'all' || searchQuery) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSelectedStatus('all');
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const isExpanded = !!expandedLogIds[log.id];
                  const isSystem =
                    !log.actor ||
                    log.actor_role === 'system' ||
                    log.actor_name?.toLowerCase() === 'system' ||
                    log.actor_email?.toLowerCase() === 'system';
                  const actorDisplay = isSystem
                    ? 'System Automation'
                    : log.actor_name || (log.actor_email ? log.actor_email.split('@')[0] : 'System');
                  const categoryTag = (log.category || 'ADMIN').toUpperCase();
                  const isSuccess = log.status === 'success';
                  const isWarning = log.status === 'warning';
                  const isError = log.status === 'error';

                  return (
                    <div
                      key={log.id}
                      className="bg-card border border-border/80 hover:border-border rounded-2xl shadow-2xs transition-all overflow-hidden"
                    >
                      {/* Event Row Header */}
                      <div
                        onClick={() => toggleLogExpansion(log.id)}
                        className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          {/* Left Avatar / System / Admin Icon */}
                          <div className="relative shrink-0 mt-0.5">
                            {log.actor_avatar ? (
                              <img
                                src={log.actor_avatar}
                                alt={actorDisplay}
                                className="w-10 h-10 rounded-xl object-cover border border-border"
                              />
                            ) : isSystem ? (
                              <div
                                className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs"
                                title="System Automated Task"
                              >
                                <Bot className="w-5 h-5" />
                              </div>
                            ) : log.actor_role === 'super_admin' || log.actor_role === 'org_admin' ? (
                              <div
                                className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-2xs"
                                title={log.actor_role === 'super_admin' ? 'Super Administrator' : 'Organization Admin'}
                              >
                                <ShieldCheck className="w-5 h-5" />
                              </div>
                            ) : (
                              <div
                                className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-xs uppercase text-blue-600 dark:text-blue-400 shadow-2xs"
                                title={actorDisplay}
                              >
                                {actorDisplay[0]?.toUpperCase() || 'U'}
                              </div>
                            )}

                            {/* Outcome status dot on avatar corner with tooltip */}
                            <span
                              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-card ${
                                isSuccess ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              title={`Status: ${log.status || 'success'}`}
                            />
                          </div>

                          {/* Event Text & Details */}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            {/* Actor, Role/System Badge, Category Badge & Explicit Status Pill */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-foreground truncate max-w-[220px]">
                                {actorDisplay}
                              </span>

                              {/* Actor Type / Role Badge */}
                              {isSystem ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                  <Bot className="w-2.5 h-2.5" />
                                  Automated
                                </span>
                              ) : log.actor_role ? (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(
                                    log.actor_role
                                  )}`}
                                >
                                  {log.actor_role.replace('_', ' ')}
                                </span>
                              ) : null}

                              {/* Category Badge */}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeStyle(
                                  log.category
                                )}`}
                              >
                                {categoryTag}
                              </span>

                              {/* Explicit Status Pill (Replaces redundant 2nd raw green dot) */}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  isSuccess
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : isWarning
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                }`}
                              >
                                {isSuccess ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                ) : isWarning ? (
                                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                                )}
                                <span className="capitalize">{log.status || 'success'}</span>
                              </span>
                            </div>

                            {/* Main Action Description */}
                            <p className="text-sm font-semibold text-foreground/90">
                              {log.effective_description || log.description || log.action}
                            </p>

                            {/* Details Line */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {log.ip_address && (
                                <span className="font-mono flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-muted-foreground/70" />
                                  IP: {log.ip_address}
                                </span>
                              )}
                              {log.device_info && (
                                <span className="flex items-center gap-1">
                                  <Laptop className="w-3 h-3 text-muted-foreground/70" />
                                  {log.device_info}
                                </span>
                              )}
                              <span>
                                • {log.location && log.location !== 'Unknown' && log.location !== 'Unknown Location'
                                  ? log.location
                                  : 'Internal / Server'}
                              </span>
                              <span className="text-muted-foreground/80 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground/70" />
                                {log.time_ago || 'Recently'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Date Time & Chevron */}
                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <span className="text-xs text-muted-foreground hidden sm:inline-block font-medium">
                            {log.created_at_formatted}
                          </span>
                          <div className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details Container */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 border-t border-border/60 bg-muted/15 space-y-4">
                          {/* Mini user info badge */}
                          <div className="p-3 bg-card border border-border rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {log.actor_avatar ? (
                                <img
                                  src={log.actor_avatar}
                                  alt={actorDisplay}
                                  className="w-8 h-8 rounded-lg object-cover border border-border"
                                />
                              ) : isSystem ? (
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                                  <Bot className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase">
                                  {actorDisplay[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-foreground">{actorDisplay}</span>
                                  {isSystem ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
                                      Automated Engine
                                    </span>
                                  ) : log.actor_role && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground uppercase">
                                      {log.actor_role.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                                {log.actor_email && (
                                  <span className="text-[11px] text-muted-foreground font-mono">{log.actor_email}</span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border ${
                                isSuccess
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : isWarning
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              }`}
                            >
                              {isSuccess ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : isWarning ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              )}
                              <span>Status: {log.status || 'success'}</span>
                            </span>
                          </div>

                          {/* Key-Value Box Grid (Matching Screenshot Box Structure) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {/* EVENT ID Box */}
                            <div className="bg-card border border-border rounded-xl p-3">
                              <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">
                                Event ID
                              </div>
                              <div className="font-mono text-foreground font-medium select-all break-all">{log.id}</div>
                            </div>

                            {/* EXACT TIMESTAMP Box */}
                            <div className="bg-card border border-border rounded-xl p-3">
                              <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">
                                Exact Timestamp
                              </div>
                              <div className="font-mono text-foreground font-medium select-all">{log.created_at}</div>
                            </div>

                            {/* IP & LOCATION Box */}
                            <div className="bg-card border border-border rounded-xl p-3">
                              <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">
                                IP & Location
                              </div>
                              <div className="text-foreground font-medium">
                                {log.ip_address || 'No IP recorded'} ({log.location || 'Unknown Location'})
                              </div>
                            </div>

                            {/* DEVICE & BROWSER Box */}
                            <div className="bg-card border border-border rounded-xl p-3">
                              <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">
                                Device & Browser
                              </div>
                              <div className="text-foreground font-medium">{log.device_info || 'Standard Browser'}</div>
                            </div>
                          </div>

                          {/* Raw Event Details / Metadata */}
                          <div className="bg-card border border-border rounded-xl p-3">
                            <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2">
                              Raw Details & Metadata
                            </div>
                            {(!log.metadata || Object.keys(log.metadata).length === 0) &&
                            (!log.changes || Object.keys(log.changes).length === 0) ? (
                              <p className="text-xs italic text-muted-foreground">
                                No additional Raw Details recorded for this standard action.
                              </p>
                            ) : (
                              <pre className="p-3 bg-muted/50 rounded-lg text-xs font-mono text-foreground overflow-x-auto max-h-48 border border-border/60">
                                {JSON.stringify({ ...log.changes, ...log.metadata }, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {(prevUrl || nextUrl) && (
              <div className="flex justify-between items-center p-4 bg-card border border-border rounded-2xl shadow-2xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => prevUrl && fetchLogs(prevUrl)}
                  disabled={!prevUrl || isFetchingLogs}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Showing {logs.length} of {stats.total} total events
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => nextUrl && fetchLogs(nextUrl)}
                  disabled={!nextUrl || isFetchingLogs}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE & SETTINGS */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Personal & Account Information */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-foreground">Personal Information</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
                  >
                    Edit Info
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">First Name</span>
                    <span className="font-semibold text-foreground">{targetUser.first_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Last Name</span>
                    <span className="font-semibold text-foreground">{targetUser.last_name || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-xs">Email Address</span>
                    <span className="font-semibold font-mono text-foreground">{targetUser.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Preferred Language</span>
                    <span className="font-semibold uppercase text-foreground">{targetUser.preferred_language || 'en'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Unique User ID</span>
                    <span className="font-mono text-xs text-foreground select-all">{targetUser.id}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Security & Status */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground">Security & Access</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Account Status</span>
                    <span
                      className={`font-semibold inline-flex items-center gap-1.5 ${
                        targetUser.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${targetUser.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {targetUser.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Email Verification</span>
                    <span
                      className={`font-semibold ${
                        targetUser.email_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                      }`}
                    >
                      {targetUser.email_verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Signup Method</span>
                    <span className="font-semibold text-foreground capitalize">
                      {targetUser.signup_method_display || targetUser.signup_method || 'Email & Password'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Password Reset Required</span>
                    <span className="font-semibold text-foreground">
                      {targetUser.must_change_password ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-xs">Joined Date</span>
                    <span className="font-semibold text-foreground">{targetUser.date_joined_formatted}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Background Profile (if filled) */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Globe className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground">Demographics & Background</h3>
                </div>

                {targetUser.background_profile ? (
                  <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Phone Number</span>
                      <span className="font-semibold text-foreground font-mono">
                        {targetUser.background_profile.phone_number || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Nationality</span>
                      <span className="font-semibold text-foreground">
                        {targetUser.background_profile.nationality_display || targetUser.background_profile.nationality || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Region</span>
                      <span className="font-semibold text-foreground">
                        {targetUser.background_profile.region_display || targetUser.background_profile.region || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Gender</span>
                      <span className="font-semibold text-foreground capitalize">
                        {targetUser.background_profile.gender_display || targetUser.background_profile.gender || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Education</span>
                      <span className="font-semibold text-foreground">
                        {targetUser.background_profile.education_level_display ||
                          targetUser.background_profile.education_level ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Profession</span>
                      <span className="font-semibold text-foreground">
                        {targetUser.background_profile.profession_display || targetUser.background_profile.profession || '—'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No extended background profile completed yet.</p>
                )}
              </div>

              {/* Card 4: Last Known Session & Login Metadata */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Laptop className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground">Last Recorded Login Metadata</h3>
                </div>

                {targetUser.last_login_metadata ? (
                  <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-xs">Last Login Time</span>
                      <span className="font-semibold text-foreground font-mono">
                        {targetUser.last_login_metadata.timestamp_formatted || targetUser.last_login_metadata.timestamp}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">IP Address</span>
                      <span className="font-semibold text-foreground font-mono">
                        {targetUser.last_login_metadata.ip_address}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Location</span>
                      <span className="font-semibold text-foreground">
                        {targetUser.last_login_metadata.location}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Browser & Platform</span>
                      <span className="font-semibold text-foreground">
                        {targetUser.last_login_metadata.device_info}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Auth Method</span>
                      <span className="font-semibold text-foreground uppercase">
                        {targetUser.last_login_metadata.auth_method}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No historical login sessions recorded for this user.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: RESET PASSWORD */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setGeneratedTempPassword(null);
        }}
        title="Reset User Password"
      >
        <div className="space-y-4">
          {generatedTempPassword ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password Reset Successfully</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  A temporary password has been set. The user will be required to change it upon logging in.
                </p>
                <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                  <code className="font-mono text-base font-bold text-foreground select-all">
                    {generatedTempPassword}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedTempPassword, 'temporary password')}
                    className="gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setGeneratedTempPassword(null);
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to reset the password for{' '}
                <strong className="text-foreground">{targetUser.email}</strong>? A secure temporary password will be
                generated and recorded in the audit trail.
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isActionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={isActionLoading}
                  className="gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  {isActionLoading ? 'Resetting...' : 'Confirm Reset Password'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: SUSPEND / ACTIVATE */}
      <ConfirmModal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        onConfirm={handleToggleStatus}
        title={targetUser.is_active ? 'Suspend User Account' : 'Activate User Account'}
        message={
          targetUser.is_active
            ? `Are you sure you want to suspend ${targetUser.email}? The user will be immediately blocked from logging into the platform until reactivated.`
            : `Are you sure you want to reactivate ${targetUser.email}? The user will regain access to their account and enrolled courses.`
        }
        confirmText={targetUser.is_active ? 'Suspend Account' : 'Activate Account'}
        variant={targetUser.is_active ? 'danger' : 'info'}
      />

      {/* MODAL 3: DELETE CONFIRM */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${targetUser.email}? This action can be audited and restored by Super Admins from the Trash.`}
        confirmText="Delete User"
        variant="danger"
      />

      {/* MODAL 4: EDIT USER PROFILE */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile"
      >
        <form onSubmit={handleEditProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">First Name</label>
              <input
                type="text"
                value={editFormData.first_name}
                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Last Name</label>
              <input
                type="text"
                value={editFormData.last_name}
                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
            <input
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Preferred Language</label>
            <select
              value={editFormData.preferred_language}
              onChange={(e) => setEditFormData({ ...editFormData, preferred_language: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="en">English</option>
              <option value="am">Amharic</option>
              <option value="om">Afaan Oromo</option>
              <option value="ti">Tigrinya</option>
              <option value="so">Somali</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isActionLoading}>
              {isActionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
