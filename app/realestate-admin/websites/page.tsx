'use client';

import WebsiteManager from '@/components/modules/realestate/website/WebsiteManager';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function AdminWebsitesPage() {
    return (
        <ModuleGuard moduleSlug="marketing_hub">
            <WebsiteManager mode="admin" />
        </ModuleGuard>
    );
}
