'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/EmptyState';
import { LinkifyText } from '@/components/LinkifyText';

interface Course {
 id: string;
 title: string;
 description: string;
 language: string;
 difficulty?: string;
 level?: string;
 status?: string;
 provider?: string;
 created_at?: string;
 thumbnail_url?: string;
 payment_type?: string;
 course_price?: string;
 currency?: string;
}

export default function TrainingPage() {
 const { isAuthenticated } = useAuth();
 const [courses, setCourses] = useState<Course[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
 const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
 const [sortBy, setSortBy] = useState('Newest');

 useEffect(() => {
 fetchCourses();
 }, []);

 const fetchCourses = async () => {
 setIsLoading(true);
 const { data } = await apiFetch('/api/v1/courses/');
 if (data?.results) setCourses(data.results);
 else if (Array.isArray(data)) setCourses(data);
 setIsLoading(false);
 };

 const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
 setter(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
 };

 let filteredCourses = courses.filter(course => {
 // Only show published courses to learners
 if (course.status && course.status !== 'published') return false;
 const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
 const itemLevel = (course.level || course.difficulty || '').toLowerCase();
 const matchesDiff = selectedDifficulty.length === 0 || selectedDifficulty.includes(itemLevel);
 const matchesLang = selectedLanguages.length === 0 || selectedLanguages.includes(course.language || '');
 return matchesSearch && matchesDiff && matchesLang;
 });

 if (sortBy === 'Alphabetical') {
 filteredCourses = [...filteredCourses].sort((a, b) => a.title.localeCompare(b.title));
 } else if (sortBy === 'Newest') {
 filteredCourses = [...filteredCourses].sort((a, b) => {
 const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
 const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
 return dateB - dateA;
 });
 } else if (sortBy === 'Oldest') {
 filteredCourses = [...filteredCourses].sort((a, b) => {
 const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
 const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
 return dateA - dateB;
 });
 }

 const difficultyColors: Record<string, string> = {
 beginner: 'green',
 medium: 'yellow',
 advanced: 'red'
 };

 const icons = [
 <svg key="shield" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
 <svg key="lock" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
 <svg key="spy" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
 <svg key="computer" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>,
 <svg key="satellite" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
 <svg key="scroll" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
 <svg key="globe" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
 <svg key="key" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
 <svg key="gear" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
 <svg key="brain" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
 ];

 return (
 <div className="min-h-screen bg-muted flex flex-col items-center">
 {/* Hero */}
 <section className="w-full relative overflow-hidden bg-card px-4 sm:px-6 lg:px-12 py-20 text-center flex flex-col items-center border-b border-border">
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[600px] h-[300px] bg-primary/5 rounded-[100%] filter blur-3xl opacity-70"></div>
 <span className="text-primary text-[10px] font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
 CYBERSECURITY TRAINING
 </span>
 <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl max-w-2xl">
 Ignite Your <span className="text-primary">Cyber Resilience</span>
 </h1>
 <p className="mt-6 text-base leading-7 text-muted-foreground max-w-2xl">
 Expert-led training designed to empower you with the skills to identify threats and protect our digital nation.
 </p>
 <div className="mt-8 max-w-xl w-full flex bg-card border border-border rounded-full p-2 shadow-sm shadow-black/5 dark:shadow-none focus-within:ring-2 focus-within:ring-primary transition-all">
 <div className="pl-4 flex items-center text-muted-foreground">
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
 </svg>
 </div>
 <input
 type="text"
 placeholder="Search courses..."
 className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 outline-none"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 <button className="bg-primary hover:bg-primary-hover text-white rounded-full px-6 py-2 text-sm font-semibold transition-colors cursor-pointer">
 Search
 </button>
 </div>
 </section>

 {/* Content */}
 <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 flex flex-col lg:flex-row gap-8">
 {/* Sidebar */}
 <div className="w-full lg:w-64 shrink-0 space-y-8">
 <div>
 <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Level</h4>
 <div className="space-y-3">
 {['beginner', 'medium', 'advanced'].map(item => (
 <label key={item} className="flex items-center gap-3 cursor-pointer group">
 <input type="checkbox" className="hidden" checked={selectedDifficulty.includes(item)} onChange={() => handleCheckboxChange(setSelectedDifficulty, item)} />
 <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selectedDifficulty.includes(item) ? 'bg-primary border-primary' : 'bg-card border-border group-hover:border-primary'}`}>
 {selectedDifficulty.includes(item) && (
 <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 )}
 </div>
 <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors capitalize">{item}</span>
 </label>
 ))}
 </div>
 </div>

 <div>
 <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Language</h4>
 <div className="space-y-3">
 {['en', 'am', 'om', 'so', 'ti'].map(item => (
 <label key={item} className="flex items-center gap-3 cursor-pointer group">
 <input type="checkbox" className="hidden" checked={selectedLanguages.includes(item)} onChange={() => handleCheckboxChange(setSelectedLanguages, item)} />
 <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selectedLanguages.includes(item) ? 'bg-primary border-primary' : 'bg-card border-border group-hover:border-primary'}`}>
 {selectedLanguages.includes(item) && (
 <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 )}
 </div>
 <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors uppercase">{item}</span>
 </label>
 ))}
 </div>

 {(selectedDifficulty.length > 0 || selectedLanguages.length > 0 || searchQuery) && (
 <button
 onClick={() => { setSelectedDifficulty([]); setSelectedLanguages([]); setSearchQuery(''); }}
 className="text-xs text-primary font-bold hover:text-primary transition-colors duration-200-hover transition-colors flex items-center gap-1 pt-4 cursor-pointer"
 >
 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
 </svg>
 Clear all filters
 </button>
 )}
 </div>
 </div>

 {/* Main Grid */}
 <div className="flex-1">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
 All Courses <span className="text-xs font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{filteredCourses.length} total</span>
 </h3>
 <select
 className="border border-border rounded-lg bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value)}
 >
 <option value="Newest">Newest</option>
 <option value="Oldest">Oldest</option>
 <option value="Alphabetical">Alphabetical</option>
 </select>
 </div>

 {isLoading ? (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {[1, 2, 3, 4, 5, 6].map(i => (
 <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse h-48"></div>
 ))}
 </div>
 ) : filteredCourses.length === 0 ? (
 <EmptyState
 icon={
 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
 </svg>
 }
 title={searchQuery ? 'No courses matched your search.' : 'No courses available yet.'}
 description={searchQuery ? 'Try a different search term or adjust your filters.' : 'Check back soon for new training opportunities.'}
 />
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {filteredCourses.map((course, i) => {
 const diff = course.difficulty?.toLowerCase() || '';
 const color = difficultyColors[diff] || 'gray';
 return (
 <div key={course.id} className="bg-card rounded-2xl p-6 border border-border hover:shadow-md shadow-black/10 dark:shadow-none hover:border-primary/20 transition-all cursor-pointer flex flex-col h-full relative group cursor-pointer hover:-translate-y-1 transition-all duration-200 ease-in-out">
 {(course.level || course.difficulty) && (
 <div className={`absolute top-6 right-6 px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
 (course.level || course.difficulty || '').toLowerCase() === 'beginner' ? 'bg-green-50 text-green-600' :
 (course.level || course.difficulty || '').toLowerCase() === 'medium' ? 'bg-yellow-50 text-yellow-600' :
 (course.level || course.difficulty || '').toLowerCase() === 'advanced' ? 'bg-red-50 text-red-600' :
 'bg-muted text-muted-foreground'
 }`}>
 {course.level || course.difficulty}
 </div>
 )}
 {course.thumbnail_url ? (
 <div className="w-full h-36 rounded-xl overflow-hidden mb-4 shrink-0">
 <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
 </div>
 ) : (
 <div className="w-10 h-10 rounded-xl bg-primary/10 text-xl flex items-center justify-center mb-4 shrink-0 transition-transform group-hover:scale-110">
 {icons[i % icons.length]}
 </div>
 )}
 <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors pr-16">{course.title}</h4>
 <p className="text-xs text-muted-foreground mb-4 flex-1 line-clamp-3">
 <LinkifyText text={course.description || 'Explore this cybersecurity course and build your skills.'} />
 </p>
 <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
 {course.language ? (
 <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded font-medium uppercase">{course.language}</span>
 ) : <span />}

 {(course as any).payment_type === 'paid' && !(course as any).is_unlocked && (
 <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 font-bold text-xs mx-auto">
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
 {(course as any).currency || 'ETB'} {(course as any).course_price}
 </div>
 )}

 {(course as any).payment_type === 'paid' && (course as any).is_unlocked && (
 <div className="flex items-center gap-1 text-primary font-bold text-xs mx-auto">
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
 PAID
 </div>
 )}
 
 {(course as any).payment_type === 'paid' && !(course as any).is_unlocked ? (
 <Link href={isAuthenticated ? `/dashboard/courses/${course.id}/payment` : '/login'} className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 hover:underline inline-flex items-center gap-1">
 Unlock Course
 </Link>
 ) : (
 <Link href={`/courses/${course.id}`} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
 View Course
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
 </svg>
 </Link>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </section>
 </div>
 );
}
