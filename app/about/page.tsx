'use client';

import Link from "next/link";
import { useEffect, useState } from 'react';
import AOS from 'aos';

export default function AboutPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        AOS.init({ duration: 1200, once: true });
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-black text-white min-vh-100 font-inter">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />

            {/* Navigation */}
            <nav className={`fixed-top w-100 transition-all ${scrolled ? 'bg-black/90 backdrop-blur-md border-bottom border-red/20' : 'bg-transparent'}`} style={{ zIndex: 1000, height: '80px' }}>
                <div className="container h-100 d-flex justify-content-between align-items-center">
                    <Link href="/" className="d-flex align-items-center gap-3 text-decoration-none">
                        <div className="logo-box bg-red text-white fw-900 px-2 py-1 rounded-1">V</div>
                        <span className="fw-900 text-uppercase tracking-widest text-white">Virpanix</span>
                    </Link>
                    <Link href="/" className="btn-outline-red py-2 px-4 small fw-700">Back to Home</Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-10 pb-5 position-relative overflow-hidden bg-grid">
                <div className="container pt-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6" data-aos="fade-right">
                            <span className="text-red fw-800 uppercase tracking-widest small mb-3 d-block">The Protocol</span>
                            <h1 className="display-2 fw-900 text-white mb-4">Our Mission</h1>
                            <p className="lead opacity-60 fs-4 mb-5">
                                To architect the future of institutional real estate through intelligent, high-velocity automation.
                                We bridge the gap between physical assets and digital intelligence.
                            </p>
                            <div className="glass-card p-4 border-start border-3 border-red">
                                <h4 className="fw-800 text-white mb-2">The Vision</h4>
                                <p className="opacity-50 m-0">To become the global operating standard for real estate portfolios, enabling a borderless, autonomous property ecosystem.</p>
                            </div>
                        </div>
                        <div className="col-lg-6" data-aos="zoom-in">
                            <div className="p-2 glass-card rounded-5">
                                <img src="/images/about_us.png" className="w-100 rounded-4 grayscale" alt="Virpanix Team" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="section-padding bg-black border-top border-white/5">
                <div className="container">
                    <div className="row g-4">
                        {[
                            { t: 'Precision', d: 'Institutional-grade data accuracy across all modules.' },
                            { t: 'Velocity', d: 'Accelerating the transaction lifecycle from lead to close.' },
                            { t: 'Security', d: 'SOC2 compliant multi-tenant data segregation.' }
                        ].map((v, i) => (
                            <div key={i} className="col-md-4" data-aos="fade-up" data-aos-delay={i * 100}>
                                <div className="glass-card p-5 h-100 hover-bg-red-light transition-all">
                                    <h3 className="fw-900 text-red mb-3">{v.t}</h3>
                                    <p className="opacity-50 m-0">{v.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <style jsx>{`
        .pt-10 { padding-top: 10rem; }
        .section-padding { padding: 100px 0; }
        .fw-900 { font-weight: 900; }
        .bg-grid {
          background-image: 
            linear-gradient(rgba(230,0,38,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(230,0,38,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 2rem;
        }
        .grayscale { filter: grayscale(100%) brightness(0.7); }
        .hover-bg-red-light:hover { background: rgba(230,0,38,0.05); }
      `}</style>
        </div>
    );
}
