'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CourseLearnerView } from '@/components/CourseLearnerView';

export default function CoursePreviewPage() {
    const { courseId } = useParams<{ courseId: string }>();
    return <CourseLearnerView courseId={courseId} previewMode={true} />;
}
