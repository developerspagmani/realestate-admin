'use client';

import { useEffect, useState } from 'react';
import AOS from 'aos';
import Navbar from '@/components/home/Navbar';
import SEOManager from '@/components/home/SEOManager';
import HomeFooter from '@/components/home/HomeFooter';

export default function ContactPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        AOS.init({ duration: 1200, once: true });
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-black text-white min-vh-100 font-inter">
            <SEOManager pageKey="contact" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" />

            <Navbar scrolled={scrolled} />

            <section className="pt-10 pb-5 position-relative overflow-hidden bg-grid">
                <div className="container pt-5">
                    <div className="row g-5">
                        <div className="col-lg-6" data-aos="fade-right">
                            <span className="text-red fw-800 uppercase tracking-widest small mb-3 d-block">Support Layer</span>
                            <h1 className="display-2 fw-900 text-white mb-4">Contact Intelligence</h1>
                            <p className="lead opacity-60 fs-4 mb-5">
                                Our global support centers are active 24/7 to assist institutional clients with deployment and configuration.
                            </p>

                            <div className="d-flex flex-column gap-4">
                                <div className="glass-card p-4 border-start border-3 border-red d-flex align-items-center gap-4">
                                    <div className="bg-red/10 p-3 rounded-circle text-red"><i className="bi bi-envelope-fill fs-4"></i></div>
                                    <div>
                                        <h6 className="fw-900 text-white mb-1">General Inquiries</h6>
                                        <p className="opacity-50 small m-0">contact@virpanix.com</p>
                                    </div>
                                </div>
                                <div className="glass-card p-4 border-start border-3 border-red d-flex align-items-center gap-4">
                                    <div className="bg-red/10 p-3 rounded-circle text-red"><i className="bi bi-shield-lock-fill fs-4"></i></div>
                                    <div>
                                        <h6 className="fw-900 text-white mb-1">Security & Compliance</h6>
                                        <p className="opacity-50 small m-0">security@virpanix.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6" data-aos="fade-left">
                            <div className="p-2 glass-card rounded-5 h-100">
                                <div className="p-5 h-100 d-flex flex-column justify-content-center">
                                    <h3 className="fw-900 text-white mb-4">Initialize Inquiry</h3>
                                    <div className="d-flex flex-column gap-3">
                                        <input type="text" className="form-control bg-white/5 border-white/10 text-white py-3 rounded-4" placeholder="Corporate Name" />
                                        <input type="email" className="form-control bg-white/5 border-white/10 text-white py-3 rounded-4" placeholder="Enterprise Email" />
                                        <textarea className="form-control bg-white/5 border-white/10 text-white py-3 rounded-4" rows={4} placeholder="Protocol Specification Inquiry"></textarea>
                                        <button className="btn-red w-100 py-3 rounded-4 fw-900">SUBMIT PROTOCOL REQUEST</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <HomeFooter />

            <style jsx>{`
        .pt-10 { padding-top: 10rem; }
        .py-10 { padding-top: 10rem; padding-bottom: 10rem; }
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
        .shadow-red-lg { box-shadow: 0 30px 60px -15px rgba(230,0,38,0.3); }
      `}</style>
        </div>
    );
}
