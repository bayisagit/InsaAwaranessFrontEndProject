'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/Button';
import { AnimatedSection } from '@/components/AnimatedSection';
import { EmptyState } from '@/components/EmptyState';
import { TrashItemDetailModal } from '@/components/admin/TrashItemDetailModal';
import {
  Trash2,
  RotateCcw,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Layers,
  GraduationCap,
  Folder,
  BookOpen,
  HelpCircle,
  Building,
  User,
  Shield,
  FileText
} from 'lucide-react';

interface TrashItem {
  id: string | null;
  model: string;
  name: string;
  deleted_at: string;
  deleted_session_id: string | null;
}

const MODEL_ICONS: Record<string, any> = {
  course: GraduationCap,
  module: Folder,
  lesson: BookOpen,
  assessment: HelpCircle,
  question: HelpCircle,
  choice: HelpCircle,
  user: User,
  organization: Building,
  compliancereport: FileText,
  awarenesstool: Shield,
};

const MODEL_BADGES: Record<string, string> = {
  course: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  module: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  lesson: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  assessment: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  question: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  choice: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
  user: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  organization: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  compliancereport: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
  awarenesstool: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
};

export default function TrashPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filterModel, setFilterModel] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{ model: string; id: string } | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'super_admin')) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchTrash();
    }
  }, [user, filterModel]);

  const fetchTrash = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const url = filterModel ? `/api/v1/superadmin/trash/?model=${filterModel}` : '/api/v1/superadmin/trash/';
      const response = await apiFetch(url);
      if (response.error) throw new Error(response.error);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load trash items');
    } finally {
      setIsFetching(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      item =>
        item.name.toLowerCase().includes(term) ||
        item.model.toLowerCase().includes(term) ||
        (item.id && item.id.toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  const handleRestore = async (item: TrashItem, overrideEmail?: string) => {
    if (!overrideEmail) {
      if (!confirm(`Are you sure you want to restore this ${item.model} ("${item.name}")?\n\nThis will also restore any related items that were deleted at the exact same time.`)) {
        return;
      }
    }
    
    setRestoringId(item.id);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/superadmin/trash/restore/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          model: item.model,
          id: item.id,
          ...(overrideEmail && { new_email: overrideEmail })
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.requires_new_email) {
          const newEmail = prompt(`${data.detail}\n\nEnter a new email for this user:`);
          if (newEmail) {
             return handleRestore(item, newEmail);
          } else {
             return;
          }
        }
        throw new Error(data.error || data.detail || 'Failed to restore');
      }

      // Close modal if open on restored item
      if (selectedDetail && selectedDetail.id === item.id) {
        setSelectedDetail(null);
      }

      // Refresh list
      fetchTrash();
    } catch (err: any) {
      alert(`Restore failed: ${err.message || 'Unknown error'}`);
    } finally {
      if (!overrideEmail) {
        setRestoringId(null);
      }
    }
  };

  if (isLoading || (isAuthenticated && user?.role !== 'super_admin')) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AnimatedSection className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">System Trash & Audit Inspection</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Inspect ancestry, lifecycle audit history, and restore soft-deleted records across the platform.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button onClick={fetchTrash} variant="outline" size="sm" disabled={isFetching} className="cursor-pointer">
            <RefreshCw className={`size-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card p-3 rounded-2xl border border-border shadow-sm shadow-black/5 dark:shadow-none flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, question prompt, or identifier UUID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="size-4 text-muted-foreground shrink-0 hidden sm:block" />
          <select 
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
          >
            <option value="">All Models</option>
            <option value="course">Courses</option>
            <option value="module">Modules</option>
            <option value="lesson">Lessons</option>
            <option value="assessment">Assessments</option>
            <option value="question">Questions</option>
            <option value="choice">Choices</option>
            <option value="user">Users</option>
            <option value="organization">Organizations</option>
            <option value="compliancereport">Compliance Reports</option>
            <option value="awarenesstool">Awareness Tools</option>
            <option value="alert">Alerts</option>
            <option value="campaign">Campaigns</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs sm:text-sm">
          {error}
        </div>
      )}

      {isFetching ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Scanning soft-deleted platform records...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState 
          title="Trash is empty" 
          description={searchTerm ? "No soft-deleted records matched your search query." : "No soft-deleted records were found in the database."} 
          icon={
            <div className="p-4 rounded-2xl bg-muted/50 border border-border">
              <Trash2 className="w-10 h-10 text-muted-foreground/60" />
            </div>
          }
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm shadow-black/5 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted text-foreground uppercase font-bold text-xs border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Model</th>
                  <th scope="col" className="px-6 py-3.5">Name / Identifier</th>
                  <th scope="col" className="px-6 py-3.5">Deleted At</th>
                  <th scope="col" className="px-6 py-3.5">Batch Session</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item, idx) => {
                  const Icon = MODEL_ICONS[item.model.toLowerCase()] || Layers;
                  const badgeCls = MODEL_BADGES[item.model.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
                  
                  return (
                    <tr 
                      key={`${item.id}-${idx}`} 
                      className="hover:bg-muted/40 transition-colors group cursor-pointer"
                      onClick={() => item.id && setSelectedDetail({ model: item.model, id: item.id })}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${badgeCls}`}>
                          <Icon className="size-3.5 shrink-0" />
                          {item.model}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors max-w-md line-clamp-1" title={item.name}>
                          {item.name}
                        </div>
                        {item.id && (
                          <div className="text-xs text-muted-foreground font-mono truncate max-w-xs mt-0.5">
                            {item.id}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-foreground font-medium">
                        {new Date(item.deleted_at).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                        {item.deleted_session_id ? (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md border border-border">
                            {item.deleted_session_id.split('-')[0]}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 italic">Standalone</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.id) setSelectedDetail({ model: item.model, id: item.id });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg border border-border transition-colors cursor-pointer"
                            title="Inspect Ancestry, Fields, and Audit Trail"
                          >
                            <Eye className="size-3.5 text-primary" />
                            <span>Inspect</span>
                          </button>

                          <Button 
                            size="sm" 
                            variant="primary" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(item);
                            }}
                            disabled={restoringId === item.id || !item.id}
                            className="shadow-sm"
                          >
                            <RotateCcw className={`size-3 mr-1 ${restoringId === item.id ? 'animate-spin' : ''}`} />
                            {restoringId === item.id ? 'Restoring...' : 'Restore'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deep Inspection Drawer / Modal */}
      <TrashItemDetailModal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        model={selectedDetail?.model || null}
        itemId={selectedDetail?.id || null}
        onRestore={(item) => handleRestore(item as TrashItem)}
        isRestoring={restoringId === selectedDetail?.id}
      />
    </AnimatedSection>
  );
}
