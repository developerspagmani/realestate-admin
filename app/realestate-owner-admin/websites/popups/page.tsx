'use client';

import PopupManager from '@/components/modules/realestate/website/PopupManager';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function OwnerPopupsPage() {
    return (
        <ModuleGuard moduleSlug="website_cms">
            <PopupManager mode="owner" />
        </ModuleGuard>
    );
}
