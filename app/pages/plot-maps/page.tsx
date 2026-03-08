'use client';

import { useEffect, useState } from 'react';
import AOS from 'aos';
import Navbar from '@/components/home/Navbar';
import HomeFooter from '@/components/home/HomeFooter';
import SEOManager from '@/components/home/SEOManager';
import Link from 'next/link';

export default function PlotMapsPage() {
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
            <SEOManager pageKey="plot-maps" />

            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />

            <Navbar scrolled={scrolled} />

            {/* Hero Section */}
            <section className="pt-10 pb-5 position-relative overflow-hidden bg-neural-grid">
                <div className="container pt-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6" data-aos="fade-right">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-danger text-white rounded-pill px-3 py-1 extra-small fw-bold">VISUAL OPERATING LAYER</span>
                                <span className="text-danger opacity-50 extra-small tracking-widest fw-bold">70% BUYER ENGAGEMENT SURGE</span>
                            </div>
                            <h1 className="display-1 fw-900 text-white mb-4">
                                Interactive <span className="text-gradient-red">Plot Maps</span>
                            </h1>
                            <p className="lead opacity-60 fs-4 mb-5">
                                Immersive SVG-based site plans with real-time inventory status sync. Bridge the gap between digital discovery and physical clarity with institutional-grade visual tools.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                <Link href="/register" className="btn btn-danger btn-lg rounded-pill px-5 fw-800 shadow-lg glow-red">
                                    Launch Maps
                                </Link>
                                <button className="btn btn-outline-white btn-lg rounded-pill px-5 fw-800">
                                    SVG Upload Guide
                                </button>
                            </div>
                        </div>
                        <div className="col-lg-6" data-aos="zoom-in">
                            <div className="position-relative">
                                <div className="neural-orb"></div>
                                <div className="p-2 glass-card rounded-5 position-relative z-1 overflow-hidden">
                                    <div className="p-4 bg-dark bg-opacity-50 h-100">
                                        <div className="d-flex justify-content-between mb-4">
                                            <div className="fw-900 extra-small text-white">INTERACTIVE_MAP_RENDER_V2</div>
                                            <div className="text-success extra-small fw-bold">RENDERED</div>
                                        </div>
                                        <div className="map-simulation d-flex align-items-center justify-content-center h-100">
                                            <svg width="200" height="200" viewBox="0 0 100 100">
                                                <rect x="10" y="10" width="20" height="20" className="map-plot booked"></rect>
                                                <rect x="40" y="10" width="20" height="20" className="map-plot available pulsate-green"></rect>
                                                <rect x="70" y="10" width="20" height="20" className="map-plot booked"></rect>
                                                <rect x="10" y="40" width="20" height="20" className="map-plot available"></rect>
                                                <rect x="40" y="40" width="20" height="20" className="map-plot sold"></rect>
                                                <rect x="70" y="40" width="20" height="20" className="map-plot available"></rect>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="absolute-bottom-data p-3 glass-card border-0 rounded-0 w-100 d-flex justify-content-between align-items-center">
                                        <div className="extra-small opacity-50 fw-bold">FETCHING REAL-TIME STATUS...</div>
                                        <div className="extra-small text-danger fw-bold pulse">SVG_SYNCED</div>
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
                        <span className="text-danger fw-800 lowercase tracking-widest small mb-2 d-block">// VISUAL ARCHITECTURE</span>
                        <h2 className="display-4 fw-900 text-white">Geospatial Intelligence Protocol</h2>
                    </div>

                    <div className="row g-4">
                        {[
                            {
                                title: 'SVG Interactivity',
                                desc: 'Upload high-fidelity SVG site plans and map them to inventory units in seconds. Full zoom, pan, and hover support across all devices.',
                                icon: 'bi-bezier2',
                                code: 'VECTOR_MESH_SYNC',
                                badge: 'Immersive'
                            },
                            {
                                title: 'Live Status Sync',
                                desc: 'Automatic color-coding of plots based on availability—Sold, Booked, or Available. No manual updates required.',
                                icon: 'bi-arrow-clockwise',
                                code: 'STATUS_SYNC_REFRESH',
                                badge: 'Real-time'
                            },
                            {
                                title: 'Instant Unit Detail',
                                desc: 'Click any plot to reveal pricing, floor plans, and technical specs instantly. Close the sale right on the map.',
                                icon: 'bi-info-circle',
                                code: 'MODAL_DATA_PULL_FLOW',
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
                                <div className="extra-small text-danger mb-1">// SVG Render Stack</div>
                                <div className="small text-white opacity-80 mb-2">{"{"}</div>
                                <div className="ml-4 small text-secondary">
                                    <span className="text-danger">"layer":</span> "Geospatial_V2",<br />
                                    <span className="text-danger">"engagement_lift":</span> "+70%",<br />
                                    <span className="text-danger">"real_time_sync":</span> <span className="text-success">"ACTIVE"</span>,<br />
                                    <span className="text-danger">"vector_quality":</span> "Lossless",<br />
                                    <span className="text-danger">"status":</span> <span className="text-warning">"RENDERED"</span>
                                </div>
                                <div className="small text-white opacity-80 mt-2">{"}"}</div>
                            </div>
                        </div>
                        <div className="col-lg-6 order-1 order-lg-2" data-aos="fade-left">
                            <span className="text-danger fw-800 uppercase tracking-widest small mb-3 d-block">THE OUTCOME</span>
                            <h2 className="display-4 fw-900 text-white mb-4">70% Surge in Buyer Engagement</h2>
                            <p className="lead opacity-60 mb-5">
                                Transparency drives transactions. By providing an interactive, real-time view of your site plan, you bridge the gap between imagination and reality for your buyers.
                            </p>
                            <ul className="list-unstyled d-flex flex-column gap-3">
                                {[
                                    'Immersive Lossless SVG Site Plans',
                                    'Real-time Inventory Status Colors',
                                    'Instant Unit-Level Data Fetching',
                                    'High-Velocity Mobile Map Rendering'
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
                .map-plot {
                    fill: rgba(255, 255, 255, 0.05);
                    stroke: rgba(255, 255, 255, 0.1);
                    stroke-width: 0.5;
                    transition: all 0.3s;
                }
                .map-plot.available { fill: rgba(0, 255, 0, 0.1); stroke: rgba(0, 255, 0, 0.3); }
                .map-plot.booked { fill: rgba(255, 165, 0, 0.1); stroke: rgba(255, 165, 0, 0.3); }
                .map-plot.sold { fill: rgba(255, 0, 0, 0.1); stroke: rgba(255, 0, 0, 0.3); }
                .pulsate-green {
                    animation: plot-pulse 2s infinite;
                }
                @keyframes plot-pulse {
                    0% { fill: rgba(0, 255, 0, 0.1); }
                    50% { fill: rgba(0, 255, 0, 0.3); }
                    100% { fill: rgba(0, 255, 0, 0.1); }
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
