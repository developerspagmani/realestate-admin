'use client';

import TenantForm from '@/components/modules/realestate/tenants/TenantForm';
import { useParams } from 'next/navigation';

export default function UpdateTenantPage() {
    const params = useParams();
    const id = params.id as string;
    
    return <TenantForm tenantId={id} />;
}
