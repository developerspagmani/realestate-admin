'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { automationApi } from '@/lib/api/social';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function MatchingEnginePage() {
    return (
        <ModuleGuard moduleSlug="automation_engine">
            <MatchingContent />
        </ModuleGuard>
    );
}

function MatchingContent() {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [waitingLeads, setWaitingLeads] = useState<any[]>([]);
    const [matchingLeadId, setMatchingLeadId] = useState<string | null>(null);

    const fetchLeads = async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const res = await automationApi.getWaitingLeads({ tenantId: user.tenantId });
            if (res.success) {
                setWaitingLeads(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch waiting leads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.tenantId) {
            fetchLeads();
        }
    }, [user?.tenantId]);

    const handleForceMatch = async (leadId: string) => {
        setMatchingLeadId(leadId);
        try {
            const res = await automationApi.forceMatch(leadId, user?.tenantId);
            if (res.success) {
                alert(`Match found! ${res.data.matchCount} properties found. Automated outreach started via ${res.data.channel}.`);
                fetchLeads();
            } else {
                alert(res.message || 'No matches found at this time.');
            }
        } catch (error) {
            console.error('Force match failed:', error);
            alert('Failed to execute matching engine.');
        } finally {
            setMatchingLeadId(null);
        }
    };

    const handleViewLead = (leadId: string) => {
        // Redirect to lead details or show modal
        window.location.href = `/realestate-owner-admin/leads?id=${leadId}`;
    };

    return (
        <MainLayout activePage="social-matching">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark">PropMatch™ Engine</h2>
                        <p className="text-muted">High-intent leads waiting for properties that match their preferences.</p>
                    </div>
                    <button className="btn btn-outline-primary btn-sm rounded-3" onClick={fetchLeads}>
                        <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Refresh Engine
                    </button>
                </div>

                <div className="row">
                    <div className="col-lg-12">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-header bg-white py-3 border-0">
                                <h5 className="mb-0 fw-bold">Active Waiting Leads</h5>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4">Lead Name</th>
                                            <th>Target Location</th>
                                            <th>Budget Range</th>
                                            <th>Property Type</th>
                                            <th>Waiting Since</th>
                                            <th className="text-end px-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {waitingLeads.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-5">
                                                    <i className="bi bi-person-dash display-4 text-muted opacity-25 d-block mb-3"></i>
                                                    <p className="text-muted">No high-intent leads waiting for matches.</p>
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
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="card-footer bg-white py-3 border-0 text-center border-top">
                                <p className="text-muted small mb-0">
                                    <i className="bi bi-robot me-1 text-primary"></i> The AI Matching Engine is automatically monitoring these leads 24/7 for you.
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
