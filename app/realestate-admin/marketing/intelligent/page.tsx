'use client';

import MainLayout from '@/components/MainLayout';
import IntelligentEmailManager from '@/components/modules/realestate/marketing/IntelligentEmailManager';
import ModuleGuard from '@/components/common/ModuleGuard';
import { useManagementContext } from '@/app/contexts/ManagementContext';

export default function IntelligentEmailPage() {
    const { activeTenantId } = useManagementContext();

    return (
        <MainLayout activePage="intelligent-email">
            <ModuleGuard moduleSlug="marketing_hub">
                <div className="container-fluid py-4">
                    <div className="mb-4">
                        <h1 className="fw-bold h2 mb-1">Intelligent Automation</h1>
                        <p className="text-muted small">AI-driven property recommendation engine.</p>
                    </div>
                    <IntelligentEmailManager
                        tenantId={activeTenantId || ''}
                        leadsPath="/realestate-admin/leads"
                    />
                </div>
            </ModuleGuard>
        </MainLayout>
    );
}
