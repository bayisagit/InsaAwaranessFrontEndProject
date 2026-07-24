'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { LessonsManager } from '@/components/admin/LessonsManager';

export default function CourseLessonsPage() {
    const params = useParams();
    const courseId = params.courseId as string;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <LessonsManager lockedCourseId={courseId} />
            </div>
        </div>
    );
}
