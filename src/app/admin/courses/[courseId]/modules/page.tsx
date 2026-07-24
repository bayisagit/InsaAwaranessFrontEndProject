'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ModulesManager } from '@/components/admin/ModulesManager';

export default function CourseModulesPage() {
    const params = useParams();
    const courseId = params.courseId as string;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <ModulesManager lockedCourseId={courseId} />
            </div>
        </div>
    );
}
