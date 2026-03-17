'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { analyticsApi, publishedPostsApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';
import StatCard from '@/components/StatCard';
import Loader from '@/components/common/Loader';

/* ────────────────────────────── Types ───────────────────────────────── */
interface OverviewSummary { connectedAccounts: number; scheduledPosts: number; publishedPosts: number; drafts: number; }
interface RecentActivity { id: string; platform: string; publishedAt: string; platformPostId?: string; scheduledPost?: { title: string; property?: { title: string; }; }; }
interface AnalyticsOverview { summary: OverviewSummary; recentActivity: RecentActivity[]; }
interface PlatformData { platform: string; connectedAccounts: number; publishedPosts: number; }
interface EngagementMetrics { likes: number; comments: number; shares: number; reach: number; posts: number; }
interface EngagementData { overall: { totalLikes: number; totalComments: number; totalShares: number; totalReach: number; totalPosts: number; }; byPlatform: Record<string, EngagementMetrics>; }
interface PropertyAnalytics { propertyId: string; propertyTitle: string; totalPosts: number; platforms: string[]; }

interface ForecastDay { date: string; predicted: number; low: number; high: number; }
interface HistoricalDay { date: string; count: number; totalEngagement: number; }
interface ForecastInsights {
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    trendSlope: number;
    bestPostingDay: string;
    totalPostsLast30Days: number;
    avgEngagementPerPost: number;
    projectedMonthly: number;
    dataPoints: number;
}
interface ForecastData { historical: HistoricalDay[]; forecast: ForecastDay[]; insights: ForecastInsights; }

interface Comment {
    id: string;
    message: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        picture?: string;
    };
}

interface PostEngagement {
    summary: {
        likes: number;
        comments: number;
        shares: number;
        reach: number;
    };
    comments: Comment[];
}

/* ─────────────────────── Mini bar chart component ───────────────────── */
function MiniBarChart({ data, forecastData, color = '#6366f1' }: {
    data: HistoricalDay[];
    forecastData?: ForecastDay[];
    color?: string;
}) {
    const allVals = [
        ...data.map(d => d.count),
        ...(forecastData?.map(d => d.high) || [])
    ];
    const max = Math.max(...allVals, 1);
    const barW = 8;
    const gap = 2;
    const chartH = 80;
    const totalBars = data.length + (forecastData?.length || 0);
    const chartW = totalBars * (barW + gap);

    return (
        <div className="overflow-auto w-100">
            <svg width={chartW} height={chartH + 24} style={{ display: 'block' }}>
                {/* Historical bars */}
                {data.map((d, i) => {
                    const h = Math.max(2, (d.count / max) * chartH);
                    const x = i * (barW + gap);
                    return (
                        <g key={`h-${i}`}>
                            <rect x={x} y={chartH - h} width={barW} height={h}
                                fill={color} opacity={0.7} rx={2} />
                            {i % 7 === 0 && (
                                <text x={x} y={chartH + 16} fontSize={8} fill="#999">
                                    {d.date.slice(5)}
                                </text>
                            )}
                        </g>
                    );
                })}
                {/* Forecast bars (hatched / lighter) */}
                {forecastData?.map((d, i) => {
                    const h = Math.max(2, (d.predicted / max) * chartH);
                    const x = (data.length + i) * (barW + gap);
                    return (
                        <g key={`f-${i}`}>
                            <rect x={x} y={chartH - h} width={barW} height={h}
                                fill={color} opacity={0.28} rx={2} strokeDasharray="2,2"
                                stroke={color} strokeWidth={1} />
                            {i === 0 && (
                                <line x1={x - 1} y1={0} x2={x - 1} y2={chartH}
                                    stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="4,2" />
                            )}
                            {i % 7 === 0 && (
                                <text x={x} y={chartH + 16} fontSize={8} fill="#aaa">
                                    {d.date.slice(5)}
                                </text>
                            )}
                        </g>
                    );
                })}
                {/* Today marker */}
                <line x1={data.length * (barW + gap) - 1} y1={0}
                    x2={data.length * (barW + gap) - 1} y2={chartH}
                    stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,2" />
            </svg>
            <div className="d-flex gap-3 mt-1">
                <span className="d-flex align-items-center gap-1 extra-small text-muted">
                    <span style={{ width: 10, height: 10, background: color, opacity: 0.7, borderRadius: 2, display: 'inline-block' }} />
                    Actual (30d)
                </span>
                <span className="d-flex align-items-center gap-1 extra-small text-muted">
                    <span style={{ width: 10, height: 10, background: color, opacity: 0.28, border: `1px dashed ${color}`, borderRadius: 2, display: 'inline-block' }} />
                    AI Forecast (14d)
                </span>
                <span className="d-flex align-items-center gap-1 extra-small text-muted">
                    <span style={{ width: 14, height: 2, background: '#f59e0b', display: 'inline-block' }} />
                    Today
                </span>
            </div>
        </div>
    );
}

/* ────────────────────────── Main Page ──────────────────────────────── */
export default function AnalyticsModule() {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [forecastLoading, setForecastLoading] = useState(true);

    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [platforms, setPlatforms] = useState<PlatformData[]>([]);
    const [engagement, setEngagement] = useState<EngagementData | null>(null);
    const [propertyData, setPropertyData] = useState<PropertyAnalytics[]>([]);
    const [forecast, setForecast] = useState<ForecastData | null>(null);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    const [selectedPost, setSelectedPost] = useState<RecentActivity | null>(null);
    const [engagementDetails, setEngagementDetails] = useState<PostEngagement | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    const navigateTo = (path: string) => router.push(`${basePath}${path}`);

    const loadAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (dateRange.startDate) params.startDate = dateRange.startDate;
            if (dateRange.endDate) params.endDate = dateRange.endDate;

            const [overviewRes, platformsRes, engagementRes, propertyRes] = await Promise.all([
                analyticsApi.getOverview(params),
                analyticsApi.getPlatforms(),
                analyticsApi.getEngagement(),
                analyticsApi.getProperties()
            ]);

            if (overviewRes.success) setOverview(overviewRes.data);
            if (platformsRes.success) setPlatforms(platformsRes.data.platforms || []);
            if (engagementRes.success) setEngagement(engagementRes.data);
            if (propertyRes.success) setPropertyData(propertyRes.data.properties || []);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    const loadForecast = useCallback(async () => {
        try {
            setForecastLoading(true);
            const res = await analyticsApi.getForecast();
            if (res.success) setForecast(res.data);
        } catch (error) {
            console.error('Forecast load error:', error);
        } finally {
            setForecastLoading(false);
        }
    }, []);

    useEffect(() => { loadAnalytics(); }, [loadAnalytics]);
    useEffect(() => { loadForecast(); }, [loadForecast]);

    const handleViewPostDetails = async (activity: RecentActivity) => {
        if (activity.platform !== 'FACEBOOK' && activity.platform !== 'INSTAGRAM') {
            return; // Only Facebook/Instagram supported for now
        }

        setSelectedPost(activity);
        setEngagementDetails(null);
        setDetailsError(null);
        setDetailsLoading(true);

        try {
            const res = await publishedPostsApi.getEngagementDetails(activity.id);
            if (res.success) {
                setEngagementDetails(res.data);
            } else {
                setDetailsError(res.message || 'Unable to load engagement details.');
            }
        } catch (error: any) {
            console.error('Error fetching post details:', error);
            setDetailsError(error.message || 'An unexpected error occurred.');
        } finally {
            setDetailsLoading(false);
        }
    };

    const trendIcon = (dir?: string) =>
        dir === 'increasing' ? '↗' : dir === 'decreasing' ? '↘' : '→';
    const trendColor = (dir?: string) =>
        dir === 'increasing' ? 'text-success' : dir === 'decreasing' ? 'text-danger' : 'text-warning';

    if (loading) {
        return (
            <MainLayout activePage="social-analytics">
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                    <Loader size="md" message="Loading analytics..." />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="social-analytics">
            <div className="container-fluid py-4">

                {/* ── Header ────────────────────────────────────────────── */}
                <div className="mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Social Media Analytics</h1>
                        <p className="text-muted small mb-0">Comprehensive performance tracking + AI-powered forecasting</p>
                    </div>
                    {/* Date range filter */}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <input type="date" className="form-control form-control-sm rounded-3"
                            value={dateRange.startDate}
                            onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))} />
                        <span className="text-muted small">to</span>
                        <input type="date" className="form-control form-control-sm rounded-3"
                            value={dateRange.endDate}
                            onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))} />
                        <button className="btn btn-primary btn-sm rounded-3 px-3 fw-bold" onClick={loadAnalytics}>
                            <i className="bi bi-funnel me-1"></i>Apply
                        </button>
                        <button className="btn btn-outline-secondary btn-sm rounded-3 px-3" onClick={() => {
                            setDateRange({ startDate: '', endDate: '' });
                            setTimeout(loadAnalytics, 50);
                        }}>
                            <i className="bi bi-x-circle me-1"></i>Clear
                        </button>
                    </div>
                </div>

                {/* ── Overview Stat Cards ───────────────────────────────── */}
                {overview && (
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <StatCard label="Connected Accounts" value={overview.summary?.connectedAccounts || 0}
                                icon="bi-person-check" color="primary" onClick={() => navigateTo('/social/accounts')} />
                        </div>
                        <div className="col-md-3">
                            <StatCard label="Scheduled Posts" value={overview.summary?.scheduledPosts || 0}
                                icon="bi-calendar-event" color="info" onClick={() => navigateTo('/social/scheduled')} />
                        </div>
                        <div className="col-md-3">
                            <StatCard label="Published Posts" value={overview.summary?.publishedPosts || 0}
                                icon="bi-send-check" color="success" onClick={() => navigateTo('/social/published')} />
                        </div>
                        <div className="col-md-3">
                            <StatCard label="Drafts" value={overview.summary?.drafts || 0}
                                icon="bi-file-earmark-text" color="warning" onClick={() => navigateTo('/social/scheduled?status=DRAFT')} />
                        </div>
                    </div>
                )}

                {/* ── AI Forecasting Section ─────────────────────────────── */}
                <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                    <div className="card-header border-0 p-4 pb-3 d-flex justify-content-between align-items-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                        <div>
                            <h2 className="h5 fw-bold mb-1 text-white d-flex align-items-center gap-2">
                                <i className="bi bi-stars"></i>
                                Forecasting AI Prediction
                            </h2>
                            <p className="small text-white opacity-75 mb-0">
                                Linear regression model trained on your last 30 days of posting activity
                            </p>
                        </div>
                        <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold" onClick={loadForecast}>
                            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
                        </button>
                    </div>

                    <div className="card-body p-4">
                        {forecastLoading ? (
                            <div className="text-center py-5">
                                <Loader size="sm" message="Running model..." />
                            </div>
                        ) : forecast ? (
                            <>
                                {/* Insight KPI row */}
                                <div className="row g-3 mb-4">
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 bg-light rounded-4 text-center h-100">
                                            <div className={`h3 fw-black mb-0 ${trendColor(forecast.insights.trendDirection)}`}>
                                                {trendIcon(forecast.insights.trendDirection)}
                                            </div>
                                            <div className="small fw-bold">Trend</div>
                                            <div className="extra-small text-muted text-capitalize">
                                                {forecast.insights.trendDirection}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 bg-light rounded-4 text-center h-100">
                                            <div className="h3 fw-black mb-0 text-primary">
                                                {forecast.insights.projectedMonthly}
                                            </div>
                                            <div className="small fw-bold">Projected / Month</div>
                                            <div className="extra-small text-muted">posts</div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 bg-light rounded-4 text-center h-100">
                                            <div className="h3 fw-black mb-0 text-success">
                                                {forecast.insights.bestPostingDay}
                                            </div>
                                            <div className="small fw-bold">Best Posting Day</div>
                                            <div className="extra-small text-muted">most activity</div>
                                        </div>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <div className="p-3 bg-light rounded-4 text-center h-100">
                                            <div className="h3 fw-black mb-0 text-warning">
                                                {forecast.insights.avgEngagementPerPost}
                                            </div>
                                            <div className="small fw-bold">Avg Engagement</div>
                                            <div className="extra-small text-muted">per post</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bar Chart */}
                                <div className="p-3 bg-light rounded-4 mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0 small text-uppercase text-muted">
                                            Daily Posts — Last 30 Days + 14-Day Forecast
                                        </h6>
                                        <span className="badge bg-purple-subtle text-purple rounded-pill extra-small">
                                            {forecast.insights.dataPoints} data points
                                        </span>
                                    </div>
                                    <MiniBarChart
                                        data={forecast.historical}
                                        forecastData={forecast.forecast}
                                        color="#6366f1"
                                    />
                                </div>

                                {/* 14-day forecast table */}
                                <div>
                                    <h6 className="fw-bold mb-3 small text-uppercase text-muted">
                                        14-Day Predicted Schedule
                                    </h6>
                                    <div className="row g-2">
                                        {forecast.forecast.map((d, i) => (
                                            <div key={i} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                                <div className="p-2 bg-light rounded-3 text-center border border-primary border-opacity-10">
                                                    <div className="extra-small text-muted">{d.date.slice(5)}</div>
                                                    <div className="fw-bold text-primary">{d.predicted}</div>
                                                    <div className="extra-small text-muted" style={{ fontSize: '9px' }}>
                                                        {d.low}–{d.high}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Model note */}
                                <div className="mt-3 p-2 bg-info bg-opacity-10 rounded-3 border border-info border-opacity-25">
                                    <p className="extra-small text-info mb-0 d-flex align-items-center gap-2">
                                        <i className="bi bi-info-circle-fill"></i>
                                        <span>
                                            Predictions are based on ordinary least squares linear regression (slope: {forecast.insights.trendSlope}).
                                            Accuracy improves with more published posts. Seed test metrics via
                                            <code className="ms-1">PUT /api/social/posts/published/:id/metrics</code>
                                        </span>
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-stars display-4 mb-3 d-block opacity-25"></i>
                                <p className="mb-0">No historical data available yet. Publish posts to enable forecasting.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Platform + Engagement row ──────────────────────────── */}
                <div className="row g-4 mb-4">
                    {/* Platform Performance */}
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-transparent border-0 p-4 pb-0">
                                <h2 className="h5 fw-bold mb-0">Platform Performance</h2>
                            </div>
                            <div className="card-body p-4">
                                {platforms.length > 0 ? (
                                    <div className="d-flex flex-column gap-3">
                                        {platforms.map((platform, index) => {
                                            const icon = platform.platform.toLowerCase();
                                            return (
                                                <div key={index} className="d-flex align-items-center justify-content-between p-3 bg-light rounded-4">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="bg-white rounded-3 p-2 shadow-sm">
                                                            <i className={`bi bi-${icon} fs-5`}></i>
                                                        </div>
                                                        <div>
                                                            <h3 className="h6 fw-bold mb-0 text-dark text-capitalize">{platform.platform}</h3>
                                                            <p className="small text-muted mb-0">{platform.connectedAccounts} account(s) connected</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-end">
                                                        <p className="h4 fw-bold text-primary mb-0">{platform.publishedPosts}</p>
                                                        <p className="small text-muted mb-0">posts</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                            <div className="card-header bg-transparent border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
                                <h2 className="h5 fw-bold mb-0">Engagement Metrics</h2>
                                <span className="badge bg-warning-subtle text-warning rounded-pill extra-small fw-bold">
                                    <i className="bi bi-info-circle me-1"></i>Requires platform sync
                                </span>
                            </div>
                            <div className="card-body p-4">
                                {engagement ? (
                                    <>
                                        <div className="row g-3 mb-4">
                                            {[
                                                { label: 'Total Likes', val: engagement.overall?.totalLikes, color: 'danger', icon: 'bi-heart-fill' },
                                                { label: 'Comments', val: engagement.overall?.totalComments, color: 'primary', icon: 'bi-chat-dots-fill' },
                                                { label: 'Shares', val: engagement.overall?.totalShares, color: 'success', icon: 'bi-share-fill' },
                                                { label: 'Reach', val: engagement.overall?.totalReach, color: 'warning', icon: 'bi-eye-fill' },
                                            ].map(({ label, val, color, icon }) => (
                                                <div key={label} className="col-6">
                                                    <div className="p-3 border rounded-4 bg-light text-center">
                                                        <i className={`bi ${icon} text-${color} mb-1 d-block`}></i>
                                                        <p className="small text-muted mb-1">{label}</p>
                                                        <p className={`h3 fw-bold text-${color} mb-0`}>
                                                            {(val || 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {engagement.byPlatform && Object.keys(engagement.byPlatform).length > 0 && (
                                            <div>
                                                <h3 className="small fw-bold text-uppercase text-muted mb-3">By Platform</h3>
                                                <div className="d-flex flex-column gap-2">
                                                    {Object.entries(engagement.byPlatform).map(([platform, metrics]) => (
                                                        <div key={platform} className="p-3 border rounded-4 small">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="fw-bold text-capitalize">{platform}</span>
                                                                <span className="badge bg-primary-subtle text-primary rounded-pill">
                                                                    {(metrics.reach || 0).toLocaleString()} reach
                                                                </span>
                                                            </div>
                                                            <div className="row g-2 text-center">
                                                                <div className="col-4 border-end">
                                                                    <div className="fw-bold text-danger">{(metrics.likes || 0).toLocaleString()}</div>
                                                                    <div className="text-muted" style={{ fontSize: '10px' }}>Likes</div>
                                                                </div>
                                                                <div className="col-4 border-end">
                                                                    <div className="fw-bold text-primary">{(metrics.comments || 0).toLocaleString()}</div>
                                                                    <div className="text-muted" style={{ fontSize: '10px' }}>Comments</div>
                                                                </div>
                                                                <div className="col-4">
                                                                    <div className="fw-bold text-success">{(metrics.shares || 0).toLocaleString()}</div>
                                                                    <div className="text-muted" style={{ fontSize: '10px' }}>Shares</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {engagement.overall?.totalLikes === 0 && engagement.overall?.totalReach === 0 && (
                                            <div className="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-4 mt-3">
                                                <p className="extra-small text-warning mb-1 fw-bold">
                                                    <i className="bi bi-exclamation-triangle me-2"></i>All engagement values are zero
                                                </p>
                                                <p className="extra-small text-muted mb-0">
                                                    To populate real data, use <code>PUT /api/social/posts/published/:id/metrics</code> with
                                                    <code className="ms-1">{'{ metrics: { likes, comments, shares, reach } }'}</code>
                                                    — or integrate a platform webhook to sync automatically.
                                                </p>
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

                {/* ── Property Insights ─────────────────────────────────── */}
                {propertyData.length > 0 && (
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-header bg-transparent border-0 p-4 pb-0">
                            <h2 className="h5 fw-bold mb-1">Property-Based Insights</h2>
                            <p className="text-muted small mb-0">Social campaigns grouped by property</p>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-4">
                                {propertyData.map((prop, index) => (
                                    <div key={index} className="col-md-6 col-lg-4">
                                        <div className="p-3 bg-light rounded-4 h-100 border hover-shadow transition-all">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h3 className="h6 fw-bold mb-1 text-truncate" style={{ maxWidth: '200px' }}>
                                                        {prop.propertyTitle}
                                                    </h3>
                                                    <span className="badge bg-primary-subtle text-primary rounded-pill small">
                                                        {prop.totalPosts} Campaigns
                                                    </span>
                                                </div>
                                                <div className="d-flex gap-1 flex-wrap">
                                                    {prop.platforms.map(p => (
                                                        <i key={p} className={`bi bi-${p.toLowerCase()} small text-muted`}></i>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 mt-auto">
                                                <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                                    <div className="progress-bar bg-primary rounded-pill" role="progressbar"
                                                        style={{ width: `${Math.min(100, (prop.totalPosts / 10) * 100)}%` }}>
                                                    </div>
                                                </div>
                                                <span className="extra-small text-muted">{prop.totalPosts}/10</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Recent Activity ───────────────────────────────────── */}
                {overview?.recentActivity && overview.recentActivity.length > 0 && (
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-transparent border-0 p-4 pb-0">
                            <h2 className="h5 fw-bold mb-0">Recent Activity</h2>
                        </div>
                        <div className="card-body p-4">
                            <div className="d-flex flex-column gap-2">
                                {overview.recentActivity.map((activity, index) => (
                                    <div key={index}
                                        onClick={() => handleViewPostDetails(activity)}
                                        className={`d-flex align-items-center justify-content-between p-3 bg-light rounded-4 ${activity.platform === 'FACEBOOK' || activity.platform === 'INSTAGRAM' ? 'cursor-pointer hover-bg-light-dark border-start border-4 border-info' : ''}`}
                                        title={activity.platform === 'FACEBOOK' || activity.platform === 'INSTAGRAM' ? 'Click to view real-time comments' : ''}>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-success rounded-circle shadow-sm flex-shrink-0"
                                                style={{ width: '10px', height: '10px' }}></div>
                                            <div>
                                                <p className="fw-bold text-dark mb-0 small">
                                                    {activity.scheduledPost?.title || 'Post'}
                                                </p>
                                                <p className="extra-small text-muted mb-0">
                                                    Published on <span className="text-capitalize">{activity.platform}</span>
                                                    {activity.scheduledPost?.property && ` · ${activity.scheduledPost.property.title}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            {(activity.platform === 'FACEBOOK' || activity.platform === 'INSTAGRAM') && (
                                                <span className="badge bg-info-subtle text-info extra-small rounded-pill px-2">
                                                    <i className="bi bi-eye me-1"></i>View Details
                                                </span>
                                            )}
                                            <span className="extra-small text-muted flex-shrink-0">
                                                {new Date(activity.publishedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Post Details Modal ────────────────────────────────── */}
                {selectedPost && (
                    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                                <div className="modal-header border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
                                    <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                        <i className={`bi bi-${selectedPost.platform.toLowerCase()} text-primary`}></i>
                                        Post Engagement Details
                                    </h5>
                                    <button type="button" className="btn-close shadow-none" onClick={() => setSelectedPost(null)}></button>
                                </div>
                                <div className="modal-body p-4 pt-3">
                                    <div className="mb-4 p-3 bg-light rounded-4">
                                        <h6 className="fw-bold mb-1">{selectedPost.scheduledPost?.title}</h6>
                                        <p className="small text-muted mb-0">
                                            Published on {new Date(selectedPost.publishedAt).toLocaleString()}
                                        </p>
                                    </div>

                                    {detailsLoading ? (
                                        <div className="text-center py-5">
                                            <Loader size="sm" message="Fetching real-time metrics..." />
                                        </div>
                                    ) : engagementDetails ? (
                                        <>
                                            <div className="row g-3 mb-4">
                                                <div className="col-md-3">
                                                    <div className="p-3 bg-danger bg-opacity-10 rounded-4 text-center">
                                                        <i className="bi bi-heart-fill text-danger d-block mb-1"></i>
                                                        <div className="h4 fw-bold text-danger mb-0">{engagementDetails.summary?.likes || 0}</div>
                                                        <div className="extra-small text-muted">Likes</div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="p-3 bg-info bg-opacity-10 rounded-4 text-center">
                                                        <i className="bi bi-chat-dots-fill text-primary d-block mb-1"></i>
                                                        <div className="h4 fw-bold text-primary mb-0">{engagementDetails.summary?.comments || 0}</div>
                                                        <div className="extra-small text-muted">Comments</div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="p-3 bg-success bg-opacity-10 rounded-4 text-center">
                                                        <i className="bi bi-share-fill text-success d-block mb-1"></i>
                                                        <div className="h4 fw-bold text-success mb-0">{engagementDetails.summary?.shares || 0}</div>
                                                        <div className="extra-small text-muted">Shares</div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="p-3 bg-warning bg-opacity-10 rounded-4 text-center">
                                                        <i className="bi bi-eye-fill text-warning d-block mb-1"></i>
                                                        <div className="h4 fw-bold text-warning mb-0">{engagementDetails.summary?.reach || 0}</div>
                                                        <div className="extra-small text-muted">Reach</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                                <i className="bi bi-chat-right-text"></i>
                                                Recent Comments ({engagementDetails.comments.length})
                                            </h6>

                                            {engagementDetails.comments.length > 0 ? (
                                                <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: '400px' }}>
                                                    {engagementDetails.comments.map((comment, i) => (
                                                        <div key={i} className="d-flex gap-3 p-3 bg-light rounded-4">
                                                            <div className="flex-shrink-0">
                                                                {comment.user.picture ? (
                                                                    <img src={comment.user.picture} alt="" className="rounded-circle shadow-sm" width="40" height="40" />
                                                                ) : (
                                                                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" style={{ width: 40, height: 40 }}>
                                                                        {comment.user.name?.charAt(0) || '?'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <span className="fw-bold small">{comment.user.name}</span>
                                                                    <span className="extra-small text-muted">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="small mb-1 text-dark">{comment.message}</p>
                                                                <div className="extra-small text-muted">
                                                                    User ID: <code className="bg-white px-1 rounded">{comment.user.id}</code>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 bg-light rounded-4 text-muted">
                                                    <i className="bi bi-chat-dots display-6 mb-2 d-block opacity-25"></i>
                                                    <p className="small mb-0">No comments found for this post yet.</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-5 text-muted">
                                            <i className="bi bi-exclamation-triangle display-4 text-danger mb-3 d-block opacity-50"></i>
                                            <p className="text-danger fw-bold">{detailsError || 'Unable to load engagement details.'}</p>
                                            <p className="small">
                                                {detailsError?.toLowerCase().includes('access token') || detailsError?.toLowerCase().includes('session has expired')
                                                    ? 'Your social media session has expired. Please reconnect your account to continue.'
                                                    : "Please check if the social account is still connected and the post hasn't been deleted from the platform."}
                                            </p>
                                            <div className="d-flex justify-content-center gap-2 mt-3">
                                                <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => handleViewPostDetails(selectedPost)}>
                                                    <i className="bi bi-arrow-clockwise me-1"></i>Try Again
                                                </button>
                                                {(detailsError?.toLowerCase().includes('access token') || detailsError?.toLowerCase().includes('session has expired')) && (
                                                    <button className="btn btn-sm btn-primary rounded-pill" onClick={() => router.push(`${basePath}/social/accounts`)}>
                                                        <i className="bi bi-link-45deg me-1"></i>Reconnect Account
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-secondary rounded-pill px-4 fw-bold" onClick={() => setSelectedPost(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .extra-small { font-size: 0.72rem; }
                .min-vh-60 { min-height: 60vh; }
                .hover-shadow:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.08) !important; }
                .bg-purple-subtle { background-color: rgba(111,66,193,0.1); }
                .text-purple { color: #6f42c1 !important; }
                .cursor-pointer { cursor: pointer; }
                .hover-bg-light-dark:hover { background-color: #f1f5f9 !important; }
            `}</style>
        </MainLayout>
    );
}
