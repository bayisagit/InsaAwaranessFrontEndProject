'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail, verifyEmailOTP, resendVerificationEmail } from '@/lib/api';
import { Button } from '@/components/Button';
import { OtpInput } from '@/components/OtpInput';
import { toast } from 'react-hot-toast';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code') || searchParams.get('otp');

    const [status, setStatus] = useState<'verifying' | 'input' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState(emailParam || '');
    const [otpCode, setOtpCode] = useState(codeParam || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        // 1. One-click link with Email + 6-digit code from email button
        if (emailParam && codeParam) {
            setStatus('verifying');
            verifyEmailOTP(emailParam, codeParam).then(({ error }) => {
                if (error) {
                    setStatus('error');
                    setMessage(error);
                } else {
                    setStatus('success');
                    setMessage('Email verified successfully! You can now log in.');
                }
            });
            return;
        }

        // 2. Legacy UID + Token link
        if (uid && token) {
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
            return;
        }

        // 3. User arrived without link parameters -> show manual OTP code entry
        setStatus('input');
    }, [uid, token, emailParam, codeParam]);

    // Resend countdown timer
    useEffect(() => {
        if (status !== 'input' || countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [status, countdown]);

    const handleManualVerify = async (codeToVerify?: string) => {
        const code = (codeToVerify || otpCode).trim();
        if (!email.trim()) {
            toast.error('Please enter your email address.');
            return;
        }
        if (code.length !== 6) {
            toast.error('Please enter all 6 digits of the verification code.');
            return;
        }

        setIsSubmitting(true);
        const { error } = await verifyEmailOTP(email.trim(), code);
        setIsSubmitting(false);

        if (error) {
            toast.error(error);
        } else {
            toast.success('Email verified successfully!');
            setStatus('success');
            setMessage('Email verified successfully! You can now log in.');
        }
    };

    const handleResend = async () => {
        if (!email.trim()) {
            toast.error('Please enter your email address to resend.');
            return;
        }
        setIsSubmitting(true);
        const { error } = await resendVerificationEmail(email.trim());
        setIsSubmitting(false);

        if (error) {
            toast.error(error);
        } else {
            toast.success('New 6-digit verification code sent to your email.');
            setCountdown(60);
            setOtpCode('');
        }
    };

    return (
        <div className="min-h-[85vh] bg-muted flex items-center justify-center p-4 py-16">
            <div className="bg-card rounded-3xl shadow-sm border border-border p-8 md:p-10 max-w-md w-full text-center">
                
                {status === 'verifying' && (
                    <div className="py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6" role="status" aria-label="Verifying" />
                        <h1 className="text-2xl font-bold text-foreground mb-2">Verifying your email...</h1>
                        <p className="text-muted-foreground text-sm">Please wait while we verify your verification code.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-6 space-y-5">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Email Verified!</h1>
                        <p className="text-muted-foreground text-sm">{message}</p>
                        <Button
                            variant="secondary"
                            fullWidth
                            className="py-3.5 rounded-xl font-bold cursor-pointer"
                            onClick={() => router.push('/login')}
                        >
                            Sign In to Your Account &rarr;
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-6 space-y-5">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Verification Failed</h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                fullWidth
                                className="py-3 rounded-xl font-semibold cursor-pointer"
                                onClick={() => setStatus('input')}
                            >
                                Enter Code Manually
                            </Button>
                            <Button
                                variant="secondary"
                                fullWidth
                                className="py-3 rounded-xl font-semibold cursor-pointer"
                                onClick={() => router.push('/signup')}
                            >
                                Sign Up
                            </Button>
                        </div>
                    </div>
                )}

                {status === 'input' && (
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
                            Enter security code
                        </h1>
                        <p className="text-sm text-muted-foreground mb-6">
                            Enter your registered email and the 6-digit code sent to your inbox.
                        </p>

                        {/* Green banner */}
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-2xl text-xs sm:text-sm border border-emerald-200 dark:border-emerald-800 mb-6 flex items-center gap-2.5 text-left">
                            <div className="w-5 h-5 rounded-full border-2 border-emerald-600 dark:border-emerald-400 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="font-medium">A 6-digit verification code has been sent to your email.</span>
                        </div>

                        {!emailParam && (
                            <div className="text-left mb-4">
                                <label className="text-xs font-semibold text-foreground block mb-1">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-border bg-card text-foreground font-medium text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all shadow-xs"
                                />
                            </div>
                        )}

                        <div className="text-left mb-2">
                            <label className="text-xs font-semibold text-muted-foreground block text-center mb-1">
                                6-Digit Verification Code
                            </label>
                            <OtpInput
                                value={otpCode}
                                onChange={setOtpCode}
                                onComplete={(code) => handleManualVerify(code)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <Button
                            variant="secondary"
                            fullWidth
                            className="py-3.5 rounded-xl font-bold mt-4 cursor-pointer"
                            disabled={otpCode.length !== 6 || !email.trim() || isSubmitting}
                            onClick={() => handleManualVerify(otpCode)}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Verifying Code...
                                </span>
                            ) : (
                                'Continue \u2192'
                            )}
                        </Button>

                        <div className="flex items-center justify-between text-xs sm:text-sm pt-5 mt-4 border-t border-border">
                            <Link href="/login" className="text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1 transition-colors">
                                &larr; Back to sign in
                            </Link>

                            {countdown > 0 ? (
                                <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    Resend in {countdown}s
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={isSubmitting}
                                    className="text-primary font-bold hover:underline cursor-pointer"
                                >
                                    Resend code
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] bg-muted flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" role="status" aria-label="Loading" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}