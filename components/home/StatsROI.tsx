'use client';

export default function StatsROI() {
    const stats = [
        { val: '300%', label: 'WhatsApp Velocity', note: 'Direct Buyer Engagement' },
        { val: '95%', label: 'Marketing Savings', note: 'AI Brochure Generation' },
        { val: '70%', label: 'Engagement Increase', note: 'Interactive Mapping' },
        { val: '60%', label: 'Ad Spend Efficiency', note: 'Automated SEO & Social' }
    ];

    return (
        <section id="roi-metrics" className="section-padding bg-black border-top border-white/5">
            <div className="container text-center mb-10" data-aos="fade-up">
                <h2 className="display-3 fw-800 text-white">THE <span className="text-red">ROI</span> ADVANTAGE</h2>
                <p className="opacity-40 fs-5">Tangible growth metrics from real-world enterprise deployments.</p>
            </div>
            <div className="container">
                <div className="row g-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="col-lg-3 col-md-6" data-aos="zoom-in" data-aos-delay={i * 100}>
                            <div className="glass-card p-5 text-center h-100 border-bottom border-3 border-red hover-bg-red-light transition-all">
                                <h3 className="display-4 fw-900 text-red mb-1">{stat.val}</h3>
                                <p className="fw-800 text-uppercase tracking-widest small mb-2">{stat.label}</p>
                                <p className="extra-small opacity-40 uppercase m-0">{stat.note}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
