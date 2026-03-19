'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { partnerService } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';

interface Partner {
    id: string;
    email: string;
    companyName: string;
    website: string;
    name?: string;
    status: number;
    createdAt: string;
    partnerProfile?: {
        monthlyClientBase: string;
        country: string;
        salesCapability: string;
        commissionBalance: string;
    };
}

export default function AdminPartnerManagement() {
    const { isAuthenticated, isAdmin } = useAuthContext();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ show: true, message, type });
    };

    const fetchPartners = async () => {
        try {
            setLoading(true);
            const response = await partnerService.adminList();
            if (response.success) {
                setPartners(response.data.partners);
            }
        } catch (error: any) {
            console.error('Error fetching partners:', error);
            showToast(error.message || 'Failed to load partners', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchPartners();
        }
    }, [isAuthenticated, isAdmin]);

    const handleUpdateStatus = async (id: string, status: number) => {
        try {
            const response = await partnerService.adminUpdate(id, { status });
            if (response.success) {
                showToast('Partner status updated successfully');
                fetchPartners();
            }
        } catch (error: any) {
            showToast(error.message || 'Update failed', 'error');
        }
    };

    if (!isAdmin) return (
        <div className="p-5 text-center">
            <h2 className="text-danger">Access Denied</h2>
            <p className="text-muted">You must be an administrator to view this page.</p>
        </div>
    );

    return (
        <MainLayout activePage="partners">
            <div className="container-fluid py-4">
                <div className="mb-4">
                    <h1 className="h3 fw-bold">Partner Management</h1>
                    <p className="text-muted text-uppercase small letter-spacing-1">Review and manage platform partner applications</p>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 border-0 text-muted small fw-bold">PARTNER DETAILS</th>
                                    <th className="py-3 border-0 text-muted small fw-bold">MARKET REACH</th>
                                    <th className="py-3 border-0 text-muted small fw-bold">APPLICATION STATUS</th>
                                    <th className="px-4 py-3 border-0 text-muted small fw-bold text-end">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="text-center py-5">
                                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                        Syncing partner data...
                                    </td></tr>
                                ) : partners.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-5 opacity-50">No partner applications found</td></tr>
                                ) : partners.map((partner) => (
                                    <tr key={partner.id}>
                                        <td className="px-4 py-3">
                                            <div className="fw-bold text-dark">{partner.companyName || partner.name}</div>
                                            <div className="small text-muted">{partner.email}</div>
                                            {partner.website && <a href={partner.website} target="_blank" className="extra-small text-primary text-decoration-none">{partner.website}</a>}
                                        </td>
                                        <td>
                                            <div className="small fw-semibold">{partner.partnerProfile?.country || 'N/A'}</div>
                                            <div className="extra-small text-muted">{partner.partnerProfile?.monthlyClientBase || '0'} monthly users</div>
                                        </td>
                                        <td>
                                            {partner.status === 1 ? (
                                                <span className="badge rounded-pill bg-success-soft text-success px-3 py-2">Approved</span>
                                            ) : partner.status === 3 ? (
                                                <span className="badge rounded-pill bg-danger-soft text-danger px-3 py-2">Rejected</span>
                                            ) : (
                                                <span className="badge rounded-pill bg-warning-soft text-warning-dark px-3 py-2">Pending Review</span>
                                            )}
                                        </td>
                                        <td className="px-4 text-end">
                                            <div className="dropdown">
                                                <button className="btn btn-light btn-sm rounded-3 px-3 shadow-none border" data-bs-toggle="dropdown">
                                                    Manage <i className="bi bi-chevron-down ms-1 small"></i>
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-3">
                                                    <li><button className="dropdown-item py-2" onClick={() => handleUpdateStatus(partner.id, 1)}>
                                                        <i className="bi bi-check2-circle text-success me-2"></i> Approve Partner
                                                    </button></li>
                                                    <li><button className="dropdown-item py-2" onClick={() => handleUpdateStatus(partner.id, 3)}>
                                                        <i className="bi bi-x-circle text-danger me-2"></i> Reject Application
                                                    </button></li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li><button className="dropdown-item py-2 text-muted" onClick={() => handleUpdateStatus(partner.id, 2)}>
                                                        <i className="bi bi-arrow-counterclockwise me-2"></i> Reset to Pending
                                                    </button></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Toast 
                show={toast.show} 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast({ ...toast, show: false })} 
            />
            
            <style jsx>{`
                .extra-small { font-size: 11px; }
                .letter-spacing-1 { letter-spacing: 1px; }
                .bg-success-soft { background-color: rgba(16, 185, 129, 0.1); }
                .bg-danger-soft { background-color: rgba(239, 68, 68, 0.1); }
                .bg-warning-soft { background-color: rgba(245, 158, 11, 0.1); }
                .text-warning-dark { color: #b45309; }
            `}</style>
        </MainLayout>
    );
}
