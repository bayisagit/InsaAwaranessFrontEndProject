import React from 'react';
import { AwarenessTopicTemplate } from '@/components/awareness/AwarenessTopicTemplate';
import { awarenessTopics } from '@/lib/awarenessData';

export default function IncidentResponsePage() {
    return <AwarenessTopicTemplate topic={awarenessTopics[4]} />;
}
