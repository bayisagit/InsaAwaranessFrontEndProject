'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CloudinaryUpload } from '@/components/CloudinaryUpload';
import { getBackgroundProfile, updateBackgroundProfile, changePassword, clearTokens, BackgroundProfile, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';


const SELECT_CLS = "block w-full rounded-lg border border-border py-2.5 pl-3 pr-10 truncate text-sm text-foreground shadow-sm shadow-black/5 dark:shadow-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-card";

function SelectField({ label, name, value, onChange, options, required }: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    required?: boolean;
}) {
    return (
        <div className="w-full">
            <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center">
                {label}
                {required && <span className="text-primary ml-1">*</span>}
            </label>
            <select name={name} value={value} onChange={onChange} className={SELECT_CLS} required={required}>
                <option value="">Select {label}...</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

const Card = ({ children, title, subtitle, icon }: { children: React.ReactNode, title: string, subtitle?: string, icon?: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-xl shadow-gray-100/50 dark:shadow-none rounded-3xl overflow-hidden border border-border mb-8"
    >
        <div className="px-8 py-6 border-b border-gray-50 dark:border-border bg-gradient-to-r from-gray-50/80 to-white dark:from-card dark:to-card flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    {icon && <span className="text-primary">{icon}</span>}
                    {title}
                </h2>
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
        </div>
        <div className="p-8">
            {children}
        </div>
    </motion.div>
);

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 pb-2 border-b border-border">{title}</h3>
);

interface ProfileData extends Partial<BackgroundProfile> {}


export default function ProfilePage() {
    const { user, setUser, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [profileData, setProfileData] = useState<ProfileData>({});
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [learningStats, setLearningStats] = useState({ enrolled: 0, completed: 0, averageProgress: 0 });

    const fetchProfile = useCallback(async () => {
        setIsLoadingProfile(true);
        const { data, status } = await getBackgroundProfile();
        if (status === 200 && data) {
            setProfileData(data);
        } else {
            // Backend auto-creates a blank profile on first GET — just keep empty state
            setProfileData({
                phone_number: '', nationality: '', region: '', age_range: '',
                gender: '', education_level: '', field_of_study: '', institution_name: '',
                employment_status: '', employer_name: '', unemployment_description: '',
                professional_experience: '', enrollment_motivation: '', referral_source: '',
                is_information_confirmed: true, profile_photo: ''
            });
        }
        setIsLoadingProfile(false);
    }, []);


    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated) {
            fetchProfile();
            
            // Fetch real learning stats for learners
            const isAdmin = user && (user.role === 'super_admin' || user.role === 'org_admin' || user.role === 'course_provider');
            if (user && !isAdmin) {
                apiFetch('/api/v1/enrollments/?page_size=100').then(res => {
                    const data = res.data?.results || (Array.isArray(res.data) ? res.data : []);
                    const enrolled = data.length;
                    const completed = data.filter((e: any) => e.progress === 100).length;
                    const averageProgress = enrolled > 0 ? Math.round(data.reduce((acc: number, curr: any) => acc + curr.progress, 0) / enrolled) : 0;
                    setLearningStats({ enrolled, completed, averageProgress });
                });
            }
        }
    }, [isAuthenticated, authLoading, router, fetchProfile, user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
        setProfileData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError(''); setProfileSuccess(''); setIsSavingProfile(true);
        // Always use PATCH — the backend auto-creates the profile on first GET,
        // so there is never a need for POST.
        const { error, status } = await updateBackgroundProfile(profileData as Partial<BackgroundProfile>);
        if (error || (status !== 200 && status !== 201)) {
            setProfileError(error || 'Failed to update profile.');
            toast.error(error || 'Failed to update profile.');
        } else {
            setProfileSuccess('Profile updated successfully.');
            toast.success('Profile updated successfully.');
            setTimeout(() => setProfileSuccess(''), 5000);
            await fetchProfile();
        }
        setIsSavingProfile(false);
    };


    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(''); setPasswordSuccess(''); setIsSavingPassword(true);

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            setIsSavingPassword(false);
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters.');
            setIsSavingPassword(false);
            return;
        }

        const { error, status } = await changePassword(oldPassword, newPassword);
        if (error || status !== 200) {
            const msg = error || 'Failed to change password. Make sure your current password is correct.';
            setPasswordError(msg);
            toast.error(msg);
        } else {
            toast.success('Password changed. Please sign in again.');
            setPasswordSuccess('Password changed. Redirecting to login…');
            // Per API docs: clear tokens after password change
            setTimeout(() => {
                clearTokens();
                window.location.href = '/login';
            }, 1500);
        }
        setIsSavingPassword(false);
    };


    if (authLoading || isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 bg-card rounded-full shadow-sm shadow-black/5 dark:shadow-none"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const isAdmin = user?.role === 'super_admin' || user?.role === 'org_admin' || user?.role === 'course_provider';

    const roleLabel: Record<string, string> = {
        super_admin: 'System Administrator',
        org_admin: 'Organization Administrator',
        course_provider: 'Course Provider',
        member: 'Learner',
        public_user: 'Public User',
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20 mt-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Modern Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-secondary rounded-3xl p-8 mb-10 overflow-hidden shadow-2xl shadow-secondary/20"
                >
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 bg-blue-500/5 rounded-full blur-3xl"></div>

                    <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        {user?.profile_photo ? (
                            <div className="h-32 w-32 rounded-3xl overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-300 relative">
                                <img src={user?.profile_photo} alt="Profile" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <CloudinaryUpload
                                        onUploadSuccess={async (url) => {
                                            setProfileData(prev => ({ ...prev, profile_photo: url }));
                                            await updateBackgroundProfile({ profile_photo: url });
                                            setUser(prev => prev ? { ...prev, profile_photo: url } : prev);
                                            toast.success('Profile photo updated successfully.');
                                        }}
                                        folder="profile-photos"
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 text-foreground p-2 rounded-full shadow-lg shadow-black/10 dark:shadow-none hover:bg-card cursor-pointer">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                    </CloudinaryUpload>
                                </div>
                            </div>
                        ) : (
                            <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-4xl font-bold shadow-2xl group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <CloudinaryUpload
                                        onUploadSuccess={async (url) => {
                                            setProfileData(prev => ({ ...prev, profile_photo: url }));
                                            await updateBackgroundProfile({ profile_photo: url });
                                            setUser(prev => prev ? { ...prev, profile_photo: url } : prev);
                                            toast.success('Profile photo updated successfully.');
                                        }}
                                        folder="profile-photos"
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 text-foreground p-2 rounded-full shadow-lg shadow-black/10 dark:shadow-none hover:bg-card cursor-pointer">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                    </CloudinaryUpload>
                                </div>
                            </div>
                        )}
                    </div>

                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-black text-foreground mb-3 tracking-tight">{user?.first_name} {user?.last_name}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <span className="px-5 py-2 bg-primary/10 border border-primary/20 rounded-2xl text-xs font-semibold text-primary uppercase tracking-wider shadow-sm shadow-black/5 dark:shadow-none">
                                    {roleLabel[user?.role || ''] || user?.role}
                                </span>
                                <span className="px-5 py-2 bg-card rounded-2xl text-xs font-bold text-foreground uppercase tracking-wider border border-border flex items-center gap-2 shadow-sm shadow-black/5 dark:shadow-none">
                                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                                    {user?.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Account Details Card */}
                        <Card
                            title="Personal Information"
                            subtitle="Manage your primary account settings and preferences"
                            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                        >
                            <SectionHeader title="Basic Details" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 block ml-1">Email Address</label>
                                    <div className="text-foreground font-bold bg-muted px-5 py-4 rounded-2xl border border-border shadow-sm shadow-black/5 dark:shadow-none transition-all hover:bg-card hover:shadow-md shadow-black/10 dark:shadow-none cursor-default cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
                                        {user?.email}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 block ml-1">Preferred Language</label>
                                    <div className="text-foreground font-bold bg-muted px-5 py-4 rounded-2xl border border-border shadow-sm shadow-black/5 dark:shadow-none transition-all hover:bg-card hover:shadow-md shadow-black/10 dark:shadow-none cursor-default capitalize cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
                                        {user?.preferred_language || 'English'}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 block ml-1">Organization</label>
                                    <div className="text-foreground font-bold bg-muted px-5 py-4 rounded-2xl border border-border shadow-sm shadow-black/5 dark:shadow-none transition-all hover:bg-card hover:shadow-md shadow-black/10 dark:shadow-none cursor-default cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
                                        {user?.organization_name || (user?.role === 'public_user' ? 'INSA' : 'Not assigned')}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Background Profile Form */}
                        {!isAdmin && (
                            <Card
                                title="Background Profile"
                                subtitle="Keep your professional and demographic data up to date"
                                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            >
                                <form onSubmit={handleProfileSubmit} className="space-y-10">
                                    <AnimatePresence>
                                        {profileError && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-50 text-red-700 p-5 rounded-3xl text-sm font-semibold border border-red-100 flex items-center gap-4 shadow-sm shadow-black/5 dark:shadow-none">
                                                <div className="p-2 bg-red-100 rounded-xl text-red-600">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                                {profileError}
                                            </motion.div>
                                        )}
                                        {profileSuccess && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-emerald-50 text-emerald-700 p-5 rounded-3xl text-sm font-semibold border border-emerald-100 flex items-center gap-4 shadow-sm shadow-black/5 dark:shadow-none">
                                                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                                {profileSuccess}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="space-y-8">
                                        <div>
                                            <SectionHeader title="Contact & Demographic" />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                <Input label="Phone Number" name="phone_number" value={profileData.phone_number || ''} onChange={handleProfileChange} required placeholder="+251 ..." />
                                                <SelectField label="Nationality" name="nationality" value={profileData.nationality || ''} onChange={handleProfileChange} options={[
                                                    { value: 'ethiopia', label: 'Ethiopia' },
                                                    { value: 'kenya', label: 'Kenya' },
                                                    { value: 'rwanda', label: 'Rwanda' },
                                                    { value: 'uganda', label: 'Uganda' },
                                                    { value: 'other', label: 'Other' }
                                                ]} />
                                                {profileData.nationality === 'ethiopia' && (
                                                <SelectField label="Region" name="region" value={profileData.region || ''} onChange={handleProfileChange} options={[
                                                    { value: 'addis_ababa', label: 'Addis Ababa' },
                                                    { value: 'afar', label: 'Afar' },
                                                    { value: 'amhara', label: 'Amhara' },
                                                    { value: 'benishangul_gumuz', label: 'Benishangul-Gumuz' },
                                                    { value: 'central_ethiopia', label: 'Central Ethiopia' },
                                                    { value: 'dire_dawa', label: 'Dire Dawa' },
                                                    { value: 'gambela', label: 'Gambela' },
                                                    { value: 'harari', label: 'Harari' },
                                                    { value: 'oromia', label: 'Oromia' },
                                                    { value: 'sidama', label: 'Sidama' },
                                                    { value: 'somali', label: 'Somali' },
                                                    { value: 'south_ethiopia', label: 'South Ethiopia' },
                                                    { value: 'southwest_ethiopia', label: 'Southwest Ethiopia' },
                                                    { value: 'tigray', label: 'Tigray' },
                                                ]} />
                                                )}

                                                <div className="grid grid-cols-2 gap-6">
                                                    <SelectField label="Age Range" name="age_range" value={profileData.age_range || ''} onChange={handleProfileChange} options={[{ value: '13_17', label: '13–17' }, { value: '18_22', label: '18–22' }, { value: '23_25', label: '23–25' }, { value: '26_30', label: '26–30' }, { value: '31_35', label: '31–35' }, { value: '36_40', label: '36–40' }, { value: '41_plus', label: '41+' }]} />
                                                    {/* API only allows male/female */}
                                                    <SelectField label="Gender" name="gender" value={profileData.gender || ''} onChange={handleProfileChange} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
                                                </div>

                                            </div>
                                        </div>

                                        <div>
                                            <SectionHeader title="Education & Professional" />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                <SelectField label="Education Level" name="education_level" value={profileData.education_level || ''} onChange={handleProfileChange} options={[{ value: 'high_school', label: 'High School' }, { value: 'bachelor', label: "Bachelor's" }, { value: 'master', label: "Master's" }, { value: 'phd', label: 'PhD' }, { value: 'other', label: 'Other' }]} />
                                                <SelectField label="Field of Study" name="field_of_study" value={profileData.field_of_study || ''} onChange={handleProfileChange} options={[{ value: 'agriculture', label: 'Agriculture' }, { value: 'arts', label: 'Arts' }, { value: 'business', label: 'Business' }, { value: 'cs_it', label: 'CS & IT' }, { value: 'education', label: 'Education' }, { value: 'engineering', label: 'Engineering' }, { value: 'humanities', label: 'Humanities' }, { value: 'law', label: 'Law' }, { value: 'medicine', label: 'Medicine' }, { value: 'natural_science', label: 'Natural Science' }, { value: 'social_science', label: 'Social Science' }, { value: 'other', label: 'Other' }]} />
                                                <Input label="Institution Name" name="institution_name" value={profileData.institution_name || ''} onChange={handleProfileChange} />
                                                <SelectField label="Employment Status" name="employment_status" value={profileData.employment_status || ''} onChange={handleProfileChange} options={[{ value: 'full_time', label: 'Full-time' }, { value: 'part_time', label: 'Part-time' }, { value: 'freelancer', label: 'Freelancer' }, { value: 'entrepreneur', label: 'Entrepreneur' }, { value: 'student', label: 'Student' }, { value: 'unemployed', label: 'Unemployed' }, { value: 'other', label: 'Other' }]} />
                                                <Input label="Employer Name" name="employer_name" value={profileData.employer_name || ''} onChange={handleProfileChange} />
                                                <SelectField label="Experience" name="professional_experience" value={profileData.professional_experience || ''} onChange={handleProfileChange} options={[{ value: 'none', label: 'None' }, { value: 'lt_1', label: '< 1 Year' }, { value: '1_2', label: '1–2 Years' }, { value: '2_3', label: '2–3 Years' }, { value: '3_5', label: '3–5 Years' }, { value: '5_6', label: '5–6 Years' }, { value: '6_10', label: '6–10 Years' }, { value: '10_plus', label: '10+ Years' }]} />
                                                <SelectField label="Motivation" name="enrollment_motivation" value={profileData.enrollment_motivation || ''} onChange={handleProfileChange} options={[{ value: 'new_job', label: 'New Job' }, { value: 'promotion', label: 'Promotion' }, { value: 'new_skill', label: 'New Skill' }, { value: 'advanced_degree', label: 'Advanced Degree' }, { value: 'start_business', label: 'Business' }, { value: 'interest', label: 'Interest' }, { value: 'internship', label: 'Internship' }, { value: 'other', label: 'Other' }]} />
                                                <SelectField label="Referral Source" name="referral_source" value={profileData.referral_source || ''} onChange={handleProfileChange} options={[{ value: 'email', label: 'Email' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'facebook', label: 'Facebook' }, { value: 'instagram', label: 'Instagram' }, { value: 'twitter', label: 'Twitter' }, { value: 'telegram', label: 'Telegram' }, { value: 'search_engine', label: 'Search Engine' }, { value: 'sms', label: 'SMS' }, { value: 'website_search', label: 'Website Search' }, { value: 'program_website', label: 'Program Website' }, { value: 'friend_referral', label: 'Friend/Family' }, { value: 'other', label: 'Other' }]} />
                                            </div>
                                        </div>

                                        {/* unemployment_description: required for 'unemployed' OR 'other' per API docs */}
                                        {(profileData.employment_status === 'unemployed' || profileData.employment_status === 'other') && (

                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                                                <label className="block text-sm font-bold text-foreground mb-2 ml-1">Unemployment Description</label>
                                                <textarea name="unemployment_description" value={profileData.unemployment_description || ''} onChange={(e) => setProfileData((prev) => ({ ...prev, unemployment_description: e.target.value }))} className="block w-full rounded-2xl border border-border py-4 px-5 text-sm shadow-sm shadow-black/5 dark:shadow-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:outline-none bg-gray-50/30 dark:bg-card transition-all resize-none min-h-[120px]" placeholder="Could you briefly tell us more about your current status? This helps us provide relevant certifications." />
                                            </motion.div>
                                        )}

                                        <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-gray-50 to-white dark:from-muted/20 dark:to-card rounded-3xl border border-border shadow-sm shadow-black/5 dark:shadow-none">
                                            <div className="flex h-6 items-center">
                                                <input type="checkbox" id="is_info" name="is_information_confirmed" checked={profileData.is_information_confirmed || false} onChange={handleProfileChange} className="w-5 h-5 text-primary border-border rounded-xl focus:ring-primary cursor-pointer transition-all hover:scale-110" />
                                            </div>
                                            <div className="text-sm leading-6">
                                                <label htmlFor="is_info" className="font-bold text-foreground cursor-pointer">Confirmation of Accuracy</label>
                                                <p className="text-muted-foreground font-medium">I understand that providing accurate information ensures I receive the correct certifications and course recommendations.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 dark:border-border">
                                        <Button variant="secondary" type="submit" disabled={isSavingProfile} className="px-10 py-4 rounded-2xl shadow-xl shadow-secondary/20 font-bold tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all">
                                            {isSavingProfile ? 'Processing...' : 'Sync Profile Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Stats & Security */}
                    <div className="space-y-8">

                        {/* Points & Achievements */}
                        {!isAdmin && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-secondary rounded-[2.5rem] p-9 text-foreground shadow-2xl shadow-secondary/30 relative overflow-hidden group border border-border"
                            >
                                <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 rounded-full -mr-20 -mt-20 blur-3xl transition-all group-hover:bg-primary/20"></div>
                                <div className="absolute bottom-0 left-0 h-40 w-40 bg-blue-500/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Learning Overview</h3>
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-ping"></div>
                                    </div>

                                    <div className="flex items-baseline gap-3 mb-10">
                                        <span className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">{learningStats.averageProgress}%</span>
                                        <span className="text-sm font-black text-primary tracking-widest uppercase">Avg Progress</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-card rounded-3xl border border-border flex items-center justify-between transition-all hover:shadow-md shadow-black/10 dark:shadow-none cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-100">
                                                    <span className="text-blue-500 font-bold">{learningStats.enrolled}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-foreground tracking-tight">Enrolled Courses</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Active & Completed</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-card rounded-3xl border border-border flex items-center justify-between transition-all hover:shadow-md shadow-black/10 dark:shadow-none cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-100">
                                                    <span className="text-green-600 font-bold">{learningStats.completed}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-foreground tracking-tight">Completed</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">100% Progress</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={() => router.push('/dashboard')} className="w-full mt-8 py-4 bg-card hover:bg-muted border border-border rounded-2xl text-[10px] font-black text-foreground uppercase tracking-[0.2em] transition-all hover:shadow-sm shadow-black/5 dark:shadow-none active:scale-95 cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
                                        View Dashboard
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Security Card */}
                        <Card
                            title="Security settings"
                            subtitle="Manage your password and authentication"
                            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                        >
                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <AnimatePresence>
                                    {passwordError && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold border border-red-100 mb-4">
                                            {passwordError}
                                        </motion.div>
                                    )}
                                    {passwordSuccess && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-xs font-bold border border-emerald-100 mb-4">
                                            {passwordSuccess}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="space-y-5">
                                    <Input label="Current Password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required placeholder="••••••••" showPasswordToggle />
                                    <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••" showPasswordToggle />
                                    <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" showPasswordToggle />
                                </div>
                                <Button variant="primary" type="submit" disabled={isSavingPassword} className="w-full py-4 rounded-2xl mt-4 shadow-xl shadow-primary/20 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    {isSavingPassword ? 'Securing...' : 'Update Password'}
                                </Button>
                            </form>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
