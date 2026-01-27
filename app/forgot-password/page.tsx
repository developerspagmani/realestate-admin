'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/app/services/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.forgotPassword(email);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card shadow" style={{ width: '400px' }}>
          <div className="card-body text-center p-5">
            <div className="mb-4">
              <i className="bi bi-envelope-check text-success display-1"></i>
            </div>
            <h2 className="card-title mb-3">Email Sent!</h2>
            <p className="card-text text-muted mb-4">
              We've sent a password reset link to your email address.
              Please check your inbox and follow the instructions.
            </p>
            <div className="alert alert-info small">
              <i className="bi bi-info-circle me-2"></i>
              If you don't receive the email within a few minutes,
              please check your spam folder.
            </div>
            <button
              className="btn btn-primary w-100"
              onClick={() => router.push('/login')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow" style={{ width: '400px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="bi bi-building text-primary display-1"></i>
            <h2 className="card-title mt-3">Reset Password</h2>
            <p className="card-text text-muted">
              Enter your email address and we'll send you a link to reset your password.
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
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  Sending...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <small className="text-muted">
              Remember your password?
              <button
                className="btn btn-link p-0 ms-1 text-primary	rext-decoration-none"
                onClick={() => router.push('/login')}
              >
                Back to Login
              </button>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
