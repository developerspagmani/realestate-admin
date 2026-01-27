'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/app/services/api';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

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

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        try {
            const response = await authService.resetPassword({ token, password });

            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.message || 'Failed to reset password. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="card shadow" style={{ width: '400px' }}>
                <div className="card-body text-center p-5">
                    <div className="mb-4">
                        <i className="bi bi-check-circle text-success display-1"></i>
                    </div>
                    <h2 className="card-title mb-3">Password Reset!</h2>
                    <p className="card-text text-muted mb-4">
                        Your password has been successfully reset.
                        You can now log in with your new password.
                    </p>
                    <button
                        className="btn btn-primary w-100"
                        onClick={() => router.push('/login')}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="card shadow" style={{ width: '400px' }}>
                <div className="card-body text-center p-5">
                    <div className="mb-4">
                        <i className="bi bi-exclamation-octagon text-danger display-1"></i>
                    </div>
                    <h2 className="card-title mb-3">Invalid Link</h2>
                    <p className="card-text text-muted mb-4">
                        This password reset link is invalid or has expired.
                        Please request a new reset link.
                    </p>
                    <button
                        className="btn btn-primary w-100"
                        onClick={() => router.push('/forgot-password')}
                    >
                        Forgot Password
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card shadow" style={{ width: '400px' }}>
            <div className="card-body p-5">
                <div className="text-center mb-4">
                    <i className="bi bi-key text-primary display-1"></i>
                    <h2 className="card-title mt-3">Reset Password</h2>
                    <p className="card-text text-muted">
                        Enter your new password below.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <div className="input-group">
                            <span className="input-group-text">
                                <i className="bi bi-lock"></i>
                            </span>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Confirm New Password</label>
                        <div className="input-group">
                            <span className="input-group-text">
                                <i className="bi bi-lock-fill"></i>
                            </span>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Resetting...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-shield-check me-2"></i>
                                Reset Password
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <Suspense fallback={
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
