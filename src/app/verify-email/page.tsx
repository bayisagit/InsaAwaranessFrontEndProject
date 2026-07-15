'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/lib/api';
import { Button } from '@/components/Button';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!uid || !token) {
            setStatus('error');
            setMessage('Invalid verification link. Missing required parameters.');
            return;
        }
        setStatus('verifying');
        verifyEmail(uid, token).then(({ error }) => {
            if (error) {
                setStatus('error');
                setMessage(error);
            } else {
                setStatus('success');
                setMessage('Email verified successfully! You can now log in.');
            }
        });
    }, [uid, token]);

    return (
        <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
                {status === 'verifying' && (
                    <div className="py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6" role="status" aria-label="Verifying" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
                        <p className="text-gray-500">Please wait while we verify your email address.</p>
                    </div>
                )}
                {status === 'success' && (
                    <div className="py-8">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
                        <p className="text-gray-500 mb-8">{message}</p>
                        <Link href="/login">
                            <Button variant="primary" className="w-full">Go to Login</Button>
                        </Link>
                    </div>
                )}
                {status === 'error' && (
                    <div className="py-8">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                        <p className="text-gray-500 mb-8">{message}</p>
                        <Link href="/signup">
                            <Button variant="outline" className="w-full">Back to Sign Up</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" role="status" aria-label="Loading" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}