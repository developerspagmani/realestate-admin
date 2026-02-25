'use client';

import Link from "next/link";
import { useEffect, useState, useRef } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import AOS from 'aos';

/**
 * Virpanix - Intelligent Real Estate OS
 * Redesign: Black 90% / Red 10%
 * Style: Creative, Smooth, Interactive
 */
export default function Home() {
  const { user, isAuthenticated, getRedirectPath } = useAuthContext();
  const [scrolled, setScrolled] = useState(false);
  const verticalSectionRef = useRef<HTMLElement>(null);
  const vItemsRef = useRef<NodeListOf<HTMLElement> | null>(null);
  const vVisualsRef = useRef<NodeListOf<HTMLElement> | null>(null);
  const scrollRequestRef = useRef<number | null>(null);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      anchorPlacement: 'top-bottom',
    });

    // Cache elements for performance
    if (verticalSectionRef.current) {
      vItemsRef.current = verticalSectionRef.current.querySelectorAll('.v-item');
      vVisualsRef.current = verticalSectionRef.current.querySelectorAll('.v-visual');
    }

    const updateScrollEffects = () => {
      const vSection = verticalSectionRef.current;
      if (!vSection || !vItemsRef.current || !vVisualsRef.current) return;

      const rect = vSection.getBoundingClientRect();
      const items = vItemsRef.current;
      const visuals = vVisualsRef.current;

      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        const totalScroll = vSection.offsetHeight - window.innerHeight;
        const progress = Math.min(1, Math.max(0, Math.abs(rect.top) / totalScroll));
        const index = Math.min(items.length - 1, Math.floor(progress * items.length));

        visuals.forEach((el, i) => {
          const isSelected = i === index;
          el.style.opacity = isSelected ? '1' : '0';
          el.style.transform = isSelected ? 'scale(1)' : 'scale(0.95)';
          el.style.zIndex = isSelected ? '1' : '0';
          el.style.visibility = isSelected ? 'visible' : 'hidden';
        });

        items.forEach((item, i) => {
          if (i === index) {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
            item.style.visibility = 'visible';
            item.style.zIndex = '10';
          } else if (i === index + 1 && i < items.length) {
            item.style.opacity = '0.15';
            item.style.transform = 'translateY(320px) scale(0.9)';
            item.style.visibility = 'visible';
            item.style.zIndex = '5';
          } else if (i === index + 2 && i < items.length) {
            item.style.opacity = '0.05';
            item.style.transform = 'translateY(550px) scale(0.85)';
            item.style.visibility = 'visible';
            item.style.zIndex = '2';
          } else {
            item.style.opacity = '0';
            item.style.transform = i < index ? 'translateY(-200px)' : 'translateY(800px)';
            item.style.visibility = 'hidden';
          }
        });
      }
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      if (scrollRequestRef.current) {
        cancelAnimationFrame(scrollRequestRef.current);
      }
      scrollRequestRef.current = requestAnimationFrame(updateScrollEffects);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollRequestRef.current) cancelAnimationFrame(scrollRequestRef.current);
    };
  }, []);

  return (
    <div className="landing-page bg-black text-white min-vh-100">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800&display=swap" />

      {/* Navigation */}
      <nav className={`fixed-top w-100 transition-all ${scrolled ? 'bg-black/80 backdrop-blur-lg border-bottom border-red opacity-100' : 'bg-transparent'}`} style={{ zIndex: 1000, height: '80px' }}>
        <div className="container h-100 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3" data-aos="fade-right">
            <div className="logo-box bg-red text-white fw-800 px-2 py-1 rounded-1" style={{ fontSize: '1.2rem' }}>V</div>
            <span className="fw-800 text-uppercase tracking-widest" style={{ fontSize: '1.4rem' }}>Virpanix</span>
          </div>

          <div className="d-none d-lg-flex align-items-center gap-5 small tracking-tight fw-600" data-aos="fade-left">
            {['Modules', 'Analytics', 'Ecosystem'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-white opacity-50 text-decoration-none hvr-red">
                {item}
              </a>
            ))}
            {isAuthenticated ? (
              <Link
                href={getRedirectPath()}
                className="btn-red py-2 px-4 shadow-sm"
              >
                {user?.name || 'Dashboard'}
              </Link>
            ) : (
              <div className="d-flex align-items-center gap-4">
                <Link href="/login" className="text-white opacity-50 text-decoration-none hvr-red">Sign In</Link>
                <Link href="/register" className="btn-red py-2 px-4">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero vh-100 d-flex align-items-center position-relative overflow-hidden bg-grid">
        <div className="red-glow top-0 end-0"></div>
        <div className="red-glow bottom-0 start-0" style={{ transform: 'scale(1.5)' }}></div>

        {/* Scanline Effect */}
        <div className="scanline"></div>

        <div className="container position-relative z-1">
          <div className="row align-items-center">
            <div className="col-lg-10">
              <div data-aos="zoom-out-up">
                <div className="d-flex align-items-center gap-3 mb-4" data-aos="fade-right" data-aos-delay="200">
                  <span className="bg-red text-white py-1 px-3 fw-800 small uppercase tracking-widest">Live</span>
                  <span className="text-white opacity-40 small uppercase tracking-widest">Protocol V2.5.4 Integrated</span>
                </div>
                <h1 className="fs-huge fw-800 tracking-tighter text-white mb-4">
                  COMMAND THE <br />
                  <span className="text-red">UNBUILT.</span>
                </h1>
                <p className="lead opacity-50 mb-5 max-w-700 fs-4" data-aos="fade-up" data-aos-delay="400">
                  The most advanced AI operating system for institutional portfolios.
                  Bridge physical architecture with digital speed and predictive automation.
                </p>
                <div className="d-flex flex-column flex-md-row gap-4 align-items-center" data-aos="fade-up" data-aos-delay="600">
                  <Link href="/register" className="btn-red btn-lg">
                    <span>Initialize System</span>
                    <i className="bi bi-arrow-right-short fs-4"></i>
                  </Link>
                  <button className="btn-outline-red btn-lg">
                    Watch Interface
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="position-absolute bottom-0 end-0 p-5 opacity-10 d-none d-lg-block" data-aos="fade-left">
          <span className="display-1 fw-900 text-stroke">VIRPANIX</span>
        </div>
      </section>

      {/* Vertical Slide Features (10 Modules) */}
      <section ref={verticalSectionRef} className="vertical-feature-section bg-black position-relative" style={{ height: '1000vh' }}>
        <div className="vh-100 w-100 d-flex align-items-center overflow-hidden" style={{ position: 'sticky', top: 0 }}>
          <div className="container">
            <div className="row align-items-center g-5">
              <div className="col-lg-5">
                <div className="v-content-wrapper position-relative" style={{ height: '700px' }}>
                  {[
                    { title: 'Unified Listing Management', desc: 'Aggregated property inventory from multiple sources into a single high-performance HUD.' },
                    { title: 'Autonomous AI Agents', desc: 'Qualify every lead 24/7. Our proprietary LLM handles initial inquiries and schedules tours.' },
                    { title: 'Global Settlement Engine', desc: 'Execute institutional transactions across borders with integrated multi-currency escrow.' },
                    { title: 'Predictive Yield Matrix', desc: 'Forecast market performance and vacancy trends with 94% accuracy via neural modeling.' },
                    { title: 'Social Campaign Sync', desc: 'Automate Meta and Google ad distribution directly from your inventory database.' },
                    { title: 'Spatial 3D Twins', desc: 'High-fidelity Matterport and custom Three.js integrations for immersive property tours.' },
                    { title: 'DNA Security Shield', desc: 'Institutional-grade RBAC and tenant data segregation with SOC2 compliance readiness.' },
                    { title: 'Multi-Tenant Architecture', desc: 'Manage unlimited sub-brands and agent teams with isolated data and custom domains.' },
                    { title: 'Dynamic CMS Builder', desc: 'Deploy white-labeled property portals and landing pages in seconds without code.' },
                    { title: 'Headless API Core', desc: 'Full-featured GraphQL and REST APIs to bridge the system with legacy enterprise ERPs.' }
                  ].map((feat, i) => (
                    <div key={i} className="v-item position-absolute transition-all w-100" style={{ opacity: i === 0 ? 1 : 0.2, top: 0 }}>
                      <span className="text-red fw-700 uppercase tracking-widest small mb-2 d-block">Module {String(i + 1).padStart(2, '0')}</span>
                      <h2 className="display-4 fw-800 text-white mb-4 line-clamp-2">{feat.title}</h2>
                      <p className="opacity-50 fs-5 line-clamp-3">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-lg-7">
                <div className="v-visual-container position-relative" style={{ height: '500px' }}>
                  {[
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
                    "https://images.unsplash.com/photo-1497366216548-37526070297c",
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
                    "https://images.unsplash.com/photo-1551288049-bbbda536639a",
                    "https://images.unsplash.com/photo-1552664730-d307ca884978",
                    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0",
                    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
                    "https://images.unsplash.com/photo-1497215728101-856f4ea42174",
                    "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c",
                    "https://images.unsplash.com/photo-1558494949-ef010cbdcc51"
                  ].map((url, i) => (
                    <div key={i} className="v-visual position-absolute w-100 h-100 rounded-5 overflow-hidden transition-all shadow-red-lg" style={{ opacity: i === 0 ? 1 : 0, zIndex: i === 0 ? 1 : 0 }}>
                      <img src={`${url}?auto=format&fit=crop&q=80&w=1200`} className="w-100 h-100 object-fit-cover grayscale" alt={`Module ${i + 1}`} />
                      <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="position-absolute bottom-0 start-0 w-100 p-4 d-flex justify-content-between align-items-end">
                        <div className="extra-small tracking-widest text-red opacity-50 fw-700">ENCODE_SESSION_{i * 124}</div>
                        <div className="text-white extra-small opacity-30">NOMINAL_FLOW</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Application Process */}
      <section className="section-padding bg-black border-top border-white/5">
        <div className="container">
          <div className="text-center mb-10" data-aos="fade-up">
            <h2 className="display-3 fw-800 text-white">Application <span className="text-red">Process</span></h2>
            <p className="opacity-40 mt-3 fs-5">Your journey to autonomous asset management in four simple steps.</p>
          </div>
          <div className="row g-0 mt-5 workflow-line position-relative">
            {[
              { title: 'Inquiry', icon: 'bi-chat-left-text', text: 'Submit your portfolio details for internal evaluation.' },
              { title: 'Calibration', icon: 'bi-cpu', text: 'Our team trains your custom AI model on property specifics.' },
              { title: 'Staging', icon: 'bi-layers', text: 'Deploy your white-labeled dashboards in a secure environment.' },
              { title: 'Execution', icon: 'bi-lightning', text: 'Go live and start capturing institutional-grade leads.' }
            ].map((item, i) => (
              <div key={i} className="col-md-3 text-center px-4 mb-5 mb-md-0" data-aos="zoom-in" data-aos-delay={i * 200}>
                <div className="process-node mx-auto mb-4 bg-red/10 border-red text-red rounded-circle d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px', borderWidth: '1px', borderStyle: 'solid' }}>
                  <i className={`bi ${item.icon} fs-2`}></i>
                </div>
                <h4 className="fw-800 text-white mb-3">{i + 1}. {item.title}</h4>
                <p className="opacity-40 small">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="section-padding bg-red/5 text-center">
        <div className="container py-5" data-aos="fade-up">
          <div className="mb-5 row justify-content-center">
            <div className="col-lg-8">
              <i className="bi bi-quote text-red display-1 opacity-20 mb-4 d-block"></i>
              <h2 className="display-5 fw-300 italic text-white lh-base">
                &quot;Virpanix didn&apos;t just digitize our inventory; they revolutionized our entire conversion cycle. We&apos;ve seen a 400% increase in lead response speed within 60 days.&quot;
              </h2>
              <div className="mt-5">
                <div className="bg-red mx-auto mb-3" style={{ width: '40px', height: '2px' }}></div>
                <h5 className="fw-800 text-white tracking-widest uppercase small m-0">Marcus Thorne</h5>
                <p className="text-red fw-600 extra-small uppercase m-0 mt-1">Chief Digital Officer, PrimeAssets Global</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Prediction Section */}
      <section className="section-padding bg-black border-top border-white/5 overflow-hidden">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6" data-aos="fade-right">
              <span className="text-red fw-700 uppercase tracking-widest small mb-3 d-block">Neural Engine Core</span>
              <h2 className="display-4 fw-800 text-white mb-4">AI Prediction <br /> <span className="text-red">Matrix</span></h2>
              <p className="opacity-50 fs-5 mb-4">Our proprietary neural engine processes over 10,000 global market signals per second to forecast asset performance with 94% accuracy.</p>

              <div className="prediction-details mt-5">
                {[
                  { label: 'Market Sentiment Analysis', value: 92 },
                  { label: 'Predictive Vacancy Score', value: 88 },
                  { label: 'Dynamic Yield Optimization', value: 95 }
                ].map((p, i) => (
                  <div key={i} className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small text-white opacity-80">{p.label}</span>
                      <span className="text-red small fw-700">{p.value}%</span>
                    </div>
                    <div className="progress bg-white/5" style={{ height: '4px' }}>
                      <div className="progress-bar bg-red" style={{ width: `${p.value}%` }} data-aos="slide-right" data-aos-delay={i * 200}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <div className="prediction-viz p-5 glass-card position-relative overflow-hidden">
                <div className="scanning-grid"></div>
                <div className="d-flex flex-column gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="d-flex gap-2 align-items-center opacity-30">
                      <div className="bg-red rounded-1" style={{ width: ((i * 13) % 100) + 50 + 'px', height: '4px' }}></div>
                      <div className="text-red small pulse" style={{ opacity: 0.2 + (i * 0.1) }}>• SCANNING...</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 text-center">
                  <div className="display-1 fw-900 text-red opacity-10">0.94X</div>
                  <p className="text-red tracking-widest small fw-700 uppercase">Confidence Interval Reached</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow */}
      <section className="section-padding bg-red/5">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6" data-aos="fade-right">
              <h2 className="display-4 fw-800 text-white mb-4">
                The <span className="text-red">Automation</span> <br />
                Lifecycle.
              </h2>
              <div className="workflow-steps mt-5">
                {[
                  { step: '01', title: 'Data Injection', desc: 'Sync multi-location inventory via global APIs.' },
                  { step: '02', title: 'Neural Analysis', desc: 'Qualify every inquiry with sentiment-aware AI.' },
                  { step: '03', title: 'Asset Activation', desc: 'Deploy targeted campaigns and booking engines.' }
                ].map((s, i) => (
                  <div key={i} className="d-flex gap-4 mb-5" data-aos="fade-left" data-aos-delay={i * 200}>
                    <div className="fs-1 fw-800 text-red opacity-30">{s.step}</div>
                    <div>
                      <h4 className="fw-700 text-white mb-2">{s.title}</h4>
                      <p className="opacity-50">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6" data-aos="flip-right">
              <div className="p-2 border-red border-dashed rounded-5 position-relative">
                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000" className="img-fluid rounded-5 grayscale brightness-50" alt="Workflow" />
                <div className="position-absolute top-50 start-50 translate-middle">
                  <div className="btn-red p-4 rounded-circle pulse">
                    <i className="bi bi-play-fill fs-3"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="analytics" className="section-padding bg-black border-top border-white/5">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-4" data-aos="fade-up">
              <span className="text-red fw-700 uppercase tracking-widest small d-block mb-3">Institutional results</span>
              <h2 className="display-4 fw-800 text-white mb-4">Numbers Speak.</h2>
              <p className="opacity-50 fs-5 mb-5">
                Our partners experience immediate velocity gains within 30 days of standard deployment.
              </p>
              <Link href="/register" className="btn-red">Get Case Studies</Link>
            </div>
            <div className="col-lg-8">
              <div className="row g-4">
                {[
                  { label: 'Booking Speed', val: '+410%', icon: 'bi-lightning-charge' },
                  { label: 'Yield Increase', val: '+28%', icon: 'bi-graph-up' },
                  { label: 'Agent Response', val: 'Instant', icon: 'bi-whatsapp' },
                  { label: 'System Uptime', val: '99.9%', icon: 'bi-shield-check' }
                ].map((stat, i) => (
                  <div key={i} className="col-sm-6" data-aos="zoom-in" data-aos-delay={i * 100}>
                    <div className="glass-card p-5 border-start border-4 border-red">
                      <div className="text-red fs-1 mb-3">
                        <i className={`bi ${stat.icon}`}></i>
                      </div>
                      <h3 className="display-5 fw-800 text-white mb-1">{stat.val}</h3>
                      <p className="opacity-40 fw-700 text-uppercase tracking-widest small">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Protocol (Institutional Logos) */}
      <section className="py-10 bg-black border-top border-white/5 opacity-40">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-5 grayscale">
            {['BLACKROCK', 'CBRE', 'JLL', 'CUSHMAN', 'KNIGHT FRANK'].map((logo) => (
              <span key={logo} className="fw-900 tracking-widest small">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Global Connectivity Section */}
      <section className="section-padding bg-black border-top border-white/5 overflow-hidden position-relative">
        <div className="red-glow top-50 start-50 translate-middle" style={{ opacity: 0.05 }}></div>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-5" data-aos="fade-right">
              <span className="text-red fw-700 uppercase tracking-widest small mb-3 d-block">Global Distribution</span>
              <h2 className="display-4 fw-800 text-white mb-4">Command the <br /> <span className="text-red">Globe.</span></h2>
              <p className="opacity-50 fs-5 mb-5">Deploy portals and sync multi-currency inventory across 140+ regional markets instantly. One architecture for a borderless portfolio.</p>

              <div className="market-stats d-flex gap-5 mt-5">
                <div>
                  <h3 className="fw-800 text-white m-0">142</h3>
                  <span className="extra-small uppercase tracking-widest text-red">Active Nodes</span>
                </div>
                <div>
                  <h3 className="fw-800 text-white m-0">2.4ms</h3>
                  <span className="extra-small uppercase tracking-widest text-red">Latent Sync</span>
                </div>
              </div>
            </div>
            <div className="col-lg-7" data-aos="zoom-in-left">
              <div className="map-container glass-card p-5 position-relative bg-grid">
                <svg viewBox="0 0 1000 500" className="w-100 opacity-20">
                  <path fill="none" d="M150,200 Q400,100 800,250" className="text-red" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
                  {[
                    { x: 200, y: 150, n: 'NYC' }, { x: 480, y: 120, n: 'LON' }, { x: 520, y: 180, n: 'DUB' }, { x: 820, y: 350, n: 'SYD' }
                  ].map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="3" fill="var(--primary-red)" className="pulse" />
                      <text x={p.x + 10} y={p.y + 5} fill="white" fontSize="12" className="fw-700 opacity-50">{p.n}</text>
                    </g>
                  ))}
                </svg>
                <div className="position-absolute bottom-0 end-0 p-4">
                  <div className="text-red extra-small fw-800 tracking-widest">REAL-TIME PACKET FLOW: NOMINAL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final High-Impact CTA */}
      <section className="section-padding position-relative overflow-hidden bg-grid">
        <div className="red-glow top-50 start-50 translate-middle" style={{ transform: 'scale(2)', opacity: 0.2 }}></div>
        <div className="container text-center position-relative z-1 py-5">
          <div data-aos="zoom-in" className="card-cta glass-card p-5 p-md-10 py-10">
            <h2 className="display-2 fw-800 text-white mb-4">Command the <span className="text-red">Unbuilt.</span></h2>
            <p className="opacity-50 fs-4 mb-5 mx-auto" style={{ maxWidth: '800px' }}>
              Join the elite institutional owners managing billions in scale-locked assets on the Virpanix Intelligence Layer.
            </p>
            <div className="d-flex gap-4 justify-content-center flex-wrap mt-2">
              <Link href="/register" className="btn-red btn-lg px-5 py-3">
                <span>Launch Autonomous Instance</span>
                <i className="bi bi-box-arrow-in-right fs-4"></i>
              </Link>
              <button className="btn-outline-red btn-lg px-5 py-3">Book Tactical Briefing</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 bg-black border-top border-white/5">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-6" data-aos="fade-right">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-red text-white fw-800 px-2 py-1 rounded-1">V</div>
                <span className="fw-800 text-uppercase tracking-widest">Virpanix</span>
              </div>
              <p className="opacity-30 small">The Intelligence Layer for Global Real Estate. Built for Institutional Velocity.</p>
            </div>
            <div className="col-md-6 text-md-end" data-aos="fade-left">
              <div className="d-flex gap-4 justify-content-md-end mb-4">
                <a href="#" className="text-white opacity-40 text-decoration-none hvr-red">Privacy</a>
                <a href="#" className="text-white opacity-40 text-decoration-none hvr-red">Terms</a>
                <a href="#" className="text-white opacity-40 text-decoration-none hvr-red">Security</a>
              </div>
              <p className="opacity-20 x-small">&copy; 2026 Virpanix Platform. All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .hvr-red { transition: all 0.3s ease; }
        .hvr-red:hover { color: var(--primary-red) !important; opacity: 1 !important; }
        
        .transition-all { transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); }

        .text-stroke { 
          -webkit-text-stroke: 1px rgba(255,255,255,0.1);
          color: transparent;
        }

        .scanline {
          width: 100%;
          height: 100px;
          z-index: 2;
          background: linear-gradient(0deg, rgba(230,0,38,0) 0%, rgba(230,0,38,0.05) 50%, rgba(230,0,38,0) 100%);
          opacity: 0.1;
          position: absolute;
          bottom: 100%;
          animation: scanline 8s linear infinite;
        }

        @keyframes scanline {
          0% { bottom: 100%; }
          100% { bottom: -100px; }
        }
        
        .pulse {
          animation: pulse-red 2s infinite;
        }
        
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(230, 0, 38, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(230, 0, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(230, 0, 38, 0); }
        }

        .max-w-700 { max-width: 700px; }

        .grayscale { filter: grayscale(100%); transition: all 0.5s ease; }
        .grayscale:hover { filter: grayscale(0%); brightness: 100% !important; }

        .shadow-red-lg { box-shadow: 0 20px 80px -20px rgba(230,0,38,0.3); }

        .workflow-line::before {
          content: '';
          position: absolute;
          top: 50px;
          left: 10%;
          right: 10%;
          height: 1px;
          background: rgba(230,0,38,0.2);
          z-index: 0;
          display: none;
        }

        @media (min-width: 768px) {
          .workflow-line::before { display: block; }
        }

        .scanning-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            linear-gradient(rgba(230,0,38,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(230,0,38,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
          animation: scan-grid 20s linear infinite;
        }

        @keyframes scan-grid {
          0% { transform: translateY(0); }
          100% { transform: translateY(20px); }
        }
        
        @media (max-width: 991px) {
          .fs-huge { font-size: 3.5rem; }
          .section-padding { padding: 60px 0; }
          .vertical-feature-section { height: auto !important; }
          .vertical-feature-section .sticky-top { position: relative !important; height: auto !important; padding: 60px 0; }
          .v-visual-container { height: 300px !important; margin-top: 50px; }
          .v-item { opacity: 1 !important; margin-bottom: 3rem !important; }
          .v-visual { position: relative !important; opacity: 1 !important; transform: none !important; margin-bottom: 2rem; }
        }
      `}</style>
    </div>
  );
}
