'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import StatCard from '@/components/StatCard';
import { analyticsApi, connectedAccountsApi, publishedPostsApi, scheduledPostsApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';
import ModuleGuard from '@/components/common/ModuleGuard';
import Loader from '@/components/common/Loader';

export default function SocialDashboard() {
    return (
        <ModuleGuard moduleSlug="social_posts">
            <DashboardContent />
        </ModuleGuard>
    );
}

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

function DashboardContent() {
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
                    <Loader size="md" message="Loading dashboard..." />
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
                        <h1 className="fw-bold h2 mb-1">Social Dashboard</h1>
                        <p className="text-muted small">Overview of your social media engagement</p>
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
                            label="Active Campaigns"
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
                </div>

                <div className="row g-4">
                    {/* Recent Activity */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                            <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Recent Activity</h5>
                                <button onClick={() => navigateTo('/social/analytics')} className="btn btn-link btn-sm text-decoration-none p-0">View All</button>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4 py-3 border-0 small">Platform</th>
                                            <th className="px-4 py-3 border-0 small">Campaign</th>
                                            <th className="px-4 py-3 border-0 small text-end">Published At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentActivity.length > 0 ? (
                                            recentActivity.map((activity, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 border-0">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <i className={`bi bi-${activity.platform.toLowerCase()} text-${activity.platform.toLowerCase() === 'facebook' ? 'primary' : activity.platform.toLowerCase() === 'instagram' ? 'danger' : 'info'}`}></i>
                                                            <span className="small fw-medium">{activity.platform}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 border-0">
                                                        <span className="small text-dark fw-bold">{activity.scheduledPost?.title || 'Untitled Post'}</span>
                                                    </td>
                                                    <td className="px-4 py-3 border-0 text-end">
                                                        <span className="small text-muted">{new Date(activity.publishedAt).toLocaleDateString()}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center py-5 text-muted small">No recent activity found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Quick Tools */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 mb-4">
                            <div className="card-header bg-white p-4 border-0">
                                <h5 className="fw-bold mb-0">Quick Actions</h5>
                            </div>
                            <div className="card-body p-4 pt-0">
                                <div className="d-grid gap-3">
                                    <button onClick={() => navigateTo('/social/accounts')} className="btn btn-outline-primary text-start p-3 rounded-4 d-flex align-items-center gap-3">
                                        <i className="bi bi-person-plus fs-4"></i>
                                        <div>
                                            <div className="fw-bold small">Manage Accounts</div>
                                            <div className="text-muted small">Connect social platforms</div>
                                        </div>
                                    </button>
                                    <button onClick={() => navigateTo('/social/whatsapp')} className="btn btn-outline-success text-start p-3 rounded-4 d-flex align-items-center gap-3">
                                        <i className="bi bi-whatsapp fs-4"></i>
                                        <div>
                                            <div className="fw-bold small">WhatsApp Business</div>
                                            <div className="text-muted small">Templates & messages</div>
                                        </div>
                                    </button>
                                    <button onClick={() => navigateTo('/social/analytics')} className="btn btn-outline-info text-start p-3 rounded-4 d-flex align-items-center gap-3">
                                        <i className="bi bi-bar-chart fs-4"></i>
                                        <div>
                                            <div className="fw-bold small">View Analytics</div>
                                            <div className="text-muted small">Track performance</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
