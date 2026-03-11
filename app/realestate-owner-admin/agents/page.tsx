'use client';

import React, { Suspense } from 'react';
import AgentsManager from '@/components/modules/realestate/agents/AgentsManager';

export default function AgentsPage() {
    return (
        <Suspense fallback={<div>Loading Agents...</div>}>
            <AgentsManager mode="owner" />
        </Suspense>
    );
}
