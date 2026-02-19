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

export default function AnalyticsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [platforms, setPlatforms] = useState<PlatformData[]>([]);
    const [engagement, setEngagement] = useState<EngagementData | null>(null);

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
            const [overviewRes, platformsRes, engagementRes] = await Promise.all([
                analyticsApi.getOverview(),
                analyticsApi.getPlatforms(),
                analyticsApi.getEngagement()
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
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <MainLayout activePage="social-analytics">
            <div className="container-fluid py-4 p-6">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="fw-bold h2 mb-1">Social Media Analytics</h1>
                    <p className="text-muted small">Track your performance across platforms</p>
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

                {/* Metrics Breakdown */}
                <div className="row g-4 mb-4">
                    {/* Platforms Breakdown */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                            <div className="card-header bg-white p-3 border-0">
                                <h5 className="mb-0 fw-bold">Platform Distribution</h5>
                            </div>
                            <div className="card-body p-4">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light border-0">
                                            <tr>
                                                <th className="border-0 px-3 py-2 small">Platform</th>
                                                <th className="border-0 px-3 py-2 small">Accounts</th>
                                                <th className="border-0 px-3 py-2 small text-end">Published</th>
                                            </tr>
                                        </thead>
                                        <tbody className="border-0">
                                            {platforms.map((p) => (
                                                <tr key={p.platform}>
                                                    <td className="px-3 border-0">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className={`rounded-circle p-2 bg-light`}>
                                                                {p.platform}
                                                            </div>
                                                            <span className="fw-medium">{p.platform}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 border-0">{p.connectedAccounts}</td>
                                                    <td className="px-3 border-0 text-end">
                                                        <span className="badge bg-success-subtle text-success px-3">{p.publishedPosts}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {platforms.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-4 text-muted">No platform data available</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Engagement Overview */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 h-100 bg-primary text-white overflow-hidden">
                            <div className="card-header bg-transparent p-3 border-0">
                                <h5 className="mb-0 fw-bold">Engagement Summary</h5>
                            </div>
                            <div className="card-body p-4">
                                {engagement ? (
                                    <div className="space-y-4">
                                        <div className="d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10 pb-3">
                                            <span>Total Likes</span>
                                            <span className="h4 fw-bold mb-0">{engagement.overall.totalLikes}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10 pb-3">
                                            <span>Total Comments</span>
                                            <span className="h4 fw-bold mb-0">{engagement.overall.totalComments}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10 pb-3">
                                            <span>Total Shares</span>
                                            <span className="h4 fw-bold mb-0">{engagement.overall.totalShares}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span>Total Reach</span>
                                            <span className="h4 fw-bold mb-0">{engagement.overall.totalReach}</span>
                                        </div>
                                        <div className="mt-4 pt-4 border-top border-white border-opacity-20 text-center">
                                            <div className="small opacity-75 mb-1">Avg Engagement Rate</div>
                                            <div className="h3 fw-bold mb-0">
                                                {engagement.overall.totalReach > 0
                                                    ? (((engagement.overall.totalLikes + engagement.overall.totalComments) / engagement.overall.totalReach) * 100).toFixed(2)
                                                    : '0.00'}%
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5 opacity-50">No engagement data</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-header bg-white p-3 border-0 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">Recent Activity</h5>
                        <button onClick={() => navigateTo('/social/published')} className="btn btn-sm btn-light rounded-pill px-3">View All</button>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light border-0">
                                    <tr>
                                        <th className="border-0 px-4 py-3 small">Post</th>
                                        <th className="border-0 px-4 py-3 small text-center">Platform</th>
                                        <th className="border-0 px-4 py-3 small text-end">Published At</th>
                                    </tr>
                                </thead>
                                <tbody className="border-0">
                                    {overview?.recentActivity?.map((activity, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 border-0">
                                                <div className="fw-medium">{activity.scheduledPost?.title || 'Untitled Post'}</div>
                                                <div className="small text-muted">{activity.scheduledPost?.property?.title || 'No Property'}</div>
                                            </td>
                                            <td className="px-4 border-0 text-center">
                                                <span className="badge bg-light text-dark">{activity.platform}</span>
                                            </td>
                                            <td className="px-4 border-0 text-end small">
                                                {new Date(activity.publishedAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!overview?.recentActivity || overview.recentActivity.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="text-center py-5 text-muted">No recent activity found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
