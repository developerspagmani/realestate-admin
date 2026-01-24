'use client';

import Link from "next/link";
import { useEffect, useState } from 'react';

/**
 * Virpanix - Intelligent Real Estate Platform
 * Style: Apple Pro / Dark Mode / High Interaction
 * Theme: Black & White (Primary Black)
 */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      // Product Showcase Scroll Effect
      const showcase = document.querySelector('.product-showcase') as HTMLElement;
      if (showcase) {
        const rect = showcase.getBoundingClientRect();
        const items = document.querySelectorAll('.showcase-item') as NodeListOf<HTMLElement>;
        const totalHeight = showcase.offsetHeight;

        if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
          const progress = Math.abs(rect.top) / (totalHeight - window.innerHeight);
          const index = Math.min(items.length - 1, Math.floor(progress * items.length));

          items.forEach((item, i) => {
            if (i === index) {
              item.style.opacity = '1';
              item.style.transform = 'translateY(0)';
            } else if (i < index) {
              item.style.opacity = '0';
              item.style.transform = 'translateY(-100%)';
            } else {
              item.style.opacity = '0';
              item.style.transform = 'translateY(100%)';
            }
          });
        }
      }

      // Intersection Observer for scroll reveal
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };

    // Initialize Swiper
    const initSwiper = () => {
      if (typeof (window as any).Swiper !== 'undefined') {
        new (window as any).Swiper('.glassy-swiper', {
          slidesPerView: 3,
          spaceBetween: 30,
          loop: true,
          speed: 1000,
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
          },
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
          },
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          breakpoints: {
            640: { slidesPerView: 4 },
            1024: { slidesPerView: 3 },
          },
          effect: 'slide',
        });
      } else {
        setTimeout(initSwiper, 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    initSwiper();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page bg-black text-white min-vh-100 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
      <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js" async></script>

      {/* Minimal Pro Nav */}
      <nav className={`fixed-top w-100 transition-all ${scrolled ? 'bg-black/80 backdrop-blur-md border-bottom border-secondary/20' : 'bg-transparent'}`} style={{ zIndex: 1000, height: '60px' }}>
        <div className="container h-100 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="logo-box bg-white text-black fw-600 px-2 py-0 rounded-1" style={{ fontSize: '1rem' }}>V</div>
            <span className="fw-600 text-uppercase tracking-tighter text-white" style={{ fontSize: '1.2rem' }}>Virpanix</span>
          </div>
          <div className="d-none d-lg-flex align-items-center gap-4 small tracking-tight fw-400">
            <a href="#about" className="text-white opacity-60 text-decoration-none hvr-opacity">Portfolio</a>
            <a href="#features" className="text-white opacity-60 text-decoration-none hvr-opacity">Platform</a>
            <a href="#results" className="text-white opacity-60 text-decoration-none hvr-opacity">Impact</a>
            <Link href="/login" className="text-white opacity-60 text-decoration-none hvr-opacity">Sign In</Link>
            <Link href="/register" className="btn btn-white btn-sm rounded-pill px-4 fw-600 bg-white text-black">Get Started</Link>
          </div>
          <div className="d-lg-none">
            <Link href="/login" className="btn btn-outline-light btn-sm rounded-pill px-3 me-2">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Apple Pro Style */}
      <section className="hero vh-100 d-flex align-items-center justify-content-center text-center px-3 position-relative">
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-grid opacity-10"></div>
        <div className="container position-relative z-1">
          <div className="reveal">
            <h1 className="hero-title fw-300 mb-2 tracking-tight">Intelligence for Real Estate.</h1>
            <h1 className="hero-subtitle fw-300 mb-4 tracking-tight text-stroke">The Era of Autonomous Estate.</h1>
            <p className="hero-subtitle mx-auto fw-400 opacity-50 mb-5" style={{ maxWidth: '700px' }}>
              Virpanix merges spatial computing with predictive AI to redefine institutional real estate management. Maximize yield. Automate operations.
            </p>
            <div className="d-flex flex-column flex-md-row gap-3 gap-md-4 justify-content-center align-items-center">
              <Link href="/register" className="btn btn-white rounded-pill px-5 py-3 fw-600 bg-white text-black hvr-shift w-md-auto">
                Start Exploring
              </Link>
              <button className="btn btn-outline-light rounded-pill px-5 py-3 border-opacity-25 hvr-shift fw-400 w-md-auto text-white">
                Watch Intro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-10 bg-black border-top border-secondary border-opacity-10">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="p-3 border border-secondary border-opacity-25 rounded-5 overflow-hidden position-relative">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000"
                  alt="Modern Office"
                  className="img-fluid rounded-4 filter-bw grayscale"
                />
                <div className="position-absolute top-50 start-50 translate-middle bg-black p-4 border border-secondary rounded-circle animate-pulse">
                  <i className="bi bi-play-fill fs-2"></i>
                </div>
              </div>
            </div>
            <div className="col-lg-6 px-lg-5">
              <span className="text-uppercase tracking-widest small fw-bold text-white opacity-40 mb-3 d-block">Who We Are</span>
              <h2 className="display-4 display-md-3 fw-300 mb-4 tracking-tight leading-tight text-white">Redefining Reality through Intelligent Systems.</h2>
              <p className="opacity-50 mb-4 lh-lg">
                We aren't just a booking platform. We are an intelligence layer for the real estate industry. By combining spatial computing, AI lead generation, and autonomous management workflows, we empower owners to operate at 10x efficiency.
              </p>
              <div className="row g-4 mt-2">
                <div className="col-6">
                  <h5 className="fw-300 mb-2">01. AI Powered</h5>
                  <p className="small opacity-50">Predictive booking algorithms for max occupancy.</p>
                </div>
                <div className="col-6">
                  <h5 className="fw-300 mb-2">02. Spatial Prep</h5>
                  <p className="small opacity-50">Photorealistic 3D tours of every square inch.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-15 bg-black">
        <div className="container py-5">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6 reveal">
              <span className="text-uppercase tracking-widest x-small fw-600 text-white opacity-40 mb-4 d-block">The Vision</span>
              <h2 className="display-4 display-md-3 fw-300 mb-4 tracking-tight leading-tight text-white">
                Breaking the boundaries <br className="d-none d-md-block" /> of physics and property.
              </h2>
              <p className="opacity-50 mt-4 lh-lg" style={{ fontSize: '1.2rem' }}>
                Virpanix isn't just software. It's an intelligent layer for the physical world. We bridge the gap between static assets and dynamic digital efficiency, enabling institutional real estate owners to operate at 10x scale.
              </p>
              <div className="row g-4 mt-5">
                <div className="col-12 col-md-6">
                  <h5 className="fw-300 mb-2 text-white">01. Spatial Computing</h5>
                  <p className="small opacity-40 text-white">Converting physical architecture into data-driven digital assets.</p>
                </div>
                <div className="col-12 col-md-6">
                  <h5 className="fw-300 mb-2 text-white">02. Autonomous Ops</h5>
                  <p className="small opacity-40 text-white">Self-optimizing management layers for complex property portfolios.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6 reveal" style={{ transitionDelay: '200ms' }}>
              <div className="p-2 border border-secondary/20 rounded-5 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000"
                  alt="Future Office"
                  className="img-fluid rounded-4 grayscale"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities / Features Grid */}
      <section id="features" className="py-10 py-md-15 bg-black border-top border-secondary/10">
        <div className="container text-center mb-10 reveal">
          <span className="text-uppercase tracking-widest x-small fw-600 text-white opacity-40 mb-3 d-block">Capabilities</span>
          <h2 className="display-4 fw-300 tracking-tight text-white">Built for Global Scale.</h2>
        </div>
        <div className="container">
          <div className="row g-0 border border-secondary/20 rounded-5 overflow-hidden">
            {[
              { icon: 'bi-box', title: '3D Spatial Twins', desc: 'Photorealistic digital replicas of your properties for remote management.' },
              { icon: 'bi-robot', title: 'Cognitive Assistant', desc: 'AI that understands asset requirements and handles complex tenant interactions.' },
              { icon: 'bi-graph-up', title: 'Portfolio Analytics', desc: 'Macro and micro data analysis to drive institutional-grade decision making.' },
              { icon: 'bi-window-stack', title: 'Enterprise Gateways', desc: 'White-labeled portals for institutional investors and global corporate clients.' }
            ].map((f, i) => (
              <div key={i} className="col-md-6 col-lg-3 p-5 reveal border-end border-secondary/10 hvr-darken" style={{ transitionDelay: `${i * 100}ms` }}>
                <i className={`bi ${f.icon} fs-2 mb-4 d-block opacity-50`}></i>
                <h4 className="fw-300 mb-3">{f.title}</h4>
                <p className="opacity-40 small mb-0">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-15 bg-black">
        <div className="container">
          <div className="text-center mb-10 reveal">
            <h2 className="display-3 fw-300 tracking-tight">The Intelligent Workflow.</h2>
            <p className="opacity-40">From traditional to autonomous in four phases.</p>
          </div>
          <div className="row g-1 justify-content-center">
            {[
              { num: '01', title: 'Sync', desc: 'Integrate multi-location data into our centralized neural hub.' },
              { num: '02', title: 'Model', desc: 'Generate high-fidelity spatial twins and operational protocols.' },
              { num: '03', title: 'Activate', desc: 'Deploy autonomous booking engines and investor portals.' },
              { num: '04', title: 'Optimize', desc: 'Continuous machine learning of market trends to maximize yields.' }
            ].map((s, i) => (
              <div key={i} className="col-md-6 col-lg-3 reveal mb-4 mb-lg-0" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="p-4 border-start border-secondary/20 h-100">
                  <span className="display-6 fw-100 opacity-20 d-block mb-3 text-white">{s.num}</span>
                  <h4 className="fw-300 mb-3 fs-3 text-white">{s.title}</h4>
                  <p className="opacity-40 small mb-0 text-white">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Solutions Section */}
      <section className="py-15 bg-black border-top border-secondary/10">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-5 reveal">
              <div className="position-relative">
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-white opacity-5 blur-3xl"></div>
                <div className="card bg-black border border-secondary/20 p-4 p-md-5 rounded-5 position-relative z-1 mb-4 hvr-shift">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="bg-white text-black rounded-circle px-2 py-1 small fw-600">01</div>
                    <h4 className="fw-300 mb-0 text-white">For Portfolio Owners</h4>
                  </div>
                  <p className="opacity-40 mb-0 fw-400 text-white">Maximize portfolio yield with automated operational workflows and spatial monetization data.</p>
                </div>
                <div className="card bg-black border border-secondary/20 p-4 p-md-5 rounded-5 position-relative z-1 hvr-shift ms-0 ms-md-5">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="bg-white text-black rounded-circle px-2 py-1 small fw-600">02</div>
                    <h4 className="fw-300 mb-0 text-white">For Asset Managers</h4>
                  </div>
                  <p className="opacity-40 mb-0 fw-400 text-white">Transform commercial floorplates into dynamic, high-velocity assets with autonomous booking engines.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-7 ps-lg-5 reveal" style={{ transitionDelay: '200ms' }}>
              <span className="text-uppercase tracking-widest x-small fw-600 text-white opacity-40 mb-4 d-block">Solutions</span>
              <h2 className="display-4 fw-300 mb-4 tracking-tight text-white">Success for every <br className="d-none d-md-block" /> business model.</h2>
              <p className="opacity-40 mb-5 lh-lg text-white" style={{ fontSize: '1.1rem' }}>
                Whether you're managing a single grade-A tower or a global institutional portfolio, Virpanix scales with you. We eliminate capital friction and administrative overhead, allowing you to focus on the strategic optimization of your assets.
              </p>
              <div className="row g-4">
                <div className="col-md-6 d-flex gap-3">
                  <i className="bi bi-cpu fs-4 opacity-50"></i>
                  <div>
                    <h6 className="fw-500 mb-1">Unified API</h6>
                    <p className="x-small opacity-40">Seamlessly integrate with your existing infrastructure.</p>
                  </div>
                </div>
                <div className="col-md-6 d-flex gap-3">
                  <i className="bi bi-shield-check fs-4 opacity-50"></i>
                  <div>
                    <h6 className="fw-500 mb-1">Secure Core</h6>
                    <p className="x-small opacity-40">Enterprise-grade encryption for all asset data.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Impact / Benefits */}
      <section className="py-15 bg-black">
        <div className="container">
          <div className="row justify-content-center text-center mb-10 reveal">
            <div className="col-lg-8">
              <h2 className="display-3 fw-300 tracking-tight">Quantifiable Impact.</h2>
            </div>
          </div>
          <div className="row g-5 align-items-center">
            <div className="col-lg-6 reveal">
              <div className="card bg-charcoal text-white p-5 rounded-5 border-0 shadow-pro position-relative overflow-hidden">
                <div className="mb-5 d-flex justify-content-between align-items-center">
                  <h5 className="fw-400 m-0 tracking-tight lg-large">Performance Report</h5>
                  <span className="x-small bg-white/10 text-white rounded-pill px-3 py-1 fw-500 tracking-widest">REAL-TIME</span>
                </div>
                <div className="d-flex flex-column gap-5">
                  <div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small opacity-50">Booking Efficiency</span>
                      <span className="fw-300 fs-5">+310%</span>
                    </div>
                    <div className="progress bg-white/5" style={{ height: '3px' }}>
                      <div className="progress-bar bg-white" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small opacity-50">Lead Capture Rate</span>
                      <span className="fw-300 fs-5">+85%</span>
                    </div>
                    <div className="progress bg-white/5" style={{ height: '3px' }}>
                      <div className="progress-bar bg-white" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small opacity-50">Operating Costs</span>
                      <span className="fw-300 fs-5">-62%</span>
                    </div>
                    <div className="progress bg-white/5" style={{ height: '3px' }}>
                      <div className="progress-bar bg-white" style={{ width: '38%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 reveal ps-lg-5" style={{ transitionDelay: '200ms' }}>
              <span className="text-uppercase tracking-widest x-small fw-600 text-white opacity-40 mb-4 d-block">The Advantage</span>
              <h3 className="display-5 fw-300 mb-4 tracking-tight text-white">Better Ops. <br className="d-none d-md-block" /> More Growth.</h3>
              <p className="opacity-40 mb-5 text-white">Our intelligence engine doesn't just manage; it optimizes. Every data point is used to drive your business forward.</p>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                {['99.9% Platform Uptime', 'Unified Billing Core', 'GDPR & SOC2 Ready', 'Global API Access'].map((t, i) => (
                  <li key={i} className="d-flex align-items-center gap-3 fw-500 small opacity-60">
                    <i className="bi bi-circle-fill" style={{ fontSize: '4px' }}></i> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Results Counters */}
      <section id="results" className="py-15 bg-black border-top border-secondary/10">
        <div className="container">
          <div className="row text-center g-5">
            {[
              { label: 'Properties Managed', value: '4,200+' },
              { label: 'Bookings Processed', value: '$120M+' },
              { label: 'Retention Rate', value: '98.4%' },
              { label: 'Average ROI Inc', value: '2.4x' }
            ].map((s, i) => (
              <div key={i} className="col-md-3 reveal mb-5 mb-md-0" style={{ transitionDelay: `${i * 100}ms` }}>
                <h2 className="display-5 fw-200 mb-1 text-white">{s.value}</h2>
                <p className="x-small opacity-30 text-uppercase tracking-widest fw-600 mb-0 text-white">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-15 py-md-20 bg-black text-center reveal">
        <div className="container">
          <h2 className="display-3 display-md-2 fw-300 mb-5 tracking-tighter text-white">Ready to automate <br /> your estate?</h2>
          <div className="d-flex gap-4 justify-content-center pt-2">
            <Link href="/register" className="btn btn-white btn-lg rounded-pill px-5 py-3 fw-600 bg-white text-black hvr-shift">Try it Free</Link>
            <button className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-400 border-opacity-25 hvr-shift">Book Demo</button>
          </div>
        </div>
      </section>

      {/* Gallery Section - Glassy Swiper */}
      <section className="py-15 py-md-20 bg-black overflow-hidden border-top border-secondary/10">
        <div className="container text-center mb-10 reveal">
          <span className="text-uppercase tracking-widest x-small fw-600 text-white opacity-40 mb-3 d-block">Experience</span>
          <h2 className="display-4 fw-300 tracking-tight text-white">Curated Spaces.</h2>
        </div>
        <div className="container-fluid px-md-5 reveal">
          <div className="swiper glassy-swiper p-5">
            <div className="swiper-wrapper">
              {[
                { img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000', title: 'Institutional Assets', location: 'Commercial Core' },
                { img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000', title: 'Smart Headquarters', location: 'Corporate Campus' },
                { img: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000', title: 'Industrial Logistics', location: 'Distribution Hub' },
                { img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000', title: 'Retail Ecosystems', location: 'Mixed Use' },
                { img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1000', title: 'Tech Innovation Labs', location: 'R&D Center' }
              ].map((slide, i) => (
                <div key={i} className="swiper-slide">
                  <div className="glass-card rounded-5 overflow-hidden position-relative hvr-float shadow-pro">
                    <img src={slide.img} alt={slide.title} className="w-100 h-100 object-fit-cover grayscale transition-all" style={{ height: '400px' }} />
                    <div className="glass-overlay position-absolute bottom-0 w-100 p-4 backdrop-blur-md bg-black/40 border-top border-secondary/20">
                      <h4 className="fw-300 mb-0">{slide.title}</h4>
                      <p className="x-small opacity-50 mb-0 tracking-widest text-uppercase">{slide.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Swiper Controls */}
            <div className="swiper-pagination mt-5"></div>
            <div className="swiper-button-next text-white opacity-20"></div>
            <div className="swiper-button-prev text-white opacity-20"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-black text-white border-top border-secondary/10">
        <div className="container">
          <div className="row g-4 mb-5">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="logo-box bg-white text-black fw-600 px-2 py-0 rounded-1" style={{ fontSize: '1rem' }}>V</div>
                <span className="fw-500 text-uppercase tracking-tighter" style={{ fontSize: '1.1rem' }}>Virpanix</span>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="row g-4">
                <div className="col-md-4">
                  <h6 className="x-small text-uppercase tracking-widest fw-600 mb-4 opacity-30">Platform</h6>
                  <div className="d-flex flex-column gap-3 small fw-400 opacity-50">
                    <a href="#" className="text-white text-decoration-none hvr-opacity">For Owners</a>
                    <a href="#" className="text-white text-decoration-none hvr-opacity">For Teams</a>
                    <a href="#" className="text-white text-decoration-none hvr-opacity">3D Space</a>
                  </div>
                </div>
                <div className="col-md-4">
                  <h6 className="x-small text-uppercase tracking-widest fw-600 mb-4 opacity-30">Company</h6>
                  <div className="d-flex flex-column gap-3 small fw-400 opacity-50">
                    <a href="#" className="text-white text-decoration-none hvr-opacity">About</a>
                    <a href="#" className="text-white text-decoration-none hvr-opacity">Security</a>
                    <a href="#" className="text-white text-decoration-none hvr-opacity">Privacy</a>
                  </div>
                </div>
                <div className="col-md-4">
                  <h6 className="x-small text-uppercase tracking-widest fw-600 mb-4 opacity-30">Connect</h6>
                  <div className="d-flex flex-column gap-3 small fw-400 opacity-50">
                    <a href="#" className="text-white text-decoration-none hvr-opacity">Twitter</a>
                    <a href="#" className="text-white text-decoration-none hvr-opacity">LinkedIn</a>
                    <a href="#" className="text-white text-decoration-none hvr-opacity">Contact</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-5 border-top border-secondary/10 d-flex flex-column flex-md-row justify-content-between align-items-center x-small opacity-30 fw-500 tracking-tight">
            <span>&copy; 2026 Virpanix Platform. All Rights Reserved.</span>
            <div className="d-flex gap-4 mt-3 mt-md-0">
              <span>Designed for Excellence</span>
              <span>System Status: Optimal</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
                .hero-title { font-size: clamp(3rem, 10vw, 6rem); line-height: 1.05; }
                .hero-subtitle { font-size: 1.2rem; }
                .tracking-tighter { letter-spacing: -0.05em; }
                .tracking-tight { letter-spacing: -0.02em; }
                .tracking-widest { letter-spacing: 0.15em; }
                .fw-100 { font-weight: 100; }
                .fw-200 { font-weight: 200; }
                .fw-300 { font-weight: 300; }
                .fw-400 { font-weight: 400; }
                .fw-500 { font-weight: 500; }
                .fw-600 { font-weight: 600; }
                .x-small { font-size: 0.7rem; }
                .py-10 { padding-top: 5rem; padding-bottom: 5rem; }
                .py-15 { padding-top: 10rem; padding-bottom: 10rem; }
                .py-20 { padding-top: 15rem; padding-bottom: 15rem; }
                .mb-10 { margin-bottom: 8rem; }
                .p-10 { padding: 6rem; }
                .transition-all { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
                .bg-black { background-color: #000; }
                .bg-charcoal { background-color: #0c0c0c; }
                .shadow-pro { box-shadow: 0 40px 100px -20px rgba(0,0,0,0.5); }
                .text-stroke { -webkit-text-stroke: 1px rgba(255,255,255,0.3); color: transparent; }
                
                .hvr-opacity:hover { opacity: 1 !important; }
                .hvr-shift:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(255,255,255,0.05); }
                .hvr-darken:hover { background-color: rgba(255,255,255,0.02); }
                
                /* Selection link style */
                .text-primary-link { color: #0066cc; }
                
                /* Scroll Reveal Animation */
                .reveal {
                    opacity: 0;
                    transform: translateY(40px);
                    transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .reveal-visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .bg-grid {
                    background-image: 
                        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
                    background-size: 60px 60px;
                }
                
                .image-wrapper {
                    transform: scale(0.95);
                    transition: transform 1.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .reveal-visible .image-wrapper {
                    transform: scale(1);
                }
                
                .grayscale { filter: grayscale(100%); transition: all 0.5s ease; }
                .grayscale:hover { filter: grayscale(0%); }
                .grayscale-hover:hover { filter: grayscale(0%); }
                .blur-3xl { filter: blur(100px); }

                /* Product Showcase Styles */
                .product-showcase { height: 400vh; position: relative; }
                .showcase-container { position: relative; height: 100%; width: 100%; }
                .sticky-wrapper { position: sticky; top: 0; height: 100vh; width: 100%; overflow: hidden; }
                .showcase-item { transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }

                /* Glassy Swiper Styles */
                .glassy-swiper { overflow: visible !important; }
                .glass-card { 
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glass-card:hover .grayscale { filter: grayscale(0%); transform: scale(1.05); }
                .backdrop-blur-md { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
                
                .swiper-pagination-bullet { background: rgba(255, 255, 255, 0.2) !important; }
                .swiper-pagination-bullet-active { background: #fff !important; }
                .swiper-button-next:after, .swiper-button-prev:after { font-size: 1.2rem !important; font-weight: bold; }
                
                .hvr-float { transition: transform 0.5s ease; }
                .hvr-float:hover { transform: translateY(-10px); }

                @media (max-width: 991px) {
                    .py-10 { padding-top: 3rem; padding-bottom: 3rem; }
                    .py-15 { padding-top: 4rem; padding-bottom: 4rem; }
                    .py-20 { padding-top: 5rem; padding-bottom: 5rem; }
                    .mb-10 { margin-bottom: 3rem; }
                    .p-10 { padding: 1.5rem; }
                    .hero-title { font-size: 2.8rem; }
                    .hero-subtitle { font-size: 1rem; }
                    .display-3 { font-size: 2.5rem !important; }
                    .display-4 { font-size: 2.2rem !important; }
                }
            `}</style>
    </div>
  );
}
