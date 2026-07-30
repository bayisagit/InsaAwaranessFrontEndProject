'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { loginUser, loginWithGoogle, setTokens } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { useTranslations } from 'next-intl';

function handlePostLogin(data: { access: string; refresh: string; user: { role: string; first_name?: string; must_change_password?: boolean }; dashboard_route?: string; must_change_password?: boolean }, router: ReturnType<typeof useRouter>, checkAuth: () => Promise<any>) {
    setTokens({ access: data.access, refresh: data.refresh });
    checkAuth().then(() => {
        const mustChange = data.must_change_password || data.user?.must_change_password;
        if (mustChange) { router.push('/change-password'); return; }
        const nextParam = new URLSearchParams(window.location.search).get('next');
        if (nextParam) { router.push(nextParam); return; }
        if (data.dashboard_route) {
            const routeMap: Record<string, string> = {
                '/dashboard/super-admin': '/admin',
                '/dashboard/organization': '/admin',
                '/dashboard/course-provider': '/admin',
                '/dashboard/member': '/dashboard',
                '/dashboard/public': '/dashboard',
            };
            router.push(routeMap[data.dashboard_route] ?? data.dashboard_route);
        } else {
            const role = data.user?.role;
            router.push(role === 'super_admin' || role === 'org_admin' || role === 'course_provider' ? '/admin' : '/dashboard');
        }
    });
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);
    const router = useRouter();
    const { checkAuth } = useAuth();
    const t = useTranslations('auth');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) { setError('Please enter your email address.'); return; }
        if (!password) { setError('Please enter your password.'); return; }
        setIsLoading(true);
        const { data, error: apiError, status } = await loginUser(email.trim(), password);
        if (apiError || status !== 200) {
            const errorMsg = apiError || 'Invalid credentials.';
            setError(errorMsg);
            toast.error(errorMsg);
            setIsLoading(false);
            return;
        }
        if (data?.access) {
            toast.success(`Welcome back, ${data.user.first_name || 'User'}!`);
            handlePostLogin(data, router, checkAuth);
        }
        setIsLoading(false);
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (credentialResponse) => {
            setSocialLoading('google');
            setError('');
            const { data, error: apiError } = await loginWithGoogle(credentialResponse.access_token);
            if (apiError || !data) {
                setError(apiError || 'Google sign-in failed.');
                toast.error(apiError || 'Google sign-in failed.');
                setSocialLoading(null);
                return;
            }
            toast.success(`Welcome, ${data.user.first_name || 'User'}!`);
            handlePostLogin(data, router, checkAuth);
            setSocialLoading(null);
        },
        onError: () => {
            setError('Google sign-in failed.');
            toast.error('Google sign-in failed.');
            setSocialLoading(null);
        },
        flow: 'implicit',
    });

    const handleGitHubLogin = useCallback(() => {
        setSocialLoading('github');
        const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
        const redirectUri = `${window.location.origin}/auth/callback?provider=github`;
        const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email,read:user`;
        window.location.href = githubUrl;
    }, []);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-muted">
            <div className="w-full max-w-md bg-card p-8 md:p-10 rounded-2xl shadow-sm shadow-black/5 dark:shadow-none border border-border text-center">
                <div className="flex justify-center mb-6">
                    <Image priority src="/loginlogo.png" alt="Login Logo" width={80} height={80} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
                </div>

                <h1 className="text-3xl font-bold text-foreground mb-2">{t('welcomeBack')}</h1>
                <p className="text-sm font-medium text-muted-foreground mb-8 max-w-xs mx-auto">
                    {t('securePortal')}
                </p>

                {/* Social Login Buttons */}
                <div className="space-y-3 mb-6">
                    <Button
                        variant="social"
                        fullWidth
                        className="py-3 rounded-xl"
                        onClick={() => googleLogin()}
                        loading={socialLoading === 'google'}
                        iconLeft={
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                        }
                    >
                        {t('continueWithGoogle')}
                    </Button>
                    <Button
                        variant="social"
                        fullWidth
                        className="py-3 rounded-xl"
                        onClick={handleGitHubLogin}
                        loading={socialLoading === 'github'}
                        iconLeft={
                            <svg className="w-5 h-5 cursor-pointer transition-colors duration-200" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                        }
                    >
                        {t('continueWithGitHub')}
                    </Button>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-card px-3 text-xs text-muted-foreground font-medium">{t('or')}</span>
                    </div>
                </div>

                <form className="space-y-5 text-left" onSubmit={handleSubmit} method="POST">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <Input
                        label={t('emailAddress')}
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="email"
                    />

                    <Input
                        label={t('password')}
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
                            {t('forgotPassword')}
                        </Link>
                    </div>

                    <Button variant="primary" type="submit" fullWidth className="py-3 rounded-xl" loading={isLoading}>
                        {t('signIn')}
                    </Button>
                </form>

                <p className="mt-8 text-sm text-muted-foreground">
                    {t('dontHaveAccount')}{' '}
                    <Link href="/signup" className="font-semibold text-primary hover:underline">
                        {t('signUp')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
