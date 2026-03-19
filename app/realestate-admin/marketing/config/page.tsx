'use client';

import EmailConfiguration from '@/components/modules/realestate/marketing/EmailConfiguration';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function EmailConfigPage() {
    return (
        <ModuleGuard moduleSlug="marketing_hub">
            <EmailConfiguration mode="admin" />
        </ModuleGuard>
    );
}
