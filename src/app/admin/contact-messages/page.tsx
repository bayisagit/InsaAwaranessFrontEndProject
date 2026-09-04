'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ContactMessage, deleteContactMessage, getContactMessages, updateContactMessage } from '@/lib/api';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function AdminContactMessagesPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [prevUrl, setPrevUrl] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.role !== 'super_admin') {
                router.push('/dashboard');
            } else {
                fetchMessages();
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    const fetchMessages = async (url?: string) => {
        setIsFetching(true);
        setError('');
        try {
            // Using a simple fetch implementation here since getContactMessages doesn't directly take a full URL in the wrapper,
            // but for simplicity we'll just re-fetch page 1 if no URL, or implement pagination manually if needed.
            const { data, error: apiError, status } = url 
                ? await (await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })).json()
                : await getContactMessages();

            // If we used the wrapper without url:
            if (!url) {
                const response = await getContactMessages();
                if (response.error || response.status !== 200) {
                    setError(response.error || 'Failed to fetch messages');
                } else if (response.data && 'results' in response.data) {
                    setMessages(response.data.results);
                    setNextUrl(response.data.next);
                    setPrevUrl(response.data.previous);
                } else if (Array.isArray(response.data)) {
                    setMessages(response.data);
                }
            } else {
                 // Manual fetch for pagination urls
                 const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                 const json = await res.json();
                 if (!res.ok) throw new Error('Failed to fetch');
                 if (json.results) {
                     setMessages(json.results);
                     setNextUrl(json.next);
                     setPrevUrl(json.previous);
                 } else if (Array.isArray(json)) {
                     setMessages(json);
                 }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching messages');
        } finally {
            setIsFetching(false);
        }
    };

    const openModal = (msg: ContactMessage) => {
        setActionError('');
        setSelectedMessage(msg);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedMessage(null);
        setActionError('');
    };

    const handleUpdateStatus = async (status: 'reviewed' | 'resolved') => {
        if (!selectedMessage) return;
        setIsActionLoading(true);
        setActionError('');

        const { data, error: apiError, status: httpStatus } = await updateContactMessage(selectedMessage.id, { status });

        if (apiError || httpStatus !== 200) {
            setActionError(apiError || 'Failed to update status.');
        } else {
            fetchMessages();
            closeModal();
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
        setError('');

        const { error: apiError, status } = await deleteContactMessage(itemToDelete);

        if (apiError || status !== 204) {
            setError(apiError || 'Failed to delete message.');
        } else {
            fetchMessages();
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

    if (!user || user.role !== 'super_admin') return null;

    return (
        <div className="min-h-screen bg-muted pb-20">
            {/* Header */}
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Contact Messages</h1>
                        <p className="text-muted-foreground">Manage inquiries and support requests from users.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
                        {error}
                    </div>
                )}

                {/* Messages Table */}
                <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground min-w-[800px]">
                        <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Subject</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {messages.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No messages found.
                                    </td>
                                </tr>
                            ) : (
                                messages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-muted transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {new Date(msg.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {msg.first_name} {msg.last_name}
                                        </td>
                                        <td className="px-4 py-3">{msg.work_email}</td>
                                        <td className="px-4 py-3">{msg.subject_category}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border uppercase ${
                                                msg.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                msg.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-green-50 text-green-700 border-green-200'
                                            }`}>
                                                {msg.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button
                                                onClick={() => openModal(msg)}
                                                className="text-primary hover:underline font-medium text-sm"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDelete(msg.id)}
                                                className="text-red-600 hover:underline font-medium text-sm ml-2"
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

                {/* Pagination */}
                {(prevUrl || nextUrl) && (
                    <div className="flex justify-between items-center mt-6">
                        <Button
                            variant="outline"
                            disabled={!prevUrl}
                            onClick={() => prevUrl && fetchMessages(prevUrl)}
                        >
                            &larr; Previous
                        </Button>
                        <Button
                            variant="outline"
                            disabled={!nextUrl}
                            onClick={() => nextUrl && fetchMessages(nextUrl)}
                        >
                            Next &rarr;
                        </Button>
                    </div>
                )}
            </div>

            {/* View/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title="Message Details">
                {selectedMessage && (
                    <div className="space-y-6">
                        {actionError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                {actionError}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">From</label>
                                <p className="text-sm font-medium text-foreground">{selectedMessage.first_name} {selectedMessage.last_name}</p>
                                <p className="text-sm text-muted-foreground">{selectedMessage.work_email}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Date Sent</label>
                                <p className="text-sm text-foreground">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Subject Category</label>
                            <p className="text-sm font-medium text-foreground">{selectedMessage.subject_category}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Message</label>
                            <div className="bg-muted p-4 rounded-lg border border-border mt-1">
                                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedMessage.message}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex justify-between items-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border uppercase ${
                                selectedMessage.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                selectedMessage.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-green-50 text-green-700 border-green-200'
                            }`}>
                                Status: {selectedMessage.status}
                            </span>
                            
                            <div className="flex gap-2">
                                {selectedMessage.status === 'pending' && (
                                    <Button 
                                        variant="outline" 
                                        onClick={() => handleUpdateStatus('reviewed')}
                                        disabled={isActionLoading}
                                    >
                                        Mark Reviewed
                                    </Button>
                                )}
                                {selectedMessage.status !== 'resolved' && (
                                    <Button 
                                        variant="primary" 
                                        onClick={() => handleUpdateStatus('resolved')}
                                        disabled={isActionLoading}
                                    >
                                        Mark Resolved
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Message"
                message="Are you sure you want to delete this message? This action cannot be undone."
                confirmText="Delete Message"
                isDestructive={true}
                isLoading={isActionLoading}
            />
        </div>
    );
}
