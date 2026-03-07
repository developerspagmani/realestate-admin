import React from 'react';
import { Lead } from '@/app/services/types';

interface DashboardRecentLeadsProps {
    leads: Lead[];
    loading: boolean;
}

export default function DashboardRecentLeads({ leads, loading }: DashboardRecentLeadsProps) {
    return (
        <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Recent Enquiries</h5>
                <span className="badge bg-info-soft text-info rounded-pill px-3 py-2 small">New</span>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3 border-0 small text-uppercase text-muted">Lead / Contact</th>
                                <th className="py-3 border-0 small text-uppercase text-muted">Property</th>
                                <th className="py-3 border-0 small text-uppercase text-muted text-center">Status</th>
                                <th className="pe-4 py-3 border-0 small text-uppercase text-muted text-end">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><div className="skeleton h-2rem w-100"></div></td>
                                        <td className="py-3"><div className="skeleton h-1rem w-75"></div></td>
                                        <td className="py-3 text-center"><div className="skeleton h-2rem w-50 mx-auto rounded-pill"></div></td>
                                        <td className="pe-4 py-3 text-end"><div className="skeleton h-1rem w-75 ms-auto"></div></td>
                                    </tr>
                                ))
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-5 text-muted small">No recent leads found</td>
                                </tr>
                            ) : leads.map((lead) => (
                                <tr key={lead.id}>
                                    <td className="px-4 py-3">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-sm bg-info-soft rounded-circle p-2 me-2 text-center" style={{ width: '35px', height: '35px' }}>
                                                <i className="bi bi-person-fill text-info small"></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold small">{lead.name || 'Anonymous'}</div>
                                                <div className="text-muted extra-small">{lead.email || lead.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <div className="small text-truncate" style={{ maxWidth: '150px' }}>
                                            {lead.property?.title || 'General Enquiry'}
                                        </div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={`badge rounded-pill px-3 ${lead.status === 1 ? 'bg-primary-soft text-primary' :
                                                lead.status === 2 ? 'bg-info-soft text-info' :
                                                    lead.status === 3 ? 'bg-success-soft text-success' :
                                                        'bg-secondary-soft text-secondary'
                                            }`}>
                                            {lead.status === 1 ? 'New' : lead.status === 2 ? 'Contacted' : lead.status === 3 ? 'Qualified' : 'Closed'}
                                        </span>
                                    </td>
                                    <td className="pe-4 py-3 text-end text-muted extra-small">
                                        {new Date(lead.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <style jsx>{`
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-secondary-soft { background-color: rgba(108, 117, 125, 0.1); }
                .extra-small { font-size: 11px; }
                .skeleton {
                    background: rgba(0,0,0,0.05);
                    border-radius: 4px;
                    animation: pulse 1.5s infinite ease-in-out;
                }
                .h-2rem { height: 2rem; }
                .h-1rem { height: 1rem; }
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
