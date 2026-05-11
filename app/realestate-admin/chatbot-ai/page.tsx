'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import ModuleGuard from '@/components/common/ModuleGuard';
import ChatbotConfigManager from '@/components/modules/realestate/widgets/ChatbotConfigManager';
import { useAuthContext } from '@/app/contexts/AuthContext';

export default function ChatbotAiPage() {
    return (
        <MainLayout activePage="chatbot-ai">
            <ModuleGuard moduleSlug="discovery">
                <div className="container-fluid p-0">
                    <div className="bg-white border-bottom p-4 mb-4 shadow-sm">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h4 className="fw-bold mb-1 text-primary">
                                    <i className="bi bi-robot me-2"></i> Vipranix Neural Engine (Global)
                                </h4>
                                <p className="text-muted mb-0">Manage global conversational AI settings and Neural Core defaults.</p>
                            </div>
                            <div className="d-flex gap-2">
                                <div className="badge bg-primary-soft text-primary px-3 py-2 rounded-pill">
                                    <i className="bi bi-cpu me-1"></i> Gemini 1.5 Flash
                                </div>
                                <div className="badge bg-success-soft text-success px-3 py-2 rounded-pill">
                                    <i className="bi bi-shield-check me-1"></i> Admin Console
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-4 pb-5">
                        <ChatbotConfigManager onClose={() => {}} />
                    </div>
                </div>
            </ModuleGuard>

            <style jsx>{`
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.08); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.08); }
            `}</style>
        </MainLayout>
    );
}
