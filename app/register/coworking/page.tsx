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
        country: '',
        zipCode: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const { authService } = await import('@/app/services/api');
            // Map spaceName to companyName for the backend consistency if needed, or backend handles spaceName
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmPassword, ...registrationData } = formData;
            const response = await authService.register({ ...registrationData, type: 2 });

            if (response.success) {
                setSuccess(true);
                // Optional: Redirect after delay
                // setTimeout(() => router.push('/login'), 3000);
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
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-9 col-lg-7">
                        <div className="card shadow border-0">
                            <div className="card-body p-5">
                                {success ? (
                                    <div className="text-center">
                                        <div className="d-inline-flex bg-success bg-opacity-10 p-4 rounded-circle mb-4">
                                            <i className="bi bi-check-lg fs-1 text-success"></i>
                                        </div>
                                        <h3 className="fw-bold text-dark mb-3">Registration Successful!</h3>
                                        <p className="text-muted mb-4">
                                            Your account has been created successfully. You can now log in to manage your co-working space.
                                        </p>
                                        <Link href="/login" className="btn btn-info text-white px-5 py-3 fw-bold shadow-sm">
                                            Proceed to Login
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center mb-4">
                                            <div className="d-inline-flex bg-info bg-opacity-10 p-3 rounded-circle mb-3">
                                                <i className="bi bi-people fs-3 text-info"></i>
                                            </div>
                                            <h2 className="fw-bold text-dark">Co-Working Space</h2>
                                            <p className="text-muted">Register your shared workspace business</p>
                                        </div>

                                        {error && (
                                            <div className="alert alert-danger" role="alert">
                                                <i className="bi bi-exclamation-circle me-2"></i>{error}
                                            </div>
                                        )}

                                        <form onSubmit={handleSubmit}>
                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase small ls-1">Personal Information</h6>
                                            <div className="row g-3 mb-4">
                                                <div className="col-md-6">
                                                    <label className="form-label">First Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="firstName"
                                                        value={formData.firstName}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Last Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="lastName"
                                                        value={formData.lastName}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Email Address</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light text-muted"><i className="bi bi-envelope"></i></span>
                                                        <input
                                                            type="email"
                                                            className="form-control"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Phone Number (Optional)</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light text-muted"><i className="bi bi-telephone"></i></span>
                                                        <input
                                                            type="tel"
                                                            className="form-control"
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase small ls-1 border-top pt-4">Company Details</h6>
                                            <div className="row g-3 mb-4">
                                                <div className="col-md-6">
                                                    <label className="form-label">Co-Working Space Name</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light text-muted"><i className="bi bi-shop"></i></span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="spaceName"
                                                            value={formData.spaceName}
                                                            onChange={handleChange}
                                                            placeholder="e.g. The Hive Workspace"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Website URL (Optional)</label>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light text-muted"><i className="bi bi-globe"></i></span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="website"
                                                            value={formData.website}
                                                            onChange={handleChange}
                                                            placeholder="e.g. www.thehive.com"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-md-12">
                                                    <label className="form-label">Address Line 1</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="addressLine1"
                                                        value={formData.addressLine1}
                                                        onChange={handleChange}
                                                        placeholder="Street address, P.O. box, etc."
                                                        required
                                                    />
                                                </div>

                                                <div className="col-md-12">
                                                    <label className="form-label">Address Line 2 (Optional)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="addressLine2"
                                                        value={formData.addressLine2}
                                                        onChange={handleChange}
                                                        placeholder="Apartment, suite, unit, building, floor, etc."
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">City</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">State / Province</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="state"
                                                        value={formData.state}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">Country</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="country"
                                                        value={formData.country}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">Postal / Zip Code</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="zipCode"
                                                        value={formData.zipCode}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <h6 className="fw-bold mb-3 text-secondary text-uppercase small ls-1 border-top pt-4">Security</h6>
                                            <div className="row g-3 mb-4">
                                                <div className="col-md-6">
                                                    <label className="form-label">Password</label>
                                                    <div className="input-group">
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            className="form-control"
                                                            name="password"
                                                            value={formData.password}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="Min. 8 characters"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            tabIndex={-1}
                                                        >
                                                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">Confirm Password</label>
                                                    <div className="input-group">
                                                        <input
                                                            type={showConfirmPassword ? 'text' : 'password'}
                                                            className="form-control"
                                                            name="confirmPassword"
                                                            value={formData.confirmPassword}
                                                            onChange={handleChange}
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            tabIndex={-1}
                                                        >
                                                            <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                className="btn btn-info text-white w-100 py-3 fw-bold shadow-sm"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Creating Account...
                                                    </>
                                                ) : (
                                                    'Register Now'
                                                )}
                                            </button>
                                        </form>

                                        <div className="mt-5 text-center border-top pt-4">
                                            <p className="mb-0 text-muted">
                                                <Link href="/register" className="text-secondary text-decoration-none me-3">
                                                    <i className="bi bi-arrow-left me-1"></i> Back
                                                </Link>
                                                Already have an account?{' '}
                                                <Link href="/login" className="text-primary text-decoration-none fw-semibold">
                                                    Sign in
                                                </Link>
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <style jsx>{`
        .ls-1 { letter-spacing: 1px; }
      `}</style>
            </div>
        </div>
    );
}
