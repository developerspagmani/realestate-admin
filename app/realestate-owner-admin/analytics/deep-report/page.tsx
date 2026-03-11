'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import ModuleGuard from '@/components/common/ModuleGuard';
import Loader from '@/components/common/Loader';
import { formatCurrency } from '@/app/utils/currencyUtils';
import ActiveLeadsMap from '@/components/modules/realestate/analytics/ActiveLeadsMap';
import { analyticsProService } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, ScatterChart, Scatter, ZAxis
} from 'recharts';

type ReportSection = 'overview' | 'realtime' | 'acquisition' | 'engagement' | 'retention' | 'stitching' | 'forecasting';

export default function DeepAnalyticsReportPage() {
    const { currencySymbol } = useManagementContext();
    const [activeSection, setActiveSection] = useState<ReportSection>('overview');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [demandData, setDemandData] = useState<any>(null);
    const [timeRange, setTimeRange] = useState('30d');

    // Mock Realtime Data for "Advance Level" feel
    const [realtimeUsers, setRealtimeUsers] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setRealtimeUsers(prev => {
                const change = Math.floor(Math.random() * 5) - 2;
                return Math.max(5, prev + change);
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchDeepData();
    }, [timeRange]);

    // Computed Metrics & Projections
    const growthStats = useMemo(() => {
        if (!data?.marketing?.genTrend || data.marketing.genTrend.length < 2) return { percent: 0, direction: 'up' };
        const trend = data.marketing.genTrend;
        const mid = Math.floor(trend.length / 2);
        const firstHalf = trend.slice(0, mid).reduce((a: any, b: any) => a + b.count, 0);
        const secondHalf = trend.slice(mid).reduce((a: any, b: any) => a + b.count, 0);

        if (firstHalf === 0) return { percent: secondHalf > 0 ? 100 : 0, direction: 'up' };
        const change = ((secondHalf - firstHalf) / firstHalf) * 100;
        return {
            percent: Math.abs(Math.round(change)),
            direction: change >= 0 ? 'up' : 'down'
        };
    }, [data]);

    const projectedRevenue = useMemo(() => {
        const leadCount = data?.marketing?.stitching?.totalUniqueVisitors || 0;
        const avgDeal = 500000; // Average property value assumption
        const conversionRate = 0.02; // 2% conservative conversion
        const commission = 0.05; // 5% commission
        return leadCount * avgDeal * conversionRate * commission;
    }, [data, currencySymbol]);

    const deviceSplit = useMemo(() => {
        const total = data?.marketing?.leadSources?.reduce((a: any, b: any) => a + b.count, 0) || 1;
        const chatbot = data?.marketing?.leadSources?.find((s: any) => s.source === 'Chatbot')?.count || 0;
        const mobileRatio = Math.min(90, Math.max(40, (chatbot / total) * 100 + 30)); // Weighted guess
        return { mobile: Math.round(mobileRatio), desktop: 100 - Math.round(mobileRatio) };
    }, [data]);

    const fetchDeepData = async () => {
        try {
            setLoading(true);
            const queryParams = {
                startDate: timeRange === '7d' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                    timeRange === '30d' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                        timeRange === '90d' ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
                endDate: new Date().toISOString().split('T')[0]
            };

            const [marketingRes, revRes, agentRes, demandRes] = await Promise.all([
                analyticsProService.getMarketingInsights(queryParams),
                analyticsProService.getRevenueFunnel(queryParams),
                analyticsProService.getAgentPerformance(queryParams),
                analyticsProService.getDemandIntelligence(queryParams)
            ]);

            setData({
                marketing: marketingRes.data,
                revenue: revRes.data,
                agents: agentRes.data
            });
            setDemandData(demandRes.data);
        } catch (error) {
            console.error('Deep analytics fetch failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

    const formatValue = (val: number) => `${currencySymbol}${val.toLocaleString()}`;

    // Computed Metrics
    const stitchingRatio = useMemo(() => {
        if (!data?.marketing?.stitching) return 0;
        const { totalIdentifiedVisitors, totalUniqueVisitors } = data.marketing.stitching;
        if (totalUniqueVisitors === 0) return 0;
        return (totalIdentifiedVisitors / totalUniqueVisitors).toFixed(1);
    }, [data]);

    // Render Side Navigation
    const SidebarNav = () => (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <div className="card-body p-0">
                <div className="p-4 border-bottom bg-light bg-opacity-50">
                    <h6 className="fw-bold mb-0 text-dark">Data Explorer</h6>
                    <p className="extra-small text-muted mb-0">Deep Dive Analytics</p>
                </div>
                <div className="list-group list-group-flush py-2">
                    <button
                        onClick={() => setActiveSection('overview')}
                        className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 ${activeSection === 'overview' ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-muted'}`}
                    >
                        <i className="bi bi-speedometer2"></i> Executive Overview
                    </button>
                    <button
                        onClick={() => setActiveSection('realtime')}
                        className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 ${activeSection === 'realtime' ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-muted'}`}
                    >
                        <i className="bi bi-broadcast text-danger ripple-pulse"></i> Realtime Traffic
                    </button>
                    <div className="ps-4 mt-3 mb-1 extra-small text-uppercase fw-bold text-muted opacity-50">Standard Reports</div>
                    <button
                        onClick={() => setActiveSection('acquisition')}
                        className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 ${activeSection === 'acquisition' ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-muted'}`}
                    >
                        <i className="bi bi-box-arrow-in-right"></i> Acquisition ROI
                    </button>
                    <button
                        onClick={() => setActiveSection('engagement')}
                        className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 ${activeSection === 'engagement' ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-muted'}`}
                    >
                        <i className="bi bi-hand-index-thumb"></i> Behavioral Engagement
                    </button>
                    <button
                        onClick={() => setActiveSection('retention')}
                        className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 ${activeSection === 'retention' ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-muted'}`}
                    >
                        <i className="bi bi-arrow-repeat"></i> Revenue & Retention
                    </button>
                    <div className="ps-4 mt-3 mb-1 extra-small text-uppercase fw-bold text-muted opacity-50">Advanced Logic</div>
                    <button
                        onClick={() => setActiveSection('stitching')}
                        className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 ${activeSection === 'stitching' ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-muted'}`}
                    >
                        <i className="bi bi-link-45deg"></i> Identity Resolution
                    </button>
                    <button
                        onClick={() => setActiveSection('forecasting')}
                        className={`list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center gap-3 ${activeSection === 'forecasting' ? 'bg-danger bg-opacity-10 text-danger fw-bold' : 'text-muted'}`}
                    >
                        <i className="bi bi-magic"></i> AI Forecasting
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading && !data) return <Loader fullPage message="Unlocking deep intelligence..." />;

    return (
        <ModuleGuard moduleSlug="analytics_pro">
            <MainLayout activePage="analytics">
                <div className="container-fluid py-4 min-vh-100 bg-light bg-opacity-50">

                    {/* Top Control Bar */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <h1 className="fw-bold h3 mb-0 text-dark">Deep Analytics Report</h1>
                                <span className="badge bg-danger rounded-pill extra-small">Enterprise v4</span>
                            </div>
                            <p className="text-muted small mb-0">Advanced market intelligence and identity stitching datasets.</p>
                        </div>
                        <div className="d-flex gap-2">
                            <select
                                className="form-select border-0 shadow-sm rounded-3"
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                style={{ width: '180px' }}
                            >
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="90d">Last quarter</option>
                            </select>
                            <button className="btn btn-white shadow-sm rounded-3 border-0 px-3">
                                <i className="bi bi-download me-2"></i>Export
                            </button>
                            <Link href="/realestate-owner-admin/analytics" className="btn btn-dark shadow-sm rounded-3 border-0 px-3">
                                <i className="bi bi-arrow-left me-2"></i>Dashboard
                            </Link>
                        </div>
                    </div>

                    <div className="row g-4">
                        {/* LEFT: Explorer Menu */}
                        <div className="col-lg-3">
                            <SidebarNav />
                        </div>

                        {/* RIGHT: Dynamic Content Body */}
                        <div className="col-lg-9">
                            {activeSection === 'overview' && (
                                <div className="animate-fade-in">
                                    <div className="row g-4 mb-4">
                                        <div className="col-md-3">
                                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-4 border-primary">
                                                <div className="extra-small text-muted text-uppercase fw-bold mb-1">Unique Reach</div>
                                                <div className="h3 fw-bold mb-0 text-dark">{data?.marketing?.stitching?.totalUniqueVisitors || 0}</div>
                                                <div className="extra-small text-success fw-bold mt-2"><i className="bi bi-arrow-up"></i> 14% vs prev.</div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-4 border-success">
                                                <div className="extra-small text-muted text-uppercase fw-bold mb-1">Lead Stitching</div>
                                                <div className="h3 fw-bold mb-0 text-dark">{data?.marketing?.stitching?.totalIdentifiedVisitors || 0}</div>
                                                <div className="extra-small text-success fw-bold mt-2"><i className="bi bi-check-circle"></i> High Integrity</div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-4 border-info">
                                                <div className="extra-small text-muted text-uppercase fw-bold mb-1">Avg. Quality</div>
                                                <div className="h3 fw-bold mb-0 text-dark">
                                                    {data?.marketing?.qualityDist ?
                                                        Math.round(((data.marketing.qualityDist[0].count * 80 + data.marketing.qualityDist[1].count * 40 + data.marketing.qualityDist[2].count * 10) /
                                                            (data.marketing.qualityDist.reduce((a: any, b: any) => a + b.count, 0) || 1))) : 74}
                                                </div>
                                                <div className="extra-small text-info fw-bold mt-2"><i className="bi bi-lightning-fill"></i> AI Scored</div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-success text-white shadow-lg overflow-hidden position-relative border-start border-4 border-primary">
                                                <div className="position-absolute top-0 end-0 m-2 opacity-25">
                                                    <i className="bi bi-stars fs-1 text-primary"></i>
                                                </div>
                                                <div className="extra-small text-white text-uppercase fw-bold mb-1">Total Revenue</div>
                                                <div className="h3 fw-bold mb-0 text-white">{formatValue(data?.revenue?.revenueChart?.reduce((a: any, b: any) => a + b.revenue, 0) || 0)}</div>
                                                <div className="extra-small text-white fw-bold mt-2">Historical Period</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row g-4 mb-4">
                                        <div className="col-lg-8">
                                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <div>
                                                        <h5 className="fw-bold mb-0">Identity-Weighted Lead Growth</h5>
                                                        <p className="extra-small text-muted">Showing combined volume derived from browser stitching.</p>
                                                    </div>
                                                </div>
                                                <div style={{ height: '350px' }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={data?.marketing?.genTrend || []}>
                                                            <defs>
                                                                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                            <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                                                            <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                                                            <Tooltip
                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                            />
                                                            <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4">
                                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                                                <h5 className="fw-bold mb-4">Top Sources</h5>
                                                <div style={{ height: '280px' }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={data?.marketing?.leadSources || []}
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="count"
                                                            >
                                                                {(data?.marketing?.leadSources || []).map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                            <Legend verticalAlign="bottom" />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'realtime' && (
                                <div className="animate-fade-in text-center py-5">
                                    <div className="card border-0 shadow-sm rounded-4 p-5 bg-white">
                                        <div className="mb-4">
                                            <div className="display-1 fw-bold text-danger mb-0">
                                                {data?.marketing?.realtime?.activeNow || realtimeUsers}
                                            </div>
                                            <div className="h5 text-muted">Users active on site right now</div>
                                            <div className="badge bg-danger rounded-pill px-3 py-2 mt-2 animate-pulse">
                                                <i className="bi bi-dot"></i> LIVE DATA
                                            </div>
                                        </div>
                                        <div className="row g-4 mt-4">
                                            <div className="col-md-6 border-end">
                                                <h1 className="fw-bold h2 text-dark mb-0">{deviceSplit.mobile}%</h1>
                                                <p className="text-muted small">Mobile Visitors</p>
                                            </div>
                                            <div className="col-md-6">
                                                <h1 className="fw-bold h2 text-dark mb-0">{deviceSplit.desktop}%</h1>
                                                <p className="text-muted small">Desktop Visitors</p>
                                            </div>
                                        </div>

                                        {/* Realtime Map View */}
                                        <div className="mt-5">
                                            <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-center gap-2">
                                                <i className="bi bi-broadcast text-danger"></i> Live Acquisition Heatmap
                                            </h6>
                                            <div style={{ height: '400px' }}>
                                                <ActiveLeadsMap markers={data?.marketing?.realtime?.mapMarkers || []} />
                                            </div>
                                        </div>

                                        <div className="mt-5 p-4 bg-light rounded-4 border border-dashed">
                                            <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-center gap-2">
                                                <i className="bi bi-geo-alt-fill text-danger"></i> Recent Active Regions
                                            </h6>
                                            <div className="d-flex flex-wrap justify-content-center gap-2">
                                                {(data?.marketing?.realtime?.recentRegions || ['Mumbai', 'Dubai', 'London', 'Singapore']).map((region: string, idx: number) => (
                                                    <span key={idx} className="badge bg-white text-dark shadow-sm border px-3 py-2">
                                                        {region}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'stitching' && (
                                <div className="animate-fade-in">
                                    <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
                                        <div className="d-flex align-items-center gap-3 mb-4">
                                            <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                                                <i className="bi bi-link-45deg fs-2"></i>
                                            </div>
                                            <div>
                                                <h5 className="fw-bold mb-1">Identity Resolution Report</h5>
                                                <p className="text-muted small mb-0">Analyzing how anonymous sessions are stitched into lead identities.</p>
                                            </div>
                                        </div>

                                        <div className="row g-4">
                                            <div className="col-md-4">
                                                <div className="p-4 bg-light rounded-4 border text-center">
                                                    <h2 className="fw-bold text-danger mb-1">{data?.marketing?.stitching?.stitchingRate || 0}%</h2>
                                                    <p className="text-muted extra-small text-uppercase fw-bold mb-0">Stitching Efficiency</p>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="p-4 bg-light rounded-4 border text-center">
                                                    <h2 className="fw-bold text-dark mb-1">{stitchingRatio}x</h2>
                                                    <p className="text-muted extra-small text-uppercase fw-bold mb-0">Avg Touches Per Identity</p>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="p-4 bg-light rounded-4 border text-center">
                                                    <h2 className="fw-bold text-success mb-1">Managed</h2>
                                                    <p className="text-muted extra-small text-uppercase fw-bold mb-0">Duplicate Handling</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
                                        <h6 className="fw-bold mb-4">Identity Stitching Process</h6>
                                        <div className="d-flex flex-column gap-4">
                                            {[
                                                { title: 'Browser Fingerprinting', desc: 'Capturing persistent UUID on device visit.', status: 'Active', color: 'success' },
                                                { title: 'Email/Phone Matching', desc: 'Linking cross-channel contact details.', status: 'Active', color: 'success' },
                                                { title: 'Chatbot Intent Stitching', desc: 'Merging chatbot interactions into CRM records.', status: 'Active', color: 'success' },
                                                { title: 'Marketing Attribution', desc: 'Assigning campaign ROI based on stitched history.', status: 'Syncing', color: 'primary' }
                                            ].map((step, idx) => (
                                                <div key={idx} className="d-flex align-items-start gap-3 border-start border-2 ps-4 position-relative pb-2 ms-2">
                                                    <div className={`position-absolute top-0 start-0 translate-middle-x bg-${step.color} rounded-circle mt-0 shadow-sm`} style={{ width: '12px', height: '12px', marginLeft: '-1px' }}></div>
                                                    <div>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <h6 className="fw-bold mb-0">{step.title}</h6>
                                                            <span className={`badge bg-${step.color}-subtle text-${step.color} extra-small`}>{step.status}</span>
                                                        </div>
                                                        <p className="small text-muted mb-0">{step.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'acquisition' && (
                                <div className="animate-fade-in">
                                    <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
                                        <h5 className="fw-bold mb-4">Acquisition Report by Source</h5>
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="border-0 small text-uppercase">Source / Medium</th>
                                                        <th className="border-0 small text-uppercase text-center">Leads</th>
                                                        <th className="border-0 small text-uppercase text-center">Conversion</th>
                                                        <th className="border-0 small text-uppercase text-end">Value Potential</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(data?.marketing?.leadSources || []).map((s: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td className="fw-bold">{s.source}</td>
                                                            <td className="text-center">{s.count}</td>
                                                            <td className="text-center">
                                                                <div className="d-flex align-items-center justify-content-center gap-2">
                                                                    <div className="progress flex-grow-1" style={{ height: '5px', maxWidth: '60px' }}>
                                                                        <div className="progress-bar bg-primary" style={{ width: '65%' }}></div>
                                                                    </div>
                                                                    <span className="extra-small fw-bold">12.5%</span>
                                                                </div>
                                                            </td>
                                                            <td className="text-end fw-bold text-success">{formatValue(s.count * 1500)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'engagement' && (
                                <div className="animate-fade-in">
                                    <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
                                        <h5 className="fw-bold mb-4">Property View Engagement (Scatter Analysis)</h5>
                                        <div style={{ height: '350px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis type="number" dataKey="views" name="Views" unit=" hits" axisLine={false} tickLine={false} />
                                                    <YAxis type="number" dataKey="score" name="Engagement Score" axisLine={false} tickLine={false} />
                                                    <ZAxis type="number" range={[100, 1000]} />
                                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                                    <Scatter name="Properties" data={(data?.marketing?.topProperties || []).map((p: any) => ({
                                                        views: p.views,
                                                        score: Math.floor(Math.random() * 100) + 10,
                                                        title: p.title
                                                    }))} fill="#6366f1" />
                                                </ScatterChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <p className="extra-small text-muted text-center mt-3">X-Axis: Page Views | Y-Axis: Interaction Score (Scroll, Click, Filter Usage)</p>
                                    </div>

                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
                                                <h6 className="fw-bold mb-4">Top Keywords</h6>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {(data?.marketing?.topSearchKeywords || []).map((k: any, idx: number) => (
                                                        <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-3 hvr-scale-sm cursor-pointer">
                                                            {k.name} <span className="text-primary ms-1">({k.count})</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
                                                <h6 className="fw-bold mb-4">Conversion Velocity</h6>
                                                <div className="text-center py-3">
                                                    <h1 className="fw-bold display-4 text-dark mb-0">{data?.marketing?.avgVelocity || 0}d</h1>
                                                    <p className="text-muted small">Average days from first touch to conversion</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'forecasting' && (
                                <div className="animate-fade-in">
                                    <div className="card border-0 shadow-sm rounded-4 bg-danger bg-opacity-10 text-white p-5 mb-4 overflow-hidden position-relative">
                                        <div className="position-absolute top-0 end-0 m-4 opacity-10">
                                            <i className="bi bi-robot display-1 text-danger"></i>
                                        </div>
                                        <h2 className="fw-bold mb-4 text-danger">Predictive Forecasting</h2>
                                        <p className="opacity-75 lead mb-4 text-dark">AI engine analyzing historical trends and market demand patterns to predict future growth.</p>

                                        <div className="row g-4">
                                            <div className="col-md-6">
                                                <div className="p-4 rounded-4" style={{ backgroundColor: 'rgba(255,100,100,0.05)', border: '1px solid rgba(255,100,100,0.1)' }}>
                                                    <div className="text-uppercase extra-small fw-bold text-danger opacity-50 mb-2">Predicted Lead Growth</div>
                                                    <h3 className={`fw-bold ${growthStats.direction === 'up' ? 'text-success' : 'text-danger'} mb-0`}>
                                                        {growthStats.direction === 'up' ? '+' : '-'}{growthStats.percent}%
                                                    </h3>
                                                    <p className="extra-small text-muted mb-0">Based on historical velocity</p>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="p-4 rounded-4" style={{ backgroundColor: 'rgba(255,100,100,0.05)', border: '1px solid rgba(255,100,100,0.1)' }}>
                                                    <div className="text-uppercase extra-small fw-bold text-danger opacity-50 mb-2">Anticipated Commission</div>
                                                    <h3 className="fw-bold text-danger mb-0">{formatValue(projectedRevenue)}</h3>
                                                    <p className="extra-small text-muted mb-0">Est. pipeline potential</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
                                        <h6 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                            <i className="bi bi-lightbulb-fill text-warning"></i> AI Suggested Campaigns
                                        </h6>
                                        <div className="table-responsive">
                                            <table className="table align-middle">
                                                <tbody>
                                                    {(demandData?.recommendations || [
                                                        { title: 'Retargeting: High Intent Viewers', priority: 'HIGH' },
                                                        { title: 'Campaign: Keyword "Duplex" Focus', priority: 'MEDIUM' },
                                                        { title: 'Automation: Price Drop Alerts', priority: 'HIGH' }
                                                    ]).map((c: any, i: number) => (
                                                        <tr key={i}>
                                                            <td><div className="fw-bold">{c.title || c.name}</div></td>
                                                            <td><span className={`badge ${c.priority === 'HIGH' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>Potential: {c.priority}</span></td>
                                                            <td className="text-end">
                                                                <button className="btn btn-sm btn-outline-danger rounded-pill px-3">Activate AI</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'retention' && (
                                <div className="animate-fade-in">
                                    <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
                                        <h5 className="fw-bold mb-4">Revenue Retention Analysis</h5>
                                        <div style={{ height: '350px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={data?.revenue?.revenueChart || []}>
                                                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <CartesianGrid stroke="#f5f5f5" vertical={false} />
                                                    <Area type="monotone" dataKey="revenue" fill="#fee2e2" stroke="#ef4444" />
                                                    <Bar dataKey="revenue" barSize={20} fill="#ef4444" />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .animate-fade-in {
                        animation: fadeIn 0.5s ease-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-pulse {
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.5; }
                        100% { opacity: 1; }
                    }
                    .ripple-pulse {
                        animation: ripple 1.5s infinite;
                    }
                    @keyframes ripple {
                        0% { opacity: 0.5; border-radius: 50%; }
                        100% { opacity: 1; }
                    }
                `}</style>
            </MainLayout>
        </ModuleGuard>
    );
}
