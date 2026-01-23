'use client';

import { useParams } from 'next/navigation';
import PropertyTourManager from '@/components/modules/realestate/tour/PropertyTourManager';

export default function PropertyTourPage() {
    const params = useParams();
    const propertyId = params.propertyId as string;

    if (!propertyId) return null;

    return <PropertyTourManager propertyId={propertyId} />;
}
