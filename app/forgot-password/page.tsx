'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/app/services/api';
import Loader from '@/components/common/Loader';
import Link from 'next/link';

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

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden animate-fade-in">
          <div className="row g-0">
            {/* Brand/Accent Side */}
            <div className="col-lg-5 bg-dark text-white p-5 d-none d-lg-flex flex-column justify-content-center">
              <div className="mb-4">
                <i className="bi bi-shield-lock-fill display-4 text-white opacity-25"></i>
              </div>
              <h2 className="fw-extrabold mb-3">Identity Access</h2>
              <p className="small opacity-75 mb-5">Recover your secure access to the ecosystem. We'll send a recovery link to your verified email address.</p>

              <div className="mt-auto">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <i className="bi bi-patch-check-fill text-primary"></i>
                  <span className="extra-small">Secure Authentication</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-envelope-heart-fill text-danger"></i>
                  <span className="extra-small">Email Verification</span>
                </div>
              </div>
            </div>

            {/* Form Side */}
            <div className="col-lg-7 bg-white p-4 p-md-5">
              {success ? (
                <div className="text-center py-5">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
                    <i className="bi bi-envelope-check-fill display-4 text-success"></i>
                  </div>
                  <h2 className="fw-extrabold text-dark mb-1">Email Sent!</h2>
                  <p className="text-muted small mb-4">We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.</p>
                  <div className="alert alert-info border-0 rounded-3 small mb-4 text-start">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    If you don't see it, check your spam or junk folder. The link is valid for 1 hour.
                  </div>
                  <button className="btn btn-primary rounded-4 px-5 py-3 fw-bold shadow-sm w-100" onClick={() => router.push('/login')}>
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="fw-extrabold text-dark mb-1">Recover Account</h2>
                    <p className="text-muted small">Enter your email to receive recovery instructions</p>
                  </div>

                  {error && (
                    <div className="alert alert-danger border-0 rounded-3 small mb-4">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="form-label small-caps mb-2">Registered Email Address</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 rounded-start-3"><i className="bi bi-envelope text-muted"></i></span>
                        <input
                          type="email"
                          className="form-control bg-light border-start-0 ps-0"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-3 rounded-4 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2"
                      disabled={loading}
                    >
                      {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-send-fill"></i>}
                      {loading ? 'Sending Request...' : 'Send Recovery Link'}
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
