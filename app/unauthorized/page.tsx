'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UnauthorizedPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow" style={{ width: '400px' }}>
        <div className="card-body text-center p-4">
          <div className="mb-3">
            <i className="bi bi-shield-exclamation text-danger" style={{ fontSize: '3rem' }}></i>
          </div>
          <h2 className="card-title text-danger mb-3">Access Denied</h2>
          <p className="text-muted mb-4">
            You don't have permission to access this page. Please contact your administrator if you think this is an error.
          </p>
          <div className="d-grid gap-2">
            <button 
              className="btn btn-primary"
              onClick={() => router.push('/login')}
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Go to Login
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => router.back()}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Go Back
            </button>
          </div>
          <p className="text-muted small mt-3 mb-0">
            Redirecting to login page in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
