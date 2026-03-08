'use client';

import { useEffect, useState } from 'react';
import AOS from 'aos';
import Navbar from '@/components/home/Navbar';
import HomeFooter from '@/components/home/HomeFooter';
import SEOManager from '@/components/home/SEOManager';
import Link from 'next/link';

export default function AnalyticsPage() {
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
            <SEOManager pageKey="analytics" />

            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />

            <Navbar scrolled={scrolled} />

            {/* Hero Section */}
            <section className="pt-10 pb-5 position-relative overflow-hidden bg-neural-grid">
                <div className="container pt-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6" data-aos="fade-right">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-danger text-white rounded-pill px-3 py-1 extra-small fw-bold">ANALYTICS ENGINE</span>
                                <span className="text-danger opacity-50 extra-small tracking-widest fw-bold">35% REDUCTION IN CAC</span>
                            </div>
                            <h1 className="display-1 fw-900 text-white mb-4">
                                Data-Driven <span className="text-gradient-red">Intelligence</span>
                            </h1>
                            <p className="lead opacity-60 fs-4 mb-5">
                                Advanced insights to monitor and grow your real estate empire. Identify high-value lead sources and eliminate deal leakage with AI-driven risk mitigation.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                <Link href="/register" className="btn btn-danger btn-lg rounded-pill px-5 fw-800 shadow-lg glow-red">
                                    Access Intelligence
                                </Link>
                                <button className="btn btn-outline-white btn-lg rounded-pill px-5 fw-800">
                                    View Demo
                                </button>
                            </div>
                        </div>
                        <div className="col-lg-6" data-aos="zoom-in">
                            <div className="position-relative">
                                <div className="neural-orb"></div>
                                <div className="p-2 glass-card rounded-5 position-relative z-1 overflow-hidden">
                                    <img src="/images/feature_analytics.png" className="w-100 rounded-4" alt="Analytics Dashbaord" onError={(e: any) => e.target.src = '/images/placeholder.png'} />
                                    <div className="absolute-bottom-data p-3 glass-card border-0 rounded-0 w-100 d-flex justify-content-between align-items-center">
                                        <div className="extra-small opacity-50 fw-bold">CALCULATING YIELD...</div>
                                        <div className="extra-small text-danger fw-bold pulse">LIVE_METRICS</div>
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
                        <span className="text-danger fw-800 lowercase tracking-widest small mb-2 d-block">// THE CAPABILITIES</span>
                        <h2 className="display-4 fw-900 text-white">Advanced Insights Protocol</h2>
                    </div>

                    <div className="row g-4">
                        {[
                            {
                                title: 'Deal Intelligence',
                                desc: 'Monitor the health of every deal in your pipeline. Identify bottlenecks and use high-velocity data to drive closing ratios.',
                                icon: 'bi-lightbulb',
                                code: 'METRIC_DEAL_VELOCITY_V2',
                                badge: 'Real-time'
                            },
                            {
                                title: 'Prevention & Forecasting',
                                desc: 'Eliminate deal leakage before it happens. Our predictive algorithms forecast revenue and alert you to high-risk deals early.',
                                icon: 'bi-shield-check',
                                code: 'CALC_LEAKAGE_VECT_9',
                                badge: 'Predictive'
                            },
                            {
                                title: 'Property PropIntel',
                                desc: 'Deep-dive into unit-level performance. Understand which configurations and amenities are driving the highest ROI across your portfolio.',
                                icon: 'bi-house-heart',
                                code: 'UNIT_PERFORMANCE_SIGMA',
                                badge: 'Optimization'
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
                                <div className="extra-small text-danger mb-1">// Risk Mitigation Script</div>
                                <div className="small text-white opacity-80 mb-2">{"{"}</div>
                                <div className="ml-4 small text-secondary">
                                    <span className="text-danger">"module":</span> "PropIntel_Core",<br />
                                    <span className="text-danger">"risk_assessment":</span> "Automated",<br />
                                    <span className="text-danger">"forecast_confidence":</span> 98.4,<br />
                                    <span className="text-danger">"leakage_prevention":</span> <span className="text-success">"ACTIVE"</span>,<br />
                                    <span className="text-danger">"intelligence_sync":</span> <span className="text-warning">true</span>
                                </div>
                                <div className="small text-white opacity-80 mt-2">{"}"}</div>

                                <div className="mt-4 pt-4 border-top border-white/5">
                                    <div className="extra-small text-success mb-2">&gt; AGGREGATING MARKET DATA...</div>
                                    <div className="progress bg-black bg-opacity-50 rounded-pill" style={{ height: '4px' }}>
                                        <div className="progress-bar bg-danger animate-grow" style={{ width: '95%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 order-1 order-lg-2" data-aos="fade-left">
                            <span className="text-danger fw-800 uppercase tracking-widest small mb-3 d-block">THE OUTCOME</span>
                            <h2 className="display-4 fw-900 text-white mb-4">35% Reduction in Acquisition Cost</h2>
                            <p className="lead opacity-60 mb-5">
                                By leveraging high-velocity analytics, you can pinpoint exactly where your marketing spend is working and where it is being wasted. Optimize your CAC by refocusing on high-value channels.
                            </p>
                            <ul className="list-unstyled d-flex flex-column gap-3">
                                {[
                                    'Predictive Revenue Forecasting',
                                    'Deal Leakage Alert Systems',
                                    'Unit-Level ROI Performance Tracking',
                                    'Automated Market Sentiment Analysis'
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

            {/* Client Summary Callout */}
            <section className="section-padding bg-gradient-dark py-6 border-top border-bottom border-white/5">
                <div className="container text-center">
                    <div className="mx-auto" style={{ maxWidth: '900px' }} data-aos="zoom-in">
                        <i className="bi bi-quote display-3 text-danger opacity-20 mb-4"></i>
                        <h2 className="fw-800 text-white mb-4 fs-2 lh-base">"Analytics is the heartbeat of the modern real estate firm. With Virpanix Intelligence, we don&apos;t just look back at what happened; we predict what will happen next, ensuring our clients stay three steps ahead of the market."</h2>
                        <div className="mt-4 pt-4 border-top border-white/10 d-inline-block">
                            <span className="text-danger fw-800 uppercase tracking-widest extra-small">Intelligence Summary</span>
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
                .pulse { animation: pulse-red 2s infinite; }
                @keyframes pulse-red {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { opacity: 0.4; }
                }
                .animate-grow {
                    animation: grow-width 3s ease-out forwards;
                }
                @keyframes grow-width {
                    from { width: 0%; }
                    to { width: 95%; }
                }
                .ml-4 { margin-left: 1.5rem; }
                .bg-gradient-dark {
                    background: linear-gradient(to bottom, #000, #050505);
                }
            `}</style>
        </div>
    );
}
