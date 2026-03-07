'use client';

import Link from "next/link";
import { useEffect, useState } from 'react';
import AOS from 'aos';

export default function PlansPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        AOS.init({ duration: 1200, once: true });
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const PLANS = [
        {
            name: 'Essential Protocol',
            price: '$299',
            period: '/mo per project',
            desc: 'Full automation core for single-project owners.',
            features: ['CRM Hub', 'WhatsApp Lite', 'Inventory Sync', 'Basic Analytics'],
            color: 'white'
        },
        {
            name: 'Professional Layer',
            price: '$899',
            period: '/mo up to 5 projects',
            desc: 'The best-seller for growing real estate developers.',
            features: ['Omnichannel Social Hub', 'WhatsApp API Sync', 'Interactive Plot Maps', 'AI Brochure Generator', 'Advanced SEO Engine'],
            color: 'red',
            popular: true
        },
        {
            name: 'Institutional Scale',
            price: 'Custom',
            period: 'Contact for Quote',
            desc: 'Enterprise-grade OS for global portfolio owners.',
            features: ['Unlimited Projects', 'Custom AI Scoring', 'SOC2 Dedicated Hub', 'Global Team Hierarchy', 'Priority Protocol Support'],
            color: 'white'
        }
    ];

    return (
        <div className="bg-black text-white min-vh-100 font-inter">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />

            {/* Navigation */}
            <nav className={`fixed-top w-100 transition-all ${scrolled ? 'bg-black/90 backdrop-blur-md border-bottom border-red/20' : 'bg-transparent'}`} style={{ zIndex: 1000, height: '80px' }}>
                <div className="container h-100 d-flex justify-content-between align-items-center">
                    <Link href="/" className="logo-box bg-red text-white fw-900 px-2 py-1 rounded-1 text-decoration-none">V</Link>
                    <div className="d-flex gap-4 align-items-center">
                        <Link href="/" className="text-white opacity-50 text-decoration-none hvr-red small fw-700">Home</Link>
                        <Link href="/register" className="btn-red py-2 px-4 small fw-700">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-10 pb-5 align-items-center justify-content-center text-center position-relative overflow-hidden bg-grid">
                <div className="container pt-5">
                    <h1 className="display-2 fw-900 text-white mb-4" data-aos="fade-up">Enterprise <span className="text-red">Plans</span></h1>
                    <p className="lead opacity-50 mb-10 max-w-700 mx-auto fs-4" data-aos="fade-up" data-aos-delay="200">
                        Institutional-grade pricing models designed to scale with your portfolio velocity.
                    </p>

                    <div className="row g-4 justify-content-center mt-5">
                        {PLANS.map((p, i) => (
                            <div key={i} className="col-lg-4" data-aos="zoom-in" data-aos-delay={i * 150}>
                                <div className={`glass-card p-5 h-100 position-relative ${p.popular ? 'border-red border-2 shadow-red-lg' : 'border-white/5'}`}>
                                    {p.popular && <span className="position-absolute top-0 start-50 translate-middle bg-red text-white py-1 px-4 rounded-pill extra-small fw-900 tracking-widest">RECOMMENDED</span>}
                                    <h3 className="fw-900 text-white mb-2">{p.name}</h3>
                                    <div className="d-flex align-items-end gap-2 mb-4">
                                        <span className={`display-4 fw-900 text-${p.color}`}>{p.price}</span>
                                        <span className="opacity-30 small mb-2">{p.period}</span>
                                    </div>
                                    <p className="opacity-50 small mb-5">{p.desc}</p>
                                    <hr className="border-white/10 mb-5" />
                                    <ul className="list-unstyled d-flex flex-column gap-3 mb-10 text-start">
                                        {p.features.map((f, idx) => (
                                            <li key={idx} className="d-flex align-items-center gap-3">
                                                <i className={`bi bi-check2 text-${p.color} fw-bold`}></i>
                                                <span className="small opacity-80">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/register" className={`btn-${p.color === 'red' ? 'red' : 'outline-red'} w-100 py-3 rounded-4 fw-900`}>ACCESS PROTOCOL</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container py-10" data-aos="zoom-in">
                <div className="p-2 glass-card rounded-5">
                    <img src="/images/plans.png" className="w-100 rounded-4 grayscale" alt="Pricing Plans Visualization" />
                </div>
            </div>

            <style jsx>{`
        .pt-10 { padding-top: 10rem; }
        .py-10 { padding-top: 5rem; padding-bottom: 5rem; }
        .mb-10 { margin-bottom: 3rem; }
        .fw-900 { font-weight: 900; }
        .bg-grid {
          background-image: 
            linear-gradient(rgba(230,0,38,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(230,0,38,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .max-w-700 { max-width: 700px; }
        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 2.5rem;
        }
        .grayscale { filter: grayscale(100%) brightness(0.7); }
        .shadow-red-lg { box-shadow: 0 30px 60px -15px rgba(230,0,38,0.3); }
      `}</style>
        </div>
    );
}
