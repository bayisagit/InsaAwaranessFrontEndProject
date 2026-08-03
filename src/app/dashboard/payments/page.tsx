'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';
import { LinkifyText } from '@/components/LinkifyText';

interface PaymentHistory {
    id: string;
    course_title: string;
    amount: string;
    currency: string;
    status: string;
    payment_method: string;
    transaction_reference: string;
    paid_at: string | null;
    created_at: string;
}

export default function PaymentsHistoryPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [payments, setPayments] = useState<PaymentHistory[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.role !== 'org_admin') {
                router.push('/dashboard');
            } else {
                fetchPayments();
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    const fetchPayments = async () => {
        setIsFetching(true);
        const { data, error: err } = await apiFetch('/api/v1/payments/history/');
        
        if (err) {
            setError(err);
        } else if (data?.results) {
            setPayments(data.results);
        } else if (Array.isArray(data)) {
            setPayments(data);
        }
        setIsFetching(false);
    };

    if (isLoading || isFetching) {
        return <div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
    }

    if (!user || user.role !== 'org_admin') return null;

    return (
        <div className="min-h-screen bg-muted pb-20">
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-1">Payment History</h1>
                        <p className="text-muted-foreground">View and track all course payments made by your organization.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-8">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

                {payments.length === 0 ? (
                    <EmptyState
                        icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="No payments found."
                        description="Your organization has not made any course payments yet."
                    />
                ) : (
                    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-muted-foreground whitespace-nowrap">
                                <thead className="bg-muted text-foreground uppercase font-semibold text-xs border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Course</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Reference / ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {payments.map(payment => (
                                        <tr key={payment.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                {new Date(payment.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-foreground max-w-[200px] truncate">
                                                {payment.course_title}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-foreground">
                                                {payment.currency} {payment.amount}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                                    payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    payment.status === 'expired' ? 'bg-muted text-muted-foreground' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                                                {payment.transaction_reference}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
