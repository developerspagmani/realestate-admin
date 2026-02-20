import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Legal Documents | Virpanix',
    description: 'Virpanix Real Estate Platform - Legal documents, including Privacy Policy and Terms of Service.',
};

export default function LegalPage() {
    return (
        <div className="min-vh-100 bg-white text-dark py-5">
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className="text-center mb-5">
                    <h1 className="fw-bold display-4 mb-3">Legal Center</h1>
                    <p className="lead text-muted">Legal agreements and privacy documents for the Virpanix Platform.</p>
                </div>

                <div className="row g-4">
                    <div className="col-md-4">
                        <Link href="/legal/privacy" className="text-decoration-none h-100 d-block">
                            <div className="card h-100 border rounded-4 p-4 shadow-sm hvr-float text-center">
                                <div className="bg-primary-soft rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                                    <i className="bi bi-shield-lock-fill fs-3 text-primary"></i>
                                </div>
                                <h3 className="h5 fw-bold text-dark mb-2">Privacy Policy</h3>
                                <p className="text-muted small mb-0">How we handle and protect your data.</p>
                            </div>
                        </Link>
                    </div>

                    <div className="col-md-4">
                        <Link href="/legal/terms" className="text-decoration-none h-100 d-block">
                            <div className="card h-100 border rounded-4 p-4 shadow-sm hvr-float text-center">
                                <div className="bg-primary-soft rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                                    <i className="bi bi-file-earmark-text-fill fs-3 text-primary"></i>
                                </div>
                                <h3 className="h5 fw-bold text-dark mb-2">Terms of Service</h3>
                                <p className="text-muted small mb-0">Rules for using our platform.</p>
                            </div>
                        </Link>
                    </div>

                    <div className="col-md-4">
                        <Link href="/legal/data-deletion" className="text-decoration-none h-100 d-block">
                            <div className="card h-100 border rounded-4 p-4 shadow-sm hvr-float text-center">
                                <div className="bg-primary-soft rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                                    <i className="bi bi-trash-fill fs-3 text-primary"></i>
                                </div>
                                <h3 className="h5 fw-bold text-dark mb-2">Data Deletion</h3>
                                <p className="text-muted small mb-0">Instructions for data removal.</p>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="mt-5 text-center">
                    <Link href="/" className="btn btn-outline-secondary rounded-pill px-4">
                        <i className="bi bi-arrow-left me-2"></i> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
