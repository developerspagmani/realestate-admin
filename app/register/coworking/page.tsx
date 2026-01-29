'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CoworkingOwner {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    spaceName: string; // Tenant Name
    website?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    password: string;
    confirmPassword: string;
}

export default function CoworkingRegisterPage() {
    const [formData, setFormData] = useState<CoworkingOwner>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        spaceName: '',
        website: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: 'India',
        zipCode: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = (): boolean => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.spaceName || !formData.password ||
            !formData.confirmPassword || !formData.addressLine1 || !formData.city || !formData.state ||
            !formData.country || !formData.zipCode) {
            setError('Please fill in all required fields');
            return false;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            const { authService } = await import('@/app/services/api');
            const { confirmPassword, ...registrationData } = formData;
            // Map spaceName to companyName for API consistency
            const response = await authService.register({
                ...registrationData,
                companyName: formData.spaceName,
                type: 2
            });

            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.message || 'Registration failed');
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
            <div className="container" style={{ maxWidth: '850px' }}>
                <div className="card shadow-lg border-0 rounded-4 overflow-hidden animate-fade-in">
                    <div className="row g-0">
                        {/* Side Visual */}
                        <div className="col-lg-4 bg-dark text-white p-5 d-none d-lg-flex flex-column justify-content-center">
                            <div className="mb-4">
                                <i className="bi bi-people-fill display-1 text-white opacity-25"></i>
                            </div>
                            <h3 className="fw-extrabold mb-3 text-white">The Workspace Hub</h3>
                            <p className="small opacity-75 mb-5">Built for community-driven coworking spaces and modern shared offices.</p>

                            <div className="mt-auto">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <i className="bi bi-check-circle-fill text-success"></i>
                                    <span className="extra-small fw-semibold">Desk & Room Bookings</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <i className="bi bi-check-circle-fill text-success"></i>
                                    <span className="extra-small fw-semibold">Community Management</span>
                                </div>
                            </div>
                        </div>

                        {/* Form Partition */}
                        <div className="col-lg-8 bg-white p-4 p-md-5">
                            {success ? (
                                <div className="text-center py-5">
                                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
                                        <i className="bi bi-cup-hot-fill display-4 text-success"></i>
                                    </div>
                                    <h3 className="fw-extrabold text-dark mb-3">Welcome to the Community!</h3>
                                    <p className="text-muted small mb-4">Account created for <strong>{formData.spaceName}</strong>.<br />Please check <strong>{formData.email}</strong> to verify your account.</p>
                                    <Link href="/login" className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm">
                                        Proceed to Login
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 d-flex justify-content-between align-items-start">
                                        <div>
                                            <h2 className="fw-extrabold text-dark mb-1">Coworking Registration</h2>
                                            <p className="text-muted small">Register your shared workspace</p>
                                        </div>
                                        <div className="badge bg-dark rounded-pill px-3 py-2 small">Shared Space</div>
                                    </div>

                                    {error && (
                                        <div className="alert alert-danger border-0 rounded-3 small mb-4">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit}>
                                        <div className="section-label small-caps mb-3">Personal Profile</div>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">First Name</label>
                                                <input type="text" name="firstName" className="form-control" value={formData.firstName} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Last Name</label>
                                                <input type="text" name="lastName" className="form-control" value={formData.lastName} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Email Address</label>
                                                <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Mobile Number</label>
                                                <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
                                            </div>
                                        </div>

                                        <div className="section-label small-caps mb-3 border-top pt-4">Workspace Location</div>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-12">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Workspace Name</label>
                                                <input type="text" name="spaceName" className="form-control" value={formData.spaceName} onChange={handleChange} required />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Full Address</label>
                                                <input type="text" name="addressLine1" className="form-control" value={formData.addressLine1} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">City</label>
                                                <input type="text" name="city" className="form-control" value={formData.city} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">State</label>
                                                <input type="text" name="state" className="form-control" value={formData.state} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Postal Code</label>
                                                <input type="text" name="zipCode" className="form-control" value={formData.zipCode} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Country</label>
                                                <input type="text" name="country" className="form-control" value={formData.country} onChange={handleChange} required />
                                            </div>
                                        </div>

                                        <div className="section-label small-caps mb-3 border-top pt-4">Security</div>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Password</label>
                                                <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Confirm Password</label>
                                                <input type="password" name="confirmPassword" className="form-control" value={formData.confirmPassword} onChange={handleChange} required />
                                            </div>
                                        </div>

                                        <button type="submit" className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-lg mt-4" disabled={loading}>
                                            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-building-fill-add me-2"></i>}
                                            {loading ? 'Creating Workspace...' : 'Register Workspace'}
                                        </button>

                                        <div className="text-center mt-4 pt-3 border-top">
                                            <Link href="/register" className="extra-small text-muted fw-bold text-decoration-none me-3"><i className="bi bi-arrow-left"></i> Back</Link>
                                            <span className="extra-small text-muted">Member already? <Link href="/login" className="text-dark fw-bold text-decoration-none">Login</Link></span>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .fw-extrabold { font-weight: 800; }
                .extra-small { font-size: 0.72rem; }
                .small-caps { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: #94a3b8; }
                .section-label { display: block; border-left: 3px solid #000; padding-left: 10px; margin-left: -5px; }
                .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .form-control { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 1rem; font-size: 0.875rem; }
                .form-control:focus { background-color: #fff; border-color: #000; box-shadow: 0 0 0 4px rgba(0,0,0,0.05); }
                .btn-primary { background-color: #000; border: none; }
                .btn-primary:hover { background-color: #222; transform: translateY(-1px); }
            `}</style>
        </div>
    );
}
