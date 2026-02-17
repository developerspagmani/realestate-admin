'use client';

import CMSManager from '@/components/modules/realestate/cms/CMSManager';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function AdminCMSPage() {
    return (
        <ModuleGuard moduleSlug="marketing_hub">
            <CMSManager mode="admin" />
        </ModuleGuard>
    );
}
