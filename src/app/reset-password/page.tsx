'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { confirmPasswordReset } from '@/lib/api';
import { toast } from 'react-hot-toast';

const getPasswordScore = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200', w: 'w-0' };
    if (pass.length < 8) return { score: 1, label: 'Weak', color: 'bg-red-500', w: 'w-1/4' };
    let score = 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (pass.length > 12) score++;
    if (score === 2) return { score, label: 'Fair', color: 'bg-yellow-400', w: 'w-2/4' };
    if (score === 3) return { score, label: 'Good', color: 'bg-blue-500', w: 'w-3/4' };
    return { score, label: 'Strong', color: 'bg-green-500', w: 'w-full' };
};

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const passStrength = getPasswordScore(password);

    if (!uid || !token) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 mb-6 font-medium text-left flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Invalid or missing reset link. Please click the full link from your email or request a new one.
                <Link href="/forgot-password" className="ml-1 underline font-bold">Request again</Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        const { error: apiError, status } = await confirmPasswordReset(uid, token, password);

        if (status !== 200) {
            const msg = apiError || 'Failed to reset password. The link may have expired.';
            setError(msg);
            toast.error(msg);
            setIsLoading(false);
            return;
        }

        toast.success('Password reset successful! Please sign in.');
        setSuccess(true);
        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="text-center space-y-4">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-100 font-medium">
                    Your password has been reset successfully.
                </div>
                <Button variant="secondary" type="button" fullWidth className="py-3 rounded-lg" onClick={() => router.push('/login')}>
                    Sign in with your new password
                </Button>
            </div>
        );
    }

    return (
        <form className="space-y-5 text-left" onSubmit={handleSubmit}>
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            <div className="space-y-1">
                <Input
                    label="New Password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    showPasswordToggle
                    autoComplete="new-password"
                />
                {password && (
                    <div className="flex items-center gap-2 mt-1 px-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${passStrength.color} ${passStrength.w} transition-all duration-300`}></div>
                        </div>
                        <span className={`text-[10px] font-bold ${passStrength.color.replace('bg-', 'text-')}`}>{passStrength.label}</span>
                    </div>
                )}
            </div>

            <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                showPasswordToggle
                autoComplete="new-password"
            />

            {/* Password requirements */}
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500">
                    {[
                        { test: password.length >= 8, label: '8+ characters' },
                        { test: /[A-Z]/.test(password), label: '1 uppercase letter' },
                        { test: /[0-9]/.test(password), label: '1 number' },
                        { test: /[^A-Za-z0-9]/.test(password), label: '1 special char' },
                    ].map(({ test, label }) => (
                        <div key={label} className={`flex items-center gap-2 ${test ? 'text-green-600 font-medium' : ''}`}>
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${test ? 'bg-green-500 text-white' : 'bg-gray-300 text-transparent'}`}>&#10003;</span>
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            <Button variant="secondary" type="submit" fullWidth className="py-3 rounded-lg" disabled={isLoading}>
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Resetting Password…
                    </span>
                ) : 'Reset Password'}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Password</h1>
                <p className="text-sm font-medium text-gray-600 mb-8 max-w-xs mx-auto">
                    Choose a strong password you haven&apos;t used before.
                </p>

                <Suspense fallback={
                    <div className="flex justify-center py-8">
                        <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>

                <p className="mt-8 text-sm text-gray-600">
                    Remembered your password?{' '}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
