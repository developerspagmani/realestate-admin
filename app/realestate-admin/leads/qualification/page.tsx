import { Suspense } from 'react';
import LeadsManager from '@/components/modules/realestate/leads/LeadsManager';

export default function AdminLeadsQualificationPage() {
    return (
        <Suspense fallback={<div>Loading Qualification Hub...</div>}>
            <LeadsManager mode="admin" initialView="qualification" />
        </Suspense>
    );
}
