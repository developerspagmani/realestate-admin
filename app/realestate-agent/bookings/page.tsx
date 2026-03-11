'use client';

import { Suspense } from 'react';
import Loader from '@/components/common/Loader';
import AgentBookingsManager from '@/components/modules/realestate/agent/AgentBookingsManager';

export default function AgentBookingsPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><Loader size="md" message="Loading visits..." /></div>}>
            <AgentBookingsManager />
        </Suspense>
    );
}
