'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/Button';
import { toast } from 'react-hot-toast';

export default function CoursePaymentPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [isInitializing, setIsInitializing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isLoading && isAuthenticated && user?.role !== 'org_admin') {
            router.push('/dashboard');
        } else if (!isLoading && isAuthenticated && user?.role === 'org_admin') {
            fetchCourseDetails();
        }
    }, [isLoading, isAuthenticated, user]);

    const fetchCourseDetails = async () => {
        setIsFetching(true);
        const { data, error: err } = await apiFetch(`/api/v1/courses/${courseId}/`);
        if (err) {
            setError(err);
        } else {
            setCourse(data);
        }
        setIsFetching(false);
    };

    const handleInitializePayment = async () => {
        setIsInitializing(true);
        const returnUrl = `${window.location.origin}/payment/verify`;
        
        const { data, error: err } = await apiFetch('/api/v1/payments/initialize/', {
            method: 'POST',
            body: JSON.stringify({
                course_id: courseId,
                return_url: returnUrl
            })
        });

        if (err) {
            toast.error(err);
            setError(err);
            setIsInitializing(false);
        } else if (data?.checkout_url) {
            window.location.href = data.checkout_url;
        } else {
            toast.error('Failed to initialize payment.');
            setIsInitializing(false);
        }
    };

    if (isLoading || isFetching) {
        return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Course</h1>
                <p className="text-muted-foreground">{error}</p>
                <Button className="mt-6" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="min-h-screen bg-muted py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="max-w-xl w-full bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
                <div className="bg-primary p-6 text-white text-center">
                    <h2 className="text-2xl font-bold">Unlock Course Access</h2>
                    <p className="opacity-90 mt-2 text-sm">Organization-wide License</p>
                </div>
                
                <div className="p-8 space-y-6 flex-1">
                    <div className="text-center">
                        {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className="w-24 h-24 mx-auto rounded-xl object-cover mb-4 border border-border shadow-sm" />
                        ) : (
                            <div className="w-24 h-24 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        )}
                        <h3 className="text-xl font-extrabold text-foreground">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{course.description}</p>
                    </div>

                    <div className="bg-muted rounded-xl p-5 border border-border">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-muted-foreground font-semibold">Payment Type</span>
                            <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">One-Time</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-muted-foreground font-semibold">Access Level</span>
                            <span className="text-sm font-bold text-foreground">All Org Members</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-border mt-3">
                            <span className="text-base font-bold text-foreground">Total Amount</span>
                            <span className="text-xl font-extrabold text-primary">{course.currency || 'ETB'} {course.course_price}</span>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            variant="primary"
                            className="w-full py-4 text-lg"
                            onClick={handleInitializePayment}
                            disabled={isInitializing}
                        >
                            {isInitializing ? 'Connecting to Chapa...' : `Pay ${course.currency || 'ETB'} ${course.course_price}`}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            You will be redirected to Chapa to securely complete your payment.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
