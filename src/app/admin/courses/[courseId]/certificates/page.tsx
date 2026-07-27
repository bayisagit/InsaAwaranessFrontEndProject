'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CertificatesManager } from '@/components/admin/CertificatesManager';

export default function CourseCertificatesPage() {
    const params = useParams();
    const courseId = params.courseId as string;

    return (
        <div className="bg-card rounded-xl shadow-sm shadow-black/5 dark:shadow-none border border-border overflow-hidden">
            <CertificatesManager lockedCourseId={courseId} />
        </div>
    );
}
