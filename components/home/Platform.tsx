'use client';

export default function Platform() {
    {/* Platform Protocol Section */ }
    return (
        <section className="section-padding bg-black overflow-hidden position-relative">
            <div className="container">
                <div className="row align-items-center g-5">
                    <div className="col-lg-6" data-aos="fade-right">
                        <span className="text-red fw-800 uppercase tracking-widest small mb-3 d-block">// PROTOCOL ECOSYSTEM</span>
                        <h2 className="display-3 fw-900 text-white mb-4">A Unified <span className="text-red">Platform</span></h2>
                        <p className="lead opacity-50 mb-5 max-w-500">
                            Virpanix isn't just a set of tools; it's a high-fidelity ecosystem where every module communicates through a neural intelligence layer. Experience institutional harmony at scale.
                        </p>

                        <div className="d-flex align-items-center gap-4 p-4 glass-card border-red/10 border-start border-3" style={{ maxWidth: '400px', borderRadius: '1rem 2.5rem 2.5rem 1rem' }}>
                            <div className="voice-waves d-flex align-items-center gap-1">
                                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                                    <div key={i} className="wave-bar bg-red" style={{ height: `${h * 15}px`, animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                            <div>
                                <div className="extra-small fw-900 text-red tracking-widest pulse-slow uppercase">Neural_Sync_Active</div>
                                <div className="extra-small opacity-30 font-monospace">LATENCY: 45ms</div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6" data-aos="fade-left">
                        <div className="p-2 glass-card rounded-5 border-white/5 shadow-red-pulse">
                            <div className="p-5 d-flex flex-column gap-4">
                                {[
                                    { t: 'Institutional Integration', d: 'WhatsApp, CRM, and Global Inventory synced in real-time.', icon: 'bi-cpu-fill' },
                                    { t: 'Behavioral Decoding', d: 'Extracting buyer intent from every micro-interaction automatically.', icon: 'bi-graph-up-arrow' },
                                    { t: 'Scale Protocol', d: 'Enterprise-grade architecture for multi-region portfolio owners.', icon: 'bi-shield-lock-fill' }
                                ].map((item, idx) => (
                                    <div key={idx} className="d-flex gap-4 align-items-start hvr-translate-right pointer">
                                        <div className="p-3 bg-red/10 rounded-4 text-red border border-red/10 shadow-sm">
                                            <i className={`bi ${item.icon} fs-4`}></i>
                                        </div>
                                        <div>
                                            <h5 className="fw-900 text-white mb-1 uppercase tracking-tight">{item.t}</h5>
                                            <p className="small opacity-40 m-0 lh-base">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}