'use client';

import ChatbotConfigManager from '@/components/modules/realestate/widgets/ChatbotConfigManager';
import MainLayout from '@/components/MainLayout';

export default function ChatbotConfigPage() {
    return (
        <MainLayout activePage="chatbot-config">
            <div className="container-fluid p-4">
                <div className="mb-4">
                    <h4 className="fw-bold mb-1">Global Chatbot Wizard</h4>
                    <p className="text-muted mb-0">Configure your organization's primary AI engagement settings</p>
                </div>
                <ChatbotConfigManager propertyId="" onClose={() => { }} />
            </div>
        </MainLayout>
    );
}
