'use client';

import CMSManager from '@/components/modules/realestate/cms/CMSManager';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function CMSPage() {
    return (
        <ModuleGuard moduleSlug="website_cms">
            <CMSManager mode="owner" />
        </ModuleGuard>
    );
}
