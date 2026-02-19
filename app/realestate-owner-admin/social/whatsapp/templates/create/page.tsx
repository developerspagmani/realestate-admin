'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { whatsappApi, connectedAccountsApi } from '@/lib/api/social';

export default function CreateWhatsAppTemplatePage() {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        category: 'MARKETING',
        language: 'en_US',
        wabaId: '',
        bodyText: ''
    });

    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const res = await connectedAccountsApi.getAll({ platform: 'WHATSAPP' });
            if (res.success) {
                const waAccounts = res.data.accounts || [];
                setAccounts(waAccounts);
                if (waAccounts.length > 0) {
                    setFormData(prev => ({ ...prev, wabaId: waAccounts[0].accountId }));
                }
            }
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simplified components structure for Meta API
            const components = [
                {
                    type: 'BODY',
                    text: formData.bodyText
                }
            ];

            const res = await whatsappApi.createTemplate({
                wabaId: formData.wabaId,
                name: formData.name.toLowerCase().replace(/\s+/g, '_'),
                category: formData.category,
                language: formData.language,
                components
            });

            if (res.success) {
                alert('Template submitted successfully and is pending approval from Meta.');
                router.push(`${basePath}/social/whatsapp`);
            } else {
                alert(res.message || 'Failed to create template');
            }
        } catch (error) {
            console.error('Error creating template:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout activePage="social">
            <div className="container py-4">
                <div className="mb-4">
                    <button
                        onClick={() => router.back()}
                        className="btn btn-link text-decoration-none text-muted p-0 mb-2"
                    >
                        <i className="bi bi-arrow-left me-1"></i> Back to WhatsApp
                    </button>
                    <h1 className="fw-bold h2">Create WhatsApp Template</h1>
                    <p className="text-muted">New templates require approval from Meta before they can be used.</p>
                </div>

                <div className="card border-0 shadow-sm rounded-4">
                    <form onSubmit={handleSubmit} className="card-body p-4 p-md-5">
                        <div className="row g-4">
                            {/* WhatsApp Account */}
                            <div className="col-12">
                                <label className="form-label fw-bold small text-muted text-uppercase">WhatsApp Business Account</label>
                                <select
                                    required
                                    value={formData.wabaId}
                                    onChange={(e) => setFormData({ ...formData, wabaId: e.target.value })}
                                    className="form-select form-select-lg rounded-3 bg-light border-0"
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.accountId}>{acc.accountName} ({acc.accountId})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Template Name */}
                            <div className="col-md-6">
                                <label className="form-label fw-bold small text-muted text-uppercase">Template Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-control form-control-lg rounded-3 bg-light border-0"
                                    placeholder="e.g., welcome_message"
                                />
                                <small className="text-muted">Use lowercase and underscores only.</small>
                            </div>

                            {/* Category */}
                            <div className="col-md-3">
                                <label className="form-label fw-bold small text-muted text-uppercase">Category</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="form-select form-select-lg rounded-3 bg-light border-0"
                                >
                                    <option value="MARKETING">Marketing</option>
                                    <option value="UTILITY">Utility</option>
                                    <option value="AUTHENTICATION">Authentication</option>
                                </select>
                            </div>

                            {/* Language */}
                            <div className="col-md-3">
                                <label className="form-label fw-bold small text-muted text-uppercase">Language</label>
                                <select
                                    required
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    className="form-select form-select-lg rounded-3 bg-light border-0"
                                >
                                    <option value="en_US">English (US)</option>
                                    <option value="en_GB">English (UK)</option>
                                    <option value="es_ES">Spanish</option>
                                    <option value="fr_FR">French</option>
                                    <option value="ar">Arabic</option>
                                </select>
                            </div>

                            {/* Body Text */}
                            <div className="col-12">
                                <label className="form-label fw-bold small text-muted text-uppercase">Message Body</label>
                                <textarea
                                    required
                                    rows={6}
                                    value={formData.bodyText}
                                    onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                                    className="form-control rounded-3 bg-light border-0"
                                    placeholder="Enter your message here..."
                                />
                                <div className="mt-2 p-3 bg-info bg-opacity-10 rounded-3 border-start border-info border-4">
                                    <small className="text-info d-block fw-bold mb-1"><i className="bi bi-info-circle me-1"></i> Tip:</small>
                                    <small className="text-muted">Use {"{{1}}"}, {"{{2}}"} etc., to add placeholders for dynamic content like customer names or property details.</small>
                                </div>
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
                                Submit for Approval
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
