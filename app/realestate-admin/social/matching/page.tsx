'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useAuthContext } from '@/app/contexts/AuthContext';

import { automationApi } from '@/lib/api/social';

export default function MatchingEngineAdminPage() {
    const [loading, setLoading] = useState(true);
    const [waitingLeads, setWaitingLeads] = useState<any[]>([]);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const res = await automationApi.getWaitingLeads();
                if (res.success) {
                    setWaitingLeads(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch waiting leads:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, []);

    return (
        <MainLayout activePage="social-matching">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold text-dark">PropMatch™ Global Engine</h2>
                        <p className="text-muted">Platform-wide monitor for lead-to-property matching.</p>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4">Lead Name</th>
                                    <th>Tenant</th>
                                    <th>Location</th>
                                    <th>Budget</th>
                                    <th>Type</th>
                                    <th>Waiting Since</th>
                                    <th className="text-end px-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {waitingLeads.map(lead => (
                                    <tr key={lead.id}>
                                        <td className="px-4 fw-semibold">{lead.name}</td>
                                        <td><span className="badge bg-primary-subtle text-primary">{lead.tenant}</span></td>
                                        <td>{lead.location}</td>
                                        <td>{lead.budget}</td>
                                        <td>{lead.type}</td>
                                        <td>{lead.date}</td>
                                        <td className="text-end px-4">
                                            <button className="btn btn-sm btn-light-primary"><i className="bi bi-search"></i> Match</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
