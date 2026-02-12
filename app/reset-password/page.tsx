'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/app/services/api';
import Link from 'next/link';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!token) {
            setError('Invalid or missing reset token.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            setLoading(false);
            return;
        }

        try {
            const response = await authService.resetPassword({ token, password });

            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.message || 'Failed to reset password.');
            }
        } catch (err: any) {
            setError(err.message || 'Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '900px' }}>
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden animate-fade-in">
                <div className="row g-0">
                    {/* Brand/Accent Side */}
                    <div className="col-lg-5 bg-dark text-white p-5 d-none d-lg-flex flex-column justify-content-center">
                        <div className="mb-4">
                            <i className="bi bi-key-fill display-4 text-white opacity-25"></i>
                        </div>
                        <h2 className="fw-extrabold mb-3">Security First</h2>
                        <p className="small opacity-75 mb-5">Your account security is our priority. Create a strong, unique password to protect your assets.</p>

                        <div className="mt-auto">
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <i className="bi bi-shield-lock-fill text-success"></i>
                                <span className="extra-small">Encrypted Storage</span>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-cpu-fill text-info"></i>
                                <span className="extra-small">AI-Enhanced Security</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="col-lg-7 bg-white p-4 p-md-5">
                        {success ? (
                            <div className="text-center py-5">
                                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
                                    <i className="bi bi-check-circle-fill display-4 text-success"></i>
                                </div>
                                <h2 className="fw-extrabold text-dark mb-1">Password Reset!</h2>
                                <p className="text-muted small mb-4">Your security credentials have been successfully updated.</p>
                                <button className="btn btn-primary rounded-4 px-5 py-3 fw-bold shadow-sm" onClick={() => router.push('/login')}>
                                    Go to Login
                                </button>
                            </div>
                        ) : !isMounted ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary mb-3"></div>
                                <p className="text-muted small">Verifying security link...</p>
                            </div>
                        ) : !token ? (
                            <div className="text-center py-5">
                                <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
                                    <i className="bi bi-exclamation-octagon-fill display-4 text-danger"></i>
                                </div>
                                <h2 className="fw-extrabold text-dark mb-1">Invalid Link</h2>
                                <p className="text-muted small mb-4">This reset link has expired or is invalid. Please request a new one.</p>
                                <Link href="/forgot-password" className="btn btn-dark rounded-4 px-5 py-3 fw-bold shadow-sm">
                                    Try Again
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <h2 className="fw-extrabold text-dark mb-1">New Password</h2>
                                    <p className="text-muted small">Update your credentials to regain access</p>
                                </div>

                                {error && (
                                    <div className="alert alert-danger border-0 rounded-3 small mb-4">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label small-caps mb-2">Create New Password</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 rounded-start-3"><i className="bi bi-lock text-muted"></i></span>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="form-control bg-light border-start-0 ps-0"
                                                placeholder="Min. 8 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-light border-start-0 rounded-end-3 text-muted"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label small-caps mb-2">Confirm New Password</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0 rounded-start-3"><i className="bi bi-lock-fill text-muted"></i></span>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className="form-control bg-light border-start-0 ps-0"
                                                placeholder="Repeat your password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-light border-start-0 rounded-end-3 text-muted"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 py-3 rounded-4 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2"
                                        disabled={loading}
                                    >
                                        {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-shield-check"></i>}
                                        {loading ? 'Updating...' : 'Set New Password'}
                                    </button>
                                </form>

                                <div className="text-center mt-5 pt-3 border-top">
                                    <Link href="/login" className="extra-small text-muted fw-bold text-decoration-none">
                                        <i className="bi bi-arrow-left me-1"></i> Back to Login
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .fw-extrabold { font-weight: 800; }
                .extra-small { font-size: 0.72rem; }
                .small-caps { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: #94a3b8; }
                .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .form-control { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; }
                .form-control:focus { background-color: #fff; border-color: #000; box-shadow: 0 0 0 4px rgba(0,0,0,0.05); }
                .input-group-text { border: 1px solid #e2e8f0; }
                .btn-primary { background-color: #000; border: none; }
                .btn-primary:hover { background-color: #222; transform: translateY(-1px); }
            `}</style>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
            <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">Loading Security...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
