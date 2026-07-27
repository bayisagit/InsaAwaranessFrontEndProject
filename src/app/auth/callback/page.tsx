'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithGitHub, setTokens, getTokens } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

function CallbackContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { checkAuth } = useAuth();
 const [status, setStatus] = useState<'processing' | 'error'>('processing');
 const [errorMsg, setErrorMsg] = useState('');

 useEffect(() => {
 const code = searchParams.get('code');
 const errorParam = searchParams.get('error');
 const provider = searchParams.get('provider') || 'github';

 if (errorParam) {
 setStatus('error');
 setErrorMsg('Authorization was denied.');
 return;
 }

 if (!code) {
 setStatus('error');
 setErrorMsg('No authorization code received.');
 return;
 }

 const existingTokens = getTokens();
 if (existingTokens?.access) {
 router.push('/dashboard');
 return;
 }

 (async () => {
 try {
 const { data, error: apiError } = await loginWithGitHub(code);
 if (apiError || !data) {
 setStatus('error');
 setErrorMsg(apiError || `${provider} sign-in failed.`);
 toast.error(apiError || `${provider} sign-in failed.`);
 return;
 }

 setTokens({ access: data.access, refresh: data.refresh });
 await checkAuth();

 toast.success(`Welcome, ${data.user.first_name || 'User'}!`);

 const mustChange = data.must_change_password || data.user?.must_change_password;
 if (mustChange) {
 router.push('/change-password');
 return;
 }

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
 } catch {
 setStatus('error');
 setErrorMsg('An unexpected error occurred during sign-in.');
 toast.error('An unexpected error occurred during sign-in.');
 }
 })();
 }, [searchParams, router, checkAuth]);

 if (status === 'error') {
 return (
 <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-muted">
 <div className="w-full max-w-md bg-card p-8 md:p-10 rounded-2xl shadow-sm shadow-black/5 dark:shadow-none border border-border text-center">
 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 </div>
 <h2 className="text-2xl font-bold text-foreground mb-3">Sign-in Failed</h2>
 <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
 <button
 onClick={() => router.push('/login')}
 className="text-sm font-semibold text-primary hover:underline cursor-pointer"
 >
 Back to Login
 </button>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-muted">
 <div className="w-full max-w-md bg-card p-8 md:p-10 rounded-2xl shadow-sm shadow-black/5 dark:shadow-none border border-border text-center">
 <div className="flex justify-center mb-6">
 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
 <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
 </svg>
 </div>
 </div>
 <h2 className="text-2xl font-bold text-foreground mb-3">Completing Sign-in</h2>
 <p className="text-sm text-muted-foreground">Please wait while we securely connect your account...</p>
 </div>
 </div>
 );
}

export default function AuthCallbackPage() {
 return (
 <Suspense fallback={
 <div className="min-h-[80vh] flex items-center justify-center bg-muted">
 <div aria-label="Loading" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
 </div>
 }>
 <CallbackContent />
 </Suspense>
 );
}
