'use client';

import { useEffect, useState } from 'react';
import AOS from 'aos';
import Navbar from '@/components/home/Navbar';
import HomeFooter from '@/components/home/HomeFooter';
import SEOManager from '@/components/home/SEOManager';
import Link from 'next/link';

export default function PropertyPortfolioPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            AOS.init({ duration: 1200, once: true });
            const handleScroll = () => setScrolled(window.scrollY > 50);
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, []);

    return (
        <div className="bg-black text-white min-vh-100 font-inter">
            <SEOManager pageKey="inventory" />

            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />

            <Navbar scrolled={scrolled} />

            {/* Hero Section */}
            <section className="pt-10 pb-5 position-relative overflow-hidden bg-neural-grid">
                <div className="container pt-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6" data-aos="fade-right">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-danger text-white rounded-pill px-3 py-1 extra-small fw-bold">PORTFOLIO OPERATING SYSTEM</span>
                                <span className="text-danger opacity-50 extra-small tracking-widest fw-bold">OPTIMIZED PORTFOLIO VELOCITY</span>
                            </div>
                            <h1 className="display-1 fw-900 text-white mb-4">
                                Property <span className="text-gradient-red">Portfolio</span>
                            </h1>
                            <p className="lead opacity-60 fs-4 mb-5">
                                Comprehensive management of buildings, units, and your entire digital asset inventory. Prevent double-bookings with live status syncing and dynamic pricing rules.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                <Link href="/register" className="btn btn-danger btn-lg rounded-pill px-5 fw-800 shadow-lg glow-red">
                                    Manage Inventory
                                </Link>
                                <button className="btn btn-outline-white btn-lg rounded-pill px-5 fw-800">
                                    Digital Twin Docs
                                </button>
                            </div>
                        </div>
                        <div className="col-lg-6" data-aos="zoom-in">
                            <div className="position-relative">
                                <div className="neural-orb"></div>
                                <div className="p-2 glass-card rounded-5 position-relative z-1 overflow-hidden">
                                    <div className="p-4 bg-dark bg-opacity-50">
                                        <div className="d-flex justify-content-between mb-4">
                                            <div className="fw-900 extra-small text-white">INVENTORY_V3_GRID</div>
                                            <div className="text-danger extra-small fw-bold pulse">LIVE_SYNC</div>
                                        </div>
                                        <div className="row g-2">
                                            {[1, 2, 3, 4, 5, 6].map(i => (
                                                <div key={i} className="col-4">
                                                    <div className="glass-card aspect-square bg-white/5 border-white/5 d-flex align-items-center justify-content-center">
                                                        <span className="extra-small opacity-30">UNIT_{i}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute-bottom-data p-3 glass-card border-0 rounded-0 w-100 d-flex justify-content-between align-items-center">
                                        <div className="extra-small opacity-50 fw-bold">UPDATING PRICING MATRIX...</div>
                                        <div className="extra-small text-success fw-bold pulse">ALL_UNITS_SYNCED</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Intelligence Pillars */}
            <section className="section-padding bg-black position-relative">
                <div className="container">
                    <div className="text-center mb-5 pb-5" data-aos="fade-up">
                        <span className="text-danger fw-800 lowercase tracking-widest small mb-2 d-block">// INVENTORY STACK</span>
                        <h2 className="display-4 fw-900 text-white">Unified Portfolio Protocol</h2>
                    </div>

                    <div className="row g-4">
                        {[
                            {
                                title: 'Consolidated Management',
                                desc: 'Manage massive portfolios spanning thousands of units across multiple buildings and locations in a single, unified interface.',
                                icon: 'bi-grid-3x3-gap',
                                code: 'PORTFOLIO_GRAND_MAP',
                                badge: 'Institutional'
                            },
                            {
                                title: 'Media Gallery Hub',
                                desc: 'Store high-resolution images, floor plans, and virtual tours in a centralized media hub. Instant asset loading for every lead.',
                                icon: 'bi-images',
                                code: 'CDN_ASSET_SYNC_V4',
                                badge: 'Optimized'
                            },
                            {
                                title: 'Batch Operations',
                                desc: 'Apply global pricing changes or status updates in seconds. Eliminate the friction of individual property management.',
                                icon: 'bi-lightning-charge',
                                code: 'BATCH_UPDATE_VECTOR',
                                badge: 'High-Velocity'
                            }
                        ].map((v, i) => (
                            <div key={i} className="col-lg-4" data-aos="fade-up" data-aos-delay={i * 100}>
                                <div className="glass-card p-5 h-100 hover-border-red transition-all">
                                    <div className="d-flex justify-content-between align-items-start mb-4">
                                        <div className="p-3 bg-red bg-opacity-10 rounded-4">
                                            <i className={`bi ${v.icon} text-white fs-3`}></i>
                                        </div>
                                        <span className="badge bg-white bg-opacity-10 text-white extra-small px-3 py-2 rounded-pill">{v.badge}</span>
                                    </div>
                                    <div className="extra-small text-white mb-2 font-monospace">{v.code}</div>
                                    <h3 className="fw-900 text-white mb-3">{v.title}</h3>
                                    <p className="opacity-50 m-0 fs-6 lh-base">{v.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section className="section-padding bg-black border-top border-white/5 overflow-hidden">
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6 order-2 order-lg-1" data-aos="fade-right">
                            <div className="bg-dark rounded-4 p-4 border border-white/5 shadow-2xl font-monospace">
                                <div className="d-flex gap-2 mb-4">
                                    <div className="rounded-circle bg-danger" style={{ width: '12px', height: '12px' }}></div>
                                    <div className="rounded-circle bg-warning" style={{ width: '12px', height: '12px' }}></div>
                                    <div className="rounded-circle bg-success" style={{ width: '12px', height: '12px' }}></div>
                                </div>
                                <div className="extra-small text-danger mb-1">// Portfolio Status Stream</div>
                                <div className="small text-white opacity-80 mb-2">{"{"}</div>
                                <div className="ml-4 small text-secondary">
                                    <span className="text-danger">"visibility":</span> "Global",<br />
                                    <span className="text-danger">"unit_sync":</span> 100%,<br />
                                    <span className="text-danger">"pricing_latency":</span> "0ms",<br />
                                    <span className="text-danger">"double_booking":</span> <span className="text-success">"PREVENTED"</span>,<br />
                                    <span className="text-danger">"status":</span> <span className="text-warning">"OPTIMIZED"</span>
                                </div>
                                <div className="small text-white opacity-80 mt-2">{"}"}</div>
                            </div>
                        </div>
                        <div className="col-lg-6 order-1 order-lg-2" data-aos="fade-left">
                            <span className="text-danger fw-800 uppercase tracking-widest small mb-3 d-block">THE OUTCOME</span>
                            <h2 className="display-4 fw-900 text-white mb-4">Optimized Portfolio Velocity</h2>
                            <p className="lead opacity-60 mb-5">
                                Eliminate the friction of individual property management. Our unified portfolio protocol ensures that your entire inventory is synced, priced, and ready for sale with ironclad buyer trust.
                            </p>
                            <ul className="list-unstyled d-flex flex-column gap-3">
                                {[
                                    'Institutional-Grade Batch Operations',
                                    'Real-time Double-Booking Prevention',
                                    'Centralized Media Asset Delivery',
                                    'Dynamic Institutional Pricing Rules'
                                ].map((item, idx) => (
                                    <li key={idx} className="d-flex align-items-center gap-3">
                                        <i className="bi bi-check-circle-fill text-danger"></i>
                                        <span className="opacity-80 fw-bold">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <HomeFooter />

            <style jsx>{`
                .pt-10 { padding-top: 10rem; }
                .section-padding { padding: 100px 0; }
                .fw-900 { font-weight: 900; }
                .fw-800 { font-weight: 800; }
                .text-gradient-red {
                    background: linear-gradient(135deg, #ff4d4d, #b30000);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .bg-neural-grid {
                    background-image: 
                        linear-gradient(rgba(230,0,38,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(230,0,38,0.03) 1px, transparent 1px);
                    background-size: 50px 50px;
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 2rem;
                }
                .neural-orb {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(230,0,38,0.1) 0%, transparent 70%);
                    filter: blur(60px);
                    z-index: 0;
                    animation: orb-pulse 4s infinite alternate;
                }
                @keyframes orb-pulse {
                    from { opacity: 0.5; transform: translate(-50%, -50%) scale(0.8); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                }
                .hover-border-red:hover {
                    border-color: rgba(230,0,38,0.4) !important;
                    background: rgba(230,0,38,0.01) !important;
                }
                .glow-red {
                    box-shadow: 0 0 20px rgba(230,0,38,0.3);
                }
                .glow-red:hover {
                    box-shadow: 0 0 30px rgba(230,0,38,0.5);
                }
                .tracking-widest { letter-spacing: 0.2rem; }
                .extra-small { font-size: 0.7rem; }
            `}</style>
        </div>
    );
}
