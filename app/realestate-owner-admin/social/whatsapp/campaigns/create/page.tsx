'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { whatsappApi, connectedAccountsApi } from '@/lib/api/social';

interface WhatsAppTemplate {
    id: string;
    name: string;
    language: string;
    components: any[];
}

interface ConnectedAccount {
    id: string;
    platform: string;
    accountName: string;
    accountId: string; // WABA ID
    metadata?: any;
}

function CreateWhatsAppCampaignContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const templateId = searchParams.get('template');

    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        accountId: '',
        phoneNumberId: '',
        templateName: '',
        recipients: '', // Comma separated numbers
        variables: {} as Record<string, string>
    });

    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const campaignId = searchParams.get('id');
            const [templatesRes, accountsRes, campaignRes] = await Promise.all([
                whatsappApi.getTemplates(),
                connectedAccountsApi.getAll({ platform: 'WHATSAPP' }),
                campaignId ? whatsappApi.getCampaignById(campaignId) : Promise.resolve(null)
            ]);

            let loadedTemplates: WhatsAppTemplate[] = [];
            if (templatesRes.success) {
                loadedTemplates = templatesRes.data.templates || [];
                setTemplates(loadedTemplates);

                // If templateId provided in URL, pre-select it
                if (templateId) {
                    const selectedTemplate = loadedTemplates.find(t => t.id === templateId);
                    if (selectedTemplate) {
                        setFormData(prev => ({ ...prev, templateName: selectedTemplate.name }));
                    }
                }
            }

            if (accountsRes.success) {
                const waAccounts = accountsRes.data.accounts || [];
                setAccounts(waAccounts);
                if (waAccounts.length > 0 && !campaignId) {
                    const firstAccount = waAccounts[0];
                    setFormData(prev => ({
                        ...prev,
                        accountId: firstAccount.accountId,
                        phoneNumberId: firstAccount.metadata?.phoneNumberId || ''
                    }));
                }
            }

            if (campaignRes?.success) {
                const campaign = campaignRes.data.campaign;
                setFormData(prev => ({
                    ...prev,
                    name: `${campaign.name} (Copy)`,
                    accountId: campaign.wabaId,
                    phoneNumberId: campaign.phoneNumberId,
                    templateName: campaign.templateName
                }));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleTemplateChange = (templateName: string) => {
        const template = templates.find(t => t.name === templateName);
        setFormData({ ...formData, templateName });

        // Reset variables when template changes
        setFormData(prev => ({ ...prev, variables: {} }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const recipientList = formData.recipients
                .split(',')
                .map(n => n.trim())
                .filter(n => n.length > 0)
                .map(phone => ({
                    phone,
                    components: [] // Logic for mapping variables would go here
                }));

            const res = await whatsappApi.createCampaign({
                name: formData.name,
                wabaId: formData.accountId,
                phoneNumberId: formData.phoneNumberId,
                templateName: formData.templateName,
                recipients: recipientList
            });

            if (res.success) {
                alert('Campaign created and messages sent successfully!');
                router.push(`${basePath}/social/whatsapp`);
            } else {
                alert(res.message || 'Failed to create campaign');
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <div className="mb-4">
                <button
                    onClick={() => router.back()}
                    className="btn btn-link text-decoration-none text-muted p-0 mb-2"
                >
                    <i className="bi bi-arrow-left me-1"></i> Back to WhatsApp
                </button>
                <h1 className="fw-bold h2">Create WhatsApp Campaign</h1>
                <p className="text-muted">Send bulk messages to your customers</p>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
                <form onSubmit={handleSubmit} className="card-body p-4 p-md-5">
                    <div className="row g-4">
                        {/* Campaign Name */}
                        <div className="col-12">
                            <label className="form-label fw-bold small text-muted text-uppercase">Campaign Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="form-control form-control-lg rounded-3 bg-light border-0"
                                placeholder="e.g., Summer Property Launch"
                            />
                        </div>

                        {/* Select Account */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold small text-muted text-uppercase">WhatsApp Account</label>
                            <select
                                required
                                value={formData.accountId}
                                onChange={(e) => {
                                    const acc = accounts.find(a => a.accountId === e.target.value);
                                    setFormData({
                                        ...formData,
                                        accountId: e.target.value,
                                        phoneNumberId: acc?.metadata?.phoneNumberId || ''
                                    });
                                }}
                                className="form-select form-select-lg rounded-3 bg-light border-0"
                            >
                                <option value="">Select Account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.accountId}>{acc.accountName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Phone Number ID */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold small text-muted text-uppercase">Phone Number ID</label>
                            <input
                                type="text"
                                required
                                value={formData.phoneNumberId}
                                onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                                className="form-control form-control-lg rounded-3 bg-light border-0"
                                placeholder="Meta Phone Number ID"
                            />
                            <small className="text-muted">Fetch this from your Meta App Settings</small>
                        </div>

                        {/* Select Template */}
                        <div className="col-12">
                            <label className="form-label fw-bold small text-muted text-uppercase">Message Template</label>
                            <select
                                required
                                value={formData.templateName}
                                onChange={(e) => handleTemplateChange(e.target.value)}
                                className="form-select form-select-lg rounded-3 bg-light border-0"
                            >
                                <option value="">Select a template</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.name}>{t.name} ({t.language})</option>
                                ))}
                            </select>
                            <div className="mt-2">
                                <button
                                    type="button"
                                    onClick={loadData}
                                    className="btn btn-link btn-sm p-0 text-success text-decoration-none"
                                >
                                    <i className="bi bi-arrow-repeat me-1"></i> Refresh Templates
                                </button>
                            </div>
                        </div>

                        {/* Recipients */}
                        <div className="col-12">
                            <label className="form-label fw-bold small text-muted text-uppercase">Recipients (Phone Numbers)</label>
                            <textarea
                                required
                                rows={4}
                                value={formData.recipients}
                                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                                className="form-control rounded-3 bg-light border-0"
                                placeholder="Enter numbers separated by commas (e.g., +1234567890, +0987654321)"
                            />
                            <small className="text-muted">Include country code without + or spaces if required by your API settings.</small>
                        </div>
                    </div>

                    <div className="mt-5 d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn btn-light px-4 rounded-pill"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-success px-5 rounded-pill shadow-sm"
                        >
                            {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
                            Send Campaign
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CreateWhatsAppCampaignPage() {
    return (
        <MainLayout activePage="social-campaigns">
            <Suspense fallback={<div className="container py-5 text-center">Loading Campaign Creator...</div>}>
                <CreateWhatsAppCampaignContent />
            </Suspense>
        </MainLayout>
    );
}

