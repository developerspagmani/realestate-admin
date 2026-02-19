'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { analyticsApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';

interface OverviewSummary {
    connectedAccounts: number;
    scheduledPosts: number;
    publishedPosts: number;
    drafts: number;
}

interface RecentActivity {
    platform: string;
    publishedAt: string;
    scheduledPost?: {
        title: string;
        property?: {
            title: string;
        };
    };
}

interface AnalyticsOverview {
    summary: OverviewSummary;
    recentActivity: RecentActivity[];
}

interface PlatformData {
    platform: string;
    connectedAccounts: number;
    publishedPosts: number;
}

interface EngagementMetrics {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
}

interface EngagementOverall {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalReach: number;
}

interface EngagementData {
    overall: EngagementOverall;
    byPlatform: Record<string, EngagementMetrics>;
}

interface PropertyAnalytics {
    propertyId: string;
    propertyTitle: string;
    totalPosts: number;
    platforms: string[];
}

export default function AnalyticsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [platforms, setPlatforms] = useState<PlatformData[]>([]);
    const [engagement, setEngagement] = useState<EngagementData | null>(null);
    const [propertyData, setPropertyData] = useState<PropertyAnalytics[]>([]);

    // Determine the base path (either /realestate-admin or /realestate-owner-admin)
    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadAnalytics();
    }, []);

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
    };

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [overviewRes, platformsRes, engagementRes, propertyRes] = await Promise.all([
                analyticsApi.getOverview(),
                analyticsApi.getPlatforms(),
                analyticsApi.getEngagement(),
                analyticsApi.getProperties()
            ]);

            if (overviewRes.success) {
                setOverview(overviewRes.data);
            }

            if (platformsRes.success) {
                setPlatforms(platformsRes.data.platforms || []);
            }

            if (engagementRes.success) {
                setEngagement(engagementRes.data);
            }

            if (propertyRes.success) {
                setPropertyData(propertyRes.data.properties || []);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout activePage="social-analytics">
                <div className="d-flex align-items-center justify-content-center min-vh-60">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="social-analytics">
            <div className="container-fluid py-4 p-6">
                {/* Header */}
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Social Media Analytics</h1>
                        <p className="text-muted small">Comprehensive track of your platform performance</p>
                    </div>
                </div>

                {/* Overview Stats */}
                {overview && (
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <StatCard
                                label="Connected Accounts"
                                value={overview.summary?.connectedAccounts || 0}
                                icon="bi-person-check"
                                color="primary"
                                onClick={() => navigateTo('/social/accounts')}
                            />
                        </div>
                        <div className="col-md-3">
                            <StatCard
                                label="Scheduled Posts"
                                value={overview.summary?.scheduledPosts || 0}
                                icon="bi-calendar-event"
                                color="info"
                                onClick={() => navigateTo('/social/scheduled')}
                            />
                        </div>
                        <div className="col-md-3">
                            <StatCard
                                label="Published Posts"
                                value={overview.summary?.publishedPosts || 0}
                                icon="bi-send-check"
                                color="success"
                                onClick={() => navigateTo('/social/published')}
                            />
                        </div>
                        <div className="col-md-3">
                            <StatCard
                                label="Drafts"
                                value={overview.summary?.drafts || 0}
                                icon="bi-file-earmark-text"
                                color="warning"
                                onClick={() => navigateTo('/social/scheduled?status=DRAFT')}
                            />
                        </div>
                    </div>
                )}

                <div className="row g-4">
                    {/* Platform Performance */}
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-transparent border-0 p-4 pb-0">
                                <h2 className="h5 fw-bold mb-0">Platform Performance</h2>
                            </div>
                            <div className="card-body p-4">
                                {platforms.length > 0 ? (
                                    <div className="d-flex flex-column gap-3">
                                        {platforms.map((platform, index) => (
                                            <div key={index} className="d-flex align-items-center justify-content-between p-3 bg-light rounded-4">
                                                <div>
                                                    <h3 className="h6 fw-bold mb-1 text-dark">{platform.platform}</h3>
                                                    <p className="small text-muted mb-0">
                                                        {platform.connectedAccounts} account(s) connected
                                                    </p>
                                                </div>
                                                <div className="text-end">
                                                    <p className="h4 fw-bold text-primary mb-0">{platform.publishedPosts}</p>
                                                    <p className="small text-muted mb-0">posts published</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-bar-chart-line display-4 mb-3 d-block opacity-25"></i>
                                        <p className="mb-0">No platform data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Engagement Overview */}
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-transparent border-0 p-4 pb-0">
                                <h2 className="h5 fw-bold mb-0">Engagement Metrics</h2>
                            </div>
                            <div className="card-body p-4">
                                {engagement ? (
                                    <>
                                        <div className="row g-3 mb-4">
                                            <div className="col-6">
                                                <div className="p-3 border rounded-4 bg-light text-center">
                                                    <p className="small text-muted mb-1">Total Likes</p>
                                                    <p className="h3 fw-bold text-danger mb-0">{engagement.overall?.totalLikes?.toLocaleString() || 0}</p>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="p-3 border rounded-4 bg-light text-center">
                                                    <p className="small text-muted mb-1">Total Comments</p>
                                                    <p className="h3 fw-bold text-primary mb-0">{engagement.overall?.totalComments?.toLocaleString() || 0}</p>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="p-3 border rounded-4 bg-light text-center">
                                                    <p className="small text-muted mb-1">Total Shares</p>
                                                    <p className="h3 fw-bold text-success mb-0">{engagement.overall?.totalShares?.toLocaleString() || 0}</p>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="p-3 border rounded-4 bg-light text-center">
                                                    <p className="small text-muted mb-1">Total Reach</p>
                                                    <p className="h3 fw-bold text-purple mb-0">{engagement.overall?.totalReach?.toLocaleString() || 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Platform Specific */}
                                        {engagement.byPlatform && Object.keys(engagement.byPlatform).length > 0 && (
                                            <div>
                                                <h3 className="small fw-bold text-uppercase text-muted mb-3">By Platform</h3>
                                                <div className="d-flex flex-column gap-2">
                                                    {Object.entries(engagement.byPlatform).map(([platform, metrics]) => (
                                                        <div key={platform} className="p-3 border rounded-4 small">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="fw-bold">{platform}</span>
                                                                <span className="badge bg-primary-subtle text-primary rounded-pill">{metrics.reach?.toLocaleString()} reach</span>
                                                            </div>
                                                            <div className="row g-2 text-center opacity-75">
                                                                <div className="col-4 border-end">
                                                                    <div className="fw-bold text-danger">{metrics.likes?.toLocaleString()}</div>
                                                                    <div className="text-muted" style={{ fontSize: '10px' }}>Likes</div>
                                                                </div>
                                                                <div className="col-4 border-end">
                                                                    <div className="fw-bold text-primary">{metrics.comments?.toLocaleString()}</div>
                                                                    <div className="text-muted" style={{ fontSize: '10px' }}>Comments</div>
                                                                </div>
                                                                <div className="col-4">
                                                                    <div className="fw-bold text-success">{metrics.shares?.toLocaleString()}</div>
                                                                    <div className="text-muted" style={{ fontSize: '10px' }}>Shares</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-graph-up display-4 mb-3 d-block opacity-25"></i>
                                        <p className="mb-0">No engagement data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Property Insights */}
                {propertyData.length > 0 && (
                    <div className="card border-0 shadow-sm rounded-4 mt-4">
                        <div className="card-header bg-transparent border-0 p-4 pb-0">
                            <h2 className="h5 fw-bold mb-0">Property-Based Insights</h2>
                            <p className="text-muted small mb-0">Engagement metrics grouped by real estate properties</p>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-4">
                                {propertyData.map((prop, index) => (
                                    <div key={index} className="col-md-6 col-lg-4">
                                        <div className="p-3 bg-light rounded-4 h-100 border transition-all hover-shadow">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h3 className="h6 fw-bold mb-1 text-dark text-truncate" style={{ maxWidth: '200px' }}>
                                                        {prop.propertyTitle}
                                                    </h3>
                                                    <span className="badge bg-primary-subtle text-primary rounded-pill small">
                                                        {prop.totalPosts} Campaigns
                                                    </span>
                                                </div>
                                                <div className="d-flex gap-1">
                                                    {prop.platforms.map(p => (
                                                        <i key={p} className={`bi bi-${p.toLowerCase()} small text-muted opacity-50`}></i>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 mt-auto">
                                                <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                                    <div
                                                        className="progress-bar bg-primary rounded-pill"
                                                        role="progressbar"
                                                        style={{ width: `${Math.min(100, (prop.totalPosts / 5) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="smaller text-muted">{prop.totalPosts}/5 Goal</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Activity */}
                {overview?.recentActivity && overview.recentActivity.length > 0 && (
                    <div className="card border-0 shadow-sm rounded-4 mt-4">
                        <div className="card-header bg-transparent border-0 p-4 pb-0">
                            <h2 className="h5 fw-bold mb-0">Recent Activity</h2>
                        </div>
                        <div className="card-body p-4">
                            <div className="list-group list-group-flush gap-2">
                                {overview.recentActivity.map((activity, index) => (
                                    <div key={index} className="list-group-item border-0 bg-light rounded-4 p-3 d-flex align-items-center justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-success rounded-circle shadow-sm" style={{ width: '10px', height: '10px' }}></div>
                                            <div>
                                                <p className="fw-bold text-dark mb-0">
                                                    {activity.scheduledPost?.title || 'Post'}
                                                </p>
                                                <p className="small text-muted mb-0">
                                                    Published on {activity.platform}
                                                    {activity.scheduledPost?.property && ` • ${activity.scheduledPost.property.title}`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="small text-muted">
                                            {new Date(activity.publishedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .text-purple { color: #6f42c1 !important; }
                .min-vh-60 { min-height: 60vh; }
                .hvr-float { transition: transform 0.2s ease-in-out; }
                .hvr-float:hover { transform: translateY(-5px); }
            `}</style>
        </MainLayout>
    );
}



