'use client';

import WebsiteManager from '@/components/modules/realestate/website/WebsiteManager';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function OwnerWebsitesPage() {
    return (
        <ModuleGuard moduleSlug="website_cms">
            <WebsiteManager mode="owner" />
        </ModuleGuard>
    );
}
