'use client';

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { automationApi } from '@/lib/api/social';
import ModuleGuard from '@/components/common/ModuleGuard';
import Toast from '@/components/common/Toast';

export default function MatchingEnginePage() {
    return (
        <ModuleGuard moduleSlug="social_posts">
            <MatchingContent />
        </ModuleGuard>
    );
}

function MatchingContent() {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [waitingLeads, setWaitingLeads] = useState<any[]>([]);
    const [matchedLeads, setMatchedLeads] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'waiting' | 'matched'>('waiting');
    const [matchingLeadId, setMatchingLeadId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });

    const fetchLeads = useCallback(async (showRefreshToast = false) => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const [waitingRes, matchedRes] = await Promise.all([
                automationApi.getWaitingLeads({ tenantId: user.tenantId }),
                automationApi.getMatchedLeads({ tenantId: user.tenantId })
            ]);

            let waitCount = 0;
            let matchCount = 0;

            if (waitingRes.success && waitingRes.data) {
                setWaitingLeads(waitingRes.data);
                waitCount = waitingRes.data.length;
            }
            if (matchedRes.success && matchedRes.data) {
                setMatchedLeads(matchedRes.data);
                matchCount = matchedRes.data.length;
            }

            if (showRefreshToast) {
                if (waitCount === 0 && matchCount > 0) {
                    setToast({ show: true, message: 'Engine refreshed. All your leads have already been successfully matched with properties!', type: 'success' });
                } else {
                    setToast({ show: true, message: 'Engine refreshed successfully.', type: 'info' });
                }
            }

        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.tenantId]);

    useEffect(() => {
        if (user?.tenantId) {
            fetchLeads();
        }
    }, [user?.tenantId, fetchLeads]);

    const handleForceMatch = async (leadId: string) => {
        setMatchingLeadId(leadId);
        try {
            const res = await automationApi.forceMatch(leadId, user?.tenantId);
            if (res.success) {
                if (res.data.matchCount > 0) {
                    setToast({ show: true, message: `Match found! ${res.data.matchCount} properties found. Automated outreach started.`, type: 'success' });
                    fetchLeads();
                } else {
                    setToast({ show: true, message: 'No exact property matches found for their criteria at this time.', type: 'info' });
                }
            } else {
                setToast({ show: true, message: res.message || 'Failed to trigger matching engine.', type: 'error' });
            }
        } catch (error) {
            console.error('Force match failed:', error);
            setToast({ show: true, message: 'Failed to execute matching engine.', type: 'error' });
        } finally {
            setMatchingLeadId(null);
        }
    };

    const handleViewLead = (leadId: string) => {
        window.location.href = `/realestate-owner-admin/leads?id=${leadId}`;
    };

    return (
        <MainLayout activePage="social-matching">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark">PropMatch™ Engine</h2>
                        <p className="text-muted mb-0">High-intent leads waiting for properties that match their preferences.</p>
                    </div>
                    <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => fetchLeads(true)}>
                        <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Refresh Engine
                    </button>
                </div>

                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type === 'info' ? 'success' : toast.type as 'success' | 'error'}
                    onClose={() => setToast({ ...toast, show: false })}
                />

                <div className="row">
                    <div className="col-lg-12">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                            <div className="card-header bg-white py-3 border-0 d-flex gap-3 px-4">
                                <button
                                    className={`btn btn-sm ${activeTab === 'waiting' ? 'btn-primary' : 'btn-light text-muted'}`}
                                    onClick={() => setActiveTab('waiting')}
                                    style={{ borderRadius: '20px', padding: '0.4rem 1rem' }}
                                >
                                    Waiting Queue ({waitingLeads.length})
                                </button>
                                <button
                                    className={`btn btn-sm ${activeTab === 'matched' ? 'btn-primary' : 'btn-light text-muted'}`}
                                    onClick={() => setActiveTab('matched')}
                                    style={{ borderRadius: '20px', padding: '0.4rem 1rem' }}
                                >
                                    Already Matched ({matchedLeads.length})
                                </button>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4">Lead Name</th>
                                            <th>Target Location</th>
                                            <th>Budget Range</th>
                                            <th>Property Type</th>
                                            {activeTab === 'waiting' ? <th>Waiting Since</th> : <th>Matched Date</th>}
                                            <th className="text-end px-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeTab === 'waiting' ? (
                                            waitingLeads.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-5">
                                                        <i className="bi bi-person-dash display-4 text-muted opacity-25 d-block mb-3"></i>
                                                        <p className="text-muted fw-medium">No high-intent leads waiting for matches.</p>
                                                        {matchedLeads.length > 0 && <p className="text-success small"><i className="bi bi-check-circle-fill me-1"></i> All your leads have already been successfully matched!</p>}
                                                    </td>
                                                </tr>
                                            ) : (
                                                waitingLeads.map(lead => (
                                                    <tr key={lead.id}>
                                                        <td className="px-4">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="bg-primary-subtle text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '12px', fontWeight: 'bold' }}>
                                                                    {lead.name.substring(0, 1)}
                                                                </div>
                                                                <div className="fw-semibold">{lead.name}</div>
                                                            </div>
                                                        </td>
                                                        <td><i className="bi bi-geo-alt text-danger me-1"></i> {lead.location}</td>
                                                        <td><span className="badge bg-success-subtle text-success">{lead.budget}</span></td>
                                                        <td>{lead.type}</td>
                                                        <td>{lead.date}</td>
                                                        <td className="text-end px-4">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary me-2 rounded-3"
                                                                onClick={() => handleViewLead(lead.id)}
                                                            >
                                                                <i className="bi bi-eye"></i> View Lead
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-primary rounded-3"
                                                                disabled={matchingLeadId === lead.id}
                                                                onClick={() => handleForceMatch(lead.id)}
                                                            >
                                                                {matchingLeadId === lead.id ? (
                                                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                ) : (
                                                                    <i className="bi bi-lightning-charge"></i>
                                                                )}
                                                                {matchingLeadId === lead.id ? ' Matching...' : ' Force Match'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )
                                        ) : (
                                            matchedLeads.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-5">
                                                        <i className="bi bi-check-all display-4 text-muted opacity-25 d-block mb-3"></i>
                                                        <p className="text-muted">No successfully matched leads yet.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                matchedLeads.map(lead => (
                                                    <tr key={lead.id}>
                                                        <td className="px-4">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="bg-success-subtle text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '12px', fontWeight: 'bold' }}>
                                                                    {lead.name.substring(0, 1)}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-semibold">{lead.name}</div>
                                                                    <div className="text-muted small">{lead.matchCount} Properties Matched</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><i className="bi bi-geo-alt text-danger me-1"></i> {lead.location}</td>
                                                        <td><span className="badge bg-success-subtle text-success">{lead.budget}</span></td>
                                                        <td>{lead.type}</td>
                                                        <td>{lead.matchedDate}</td>
                                                        <td className="text-end px-4">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary rounded-3"
                                                                onClick={() => handleViewLead(lead.id)}
                                                            >
                                                                <i className="bi bi-eye"></i> View Lead
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="card-footer bg-white py-3 border-0 text-center border-top">
                                <p className="text-muted small mb-0">
                                    <i className="bi bi-robot me-1 text-primary"></i> The AI Matching Engine is automatically monitoring your lead pool 24/7.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
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
