'use client';

import Link from 'next/link';
import PublicFontInter from '@/components/common/PublicFontInter';

export default function DistributionPolicy() {
    return (
        <div className="bg-white min-vh-100 p-4 p-md-5">
            <PublicFontInter />
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className="mb-5 pb-4 border-bottom">
                    <Link href="/signup/partner" className="btn btn-light btn-sm rounded-pill px-3 mb-4 transition-all hover-translate-x-n1">
                        <i className="bi bi-arrow-left me-2"></i> Back to Registration
                    </Link>
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="bg-dark text-white rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                            <i className="bi bi-shield-lock-fill"></i>
                        </div>
                        <h1 className="fw-900 m-0 display-6">Distribution Policy</h1>
                    </div>
                    <p className="text-muted small">Last Updated: March 18, 2026 • Version 2.4.0</p>
                </div>

                <div className="content text-dark" style={{ lineHeight: '1.8' }}>
                    <section className="mb-5">
                        <h4 className="fw-bold mb-3 uppercase letter-spacing-1 small text-danger">1. Eligibility & Certification</h4>
                        <p>To become an authorized distributor of the Virpanix Platform, entities must undergo a rigorous certification process. This includes financial background verification, technical capability assessment, and alignment with our global real estate ethics guidelines.</p>
                        <ul className="list-unstyled d-flex flex-column gap-2 mt-3 ps-3 border-start border-light border-3">
                            <li className="small"><i className="bi bi-check2 text-danger me-2"></i> Minimum 2 years of experience in Software or Real Estate sales.</li>
                            <li className="small"><i className="bi bi-check2 text-danger me-2"></i> Dedicated support personnel for client onboarding.</li>
                            <li className="small"><i className="bi bi-check2 text-danger me-2"></i> Compliance with regional data protection laws (GDPR, CCPA, etc.).</li>
                        </ul>
                    </section>

                    <section className="mb-5">
                        <h4 className="fw-bold mb-3 uppercase letter-spacing-1 small text-danger">2. Market Allocation</h4>
                        <p>Virpanix grants distributors non-exclusive rights to market the platform within specified geographical territories. Redistribution or sub-licensing to regions outside the primary market allocated during signup requires written authorization from Virpanix Systems Inc.</p>
                    </section>

                    <section className="mb-5">
                        <h4 className="fw-bold mb-3 uppercase letter-spacing-1 small text-danger">3. Revenue & Disbursements</h4>
                        <p>Commission structures are tier-based, calculated on the Net Subscription Value (NSV) of referred accounts. Payouts are initiated 14 days after the client payment is successfully processed, provided no refund claims are active.</p>
                        <div className="bg-light p-4 rounded-4 mt-3">
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <div className="fw-900 fs-4 mb-0">15%</div>
                                    <div className="extra-small text-muted fw-bold">BRONZE TIER (1-10 Clients)</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fw-900 fs-4 mb-0">25%</div>
                                    <div className="extra-small text-muted fw-bold">SILVER TIER (11-50 Clients)</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="fw-900 fs-4 mb-0">40%</div>
                                    <div className="extra-small text-muted fw-bold">GOLD TIER (51+ Clients)</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-5">
                        <h4 className="fw-bold mb-3 uppercase letter-spacing-1 small text-danger">4. Termination of Partnership</h4>
                        <p>Partnerships may be terminated if the partner fails to maintain minimum sales performance or violates the code of conduct. Upon termination, all active referral tracking will be suspended, though existing recurring commissions will be honored for a period of 90 days.</p>
                    </section>
                </div>

                <div className="mt-5 pt-5 border-top text-center opacity-50 extra-small fw-bold">
                    VIRPANIX SYSTEMS INC. GLOBAL DISTRIBUTION GOVERNANCE
                </div>
            </div>

            <style jsx>{`
                .fw-900 { font-weight: 900; }
                .letter-spacing-1 { letter-spacing: 1.5px; }
                .extra-small { font-size: 0.7rem; }
                .hover-translate-x-n1:hover { transform: translateX(-4px); }
                .transition-all { transition: all 0.3s ease; }
            `}</style>
        </div>
    );
}
