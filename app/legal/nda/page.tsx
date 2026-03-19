'use client';

import Link from 'next/link';
import PublicFontInter from '@/components/common/PublicFontInter';

export default function NDAPage() {
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
                            <i className="bi bi-file-earmark-lock2-fill"></i>
                        </div>
                        <h1 className="fw-900 m-0 display-6">Non-Disclosure Agreement (NDA)</h1>
                    </div>
                    <p className="text-muted small">SECURE PARTNERSHIP PROTOCOL • March 18, 2026</p>
                </div>

                <div className="content text-dark" style={{ lineHeight: '1.8' }}>
                    <p className="mb-4">This Non-Disclosure Agreement (the "Agreement") is entered into upon account creation for the purpose of preventing the unauthorized disclosure of Confidential Information as defined below. The parties agree to enter into a confidential relationship concerning the disclosure of certain proprietary and confidential information.</p>

                    <section className="mb-5">
                        <h4 className="fw-bold mb-3 uppercase letter-spacing-1 small text-danger">1. Definition of Confidential Information</h4>
                        <p>Confidential Information shall include all information relating to Virpanix's proprietary neural platform, source code, algorithm parameters, client lists, pricing strategies, and internal distribution workflows. This applies whether the information is in writing, oral, or by inspection of tangible objects.</p>
                    </section>

                    <section className="mb-5">
                        <h4 className="fw-bold mb-3 uppercase letter-spacing-1 small text-danger">2. Non-Disclosure Obligations</h4>
                        <p>The Partner (the "Recipient") shall hold and maintain the Confidential Information in strictest confidence for the sole and exclusive benefit of Virpanix. Recipient shall carefully restrict access to Confidential Information to employees, contractors, and third parties as is reasonably required and shall require those persons to sign nondisclosure restrictions at least as protective as those in this Agreement.</p>
                    </section>

                    <section className="mb-5">
                        <h4 className="fw-bold mb-3 uppercase letter-spacing-1 small text-danger">3. Term and Survivability</h4>
                        <p>The nondisclosure provisions of this Agreement shall survive the termination of this Agreement and Recipient's duty to hold Confidential Information in confidence shall remain in effect until the Confidential Information no longer qualifies as a trade secret or until Virpanix sends Recipient written notice releasing Recipient from this Agreement, whichever occurs first.</p>
                    </section>

                    <section className="mb-5">
                        <h4 className="fw-bold mb-3 uppercase letter-spacing-1 small text-danger">4. Legal Remedies</h4>
                        <p>Recipient acknowledges that any breach of this Agreement would cause irreparable harm to Virpanix for which monetary damages would be inadequate. Consequently, Virpanix shall be entitled to seek injunctive relief to enforce the terms of this Agreement in addition to any other remedies available by law.</p>
                    </section>

                    <div className="bg-light p-4 rounded-4 border-2 border-danger border-start mt-5">
                        <div className="d-flex gap-3 align-items-center">
                            <i className="bi bi-info-circle-fill text-danger fs-3"></i>
                            <div>
                                <h6 className="fw-bold m-0">Binding Digital Consent</h6>
                                <p className="extra-small m-0 text-muted">By clicking "Create Account" on the partner registration page, you are executing this agreement digitally. A copy will be sent to your registered business email for your records.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-5 pt-5 border-top text-center opacity-50 extra-small fw-bold">
                    VIRPANIX SYSTEMS INC. • LEGAL & COMPLIANCE DIVISION
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
