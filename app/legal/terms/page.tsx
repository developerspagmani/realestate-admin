import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | Virpanix',
    description: 'Terms and conditions for using the Virpanix Real Estate Platform.',
};

export default function TermsOfService() {
    return (
        <div className="min-vh-100 bg-white text-dark py-5">
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className="mb-5 text-center">
                    <h1 className="fw-bold display-5 mb-3">Terms of Service</h1>
                    <p className="text-muted">Effective Date: February 19, 2026</p>
                    <div className="d-flex justify-content-center gap-3 mt-4">
                        <Link href="/legal/privacy" className="text-primary text-decoration-none small fw-bold">Privacy Policy</Link>
                        <span className="text-muted">•</span>
                        <Link href="/legal/data-deletion" className="text-primary text-decoration-none small fw-bold">Data Deletion</Link>
                    </div>
                </div>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">1. Agreement to Terms</h2>
                    <p>By accessing or using the Virpanix Real Estate Platform, you agree to be bound by these Terms of Service. If you do not agree, you may not access the service.</p>
                </section>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">2. Description of Service</h2>
                    <p>Virpanix provides real estate management and marketing automation tools, including but not limited to properties management, lead tracking, and social media scheduling ("the Service").</p>
                </section>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">3. Social Media Content</h2>
                    <p>Our Service allows you to post content to third-party social media platforms (such as Facebook and Instagram). You acknowledge and agree that:</p>
                    <ul className="mb-3">
                        <li>You are solely responsible for the content published through your accounts.</li>
                        <li>You must comply with the community standards and terms of use of the respective platforms (Meta's Community Standards, etc.).</li>
                        <li>Virpanix acts only as a technical conduit for your scheduled content.</li>
                        <li>We do not guarantee the visibility or reach of any post, as this is determined by third-party algorithms.</li>
                    </ul>
                </section>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">4. Prohibited Conduct</h2>
                    <p>You agree not to use the Service to publish content that is:</p>
                    <ul className="mb-3">
                        <li>Illegal, fraudulent, or deceptive.</li>
                        <li>Infringing on any intellectual property rights.</li>
                        <li>Spam or unsolicited commercial communication.</li>
                        <li>Violating Meta's Developer Policies.</li>
                    </ul>
                </section>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">5. Limitation of Liability</h2>
                    <p>Virpanix shall not be liable for any damages resulting from actions taken by third-party social media platforms, including account suspension, post removal, or changes to platform APIs that may affect Service functionality.</p>
                </section>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">6. Modifications to Service</h2>
                    <p>We reserve the right to modify or discontinue any part of the Service (including social media integrations) at any time to comply with third-party technical requirements or legal regulations.</p>
                </section>

                <div className="border-top pt-4 mt-5 d-flex justify-content-between align-items-center">
                    <Link href="/" className="btn btn-outline-secondary rounded-pill btn-sm px-4">
                        <i className="bi bi-arrow-left me-2"></i> Back to Home
                    </Link>
                    <p className="mb-0 small text-muted">© 2026 Virpanix. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
