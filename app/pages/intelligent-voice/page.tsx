'use client';

import { useEffect, useState } from 'react';
import AOS from 'aos';
import Navbar from '@/components/home/Navbar';
import HomeFooter from '@/components/home/HomeFooter';
import SEOManager from '@/components/home/SEOManager';
import Link from 'next/link';

export default function VoiceCommandPage() {
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
            <SEOManager pageKey="intelligent-voice" />

            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />

            <Navbar scrolled={scrolled} />

            {/* Hero Section */}
            <section className="pt-10 pb-5 position-relative overflow-hidden bg-neural-grid">
                <div className="container pt-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6" data-aos="fade-right">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-danger text-white rounded-pill px-3 py-1 extra-small fw-bold">NEURAL VOICE ENGINE</span>
                                <span className="text-danger opacity-50 extra-small tracking-widest fw-bold">100% HANDS-FREE OPERATIONS</span>
                            </div>
                            <h1 className="display-1 fw-900 text-white mb-4">
                                Intelligent <span className="text-gradient-red">Voice Command</span>
                            </h1>
                            <p className="lead opacity-60 fs-4 mb-5">
                                Control your entire real estate empire using natural language. From pipeline risk assessments to market forecasting, our neural engine understands intent with institutional precision.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                <Link href="/register" className="btn btn-danger btn-lg rounded-pill px-5 fw-800 shadow-lg glow-red">
                                    Activate Voice AI
                                </Link>
                                <button className="btn btn-outline-white btn-lg rounded-pill px-5 fw-800">
                                    Command List
                                </button>
                            </div>
                        </div>
                        <div className="col-lg-6" data-aos="zoom-in">
                            <div className="position-relative">
                                <div className="neural-orb"></div>
                                <div className="p-2 glass-card rounded-5 position-relative z-1 overflow-hidden d-flex flex-column align-items-center justify-content-center" style={{ height: '400px' }}>
                                    <div className="voice-waves d-flex align-items-center gap-1 mb-4">
                                        {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                                            <div key={i} className="wave-bar bg-danger" style={{ height: `${h * 20}px`, animationDelay: `${i * 0.1}s` }}></div>
                                        ))}
                                    </div>
                                    <div className="extra-small text-danger fw-800 pulse">LISTENING_FOR_INTENT...</div>
                                    <div className="mt-4 p-3 glass-card bg-white/5 border-white/5 text-center" style={{ maxWidth: '300px' }}>
                                        <div className="small opacity-50 italic">"Virpa, show me high-risk leads in the Dubai region..."</div>
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
                        <span className="text-danger fw-800 lowercase tracking-widest small mb-2 d-block">// VOICE ARCHITECTURE</span>
                        <h2 className="display-4 fw-900 text-white">Vocal Intelligence Protocol</h2>
                    </div>

                    <div className="row g-4">
                        {[
                            {
                                title: 'Voice Risk Mitigation',
                                desc: 'Instantly query deal risks using voice commands. Get real-time spoken analysis of pipeline health and deal leakage points.',
                                icon: 'bi-mic-fill',
                                code: 'VOICE_RISP_ANALYSIS_V1',
                                badge: 'Real-time'
                            },
                            {
                                title: 'Hands-Free Analytics',
                                desc: 'Command your dashboards without a mouse. Request data visualizations and KPI deep-dives while in Transit or on the move.',
                                icon: 'bi-ear-fill',
                                code: 'ANALYTICS_ON_COMMAND',
                                badge: 'Mobile'
                            },
                            {
                                title: 'Neural Intent Decoding',
                                desc: 'Our SLU (Spoken Language Understanding) engine maps vocal patterns to complex CRM actions and data queries with 98% accuracy.',
                                icon: 'bi-translate',
                                code: 'SLU_VOICE_MAPPER',
                                badge: 'Intelligence'
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
                                <div className="extra-small text-danger mb-1">// SLU Confidence Score</div>
                                <div className="small text-white opacity-80 mb-2">{"{"}</div>
                                <div className="ml-4 small text-secondary">
                                    <span className="text-danger">"engine":</span> "NeuralVoice_v3",<br />
                                    <span className="text-danger">"intent_accuracy":</span> 98.7%,<br />
                                    <span className="text-danger">"latency":</span> "45ms",<br />
                                    <span className="text-danger">"voice_biometrics":</span> <span className="text-success">"AUTHENTICATED"</span>,<br />
                                    <span className="text-danger">"status":</span> <span className="text-warning">"ACTIVE"</span>
                                </div>
                                <div className="small text-white opacity-80 mt-2">{"}"}</div>
                            </div>
                        </div>
                        <div className="col-lg-6 order-1 order-lg-2" data-aos="fade-left">
                            <span className="text-danger fw-800 uppercase tracking-widest small mb-3 d-block">THE OUTCOME</span>
                            <h2 className="display-4 fw-900 text-white mb-4">100% Hands-Free Operational Flow</h2>
                            <p className="lead opacity-60 mb-5">
                                Reclaim thousands of hours lost to manual data entry. Command your CRM, query your analytics, and manage your inventory at the speed of thought.
                            </p>
                            <ul className="list-unstyled d-flex flex-column gap-3">
                                {[
                                    'Real-time Vocal Risk Assessment',
                                    'Multi-Language Neural Understanding',
                                    'Voice-Locked Administrative Access',
                                    'Institutional Intent Accuracy'
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
                .wave-bar {
                    width: 4px;
                    border-radius: 2px;
                    animation: wave-animation 1s infinite alternate ease-in-out;
                }
                @keyframes wave-animation {
                    from { transform: scaleY(1); }
                    to { transform: scaleY(1.5); }
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
            `}</style>
        </div>
    );
}
