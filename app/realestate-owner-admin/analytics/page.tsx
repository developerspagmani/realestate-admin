'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import ModuleGuard from '@/components/common/ModuleGuard';
import { analyticsProService } from '@/app/services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';

export default function AdvancedAnalyticsPage() {
    const [revenueFunnel, setRevenueFunnel] = useState<any>(null);
    const [agentPerformance, setAgentPerformance] = useState<any[]>([]);
    const [searchTrends, setSearchTrends] = useState<any>(null);
    const [campaignStats, setCampaignStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [revRes, agentRes, searchRes, campaignRes] = await Promise.all([
                analyticsProService.getRevenueFunnel(),
                analyticsProService.getAgentPerformance(),
                analyticsProService.getSearchTrends(),
                analyticsProService.getCampaignStats()
            ]);

            if (revRes.success) setRevenueFunnel(revRes.data);
            if (agentRes.success) setAgentPerformance(agentRes.data);
            if (searchRes.success) setSearchTrends(searchRes.data);
            if (campaignRes.success) setCampaignStats(campaignRes.data);

        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <ModuleGuard moduleSlug="analytics_pro">
            <MainLayout activePage="analytics">
                <div className="container-fluid py-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="fw-bold h2 mb-1">Advanced Analytics</h1>
                            <p className="text-muted small">Deep insights into your business growth and operational efficiency.</p>
                        </div>
                        <button className="btn btn-light rounded-3 shadow-sm" onClick={fetchData}>
                            <i className="bi bi-arrow-clockwise me-2"></i>Refresh Data
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : (
                        <div className="row g-4">
                            {/* 1. Revenue Over Time */}
                            <div className="col-md-8">
                                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                    <div className="card-header bg-white border-0 p-4">
                                        <h5 className="fw-bold mb-0">Revenue Trend (Last 6 Months)</h5>
                                    </div>
                                    <div className="card-body p-4 pt-0" style={{ height: '350px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueFunnel?.revenueChart}>
                                                <defs>
                                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                    formatter={(value) => [`$${value}`, 'Revenue']}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Lead Funnel */}
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                    <div className="card-header bg-white border-0 p-4">
                                        <h5 className="fw-bold mb-0">Lead Funnel</h5>
                                    </div>
                                    <div className="card-body p-4 pt-0">
                                        {revenueFunnel?.funnel.map((step: any, idx: number) => (
                                            <div key={idx} className="mb-3">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <span className="small text-muted fw-bold">{step.label}</span>
                                                    <span className="small fw-bold">{step.count}</span>
                                                </div>
                                                <div className="progress rounded-pill overflow-hidden" style={{ height: '12px', backgroundColor: '#f1f5f9' }}>
                                                    <div
                                                        className="progress-bar rounded-pill"
                                                        style={{
                                                            width: `${(step.count / Math.max(...revenueFunnel.funnel.map((s: any) => s.count)) * 100) || 0}%`,
                                                            backgroundColor: COLORS[idx % COLORS.length]
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="mt-4 p-3 bg-light rounded-4 text-center">
                                            <div className="h4 fw-bold mb-0 text-success">
                                                {revenueFunnel?.funnel[0]?.count > 0
                                                    ? ((revenueFunnel?.funnel[3]?.count / revenueFunnel?.funnel[0]?.count) * 100).toFixed(1)
                                                    : 0}%
                                            </div>
                                            <div className="extra-small text-muted text-uppercase fw-bold">Conversion Rate</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Agent Performance */}
                            <div className="col-12">
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                    <div className="card-header bg-white border-0 p-4">
                                        <h5 className="fw-bold mb-0">Agent Efficiency</h5>
                                    </div>
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="px-4 py-3 border-0 small text-uppercase">Agent Name</th>
                                                        <th className="py-3 border-0 small text-uppercase">Assigned Leads</th>
                                                        <th className="py-3 border-0 small text-uppercase">Conversions</th>
                                                        <th className="py-3 border-0 small text-uppercase">Conversion Rate</th>
                                                        <th className="py-3 border-0 small text-uppercase">Contribution</th>
                                                        <th className="px-4 py-3 border-0 small text-uppercase text-end">Total Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {agentPerformance.map((agent) => (
                                                        <tr key={agent.id}>
                                                            <td className="px-4 py-3">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                                        {agent.name.charAt(0)}
                                                                    </div>
                                                                    <span className="fw-bold">{agent.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3">{agent.totalLeads}</td>
                                                            <td className="py-3">{agent.conversions}</td>
                                                            <td className="py-3">
                                                                <span className={`badge ${agent.conversionRate > 20 ? 'bg-success-subtle text-success' : 'bg-light text-muted'} rounded-pill fw-bold`}>
                                                                    {agent.conversionRate.toFixed(1)}%
                                                                </span>
                                                            </td>
                                                            <td className="py-3" style={{ width: '150px' }}>
                                                                <div className="progress rounded-pill" style={{ height: '6px' }}>
                                                                    <div className="progress-bar bg-info" style={{ width: `${agent.conversionRate}%` }}></div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-end fw-bold text-primary">${agent.revenue.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Search Trends & 5. Campaign Stats */}
                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                    <div className="card-header bg-white border-0 p-4">
                                        <h5 className="fw-bold mb-0">Market Demand (Search Trends)</h5>
                                    </div>
                                    <div className="card-body p-4 pt-0">
                                        <div className="row">
                                            <div className="col-6">
                                                <h6 className="extra-small text-muted text-uppercase fw-bold mb-3">Top Keywords</h6>
                                                {searchTrends?.topKeywords.map((k: any, idx: number) => (
                                                    <div key={idx} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded-3">
                                                        <span className="small fw-bold">{k.name}</span>
                                                        <span className="badge bg-white text-primary border">{k.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="col-6">
                                                <h6 className="extra-small text-muted text-uppercase fw-bold mb-3">Geo-Demand (Cities)</h6>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <PieChart>
                                                        <Pie
                                                            data={searchTrends?.topCities}
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="count"
                                                        >
                                                            {searchTrends?.topCities.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                    <div className="card-header bg-white border-0 p-4">
                                        <h5 className="fw-bold mb-0">Campaign ROI</h5>
                                    </div>
                                    <div className="card-body p-4 pt-0">
                                        <div className="table-responsive">
                                            <table className="table table-sm align-middle mb-0">
                                                <thead>
                                                    <tr className="small text-muted text-uppercase">
                                                        <th className="border-0">Campaign</th>
                                                        <th className="border-0">Reach</th>
                                                        <th className="border-0">Engagement</th>
                                                        <th className="border-0 text-end">ROI %</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {campaignStats.map((c) => (
                                                        <tr key={c.id}>
                                                            <td className="py-2 small fw-bold">{c.name}</td>
                                                            <td className="py-2 small">{c.sent}</td>
                                                            <td className="py-2 small">{c.interactions}</td>
                                                            <td className="py-2 text-end">
                                                                <span className="badge bg-info-subtle text-info rounded-pill">{c.engagement.toFixed(1)}%</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                <style jsx>{`
                    .extra-small { font-size: 0.75rem; }
                    .card { transition: all 0.3s ease; }
                    .progress-bar { transition: width 1s ease-in-out; }
                `}</style>
            </MainLayout>
        </ModuleGuard>
    );
}
