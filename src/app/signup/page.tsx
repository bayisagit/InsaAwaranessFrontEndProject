'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { registerUser, loginWithGoogle, setTokens, resendVerificationEmail } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'am', label: 'Amharic (አማርኛ)' },
    { value: 'om', label: 'Afaan Oromo' },
    { value: 'ti', label: 'Tigrinya (ትግርኛ)' },
    { value: 'so', label: 'Somali (Soomaali)' },
];

interface FieldErrors {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    preferred_language?: string;
    non_field?: string;
}

function parseFieldErrors(apiError: string | undefined, status: number): FieldErrors {
    if (!apiError) return {};
    // apiFetch already flattens DRF errors into a comma-joined string;
    // for signup we also want per-field display, so we keep the string as non_field.
    return { non_field: apiError };
}

const getPasswordScore = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200', w: 'w-0' };
    if (pass.length > 0 && pass.length < 8) return { score: 1, label: 'Weak', color: 'bg-red-500', w: 'w-1/4' };
    let score = 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (pass.length > 12) score++;
    if (score < 2) return { score, label: 'Weak', color: 'bg-red-400', w: 'w-1/4' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-yellow-400', w: 'w-2/4' };
    if (score === 3) return { score, label: 'Good', color: 'bg-blue-500', w: 'w-3/4' };
    return { score, label: 'Strong', color: 'bg-green-500', w: 'w-full' };
};

export default function SignupPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [preferredLanguage, setPreferredLanguage] = useState('en');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);
    const router = useRouter();
    const { checkAuth } = useAuth();

    const handleSocialLogin = (data: { access: string; refresh: string; user: { role: string; first_name?: string; must_change_password?: boolean }; dashboard_route?: string; must_change_password?: boolean }) => {
        setTokens({ access: data.access, refresh: data.refresh });
        checkAuth().then(() => {
            const mustChange = data.must_change_password || data.user?.must_change_password;
            if (mustChange) { router.push('/change-password'); return; }
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
    };

    const handleGoogleSuccess = useCallback(async (credentialResponse: CredentialResponse) => {
        setSocialLoading('google');
        const { data, error: apiError } = await loginWithGoogle(credentialResponse.credential || '');
        if (apiError || !data) {
            toast.error(apiError || 'Google sign-in failed.');
            setSocialLoading(null);
            return;
        }
        toast.success(`Welcome, ${data.user.first_name || 'User'}!`);
        handleSocialLogin(data);
        setSocialLoading(null);
    }, [router, checkAuth]);

    const handleGoogleError = useCallback(() => {
        toast.error('Google sign-in was cancelled or failed.');
    }, []);

    const handleGitHubSignup = useCallback(() => {
        setSocialLoading('github');
        const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
        const redirectUri = `${window.location.origin}/auth/callback?provider=github`;
        const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email,read:user`;
        window.location.href = githubUrl;
    }, []);

    const passStrength = getPasswordScore(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        if (password.length < 8) {
            setFieldErrors({ password: 'Password must be at least 8 characters long.' });
            return;
        }
        if (password !== confirmPassword) {
            setFieldErrors({ password: 'Passwords do not match.' });
            return;
        }
        if (!acceptedTerms) {
            toast.error('You must accept the terms of service.');
            return;
        }

        setIsLoading(true);

        const { error: apiError, status } = await registerUser({
            email: email.trim(),
            password,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            preferred_language: preferredLanguage,
        });

        if (status !== 201) {
            const errors = parseFieldErrors(apiError, status);
            setFieldErrors(errors);
            toast.error(errors.non_field || 'Registration failed. Please check your details.');
            setIsLoading(false);
            return;
        }

        setRegisteredEmail(email.trim());
        toast.success('Account created! Check your email to verify.');
    };

    const handleResend = async () => {
        setIsResending(true);
        const { error: e } = await resendVerificationEmail(registeredEmail);
        if (e) toast.error(e);
        else toast.success('Verification email resent.');
        setIsResending(false);
    };

    if (registeredEmail) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Verify Your Email</h1>
                    <p className="text-sm text-gray-600 mb-2">
                        We&apos;ve sent a verification email to:
                    </p>
                    <p className="text-sm font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg mb-6 border border-gray-100">
                        {registeredEmail}
                    </p>
                    <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                        Click the link in the email to activate your account. Your account will remain inactive until you verify.
                    </p>
                    <button
                        onClick={handleResend}
                        disabled={isResending}
                        className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                        {isResending ? 'Resending...' : 'Resend verification email'}
                    </button>
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                            Already verified?{' '}
                            <Link href="/login" className="font-semibold text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-white">
            <div className="hidden lg:flex w-1/2 bg-secondary flex-col justify-center px-16 relative lg:sticky lg:top-0 h-screen">
                <div className="max-w-md mx-auto z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-semibold tracking-wider mb-6">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        SECURE REGISTRATION
                    </span>
                    <h1 className="text-4xl font-bold text-blue-400 leading-tight mb-2">
                        Forging a Safer <br />
                        <span className="text-primary">Digital Frontier.</span>
                    </h1>
                    <p className="text-gray-400 mt-4 leading-relaxed max-w-sm mb-12">
                        Join the national initiative. Equip yourself and your organization with the tools to defend against cyber threats in an evolving digital landscape.
                    </p>
                    <div className="space-y-4">
                        <div className="bg-secondary-hover border border-gray-800 p-5 rounded-2xl flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-white font-medium">National Defense</h4>
                                <p className="text-sm text-gray-500 mt-1">Contribute to the collective cyber resilience of our critical infrastructure.</p>
                            </div>
                        </div>
                        <div className="bg-secondary-hover border border-gray-800 p-5 rounded-2xl flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-white font-medium">Verified Alerts</h4>
                                <p className="text-sm text-gray-500 mt-1">Receive official warnings about phishing campaigns and ransomware.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white py-12 overflow-y-auto">
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
                    <p className="text-gray-500 text-sm mb-8">Enter your details to access the secure portal.</p>

                    {/* Social Signup Buttons */}
                    <div className="space-y-3 mb-6">
                        <div className="relative">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="outline"
                                size="large"
                                shape="rectangular"
                                width="100%"
                                text="signup_with"
                            />
                        </div>
                        <Button
                            variant="social"
                            fullWidth
                            className="py-3 rounded-lg"
                            onClick={handleGitHubSignup}
                            loading={socialLoading === 'github'}
                            iconLeft={
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                            }
                        >
                            Sign up with GitHub
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-xs text-gray-400 font-medium">OR</span>
                        </div>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit} method="POST">
                        {fieldErrors.non_field && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {fieldErrors.non_field}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="First Name" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} autoComplete="given-name" />
                            <Input label="Last Name" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} autoComplete="family-name" />
                        </div>
                        <Input label="Email Address" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} error={fieldErrors.email} autoComplete="email" />
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
                            <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} disabled={isLoading} className="block w-full rounded-md border border-gray-300 py-2.5 px-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white disabled:bg-gray-50 disabled:text-gray-500">
                                {LANGUAGE_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Input label="Password" name="password" type="password" placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required showPasswordToggle error={fieldErrors.password} autoComplete="new-password" />
                                {password && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${passStrength.color} ${passStrength.w} transition-all duration-300`}></div>
                                        </div>
                                        <span className={`text-[10px] font-bold ${passStrength.color.replace('bg-', 'text-')}`}>{passStrength.label}</span>
                                    </div>
                                )}
                            </div>
                            <Input label="Confirm Password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required showPasswordToggle disabled={isLoading} autoComplete="new-password" />
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                            <h5 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Password requirements:
                            </h5>
                            <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500">
                                {[
                                    { test: password.length >= 8, label: '8+ characters' },
                                    { test: /[A-Z]/.test(password), label: '1 uppercase letter' },
                                    { test: /[0-9]/.test(password), label: '1 number' },
                                    { test: /[^A-Za-z0-9]/.test(password), label: '1 special char' },
                                ].map(({ test, label }) => (
                                    <div key={label} className={`flex items-center gap-2 ${test ? 'text-green-600 font-medium' : ''}`}>
                                        {test ? (
                                            <svg className="w-3.5 h-3.5 bg-green-500 text-white rounded-full p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <span className="w-3.5 h-3.5 rounded-full bg-gray-300" />
                                        )}
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-start gap-3 mt-6">
                            <div className="flex items-center h-5">
                                <input id="terms" type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} required disabled={isLoading} className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2" />
                            </div>
                            <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
                                I affirm that the information is accurate and agree to the{' '}
                                <Link href="/about" className="font-semibold text-primary hover:underline">Terms of Service</Link>.
                            </label>
                        </div>
                        <Button type="submit" fullWidth className="mt-6" loading={isLoading}>
                            Create Account
                        </Button>
                    </form>
                    <p className="mt-8 text-center text-sm text-gray-600">
                        Already have a CyberSafe ID?{' '}
                        <Link href="/login" className="font-semibold text-primary hover:underline">Sign in securely</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
