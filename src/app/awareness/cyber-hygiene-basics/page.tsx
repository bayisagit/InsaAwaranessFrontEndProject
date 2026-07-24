import React from 'react';
import { AwarenessTopicTemplate } from '@/components/awareness/AwarenessTopicTemplate';
import { awarenessTopics } from '@/lib/awarenessData';

export default function CyberHygieneBasicsPage() {
    return <AwarenessTopicTemplate topic={awarenessTopics[5]} />;
}
