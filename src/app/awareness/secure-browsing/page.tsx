import React from 'react';
import { AwarenessTopicTemplate } from '@/components/awareness/AwarenessTopicTemplate';
import { awarenessTopics } from '@/lib/awarenessData';

export default function SecureBrowsingPage() {
    return <AwarenessTopicTemplate topic={awarenessTopics[2]} />;
}
