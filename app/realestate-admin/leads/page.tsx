import { Suspense } from 'react';
import LeadsManager from '@/components/modules/realestate/leads/LeadsManager';
export default function AdminLeadsPage() {
    return (
        <Suspense fallback={<div>Loading Leads...</div>}>
            <LeadsManager mode="admin" />
        </Suspense>
    );
}
