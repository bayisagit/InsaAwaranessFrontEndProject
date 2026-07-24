'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CertificatesManager } from '@/components/admin/CertificatesManager';

export default function CourseCertificatesPage() {
    const params = useParams();
    const courseId = params.courseId as string;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <CertificatesManager lockedCourseId={courseId} />
        </div>
    );
}
