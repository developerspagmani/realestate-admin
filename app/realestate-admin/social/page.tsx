'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { analyticsApi, connectedAccountsApi, scheduledPostsApi, publishedPostsApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';

interface DashboardStats {
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
    };
}

export default function SocialDashboard() {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        connectedAccounts: 0,
        scheduledPosts: 0,
        publishedPosts: 0,
        drafts: 0
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

    // Determine the base path (either /realestate-admin or /realestate-owner-admin)
    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [overviewRes] = await Promise.all([
                analyticsApi.getOverview()
            ]);

            if (overviewRes.success) {
                setStats(overviewRes.data.summary);
                setRecentActivity(overviewRes.data.recentActivity || []);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigateTo = (path: string) => {
        router.push(`${basePath}${path}`);
    };

    if (loading) {
        return (
            <MainLayout activePage="social">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="social">
            <div className="container-fluid py-4 p-6">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Social Media Dashboard</h1>
                        <p className="text-muted small">Manage your social media presence and campaigns</p>
                    </div>
                    <button
                        onClick={() => navigateTo('/social/campaigns/create')}
                        className="btn btn-primary rounded-pill px-4"
                    >
                        <i className="bi bi-plus-lg me-2"></i> Create Campaign
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="row g-4 mb-4">
                    <div className="col-md-3">
                        <StatCard
                            label="Connected Accounts"
                            value={stats.connectedAccounts}
                            icon="bi-person-badge"
                            color="primary"
                            onClick={() => navigateTo('/social/accounts')}
                        />
                    </div>
                    <div className="col-md-3">
                        <StatCard
                            label="Scheduled Posts"
                            value={stats.scheduledPosts}
                            icon="bi-calendar-event"
                            color="info"
                            onClick={() => navigateTo('/social/scheduled')}
                        />
                    </div>
                    <div className="col-md-3">
                        <StatCard
                            label="Published Posts"
                            value={stats.publishedPosts}
                            icon="bi-send-check"
                            color="success"
                            onClick={() => navigateTo('/social/published')}
                        />
                    </div>
                    <div className="col-md-3">
                        <StatCard
                            label="Drafts"
                            value={stats.drafts}
                            icon="bi-file-earmark-text"
                            color="warning"
                            onClick={() => navigateTo('/social/scheduled?status=DRAFT')}
                        />
                    </div>
                </div>

                <div className="row g-4">
                    {/* Quick Actions */}
                    <div className="col-lg-12">
                        <div className="card border-0 shadow-sm rounded-4 mb-4">
                            <div className="card-header bg-white p-3 border-0">
                                <h5 className="mb-0 fw-bold">Quick Actions</h5>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <button
                                            onClick={() => navigateTo('/social/accounts')}
                                            className="btn btn-light w-100 p-4 rounded-4 text-start border-0 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                                                    <i className="bi bi-link-45deg fs-4"></i>
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-1 text-dark">Connect Account</h6>
                                                    <p className="small text-muted mb-0">Link your social accounts</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="col-md-4">
                                        <button
                                            onClick={() => navigateTo('/social/campaigns/create')}
                                            className="btn btn-light w-100 p-4 rounded-4 text-start border-0 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-success bg-opacity-10 p-3 rounded-circle text-success">
                                                    <i className="bi bi-megaphone fs-4"></i>
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-1 text-dark">Create Campaign</h6>
                                                    <p className="small text-muted mb-0">Schedule posts easily</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="col-md-4">
                                        <button
                                            onClick={() => navigateTo('/social/analytics')}
                                            className="btn btn-light w-100 p-4 rounded-4 text-start border-0 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-info bg-opacity-10 p-3 rounded-circle text-info">
                                                    <i className="bi bi-graph-up fs-4"></i>
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-1 text-dark">View Analytics</h6>
                                                    <p className="small text-muted mb-0">Track performance metrics</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="col-lg-12">
                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-header bg-white p-3 border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">Recent Activity</h5>
                                <button onClick={() => navigateTo('/social/published')} className="btn btn-sm btn-light rounded-pill px-3">View All</button>
                            </div>
                            <div className="card-body p-0">
                                {recentActivity.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light border-0">
                                                <tr>
                                                    <th className="border-0 px-4 py-3 small">Status</th>
                                                    <th className="border-0 px-4 py-3 small">Post</th>
                                                    <th className="border-0 px-4 py-3 small">Platform</th>
                                                    <th className="border-0 px-4 py-3 small text-end">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="border-0">
                                                {recentActivity.slice(0, 5).map((activity, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 border-0">
                                                            <div className="rounded-circle bg-success" style={{ width: '8px', height: '8px' }}></div>
                                                        </td>
                                                        <td className="px-4 border-0 fw-medium">
                                                            {activity.scheduledPost?.title || 'Untitled Post'}
                                                        </td>
                                                        <td className="px-4 border-0">
                                                            <span className="badge bg-light text-dark px-3 py-2 rounded-pill border">{activity.platform}</span>
                                                        </td>
                                                        <td className="px-4 border-0 text-end small text-muted">
                                                            {new Date(activity.publishedAt).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-5 text-muted small">
                                        No recent activity to display
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

