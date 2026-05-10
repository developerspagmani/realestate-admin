'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { analyticsProService } from '@/app/services/api';
import ModuleGuard from '@/components/common/ModuleGuard';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend
} from 'recharts';
import Loader from '@/components/common/Loader';

interface ForecastingAIProps {
    mode: string;
}

export default function ForecastingAI({ mode }: ForecastingAIProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState({
        dateRange: '30d',
        startDate: '',
        endDate: ''
    });
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('forecasting_hideGuide');
        if (saved === 'true') {
            setShowHowItWorks(false);
        }
    }, []);

    const toggleGuide = (show: boolean) => {
        setShowHowItWorks(show);
        localStorage.setItem('forecasting_hideGuide', (!show).toString());
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filters.dateRange !== 'custom') {
                // Backend handles basic trend if no dates, but we can pass them
            } else {
                if (filters.startDate) params.startDate = filters.startDate;
                if (filters.endDate) params.endDate = filters.endDate;
            }

            const res = await analyticsProService.getDemandIntelligence(params);
            if (res.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Error fetching demand intelligence:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getSeverityBadge = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-danger';
            case 'high': return 'bg-warning text-dark';
            case 'medium': return 'bg-info text-white';
            default: return 'bg-secondary';
        }
    };

    if (loading && !data) {
        return (
            <ModuleGuard moduleSlug="analytics_pro">
                <MainLayout activePage="forecasting">
                    <div className="p-4 text-center mt-5">
                        <Loader size="md" message="Analyzing market demand signals..." />
                    </div>
                </MainLayout>
            </ModuleGuard>
        );
    }

    return (
        <ModuleGuard moduleSlug="analytics_pro">
            <MainLayout activePage="forecasting">
                <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center gap-3">
                            <div>
                                <h2 className="fw-bold mb-1">AI Demand Intelligence</h2>
                                <p className="text-muted mb-0">Predictive insights based on search keywords, feature shortages, and price gaps.</p>
                            </div>
                            {!showHowItWorks && (
                                <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold text-primary shadow-sm border mt-1" onClick={() => toggleGuide(true)}>
                                    <i className="bi bi-info-circle me-1"></i> How it Works
                                </button>
                            )}
                        </div>
                        <div className="d-flex gap-2">
                            <select
                                className="form-select form-select-sm"
                                value={filters.dateRange}
                                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                                style={{ width: '150px' }}
                            >
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="90d">Last 90 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            {filters.dateRange === 'custom' && (
                                <>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    />
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    />
                                    <button className="btn btn-sm btn-primary" onClick={fetchData}>Apply</button>
                                </>
                            )}
                        </div>
                    </div>

                    {showHowItWorks && (
                        <div className="card border-0 shadow-sm rounded-4 mb-4 bg-primary text-white overflow-hidden position-relative animate-fade-in">
                            <button
                                className="btn position-absolute top-0 end-0 m-3 text-white opacity-50 hover-opacity-100 p-2"
                                style={{ zIndex: 1 }}
                                onClick={() => toggleGuide(false)}
                                title="Hide this section"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                            <div className="card-body p-4 p-lg-5">
                                <div className="row align-items-center">
                                    <div className="col-lg-8">
                                        <h3 className="fw-bold mb-3 text-white">Profit From the Future</h3>
                                        <p className="opacity-75 mb-4">Our AI analyzes search signals to tell you what to buy or build next. Here is how your intelligence works:</p>
                                        <div className="row g-4">
                                            <div className="col-md-6">
                                                <div className="d-flex gap-3">
                                                    <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                        <i className="bi bi-graph-up-arrow text-white"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">1. Intent Velocity</div>
                                                        <div className="small opacity-75">We track daily search volume across your platform to detect rising market interest.</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="d-flex gap-3">
                                                    <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                        <i className="bi bi-intersect text-white"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">2. Market Gap Analysis</div>
                                                        <div className="small opacity-75">Identify specific keywords and amenities that buyers want but you don't have.</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="d-flex gap-3">
                                                    <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                        <i className="bi bi-piggy-bank text-white"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">3. Price Optimization</div>
                                                        <div className="small opacity-75">Compare buyer budget brackets against your inventory to spot oversupplied or underserved price points.</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="d-flex gap-3">
                                                    <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                        <i className="bi bi-geo-alt text-white"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">4. City Trend Locales</div>
                                                        <div className="small opacity-75">Heatmaps reveal which cities are seeing surge demand before they become mainstream.</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-4 d-none d-lg-block text-center">
                                        <i className="bi bi-rocket-takeoff display-1 opacity-25"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100 bg-primary text-white">
                                <div className="extra-small text-uppercase fw-bold opacity-75">Total Search Volume</div>
                                <div className="h2 fw-bold mb-0">{data?.summary.totalSearches || 0}</div>
                                <div className="small opacity-75 mt-1">Unique keywords: {data?.summary.uniqueKeywords}</div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100">
                                <div className="extra-small text-muted text-uppercase fw-bold">Avg Buyer Budget</div>
                                <div className="h2 fw-bold mb-0 text-success">${data?.summary.avgBuyerBudget.toLocaleString()}</div>
                                <div className="small text-muted mt-1">Market supply avg: ${data?.summary.avgListingPrice.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100">
                                <div className="extra-small text-muted text-uppercase fw-bold">Inventory Sync</div>
                                <div className="h2 fw-bold mb-0">{data?.summary.totalInventory || 0}</div>
                                <div className="small text-muted mt-1">Properties in your portfolio</div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100 bg-dark text-white">
                                <div className="extra-small text-uppercase fw-bold opacity-75">Cities in Demand</div>
                                <div className="h2 fw-bold mb-0">{data?.summary.uniqueCitiesSearched || 0}</div>
                                <div className="small opacity-75 mt-1">High-intent search locales</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Recommendations */}
                    <div className="mb-4">
                        <h5 className="fw-bold mb-3 d-flex align-items-center">
                            <span className="badge bg-primary me-2">AI</span> Priority Recommendations
                        </h5>
                        <div className="row g-3">
                            {data?.recommendations.map((rec: any, i: number) => (
                                <div key={i} className="col-md-6">
                                    <div className={`card border-0 shadow-sm rounded-4 overflow-hidden h-100 border-start border-4 ${rec.priority === 'CRITICAL' ? 'border-danger' : rec.priority === 'HIGH' ? 'border-warning' : 'border-info'}`}>
                                        <div className="card-body p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="fw-bold mb-0">{rec.title}</h6>
                                                <span className={`badge ${rec.priority === 'CRITICAL' ? 'bg-danger' : rec.priority === 'HIGH' ? 'bg-warning text-dark' : 'bg-info'}`}>{rec.priority}</span>
                                            </div>
                                            <p className="small text-muted mb-3">{rec.detail}</p>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="extra-small px-2 py-1 bg-light rounded text-muted">Impact: {rec.impact}</div>
                                                <div className="small fw-bold text-primary">{rec.action} →</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {data?.recommendations.length === 0 && (
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-light">
                                        <i className="bi bi-check-circle-fill text-success h1 mb-3"></i>
                                        <h5>Inventory is well-balanced</h5>
                                        <p className="text-muted">No significant shortages detected based on current search patterns.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        {/* Keyword Shortages */}
                        <div className="col-lg-6">
                            <div className="card border-0 shadow-sm rounded-4 h-100">
                                <div className="card-header bg-transparent border-0 p-4 pb-0">
                                    <h5 className="fw-bold mb-0">Search Keyword Shortages</h5>
                                    <p className="extra-small text-muted">Keywords users search for that aren't in your inventory titles/tags.</p>
                                </div>
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr className="extra-small text-muted text-uppercase fw-bold">
                                                    <th className="px-4 py-3 border-0">Keyword</th>
                                                    <th className="py-3 border-0">Searches</th>
                                                    <th className="py-3 border-0">Supply</th>
                                                    <th className="py-3 border-0">Gap</th>
                                                    <th className="px-4 py-3 border-0">Severity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data?.keywordShortages.map((item: any, i: number) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-3 fw-bold">{item.keyword}</td>
                                                        <td className="py-3">{item.demandCount}</td>
                                                        <td className="py-3">{item.matchingSupply}</td>
                                                        <td className="py-3 text-danger">+{item.gap}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`badge ${getSeverityBadge(item.severity)}`}>{item.severity}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {data?.keywordShortages.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-4 text-muted">No significant gaps found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature Shortages */}
                        <div className="col-lg-6">
                            <div className="card border-0 shadow-sm rounded-4 h-100">
                                <div className="card-header bg-transparent border-0 p-4 pb-0">
                                    <h5 className="fw-bold mb-0">Feature & Amenity Gaps</h5>
                                    <p className="extra-small text-muted">Features (Pool, Gym, etc.) or Bedroom counts with high demand vs supply.</p>
                                </div>
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr className="extra-small text-muted text-uppercase fw-bold">
                                                    <th className="px-4 py-3 border-0">Feature</th>
                                                    <th className="py-3 border-0">Demand</th>
                                                    <th className="py-3 border-0">Supply</th>
                                                    <th className="py-3 border-0">Gap</th>
                                                    <th className="px-4 py-3 border-0">Severity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data?.featureShortages.map((item: any, i: number) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-3 fw-bold capitalize">{item.feature}</td>
                                                        <td className="py-3">{item.demandCount}</td>
                                                        <td className="py-3">{item.matchingSupply}</td>
                                                        <td className="py-3 text-warning">+{item.gap}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`badge ${getSeverityBadge(item.severity)}`}>{item.severity}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {data?.featureShortages.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-4 text-muted">No significant gaps found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        {/* Price Bracket Analysis */}
                        <div className="col-lg-7">
                            <div className="card border-0 shadow-sm rounded-4 h-100">
                                <div className="card-header bg-transparent border-0 p-4 pb-0">
                                    <h5 className="fw-bold mb-0">Price Bracket Demand vs Supply</h5>
                                    <p className="extra-small text-muted">Where your inventory price brackets mismatch buyer budgets.</p>
                                </div>
                                <div className="card-body p-4">
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data?.priceBrackets} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    cursor={{ fill: '#f8f9fa' }}
                                                />
                                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                                <Bar dataKey="demand" name="Demand (Searches)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                                <Bar dataKey="supply" name="Supply (Listings)" fill="#dee2e6" radius={[4, 4, 0, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* City Shortages */}
                        <div className="col-lg-5">
                            <div className="card border-0 shadow-sm rounded-4 h-100">
                                <div className="card-header bg-transparent border-0 p-4 pb-0">
                                    <h5 className="fw-bold mb-0">City Shortages Heatmap</h5>
                                    <p className="extra-small text-muted">Cities with high demand-to-supply ratios.</p>
                                </div>
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr className="extra-small text-muted text-uppercase fw-bold">
                                                    <th className="px-4 py-3 border-0">City</th>
                                                    <th className="py-3 border-0">Ratio</th>
                                                    <th className="px-4 py-3 border-0">Severity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data?.cityShortages.map((item: any, i: number) => (
                                                    <tr key={i}>
                                                        <td className="px-4 py-3 fw-bold">{item.city}</td>
                                                        <td className="py-3">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                                                    <div
                                                                        className={`progress-bar ${item.ratio! > 5 ? 'bg-danger' : item.ratio! > 2 ? 'bg-warning' : 'bg-success'}`}
                                                                        style={{ width: `${Math.min(100, item.ratio! * 10)}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="extra-small fw-bold">{item.ratio}x</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`badge ${getSeverityBadge(item.severity)}`}>{item.severity}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {data?.cityShortages.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="text-center py-4 text-muted">No multi-city data reported</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Trend Chart */}
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-transparent border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="fw-bold mb-0">Market Search Intent Velocity</h5>
                                <p className="extra-small text-muted">Daily search volume across your platform.</p>
                            </div>
                        </div>
                        <div className="card-body p-4">
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data?.trend}>
                                        <defs>
                                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#999' }}
                                            tickFormatter={(str) => str.slice(8)}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="searches"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorTrend)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .capitalize { text-transform: capitalize; }
                    .extra-small { font-size: 0.7rem; }
                `}</style>
            </MainLayout>
        </ModuleGuard>
    );
}
