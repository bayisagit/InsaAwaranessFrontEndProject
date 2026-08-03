'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { toast } from 'react-hot-toast';

export default function PaymentVerifyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const txRef = searchParams.get('tx_ref');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your payment...');
    const verificationAttempted = useRef(false);

    useEffect(() => {
        if (txRef && !verificationAttempted.current) {
            verificationAttempted.current = true;
            verifyPayment(txRef);
        } else if (!txRef) {
            setStatus('error');
            setMessage('Missing transaction reference.');
        }
    }, [txRef]);

    const verifyPayment = async (reference: string) => {
        try {
            const { data, error, status: httpStatus } = await apiFetch(`/api/v1/payments/verify/${reference}/`, {
                method: 'POST'
            });

            if (httpStatus === 200) {
                setStatus('success');
                setMessage('Payment verified! The course has been unlocked for your organization.');
                toast.success('Payment successful!');
            } else {
                setStatus('error');
                setMessage(error || 'Payment verification failed. Please contact support if you were charged.');
                toast.error('Payment verification failed.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('An unexpected error occurred during verification.');
        }
    };

    return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card rounded-2xl p-8 shadow-sm border border-border text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
                        <h2 className="text-xl font-bold text-foreground mb-2">Verifying Payment</h2>
                        <p className="text-muted-foreground">{message}</p>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
                        <p className="text-muted-foreground mb-8">{message}</p>
                        <Button variant="primary" className="w-full" onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h2>
                        <p className="text-muted-foreground mb-8">{message}</p>
                        <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                            Return to Dashboard
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
