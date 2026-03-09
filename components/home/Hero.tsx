'use client';

import Link from "next/link";

export default function Hero() {
    return (
        <section className="hero vh-100 d-flex align-items-center justify-content-center text-center position-relative overflow-hidden bg-grid-hero">
            <div className="hero-bg-image position-absolute top-0 start-0 w-100 h-100 opacity-40" style={{ backgroundImage: 'url("/images/hero_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div className="hero-overlay position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.9) 100%)', zIndex: 1 }}></div>
            <div className="scanline"></div>
            <div className="hero-glow-center"></div>

            <div className="container position-relative z-1">
                <div className="row justify-content-center">
                    <div className="col-lg-10" data-aos="zoom-out-up">
                        <div className="d-inline-flex align-items-center gap-3 mb-4 px-4 py-2 glass-card rounded-pill border border-white/10 shadow-red-pulse">
                            <span className="bg-red text-white py-1 px-3 fw-800 extra-small rounded-pill uppercase tracking-widest">v3.5.0 Gold</span>
                            <span className="text-white opacity-60 extra-small uppercase tracking-widest fw-700">Next-Gen Real Estate OS</span>
                        </div>
                        <h1 className="display-3 fw-900 tracking-wider text-white mb-4 lh-1">
                            TRANSFORM YOUR <br />
                            <span className="text-red">REAL ESTATE</span> <br />
                            BUSINESS WITH <span className="text-red">
                                <br />VIRPANIX</span>
                        </h1>
                        <div className="d-flex justify-content-center align-items-center gap-1 mb-4 opacity-70">
                            {[1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((h, i) => (
                                <div key={i} className="hero-wave-bar bg-red" style={{ height: `${h * 6}px`, animationDelay: `${i * 0.1}s` }}></div>
                            ))}
                        </div>
                        <p className="lead opacity-60 mb-5 mx-auto max-w-800 fs-5 fw-400" data-aos="fade-up" data-aos-delay="400">
                            Institutional-grade AI for global property portfolios. <br />
                            Synchronize social reach, WhatsApp direct sales, and predictive analytics in one OS.
                        </p>
                        <div className="d-flex justify-content-center gap-4 flex-wrap" data-aos="fade-up" data-aos-delay="600">
                            <Link href="/register" className="btn-red btn-lg px-5 py-3 rounded-pill text-decoration-none">Initialize System</Link>
                            <Link href="/pages/plans" className="btn-outline-red btn-lg px-5 py-3 rounded-pill text-decoration-none">View Global Plans</Link>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hero-wave-bar {
                    width: 3px;
                    border-radius: 2px;
                    animation: hero-wave-animation 1s infinite alternate ease-in-out;
                    box-shadow: 0 0 10px rgba(230,0,38,0.5);
                }
                
                @keyframes hero-wave-animation {
                    from { transform: scaleY(0.7); opacity: 0.5; }
                    to { transform: scaleY(1.5); opacity: 1; }
                }
            `}</style>
        </section>
    );
}
