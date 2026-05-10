'use client';

import PopupManager from '@/components/modules/realestate/popups/PopupManager';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function AdminPopupsPage() {
    return (
        <ModuleGuard moduleSlug="website_cms">
            <PopupManager mode="admin" />
        </ModuleGuard>
    );
}
