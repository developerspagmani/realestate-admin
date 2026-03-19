'use client';

import Link from 'next/link';
import PublicFontInter from '@/components/common/PublicFontInter';

export default function RegisterSelectionPage() {
  return (
    <div className="register-selection-page min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <PublicFontInter />
      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden animate-fade-in">
          <div className="row g-0">
            {/* Brand/Accent Side */}
            <div className="col-lg-5 bg-dark text-white p-5 d-none d-lg-flex flex-column justify-content-center">
              <div className="mb-4">
                <i className="bi bi-grid-3x3-gap-fill display-4 text-white opacity-25"></i>
              </div>
              <h2 className="fw-extrabold mb-3 text-white">Scale Faster</h2>
              <p className="small opacity-75 mb-5">Join thousands of property owners who use our platform to automate their operations and maximize ROI.</p>

              <div className="mt-auto">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-white bg-opacity-10 p-2 rounded-3">
                    <i className="bi bi-rocket-takeoff text-white"></i>
                  </div>
                  <span className="extra-small fw-semibold">Instant Setup</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-10 p-2 rounded-3">
                    <i className="bi bi-shield-check text-white"></i>
                  </div>
                  <span className="extra-small fw-semibold">Identity Verified</span>
                </div>
              </div>
            </div>

            {/* Selection Side */}
            <div className="col-lg-7 bg-white p-4 p-md-5">
              <div className="mb-4">
                <h2 className="fw-extrabold text-dark mb-1">Get Started</h2>
                <p className="text-muted small">Choose your business track to create an account</p>
              </div>

              <div className="d-grid gap-3 mb-4">
                <Link
                  href="/register/real-estate"
                  className="btn btn-outline-dark p-4 d-flex align-items-center justify-content-between hover-option transition-all rounded-4 border-2"
                >
                  <div className="text-start">
                    <div className="badge bg-primary-soft text-primary rounded-4 px-2 py-1 extra-small mb-2">Recommended</div>
                    <h5 className="fw-bold mb-1 text-dark">Real Estate Owner </h5>
                    <p className="mb-0 extra-small text-muted">Manage buildings, units, leads, and assets</p>
                  </div>
                  <div className="bg-light p-3 rounded-4">
                    <i className="bi bi-building fs-3 text-dark"></i>
                  </div>
                </Link>

                <div className="opacity-50 position-relative">
                  <div className="btn btn-outline-light p-4 d-flex align-items-center justify-content-between rounded-4 border-2 cursor-not-allowed">
                    <div className="text-start">
                      <h5 className="fw-bold mb-1 text-muted">Co-Working Owner</h5>
                      <p className="mb-0 extra-small text-muted">Manage desks, community, and bookings</p>
                    </div>
                    <div className="bg-light p-3 rounded-4">
                      <i className="bi bi-people fs-3 text-muted"></i>
                    </div>
                  </div>
                  <span className="badge bg-light text-dark position-absolute top-0 end-0 m-3 extra-small fw-bold border">Coming Soon</span>
                </div>
              </div>

              <div className="text-center mt-5 pt-3 border-top">
                <p className="extra-small text-muted mb-0">
                  Already have an account? <Link href="/login" className="text-dark fw-bold text-decoration-none">Sign In</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
                html, body { font-family: 'Inter', sans-serif !important; }
                .register-selection-page .fw-extrabold { font-weight: 800; }
                .register-selection-page .extra-small { font-size: 0.72rem; }
                .register-selection-page .small-caps { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: #94a3b8; }
                .register-selection-page .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                
                .register-selection-page .hover-option {
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }

                .register-selection-page .hover-option:hover { 
                    border-color: #000 !important; 
                    background-color: #000 !important; 
                    transform: translateY(-4px) scale(1.01); 
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3); 
                }
                .register-selection-page .hover-option:hover h5, 
                .register-selection-page .hover-option:hover p, 
                .register-selection-page .hover-option:hover i { 
                    color: #fff !important; 
                }
                .register-selection-page .hover-option:hover .badge {
                    background-color: #fff !important;
                    color: #000 !important;
                }
                .register-selection-page .hover-option:hover .bg-light {
                    background-color: rgba(255,255,255,0.15) !important;
                }
                .register-selection-page .bg-primary-soft { background-color: rgba(0,0,0,0.05); }
                .register-selection-page .cursor-not-allowed { cursor: not-allowed; }
            `}</style>
    </div>
  );
}
