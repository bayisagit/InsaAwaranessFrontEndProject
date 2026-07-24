'use client';

import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarFooter } from '@/components/ui/sidebar';
import { BookOpen, Layers, FileText, CheckSquare, Paperclip, Award, Settings, ArrowLeft, LayoutDashboard, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { apiFetch, getModule, getLesson, getAssessment } from '@/lib/api';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from '@/context/AuthContext';

interface CourseWorkspaceLayoutProps {
    children: React.ReactNode;
}

export function CourseWorkspaceLayout({ children }: CourseWorkspaceLayoutProps) {
    const pathname = usePathname() || '';
    const params = useParams();
    const { user } = useAuth();
    const [courseId, setCourseId] = useState<string | null>(null);
    const [courseName, setCourseName] = useState<string>('Loading...');
    const [moduleName, setModuleName] = useState<string | null>(null);
    const [lessonName, setLessonName] = useState<string | null>(null);

    // Resolve hierarchy based on current URL
    useEffect(() => {
        const resolveContext = async () => {
            let resolvedCourseId = null;
            if (pathname.startsWith('/admin/courses/') && params.courseId) {
                resolvedCourseId = params.courseId as string;
                if (resolvedCourseId !== 'create') {
                    setCourseId(resolvedCourseId);
                    const { data } = await apiFetch(`/api/v1/courses/${resolvedCourseId}/`);
                    if (data?.title) setCourseName(data.title);
                }
            } else if (pathname.startsWith('/admin/modules/') && params.moduleId) {
                const moduleId = params.moduleId as string;
                if (moduleId !== 'create') {
                    const { data: moduleData } = await getModule(moduleId);
                    if (moduleData) {
                        setModuleName(moduleData.title);
                        resolvedCourseId = moduleData.course;
                        setCourseId(resolvedCourseId);
                        const { data } = await apiFetch(`/api/v1/courses/${resolvedCourseId}/`);
                        if (data?.title) setCourseName(data.title);
                    }
                }
            } else if (pathname.startsWith('/admin/lessons/') && params.lessonId) {
                const lessonId = params.lessonId as string;
                if (lessonId !== 'create') {
                    const { data: lessonData } = await getLesson(lessonId);
                    if (lessonData) {
                        setLessonName(lessonData.title);
                        const { data: moduleData } = await getModule(lessonData.module);
                        if (moduleData) {
                            setModuleName(moduleData.title);
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
        { title: "Resources", url: `/admin/courses/${courseId}/resources`, icon: Paperclip },
        { title: "Certificates", url: `/admin/courses/${courseId}/certificates`, icon: Award },
        { title: "Settings", url: `/admin/courses/${courseId}/settings`, icon: Settings },
    ];

    return (
        <SidebarProvider>
            {/* Course Specific Sidebar */}
            <Sidebar collapsible="icon" className="border-r border-gray-200 bg-white">
                <SidebarHeader className="py-4 px-2">
                    <Link href="/admin" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors uppercase tracking-widest mb-4 px-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Admin
                    </Link>
                    <div className="px-2">
                        <div className="flex items-center gap-3 mb-3 mt-1">
                            <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <BookOpen className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold leading-tight line-clamp-2 text-gray-900">{courseName}</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Course Workspace</p>
                            </div>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarSeparator />
                
                <SidebarContent className="px-2 py-4">
                    <SidebarMenu>
                        {courseId && navItems.map((item) => {
                            const isActive = pathname === item.url;
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="hover:bg-gray-100">
                                        <Link href={item.url} className="flex items-center gap-3 w-full">
                                            <item.icon className="size-4 shrink-0" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>

            {/* Main Content Area */}
            <SidebarInset className="flex flex-col flex-1 overflow-hidden h-screen bg-gray-50">
                <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 shadow-sm z-10 sticky top-0">
                    <SidebarTrigger className="-ml-1 text-gray-500" />
                    
                    {/* Breadcrumbs */}
                    <div className="flex-1 flex items-center text-sm font-medium text-gray-500">
                        <Link href="/admin/courses" className="hover:text-primary transition-colors">Courses</Link>
                        <span className="mx-2 text-gray-300">/</span>
                        <Link href={`/admin/courses/${courseId}`} className={`hover:text-primary transition-colors ${!moduleName ? 'text-gray-900' : ''}`}>
                            {courseName}
                        </Link>
                        {moduleName && (
                            <>
                                <span className="mx-2 text-gray-300">/</span>
                                <span className={`${!lessonName ? 'text-gray-900' : ''}`}>{moduleName}</span>
                            </>
                        )}
                        {lessonName && (
                            <>
                                <span className="mx-2 text-gray-300">/</span>
                                <span className="text-gray-900">{lessonName}</span>
                            </>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-gray-200">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                {user?.first_name?.[0] || 'U'}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </header>
                
                <div className="flex-1 overflow-auto p-6 lg:p-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
