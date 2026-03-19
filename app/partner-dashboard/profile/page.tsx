'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { partnerService } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import Link from 'next/link';

export default function PartnerProfilePage() {
    const { user, isAuthenticated, isPartner } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        companyName: '',
        website: '',
        country: 'India'
    });

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await partnerService.getProfile();
            if (response.success) {
                const p = response.data.partner;
                setProfile(p);
                setFormData({
                    firstName: p.firstName || '',
                    lastName: p.lastName || '',
                    phone: p.phone || '',
                    companyName: p.partnerProfile?.companyName || p.companyName || '',
                    website: p.partnerProfile?.website || '',
                    country: p.country || 'India'
                });
            }
        } catch (error: any) {
            showToast(error.message || 'Error loading profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && isPartner) {
            fetchProfileData();
        }
    }, [isAuthenticated, isPartner]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const response = await partnerService.updateProfile(formData);
            if (response.success) {
                showToast('Profile updated successfully!');
                setProfile(response.data.partner);
            }
        } catch (error: any) {
            showToast(error.message || 'Update failed', 'error');
        } finally {
            setUpdating(false);
        }
    };

    if (!isPartner) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center p-5 bg-light">
            <div className="text-center">
                <i className="bi bi-shield-lock-fill text-danger display-1 mb-4"></i>
                <h2 className="fw-bold">Access Denied</h2>
                <p className="text-muted">You do not have permission to access the Partner Portal.</p>
                <Link href="/login" className="btn btn-primary rounded-pill px-4 mt-3">Return to Login</Link>
            </div>
        </div>
    );

    return (
        <MainLayout activePage="partner-dashboard" hideSidebar={true}>
            <div className="container py-5">
                {/* Header Section */}
                <div className="mb-5 d-flex justify-content-between align-items-end">
                    <div>
                        <Link href="/partner-dashboard" className="text-decoration-none extra-small fw-bold text-muted text-uppercase mb-2 d-inline-block hover-opacity-75">
                            <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
                        </Link>
                        <h1 className="h2 fw-900 m-0">Account Settings</h1>
                        <p className="text-muted m-0">Manage your partner profile and company details</p>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Left Column: Basic Info Card */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-5 overflow-hidden mb-4">
                            <div className="card-body p-4 p-md-5">
                                <div className="d-flex align-items-center gap-3 mb-5">
                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '60px', height: '60px', fontSize: '20px' }}>
                                        {profile?.firstName?.[0] || user?.name?.[0] || 'P'}
                                    </div>
                                    <div>
                                        <h5 className="fw-bold m-0">{profile?.firstName} {profile?.lastName}</h5>
                                        <p className="text-muted extra-small m-0">{profile?.email}</p>
                                    </div>
                                    <span className="ms-auto badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2 small-caps">
                                        Active Partner
                                    </span>
                                </div>

                                {loading ? (
                                    <div className="py-5 text-center">
                                        <div className="spinner-border text-primary"></div>
                                        <p className="mt-3 text-muted small">Loading profile details...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit}>
                                        <div className="row g-4">
                                            <div className="col-md-6">
                                                <label className="extra-small fw-bold text-muted mb-2 opacity-75 text-uppercase">First Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0 rounded-4 fs-16"
                                                    value={formData.firstName}
                                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="extra-small fw-bold text-muted mb-2 opacity-75 text-uppercase">Last Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0 rounded-4 fs-16"
                                                    value={formData.lastName}
                                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="extra-small fw-bold text-muted mb-2 opacity-75 text-uppercase">Email Address</label>
                                                <input
                                                    type="email"
                                                    className="form-control form-control-lg bg-light border-0 rounded-4 fs-16 opacity-75 cursor-not-allowed"
                                                    value={profile?.email || ''}
                                                    disabled
                                                />
                                                <p className="extra-small text-muted mt-1">Contact support to change your email.</p>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="extra-small fw-bold text-muted mb-2 opacity-75 text-uppercase">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    className="form-control form-control-lg bg-light border-0 rounded-4 fs-16"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="extra-small fw-bold text-muted mb-2 opacity-75 text-uppercase">Country</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0 rounded-4 fs-16"
                                                    value={formData.country}
                                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                                />
                                            </div>

                                            <div className="col-12 mt-5">
                                                <h6 className="fw-900 small-caps text-dark mb-4 border-bottom pb-2">Business Information</h6>
                                            </div>

                                            <div className="col-12">
                                                <label className="extra-small fw-bold text-muted mb-2 opacity-75 text-uppercase">Agency / Company Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0 rounded-4 fs-16"
                                                    value={formData.companyName}
                                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="extra-small fw-bold text-muted mb-2 opacity-75 text-uppercase">Official Website</label>
                                                <input
                                                    type="url"
                                                    className="form-control form-control-lg bg-light border-0 rounded-4 fs-16"
                                                    value={formData.website}
                                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                                    placeholder="https://example.com"
                                                />
                                            </div>

                                            <div className="col-12 mt-4 pt-4">
                                                <button
                                                    type="submit"
                                                    className="btn btn-dark w-100 py-3 rounded-pill fw-bold shadow-lg transition-all hvr-scale"
                                                    disabled={updating}
                                                >
                                                    {updating ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                                            Saving Changes...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-check-circle-fill me-2"></i>
                                                            Save Profile Updates
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Mini Stats/Helpers */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-5 bg-dark text-white mb-4">
                            <div className="card-body p-4">
                                <h6 className="fw-bold small-caps mb-3 opacity-75">Partner Stats</h6>
                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="small opacity-75">Revenue Share</span>
                                        <span className="fw-bold fs-14">20%</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center border-top border-secondary pt-2 mt-1">
                                        <span className="small opacity-75">Partner Since</span>
                                        <span className="fw-bold fs-14">
                                            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center border-top border-secondary pt-2 mt-1">
                                        <span className="small opacity-75">Current Tier</span>
                                        <span className="badge bg-warning text-dark border-0 rounded-pill small fw-bold">Silver Partner</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-5 bg-primary-subtle border-primary-subtle">
                            <div className="card-body p-4 text-primary">
                                <h6 className="fw-bold mb-3"><i className="bi bi-info-circle-fill me-2"></i>Security Note</h6>
                                <p className="extra-small m-0 fw-medium opacity-75" style={{ lineHeight: '1.6' }}>
                                    Keep your business details updated to ensure smooth commission processing.
                                    Changes to legal entities may require re-verification.
                                </p>
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
                .extra-small { font-size: 11px; }
                .fs-14 { font-size: 14px; }
                .fs-16 { font-size: 15px; }
                .small-caps { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
                .fw-900 { font-weight: 950; }
                .hover-opacity-75:hover { opacity: 0.75; }
            `}</style>
        </MainLayout>
    );
}
