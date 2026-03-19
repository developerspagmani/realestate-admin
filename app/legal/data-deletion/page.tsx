import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import PublicFontInter from '@/components/common/PublicFontInter';

export const metadata: Metadata = {
    title: 'Data Deletion Instructions | Virpanix',
    description: 'Instructions on how to request deletion of your data from Virpanix.',
};

export default function DataDeletion() {
    return (
        <div className="min-vh-100 bg-white text-dark py-5">
            <PublicFontInter />
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className="mb-5 text-center">
                    <h1 className="fw-bold display-5 mb-3">Data Deletion Instructions</h1>
                    <p className="text-muted">Meta Developer Compliance Guideline</p>
                    <div className="d-flex justify-content-center gap-3 mt-4">
                        <Link href="/legal/privacy" className="text-primary text-decoration-none small fw-bold">Privacy Policy</Link>
                        <span className="text-muted">•</span>
                        <Link href="/legal/terms" className="text-primary text-decoration-none small fw-bold">Terms of Service</Link>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 mb-5 bg-light bg-opacity-50">
                    <h2 className="h4 fw-bold mb-4">How to Delete Your Data from Virpanix</h2>
                    <p>Virpanix Real Estate Platform values your data privacy. If you would like to delete your user activities and data associated with our Facebook or Instagram applications, you can follow these simple steps:</p>

                    <div className="timeline-instructions mt-4">
                        <div className="d-flex gap-3 mb-4">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>1</div>
                            <div>
                                <h5 className="fw-bold mb-1">Disconnect Account</h5>
                                <p className="text-muted small">Go to your <strong>Marketing Hub {'>'} Connected Accounts</strong> and click on the <strong>Disconnect</strong> button for your Meta account.</p>
                            </div>
                        </div>

                        <div className="d-flex gap-3 mb-4">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>2</div>
                            <div>
                                <h5 className="fw-bold mb-1">Remove App on Facebook</h5>
                                <p className="text-muted small">Alternatively, go to your Personal Facebook Profile's <strong>Settings & Privacy {'>'} Settings {'>'} Security and Login {'>'} Apps and Websites</strong>. Search for "Virpanix" and click <strong>Remove</strong>.</p>
                            </div>
                        </div>

                        <div className="d-flex gap-3 mb-4">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>3</div>
                            <div>
                                <h5 className="fw-bold mb-1">Contact Support</h5>
                                <p className="text-muted small">For a complete removal of all historical data associated with your social media activities across our systems, please send an email to <span className="text-primary fw-bold">support@virpanix.com</span> with the subject "Data Deletion Request".</p>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">Technical Data Processing</h2>
                    <p>When you trigger a data deletion request through our platform or through Facebook's native settings:</p>
                    <ul className="mb-3">
                        <li>All OAuth access tokens stored in our secure database are immediately destroyed.</li>
                        <li>Any cached profile information (Name, Profile ID) is purged.</li>
                        <li>Scheduled posts that have not yet been published will be canceled and deleted.</li>
                        <li>Our system will stop all background polling for your account metrics.</li>
                    </ul>
                </section>

                <div className="alert alert-warning border-0 rounded-4 p-4">
                    <div className="d-flex gap-3">
                        <i className="bi bi-info-circle-fill fs-3"></i>
                        <div>
                            <h6 className="fw-bold">Note for Meta App Review</h6>
                            <p className="mb-0 small">This page serves as the official <strong>Data Deletion Instructions URL</strong> for our Meta App ID. We comply with Facebook's Platform Policy regarding the deletion of user data upon request.</p>
                        </div>
                    </div>
                </div>

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
