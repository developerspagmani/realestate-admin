'use client';

import Link from 'next/link';

export default function RegisterSelectionPage() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow border-0 overflow-hidden">
              <div className="card-body p-5 text-center">
                <div className="mb-4">
                  <h2 className="fw-bold text-primary mb-2">Create Your Account</h2>
                  <p className="text-muted">Choose your business type to get started</p>
                </div>

                <div className="d-grid gap-3">
                  <Link
                    href="/register/real-estate"
                    className="btn btn-outline-primary p-4 d-flex align-items-center justify-content-between hover-shadow transition-all group"
                  >
                    <div className="text-start">
                      <h5 className="fw-bold mb-1">Real Estate Owner</h5>
                      <p className="mb-0 small text-muted">Manage properties, units, and leases</p>
                    </div>
                    <i className="bi bi-building fs-3 text-primary"></i>
                  </Link>

                  <Link
                    href="/register/coworking"
                    className="btn btn-outline-info p-4 d-flex align-items-center justify-content-between hover-shadow transition-all group"
                  >
                    <div className="text-start">
                      <h5 className="fw-bold mb-1 text-dark">Co-Working Owner</h5>
                      <p className="mb-0 small text-muted">Manage desks, bookings, and community</p>
                    </div>
                    <i className="bi bi-people fs-3 text-info"></i>
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-top">
                  <p className="mb-0 text-muted">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary text-decoration-none fw-semibold">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
          transform: translateY(-2px);
        }
        .transition-all {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
}
