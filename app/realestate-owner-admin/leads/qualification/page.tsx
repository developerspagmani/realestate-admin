import { Suspense } from 'react';
import LeadsManager from '@/components/modules/realestate/leads/LeadsManager';

export default function OwnerLeadsQualificationPage() {
    return (
        <Suspense fallback={<div>Loading Qualification Hub...</div>}>
            <LeadsManager mode="owner" initialView="qualification" />
        </Suspense>
    );
}
