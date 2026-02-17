import { Suspense } from 'react';
import Property3DManagerWrapper from '@/components/modules/realestate/properties/Property3DManagerWrapper';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function Property3DPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ModuleGuard moduleSlug="3d_viewer">
                <Property3DManagerWrapper mode="owner" />
            </ModuleGuard>
        </Suspense>
    );
}
