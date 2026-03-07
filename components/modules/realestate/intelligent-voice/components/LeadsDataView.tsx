import React from 'react';
import { Lead } from '@/app/services/api';
import { getStatusBadge } from '../utils/statusHelpers';

interface LeadsDataViewProps {
    leads: Lead[];
}

export default function LeadsDataView({ leads }: LeadsDataViewProps) {
    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ animation: 'fadeInUp 0.5s ease' }}>
            <div className="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0"><i className="bi bi-funnel-fill text-primary me-2"></i> Artificial Lead Sourcing</h5>
                <span className="badge bg-primary rounded-pill px-3 py-2">{leads.length} Results</span>
            </div>
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th className="ps-4">Client</th>
                            <th>Contact</th>
                            <th>Property Interest</th>
                            <th>Status</th>
                            <th className="pe-4 text-end">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length > 0 ? leads.map((lead) => (
                            <tr key={lead.id}>
                                <td className="ps-4">
                                    <div className="fw-bold text-dark">{lead.name}</div>
                                    <div className="small text-muted">Lead ID: {lead.id.substring(0, 8).toUpperCase()}</div>
                                </td>
                                <td>
                                    <div className="small"><i className="bi bi-envelope me-1"></i>{lead.email || 'N/A'}</div>
                                    <div className="small"><i className="bi bi-telephone me-1"></i>{lead.phone || 'N/A'}</div>
                                </td>
                                <td>{lead.property?.title || 'General Inquiry'}</td>
                                <td>{getStatusBadge(lead.status, 'lead')}</td>
                                <td className="pe-4 text-end small text-secondary">{new Date(lead.createdAt).toLocaleDateString()}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="text-center py-5 text-muted">No leads found matching this criteria.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
