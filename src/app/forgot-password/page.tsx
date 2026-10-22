'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { OtpInput } from '@/components/OtpInput';
import { AuthStepper } from '@/components/AuthStepper';
import {
    requestPasswordReset,
    verifyPasswordResetCode,
    confirmPasswordReset,
} from '@/lib/api';
import { Turnstile } from '@marsidev/react-turnstile';

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

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Steps: 1 = Email, 2 = Code, 3 = Password, 4 = Success
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);

    const passStrength = getPasswordScore(password);

    // Support query params if user clicked direct email link (?email=...&code=...&step=3)
    useEffect(() => {
        const queryEmail = searchParams.get('email');
        const queryCode = searchParams.get('code');
        const queryStep = searchParams.get('step');

        if (queryEmail) setEmail(queryEmail);
        if (queryCode) setOtpCode(queryCode);
        if (queryEmail && queryCode && queryStep === '3') {
            setStep(3);
        }
    }, [searchParams]);

    // Resend countdown timer for Step 2
    useEffect(() => {
        if (step !== 2 || countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [step, countdown]);

    // ── Step 1: Submit Email to send OTP ────────────────────────────────────
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }

        setIsLoading(true);
        const { error: apiError } = await requestPasswordReset(email.trim(), captchaToken);
        setIsLoading(false);

        if (apiError) {
            setError(apiError);
            toast.error(apiError);
            return;
        }

        toast.success('A 6-digit verification code has been sent to your email.');
        setCountdown(60);
        setStep(2);
    };

    // ── Step 2: Verify 6-Digit Security Code ────────────────────────────────
    const handleVerifyCode = async (codeToVerify?: string) => {
        const code = (codeToVerify || otpCode).trim();
        setError('');

        if (code.length !== 6) {
            setError('Please enter all 6 digits of the verification code.');
            return;
        }

        setIsLoading(true);
        const { error: apiError } = await verifyPasswordResetCode(email.trim(), code);
        setIsLoading(false);

        if (apiError) {
            setError(apiError);
            toast.error(apiError);
            return;
        }

        toast.success('Security code verified.');
        setStep(3);
    };

    // ── Resend Code in Step 2 ───────────────────────────────────────────────
    const handleResendCode = async () => {
        setIsLoading(true);
        const { error: apiError } = await requestPasswordReset(email.trim());
        setIsLoading(false);

        if (apiError) {
            toast.error(apiError);
        } else {
            toast.success('A new 6-digit code has been sent to your email.');
            setCountdown(60);
            setOtpCode('');
            setError('');
        }
    };

    // ── Step 3: Set New Password ───────────────────────────────────────────
    const handleResetPassword = async (e: React.FormEvent) => {
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
        const { error: apiError } = await confirmPasswordReset(email.trim(), otpCode.trim(), password);
        setIsLoading(false);

        if (apiError) {
            setError(apiError);
            toast.error(apiError);
            return;
        }

        toast.success('Password reset successfully!');
        setStep(4);
    };

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 bg-muted">
            <div className="w-full max-w-md bg-card p-8 md:p-10 rounded-3xl shadow-sm border border-border text-center">
                
                {/* ══════════════════════════════════════════════════════════
                    STEP 1: ENTER EMAIL (Matching Screenshot 1)
                   ══════════════════════════════════════════════════════════ */}
                {step === 1 && (
                    <>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
                            Reset your password
                        </h1>
                        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                            Enter your email and we&apos;ll send you a 6-digit verification code.
                        </p>

                        <AuthStepper currentStep={1} />

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 mb-5 flex items-start gap-2 text-left">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSendCode} className="space-y-5 text-left">
                            <div className="relative">
                                <label className="text-xs font-semibold text-foreground block mb-1.5">
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        autoComplete="email"
                                        className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-border bg-card text-foreground font-medium text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all shadow-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center mt-3 mb-1">
                                <Turnstile
                                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                                    onSuccess={(token) => setCaptchaToken(token)}
                                    onExpire={() => setCaptchaToken('')}
                                    options={{ theme: 'auto' }}
                                />
                            </div>

                            <Button
                                variant="secondary"
                                type="submit"
                                fullWidth
                                className="py-3.5 rounded-xl font-bold cursor-pointer"
                                disabled={isLoading || !email.trim()}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Sending Reset Code...
                                    </span>
                                ) : (
                                    'Send Reset Code \u2192'
                                )}
                            </Button>
                        </form>

                        <div className="mt-7 text-center">
                            <Link href="/login" className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
                                &larr; Back to sign in
                            </Link>
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════
                    STEP 2: ENTER SECURITY CODE (Matching Screenshot 2)
                   ══════════════════════════════════════════════════════════ */}
                {step === 2 && (
                    <>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
                            Enter security code
                        </h1>
                        <p className="text-sm text-muted-foreground mb-2">
                            We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
                        </p>

                        <AuthStepper currentStep={2} />

                        {/* Green Alert Banner (Screenshot 2) */}
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-2xl text-xs sm:text-sm border border-emerald-200 dark:border-emerald-800 mb-6 flex items-center gap-2.5 text-left">
                            <div className="w-5 h-5 rounded-full border-2 border-emerald-600 dark:border-emerald-400 flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="font-medium">A 6-digit verification code has been sent to your email.</span>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 mb-5 flex items-start gap-2 text-left">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="text-left mb-2">
                            <label className="text-xs font-semibold text-muted-foreground block text-center mb-1">
                                6-Digit Verification Code
                            </label>
                            <OtpInput
                                value={otpCode}
                                onChange={setOtpCode}
                                onComplete={(code) => handleVerifyCode(code)}
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            variant="secondary"
                            fullWidth
                            className="py-3.5 rounded-xl font-bold mt-4 cursor-pointer"
                            disabled={otpCode.length !== 6 || isLoading}
                            onClick={() => handleVerifyCode(otpCode)}
                        >
                            {isLoading ? (
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

                        {/* Footer row (Screenshot 2: Change email & Countdown) */}
                        <div className="flex items-center justify-between text-xs sm:text-sm pt-5 mt-4 border-t border-border">
                            <button
                                type="button"
                                onClick={() => { setStep(1); setOtpCode(''); setError(''); }}
                                className="text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                &larr; Change email
                            </button>

                            {countdown > 0 ? (
                                <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    Resend in {countdown}s
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={isLoading}
                                    className="text-primary font-bold hover:underline cursor-pointer"
                                >
                                    Resend code
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════
                    STEP 3: CREATE NEW PASSWORD
                   ══════════════════════════════════════════════════════════ */}
                {step === 3 && (
                    <>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
                            Create new password
                        </h1>
                        <p className="text-sm text-muted-foreground mb-2">
                            Choose a strong password for <strong className="text-foreground">{email}</strong>
                        </p>

                        <AuthStepper currentStep={3} />

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 mb-5 flex items-start gap-2 text-left">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="space-y-4 text-left">
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
                                        <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                            <div className={`h-full ${passStrength.color} ${passStrength.w} transition-all duration-300`}></div>
                                        </div>
                                        <span className={`text-[10px] font-bold ${passStrength.color.replace('bg-', 'text-')}`}>{passStrength.label}</span>
                                    </div>
                                )}
                            </div>

                            <Input
                                label="Confirm New Password"
                                type="password"
                                placeholder="Re-enter your new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                showPasswordToggle
                                autoComplete="new-password"
                            />

                            <div className="bg-muted border border-border p-3.5 rounded-2xl">
                                <div className="grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground">
                                    {[
                                        { test: password.length >= 8, label: '8+ characters' },
                                        { test: /[A-Z]/.test(password), label: '1 uppercase' },
                                        { test: /[0-9]/.test(password), label: '1 number' },
                                        { test: /[^A-Za-z0-9]/.test(password), label: '1 special char' },
                                    ].map(({ test, label }) => (
                                        <div key={label} className={`flex items-center gap-1.5 ${test ? 'text-emerald-600 font-semibold' : ''}`}>
                                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${test ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-transparent'}`}>&#10003;</span>
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                type="submit"
                                fullWidth
                                className="py-3.5 rounded-xl font-bold cursor-pointer"
                                disabled={isLoading || !password || password !== confirmPassword}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Saving New Password...
                                    </span>
                                ) : (
                                    'Reset Password \u2192'
                                )}
                            </Button>
                        </form>
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════
                    STEP 4: SUCCESS
                   ══════════════════════════════════════════════════════════ */}
                {step === 4 && (
                    <div className="space-y-6 py-4">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-2xl font-extrabold text-foreground mb-2">
                                Password Reset Successful!
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                You can now sign in to your INSA Cyber Security account with your new password.
                            </p>
                        </div>

                        <Button
                            variant="secondary"
                            fullWidth
                            className="py-3.5 rounded-xl font-bold cursor-pointer"
                            onClick={() => router.push('/login')}
                        >
                            Sign In Now &rarr;
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    );
}
