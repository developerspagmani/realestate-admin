import { Suspense } from 'react';
import Property3DManagerWrapper from '@/components/modules/realestate/properties/Property3DManagerWrapper';

export default function Property3DPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Property3DManagerWrapper mode="owner" />
        </Suspense>
    );
}
