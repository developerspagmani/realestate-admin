'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import ModuleGuard from '@/components/common/ModuleGuard';
import { analyticsProService } from '@/app/services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useManagementContext } from '@/app/contexts/ManagementContext';

export default function DealIntelligencePage() {
    return (
        <ModuleGuard moduleSlug="deal_intelligence">
            <DealIntelligenceContent mode="owner" />
        </ModuleGuard>
    );
}

function DealIntelligenceContent({ mode }: { mode: string }) {
    const { currencySymbol } = useManagementContext();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);
    const [topReasons, setTopReasons] = useState<any[]>([]);
    const [employeeAnalysis, setEmployeeAnalysis] = useState<any[]>([]);
    const [projectAnalysis, setProjectAnalysis] = useState<any[]>([]);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('deal_intel_hideGuide');
        if (saved === 'true') {
            setShowHowItWorks(false);
        }
    }, []);

    const toggleGuide = (show: boolean) => {
        setShowHowItWorks(show);
        localStorage.setItem('deal_intel_hideGuide', (!show).toString());
    };

    useEffect(() => {
        fetchDealIntelligence();
    }, []);

    const fetchDealIntelligence = async () => {
        try {
            setLoading(true);
            const res = await analyticsProService.getDealIntelligence();
            if (res.success && res.data) {
                setMetrics(res.data.metrics);
                setTopReasons(res.data.topReasons);
                setEmployeeAnalysis(res.data.employeeAnalysis);
                setProjectAnalysis(res.data.projectAnalysis);
            }
        } catch (error) {
            console.error('Failed to fetch deal intelligence:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

    return (
        <MainLayout activePage="deal-intelligence">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div>
                            <h2 className="fw-bold text-dark mb-0 d-flex align-items-center">
                                <i className="bi bi-shield-x me-2 text-danger"></i> Deal Closer Intelligence
                            </h2>
                            <p className="text-muted">Transforming lost deals into actionable sales intelligence</p>
                        </div>
                        {!showHowItWorks && (
                            <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold text-primary shadow-sm border mt-1" onClick={() => toggleGuide(true)}>
                                <i className="bi bi-info-circle me-1"></i> How it Works
                            </button>
                        )}
                    </div>
                    <button className="btn btn-primary btn-sm rounded-3" onClick={fetchDealIntelligence}>
                        <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''} me-1`}></i> Refresh Data
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <>
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
                                            <h3 className="fw-bold mb-3 text-white">Turning Losses into Lessons</h3>
                                            <p className="opacity-75 mb-4">Every lost deal contains data that can help you win the next one. Here is how we analyze your leakage:</p>
                                            <div className="row g-4">
                                                <div className="col-md-6">
                                                    <div className="d-flex gap-3">
                                                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className="bi bi-search text-white"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">1. Loss Reason Segmenting</div>
                                                            <div className="small opacity-75">Automatically categorize why deals fail (Price, Location, Budget) to spot trends.</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="d-flex gap-3">
                                                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className="bi bi-currency-dollar text-white"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">2. Weighted Impact</div>
                                                            <div className="small opacity-75">We calculate true financial loss by factoring in deal stage and lead quality score.</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="d-flex gap-3">
                                                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className="bi bi-person-badge text-white"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">3. Agent Performance</div>
                                                            <div className="small opacity-75">Identify which agents have higher leakage in specific stages to target training.</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="d-flex gap-3">
                                                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className="bi bi-building text-white"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">4. Project Analysis</div>
                                                            <div className="small opacity-75">Pinpoint if specific properties or projects are consistently killing your deals.</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 d-none d-lg-block text-center">
                                            <i className="bi bi-shield-x display-1 opacity-25"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="row g-4 mb-4">
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm rounded-4 text-center h-100 p-4">
                                    <h6 className="text-muted text-uppercase fw-bold mb-3">Total Lost Deals</h6>
                                    <h2 className="display-4 fw-bold text-danger mb-0">{metrics?.totalLost || 0}</h2>
                                    <p className="text-muted small mt-2">Leads marked as Lost</p>
                                </div>
                            </div>
                            <div className="col-md-8">
                                <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
                                    <h6 className="text-muted text-uppercase fw-bold mb-3">Lost Impact (Weighted Value)</h6>
                                    <div className="d-flex align-items-center gap-4 h-100">
                                        <div>
                                            <h2 className="display-5 fw-bold text-dark mb-1">
                                                {currencySymbol}{(Number(metrics?.totalWeightedValue || 0) / 100000).toFixed(2)}L
                                            </h2>
                                            <p className="text-muted small mb-0">Total Expected Output Value Lost</p>
                                        </div>
                                        <div className="ms-auto flex-grow-1" style={{ height: '80px', maxWidth: '300px' }}>
                                            <div className="bg-light rounded p-3 text-center h-100 d-flex align-items-center justify-content-center">
                                                <small className="text-muted">Impact formula: Value × Stage Weight × Lead Quality</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row g-4 mb-4">
                            <div className="col-lg-6">
                                <div className="card shadow-sm border-0 rounded-4">
                                    <div className="card-header bg-white py-3 border-0">
                                        <h5 className="mb-0 fw-bold">Top 5 Loss Reasons</h5>
                                    </div>
                                    <div className="card-body p-4" style={{ height: '350px' }}>
                                        {topReasons.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={topReasons} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                                    <XAxis type="number" />
                                                    <YAxis dataKey="reason" type="category" width={120} tick={{ fontSize: 12 }} />
                                                    <RechartsTooltip />
                                                    <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="text-center h-100 d-flex align-items-center justify-content-center">
                                                <p className="text-muted">No loss data recorded yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-6">
                                <div className="card shadow-sm border-0 rounded-4">
                                    <div className="card-header bg-white py-3 border-0">
                                        <h5 className="mb-0 fw-bold">Leakage by Stage</h5>
                                    </div>
                                    <div className="card-body p-4" style={{ height: '350px' }}>
                                        {metrics?.lossRateByStage?.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={metrics.lossRateByStage}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={100}
                                                        fill="#8884d8"
                                                        dataKey="count"
                                                        nameKey="stage"
                                                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                                    >
                                                        {metrics.lossRateByStage.map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="text-center h-100 d-flex align-items-center justify-content-center">
                                                <p className="text-muted">No stage leakage data available.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row g-4">
                            <div className="col-lg-6">
                                <div className="card shadow-sm border-0 rounded-4">
                                    <div className="card-header bg-white py-3 border-0">
                                        <h5 className="mb-0 fw-bold">Agent Loss Analysis</h5>
                                        <p className="text-muted small mb-0">Identifying training opportunities based on leakage</p>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="px-4">Agent Name</th>
                                                    <th>Total Lost</th>
                                                    <th>Weighted Impact</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employeeAnalysis.map((emp, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 fw-medium"><i className="bi bi-person me-2"></i> {emp.agent}</td>
                                                        <td>
                                                            <span className="badge bg-danger-subtle text-danger fs-6">{emp.lost}</span>
                                                        </td>
                                                        <td>{currencySymbol}{(emp.weightedValue / 100000).toFixed(2)}L</td>
                                                    </tr>
                                                ))}
                                                {employeeAnalysis.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="text-center py-4 text-muted">No agent loss data found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-6">
                                <div className="card shadow-sm border-0 rounded-4">
                                    <div className="card-header bg-white py-3 border-0">
                                        <h5 className="mb-0 fw-bold">Project Loss Distribution</h5>
                                        <p className="text-muted small mb-0">Which projects are killing deals and why?</p>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="px-4">Project Name</th>
                                                    <th>Lost Deals</th>
                                                    <th>Top Loss Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projectAnalysis.map((proj, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 fw-medium"><i className="bi bi-building me-2"></i> {proj.title}</td>
                                                        <td>{proj.lostCount}</td>
                                                        <td><span className="badge bg-secondary-subtle text-secondary">{proj.topReason}</span></td>
                                                    </tr>
                                                ))}
                                                {projectAnalysis.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="text-center py-4 text-muted">No project loss data found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </MainLayout>
    );
}
