'use client';

import { useState, useEffect, use } from 'react';
import { partnerService } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PartnerDetail {
    partner: {
        id: string;
        email: string;
        companyName: string;
        website: string;
        firstName: string;
        lastName: string;
        phone: string;
        status: number;
        createdAt: string;
        partnerProfile: {
            monthlyClientBase: string;
            country: string;
            salesCapability: string;
            commissionBalance: string;
        };
        referredTenants: Array<{
            id: string;
            name: string;
            domain: string;
            status: number;
            createdAt: string;
            plan: {
                name: string;
                price: string;
            };
            _count: {
                users: number;
                properties: number;
            };
        }>;
    };
    analytics: {
        totalRevenueGenerated: number;
        activeClients: number;
        conversionRate: number;
        monthlyEarnings: number;
    };
}

export default function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const [data, setData] = useState<PartnerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [emailLoading, setEmailLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
    const router = useRouter();

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ show: true, message, type });
    };

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const response = await partnerService.adminGetById(id);
            if (response.success) {
                setData(response.data);
            }
        } catch (error: any) {
            console.error('Error fetching partner detail:', error);
            showToast(error.message || 'Failed to load partner details', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleSendConfirmation = async () => {
        try {
            setEmailLoading(true);
            const response = await partnerService.adminSendConfirmation(id);
            if (response.success) {
                showToast('Confirmation email sent successfully');
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to send email', 'error');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleUpdateStatus = async (status: number) => {
        try {
            const response = await partnerService.adminUpdate(id, { status });
            if (response.success) {
                showToast('Partner status updated');
                fetchDetail();
            }
        } catch (error: any) {
            showToast(error.message || 'Update failed', 'error');
        }
    };

    if (loading) return (
        <MainLayout activePage="partners">
            <div className="d-flex align-items-center justify-content-center min-vh-100">
                <div className="spinner-border text-primary"></div>
            </div>
        </MainLayout>
    );

    if (!data) return (
        <MainLayout activePage="partners">
            <div className="container py-5 text-center">
                <h3>Partner Not Found</h3>
                <Link href="/realestate-admin/partners" className="btn btn-primary mt-3">Back to List</Link>
            </div>
        </MainLayout>
    );

    const { partner, analytics } = data;

    return (
        <MainLayout activePage="partners">
            <div className="container-fluid py-4 bg-light min-vh-100">
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <Link href="/realestate-admin/partners" className="text-decoration-none text-muted small fw-bold d-flex align-items-center gap-2 mb-2 hvr-translate-left">
                            <i className="bi bi-arrow-left"></i> BACK TO PARTNERS
                        </Link>
                        <h2 className="fw-extrabold text-dark mb-1">{partner.companyName}</h2>
                        <div className="d-flex align-items-center gap-3">
                            <span className="text-muted small"><i className="bi bi-geo-alt me-1"></i> {partner.partnerProfile.country}</span>
                            <span className="text-muted small"><i className="bi bi-calendar3 me-1"></i> Partner since {new Date(partner.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-white border shadow-sm rounded-3 px-4 fw-bold" 
                            onClick={handleSendConfirmation}
                            disabled={emailLoading}
                        >
                            {emailLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-envelope me-2"></i>}
                            Send Confirmation
                        </button>
                        {partner.status !== 1 && (
                            <button className="btn btn-success shadow-sm rounded-3 px-4 fw-bold" onClick={() => handleUpdateStatus(1)}>
                                <i className="bi bi-check2-circle me-2"></i> Approve Application
                            </button>
                        )}
                        {partner.status !== 3 && (
                            <button className="btn btn-outline-danger bg-white shadow-sm rounded-3 px-4 fw-bold" onClick={() => handleUpdateStatus(3)}>
                                <i className="bi bi-x-circle me-2"></i> Reject
                            </button>
                        )}
                    </div>
                </div>

                <div className="row g-4">
                    {/* Left Column: Analytics & Details */}
                    <div className="col-lg-4">
                        {/* Analytics Cards */}
                        <div className="row g-3 mb-4">
                            <div className="col-6">
                                <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
                                    <div className="text-muted extra-small fw-bold text-uppercase mb-2">Total Revenue</div>
                                    <div className="h4 fw-extrabold mb-0">${analytics.totalRevenueGenerated.toLocaleString()}</div>
                                    <div className="text-success extra-small fw-bold mt-2"><i className="bi bi-graph-up me-1"></i> Platform Value</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
                                    <div className="text-muted extra-small fw-bold text-uppercase mb-2">Partner Earnings</div>
                                    <div className="h4 fw-extrabold mb-0 text-primary">${analytics.monthlyEarnings.toFixed(2)}</div>
                                    <div className="text-muted extra-small mt-2">10% Platform Commission</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
                                    <div className="text-muted extra-small fw-bold text-uppercase mb-2">Conversion</div>
                                    <div className="h4 fw-extrabold mb-0">{analytics.conversionRate.toFixed(1)}%</div>
                                    <div className="text-muted extra-small mt-2">{analytics.activeClients} Active Clients</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
                                    <div className="text-muted extra-small fw-bold text-uppercase mb-2">Account Status</div>
                                    <div className="mt-1">
                                        {partner.status === 1 ? (
                                            <span className="badge bg-success-soft text-success rounded-pill px-3 py-2">Verified</span>
                                        ) : partner.status === 3 ? (
                                            <span className="badge bg-danger-soft text-danger rounded-pill px-3 py-2">Rejected</span>
                                        ) : (
                                            <span className="badge bg-warning-soft text-warning-dark rounded-pill px-3 py-2">Pending</span>
                                        )}
                                    </div>
                                    <div className="text-muted extra-small mt-2">Distribution Partner</div>
                                </div>
                            </div>
                        </div>

                        {/* Partner Profile Details */}
                        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
                            <div className="card-header bg-white border-0 py-3 px-4">
                                <h5 className="mb-0 fw-bold">Partner Profile</h5>
                            </div>
                            <div className="card-body p-4 pt-0">
                                <div className="mb-4">
                                    <label className="text-muted extra-small fw-bold text-uppercase d-block mb-1">Primary Contact</label>
                                    <div className="fw-bold">{partner.firstName} {partner.lastName}</div>
                                    <div className="small text-muted">{partner.email}</div>
                                    <div className="small text-muted">{partner.phone}</div>
                                </div>
                                <div className="mb-4">
                                    <label className="text-muted extra-small fw-bold text-uppercase d-block mb-1">Market Reach</label>
                                    <div className="small"><i className="bi bi-globe me-2"></i> {partner.partnerProfile.country}</div>
                                    <div className="small mt-1"><i className="bi bi-people me-2"></i> {partner.partnerProfile.monthlyClientBase} Monthly Users</div>
                                </div>
                                <div className="mb-4">
                                    <label className="text-muted extra-small fw-bold text-uppercase d-block mb-1">Strategy Statement</label>
                                    <p className="small text-muted border-start border-3 ps-3 py-1 bg-light rounded-end">
                                        {partner.partnerProfile.salesCapability || "No strategy statement provided."}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-muted extra-small fw-bold text-uppercase d-block mb-1">Official Website</label>
                                    {partner.website ? (
                                        <a href={partner.website} target="_blank" className="text-primary text-decoration-none small fw-bold">
                                            {partner.website} <i className="bi bi-box-arrow-up-right ms-1"></i>
                                        </a>
                                    ) : (
                                        <span className="text-muted small">Not provided</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Client Accounts */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
                            <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0 fw-bold">Client Accounts</h5>
                                    <p className="text-muted small mb-0">List of tenants referred by this partner</p>
                                </div>
                                <div className="badge bg-light text-dark rounded-pill px-3 py-2 border">
                                    {partner.referredTenants.length} TOTAL REFERRALS
                                </div>
                            </div>
                            <div className="table-responsive px-4">
                                <table className="table table-hover align-middle">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 text-muted extra-small fw-bold">CLIENT NAME</th>
                                            <th className="border-0 text-muted extra-small fw-bold">PLAN</th>
                                            <th className="border-0 text-muted extra-small fw-bold text-center">ASSETS</th>
                                            <th className="border-0 text-muted extra-small fw-bold">JOINED</th>
                                            <th className="border-0 text-muted extra-small fw-bold">STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {partner.referredTenants.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-5 text-muted">
                                                    No client accounts associated with this partner yet.
                                                </td>
                                            </tr>
                                        ) : partner.referredTenants.map((client) => (
                                            <tr key={client.id} className="cursor-pointer" onClick={() => router.push(`/realestate-admin/workspace?tenantId=${client.id}`)}>
                                                <td>
                                                    <div className="fw-bold small">{client.name}</div>
                                                    <div className="extra-small text-muted">{client.domain}.realestate.com</div>
                                                </td>
                                                <td>
                                                    <div className="small fw-bold text-primary">{client.plan?.name || 'FREE'}</div>
                                                    <div className="extra-small text-muted">${client.plan?.price || '0'}/yr</div>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <span className="badge bg-light text-dark border extra-small" title="Properties">
                                                            <i className="bi bi-building me-1"></i> {client._count.properties}
                                                        </span>
                                                        <span className="badge bg-light text-dark border extra-small" title="Users">
                                                            <i className="bi bi-people me-1"></i> {client._count.users}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="extra-small text-muted">{new Date(client.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td>
                                                    {client.status === 1 ? (
                                                        <span className="text-success extra-small fw-bold d-flex align-items-center gap-1">
                                                            <span className="bg-success rounded-circle" style={{ width: 6, height: 6 }}></span> Active
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted extra-small fw-bold d-flex align-items-center gap-1">
                                                            <span className="bg-secondary rounded-circle" style={{ width: 6, height: 6 }}></span> Inactive
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
                .fw-extrabold { font-weight: 800; }
                .extra-small { font-size: 11px; }
                .bg-success-soft { background-color: rgba(16, 185, 129, 0.1); }
                .bg-danger-soft { background-color: rgba(239, 68, 68, 0.1); }
                .bg-warning-soft { background-color: rgba(245, 158, 11, 0.1); }
                .text-warning-dark { color: #b45309; }
                .hvr-translate-left { transition: all 0.3s ease; }
                .hvr-translate-left:hover { transform: translateX(-5px); }
                .btn-white { background-color: #fff; color: #1e293b; }
                .btn-white:hover { background-color: #f8fafc; }
            `}</style>
        </MainLayout>
    );
}
