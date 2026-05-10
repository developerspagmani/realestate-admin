'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookieConsentProps {
    privacyLink?: string;
    termsLink?: string;
}

export default function CookieConsent({ privacyLink = '/privacy', termsLink = '/terms' }: CookieConsentProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Delay showing to feel natural
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = (type: 'all' | 'essential') => {
        localStorage.setItem('cookie_consent', type);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-consent-fixed">
            <div className="cookie-card glass-morphism p-2 p-md-3 rounded-top-3 shadow-lg border-top border-primary border-opacity-25 shadow-top">
                <div className="container">
                    <div className="row align-items-center g-4">
                        <div className="col-lg-8">
                            <div className="d-flex align-items-start gap-4">
                                <div className="cookie-icon bg-primary bg-opacity-10 px-3 py-2 rounded-circle text-primary d-none d-md-flex">
                                    <i className="bi bi-cookie fs-2 text-white"></i>
                                </div>
                                <div>
                                    <h4 className="fw-bold mb-2">Cookie Preferences</h4>
                                    <p className="text-muted mb-0 leading-relaxed">
                                        We use cookies to enhance your experience, analyze site traffic, and serve better ads. By clicking "Accept All", you consent to our use of all cookies. You can manage your preferences or read our <Link href={privacyLink} className="text-primary text-decoration-none fw-semibold">Privacy Policy</Link>.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-lg-end">
                                <button
                                    onClick={() => handleAccept('essential')}
                                    className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-semibold order-2 order-sm-1"
                                >
                                    Essential Only
                                </button>
                                <button
                                    onClick={() => handleAccept('all')}
                                    className="btn btn-primary btn-hover-glow rounded-pill px-5 py-2 fw-bold order-1 order-sm-2"
                                >
                                    Accept All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .cookie-consent-fixed {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    z-index: 9999;
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .glass-morphism {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                }

                [data-bs-theme="dark"] .glass-morphism {
                    background: rgba(15, 23, 42, 0.9);
                    border-color: rgba(255, 255, 255, 0.05) !important;
                }

                .shadow-top {
                    box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.1);
                }

                .btn-hover-glow:hover {
                    box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
                    transform: translateY(-2px);
                    transition: all 0.2s ease;
                }

                .cookie-icon {
                    flex-shrink: 0;
                }

                .leading-relaxed {
                    line-height: 1.6;
                }
            `}</style>
        </div>
    );
}
