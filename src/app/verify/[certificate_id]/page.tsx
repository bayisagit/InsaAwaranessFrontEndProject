'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { verifyCertificate } from '@/lib/api';
import type { VerifyCertificateResponse } from '@/lib/api';

export default function VerifyCertificatePage() {
    const params = useParams<{ certificate_id: string }>();
    const certificate_id = params?.certificate_id;

    const [result, setResult] = useState<VerifyCertificateResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (certificate_id) verify();
    }, [certificate_id]);

    const verify = async () => {
        setIsLoading(true);
        const { data } = await verifyCertificate(certificate_id!);
        if (data) {
            setResult(data);
        } else {
            setResult({ valid: false, detail: 'Unable to verify this certificate.' });
        }
        setIsLoading(false);
    };

    const formatDate = (iso?: string) => {
        if (!iso) return '—';
        try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
        catch { return iso; }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Certificate Verification</h1>
                    <p className="text-gray-500 mt-2">INSA Cyber Awareness Platform</p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                            <p className="text-gray-500">Verifying certificate…</p>
                        </div>
                    ) : result?.valid ? (
                        <div>
                            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-4 mb-6">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-green-800 text-sm uppercase tracking-wide">Verified Certificate</p>
                                    <p className="text-green-700 text-xs">This certificate is authentic and issued by INSA.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                                    <span className="text-sm text-gray-500 font-medium">Certificate ID</span>
                                    <span className="text-sm font-mono text-gray-900 text-right max-w-[220px] break-all">{result.certificate_id}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                    <span className="text-sm text-gray-500 font-medium">Issue Date</span>
                                    <span className="text-sm font-semibold text-gray-900">{formatDate(result.issued_at)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                    <span className="text-sm text-gray-500 font-medium">Recipient</span>
                                    <span className="text-sm font-semibold text-gray-900">{result.user}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 font-medium">Course</span>
                                    <span className="text-sm font-semibold text-gray-900 text-right max-w-[250px]">{result.course}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                                <p className="text-xs text-gray-400">This certificate was verified on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Certificate</h2>
                            <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                                {result?.detail || 'This certificate could not be verified. Please check the ID and try again.'}
                            </p>
                            <div className="mt-4 text-xs text-gray-400">
                                Searched for: <code className="font-mono">{certificate_id}</code>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center mt-8">
                    <Link href="/" className="text-sm text-gray-400 hover:text-primary transition-colors">
                        ← Return to INSA Platform
                    </Link>
                </div>
            </div>
        </div>
    );
}
