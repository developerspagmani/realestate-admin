'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { whatsappApi } from '@/lib/api/social';
import Loader from '@/components/common/Loader';

export default function WhatsAppCampaignDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [campaignRes, statsRes] = await Promise.all([
                whatsappApi.getCampaignById(id as string),
                whatsappApi.getCampaignStats(id as string)
            ]);

            if (campaignRes.success) setCampaign(campaignRes.data.campaign);
            if (statsRes.success) setStats(statsRes.data.stats);
        } catch (error) {
            console.error('Error loading campaign data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout activePage="social">
                <div className="container py-5 text-center">
                    <Loader size="md" message="Loading campaign details..." />
                </div>
            </MainLayout>
        );
    }

    if (!campaign) {
        return (
            <MainLayout activePage="social">
                <div className="container py-5 text-center">
                    <h3>Campaign not found</h3>
                    <button onClick={() => router.push(`${basePath}/social/whatsapp`)} className="btn btn-link">Back to WhatsApp</button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="social">
            <div className="container py-4">
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="btn btn-link text-decoration-none text-muted p-0 mb-2"
                        >
                            <i className="bi bi-arrow-left me-1"></i> Back
                        </button>
                        <h1 className="fw-bold h2">{campaign.name}</h1>
                        <p className="text-muted small">Campaign Details & Performance</p>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Stats Cards */}
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100 text-center p-4">
                            <div className="small text-muted mb-1">Sent</div>
                            <div className="h3 fw-bold mb-0">{campaign.sentCount}</div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100 text-center p-4">
                            <div className="small text-muted mb-1">Delivered</div>
                            <div className="h3 fw-bold mb-0 text-success">{campaign.deliveredCount}</div>
                            {stats && <div className="small text-muted mt-1">{stats.deliveryRate}% Rate</div>}
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100 text-center p-4">
                            <div className="small text-muted mb-1">Read</div>
                            <div className="h3 fw-bold mb-0 text-primary">{campaign.readCount}</div>
                            {stats && <div className="small text-muted mt-1">{stats.readRate}% Rate</div>}
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100 text-center p-4">
                            <div className="small text-muted mb-1">Failed</div>
                            <div className="h3 fw-bold mb-0 text-danger">{campaign.failedCount}</div>
                        </div>
                    </div>

                    {/* Information */}
                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-header bg-transparent border-0 p-4">
                                <h5 className="fw-bold mb-0">General Information</h5>
                            </div>
                            <div className="card-body p-4 pt-0">
                                <div className="row g-4">
                                    <div className="col-md-6 border-end">
                                        <div className="mb-4">
                                            <label className="small text-muted text-uppercase fw-bold mb-1">Status</label>
                                            <div><span className="badge bg-success-subtle text-success rounded-pill">{campaign.status}</span></div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="small text-muted text-uppercase fw-bold mb-1">Template Used</label>
                                            <div className="fw-medium">{campaign.templateName}</div>
                                        </div>
                                        <div>
                                            <label className="small text-muted text-uppercase fw-bold mb-1">Account ID (WABA)</label>
                                            <div className="font-monospace small">{campaign.wabaId}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-4">
                                            <label className="small text-muted text-uppercase fw-bold mb-1">Created At</label>
                                            <div>{new Date(campaign.createdAt).toLocaleString()}</div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="small text-muted text-uppercase fw-bold mb-1">Phone Number ID</label>
                                            <div className="font-monospace small">{campaign.phoneNumberId}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
