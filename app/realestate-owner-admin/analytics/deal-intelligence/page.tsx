'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
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

    const { data: intelligenceData, isLoading, refetch } = useQuery({
        queryKey: ['dealIntelligence'],
        queryFn: async () => {
            const res = await analyticsProService.getDealIntelligence();
            return res.success ? res.data : null;
        }
    });

    const metrics = intelligenceData?.metrics || null;
    const topReasons = intelligenceData?.topReasons || [];
    const employeeAnalysis = intelligenceData?.employeeAnalysis || [];
    const projectAnalysis = intelligenceData?.projectAnalysis || [];

    const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

    return (
        <MainLayout activePage="deal-intelligence">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark mb-0 d-flex align-items-center">
                            <i className="bi bi-shield-x me-2 text-danger"></i> Deal Lost Intelligence
                        </h2>
                        <p className="text-muted">Transforming lost deals into actionable sales intelligence</p>
                    </div>
                    <button className="btn btn-primary btn-sm rounded-3" onClick={() => refetch()}>
                        <i className={`bi bi-arrow-clockwise ${isLoading ? 'spin' : ''} me-1`}></i> Refresh Data
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <>
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
                                                {employeeAnalysis.map((emp: any, i: number) => (
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
                                                {projectAnalysis.map((proj: any, i: number) => (
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
