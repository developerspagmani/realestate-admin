'use client';

export default function VoiceShowcase() {
    return (
        <section id="voice-showcase" className="section-padding bg-black border-top border-white/5 overflow-hidden">
            <div className="container">
                <div className="row align-items-center g-5">
                    <div className="col-lg-6" data-aos="fade-right">
                        <div className="px-3 py-1 bg-red/10 d-inline-block rounded-pill border border-red/20 mb-4">
                            <span className="text-red extra-small fw-800 tracking-widest uppercase">Proprietary Voice Protocol</span>
                        </div>
                        <h2 className="display-3 fw-900 text-white mb-4 lh-1">YOUR VOICE IS THE <br /> <span className="text-red">NEW INTERFACE.</span></h2>
                        <p className="opacity-60 fs-5 mb-5 max-w-500">
                            Forget complex menus. Virpanix AI understands natural language.
                            Ask about your pipeline, risk factors, or market trends while you focus on what matters most: closing deals.
                        </p>

                        <div className="d-flex flex-column gap-4">
                            {[
                                { q: "Show me high-risk leads in Bangalore", a: "Analyzing 452 leads. 12 show high risk scores." },
                                { q: "What is the demand for studio apartments?", a: "Demand up 15%. Recommend inventory increase." },
                                { q: "Assign Jane's lead to Agent Smith", a: "Lead assigned. Notification sent to Agent." }
                            ].map((item, i) => (
                                <div key={i} className="glass-card p-4 border-start border-red border-3 hover-translate-right transition-all">
                                    <div className="d-flex gap-3 align-items-start">
                                        <div className="bg-red rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                            <i className="bi bi-mic-fill text-white small"></i>
                                        </div>
                                        <div>
                                            <p className="text-white fw-800 small mb-1">&quot;{item.q}&quot;</p>
                                            <p className="text-red extra-small fw-600 mb-0 opacity-80">{item.a}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-lg-6" data-aos="fade-left">
                        <div className="position-relative">
                            <div className="voice-orbit-animation"></div>
                            <div className="glass-card p-2 rounded-5 overflow-hidden shadow-red-lg border border-red/30 bg-black/40">
                                <img
                                    src="/images/intelligent_voice_ai_feature.png"
                                    className="w-100 rounded-4 hover-color"
                                    alt="Intelligent Voice Interface"
                                    style={{ filter: 'brightness(1.2) contrast(1.1)' }}
                                />
                            </div>
                            {/* Floating tags */}
                            <div className="position-absolute top-10 start-0 glass-card px-3 py-2 border border-red/20 animate-float">
                                <span className="text-red extra-small fw-800">98% Accuracy</span>
                            </div>
                            <div className="position-absolute bottom-20 end-0 glass-card px-3 py-2 border border-red/20 animate-float-delayed">
                                <span className="text-red extra-small fw-800">Neural NLP</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .max-w-500 { max-width: 500px; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 8s ease-in-out infinite 1s; }
        
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0); }
        }

        .voice-orbit-animation {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120%;
          height: 120%;
          background: radial-gradient(circle, rgba(230,0,38,0.1) 0%, transparent 70%);
          border: 1px dashed rgba(230,0,38,0.2);
          border-radius: 50%;
          z-index: -1;
          animation: spin 30s linear infinite;
        }
      `}</style>
        </section>
    );
}
