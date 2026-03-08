'use client';

import { useEffect, useState } from 'react';
import AOS from 'aos';
import Navbar from '@/components/home/Navbar';
import HomeFooter from '@/components/home/HomeFooter';
import SEOManager from '@/components/home/SEOManager';
import Link from 'next/link';

export default function VirpaAIPage() {
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
            <SEOManager pageKey="virpa-ai" />

            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />

            <Navbar scrolled={scrolled} />

            {/* Hero Section */}
            <section className="pt-10 pb-5 position-relative overflow-hidden bg-neural-grid">
                <div className="container pt-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6" data-aos="fade-right">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-danger text-white rounded-pill px-3 py-1 extra-small fw-bold">PROTOCOL ENGAGED</span>
                                <span className="text-danger opacity-50 extra-small tracking-widest fw-bold">V3.2 NEURAL HUB</span>
                            </div>
                            <h1 className="display-1 fw-900 text-white mb-4">
                                Virpa: <span className="text-gradient-red">Conversational Intelligence</span>
                            </h1>
                            <p className="lead opacity-60 fs-4 mb-5">
                                Beyond the chatbot. Virpa is a high-velocity intelligence engine that decodes buyer intent, performing real-time lead qualification across 15+ behavioral vectors.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                <Link href="/" className="btn btn-danger btn-lg rounded-pill px-5 fw-800 shadow-lg glow-red">
                                    Launch Interface
                                </Link>
                                <button className="btn btn-outline-white btn-lg rounded-pill px-5 fw-800">
                                    API Docs
                                </button>
                            </div>
                        </div>
                        <div className="col-lg-6" data-aos="zoom-in">
                            <div className="position-relative">
                                <div className="neural-orb"></div>
                                <div className="p-2 glass-card rounded-5 position-relative z-1 overflow-hidden">
                                    <img src="/images/virpa_ai_core.png" className="w-100 rounded-4" alt="Virpa AI Neural Core" />
                                    <div className="absolute-bottom-data p-3 glass-card border-0 rounded-0 w-100 d-flex justify-content-between align-items-center">
                                        <div className="extra-small opacity-50 fw-bold">BUFFERING SEMANTIC DATA...</div>
                                        <div className="extra-small text-danger fw-bold pulse">SYS_ACTIVE</div>
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
                        <span className="text-danger fw-800 lowercase tracking-widest small mb-2 d-block">// THE ARCHITECTURE</span>
                        <h2 className="display-4 fw-900 text-white">Neural Processing Protocol</h2>
                    </div>

                    <div className="row g-4">
                        {[
                            {
                                title: 'Neural Intent Vectoring',
                                desc: 'Beyond simple keyword matching, Virpa performs "Semantic Decoding". When a search is initiated, the engine enters a isNeuralProcessing state, running through stages like "Mapping Intent Vectors" and "Decoding Semantic Requirements". It simulates how a Neural Network analyzes raw human requirements (Linguistic Decoding) before matching them to data.',
                                icon: 'bi-cpu',
                                code: 'PROTOCOL_INIT_VECTOR_MAP',
                                badge: 'Processing Layer'
                            },
                            {
                                title: 'Algorithmic Lead Scoring',
                                desc: 'A dedicated Intent Engine that analyzes user answers in real-time. For example: If a lead selects "Luxury" budget, the intentScore increases by +15 points. Interest in multiple locations adds +10 points. This "Behavioral Intelligence" predicts lead quality just like a seasoned human sales manager.',
                                icon: 'bi-graph-up-arrow',
                                code: 'CALC_INTENT_SIGMA_V3',
                                badge: 'Intent Engine'
                            },
                            {
                                title: 'Recommendation Logic',
                                desc: 'Virpa uses "Predictive Assistance" rather than static filtering. If a user seeks a 2 BHK, the upsellEnabled logic identifies "Premium" 3 BHK options they might like and presents them as a recommendation. This core pillar of AI operates similarly to high-tier systems like Netflix or Amazon.',
                                icon: 'bi-magic',
                                code: 'SUGGEST_UPGRADE_OPTIMIZED',
                                badge: 'Upselling Engine'
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
                                    <div className="extra-small mb-2 font-monospace text-white">{v.code}</div>
                                    <h3 className="fw-900 text-white mb-3">{v.title}</h3>
                                    <p className="opacity-50 m-0 fs-6 lh-base">{v.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Advanced Capabilities */}
            <section className="section-padding bg-black border-top border-white/5">
                <div className="container">
                    <div className="row g-5">
                        <div className="col-lg-6" data-aos="fade-right">
                            <span className="text-danger fw-800 uppercase tracking-widest small mb-3 d-block">// CONSTRAINT SATISFACTION</span>
                            <h2 className="display-5 fw-900 text-white mb-4">Semantic Requirement Mapping</h2>
                            <p className="lead opacity-60 mb-4 lh-base fs-5">
                                Virpa performs **Constraint Satisfaction** across multiple behavioral vectors simultaneously.
                            </p>
                            <div className="glass-card p-4 mb-4">
                                <h5 className="fw-800 text-danger mb-2">Simultaneous Vector Analysis</h5>
                                <p className="opacity-50 m-0">The bot maps location intent, city preferences, and budget across the entire property database in a single calculation cycle (`calculateResults`). Unlike a static form, it calculates the "best fit" even if no exact matches are found, offering smart suggestions to prevent "dead ends" in the conversation.</p>
                            </div>
                        </div>
                        <div className="col-lg-6" data-aos="fade-left">
                            <span className="text-danger fw-800 uppercase tracking-widest small mb-3 d-block">// INTELLECTUAL PERSISTENCE</span>
                            <h2 className="display-5 fw-900 text-white mb-4">Contextual Memory</h2>
                            <p className="lead opacity-60 mb-4 lh-base fs-5">
                                Contextual continuity is a core pillar of the Virpa Conversational experience.
                            </p>
                            <div className="glass-card p-4">
                                <h5 className="fw-800 text-danger mb-2">Persistent Session Intelligence</h5>
                                <p className="opacity-50 m-0">Using encrypted `localStorage` persistence (`STORAGE_KEY`), the bot remembers conversation context even after a page refresh. This provides **Contextual Continuity**, allowing the AI to maintain a persistent state of the user's requirements without requiring re-entry.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technical Breakdown */}
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
                                <div className="extra-small text-danger mb-1">// Initialization Sequence</div>
                                <div className="small text-white opacity-80 mb-2">{"{"}</div>
                                <div className="ml-4 small text-secondary">
                                    <span className="text-danger">"module":</span> "Virpa_AI_Hub",<br />
                                    <span className="text-danger">"protocol":</span> "Conversational_Intelligence",<br />
                                    <span className="text-danger">"vectors":</span> [<span className="text-info">"intent"</span>, <span className="text-info">"budget"</span>, <span className="text-info">"urgency"</span>],<br />
                                    <span className="text-danger">"neural_state":</span> <span className="text-success">"synced"</span>,<br />
                                    <span className="text-danger">"lead_scoring":</span> <span className="text-warning">true</span>,<br />
                                    <span className="text-danger">"active_threads":</span> 1024
                                </div>
                                <div className="small text-white opacity-80 mt-2">{"}"}</div>

                                <div className="mt-4 pt-4 border-top border-white/5">
                                    <div className="extra-small text-success mb-2">&gt; DEPLOYING NEURAL SYNC...</div>
                                    <div className="progress bg-black bg-opacity-50 rounded-pill" style={{ height: '4px' }}>
                                        <div className="progress-bar bg-danger animate-grow" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 order-1 order-lg-2" data-aos="fade-left">
                            <span className="text-danger fw-800 uppercase tracking-widest small mb-3 d-block">THE IMPACT</span>
                            <h2 className="display-4 fw-900 text-white mb-4">40% Faster Lead Qualification</h2>
                            <p className="lead opacity-60 mb-5">
                                By automating the initial discovery and requirement mapping phase, Virpa reduces the time your sales agents spend on discovery calls by 60%. Only high-intent, qualified leads ever reach your CRM.
                            </p>
                            <ul className="list-unstyled d-flex flex-column gap-3">
                                {[
                                    'Linguistic Intent Decoding across 15+ languages',
                                    'Zero-Latency Lead Scoring & Synchronization',
                                    'Automated CRM Requirement Mapping',
                                    'Advanced Upsell/Cross-sell Trigger logic'
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
                        <h2 className="fw-800 text-white mb-4 fs-2 lh-base">"Virpa isn&apos;t just a chatbot; it&apos;s a <span className="text-danger">Conversational Intelligence Engine</span>. It doesn&apos;t just read words - it decodes buyer intent, calculates lead scores based on behavioral vectors, and uses predictive logic to suggest premium property upgrades that match the user&apos;s underlying lifestyle goals."</h2>
                        <div className="mt-4 pt-4 border-top border-white/10 d-inline-block">
                            <span className="text-danger fw-800 uppercase tracking-widest extra-small">Platform Summary for Enterprise Clients</span>
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
                .x-small { font-size: 0.6rem; }
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
                    to { width: 85%; }
                }
                .ml-4 { margin-left: 1.5rem; }
                .letter-spacing-1 { letter-spacing: 0.1rem; }
                .bg-gradient-dark {
                    background: linear-gradient(to bottom, #000, #050505);
                }
            `}</style>
        </div>
    );
}
