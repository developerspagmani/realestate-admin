'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import Link from 'next/link';

function LoginContent() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, error: authError, getRedirectPath } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'session_expired') {
      setError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = getRedirectPath();
      router.push(redirectPath);
    }
  }, [isAuthenticated, router, getRedirectPath]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLocalLoading(true);

    try {
      const loginPayload = formData.username.includes('@')
        ? { email: formData.username, password: formData.password }
        : { phone: formData.username, password: formData.password };

      const success = await login(loginPayload);

      if (success) {
        const redirectPath = getRedirectPath();
        router.push(redirectPath);
      } else {
        setLocalLoading(false);
      }
    } catch (err) {
      setLocalLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) {
      setError('');
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
                <i className="bi bi-grid-1x2-fill display-4 text-white opacity-25"></i>
              </div>
              <h2 className="fw-extrabold mb-3 text-white">Welcome Back</h2>
              <p className="small opacity-75 mb-5">Access your property management workspace and leverage AI insights to grow your business.</p>

              <div className="mt-auto">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-white bg-opacity-10 p-2 rounded-3">
                    <i className="bi bi-graph-up text-white"></i>
                  </div>
                  <span className="extra-small fw-semibold">Real-time Analytics</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-10 p-2 rounded-3">
                    <i className="bi bi-robot text-white"></i>
                  </div>
                  <span className="extra-small fw-semibold">AI Lead Predictions</span>
                </div>
              </div>
            </div>

            {/* Login Form Side */}
            <div className="col-lg-7 bg-white p-4 p-md-5">
              <div className="mb-4">
                <h2 className="fw-extrabold text-dark mb-1">Sign In</h2>
                <p className="text-muted small">Enter your credentials to manage your portfolio</p>
              </div>

              {(error || authError) && (
                <div className="alert alert-danger border-0 rounded-3 small mb-4 animate-fade-in">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {error || authError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label small-caps mb-2">Email or Phone</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 rounded-start-3"><i className="bi bi-person text-muted"></i></span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0 ps-0"
                      name="username"
                      placeholder="email@example.com"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={localLoading}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label small-caps mb-0">Password</label>
                    <Link href="/reset-password" style={{ fontSize: '0.7rem' }} className="text-dark fw-bold text-decoration-none">Forgot?</Link>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 rounded-start-3"><i className="bi bi-lock text-muted"></i></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control bg-light border-start-0 ps-0"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={localLoading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-light border-start-0 text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2"
                  disabled={localLoading}
                >
                  {localLoading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <i className="bi bi-box-arrow-in-right"></i>
                  )}
                  {localLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="text-center mt-5 pt-3 border-top">
                <p className="extra-small text-muted mb-0">
                  Don't have a account? <Link href="/register" className="text-dark fw-bold text-decoration-none">Register Portfolio</Link>
                </p>
              </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">Loading Portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}
