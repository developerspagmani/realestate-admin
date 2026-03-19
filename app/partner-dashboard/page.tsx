'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { partnerService } from '@/app/services/api';
import Toast from '@/components/common/Toast';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';

export default function PartnerDashboard() {
    const { user, isAuthenticated, logout } = useAuthContext();
    const [partnerProfile, setPartnerProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ show: true, message, type });
    };

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await partnerService.getProfile();
            if (response.success) {
                setPartnerProfile(response.data.partner);
            }
        } catch (error: any) {
            console.error('Error fetching partner data:', error);
            showToast('Unable to load your partner metrics', 'error');
        } finally {
            setLoading(false);
        }
    };

    const [showAddModal, setShowAddModal] = useState(false);
    const [addingClient, setAddingClient] = useState(false);
    const [clientData, setClientData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        companyName: '',
        country: 'India'
    });

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingClient(true);
        try {
            const response = await partnerService.addClient(clientData);
            if (response.success) {
                showToast('Client account created and verified successfully!', 'success');
                setShowAddModal(false);
                setClientData({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    phone: '',
                    companyName: '',
                    country: 'India'
                });
                fetchProfileData(); // Refresh metrics
            }
        } catch (error: any) {
            showToast(error.message || 'Error creating client account', 'error');
        } finally {
            setAddingClient(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchProfileData();
        }
    }, [isAuthenticated]);

    if (loading) return (
        <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
            <div className="spinner-border text-primary mb-3"></div>
            <p className="text-muted small fw-bold text-uppercase letter-spacing-1">Syncing Partner Hub...</p>
        </div>
    );

    return (
        <MainLayout activePage="partner-dashboard" hideSidebar={true}>
            <div className="container py-4">
                {/* Modern Header Section */}
                <div className="mb-5 d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Partner Overview</h1>
                        <p className="text-muted small">Tracking your referral metrics and commission growth</p>
                    </div>
                    <div className="badge bg-success-subtle text-success border border-success-subtle p-3 rounded-4 shadow-sm fw-bold">
                        <i className="bi bi-patch-check-fill me-2"></i>
                        VERIFIED PARTNER
                    </div>
                </div>

                <div className="row g-4 mb-5">
                    {/* Performance Metrics */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm p-4 h-100 hover-up overflow-hidden">
                            <div className="position-absolute top-0 end-0 p-3 opacity-10">
                                <i className="bi bi-wallet2 display-3 pe-none"></i>
                            </div>
                            <div className="mb-4">
                                <span className="small-caps">Revenue & Earnings</span>
                            </div>
                            <h2 className="fw-bold mb-2">₹{parseFloat(partnerProfile?.partnerProfile?.commissionBalance || '0').toLocaleString()}</h2>
                            <p className="extra-small text-success fw-bold mb-0">AVAILABLE FOR WITHDRAWAL</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm p-4 h-100 hover-up overflow-hidden">
                            <div className="position-absolute top-0 end-0 p-3 opacity-10 text-primary">
                                <i className="bi bi-graph-up-arrow display-3 pe-none"></i>
                            </div>
                            <div className="mb-4">
                                <span className="small-caps">Conversion Success</span>
                            </div>
                            <h2 className="fw-bold mb-2">0%</h2>
                            <p className="extra-small text-muted fw-bold mb-0">FROM 0 TOTAL REFERRALS</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm p-4 h-100 bg-dark text-white hover-up overflow-hidden">
                            <div className="position-absolute top-0 end-0 p-3 opacity-20">
                                <i className="bi bi-award display-3 pe-none"></i>
                            </div>
                            <div className="mb-4">
                                <span className="small-caps text-white-50">Partnership Tier</span>
                            </div>
                            <h2 className="fw-bold mb-2 text-white">ELITE</h2>
                            <p className="extra-small text-warning fw-bold mb-0">TOP 1% OF PARTNERS</p>
                        </div>
                    </div>
                </div>

                <div className="row g-4 mb-5">
                    {/* Activity Feed Placeholder */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm h-100 overflow-hidden">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h6 className="fw-bold mb-0">Recent Referral Activity</h6>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-light btn-sm px-3" onClick={() => {
                                        const link = `${window.location.origin}/register/real-estate?partnerId=${user?.id}`;
                                        navigator.clipboard.writeText(link);
                                        showToast('Referral link copied to clipboard!', 'success');
                                    }}>
                                        <i className="bi bi-link-45deg me-1"></i> Copy Link
                                    </button>
                                    <Link href={`/register/real-estate?partnerId=${user?.id}`} className="btn btn-dark btn-sm px-3">
                                        Track New Lead
                                    </Link>
                                </div>
                            </div>
                            <div className="card-body d-flex flex-column align-items-center justify-content-center py-5 opacity-40">
                                <div className="bg-light rounded-circle p-4 mb-3">
                                    <i className="bi bi-folder2-open fs-2"></i>
                                </div>
                                <h6 className="fw-bold m-0">No referral activity logged yet</h6>
                                <p className="small">Your redirected leads will appear here for tracking.</p>
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header">
                                <h6 className="fw-bold mb-0">Partner Resources</h6>
                            </div>
                            <div className="p-3">
                                <div className="list-group list-group-flush gap-2 mt-1">
                                    <div className="list-group-item px-3 py-3 rounded-4 border-0 bg-light d-flex align-items-center gap-3 transition-hover mb-2" onClick={() => setShowAddModal(true)}>
                                        <div className="bg-dark text-white rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                            <i className="bi bi-person-plus-fill"></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-bold fs-14">Add Client Account</div>
                                            <div className="extra-small text-muted fw-medium">Setup & Verification Flow</div>
                                        </div>
                                        <i className="bi bi-chevron-right opacity-50"></i>
                                    </div>
                                    <div className="list-group-item px-3 py-3 rounded-4 border-0 bg-light d-flex align-items-center gap-3 transition-hover mb-2" onClick={() => {
                                        showToast('Preparing Sales Guide for download...', 'info');
                                    }}>
                                        <div className="bg-danger text-white rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                            <i className="bi bi-file-earmark-pdf"></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-bold fs-14">Sales Guide 2026</div>
                                            <div className="extra-small text-muted fw-medium">PDF • 4.2 MB</div>
                                        </div>
                                        <i className="bi bi-download opacity-50"></i>
                                    </div>
                                    <div className="list-group-item px-3 py-3 rounded-4 border-0 bg-light d-flex align-items-center gap-3 transition-hover" onClick={() => {
                                        showToast('Preparing Brand Kit ZIP for download...', 'info');
                                    }}>
                                        <div className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                            <i className="bi bi-images"></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-bold fs-14">Brand Kit (Zipped)</div>
                                            <div className="extra-small text-muted fw-medium">ZIP • 120 MB</div>
                                        </div>
                                        <i className="bi bi-download opacity-50"></i>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-dark text-white rounded-4 text-center shadow-lg position-relative overflow-hidden">
                                    <div className="position-absolute top-0 end-0 p-3 opacity-10">
                                        <i className="bi bi-rocket display-5 pe-none"></i>
                                    </div>
                                    <h6 className="fw-bold mb-2 small-caps text-white">How to Verify?</h6>
                                    <p className="extra-small mb-3 opacity-70">1. Create account via 'Add Client' button<br />2. Dashboard auto-verifies upon activation</p>
                                    <button className="btn btn-outline-light btn-sm w-100 rounded-pill fw-bold">Support Portal</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                    <div className="bg-white rounded-5 shadow-lg overflow-hidden animate-fade-in mx-3" style={{ width: '100%', maxWidth: '600px' }}>
                        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold m-0 small-caps text-dark">Manual Client Enrollment</h5>
                            <button className="btn-close" onClick={() => setShowAddModal(false)}></button>
                        </div>
                        <form onSubmit={handleAddClient} className="p-4">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="extra-small fw-bold text-muted mb-1 opacity-75">FIRST NAME</label>
                                    <input type="text" className="form-control" value={clientData.firstName} onChange={e => setClientData({ ...clientData, firstName: e.target.value })} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="extra-small fw-bold text-muted mb-1 opacity-75">LAST NAME</label>
                                    <input type="text" className="form-control" value={clientData.lastName} onChange={e => setClientData({ ...clientData, lastName: e.target.value })} required />
                                </div>
                                <div className="col-12">
                                    <label className="extra-small fw-bold text-muted mb-1 opacity-75">CLIENT EMAIL (OWNER)</label>
                                    <input type="email" className="form-control" value={clientData.email} onChange={e => setClientData({ ...clientData, email: e.target.value })} required />
                                </div>
                                <div className="col-12">
                                    <label className="extra-small fw-bold text-muted mb-1 opacity-75">AGENCY / COMPANY NAME</label>
                                    <input type="text" className="form-control" value={clientData.companyName} onChange={e => setClientData({ ...clientData, companyName: e.target.value })} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="extra-small fw-bold text-muted mb-1 opacity-75">PASSWORD</label>
                                    <input type="password" placeholder="Setup initial access" className="form-control" value={clientData.password} onChange={e => setClientData({ ...clientData, password: e.target.value })} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="extra-small fw-bold text-muted mb-1 opacity-75">PHONE</label>
                                    <input type="tel" className="form-control" value={clientData.phone} onChange={e => setClientData({ ...clientData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="mt-4 pt-2">
                                <button type="submit" className="btn btn-dark w-100 py-3 rounded-pill fw-bold" disabled={addingClient}>
                                    {addingClient ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-person-check-fill me-2"></i>}
                                    {addingClient ? 'Enrolling Client...' : 'Create Verified Account'}
                                </button>
                                <p className="text-center text-muted extra-small mt-3 mb-0">This creates a pre-verified owner workspace for your client.</p>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <style jsx>{`
                .extra-small { font-size: 11px; }
                .fs-14 { font-size: 14px; }
                .hover-up { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
                .hover-up:hover { transform: translateY(-8px); }
                .transition-hover:hover { background-color: var(--p-bg); cursor: pointer; }
                .small-caps { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; color: var(--p-text-light); }
            `}</style>
        </MainLayout>
    );
}
