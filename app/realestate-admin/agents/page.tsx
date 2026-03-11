'use client';

import React, { Suspense } from 'react';
import AgentsManager from '@/components/modules/realestate/agents/AgentsManager';

export default function AdminAgentsPage() {
    return (
        <Suspense fallback={<div>Loading Agents...</div>}>
            <AgentsManager mode="admin" />
        </Suspense>
    );
}
