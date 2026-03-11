'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import ModuleGuard from '@/components/common/ModuleGuard';
import { analyticsProService, agentService, leadService } from '@/app/services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import Toast from '@/components/common/Toast';
import TaskModal from '@/components/modules/realestate/tasks/TaskModal';



export default function DealPreventionPage() {
    return (
        <ModuleGuard moduleSlug="deal_intelligence">
            <DealPreventionContent mode="owner" />
        </ModuleGuard>
    );
}

function DealPreventionContent({ mode }: { mode: string }) {
    const [loading, setLoading] = useState(true);
    const [highRiskDeals, setHighRiskDeals] = useState<any[]>([]);
    const [topRiskSignals, setTopRiskSignals] = useState<any[]>([]);
    const [agentCoaching, setAgentCoaching] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [selectedDeal, setSelectedDeal] = useState<any>(null);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('deal_prevention_hideGuide');
        if (saved === 'true') {
            setShowHowItWorks(false);
        }
    }, []);

    const toggleGuide = (show: boolean) => {
        setShowHowItWorks(show);
        localStorage.setItem('deal_prevention_hideGuide', (!show).toString());
    };

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        fetchPreventionData();
        fetchAgents();
        fetchLeads();
    }, []);

    const fetchAgents = async () => {
        try {
            const token = localStorage.getItem('authToken') || '';
            const res = await agentService.getAgents(token);
            if (res.success) {
                // Handle different response structures gracefully
                const agentsData = res.data.agents || (Array.isArray(res.data) ? res.data : []);
                setAgents(agentsData);
            }
        } catch (error) {
            showToast('Failed to fetch agents', 'error');
        }
    };

    const fetchLeads = async () => {
        try {
            const token = localStorage.getItem('authToken') || '';
            const res = await leadService.getLeads(token, { limit: '1000' });
            if (res.success) {
                const leadsData = res.data.leads || (Array.isArray(res.data) ? res.data : []);
                setLeads(leadsData);
            }
        } catch (error) {
            console.error('Failed to fetch leads', error);
        }
    };

    const fetchPreventionData = async () => {
        try {
            setLoading(true);
            const res = await analyticsProService.getPreventionInsights();
            if (res.success && res.data) {
                setHighRiskDeals(res.data.highRiskDeals);
                setTopRiskSignals(res.data.topRiskSignals);
                setAgentCoaching(res.data.agentCoaching);
            }
        } catch (error) {
            showToast('Failed to fetch prevention insights', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTask = (deal: any, agent?: any) => {
        const aId = agent?.agentId || deal.agentId || deal.agentLeads?.[0]?.agentId;
        const aName = agent?.name || (deal.agent !== 'Unassigned' ? deal.agent : null) || deal.agentLeads?.[0]?.agent?.user?.name;

        setSelectedDeal({
            leadId: deal.id,
            leadName: deal.name,
            agentId: aId || null,
            agentName: aName || null
        });
        setTaskModalOpen(true);
    };


    const onTaskAssigned = () => {
        showToast("Task assigned successfully!", "success");
        fetchPreventionData();
    };



    return (
        <MainLayout activePage="deal-prevention">
            <div className="container-fluid py-4 text-dark">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div>
                            <h2 className="fw-bold mb-0 d-flex align-items-center">
                                <i className="bi bi-lightning-charge-fill me-2 text-warning"></i> Deal Loss Prevention
                            </h2>
                            <p className="text-muted">Proactive risk assessment & coaching to increase conversion</p>
                        </div>
                        {!showHowItWorks && (
                            <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold text-primary shadow-sm border mt-1" onClick={() => toggleGuide(true)}>
                                <i className="bi bi-info-circle me-1"></i> How it Works
                            </button>
                        )}
                    </div>
                    <button className="btn btn-dark btn-sm rounded-3 px-3" onClick={fetchPreventionData}>
                        <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''} me-1`}></i> Sync Intelligence
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
                                            <h3 className="fw-bold mb-3 text-white">Proactive Risk Management</h3>
                                            <p className="opacity-75 mb-4">Preventing deal loss before it happens. Here is how our AI monitors your pipeline:</p>
                                            <div className="row g-4">
                                                <div className="col-md-6">
                                                    <div className="d-flex gap-3">
                                                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className="bi bi-activity text-white"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">1. Risk Scoring</div>
                                                            <div className="small opacity-75">AI calculates the probability of a deal falling through based on activity silence and patterns.</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="d-flex gap-3">
                                                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className="bi bi-exclamation-triangle text-white"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">2. Signal Detection</div>
                                                            <div className="small opacity-75">Identify leakage signals early, like "No follow-up in 48h" or "Low engagement score".</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="d-flex gap-3">
                                                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className="bi bi-journal-check text-white"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">3. Coaching Board</div>
                                                            <div className="small opacity-75">Automated advice for sales managers on why specific deals are at risk.</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="d-flex gap-3">
                                                        <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className="bi bi-lightning-charge text-white"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">4. Prevention Tasking</div>
                                                            <div className="small opacity-75">Instantly assign "Save the Deal" tasks to agents or supervisors to rescue revenue.</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 d-none d-lg-block text-center">
                                            <i className="bi bi-lightning-charge display-1 opacity-25"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top Summary Cards */}
                        <div className="row g-4 mb-4">
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm rounded-4 bg-danger text-white p-4">
                                    <h6 className="text-white text-uppercase small fw-bold mb-3">Critical Risk Deals</h6>
                                    <h2 className="display-5 fw-bold mb-0 text-white">{highRiskDeals.length}</h2>
                                    <p className="small mb-0 mt-2">Score &gt; 60: Action Required Now</p>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm rounded-4 bg-dark text-white p-4">
                                    <h6 className="text-white text-uppercase small fw-bold mb-3">Primary Risk Signal</h6>
                                    <h2 className="h3 fw-bold mb-0">{topRiskSignals[0]?.signal || 'Calculating...'}</h2>
                                    <p className="small mb-0 mt-2">Impacts {topRiskSignals[0]?.count || 0} active leads</p>
                                </div>
                            </div>
                        </div>

                        <div className="row g-4 mb-4">
                            {/* High Risk Deals Table */}
                            <div className="col-lg-8">
                                <div className="card shadow-sm border-0 rounded-4">
                                    <div className="card-header bg-white py-3 border-0">
                                        <h5 className="mb-0 fw-bold">⚠️ Deals at Risk (Immediate Attention)</h5>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="px-4">Lead Name</th>
                                                    <th>Agent</th>
                                                    <th>Risk Score</th>
                                                    <th>Primary Concern</th>
                                                    <th className="text-end px-4">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {highRiskDeals.map((deal, i) => (
                                                    <tr key={i}>
                                                        <td className="px-4 fw-medium text-primary">{deal.name}</td>
                                                        <td>
                                                            {deal.agent}
                                                            {deal.taskStatus > 0 && deal.currentAssignee && deal.currentAssignee !== deal.agent && (
                                                                <div className="small text-muted mt-1" style={{ fontSize: '10px' }}>
                                                                    <i className="bi bi-person-badge me-1"></i>
                                                                    Tasked to: {deal.currentAssignee}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="progress flex-grow-1" style={{ height: '6px', minWidth: '60px' }}>
                                                                    <div
                                                                        className={`progress-bar ${deal.score > 80 ? 'bg-danger' : 'bg-warning'}`}
                                                                        role="progressbar"
                                                                        style={{ width: `${deal.score}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="fw-bold small">{deal.score}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-light text-danger border border-danger border-opacity-10 small mb-1 d-block text-truncate" style={{ maxWidth: '150px' }}>
                                                                {deal.signals[0]}
                                                            </span>
                                                            {deal.taskStatus === 1 && <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-10 fw-normal" style={{ fontSize: '10px' }}>Assignment Pending</span>}
                                                            {deal.taskStatus === 2 && <span className="badge bg-info-subtle text-info border border-info border-opacity-10 fw-normal" style={{ fontSize: '10px' }}>Agent In-Progress</span>}
                                                        </td>
                                                        <td className="text-end px-4">
                                                            <button
                                                                className={`btn btn-sm ${deal.taskStatus > 0 ? 'btn-outline-secondary' : 'btn-outline-primary'} rounded-pill px-3`}
                                                                onClick={() => handleAssignTask(deal)}
                                                            >
                                                                <i className={`bi ${deal.taskStatus > 0 ? 'bi-arrow-repeat' : 'bi-plus-circle'} me-1`}></i>
                                                                {deal.taskStatus > 0 ? 'Reassign' : 'Assign Task'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}


                                                {highRiskDeals.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-4 text-muted">No high-risk deals detected yet. Good job!</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Top Risk Signals Chart */}
                            <div className="col-lg-4">
                                <div className="card shadow-sm border-0 rounded-4 h-100">
                                    <div className="card-header bg-white py-3 border-0">
                                        <h5 className="mb-0 fw-bold">Leakage Signals</h5>
                                    </div>
                                    <div className="card-body p-4">
                                        {topRiskSignals.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={topRiskSignals} layout="vertical">
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="signal" type="category" width={100} tick={{ fontSize: 10 }} />
                                                    <RechartsTooltip />
                                                    <Bar dataKey="count" fill="#ffc107" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="text-center py-5 text-muted small">Insufficient data</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Agent Coaching Insights */}
                        <div className="row g-4">
                            <div className="col-12">
                                <div className="card shadow-sm border-0 rounded-4">
                                    <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-0 fw-bold">Sales Coaching Board</h5>
                                            <p className="text-muted small mb-0">Actionable advice for your sales team</p>
                                        </div>
                                    </div>
                                    <div className="card-body p-4 pt-0">
                                        <div className="row g-4">
                                            {agentCoaching.map((coach, i) => (
                                                <div key={i} className="col-md-6 col-xl-4">
                                                    <div className="p-4 bg-light rounded-4 h-100 border border-white">
                                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="avatar sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                                                    {coach.name ? coach.name[0] : '?'}
                                                                </div>
                                                                <h6 className="fw-bold mb-0">{coach.name || 'Unknown Agent'}</h6>
                                                            </div>
                                                            <span className="badge bg-warning text-dark">{coach.highRiskCount} Risk Deals</span>
                                                        </div>

                                                        <div className="mb-3">
                                                            <p className="small text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '10px' }}>Top Performance Leak</p>
                                                            <div className="d-flex align-items-center gap-2 text-danger fw-semibold">
                                                                <i className="bi bi-exclamation-triangle-fill"></i>
                                                                {coach.topLeaks[0]?.signal || 'N/A'}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <p className="small text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '10px' }}>Urgent Actions</p>
                                                            <ul className="list-unstyled mb-0">
                                                                {coach.urgentActions.map((action: any, idx: number) => (
                                                                    <li key={idx} className="small mb-2 d-flex align-items-center justify-content-between gap-2">
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <i className={`bi bi-dot fs-4 ${action.taskStatus > 0 ? 'text-success' : 'text-primary'}`}></i>
                                                                            <span>Follow up with <strong>{action.name}</strong></span>
                                                                            {action.taskStatus > 0 && <span className="badge bg-success-subtle text-success border border-success border-opacity-10 fw-normal ms-1" style={{ fontSize: '9px' }}>Assigned</span>}
                                                                        </div>
                                                                        <button
                                                                            className={`btn btn-sm p-0 ${action.taskStatus > 0 ? 'text-secondary' : 'text-primary'} border-0 bg-transparent`}
                                                                            onClick={() => handleAssignTask(action, coach)}
                                                                            title={action.taskStatus > 0 ? "Reassign follow-up task" : "Assign follow-up task"}
                                                                        >
                                                                            <i className={`bi ${action.taskStatus > 0 ? 'bi-arrow-repeat' : 'bi-send-plus-fill'}`}></i>
                                                                        </button>

                                                                    </li>
                                                                ))}

                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {agentCoaching.length === 0 && (
                                                <div className="col-12 text-center py-5">
                                                    <p className="text-muted">No coaching insights available yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <TaskModal
                isOpen={taskModalOpen}
                onClose={() => setTaskModalOpen(false)}
                leadId={selectedDeal?.leadId}
                leadName={selectedDeal?.leadName}
                agentId={selectedDeal?.agentId}
                agentName={selectedDeal?.agentName}
                agents={agents}
                leads={leads}
                onSuccess={onTaskAssigned}
            />

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <style jsx>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </MainLayout>
    );
}
