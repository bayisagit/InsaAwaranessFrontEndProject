'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/Button';
import { AnimatedSection } from '@/components/AnimatedSection';
import { EmptyState } from '@/components/EmptyState';

interface TrashItem {
  id: string | null;
  model: string;
  name: string;
  deleted_at: string;
  deleted_session_id: string | null;
}

export default function TrashPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filterModel, setFilterModel] = useState<string>('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.is_superuser)) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.is_superuser) {
      fetchTrash();
    }
  }, [user, filterModel]);

  const fetchTrash = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const url = filterModel ? `/superadmin/trash/?model=${filterModel}` : '/superadmin/trash/';
      const data = await apiFetch(url);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load trash items');
    } finally {
      setIsFetching(false);
    }
  };

  const handleRestore = async (item: TrashItem, overrideEmail?: string) => {
    if (!overrideEmail) {
      if (!confirm(`Are you sure you want to restore this ${item.model} (${item.name})?\n\nThis will also restore any related items that were deleted at the exact same time.`)) {
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
             return; // User cancelled
          }
        }
        throw new Error(data.error || data.detail || 'Failed to restore');
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

  if (isLoading || (isAuthenticated && !user?.is_superuser)) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <AnimatedSection className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Trash</h1>
          <p className="text-gray-500 dark:text-gray-400">View and restore soft-deleted records across the platform.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Models</option>
            <option value="user">Users</option>
            <option value="organization">Organizations</option>
            <option value="course">Courses</option>
            <option value="lesson">Lessons</option>
            <option value="assessment">Assessments</option>
          </select>
          <Button onClick={fetchTrash} variant="outline" disabled={isFetching}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {isFetching ? (
        <div className="p-8 text-center text-gray-500">Loading trash items...</div>
      ) : items.length === 0 ? (
        <EmptyState 
          title="Trash is empty" 
          description="No soft-deleted records were found." 
          icon={
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name / Identifier</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deleted At</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Session ID</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {items.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 capitalize">
                        {item.model}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs" title={item.name}>
                        {item.name}
                      </div>
                      {item.id && <div className="text-xs text-gray-500 font-mono truncate">{item.id}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.deleted_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                      {item.deleted_session_id ? item.deleted_session_id.split('-')[0] + '...' : 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={() => handleRestore(item)}
                        disabled={restoringId === item.id || !item.id}
                      >
                        {restoringId === item.id ? 'Restoring...' : 'Restore'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AnimatedSection>
  );
}
