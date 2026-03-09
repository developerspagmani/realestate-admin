'use client';

export default function SecureData() {
    return (
        <section className="section-padding bg-black overflow-hidden position-relative">
            {/* Background Decorative Elements */}
            <div className="position-absolute top-50 start-0 translate-middle-y w-25 h-100 bg-red opacity-50 blur-100 rounded-circle" style={{ filter: 'blur(120px)', zIndex: 0 }}></div>
            <div className="position-absolute bottom-0 end-0 w-25 h-50 bg-red opacity-50 blur-100" style={{ filter: 'blur(100px)', zIndex: 0 }}></div>

            <div className="container position-relative z-1">
                <div className="row align-items-center g-5">
                    <div className="col-lg-6 mb-5 mb-lg-0" data-aos="fade-right">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="text-red fw-800 uppercase tracking-widest small">// ARCHITECTURAL INTEGRITY</span>
                            <div className="bg-red/20 px-2 py-1 rounded-2 extra-small text-red fw-900 border border-red/20">AWS_HOSTED</div>
                        </div>
                        <h2 className="display-4 fw-900 text-white mb-4 tracking-tighter">
                            Double-Layer <br />
                            <span className="text-red">Encrypted</span> Protocols
                        </h2>
                        <p className="lead opacity-50 mb-5 max-w-500">
                            Your institutional data is forged within AWS high-security zones. We employ biometric neural keys and redundant double-layer encryption, ensuring a 98% threat immunity rating.
                        </p>

                        <div className="row g-4">
                            {[
                                { t: 'AWS Shield Hub', d: 'Enterprise-grade DDoS protection and infrastructure isolation.', icon: 'bi-cloud-check-fill' },
                                { t: 'Double-Layer Vault', d: 'AES-256 encryption at rest combined with dynamic neural hashing.', icon: 'bi-shield-shaded' }
                            ].map((item, idx) => (
                                <div key={idx} className="col-md-11">
                                    <div className="d-flex gap-4 p-4 glass-card border-red/10 hvr-translate-right pointer">
                                        <div className="text-red fs-2">
                                            <i className={`bi ${item.icon}`}></i>
                                        </div>
                                        <div>
                                            <h5 className="text-white fw-900 mb-1">{item.t}</h5>
                                            <p className="small opacity-40 m-0">{item.d}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-lg-6" data-aos="zoom-in" data-aos-delay="200">
                        <div className="position-relative p-4">
                            {/* Security Orbit Animation */}
                            <div className="security-orbit d-flex align-items-center justify-content-center">
                                <div className="orbit-ring"></div>
                                <div className="orbit-ring delay-1"></div>
                                <div className="orbit-ring delay-2"></div>

                                <div className="core-shield glass-card d-flex flex-column align-items-center justify-content-center p-5 shadow-red-lg border-red/30">
                                    <div className="pulse-icon mb-3">
                                        <i className="bi bi-shield-lock-fill display-1 text-red"></i>
                                    </div>
                                    <h4 className="fw-900 text-white mb-1">98.2%</h4>
                                    <span className="extra-small fw-800 text-red tracking-widest uppercase">Immunity Score</span>

                                    <div className="mt-4 p-3 bg-white/5 rounded-4 border border-white/5 w-100 text-center">
                                        <div className="extra-small opacity-30 font-monospace mb-1">ENCRYPTION_STATUS</div>
                                        <div className="extra-small text-success fw-bold font-monospace animate-pulse">● DOUBLE_LAYER_SECURED</div>
                                    </div>
                                </div>

                                {/* Floating Data Nodes */}
                                <div className="node node-1 p-2 glass-card border-white/10"><i className="bi bi-database-fill text-white opacity-50"></i></div>
                                <div className="node node-2 p-2 glass-card border-white/10"><i className="bi bi-hdd-network-fill text-white opacity-50"></i></div>
                                <div className="node node-3 p-2 glass-card border-white/10"><i className="bi bi-safe-fill text-white opacity-50"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .security-orbit {
                    position: relative;
                    height: 500px;
                    width: 100%;
                }
                .orbit-ring {
                    position: absolute;
                    border: 1px solid rgba(230, 0, 38, 0.1);
                    border-radius: 50%;
                    width: 400px;
                    height: 400px;
                    animation: orbit 10s linear infinite;
                }
                .orbit-ring.delay-1 { width: 450px; height: 450px; animation-duration: 15s; animation-direction: reverse; }
                .orbit-ring.delay-2 { width: 500px; height: 500px; animation-duration: 20s; }
                
                @keyframes orbit {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .core-shield {
                    width: 350px;
                    height: 350px;
                    border-radius: 50%;
                    z-index: 2;
                    background: rgba(0, 0, 0, 0.8) !important;
                }

                .node {
                    position: absolute;
                    border-radius: 50%;
                    width: 45px;
                    height: 45px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3;
                    box-shadow: 0 0 20px rgba(230, 0, 38, 0.1);
                }
                .node-1 { top: 15%; right: 15%; animation: float 4s ease-in-out infinite; }
                .node-2 { bottom: 20%; right: 10%; animation: float 5s ease-in-out infinite 1s; }
                .node-3 { top: 40%; left: 5%; animation: float 6s ease-in-out infinite 2s; }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }

                .animate-pulse {
                    animation: pulse-simple 2s infinite;
                }
                @keyframes pulse-simple {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .bg-red\/20 { background-color: rgba(230, 0, 38, 0.2); }
                .border-red\/20 { border-color: rgba(230, 0, 38, 0.2); }
                .border-red\/10 { border-color: rgba(230, 0, 38, 0.1); }
                .border-red\/30 { border-color: rgba(230, 0, 38, 0.3); }
            `}</style>
        </section>
    );
}
