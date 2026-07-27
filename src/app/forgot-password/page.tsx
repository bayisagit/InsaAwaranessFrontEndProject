'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { requestPasswordReset } from '@/lib/api';

type PageState = 'form' | 'sent';

export default function ForgotPasswordPage() {
 const [email, setEmail] = useState('');
 const [error, setError] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [pageState, setPageState] = useState<PageState>('form');

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setIsLoading(true);

 const { error: apiError, status } = await requestPasswordReset(email.trim());

 setIsLoading(false);

 if (status !== 200) {
 // Backend returns 400 if email not found — show friendly message
 const msg = apiError?.includes('does not exist')
 ? 'No account found with that email address. Please check and try again.'
 : (apiError || 'Failed to send reset link. Please try again.');
 setError(msg);
 toast.error(msg);
 return;
 }

 toast.success('Password reset link sent!');
 setPageState('sent');
 };

 // ── Success / Confirmation state ──────────────────────────────────────────
 if (pageState === 'sent') {
 return (
 <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-muted">
 <div className="w-full max-w-md bg-card p-8 md:p-10 rounded-2xl shadow-sm shadow-black/5 dark:shadow-none border border-border text-center">
 {/* Success Icon */}
 <div className="flex justify-center mb-6">
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
 <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
 </svg>
 </div>
 </div>

 <h1 className="text-2xl font-bold text-foreground mb-3">Check Your Email</h1>
 <p className="text-sm text-muted-foreground mb-2">
 We&apos;ve sent a password reset link to:
 </p>
 <p className="text-sm font-bold text-foreground bg-muted px-4 py-2 rounded-xl mb-6 border border-border">
 {email}
 </p>
 <p className="text-xs text-muted-foreground mb-8 leading-relaxed">
 Click the link in the email to reset your password. The link expires in{' '}
 <strong>3 days</strong>. Check your spam folder if you don&apos;t see it.
 </p>

 <div className="space-y-3">
 <button
 type="button"
 onClick={() => { setPageState('form'); setError(''); }}
 className="text-sm font-semibold text-primary hover:underline cursor-pointer"
 >
 Try a different email address
 </button>
 </div>

 <div className="mt-8 pt-6 border-t border-border">
 <p className="text-sm text-muted-foreground">
 Remembered your password?{' '}
 <Link href="/login" className="font-semibold text-primary hover:underline">
 Sign in
 </Link>
 </p>
 </div>
 </div>
 </div>
 );
 }

 // ── Form state ────────────────────────────────────────────────────────────
 return (
 <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-muted">
 <div className="w-full max-w-md bg-card p-8 md:p-10 rounded-2xl shadow-sm shadow-black/5 dark:shadow-none border border-border text-center">
 {/* Icon */}
 <div className="flex justify-center mb-6">
 <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
 <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
 </svg>
 </div>
 </div>

 <h1 className="text-3xl font-bold text-foreground mb-2">Forgot Password?</h1>
 <p className="text-sm font-medium text-muted-foreground mb-8 max-w-xs mx-auto">
 Enter your registered email and we&apos;ll send you a secure reset link.
 </p>

 <form className="space-y-5 text-left" onSubmit={handleSubmit}>
 {error && (
 <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-start gap-2">
 <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 {error}
 </div>
 )}

 <Input
 label="Email Address"
 type="email"
 placeholder="example@email.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 disabled={isLoading}
 autoComplete="email"
 />

 <Button variant="secondary" type="submit" fullWidth className="py-3 rounded-xl" disabled={isLoading}>
 {isLoading ? (
 <span className="flex items-center gap-2">
 <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
 </svg>
 Sending Reset Link…
 </span>
 ) : 'Send Reset Link'}
 </Button>
 </form>

 <p className="mt-8 text-sm text-muted-foreground">
 Remembered your password?{' '}
 <Link href="/login" className="font-semibold text-primary hover:underline">
 Sign in
 </Link>
 </p>
 </div>
 </div>
 );
}
