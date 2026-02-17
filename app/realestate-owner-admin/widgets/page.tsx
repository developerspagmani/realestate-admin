'use client';

import WidgetManager from '@/components/modules/realestate/widgets/WidgetManager';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function OwnerWidgetsPage() {
    return (
        <ModuleGuard moduleSlug="widget_creator">
            <WidgetManager mode="owner" />
        </ModuleGuard>
    );
}
