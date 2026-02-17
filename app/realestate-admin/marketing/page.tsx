'use client';

import CampaignManager from '@/components/modules/realestate/marketing/CampaignManager';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function MarketingPage() {
    return (
        <ModuleGuard moduleSlug="marketing_hub">
            <CampaignManager />
        </ModuleGuard>
    );
}
