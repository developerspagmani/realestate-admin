'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/MainLayout';
import ModuleGuard from '@/components/common/ModuleGuard';
import Loader from '@/components/common/Loader';
import { analyticsProService, propertyService, marketingService } from '@/app/services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';

export default function AdvancedAnalyticsPage() {
    const queryClient = useQueryClient();

    // Filters
    const [filters, setFilters] = useState({
        dateRange: '30d', // 7d, 30d, custom
        startDate: '',
        endDate: '',
        campaignId: '',
        propertyId: ''
    });

    // Fetch Properties for Filter
    const { data: availableProperties = [] } = useQuery({
        queryKey: ['availableProperties'],
        queryFn: async () => {
            const token = localStorage.getItem('authToken') || '';
            const res = await propertyService.getProperties(token, { limit: '1000' });
            return Array.isArray(res.data) ? res.data : (res.data?.properties || []);
        }
    });

    // Fetch Campaigns for Filter
    const { data: availableCampaigns = [] } = useQuery({
        queryKey: ['availableCampaigns'],
        queryFn: async () => {
            const token = localStorage.getItem('authToken') || '';
            const res = await marketingService.getCampaigns(token, { limit: '1000' });
            return Array.isArray(res.data) ? res.data : (res.data?.campaigns || []);
        }
    });

    // Fetch Analytics Data
    const { data: analyticsData, isLoading, refetch } = useQuery({
        queryKey: ['analytics', filters],
        queryFn: async () => {
            // Compute dates based on filter
            let start = filters.startDate;
            let end = filters.endDate;

            if (filters.dateRange === '7d') {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                start = d.toISOString().split('T')[0];
            } else if (filters.dateRange === '30d') {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                start = d.toISOString().split('T')[0];
            }

            const queryParams = {
                startDate: start,
                endDate: end,
                campaignId: filters.campaignId,
                propertyId: filters.propertyId
            };

            const [revRes, agentRes, campaignRes, marketingRes] = await Promise.all([
                analyticsProService.getRevenueFunnel(queryParams),
                analyticsProService.getAgentPerformance(queryParams),
                analyticsProService.getCampaignStats(queryParams),
                analyticsProService.getMarketingInsights(queryParams)
            ]);

            return {
                revenueFunnel: revRes.success ? revRes.data : null,
                agentPerformance: agentRes.success ? agentRes.data : [],
                campaignStats: campaignRes.success ? campaignRes.data : [],
                marketingInsights: marketingRes.success ? marketingRes.data : null
            };
        }
    });

    const revenueFunnel = analyticsData?.revenueFunnel || null;
    const agentPerformance = analyticsData?.agentPerformance || [];
    const campaignStats = analyticsData?.campaignStats || [];
    const marketingInsights = analyticsData?.marketingInsights || null;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <ModuleGuard moduleSlug="analytics_pro">
            <MainLayout activePage="analytics">
                <div className="container-fluid py-4">
                    {/* Header with Refresh */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="fw-bold h2 mb-1">Advanced Analytics</h1>
                            <p className="text-muted small">Deep insights into your business growth and market demand.</p>
                        </div>
                        <div className="d-flex gap-2">
                            <Link href="/realestate-owner-admin/analytics/forecasting" className="btn btn-primary rounded-3 shadow-sm">
                                <i className="bi bi-robot me-2"></i>Forecasting AI
                            </Link>
                            <button className="btn btn-outline-primary rounded-3 shadow-sm" onClick={() => setFilters({ ...filters, dateRange: '30d', campaignId: '', propertyId: '', startDate: '', endDate: '' })}>
                                <i className="bi bi-x-circle me-2"></i>Clear Filters
                            </button>
                            <button className="btn btn-light rounded-3 shadow-sm" onClick={() => refetch()}>
                                <i className="bi bi-arrow-clockwise me-2"></i>Refresh
                            </button>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-3">
                            <div className="row g-3">
                                <div className="col-md-2">
                                    <label className="extra-small text-muted fw-bold text-uppercase mb-1">Date Range</label>
                                    <select
                                        className="form-select form-select-sm rounded-3"
                                        value={filters.dateRange}
                                        onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                                    >
                                        <option value="7d">Last 7 Days</option>
                                        <option value="30d">Last 30 Days</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>
                                {filters.dateRange === 'custom' && (
                                    <>
                                        <div className="col-md-2">
                                            <label className="extra-small text-muted fw-bold text-uppercase mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm rounded-3"
                                                value={filters.startDate}
                                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="extra-small text-muted fw-bold text-uppercase mb-1">End Date</label>
                                            <input
                                                type="date"
                                                className="form-control form-control-sm rounded-3"
                                                value={filters.endDate}
                                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                                <div className="col-md-3">
                                    <label className="extra-small text-muted fw-bold text-uppercase mb-1">Campaign</label>
                                    <select
                                        className="form-select form-select-sm rounded-3"
                                        value={filters.campaignId}
                                        onChange={(e) => setFilters({ ...filters, campaignId: e.target.value })}
                                    >
                                        <option value="">All Campaigns</option>
                                        {Array.isArray(availableCampaigns) && availableCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="extra-small text-muted fw-bold text-uppercase mb-1">Property</label>
                                    <select
                                        className="form-select form-select-sm rounded-3"
                                        value={filters.propertyId}
                                        onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
                                    >
                                        <option value="">All Properties</option>
                                        {Array.isArray(availableProperties) && availableProperties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <Loader size="md" message="Loading analytics data..." />
                    ) : (
                        <div className="row g-4">
                            {/* Summary Stats ROW */}
                            <div className="col-md-3">
                                <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100">
                                    <div className="extra-small text-muted text-uppercase fw-bold mb-1">Avg. Conversion Time</div>
                                    <div className="h2 fw-bold mb-0 text-primary">{marketingInsights?.avgVelocity || 0} Days</div>
                                    <div className="small text-success fw-medium mt-1">Lead creation to conversion</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100">
                                    <div className="extra-small text-muted text-uppercase fw-bold mb-1">Total Active Leads</div>
                                    <div className="h2 fw-bold mb-0 text-dark">
                                        {revenueFunnel?.funnel
                                            ? revenueFunnel.funnel.filter((s: any) => s.label !== 'Lost').reduce((sum: number, s: any) => sum + (s.count || 0), 0)
                                            : 0}
                                    </div>
                                    <div className="small text-muted mt-1">Active pipeline (excl. lost)</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100">
                                    <div className="extra-small text-muted text-uppercase fw-bold mb-1">Avg Engagement Rate</div>
                                    <div className="h2 fw-bold mb-0 text-info">
                                        {campaignStats.length > 0
                                            ? (campaignStats.reduce((sum: number, c: any) => sum + (c.engagement || 0), 0) / campaignStats.length).toFixed(1)
                                            : 0}%
                                    </div>
                                    <div className="small text-muted mt-1">Avg across all campaigns</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100">
                                    <div className="extra-small text-muted text-uppercase fw-bold mb-1">Demand Keywords</div>
                                    <div className="h2 fw-bold mb-0 text-warning">{marketingInsights?.topSearchKeywords?.length || 0}</div>
                                    <div className="small text-muted mt-1">Trending search terms</div>
                                </div>
                            </div>

                            {/* High-Performing Properties and Opportunity Metric */}
                            <div className="col-12">
                                <div className="card border-0 shadow-sm rounded-4 border-start border-success border-5 mb-2">
                                    <div className="card-body p-4">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="bg-success text-white rounded-3 p-2 me-3">
                                                <i className="bi bi-graph-up-arrow fs-5"></i>
                                            </div>
                                            <div>
                                                <h5 className="fw-bold mb-0 text-dark">Identify high-performing properties and opportunity</h5>
                                                <p className="text-muted small mb-0">Track your best performing assets and immediate growth gaps.</p>
                                            </div>
                                        </div>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="p-3 bg-light rounded-4 h-100 border">
                                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                                        <div className="text-muted extra-small fw-bold text-uppercase">Top Assets Leaderboard</div>
                                                    </div>
                                                    {marketingInsights?.topProperties?.length > 0 ? (
                                                        <div className="d-flex flex-column gap-3">
                                                            {marketingInsights.topProperties.slice(0, 3).map((prop: any, index: number) => (
                                                                <div key={index} className="transition-all hvr-translate-x">
                                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                                        <h6 className="fw-bold text-dark text-truncate mb-0" style={{ maxWidth: '75%' }}>
                                                                            <span className={`badge ${index === 0 ? 'bg-success' : 'bg-secondary'} me-2 rounded-circle`} style={{ width: '22px', height: '22px', padding: '0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{index + 1}</span>
                                                                            {prop.title}
                                                                        </h6>
                                                                        <span className="small fw-bold text-muted">{prop.views} <i className="bi bi-eye ms-1"></i></span>
                                                                    </div>
                                                                    <div className="progress mt-2" style={{ height: '5px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                                                                        <div className={`progress-bar ${index === 0 ? 'bg-success' : 'bg-success bg-opacity-50'}`} style={{ width: `${(prop.views / marketingInsights.topProperties[0].views) * 100}%` }}></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="mb-0 small text-muted">Awaiting tracking data...</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="p-3 bg-light rounded-4 h-100 border">
                                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                                        <div className="text-muted extra-small fw-bold text-uppercase">AI Opportunity Queue</div>
                                                    </div>
                                                    {marketingInsights?.forecastingAI?.length > 0 ? (
                                                        <div className="d-flex flex-column gap-2">
                                                            {marketingInsights.forecastingAI.slice(0, 2).map((opp: any, index: number) => (
                                                                <div key={index} className="bg-white p-3 rounded-4 shadow-sm border border-light transition-all hvr-scale-sm">
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        <span className={`badge ${opp.type === 'INVENTORY_SHORTAGE' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'} rounded-pill`}>
                                                                            {opp.type === 'PRICE_OPTIMIZATION' ? 'Price Opt.' : 'Inv. Shortage'}
                                                                        </span>
                                                                        <span className={`extra-small fw-bold ${opp.demandLevel === 'Critical' ? 'text-danger' : 'text-primary'}`}>
                                                                            {opp.demandLevel} Demand
                                                                        </span>
                                                                    </div>
                                                                    <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                                                                        <i className={`bi ${opp.type === 'PRICE_OPTIMIZATION' ? 'bi-cash-coin text-success' : 'bi-house-dash text-danger'}`}></i>
                                                                        {opp.type === 'PRICE_OPTIMIZATION' ? 'Price Optimization' : `${opp.location && opp.location !== 'Unknown' && opp.location !== 'Global' ? opp.location + ' ' : ''}Market Gap`}
                                                                    </h6>
                                                                    <p className="mb-0 text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>{opp.recommendation}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="h-100 d-flex flex-column align-items-center justify-content-center py-4 bg-white rounded-4 border border-light">
                                                            <div className="bg-success text-white rounded-circle p-3 mb-2 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                                                <i className="bi bi-shield-check fs-4"></i>
                                                            </div>
                                                            <h6 className="fw-bold text-dark mb-1">Perfectly Balanced</h6>
                                                            <p className="mb-0 small text-muted text-center px-3">AI is analyzing incoming search traffic. No critical inventory or pricing gaps detected.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Forecasting AI Prediction */}
                            <div className="col-12">
                                <div className="card border-0 shadow-sm rounded-4 bg-primary bg-opacity-10 overflow-hidden border-start border-primary border-5">
                                    <div className="card-body p-4">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="bg-primary text-white rounded-3 p-2 me-3">
                                                <i className="bi bi-cpu fs-4"></i>
                                            </div>
                                            <div>
                                                <h5 className="fw-bold mb-0 text-white">Forecasting AI Prediction</h5>
                                                <p className="text-muted small mb-0">Intelligent insights based on user behavior and inventory gaps.</p>
                                            </div>
                                        </div>
                                        <div className="row g-3">
                                            {marketingInsights?.forecastingAI?.length > 0 ? (
                                                marketingInsights.forecastingAI.map((p: any, idx: number) => (
                                                    <div className="col-md-6" key={idx}>
                                                        <div className="bg-white p-3 rounded-4 shadow-sm h-100">
                                                            <div className="d-flex justify-content-between mb-2">
                                                                <span className={`badge ${p.type === 'INVENTORY_SHORTAGE' ? 'bg-danger-subtle text-danger' : 'bg-info-subtle text-info'} rounded-pill`}>
                                                                    {p.type.replace('_', ' ')}
                                                                </span>
                                                                <span className="extra-small text-muted fw-bold">{p.demandLevel} Demand</span>
                                                            </div>
                                                            <h6 className="fw-bold text-dark">
                                                                {p.type === 'PRICE_OPTIMIZATION' ? 'Price Optimization' :
                                                                    p.type === 'INVENTORY_SHORTAGE' ? `${p.location && p.location !== 'Unknown' && p.location !== 'Global' ? p.location + ' ' : ''}Inventory Shortage` :
                                                                        `${p.location && p.location !== 'Unknown' ? p.location + ' ' : ''}Optimization`}
                                                            </h6>
                                                            <p className="small text-muted mb-0">{p.recommendation}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-12 text-center py-3">
                                                    <p className="text-muted mb-0">AI is currently analyzing data. No immediate shortages detected.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Acquisition Channels & Growth */}
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                    <div className="card-header bg-white border-0 p-4 pb-0">
                                        <h5 className="fw-bold mb-0">Acquisition Channels</h5>
                                        <p className="text-muted extra-small">Where your leads coming from</p>
                                    </div>
                                    <div className="card-body p-4 pt-0">
                                        <div style={{ height: '250px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={marketingInsights?.leadSources || []}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="count"
                                                        nameKey="source"
                                                    >
                                                        {(marketingInsights?.leadSources || []).map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-8">
                                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                    <div className="card-header bg-white border-0 p-4 pb-0">
                                        <h5 className="fw-bold mb-0">Lead Generation Growth</h5>
                                        <p className="text-muted extra-small">Daily lead volume for selected period</p>
                                    </div>
                                    <div className="card-body p-4 pt-0">
                                        <div style={{ height: '250px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={marketingInsights?.genTrend || []}>
                                                    <defs>
                                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Area type="monotone" dataKey="count" name="New Leads" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Search Intelligence */}
                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                    <div className="card-header bg-white border-0 p-4">
                                        <h5 className="fw-bold mb-0">Search Intelligence (Demand Map)</h5>
                                        <p className="text-muted small">Deep dive into what customers are looking for.</p>
                                    </div>
                                    <div className="card-body p-4 pt-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="border-0 small text-uppercase">Keyword / Feature</th>
                                                        <th className="border-0 small text-uppercase text-end">Frequency</th>
                                                        <th className="border-0 small text-uppercase text-end">Level</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {marketingInsights?.topSearchKeywords?.map((k: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td><span className="fw-bold">{k.name}</span></td>
                                                            <td className="text-end"><span className="badge bg-light text-primary border">{k.count} hits</span></td>
                                                            <td className="text-end">
                                                                <div className="d-flex align-items-center justify-content-end gap-2">
                                                                    <div className="progress rounded-pill flex-grow-1" style={{ height: '6px', maxWidth: '60px' }}>
                                                                        <div className="progress-bar bg-warning" style={{ width: `${Math.min(k.count * 10, 100)}%` }}></div>
                                                                    </div>
                                                                    <span className="extra-small fw-bold">{k.count > 10 ? 'High' : 'Medium'}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Property Interaction Score */}
                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                    <div className="card-header bg-white border-0 p-4 pb-0">
                                        <h5 className="fw-bold mb-0">Property Interaction Score</h5>
                                        <p className="text-muted extra-small">Engagement performance per listing</p>
                                    </div>
                                    <div className="card-body p-4 pt-0">
                                        <div style={{ height: '350px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={marketingInsights?.topProperties || []} layout="vertical" margin={{ left: 50, right: 30 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="title"
                                                        type="category"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        width={150}
                                                        style={{ fontSize: '11px', fontWeight: '600' }}
                                                        tick={(props) => {
                                                            const { x, y, payload } = props;
                                                            return (
                                                                <g transform={`translate(${x},${y})`}>
                                                                    <text x={-10} y={0} dy={4} textAnchor="end" fill="#64748b" fontSize="10px">
                                                                        {(payload.value || '').length > 25 ? `${payload.value.substring(0, 22)}...` : (payload.value || '')}
                                                                    </text>
                                                                </g>
                                                            );
                                                        }}
                                                    />
                                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                                    <Bar dataKey="views" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={24}>
                                                        {(marketingInsights?.topProperties || []).map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Trend */}
                            <div className="col-md-8">
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                                    <div className="card-header bg-white border-0 p-4">
                                        <h5 className="fw-bold mb-0">Revenue Trend (Last 6 Months)</h5>
                                    </div>
                                    <div className="card-body p-4 pt-0" style={{ height: '300px' }}>
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

                            {/* Agent Efficiency */}
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                    <div className="card-header bg-white border-0 p-4 pb-0">
                                        <h5 className="fw-bold mb-0">Lead Quality Index</h5>
                                        <p className="text-muted extra-small">Distribution of lead potential</p>
                                    </div>
                                    <div className="card-body p-4 pt-0">
                                        <div style={{ height: '300px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={marketingInsights?.qualityDist || []}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="range" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" name="Leads" radius={[10, 10, 0, 0]}>
                                                        {(marketingInsights?.qualityDist || []).map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Agent Table */}
                            <div className="col-12">
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                                    <div className="card-header bg-white border-0 p-4">
                                        <h5 className="fw-bold mb-0">Agent Performance Analysis</h5>
                                    </div>
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="px-4 py-3 border-0 small text-uppercase">Agent Name</th>
                                                        <th className="py-3 border-0 small text-uppercase">Leads</th>
                                                        <th className="py-3 border-0 small text-uppercase">Conv. Rate</th>
                                                        <th className="px-4 py-3 border-0 small text-uppercase text-end">Total Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {agentPerformance.map((agent: any) => (
                                                        <tr key={agent.id}>
                                                            <td className="px-4 py-3">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px' }}>
                                                                        {(agent.name || '?').charAt(0)}
                                                                    </div>
                                                                    <span className="fw-bold">{agent.name || 'Unknown Agent'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3">{agent.totalLeads}</td>
                                                            <td className="py-3">
                                                                <span className={`badge ${agent.conversionRate > 20 ? 'bg-success-subtle text-success' : 'bg-light text-muted'} rounded-pill fw-bold`}>
                                                                    {agent.conversionRate.toFixed(1)}%
                                                                </span>
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
                        </div>
                    )}
                </div>
            </MainLayout>
        </ModuleGuard>
    );
}
