'use client';

import Link from "next/link";
import ChatbotWidget from "@/components/modules/realestate/widgets/ChatbotWidget";

interface Module {
    id: string;
    title: string;
    impact: string;
    description: string;
    features: string[];
    img: string;
    color: string;
    isInteractive?: boolean;
}

const MODULES: Module[] = [
    {
        id: 'virpa-bot',
        title: 'Virpa: Conversational Intelligence',
        impact: 'NEURAL LEAD VECTORING ENGAGED',
        description: 'Virpa is a high-velocity Conversational Intelligence engine. Unlike standard chatbots, Virpa utilizes Semantic Understanding to decode complex buyer intent, performing real-time lead qualification across 15+ behavioral vectors before institutional CRM hand-off.',
        features: ['Linguistic Intent Decoding', 'Zero-Latency Lead Scoring', 'Multi-Language Neural Support'],
        img: '/images/feature_bot.png',
        color: 'danger',
        isInteractive: true
    },
    {
        id: 'analytics',
        title: 'Analytics & Intelligence',
        impact: '35% REDUCTION IN CAC',
        description: 'Advanced data-driven insights to monitor and grow your real estate business. Identify high-value lead sources and eliminate deal leakage with AI-driven risk mitigation. Turn raw data into a predictive revenue engine.',
        features: ['Deal Intelligence', 'Prevention & Forecasting', 'Property PropIntel'],
        img: '/images/feature_analytics.png',
        color: 'danger'
    },
    {
        id: 'crm',
        title: 'Leads & CRM Hub',
        impact: '45% SURGE IN AGENT PRODUCTIVITY',
        description: 'Centralized management for your entire sales pipeline. Capture leads from websites and widgets, track status via Kanban, and ensure 100% lead follow-up compliance with automated scoring.',
        features: ['Lead Scoring', 'Audience Grouping', 'Kanban Management'],
        img: '/images/feature_crm.png',
        color: 'danger'
    },

    {
        id: 'intelligent-voice',
        title: 'Intelligent Voice Command',
        impact: '100% HANDS-FREE OPERATIONS',
        description: 'Control your entire real estate empire with your voice. From pipeline risk assessments to market demand forecasting, our neural engine understands human intent with institutional precision.',
        features: ['Voice Risk Mitigation', 'Conversational Intelligence', 'Hands-Free Analytics'],
        img: '/images/intelligent_voice_ai_feature.png', // This will be the generated image
        color: 'danger'
    },

    {
        id: 'social-whatsapp',
        title: 'Social Hub & WhatsApp Business',
        impact: '300% HIGHER CONVERSION VELOCITY',
        description: 'The ultimate omnichannel communication layer. Automate property distribution across Facebook & Instagram while managing direct customer engagement via integrated WhatsApp Business API.',
        features: ['WhatsApp Automation', 'Omnichannel Ads Sync', 'Conversational AI Chatbots'],
        img: '/images/feature_social_whatsapp.png',
        color: 'danger'
    },
    {
        id: 'marketing',
        title: 'Marketing & Automation',
        impact: '3X CUSTOMER LIFETIME VALUE',
        description: 'Powerful tools for email campaigns, automation, and audience growth. Deliver the right property at the perfect moment through behavioral-triggered nurture sequences.',
        features: ['Campaign Designer', 'Automation Workflows', 'Smart Lead Forms'],
        img: '/images/feature_marketing.png',
        color: 'danger'
    },
    {
        id: 'inventory',
        title: 'Property Portfolio',
        impact: 'OPTIMIZED PORTFOLIO VELOCITY',
        description: 'Comprehensive management of buildings, units, and digital assets. Prevent double-bookings and manage dynamic pricing rules with ironclad buyer trust through transparency.',
        features: ['Consolidated Management', 'Media Gallery Hub', 'Batch Operations'],
        img: '/images/feature_inventory.png',
        color: 'danger'
    },
    {
        id: 'plot-maps',
        title: 'Interactive Plot Maps',
        impact: '70% BUYER ENGAGEMENT SURGE',
        description: 'Immersive SVG-based site plans with real-time status sync. Provide instant clarity on availability and premium locations directly from your portal.',
        features: ['SVG Interactivity', 'Live Status Sync', 'Instant Unit Detail'],
        img: '/images/feature_plot.png',
        color: 'danger'
    },
    {
        id: 'matching',
        title: 'Matching Engine',
        impact: '60% FASTER SALES CYCLE',
        description: 'Convert "just looking" into "ready to buy" by instantly aligning inventory with deep buyer intent. Automated matching based on location, budget, and amenities.',
        features: ['Intent Matching', 'Aesthetic Alignment', 'Note System'],
        img: '/images/feature_matching.png',
        color: 'danger'
    },
    {
        id: 'brochure-ai',
        title: 'Brochure Intelligent AI',
        impact: '95% PRODUCTION OVERHEAD REDUCTION',
        description: 'Generate elite, print-ready property brochures in seconds using Gemini Nano AI. Convert technical specs into persuasive sales copy automatically.',
        features: ['AI Copywriting', 'Smart Media Sync', 'Interactive PDF Export'],
        img: '/images/feature_brochure.png',
        color: 'danger'
    },
    {
        id: 'seo',
        title: 'Search SEO Engine',
        impact: '60% AD SPEND REDUCTION',
        description: 'Dominate organic search results with automated indexing and XML sitemap management. Your inventory appears in Google results within minutes.',
        features: ['Indexing Pings', 'Schema.org Markup', 'Core Web Vitals'],
        img: '/images/feature_seo.png',
        color: 'danger'
    },
    {
        id: 'websites',
        title: 'Websites & Ecosystem',
        impact: '50% INBOUND QUALITY BOOST',
        description: 'Launch branded real estate portals and property microsites instantly. lower reliance on third-party portals and own your audience directly.',
        features: ['Instant Layouts', 'Domain Mapping', 'Universal Script Widgets'],
        img: '/images/feature_website.png',
        color: 'danger'
    }
];

export default function Modules() {
    return (
        <section id="modules" className="bg-black pt-10">
            <div className="container text-center mb-10" data-aos="fade-up">
                <h2 className="display-3 fw-800 text-white">THE <span className="text-red">OPERATING</span> SUITE</h2>
                <p className="opacity-40 fs-5">Advanced technical modules designed for the modern property enterprise.</p>
            </div>

            {MODULES.map((m, i) => (
                <div key={m.id} className={`section-padding border-top border-white/5 ${i % 2 === 0 ? 'bg-black' : 'bg-red/5'}`}>
                    <div className="container">
                        <div className={`row align-items-center g-5 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                            <div className="col-lg-6" data-aos={i % 2 === 0 ? 'fade-right' : 'fade-left'}>
                                <div className="module-content">
                                    <span className="text-red fw-800 uppercase tracking-widest small mb-3 d-block">{m.impact}</span>
                                    <h2 className="display-4 fw-800 text-white mb-4">{m.title}</h2>
                                    <p className="opacity-60 fs-5 mb-5 lh-base">{m.description}</p>

                                    <div className="features-list d-flex flex-column gap-3 mb-5">
                                        {m.features.map((f, idx) => (
                                            <div key={idx} className="d-flex align-items-center gap-3">
                                                <div className={`bg-${m.color === 'danger' ? 'red' : m.color} text-white rounded-circle p-1 d-flex align-items-center justify-content-center`} style={{ width: '24px', height: '24px' }}>
                                                    <i className="bi bi-check2 fw-bold" style={{ fontSize: '12px' }}></i>
                                                </div>
                                                <span className="fw-700 text-white opacity-80">{f}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Link href={`/pages/${m.id === 'virpa-bot' ? 'virpa-ai' : m.id === 'matching' ? 'matching-engine' : m.id === 'seo' ? 'seo-engine' : m.id === 'social-whatsapp' ? 'social-hub' : m.id}`} className={`btn btn-link text-red p-0 fw-800 text-decoration-none hvr-translate-right`}>
                                        Explore {m.title} <i className="bi bi-arrow-right ms-2"></i>
                                    </Link>
                                </div>
                            </div>
                            <div className="col-lg-6" data-aos={i % 2 === 0 ? 'fade-left' : 'fade-right'}>
                                <div className={`p-2 glass-card rounded-5 overflow-hidden shadow-red-lg position-relative`} style={{ height: '550px' }}>

                                    {/* Artificial Intelligence Overlay for Virpa */}
                                    {m.id === 'virpa-bot' && (
                                        <div className="position-absolute top-0 start-0 w-100 p-4 d-flex justify-content-between align-items-start z-3">
                                            <div className="glass-card px-3 py-2 border border-red/20 d-flex align-items-center gap-2">
                                                <div className="bg-red rounded-circle animate-pulse" style={{ width: '8px', height: '8px' }}></div>
                                                <span className="extra-small fw-800 text-white opacity-60">NEURAL PROCESSING...</span>
                                            </div>
                                            <div className="glass-card px-3 py-2 border border-red/20">
                                                <span className="extra-small fw-800 text-red">INTENT SCORE: 98%</span>
                                            </div>
                                        </div>
                                    )}

                                    <img src={m.img} className="w-100 h-100 object-fit-cover rounded-4 grayscale hover-color" alt={m.title} onError={(e: any) => e.target.src = '/images/placeholder.png'} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </section>
    );
}
