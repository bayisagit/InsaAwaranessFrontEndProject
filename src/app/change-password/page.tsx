'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { changePassword, clearTokens } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

const getPasswordScore = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200', w: 'w-0' };
    if (pass.length < 8) return { score: 1, label: 'Weak', color: 'bg-red-500', w: 'w-1/4' };
    let score = 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (pass.length > 12) score++;
    if (score < 2) return { score, label: 'Weak', color: 'bg-red-400', w: 'w-1/4' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-yellow-400', w: 'w-2/4' };
    if (score === 3) return { score, label: 'Good', color: 'bg-blue-500', w: 'w-3/4' };
    return { score, label: 'Strong', color: 'bg-green-500', w: 'w-full' };
};

export default function ChangePasswordPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ old_password?: string; new_password?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const passStrength = getPasswordScore(newPassword);

    // If user is not logged in at all, redirect to login
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        if (newPassword.length < 8) {
            setFieldErrors({ new_password: 'New password must be at least 8 characters.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setFieldErrors({ new_password: 'New passwords do not match.' });
            return;
        }
        if (oldPassword === newPassword) {
            setFieldErrors({ new_password: 'New password must be different from your current password.' });
            return;
        }

        setIsLoading(true);

        const { error: apiError, status } = await changePassword(oldPassword, newPassword);

        setIsLoading(false);

        if (status !== 200) {
            // Parse Django field errors
            if (apiError?.toLowerCase().includes('incorrect')) {
                setFieldErrors({ old_password: 'Current password is incorrect.' });
            } else {
                setFieldErrors({ new_password: apiError || 'Failed to change password.' });
            }
            toast.error(apiError || 'Failed to change password.');
            return;
        }

        toast.success('Password changed successfully. Please sign in again.');

        // Per API docs: clear tokens after password change and redirect to login
        clearTokens();
        setTimeout(() => router.replace('/login'), 1200);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">

                {/* Forced-change banner */}
                {user?.must_change_password && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="text-sm font-bold text-amber-800">Password change required</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Your account requires a password change before you can access the platform. Please set a new secure password below.
                            </p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        {user?.first_name ? `Hi ${user.first_name}, set` : 'Set'} a new secure password for your account.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <Input
                        label="Current Password"
                        type="password"
                        placeholder="Your current password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        showPasswordToggle
                        error={fieldErrors.old_password}
                        autoComplete="current-password"
                    />

                    <div className="space-y-1">
                        <Input
                            label="New Password"
                            type="password"
                            placeholder="At least 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            showPasswordToggle
                            error={fieldErrors.new_password}
                            autoComplete="new-password"
                        />
                        {newPassword && (
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
                        placeholder="Re-enter new password"
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
                                { test: newPassword.length >= 8, label: '8+ characters' },
                                { test: /[A-Z]/.test(newPassword), label: '1 uppercase letter' },
                                { test: /[0-9]/.test(newPassword), label: '1 number' },
                                { test: /[^A-Za-z0-9]/.test(newPassword), label: '1 special char' },
                            ].map(({ test, label }) => (
                                <div key={label} className={`flex items-center gap-2 ${test ? 'text-green-600 font-medium' : ''}`}>
                                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${test ? 'bg-green-500 text-white' : 'bg-gray-300 text-transparent'}`}>&#10003;</span>
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button variant="secondary" type="submit" fullWidth className="py-3 rounded-lg mt-2" disabled={isLoading}>
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Updating Password…
                            </span>
                        ) : 'Update Password'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
