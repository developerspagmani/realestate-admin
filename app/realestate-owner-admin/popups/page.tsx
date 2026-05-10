'use client';
import PopupManager from '@/components/modules/realestate/popups/PopupManager';
import ModuleGuard from '@/components/common/ModuleGuard';
export default function OwnerPopupsPage() {
    return (
        <ModuleGuard moduleSlug="popups">
            <PopupManager mode="owner" />
        </ModuleGuard>
    );
}
