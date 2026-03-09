'use client';

import React from 'react';

export default function AboutSection() {
    return (
        <section id="about-app" className="section-padding bg-black border-top border-white/5 position-relative overflow-hidden">
            {/* Background elements */}
            <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 20% 40%, rgba(220, 38, 38, 0.15) 0%, transparent 40%)'
                }}
            />

            <div className="container position-relative z-1">
                <div className="row g-5 align-items-center">
                    <div className="col-lg-6" data-aos="fade-right">
                        <div className="px-3 py-1 bg-red/10 d-inline-block rounded-pill border border-red/20 mb-4">
                            <span className="text-red extra-small fw-800 tracking-widest uppercase">The Operating System</span>
                        </div>
                        <h2 className="display-4 fw-900 text-white mb-4 lh-1 d-flex align-items-center gap-3">
                            WHAT IS <span className="text-red">VIRPANIX?</span>
                            <img src="/images/Virpnix-logo-icon-svg.svg" style={{ height: '50px', width: 'auto' }} alt="Icon" />
                        </h2>
                        <p className="opacity-60 fs-5 mb-5 lh-base">
                            Virpanix is more than just a CRM; it is an <strong>Institutional-Grade Real Estate Operating System (OS)</strong>.
                            Built for modern property portfolios, it synchronizes social reach, WhatsApp direct sales, and predictive analytics into a single, high-velocity neural hub.
                        </p>

                        <div className="row g-4">
                            <div className="col-sm-6">
                                <div className="glass-card p-4 h-100 border-start border-red border-3">
                                    <h5 className="fw-800 text-white mb-2">Our Mission</h5>
                                    <p className="extra-small opacity-50 m-0">To architect the future of institutional real estate through intelligent, high-velocity automation.</p>
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="glass-card p-4 h-100 border-start border-red border-3">
                                    <h5 className="fw-800 text-white mb-2">Smart Protocol</h5>
                                    <p className="extra-small opacity-50 m-0">Institutional-grade data accuracy across all modules with SOC2 compliant multi-tenant data segregation.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6" data-aos="fade-left">

                        <div className="position-relative">
                            <div className="voice-orbit-animation"></div>
                            <div className="glass-card p-2 rounded-5 overflow-hidden shadow-red-lg border border-red/30 bg-black/40">
                                <img
                                    src="/images/about_us.png"
                                    className="w-100 rounded-4 hover-color"
                                    alt="Intelligent Voice Interface"
                                    style={{ filter: 'brightness(1.2) contrast(1.1)' }}
                                />
                            </div>
                            {/* Floating tags */}
                            <div className="position-absolute top-10 start-0 glass-card px-3 py-2 border border-red/20 animate-float">
                                <span className="text-red extra-small fw-800">98% Accuracy</span>
                            </div>
                            <div className="position-absolute bottom-20 end-0 glass-card px-3 py-2 border border-red/20 animate-float-delayed">
                                <span className="text-red extra-small fw-800">Institutional Grade</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .letter-spacing-1 { letter-spacing: 1px; }
                .duration-700 { transition-duration: 700ms; }
            `}</style>
        </section>
    );
}
