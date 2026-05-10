'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import { scheduledPostsApi, analyticsApi } from '@/lib/api/social';
import Loader from '@/components/common/Loader';
import Toast from '@/components/common/Toast';

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
    const [comments, setComments] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

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

                // If already posted, calculate metrics and fetch detailed engagement
                if (campaignData.status === 'POSTED' && campaignData.publishedPosts && campaignData.publishedPosts.length > 0) {
                    // 1. Initial aggregate from stored metrics
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

                    // 2. Fetch fresh detailed engagement (including comments with name/id) and fresh metrics
                    try {
                        const promises = campaignData.publishedPosts.map((p: any) => 
                            fetch(`/api/social/posts/published/${p.id}/engagement`, {
                                headers: { Authorization: `Bearer ${getAuthToken()}` }
                            }).then(res => res.ok ? res.json() : null)
                        );
                        const results = await Promise.all(promises);
                        
                        // Set fresh metrics from live results
                        const freshMetrics = results.reduce((acc: any, r: any) => {
                            const m = r?.data?.summary || {};
                            return {
                                reach: acc.reach + (m.reach || 0),
                                impressions: acc.impressions + (m.impressions || 0),
                                likes: acc.likes + (m.likes || 0),
                                comments: acc.comments + (m.comments || 0),
                                shares: acc.shares + (m.shares || 0),
                                engagements: acc.engagements + (m.engagements || 0)
                            };
                        }, { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, engagements: 0 });
                        
                        setMetrics(freshMetrics);

                        const allComments = results.flatMap((r: any) => r?.data?.comments || []);
                        setComments(allComments);
                    } catch (e) {
                        console.warn('Failed to fetch initial engagement details:', e);
                    }
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
                showToast('Campaign published successfully!', 'success');
                loadCampaign();
            } else {
                showToast(res.message || 'Failed to publish', 'error');
            }
        } catch (error) {
            console.error('Error publishing:', error);
            showToast('An error occurred', 'error');
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
                    {campaign.status === 'POSTED' && (
                        <button
                            onClick={async () => {
                                try {
                                    setIsRefreshing(true);
                                    // Refresh metrics for each published post
                                    const promises = (campaign.publishedPosts || []).map(p => 
                                        fetch(`/api/social/posts/published/${p.id}/engagement`, {
                                            headers: { Authorization: `Bearer ${getAuthToken()}` }
                                        }).then(res => {
                                            if (!res.ok) throw new Error(`Fetch failed for post ${p.id}`);
                                            return res.json();
                                        })
                                    );
                                    const results = await Promise.all(promises);
                                    
                                    // 1. Calculate and set new metrics immediately from live results
                                    const freshMetrics = results.reduce((acc: any, r: any) => {
                                        const m = r?.data?.summary || {};
                                        return {
                                            reach: acc.reach + (m.reach || 0),
                                            impressions: acc.impressions + (m.impressions || 0),
                                            likes: acc.likes + (m.likes || 0),
                                            comments: acc.comments + (m.comments || 0),
                                            shares: acc.shares + (m.shares || 0),
                                            engagements: acc.engagements + (m.engagements || 0)
                                        };
                                    }, { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, engagements: 0 });
                                    
                                    setMetrics(freshMetrics);

                                    // 2. Collect all comments from results
                                    const allComments = results.flatMap((r: any) => r.data?.comments || []);
                                    setComments(allComments);
                                    
                                    showToast('Metrics refreshed successfully!', 'success');
                                    // loadCampaign(); // No longer necessary as main action for UI update
                                } catch (e) {
                                    console.error('Refresh failed:', e);
                                    showToast('Failed to refresh some metrics', 'error');
                                } finally {
                                    setIsRefreshing(false);
                                }
                            }}
                            className="btn btn-outline-success rounded-pill px-4"
                            disabled={isRefreshing || loading}
                        >
                            {isRefreshing ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            ) : (
                                <i className="bi bi-arrow-clockwise me-1"></i>
                            )}
                            Refresh Metrics
                        </button>
                    )}
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
                        <div className="mb-4">
                            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-graph-up-arrow text-primary"></i>
                                Campaign Performance
                            </h5>
                            <div className="row g-3">
                                <div className="col-6 col-md-3">
                                    <StatCard label="Reach" value={metrics.reach.toLocaleString()} icon="bi-eye" color="info" />
                                </div>
                                <div className="col-6 col-md-3">
                                    <StatCard label="Likes" value={metrics.likes.toLocaleString()} icon="bi-heart" color="danger" />
                                </div>
                                <div className="col-6 col-md-3">
                                    <StatCard label="Comments" value={metrics.comments.toLocaleString()} icon="bi-chat-dots" color="primary" />
                                </div>
                                <div className="col-6 col-md-3">
                                    <StatCard label="Shares" value={metrics.shares.toLocaleString()} icon="bi-reply" color="success" />
                                </div>
                                <div className="col-12 col-md-6 col-xl-4 d-none d-md-block">
                                    <StatCard label="Total Engagements" value={metrics.engagements.toLocaleString()} icon="bi-activity" color="warning" />
                                </div>
                                <div className="col-12 col-md-6 col-xl-4 d-none d-md-block">
                                    <StatCard label="Impressions" value={metrics.impressions.toLocaleString()} icon="bi-people" color="secondary" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Property Link */}
                    {campaign.property && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded-4">
                                        <i className="bi bi-house-door text-white fs-3"></i>
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

                    {/* Recent Comments Section */}
                    {campaign.status === 'POSTED' && (
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-header bg-white border-0 p-4 pb-0">
                                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                    <i className="bi bi-chat-left-text text-primary"></i>
                                    Recent Engagement
                                </h5>
                            </div>
                            <div className="card-body p-4">
                                {comments.length === 0 ? (
                                    <div className="text-center py-5 bg-light rounded-4">
                                        <i className="bi bi-chat-dots text-muted fs-1 mb-3 d-block"></i>
                                        <p className="text-muted mb-0">No comments found yet.</p>
                                        <p className="small text-muted">Click "Refresh Metrics" to check for new activity.</p>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {comments.map((comment, idx) => (
                                            <div key={comment.id || idx} className="p-3 bg-light rounded-4">
                                                <div className="d-flex gap-3">
                                                    <div className="position-relative">
                                                        <img 
                                                            src={comment.user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || 'User')}&background=${comment.platform === 'INSTAGRAM' ? 'E1306C' : '0D6EFD'}&color=fff`} 
                                                            alt={comment.user?.name}
                                                            className="rounded-circle border"
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                        />
                                                        <div className="position-absolute bottom-0 end-0 bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '18px', height: '18px', marginRight: '-2px', marginBottom: '-2px' }}>
                                                            <i className={`bi bi-${comment.platform?.toLowerCase() || 'facebook'} text-${comment.platform === 'INSTAGRAM' ? 'danger' : 'primary'}`} style={{ fontSize: '10px' }}></i>
                                                        </div>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                                            <div>
                                                                <span className="fw-bold text-dark small me-2">
                                                                    {comment.user?.name || (comment.platform === 'INSTAGRAM' ? 'Instagram User' : 'Facebook User')}
                                                                </span>
                                                                <span className="badge rounded-pill bg-white text-muted border smaller fw-normal" style={{ fontSize: '0.65rem' }}>
                                                                    {comment.platform === 'INSTAGRAM' ? 'IG' : 'FB'}
                                                                </span>
                                                            </div>
                                                            <span className="text-muted smaller" style={{ fontSize: '0.7rem' }}>
                                                                {new Date(comment.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-dark small mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                                            {comment.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                const m = publishedInfo?.metrics || {};

                                return (
                                    <div key={platform} className="p-3 bg-light rounded-4">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
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

                                        {isPublished && (
                                            <div className="row g-2 border-top pt-3 mt-1 text-center">
                                                <div className="col-4">
                                                    <div className="fw-bold text-dark small">{m.reach || 0}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>Reach</div>
                                                </div>
                                                <div className="col-4 border-start border-end">
                                                    <div className="fw-bold text-dark small">{m.likes || 0}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>Likes</div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="fw-bold text-dark small">{m.comments || 0}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>Comments</div>
                                                </div>
                                            </div>
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
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
}

export default function CampaignDetailsModule() {
    return (
        <MainLayout activePage="social-campaigns">
            <Suspense fallback={<div className="p-5 text-center">Loading...</div>}>
                <CampaignDetailContent />
            </Suspense>
        </MainLayout>
    );
}
