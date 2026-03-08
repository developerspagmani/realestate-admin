'use client';

import Link from "next/link";

export default function HomeFooter() {
    return (
        <footer className="bg-black pt-5 mt-5 border-top border-white/5 position-relative overflow-hidden">
            {/* Wavebar CTA Section */}
            <div className="container mb-5 pb-5 border-bottom border-white/5 position-relative z-1" data-aos="fade-up">
                <div className="glass-card p-5 rounded-5 border-red/10 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(230,0,38,0.05) 0%, rgba(0,0,0,0.8) 100%)' }}>
                    {/* Decorative Background Elements */}
                    <div className="position-absolute top-0 end-0 w-50 h-100 bg-red opacity-5 blur-100 rounded-circle" style={{ filter: 'blur(100px)', transform: 'translate(20%, -20%)' }}></div>

                    <div className="row align-items-center position-relative z-2">
                        <div className="col-lg-7 mb-4 mb-lg-0">
                            <span className="text-red fw-800 uppercase tracking-widest small mb-2 d-block">// INTUITIVE PROPTECH OS</span>
                            <h2 className="display-5 fw-900 text-white mb-3 tracking-tight">Access the <span className="text-red">Intelligence</span> Protocol</h2>
                            <p className="lead opacity-60 mb-0 max-w-500">
                                Stop managing disparate tools. Deploy Virpanix today and unify your real estate operations under one sentient ecosystem.
                            </p>
                        </div>
                        <div className="col-lg-5 text-lg-end d-flex flex-column align-items-lg-end gap-4">
                            <div className="d-inline-flex flex-column align-items-start align-items-lg-end">
                                <Link href="/register" className="btn btn-danger btn-lg rounded-pill px-5 py-3 fw-900 tracking-widest shadow-red-lg hvr-red-pulse d-flex align-items-center gap-3">
                                    INITIALIZE PLATFORM
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>

                            <div className="d-flex align-items-center gap-3 p-3 glass-card rounded-pill border-red/20 shadow-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                                <div className="voice-waves d-flex align-items-center gap-1 ms-2">
                                    {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                                        <div key={i} className="wave-bar bg-red" style={{ height: `${h * 8}px`, animationDelay: `${i * 0.1}s`, width: '3px' }}></div>
                                    ))}
                                </div>
                                <div className="extra-small text-white fw-700 font-monospace pe-3">SYSTEM_READY</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container position-relative z-1">
                <div className="row g-5 align-items-center">
                    <div className="col-md-4" data-aos="fade-right">
                        <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none bg-white rounded-4 justify-content-center p-3 w-50">
                            <img
                                src="/images/Virpanix-logo.svg"
                                alt="Virpanix Logo"
                                style={{ height: '35px', width: 'auto' }}
                            />
                        </Link>
                        <p className="opacity-30 small mt-3">Advanced Intelligence Layer for Global Real Estate Portfolios. Built for institutional precision.</p>
                    </div>
                    <div className="col-md-8">
                        <div className="row g-4">
                            <div className="col-6 col-lg-3">
                                <h6 className="fw-800 text-white small uppercase tracking-widest mb-3">Capabilities</h6>
                                <ul className="list-unstyled extra-small opacity-40 d-flex flex-column gap-2">
                                    <li><Link href="/pages/virpa-ai" className="text-white text-decoration-none hvr-red">Neural Protocol (AI)</Link></li>
                                    <li><Link href="/pages/analytics" className="text-white text-decoration-none hvr-red">Data Intelligence</Link></li>
                                    <li><Link href="/pages/crm" className="text-white text-decoration-none hvr-red">Leads & CRM Hub</Link></li>
                                    <li><Link href="/pages/intelligent-voice" className="text-white text-decoration-none hvr-red">Voice Command</Link></li>
                                    <li><Link href="/pages/social-hub" className="text-white text-decoration-none hvr-red">Social Hub (WA)</Link></li>
                                </ul>
                            </div>
                            <div className="col-6 col-lg-3">
                                <h6 className="fw-800 text-white small uppercase tracking-widest mb-3">Enterprise</h6>
                                <ul className="list-unstyled extra-small opacity-40 d-flex flex-column gap-2">
                                    <li><Link href="/pages/about" className="text-white text-decoration-none hvr-red">About Protocol</Link></li>
                                    <li><Link href="/pages/plans" className="text-white text-decoration-none hvr-red">Licensing Plans</Link></li>
                                    <li><Link href="/pages/contact" className="text-white text-decoration-none hvr-red">Contact Support</Link></li>
                                    <li><Link href="/pages/inventory" className="text-white text-decoration-none hvr-red">Full Portfolio</Link></li>
                                    <li><Link href="/pages/matching-engine" className="text-white text-decoration-none hvr-red">Matching Engine</Link></li>
                                </ul>
                            </div>
                            <div className="col-6 col-lg-3">
                                <h6 className="fw-800 text-white small uppercase tracking-widest mb-3">Ecosystem</h6>
                                <ul className="list-unstyled extra-small opacity-40 d-flex flex-column gap-2">
                                    <li><Link href="/pages/plot-maps" className="text-white text-decoration-none hvr-red">Interactive Maps</Link></li>
                                    <li><Link href="/pages/brochure-ai" className="text-white text-decoration-none hvr-red">Brochure AI</Link></li>
                                    <li><Link href="/pages/seo-engine" className="text-white text-decoration-none hvr-red">Search SEO</Link></li>
                                    <li><Link href="/pages/websites" className="text-white text-decoration-none hvr-red">Websites Hub</Link></li>
                                    <li><Link href="/pages/marketing" className="text-white text-decoration-none hvr-red">Automation</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-5 pt-5 border-top border-white/5 d-flex justify-content-between align-items-center">
                    <p className="opacity-20 x-small m-0">&copy; 2026 Virpanix Platform. All Rights Reserved.</p>
                    <div className="d-flex gap-3">
                        <i className="bi bi-twitter text-white opacity-20"></i>
                        <i className="bi bi-linkedin text-white opacity-20"></i>
                        <i className="bi bi-github text-white opacity-20"></i>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .max-w-500 {
                    max-width: 500px;
                }
                .wave-bar {
                    width: 4px;
                    border-radius: 2px;
                    animation: wave-animation 1s infinite alternate ease-in-out;
                    box-shadow: 0 0 10px rgba(230, 0, 38, 0.4);
                }
                @keyframes wave-animation {
                    from { transform: scaleY(1); opacity: 0.6; }
                    to { transform: scaleY(1.8); opacity: 1; }
                }
                .hvr-red-pulse:hover {
                    animation: pulse-border 1.5s infinite;
                    border-color: #e60026 !important;
                }
                @keyframes pulse-border {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(230, 0, 38, 0.4); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(230, 0, 38, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(230, 0, 38, 0); }
                }
            `}</style>
        </footer>
    );
}
