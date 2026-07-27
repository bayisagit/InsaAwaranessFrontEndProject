'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createOrgApplication } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { toast } from 'react-hot-toast';

interface FieldErrors {
    name?: string;
    description?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    website?: string;
    non_field?: string;
}

type PageState = 'form' | 'submitted';

export default function ApplyPage() {
    const [pageState, setPageState] = useState<PageState>('form');
    const [submittedName, setSubmittedName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const [form, setForm] = useState({
        name: '',
        description: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        website: '',
    });

    const handleChange = (field: keyof typeof form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        // Clear field error on change
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        setIsLoading(true);

        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            contact_email: form.contact_email.trim(),
            contact_phone: form.contact_phone.trim(),
            address: form.address.trim(),
            ...(form.website.trim() ? { website: form.website.trim() } : {}),
        };

        const { error: apiError, status, data } = await createOrgApplication(payload);

        setIsLoading(false);

        if (status === 201) {
            setSubmittedName(form.name);
            setPageState('submitted');
            return;
        }

        // Parse 400 field-level errors from DRF
        if (status === 400 && data && typeof data === 'object') {
            const errors: FieldErrors = {};
            for (const [key, val] of Object.entries(data as Record<string, any>)) {
                const msg = Array.isArray(val) ? val[0] : String(val);
                if (key === 'non_field_errors' || key === 'detail') {
                    errors.non_field = msg;
                } else {
                    (errors as any)[key] = msg;
                }
            }
            setFieldErrors(errors);
        } else {
            setFieldErrors({ non_field: apiError || 'Submission failed. Please try again.' });
        }
        toast.error('Please fix the errors below.');
    };

    // ── Submitted / confirmation state ──────────────────────────────────────
    if (pageState === 'submitted') {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-muted">
                <div className="w-full max-w-lg bg-card p-10 rounded-2xl shadow-sm shadow-black/5 dark:shadow-none border border-border text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-3">Application Submitted!</h1>
                    <p className="text-muted-foreground text-sm mb-2">
                        Thank you for applying on behalf of <strong>{submittedName}</strong>.
                    </p>
                    <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                        Your application is now <strong className="text-yellow-700">under review</strong>. Our team will contact you at the email you provided once a decision has been made.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => {
                                setForm({ name: '', description: '', contact_email: '', contact_phone: '', address: '', website: '' });
                                setPageState('form');
                            }}
                        >
                            Submit Another
                        </Button>
                        <Link href="/">
                            <Button variant="secondary" type="button">Return to Home</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Application Form ─────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-muted py-16 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Page header */}
                <div className="text-center mb-10">
                    <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-semibold tracking-wider mb-4">
                        OFFICIAL REGISTRATION
                    </span>
                    <h1 className="text-4xl font-extrabold text-foreground mb-3">
                        Apply for Organization Access
                    </h1>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Submit your organization&apos;s details to join the INSA Cyber Awareness Platform. Our team will review your application within 3–5 business days.
                    </p>
                </div>

                <div className="bg-card rounded-2xl shadow-sm shadow-black/5 dark:shadow-none border border-border p-8 md:p-10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {fieldErrors.non_field && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {fieldErrors.non_field}
                            </div>
                        )}

                        {/* Section: Organization Info */}
                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Organization Information</h2>
                            <div className="space-y-4">
                                <Input
                                    label="Organization Name"
                                    placeholder="e.g., Ministry of Communications"
                                    value={form.name}
                                    onChange={handleChange('name')}
                                    required
                                    disabled={isLoading}
                                    error={fieldErrors.name}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Description <span className="text-primary ml-1">*</span>
                                    </label>
                                    <textarea
                                        className={`block w-full rounded-lg border py-2.5 px-3 text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card resize-none min-h-[100px] ${fieldErrors.description ? 'border-primary' : 'border-border focus:border-primary'}`}
                                        placeholder="Describe your organization's activities and why you need access to this platform…"
                                        value={form.description}
                                        onChange={handleChange('description')}
                                        required
                                        disabled={isLoading}
                                    />
                                    {fieldErrors.description && <p className="mt-1 text-sm text-primary">{fieldErrors.description}</p>}
                                </div>
                                <Input
                                    label="Physical Address"
                                    placeholder="e.g., Bole Sub-city, Addis Ababa, Ethiopia"
                                    value={form.address}
                                    onChange={handleChange('address')}
                                    required
                                    disabled={isLoading}
                                    error={fieldErrors.address}
                                />
                                <Input
                                    label="Website"
                                    type="url"
                                    placeholder="https://example.gov.et (optional)"
                                    value={form.website}
                                    onChange={handleChange('website')}
                                    disabled={isLoading}
                                    error={fieldErrors.website}
                                />
                            </div>
                        </div>

                        <div className="border-t border-border pt-5">
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Contact Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Contact Email"
                                    type="email"
                                    placeholder="contact@organization.et"
                                    value={form.contact_email}
                                    onChange={handleChange('contact_email')}
                                    required
                                    disabled={isLoading}
                                    error={fieldErrors.contact_email}
                                />
                                <Input
                                    label="Contact Phone"
                                    type="tel"
                                    placeholder="+251 91 234 5678"
                                    value={form.contact_phone}
                                    onChange={handleChange('contact_phone')}
                                    required
                                    disabled={isLoading}
                                    error={fieldErrors.contact_phone}
                                />
                            </div>
                        </div>

                        {/* Info box */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex gap-3">
                            <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-semibold mb-1">What happens next?</p>
                                <p>Your submission goes to <strong>Pending</strong> status. INSA administrators will review it and contact you at the email provided. Upon approval, an organization admin account will be created for you.</p>
                            </div>
                        </div>

                        <Button type="submit" variant="secondary" fullWidth className="py-3 mt-2 rounded-xl" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Submitting Application…
                                </span>
                            ) : 'Submit Application'}
                        </Button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
