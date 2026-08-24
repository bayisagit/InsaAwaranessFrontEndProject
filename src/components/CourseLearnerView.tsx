'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SidebarProvider, SidebarInset, SidebarTrigger, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar';
import { BookOpen, Layers, CheckSquare, Award, ArrowLeft, CheckCircle2, Circle, ChevronDown, GraduationCap, ArrowRight, User, LogOut } from 'lucide-react';
import { apiFetch, Course, CourseModule, Enrollment, getAssessments, getAssessment, Assessment } from '@/lib/api';
import { AssessmentViewer } from '@/components/AssessmentViewer';
import { useAuth } from '@/context/AuthContext';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Button } from '@/components/Button';
import { LinkifyText } from '@/components/LinkifyText';
import { WorkspaceSkeleton } from '@/components/LoadingSkeleton';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import DOMPurify from 'isomorphic-dompurify';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from '@/components/ConfirmModal';

export function CourseLearnerView({ courseId, previewMode = false }: { courseId: string; previewMode?: boolean }) {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollError, setEnrollError] = useState('');
    
    const [exam, setExam] = useState<Assessment | null>(null);
    const [isAssessmentStarted, setIsAssessmentStarted] = useState(false);
    
    const [activeSectionId, setActiveSectionId] = useState<string>('overview');
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    
    // Observer ref for scrollspy
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            router.push(`/login?next=/dashboard/courses/${courseId}`);
            return;
        }
        if (courseId) fetchCourseData();
    }, [courseId, isAuthenticated]);

    const fetchCourseData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        const courseRes = await apiFetch(`/api/v1/courses/${courseId}/`);
        let enrollRes: any = { data: null };
        if (!previewMode) {
            enrollRes = await apiFetch(`/api/v1/enrollments/?course=${courseId}&user=${user?.id}`);
        }

        if (courseRes.data) {
            setCourse(courseRes.data);
            if (Array.isArray(courseRes.data.modules)) {
                const sortedModules = [...courseRes.data.modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                setModules(sortedModules);
                
                // Expand all modules by default
                const initialExpandedState: Record<string, boolean> = {};
                sortedModules.forEach(m => { initialExpandedState[m.id] = true; });
                setExpandedModules(initialExpandedState);
            }
        }

        if (previewMode) {
            setIsEnrolled(true);
        } else if (enrollRes.data) {
            const results = enrollRes.data.results || (Array.isArray(enrollRes.data) ? enrollRes.data : []);
            const foundEnrollment = results[0] || null;
            setIsEnrolled(!!foundEnrollment);
            setEnrollment(foundEnrollment);
        }

        // Fetch Exam
        try {
            const listRes = await getAssessments({ course: courseId, parent_type: 'course_exam', page_size: 10 });
            const results = (listRes.data as any)?.results ?? (Array.isArray(listRes.data) ? listRes.data : []);
            if (Array.isArray(results) && results.length > 0) {
                setExam(results[0]);
            } else if (courseRes.data?.course_exams && Array.isArray(courseRes.data.course_exams) && courseRes.data.course_exams.length > 0) {
                const examId = courseRes.data.course_exams[0].id;
                const examRes = await getAssessment(examId);
                if (examRes.data) {
                    setExam(examRes.data);
                }
            }
        } catch (e) {
            console.error("Failed to load exam", e);
        }

        if (!silent) setIsLoading(false);
    };

    // ScrollSpy Setup
    useEffect(() => {
        if (isLoading || !isEnrolled) return;
        
        observer.current = new IntersectionObserver((entries) => {
            // Find the intersecting entry with the highest intersection ratio
            let activeId = '';
            let maxRatio = 0;
            
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    activeId = entry.target.id;
                }
            });
            
            if (activeId) setActiveSectionId(activeId);
        }, {
            root: null, // viewport
            rootMargin: '-20% 0px -60% 0px', // triggering mostly in the top half of screen
            threshold: [0, 0.25, 0.5, 0.75, 1]
        });

        // Observe all sections
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => observer.current?.observe(section));

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [isLoading, isEnrolled, modules]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSectionId(id);
        }
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const handleEnroll = async () => {
        setIsEnrolling(true); setEnrollError('');
        const { data, error: e, status } = await apiFetch('/api/v1/enrollments/', {
            method: 'POST',
            body: JSON.stringify({ user: user?.id, course: courseId })
        });

        if (e || (status !== 200 && status !== 201)) {
            setEnrollError(e || 'Enrollment failed.');
        } else {
            setIsEnrolled(true);
            setEnrollment(data as Enrollment);
        }
        setIsEnrolling(false);
    };

    if (isLoading) {
        return <WorkspaceSkeleton />;
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 font-medium">Course not found.</p>
                    <Link href={previewMode ? `/admin/courses/${courseId}` : "/dashboard/courses"} className="mt-4 text-primary hover:underline block">← Back to {previewMode ? "Admin Workspace" : "My Courses"}</Link>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            {/* Sidebar */}
            <Sidebar className="border-r border-border bg-card">
                <SidebarHeader className="p-5 border-b border-border bg-muted/30">
                    <Link href={previewMode ? `/admin/courses/${courseId}` : "/dashboard/courses"} className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors duration-200 uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" />
                        {previewMode ? "Admin Workspace" : "My Courses"}
                    </Link>
                </SidebarHeader>
                
                <SidebarContent className="p-3">
                    {/* Overview Nav */}
                    <button
                        onClick={() => scrollToSection('overview')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeSectionId === 'overview' ? 'bg-primary text-white shadow-md' : 'text-foreground hover:bg-muted/50'}`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Overview
                    </button>
                    
                    <div className="mt-6 mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Course Content</div>
                    
                    {/* Modules and Lessons Nav */}
                    <div className="space-y-1">
                        {modules.map((mod, index) => {
                            const modId = `module-${mod.id}`;
                            const isActiveMod = activeSectionId === modId;
                            const isExpanded = expandedModules[mod.id];
                            
                            return (
                                <div key={mod.id} className="flex flex-col">
                                    <button
                                        onClick={() => {
                                            toggleModule(mod.id);
                                            scrollToSection(modId);
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActiveMod ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-muted/30'}`}
                                    >
                                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                                        <span className="truncate">Module {index + 1}: {mod.title}</span>
                                    </button>
                                    
                                    {/* Lessons */}
                                    <div className={`pl-8 pr-3 flex flex-col gap-0.5 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 mt-1 mb-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        {(mod.lessons || []).sort((a, b) => a.order - b.order).map((lesson, lIdx) => {
                                            const lesId = `lesson-${lesson.id}`;
                                            const isActiveLes = activeSectionId === lesId;
                                            return (
                                                <div key={lesson.id} className="flex flex-col gap-0.5">
                                                    <button
                                                        onClick={() => scrollToSection(lesId)}
                                                        className={`w-full flex items-start gap-2 py-1.5 px-2 rounded-md text-xs text-left transition-colors ${isActiveLes ? 'text-primary font-bold bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        <Circle className={`w-2 h-2 mt-1 shrink-0 ${isActiveLes ? 'fill-primary' : ''}`} />
                                                        <span className="line-clamp-2">Lesson {lIdx + 1}: {lesson.title}</span>
                                                    </button>
                                                    {lesson.assessment && (
                                                        <button
                                                            onClick={() => scrollToSection(`${lesId}-assessment`)}
                                                            className={`w-full flex items-start gap-2 py-1.5 px-2 pl-6 rounded-md text-xs text-left transition-colors ${activeSectionId === `${lesId}-assessment` ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-muted-foreground hover:text-indigo-500'}`}
                                                        >
                                                            <CheckSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                                            <span className="line-clamp-2">Lesson Assessment</span>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Module Quizzes */}
                                        {(mod.module_quizzes || []).map((quiz, qIdx) => {
                                            const quizId = `module-${mod.id}-quiz-${quiz.id}`;
                                            const isActiveQuiz = activeSectionId === quizId;
                                            return (
                                                <button
                                                    key={quiz.id}
                                                    onClick={() => scrollToSection(quizId)}
                                                    className={`w-full flex items-start gap-2 py-2 px-2 mt-1 rounded-md text-xs text-left font-bold transition-colors ${isActiveQuiz ? 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400' : 'text-orange-500/80 hover:text-orange-600 dark:hover:text-orange-400'}`}
                                                >
                                                    <Award className="w-3 h-3 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">Module Quiz: {quiz.title || `Quiz ${qIdx + 1}`}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Assessments Nav */}
                    <div className="mt-6 mb-2">
                        <button
                            onClick={() => scrollToSection('assessment')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeSectionId === 'assessment' ? 'bg-primary text-white shadow-md' : 'text-foreground hover:bg-muted/50'}`}
                        >
                            <Award className="w-4 h-4" />
                            Final Assessment
                        </button>
                    </div>

                    <div className="mt-2 mb-2">
                        <Link href={previewMode ? "#" : "/dashboard/certificates"} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all duration-200">
                            <Award className="w-4 h-4" />
                            My Certificates
                        </Link>
                    </div>
                </SidebarContent>
            </Sidebar>

            {/* Main Content Area */}
            <SidebarInset className="flex flex-col flex-1 overflow-hidden h-screen bg-muted/30">
                {previewMode && (
                    <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-center text-sm font-bold shadow-md z-[60] flex items-center justify-center gap-2">
                        👁 Preview Mode — Learner progress, assessments, and analytics are simulated and not saved.
                    </div>
                )}
                <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card/80 backdrop-blur-md px-6 shadow-sm z-50 sticky top-0">
                    <SidebarTrigger className="-ml-2" />
                    
                    <div className="flex-1 flex items-center gap-2 text-sm font-medium">
                        <span className="text-muted-foreground hidden sm:inline">Learning:</span>
                        <span className="text-foreground font-bold">{course.title}</span>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="outline-none">
                                <Avatar className="h-9 w-9 border border-border hover:ring-2 ring-primary/20 transition-all cursor-pointer">
                                    {user?.profile_photo ? (
                                        <AvatarImage src={user.profile_photo} alt="Profile" className="object-cover" />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                        {user?.first_name?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user?.first_name} {user?.last_name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem onClick={() => router.push('/profile')} className="flex items-center w-full cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setIsLogoutModalOpen(true)} className="flex items-center w-full text-red-500 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                
                <div className="flex-1 overflow-y-auto scroll-smooth pb-32">
                    {!isEnrolled ? (
                        <div className="max-w-4xl mx-auto px-6 py-12">
                            <div className="bg-card rounded-3xl p-10 shadow-xl border border-border text-center flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                                    <GraduationCap className="w-10 h-10" />
                                </div>
                                <h1 className="text-3xl font-extrabold text-foreground mb-4">Enroll to Access Course</h1>
                                <p className="text-muted-foreground max-w-lg mb-8 leading-relaxed">
                                    {course.description || 'Join this course to access all modules, lessons, and earn your certificate upon passing the final assessment.'}
                                </p>
                                {enrollError && <p className="text-red-500 text-sm mb-4">{enrollError}</p>}
                                <Button 
                                    variant="primary" 
                                    className="px-8 py-6 text-lg rounded-full shadow-lg shadow-primary/20 w-full sm:w-auto"
                                    onClick={handleEnroll}
                                    disabled={isEnrolling}
                                >
                                    {isEnrolling ? 'Enrolling...' : 'Enroll in Course'}
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-10 flex flex-col gap-12 w-full">
                            {/* Overview Section */}
                            <section id="overview" className="scroll-mt-24 space-y-6">
                                <div>
                                    <h1 className="text-4xl font-extrabold text-foreground tracking-tight">{course.title}</h1>
                                    <div className="flex items-center gap-4 mt-4">
                                        {course.level && <span className="text-xs font-bold uppercase bg-primary/10 text-primary px-3 py-1 rounded-full">{course.level}</span>}
                                        {course.language && <span className="text-xs font-bold uppercase bg-muted text-muted-foreground px-3 py-1 rounded-full">{course.language}</span>}
                                    </div>
                                </div>
                                
                                {course.description && (
                                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                                        <h3 className="text-lg font-bold text-foreground mb-3">About this Course</h3>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap"><LinkifyText text={course.description} /></p>
                                    </div>
                                )}
                            </section>

                            <div className="w-full h-px bg-border my-4" />

                            {/* Modules and Lessons */}
                            {modules.map((mod, index) => (
                                <React.Fragment key={mod.id}>
                                    <section id={`module-${mod.id}`} className="scroll-mt-24">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xl shrink-0 shadow-inner">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Module {index + 1}</p>
                                                <h2 className="text-2xl font-extrabold text-foreground">{mod.title}</h2>
                                            </div>
                                        </div>
                                    </section>

                                    {(mod.lessons || []).sort((a, b) => a.order - b.order).map((lesson, lIdx) => (
                                        <section id={`lesson-${lesson.id}`} key={lesson.id} className="scroll-mt-24 pl-4 sm:pl-8">
                                            <div className="bg-card rounded-3xl border border-border p-8 shadow-sm hover:shadow-md transition-shadow">
                                                <h3 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-border">
                                                    Lesson {index + 1}.{lIdx + 1}: {lesson.title}
                                                </h3>
                                                
                                                {(lesson.media_url || lesson.video_url) && (
                                                    <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center mb-8">
                                                        <VideoPlayer src={(lesson.media_url || lesson.video_url) as string} className="w-full aspect-video" />
                                                    </div>
                                                )}
                                                
                                                {/* Image Content */}
                                                {lesson.image_url && (
                                                    <div className="mb-8 rounded-xl overflow-hidden shadow-lg border border-border">
                                                        <img src={lesson.image_url} alt={lesson.title} className="w-full object-cover" />
                                                    </div>
                                                )}

                                                {/* Text Content rendered with DangerouslySetInnerHTML */}
                                                {lesson.content && (
                                                    <div 
                                                        className="tiptap prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none text-muted-foreground break-words overflow-x-auto"
                                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content, { ADD_ATTR: ['target', 'rel'] }) }}
                                                    />
                                                )}

                                                {/* Lesson Assessment */}
                                                {(lesson.content_type === 'assessment' || lesson.assessment) && (
                                                    <div id={`lesson-${lesson.id}-assessment`} className="mt-8 mb-4 border-t border-border pt-8 scroll-mt-24">
                                                        <h4 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-4 flex items-center gap-2">
                                                            <CheckSquare className="w-5 h-5" />
                                                            Lesson Assessment
                                                        </h4>
                                                        <AssessmentViewer assessmentId={lesson.assessment?.id} lessonId={lesson.id} previewMode={previewMode} />
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    ))}
                                    
                                    {/* Module Quizzes */}
                                    {(mod.module_quizzes || []).map((quiz, qIdx) => (
                                        <section id={`module-${mod.id}-quiz-${quiz.id}`} key={quiz.id} className="scroll-mt-24 pl-4 sm:pl-8 mt-6">
                                            <div className="bg-orange-50/50 dark:bg-orange-950/20 rounded-3xl border border-orange-200 dark:border-orange-900/50 p-8 shadow-sm">
                                                <h3 className="text-xl font-bold text-orange-800 dark:text-orange-400 mb-6 pb-4 border-b border-orange-200 dark:border-orange-900/50 flex items-center gap-3">
                                                    <Award className="w-6 h-6" />
                                                    Module Quiz: {quiz.title || `Quiz ${qIdx + 1}`}
                                                </h3>
                                                <AssessmentViewer assessmentId={quiz.id} previewMode={previewMode} />
                                            </div>
                                        </section>
                                    ))}
                                    
                                    {index < modules.length - 1 && <div className="w-full h-px bg-border/50 my-4 mt-8" />}
                                </React.Fragment>
                            ))}
                            
                            <div className="w-full h-px bg-border my-4" />

                            {/* Final Assessment */}
                            <section id="assessment" className="scroll-mt-24 mb-20">
                                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-10 text-center shadow-lg">
                                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
                                        <Award className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-foreground mb-4">Course Final Assessment</h2>
                                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                                        Test your knowledge on everything you've learned. Passing this exam will earn you the course certificate!
                                    </p>
                                    
                                    {enrollment?.status === 'completed' && !isAssessmentStarted ? (
                                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-6 max-w-md mx-auto">
                                            <div className="flex items-center justify-center gap-3 text-green-700 dark:text-green-400 font-bold text-lg mb-4">
                                                <CheckCircle2 className="w-6 h-6" />
                                                Assessment Passed!
                                            </div>
                                            <p className="text-sm text-green-800 dark:text-green-300 mb-6">
                                                You have successfully completed this course and earned your certificate.
                                            </p>
                                            <Link href={previewMode ? "#" : "/dashboard/certificates"}>
                                                <Button variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-100 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-500/20">
                                                    View My Certificates
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : isAssessmentStarted && exam ? (
                                        <div className="mt-8 text-left bg-card p-6 rounded-3xl border border-border">
                                            {enrollment?.status === 'completed' && (
                                                <div className="mb-6 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3 text-green-700 dark:text-green-400 font-bold">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        Assessment Passed! Your certificate is ready.
                                                    </div>
                                                    <Link href={previewMode ? "#" : "/dashboard/certificates"}>
                                                        <Button variant="outline" size="sm" className="border-green-600 text-green-700 hover:bg-green-100 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-500/20">
                                                            View Certificate
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}
                                            <AssessmentViewer
                                                assessmentId={exam.id}
                                                previewMode={previewMode}
                                                onComplete={() => {
                                                    fetchCourseData(true);
                                                }}
                                            />
                                        </div>
                                    ) : exam ? (
                                        <div className="max-w-sm mx-auto">
                                            <Button variant="primary" onClick={() => setIsAssessmentStarted(true)} className="w-full py-6 text-lg rounded-full shadow-lg shadow-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
                                                Start Assessment
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-4">Passing Score: {exam.passing_score ?? 70}%</p>
                                        </div>
                                    ) : (
                                        <div className="bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 border border-orange-200 rounded-2xl p-6 max-w-md mx-auto text-sm">
                                            No course exam is available at this time.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </SidebarInset>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={() => { setIsLogoutModalOpen(false); logout(); }}
                title="Log out"
                message="Are you sure you want to log out?"
                confirmText="Log out"
                variant="danger"
            />
        </SidebarProvider>
    );
}
