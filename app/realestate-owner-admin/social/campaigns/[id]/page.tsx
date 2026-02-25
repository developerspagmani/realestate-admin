'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import { scheduledPostsApi, analyticsApi } from '@/lib/api/social';
import Loader from '@/components/common/Loader';

interface Campaign {
    id: string;
    title: string;
    description?: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    platforms: string[];
    mediaUrls?: string[];
    hashtags?: string;
    createdAt: string;
    publishedAt?: string;
    platformsData?: any[];
    publishedPosts?: any[];
    property?: {
        id: string;
        title: string;
        city: string;
    };
}

function CampaignDetailContent() {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const id = params.id as string;
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        reach: 0,
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagements: 0
    });

    // Determine the base path (either /realestate-admin or /realestate-owner-admin)
    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        if (id) {
            loadCampaign();
        }
    }, [id]);

    const loadCampaign = async () => {
        try {
            setLoading(true);
            const res = await scheduledPostsApi.getById(id);
            if (res.success && res.data) {
                const campaignData = res.data.post || res.data;
                setCampaign(campaignData);

                // If already posted, calculate metrics from publishedPosts
                if (campaignData.status === 'POSTED' && campaignData.publishedPosts) {
                    const aggregated = campaignData.publishedPosts.reduce((acc: any, post: any) => {
                        const m = post.metrics || {};
                        return {
                            reach: acc.reach + (m.reach || 0),
                            impressions: acc.impressions + (m.impressions || 0),
                            likes: acc.likes + (m.likes || 0),
                            comments: acc.comments + (m.comments || 0),
                            shares: acc.shares + (m.shares || 0),
                            engagements: acc.engagements + (m.engagement || m.engagements || 0)
                        };
                    }, { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, engagements: 0 });

                    setMetrics(aggregated);
                }
            }
        } catch (error) {
            console.error('Error loading campaign:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublishNow = async () => {
        if (!confirm('Publish this campaign immediately?')) return;

        try {
            setLoading(true);
            const res = await scheduledPostsApi.publishNow(id);
            if (res.success) {
                alert('Campaign published successfully!');
                loadCampaign();
            } else {
                alert(res.message || 'Failed to publish');
            }
        } catch (error) {
            console.error('Error publishing:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;

        try {
            setLoading(true);
            const res = await scheduledPostsApi.delete(id);
            if (res.success) {
                router.push(`${basePath}/social/campaigns`);
            }
        } catch (error) {
            console.error('Error deleting:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !campaign) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <Loader size="md" message="Loading campaign..." />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="text-center py-5">
                <h3>Campaign not found</h3>
                <button className="btn btn-primary mt-3" onClick={() => router.push(`${basePath}/social/campaigns`)}>
                    Back to List
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 p-6">
            <div className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <button
                        onClick={() => router.push(`${basePath}/social/campaigns`)}
                        className="btn btn-link text-muted p-0 mb-2 text-decoration-none small d-flex align-items-center gap-1"
                    >
                        <i className="bi bi-arrow-left"></i> Back to Campaigns
                    </button>
                    <h1 className="fw-bold h2 mb-0">{campaign.title}</h1>
                    <div className="d-flex align-items-center gap-2 mt-1">
                        <span className={`badge rounded-pill bg-${campaign.status === 'POSTED' ? 'success' : campaign.status === 'SCHEDULED' ? 'primary' : 'warning'} bg-opacity-10 text-${campaign.status === 'POSTED' ? 'success' : campaign.status === 'SCHEDULED' ? 'primary' : 'warning'}`}>
                            {campaign.status}
                        </span>
                        <span className="text-muted small">• Created on {new Date(campaign.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <button
                        onClick={() => router.push(`${basePath}/social/campaigns/create?repost=${id}`)}
                        className="btn btn-outline-info rounded-pill px-4"
                    >
                        <i className="bi bi-arrow-repeat me-2"></i> Re-post
                    </button>
                    {campaign.status === 'SCHEDULED' && (
                        <>
                            <button
                                onClick={() => router.push(`${basePath}/social/campaigns/${id}/edit`)}
                                className="btn btn-outline-primary rounded-pill px-4"
                            >
                                <i className="bi bi-pencil me-2"></i> Edit
                            </button>
                            <button onClick={handlePublishNow} className="btn btn-success rounded-pill px-4">
                                <i className="bi bi-send me-2"></i> Publish Now
                            </button>
                            <button onClick={handleDelete} className="btn btn-outline-danger rounded-pill px-4">
                                <i className="bi bi-trash me-1"></i>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    {/* Visual Preview */}
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                        <div className="row g-0">
                            <div className="col-md-5">
                                <img
                                    src={campaign.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'}
                                    className="w-100 h-100 object-fit-cover"
                                    style={{ minHeight: '300px' }}
                                    alt="Preview"
                                />
                            </div>
                            <div className="col-md-7">
                                <div className="card-body p-4 p-md-5">
                                    <div className="mb-4">
                                        <label className="fw-bold small text-muted text-uppercase mb-2">Description</label>
                                        <p className="text-dark" style={{ whiteSpace: 'pre-wrap' }}>{campaign.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="mb-4">
                                        <label className="fw-bold small text-muted text-uppercase mb-2">Hashtags</label>
                                        <p className="text-primary">{campaign.hashtags || '#realestate #property'}</p>
                                    </div>
                                    <div className="d-flex gap-4">
                                        <div>
                                            <label className="fw-bold small text-muted text-uppercase mb-1 d-block">Schedule</label>
                                            <div className="fw-bold text-dark">
                                                <i className="bi bi-calendar-event me-2"></i>
                                                {new Date(campaign.scheduledDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-muted small">{campaign.scheduledTime}</div>
                                        </div>
                                        <div>
                                            <label className="fw-bold small text-muted text-uppercase mb-1 d-block">Platforms</label>
                                            <div className="d-flex gap-2">
                                                {campaign.platforms.map(p => (
                                                    <i key={p} className={`bi bi-${p.toLowerCase()} text-primary fs-5`}></i>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    {campaign.status === 'POSTED' && (
                        <div className="row g-4 mb-4">
                            <div className="col-sm-6 col-md-4">
                                <StatCard label="Reach" value={metrics.reach.toLocaleString()} icon="bi-eye" color="info" />
                            </div>
                            <div className="col-sm-6 col-md-4">
                                <StatCard label="Engagements" value={metrics.engagements.toLocaleString()} icon="bi-activity" color="primary" />
                            </div>
                            <div className="col-sm-6 col-md-4">
                                <StatCard label="Likes" value={metrics.likes.toLocaleString()} icon="bi-heart" color="danger" />
                            </div>
                        </div>
                    )}

                    {/* Property Link */}
                    {campaign.property && (
                        <div className="card border-0 shadow-sm rounded-4 p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded-4">
                                        <i className="bi bi-house-door text-primary fs-3"></i>
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-0">Linked Property</h5>
                                        <p className="text-muted small mb-0">{campaign.property.title} • {campaign.property.city}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`${basePath}/properties/${campaign.property?.id}`)}
                                    className="btn btn-outline-primary rounded-pill px-4"
                                >
                                    View Property
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-lg-4">
                    {/* Platform Specifics */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                        <h5 className="fw-bold mb-4">Platform Overview</h5>
                        <div className="d-flex flex-column gap-3">
                            {campaign.platforms.map(platform => {
                                const publishedInfo = campaign.publishedPosts?.find(p => p.platform === platform);
                                const isPublished = !!publishedInfo && publishedInfo.status === 'published';
                                const isFailed = !!publishedInfo && publishedInfo.status === 'failed';

                                return (
                                    <div key={platform} className="d-flex align-items-center justify-content-between p-3 bg-light rounded-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <i className={`bi bi-${platform.toLowerCase()} fs-4 text-${platform.toLowerCase() === 'facebook' ? 'primary' : 'danger'}`}></i>
                                            <div>
                                                <div className="fw-bold text-dark">{platform}</div>
                                                <div className="text-muted small">
                                                    {isPublished ? 'Published' : isFailed ? 'Failed' : campaign.status}
                                                </div>
                                            </div>
                                        </div>
                                        {isPublished ? (
                                            <i className="bi bi-check-circle-fill text-success"></i>
                                        ) : isFailed ? (
                                            <i className="bi bi-exclamation-circle-fill text-danger"></i>
                                        ) : (
                                            <i className="bi bi-clock-history text-muted"></i>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h5 className="fw-bold mb-4">Activity Timeline</h5>
                        <div className="timeline-small">
                            <div className="timeline-item d-flex gap-3 mb-4">
                                <div className="timeline-icon bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                                    <i className="bi bi-plus small"></i>
                                </div>
                                <div>
                                    <div className="fw-bold small text-dark">Campaign Created</div>
                                    <div className="text-muted smaller">{new Date(campaign.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="timeline-item d-flex gap-3 mb-4">
                                <div className={`timeline-icon bg-${campaign.status === 'POSTED' ? 'success' : 'primary'} text-white rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '24px', height: '24px' }}>
                                    <i className={`bi bi-${campaign.status === 'POSTED' ? 'check' : 'clock'} small`}></i>
                                </div>
                                <div>
                                    <div className="fw-bold small text-dark">
                                        {campaign.status === 'POSTED' ? 'Successfully Published' : 'Scheduled for Publication'}
                                    </div>
                                    <div className="text-muted smaller">
                                        {campaign.status === 'POSTED' && campaign.publishedAt
                                            ? new Date(campaign.publishedAt).toLocaleString()
                                            : `${new Date(campaign.scheduledDate).toLocaleDateString()} at ${campaign.scheduledTime}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .min-vh-60 { min-height: 60vh; }
                .smaller { font-size: 0.75rem; }
                .timeline-small { position: relative; }
                .timeline-small::before {
                    content: '';
                    position: absolute;
                    left: 11px;
                    top: 24px;
                    bottom: 10px;
                    width: 2px;
                    background: #f1f1f1;
                }
            `}</style>
        </div>
    );
}

export default function CampaignDetailPage() {
    return (
        <MainLayout activePage="social-campaigns">
            <Suspense fallback={<div className="p-5 text-center">Loading...</div>}>
                <CampaignDetailContent />
            </Suspense>
        </MainLayout>
    );
}
