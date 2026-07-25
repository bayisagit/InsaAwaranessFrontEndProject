'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { loginUser, setTokens } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { checkAuth } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }

        setIsLoading(true);

        const { data, error: apiError, status } = await loginUser(email.trim(), password);

        if (apiError || status !== 200) {
            const errorMsg = apiError || 'Invalid credentials. Please check your email and password.';
            setError(errorMsg);
            toast.error(errorMsg);
            setIsLoading(false);
            return;
        }

        if (data?.access) {
            // Store tokens
            setTokens({ access: data.access, refresh: data.refresh });

            // Re-hydrate user state from /api/auth/me/
            await checkAuth();

            toast.success(`Welcome back, ${data.user.first_name || 'User'}!`);

            // ── must_change_password guard ──────────────────────────────────
            // Backend blocks all endpoints (except bypass ones) until password is changed.
            const mustChange = data.must_change_password || data.user?.must_change_password;
            if (mustChange) {
                router.push('/change-password');
                return;
            }

            // ── next query param (return-to after login) ────────────────────
            const nextParam = new URLSearchParams(window.location.search).get('next');
            if (nextParam) {
                router.push(nextParam);
                return;
            }

            // ── Role-based dashboard redirect ───────────────────────────────
            // Use dashboard_route from backend response when available, otherwise derive from role.
            if (data.dashboard_route) {
                // Normalise legacy backend routes to existing frontend routes
                const routeMap: Record<string, string> = {
                    '/dashboard/super-admin': '/admin',
                    '/dashboard/organization': '/admin',
                    '/dashboard/course-provider': '/admin',
                    '/dashboard/member': '/dashboard',
                    '/dashboard/public': '/dashboard',
                };
                const mapped = routeMap[data.dashboard_route] ?? data.dashboard_route;
                router.push(mapped);
            } else {
                // Fallback: derive from role
                const role = data.user?.role;
                if (role === 'super_admin' || role === 'org_admin' || role === 'course_provider') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
            }
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                {/* Brand mark */}
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back 👋</h1>
                <p className="text-sm font-medium text-gray-600 mb-8 max-w-xs mx-auto">
                    Secure Access To The National Cyber Resilience Portal
                </p>

                <form className="space-y-5 text-left" onSubmit={handleSubmit} method="POST">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
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

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        showPasswordToggle
                        disabled={isLoading}
                        autoComplete="current-password"
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        }
                    />

                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                            Forgot Password?
                        </Link>
                    </div>

                    <Button variant="primary" type="submit" fullWidth className="py-3 rounded-lg" loading={isLoading}>
                        Sign in
                    </Button>
                </form>

                <p className="mt-8 text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-semibold text-primary hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
