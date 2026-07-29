'use client';

import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarFooter } from '@/components/ui/sidebar';
import { BookOpen, Layers, FileText, CheckSquare, Award, Settings, ArrowLeft, LayoutDashboard, ShieldAlert, User, LogOut, BarChart3, PieChart } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { apiFetch, getModule, getLesson, getAssessment } from '@/lib/api';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/context/AuthContext';

interface CourseWorkspaceLayoutProps {
    children: React.ReactNode;
}

export function CourseWorkspaceLayout({ children }: CourseWorkspaceLayoutProps) {
    const pathname = usePathname() || '';
    const params = useParams();
    const { user, logout } = useAuth();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const handleLogout = () => setIsLogoutModalOpen(true);
    const [courseId, setCourseId] = useState<string | null>(null);
    const [courseName, setCourseName] = useState<string>('Loading...');
    const [moduleName, setModuleName] = useState<string | null>(null);
    const [moduleId, setModuleId] = useState<string | null>(null);
    const [lessonName, setLessonName] = useState<string | null>(null);
    const [lessonId, setLessonId] = useState<string | null>(null);

    // Resolve hierarchy based on current URL
    useEffect(() => {
        const resolveContext = async () => {
            let resolvedCourseId = null;
            let resolvedModuleId = null;
            let resolvedLessonId = null;

            if (pathname.startsWith('/admin/courses/') && params.courseId) {
                const cId = params.courseId as string;
                if (cId !== 'create') {
                    resolvedCourseId = cId;
                    setCourseId(resolvedCourseId);
                    const { data } = await apiFetch(`/api/v1/courses/${resolvedCourseId}/`);
                    if (data?.title) setCourseName(data.title);
                }

                if (params.moduleId) {
                    const mId = params.moduleId as string;
                    if (mId !== 'create') {
                        resolvedModuleId = mId;
                        const { data: moduleData } = await getModule(mId);
                        if (moduleData) {
                            setModuleName(moduleData.title);
                            setModuleId(mId);
                            resolvedCourseId = moduleData.course;
                            setCourseId(resolvedCourseId);
                            const { data: courseData } = await apiFetch(`/api/v1/courses/${resolvedCourseId}/`);
                            if (courseData?.title) setCourseName(courseData.title);
                        }
                    }
                }

                if (params.moduleId && params.lessonId) {
                    const lId = params.lessonId as string;
                    if (lId !== 'create') {
                        resolvedLessonId = lId;
                        const { data: lessonData } = await getLesson(lId);
                        if (lessonData) {
                            setLessonName(lessonData.title);
                            setLessonId(lId);
                        }
                    }
                } else if (params.lessonId && !params.moduleId) {
                    const lId = params.lessonId as string;
                    if (lId !== 'create') {
                        resolvedLessonId = lId;
                        const { data: lessonData } = await getLesson(lId);
                        if (lessonData) {
                            setLessonName(lessonData.title);
                            setLessonId(lId);
                            const { data: moduleData } = await getModule(lessonData.module);
                            if (moduleData) {
                                setModuleName(moduleData.title);
                                setModuleId(lessonData.module);
                                resolvedCourseId = moduleData.course;
                                setCourseId(resolvedCourseId);
                                const { data: courseData } = await apiFetch(`/api/v1/courses/${resolvedCourseId}/`);
                                if (courseData?.title) setCourseName(courseData.title);
                            }
                        }
                    }
                }

                if (!params.moduleId) setModuleId(null);
                if (!params.lessonId) setLessonId(null);
            } else if (pathname.startsWith('/admin/modules/') && params.moduleId) {
                const mId = params.moduleId as string;
                if (mId !== 'create') {
                    resolvedModuleId = mId;
                    const { data: moduleData } = await getModule(mId);
                    if (moduleData) {
                        setModuleName(moduleData.title);
                        setModuleId(mId);
                        resolvedCourseId = moduleData.course;
                        setCourseId(resolvedCourseId);
                        const { data } = await apiFetch(`/api/v1/courses/${resolvedCourseId}/`);
                        if (data?.title) setCourseName(data.title);
                    }
                }
            } else if (pathname.startsWith('/admin/lessons/') && params.lessonId) {
                const lId = params.lessonId as string;
                if (lId !== 'create') {
                    resolvedLessonId = lId;
                    const { data: lessonData } = await getLesson(lId);
                    if (lessonData) {
                        setLessonName(lessonData.title);
                        setLessonId(lId);
                        const { data: moduleData } = await getModule(lessonData.module);
                        if (moduleData) {
                            setModuleName(moduleData.title);
                            setModuleId(lessonData.module);
                            resolvedCourseId = moduleData.course;
                            setCourseId(resolvedCourseId);
                            const { data } = await apiFetch(`/api/v1/courses/${resolvedCourseId}/`);
                            if (data?.title) setCourseName(data.title);
                        }
                    }
                }
            }
        };
        resolveContext();
    }, [pathname, params]);

    const navItems = [
        { title: "Overview", url: `/admin/courses/${courseId}`, icon: LayoutDashboard },
        { title: "Modules", url: `/admin/courses/${courseId}/modules`, icon: Layers },
        { title: "Lessons", url: `/admin/courses/${courseId}/lessons`, icon: FileText },
        { title: "Assessments", url: `/admin/courses/${courseId}/assessments`, icon: CheckSquare },
        { title: "Certificates", url: `/admin/courses/${courseId}/certificates`, icon: Award },
        { title: "Analytics", url: `/admin/courses/${courseId}/analytics`, icon: BarChart3 },
        { title: "Demographics", url: `/admin/courses/${courseId}/demographics`, icon: PieChart },
        { title: "Settings", url: `/admin/courses/${courseId}/settings`, icon: Settings },
    ];

    return (
        <SidebarProvider>
            {/* Course Specific Sidebar */}
            <Sidebar collapsible="icon" className="border-r border-border bg-card">
                <SidebarHeader className="py-4 px-2">
                    <Link href="/admin" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors duration-200 transition-colors uppercase tracking-widest mb-4 px-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Admin
                    </Link>
                    <div className="px-2">
                        <div className="flex items-center gap-3 mb-3 mt-1">
                            <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <BookOpen className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold leading-tight line-clamp-2 text-foreground">{courseName}</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Course Workspace</p>
                            </div>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarSeparator />
                
                <SidebarContent className="px-2 py-4">
                    <SidebarMenu>
                        {courseId && navItems.map((item) => {
                            const isOverview = item.url === `/admin/courses/${courseId}`;
                            const isActive = isOverview ? pathname === item.url : pathname.startsWith(item.url + '/') || pathname === item.url;
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton isActive={isActive} tooltip={item.title} render={<Link href={item.url} />} className="hover:bg-muted/50">
                                        <item.icon className="size-4 shrink-0" />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>

            {/* Main Content Area */}
            <SidebarInset className="flex flex-col flex-1 overflow-hidden h-screen bg-muted">
                <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 shadow-sm shadow-black/5 dark:shadow-none z-10 sticky top-0">
                    <SidebarTrigger className="-ml-1 text-muted-foreground" />
                    
                    {/* Breadcrumbs */}
                    <div className="flex-1 flex items-center text-sm font-medium text-muted-foreground">
                        <Link href="/admin/courses" className="hover:text-primary transition-colors">Courses</Link>
                        <span className="mx-2 text-gray-300">/</span>
                        <Link href={`/admin/courses/${courseId}`} className={`hover:text-primary transition-colors ${!moduleName ? 'text-foreground' : ''}`}>
                            {courseName}
                        </Link>
                        {moduleName && moduleId && (
                            <>
                                <span className="mx-2 text-gray-300">/</span>
                                <Link
                                    href={courseId ? `/admin/courses/${courseId}/modules/${moduleId}` : `/admin/modules/${moduleId}`}
                                    className={`hover:text-primary transition-colors ${!lessonName ? 'text-foreground' : ''}`}
                                >
                                    {moduleName}
                                </Link>
                            </>
                        )}
                        {lessonName && lessonId && (
                            <>
                                <span className="mx-2 text-gray-300">/</span>
                                <Link
                                    href={courseId && moduleId ? `/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}` : `/admin/lessons/${lessonId}`}
                                    className="text-foreground hover:text-primary transition-colors duration-200 transition-colors"
                                >
                                    {lessonName}
                                </Link>
                            </>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 ml-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="relative h-9 w-9 rounded-full ml-1 outline-none hover:opacity-80 transition-opacity">
                                <Avatar className="h-9 w-9 border border-border">
                                    {user?.profile_photo ? (
                                        <AvatarImage src={user.profile_photo} alt="Profile" className="h-full w-full object-cover rounded-full" />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                        {user?.first_name?.[0] || 'U'}
                                        {user?.last_name?.[0] || ''}
                                    </AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user?.first_name || 'User'} {user?.last_name || ''}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user?.email || 'user@example.com'}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <Link href="/profile" className="flex flex-row items-center w-full cursor-pointer">
                                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="flex flex-row items-center w-full text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                
                <div className="flex-1 overflow-auto p-6 lg:p-8">
                    {children}
                </div>
            </SidebarInset>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={() => { setIsLogoutModalOpen(false); logout(); }}
                title="Log out"
                message="Are you sure you want to log out?"
                confirmText="Log out"
            />
        </SidebarProvider>
    );
}
