'use client';

import { useEffect, useState } from 'react';
import AOS from 'aos';
import Navbar from '@/components/home/Navbar';
import HomeFooter from '@/components/home/HomeFooter';
import SEOManager from '@/components/home/SEOManager';
import Link from 'next/link';

export default function MatchingEnginePage() {
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
            <SEOManager pageKey="matching-engine" />

            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />

            <Navbar scrolled={scrolled} />

            {/* Hero Section */}
            <section className="pt-10 pb-5 position-relative overflow-hidden bg-neural-grid">
                <div className="container pt-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6" data-aos="fade-right">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-danger text-white rounded-pill px-3 py-1 extra-small fw-bold">INTENT ALIGNMENT ENGINE</span>
                                <span className="text-danger opacity-50 extra-small tracking-widest fw-bold">60% FASTER SALES CYCLE</span>
                            </div>
                            <h1 className="display-1 fw-900 text-white mb-4">
                                Intelligent <span className="text-gradient-red">Matching Engine</span>
                            </h1>
                            <p className="lead opacity-60 fs-4 mb-5">
                                Convert interest into closing by perfectly aligning every lead with their ideal home. Automated, n-dimensional matching that considers every requirement from budget to lifestyle goals.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                <Link href="/register" className="btn btn-danger btn-lg rounded-pill px-5 fw-800 shadow-lg glow-red">
                                    Start Matching
                                </Link>
                                <button className="btn btn-outline-white btn-lg rounded-pill px-5 fw-800">
                                    Algorithm Specs
                                </button>
                            </div>
                        </div>
                        <div className="col-lg-6" data-aos="zoom-in">
                            <div className="position-relative">
                                <div className="neural-orb"></div>
                                <div className="p-2 glass-card rounded-5 position-relative z-1 overflow-hidden d-flex flex-column align-items-center justify-content-center" style={{ height: '400px' }}>
                                    <div className="d-flex align-items-center gap-5 justify-content-center">
                                        <div className="text-center">
                                            <div className="p-3 bg-white/5 rounded-pill mb-2"><i className="bi bi-person text-white"></i></div>
                                            <div className="extra-small opacity-50">LEAD</div>
                                        </div>
                                        <div className="matching-lines d-flex flex-column gap-2">
                                            <div className="m-line bg-danger"></div>
                                            <div className="m-line bg-danger opacity-50"></div>
                                            <div className="m-line bg-danger opacity-20"></div>
                                        </div>
                                        <div className="text-center">
                                            <div className="p-3 bg-red/10 rounded-pill mb-2 border-red/20"><i className="bi bi-house-door text-danger"></i></div>
                                            <div className="extra-small text-danger fw-bold">MATCH</div>
                                        </div>
                                    </div>
                                    <div className="absolute-bottom-data p-3 glass-card border-0 rounded-0 w-100 d-flex justify-content-between align-items-center">
                                        <div className="extra-small opacity-50 fw-bold">CALCULATING PROBABILITY...</div>
                                        <div className="extra-small text-success fw-bold">MATCH_V4_SECURED</div>
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
                        <span className="text-danger fw-800 lowercase tracking-widest small mb-2 d-block">// MATCHING ARCHITECTURE</span>
                        <h2 className="display-4 fw-900 text-white">Intent Alignment Protocol</h2>
                    </div>

                    <div className="row g-4">
                        {[
                            {
                                title: 'Intent Matching',
                                desc: 'Our algorithm maps thousands of lead requirements against live inventory to find the "best-fit" property instantly.',
                                icon: 'bi-crosshair',
                                code: 'MATCH_SCORE_CALC',
                                badge: 'Real-time'
                            },
                            {
                                title: 'Aesthetic Alignment',
                                desc: 'Go beyond specs. Match based on architectural style, floor plans, and lifestyle amenities that resonate with the buyer.',
                                icon: 'bi-palette',
                                code: 'VISUAL_VECTOR_MAP',
                                badge: 'Predictive'
                            },
                            {
                                title: 'Note System',
                                desc: 'Automatically generate lead-specific property summaries that explain exactly why a particular unit is their perfect match.',
                                icon: 'bi-journal-check',
                                code: 'AI_REASONING_ENGINE',
                                badge: 'Personalized'
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
                                <div className="extra-small text-danger mb-1">// Alignment Algorithm</div>
                                <div className="small text-white opacity-80 mb-2">{"{"}</div>
                                <div className="ml-4 small text-secondary">
                                    <span className="text-danger">"module":</span> "Intent_Aligner",<br />
                                    <span className="text-danger">"sales_velocity":</span> "+60%",<br />
                                    <span className="text-danger">"matching_accuracy":</span> 99.2%,<br />
                                    <span className="text-danger">"algorithm":</span> <span className="text-success">"NEURAL"</span>,<br />
                                    <span className="text-danger">"status":</span> <span className="text-warning">"OPTIMIZED"</span>
                                </div>
                                <div className="small text-white opacity-80 mt-2">{"}"}</div>
                            </div>
                        </div>
                        <div className="col-lg-6 order-1 order-lg-2" data-aos="fade-left">
                            <span className="text-danger fw-800 uppercase tracking-widest small mb-3 d-block">THE OUTCOME</span>
                            <h2 className="display-4 fw-900 text-white mb-4">60% Faster Sales Cycle</h2>
                            <p className="lead opacity-60 mb-5">
                                Eliminate the "search" phase. By instantly aligning buyer intent with available inventory, you reduce lead time and increase the probability of a deposit on the first interaction.
                            </p>
                            <ul className="list-unstyled d-flex flex-column gap-3">
                                {[
                                    'N-Dimensional Intent Mapping',
                                    'Automated Aesthetic Compatibility',
                                    'AI-Generated Matching Rationales',
                                    'Predictive Inventory Suggestions'
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
                .m-line {
                    height: 2px;
                    width: 50px;
                    border-radius: 1px;
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
