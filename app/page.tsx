'use client';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import AOS from 'aos';

/**
 * Virpanix - Intelligent Real Estate OS
 * Integrated: Social, WhatsApp, Voice Hub (Siri Style)
 */
export default function Home() {
  const { user, isAuthenticated, getRedirectPath } = useAuthContext();
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  // --- Voice Protocol Hub ---
  const [isListening, setIsListening] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState('How can I help you?');
  const [speechIntensity, setSpeechIntensity] = useState([1, 1, 1, 1, 1]);

  const runVoiceCommand = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Please use Chrome or Edge.");
      return;
    }

    // Set state first to show modal immediately
    setIsListening(true);

    // Safety check for Secure Context (Required for Mic)
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setCommandFeedback('INSECURE ORIGIN (HTTPS REQUIRED)');
      return;
    }

    setCommandFeedback('Initializing Neural Hub...');

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      // Start simulated bars
      const interval = setInterval(() => {
        setSpeechIntensity(Array.from({ length: 5 }, () => Math.floor(Math.random() * 40) + 10));
      }, 100);

      recognition.onstart = () => {
        setCommandFeedback('Listening...');
      };

      recognition.onresult = (event: any) => {
        clearInterval(interval);
        setSpeechIntensity([5, 5, 5, 5, 5]);
        const command = event.results[0][0].transcript.toLowerCase();
        setCommandFeedback(`Command: ${command}`);

        // Command Matching Protocol
        if (command.includes('login') || command.includes('sign in')) {
          router.push('/login');
        } else if (command.includes('register') || command.includes('join')) {
          router.push('/register');
        } else if (command.includes('contact') || command.includes('support')) {
          router.push('/contact');
        } else if (command.includes('about')) {
          router.push('/about');
        } else if (command.includes('plan')) {
          router.push('/plans');
        } else {
          setCommandFeedback('Protocol unrecognized.');
          setTimeout(() => {
            setIsListening(false);
            setCommandFeedback('How can I help you?');
          }, 2000);
          return;
        }
        setTimeout(() => {
          setIsListening(false);
          setCommandFeedback('How can I help you?');
        }, 1500);
      };

      recognition.onerror = (event: any) => {
        clearInterval(interval);
        setSpeechIntensity([1, 1, 1, 1, 1]);
        console.error('Speech recognition error:', event.error);

        if (event.error === 'not-allowed') {
          setCommandFeedback('PERMISSION BLOCKED');
          // Keep modal open so user can see instructions
          return;
        } else {
          setCommandFeedback('Connection interrupted.');
          setTimeout(() => setIsListening(false), 2000);
        }
      };

      recognition.onend = () => {
        clearInterval(interval);
      };

      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setIsListening(false);
      alert("Could not start voice protocol.");
    }
  };

  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: false,
      mirror: true,
      anchorPlacement: 'top-bottom',
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const MODULES = [
    {
      id: 'analytics',
      title: 'Analytics & Intelligence',
      impact: '35% REDUCTION IN CAC',
      description: 'Advanced data-driven insights to monitor and grow your real estate business. Identify high-value lead sources and eliminate deal leakage with AI-driven risk mitigation. Turn raw data into a predictive revenue engine.',
      features: ['Deal Intelligence', 'Prevention & Forecasting', 'Property PropIntel'],
      img: '/images/feature_analytics.png',
      color: 'primary'
    },
    {
      id: 'crm',
      title: 'Leads & CRM Hub',
      impact: '45% SURGE IN AGENT PRODUCTIVITY',
      description: 'Centralized management for your entire sales pipeline. Capture leads from websites and widgets, track status via Kanban, and ensure 100% lead follow-up compliance with automated scoring.',
      features: ['Lead Scoring', 'Audience Grouping', 'Kanban Management'],
      img: '/images/feature_crm.png',
      color: 'success'
    },
    {
      id: 'social-whatsapp',
      title: 'Social Hub & WhatsApp Business',
      impact: '300% HIGHER CONVERSION VELOCITY',
      description: 'The ultimate omnichannel communication layer. Automate property distribution across Facebook & Instagram while managing direct customer engagement via integrated WhatsApp Business API.',
      features: ['WhatsApp Automation', 'Omnichannel Ads Sync', 'Conversational AI Chatbots'],
      img: '/images/feature_social_whatsapp.png',
      color: 'primary'
    },
    {
      id: 'marketing',
      title: 'Marketing & Automation',
      impact: '3X CUSTOMER LIFETIME VALUE',
      description: 'Powerful tools for email campaigns, automation, and audience growth. Deliver the right property at the perfect moment through behavioral-triggered nurture sequences.',
      features: ['Campaign Designer', 'Automation Workflows', 'Smart Lead Forms'],
      img: '/images/feature_marketing.png',
      color: 'danger'
    },
    {
      id: 'inventory',
      title: 'Property Portfolio',
      impact: 'OPTIMIZED PORTFOLIO VELOCITY',
      description: 'Comprehensive management of buildings, units, and digital assets. Prevent double-bookings and manage dynamic pricing rules with ironclad buyer trust through transparency.',
      features: ['Consolidated Management', 'Media Gallery Hub', 'Batch Operations'],
      img: '/images/feature_inventory.png',
      color: 'info'
    },
    {
      id: 'plot-maps',
      title: 'Interactive Plot Maps',
      impact: '70% BUYER ENGAGEMENT SURGE',
      description: 'Immersive SVG-based site plans with real-time status sync. Provide instant clarity on availability and premium locations directly from your portal.',
      features: ['SVG Interactivity', 'Live Status Sync', 'Instant Unit Detail'],
      img: '/images/feature_plot.png',
      color: 'success'
    },
    {
      id: 'matching',
      title: 'Matching Engine',
      impact: '60% FASTER SALES CYCLE',
      description: 'Convert "just looking" into "ready to buy" by instantly aligning inventory with deep buyer intent. Automated matching based on location, budget, and amenities.',
      features: ['Intent Matching', 'Aesthetic Alignment', 'Note System'],
      img: '/images/feature_matching.png',
      color: 'danger'
    },
    {
      id: 'brochure-ai',
      title: 'Brochure Intelligent AI',
      impact: '95% PRODUCTION OVERHEAD REDUCTION',
      description: 'Generate elite, print-ready property brochures in seconds using Gemini Nano AI. Convert technical specs into persuasive sales copy automatically.',
      features: ['AI Copywriting', 'Smart Media Sync', 'Interactive PDF Export'],
      img: '/images/feature_brochure.png',
      color: 'dark'
    },
    {
      id: 'seo',
      title: 'Search SEO Engine',
      impact: '60% AD SPEND REDUCTION',
      description: 'Dominate organic search results with automated indexing and XML sitemap management. Your inventory appears in Google results within minutes.',
      features: ['Indexing Pings', 'Schema.org Markup', 'Core Web Vitals'],
      img: '/images/feature_seo.png',
      color: 'warning'
    },
    {
      id: 'websites',
      title: 'Websites & Ecosystem',
      impact: '50% INBOUND QUALITY BOOST',
      description: 'Launch branded real estate portals and property microsites instantly. lower reliance on third-party portals and own your audience directly.',
      features: ['Instant Layouts', 'Domain Mapping', 'Universal Script Widgets'],
      img: '/images/feature_website.png',
      color: 'info'
    }
  ];

  return (
    <div className="landing-page bg-black text-white min-vh-100">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800&display=swap" />

      {/* Navigation */}
      <nav className={`fixed-top w-100 transition-all ${scrolled ? 'bg-black/80 backdrop-blur-lg border-bottom border-red opacity-100 shadow-lg' : 'bg-transparent'}`} style={{ zIndex: 1000, height: '80px' }}>
        <div className="container h-100 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3" data-aos="fade-right">
            <Link href="/" className="logo-box bg-red text-white fw-800 px-2 py-1 rounded-1 text-decoration-none" style={{ fontSize: '1.2rem' }}>V</Link>
            <span className="fw-800 text-uppercase tracking-widest d-none d-sm-inline" style={{ fontSize: '1.4rem' }}>Virpanix</span>
          </div>

          <div className="d-flex align-items-center gap-4 small tracking-tight fw-600" data-aos="fade-left">
            <Link href="/about" className="text-white opacity-50 text-decoration-none hvr-red d-none d-lg-inline">About Us</Link>
            <Link href="/plans" className="text-white opacity-50 text-decoration-none hvr-red d-none d-lg-inline">Plans</Link>
            <Link href="/contact" className="text-white opacity-50 text-decoration-none hvr-red d-none d-lg-inline">Contact</Link>
            {isAuthenticated ? (
              <Link href={getRedirectPath()} className="btn-red py-2 px-4 shadow-sm">Dashboard</Link>
            ) : (
              <div className="d-flex align-items-center gap-3">
                <Link href="/login" className="text-white opacity-50 text-decoration-none hvr-red small fw-700">Login</Link>
                <Link href="/register" className="btn-red py-2 px-4 fw-800">START FREE</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero vh-100 d-flex align-items-center justify-content-center text-center position-relative overflow-hidden bg-grid-hero">
        <div className="hero-bg-image position-absolute top-0 start-0 w-100 h-100 opacity-30" style={{ backgroundImage: 'url("/images/hero_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        <div className="scanline"></div>
        <div className="hero-glow-center"></div>

        <div className="container position-relative z-5">
          <div className="row justify-content-center">
            <div className="col-lg-10" data-aos="zoom-out-up">
              <div className="d-inline-flex align-items-center gap-3 mb-4 px-4 py-2 glass-card rounded-pill border border-red/20 shadow-red-pulse">
                <span className="bg-red text-white py-1 px-3 fw-800 extra-small rounded-pill uppercase tracking-widest">v3.2.0</span>
                <span className="text-white opacity-60 extra-small uppercase tracking-widest fw-700">Real Estate Intelligence Protocol</span>
              </div>
              <h1 className="display-1 fw-900 tracking-tighter text-white mb-4 lh-1">
                TRANSFORM YOUR <br />
                <span className="text-red">REAL ESTATE</span> <br />
                BUSINESS.
              </h1>
              <p className="lead opacity-60 mb-5 mx-auto max-w-800 fs-4 fw-400" data-aos="fade-up" data-aos-delay="400">
                Institutional-grade AI for global property portfolios. <br />
                Synchronize social reach, WhatsApp direct sales, and predictive analytics in one OS.
              </p>
              <div className="d-flex justify-content-center gap-4 flex-wrap" data-aos="fade-up" data-aos-delay="600">
                <Link href="/register" className="btn-red btn-lg px-5 py-3">Initialize System</Link>
                <Link href="/plans" className="btn-outline-red btn-lg px-5 py-3">View Global Plans</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Module Sections Showcase */}
      <section id="modules" className="bg-black pt-10">
        <div className="container text-center mb-10" data-aos="fade-up">
          <h2 className="display-3 fw-800 text-white">THE <span className="text-red">OPERATING</span> SUITE</h2>
          <p className="opacity-40 fs-5">Advanced technical modules designed for the modern property enterprise.</p>
        </div>

        {MODULES.map((m, i) => (
          <div key={m.id} className={`section-padding border-top border-white/5 ${i % 2 === 0 ? 'bg-black' : 'bg-red/5'}`}>
            <div className="container">
              <div className={`row align-items-center g-5 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <div className="col-lg-6" data-aos={i % 2 === 0 ? 'fade-right' : 'fade-left'}>
                  <div className="module-content">
                    <span className="text-red fw-800 uppercase tracking-widest small mb-3 d-block">{m.impact}</span>
                    <h2 className="display-4 fw-800 text-white mb-4">{m.title}</h2>
                    <p className="opacity-60 fs-5 mb-5 lh-base">{m.description}</p>

                    <div className="features-list d-flex flex-column gap-3 mb-5">
                      {m.features.map((f, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-3">
                          <div className={`bg-${m.color} text-white rounded-circle p-1 d-flex align-items-center justify-content-center`} style={{ width: '24px', height: '24px' }}>
                            <i className="bi bi-check2 fw-bold" style={{ fontSize: '12px' }}></i>
                          </div>
                          <span className="fw-700 text-white opacity-80">{f}</span>
                        </div>
                      ))}
                    </div>

                    <Link href="/register" className={`btn btn-link text-${m.color} p-0 fw-800 text-decoration-none hvr-translate-right`}>
                      Integrate {m.title} <i className="bi bi-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
                <div className="col-lg-6" data-aos={i % 2 === 0 ? 'fade-left' : 'fade-right'}>
                  <div className={`p-2 glass-card rounded-5 overflow-hidden shadow-${m.color}-lg`}>
                    <img src={m.img} className="w-100 rounded-4 grayscale hover-color" alt={m.title} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ROI Impact Summary */}
      <section id="roi-metrics" className="section-padding bg-black border-top border-white/5">
        <div className="container text-center mb-10" data-aos="fade-up">
          <h2 className="display-3 fw-800 text-white">THE <span className="text-red">ROI</span> ADVANTAGE</h2>
          <p className="opacity-40 fs-5">Tangible growth metrics from real-world enterprise deployments.</p>
        </div>
        <div className="container">
          <div className="row g-4">
            {[
              { val: '300%', label: 'WhatsApp Velocity', note: 'Direct Buyer Engagement' },
              { val: '95%', label: 'Marketing Savings', note: 'AI Brochure Generation' },
              { val: '70%', label: 'Engagement Increase', note: 'Interactive Mapping' },
              { val: '60%', label: 'Ad Spend Efficiency', note: 'Automated SEO & Social' }
            ].map((stat, i) => (
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

      {/* Voice Protocol Modal (Siri Style) */}
      {isListening && (
        <div className="voice-modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="voice-modal-content glass-card p-5 text-center border border-red/20 shadow-red-lg animate-zoom-in" style={{ width: '500px' }}>
            <div className="siri-container mb-5 d-flex justify-content-center align-items-center gap-1">
              {speechIntensity.map((h, i) => (
                <div key={i} className="siri-bar" style={{ height: `${h}px` }}></div>
              ))}
            </div>
            <h3 className="fw-900 text-white mb-3 uppercase tracking-tighter fs-2">{commandFeedback}</h3>
            {commandFeedback === 'PERMISSION BLOCKED' ? (
              <div className="bg-red/10 p-4 rounded-4 mb-4 border border-red/20 shadow-sm animate-fade-in">
                <p className="text-red fw-700 small mb-2">CRITICAL: Browser blocked microphone access.</p>
                <ul className="text-start extra-small opacity-80 list-unstyled d-flex flex-column gap-2 mb-0">
                  <li>1. Click the <b>Lock Icon</b> or <b>Settings</b> in the URL bar.</li>
                  <li>2. Switch <b>Microphone</b> toggle to <b>&quot;Allow&quot;</b>.</li>
                  <li>3. <b>Refresh</b> the page (F5) and try again.</li>
                  <li>4. Ensure your microphone isn't being used by another app (Meet / Zoom).</li>
                </ul>
              </div>
            ) : commandFeedback === 'INSECURE ORIGIN (HTTPS REQUIRED)' ? (
              <div className="bg-red/10 p-4 rounded-4 mb-4 border border-red/20">
                <p className="text-red fw-700 small mb-2">SECURITY PROTOCOL VIOLATION</p>
                <p className="extra-small opacity-80 text-start m-0">The Speech API requires a <b>Secure Context</b>. You must either use <b>http://localhost:3000</b> (literal) or access via an <b>https://</b> URL for the neural layer to engage.</p>
              </div>
            ) : (
              <p className="opacity-40 small mb-4">Neural Voice Layer Active. Try saying &quot;Open login page&quot;.</p>
            )}
            <button onClick={() => setIsListening(false)} className="btn btn-outline-danger btn-sm rounded-pill px-4 tracking-widest fw-800">DISCONNECT HUB</button>
          </div>
        </div>
      )}

      {/* Voice Orb Button */}
      <div className="fixed-bottom p-4 d-flex flex-column align-items-end" style={{ zIndex: 1100 }}>
        <button
          onClick={runVoiceCommand}
          className={`btn ${isListening ? 'btn-red shadow-red-pulse' : 'btn-dark'} rounded-circle p-0 d-flex align-items-center justify-content-center shadow-red-lg hvr-red-pulse`}
          style={{ width: '64px', height: '64px' }}
        >
          <i className={`bi ${isListening ? 'bi-soundwave' : 'bi-mic-fill'} fs-3 text-white`}></i>
        </button>
      </div>

      {/* Footer */}
      <footer className="py-5 bg-black border-top border-white/5">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-md-4" data-aos="fade-right">
              <div className="d-flex align-items-center gap-3">
                <div className="logo-box bg-red text-white fw-800 px-2 py-1 rounded-1">V</div>
                <span className="fw-900 text-uppercase tracking-widest">Virpanix</span>
              </div>
              <p className="opacity-30 small mt-3">Advanced Intelligence Layer for Global Real Estate Portfolios. Built for institutional precision.</p>
            </div>
            <div className="col-md-8">
              <div className="row g-4">
                <div className="col-6 col-lg-3">
                  <h6 className="fw-800 text-white small uppercase tracking-widest mb-3">Platform</h6>
                  <ul className="list-unstyled extra-small opacity-40 d-flex flex-column gap-2">
                    <li><Link href="/about" className="text-white text-decoration-none hvr-red">About Protocol</Link></li>
                    <li><Link href="/plans" className="text-white text-decoration-none hvr-red">Enterprise Plans</Link></li>
                    <li><Link href="/contact" className="text-white text-decoration-none hvr-red">Contact Support</Link></li>
                  </ul>
                </div>
                <div className="col-6 col-lg-3">
                  <h6 className="fw-800 text-white small uppercase tracking-widest mb-3">Legal Layer</h6>
                  <ul className="list-unstyled extra-small opacity-40 d-flex flex-column gap-2">
                    <li><Link href="/privacy" className="text-white text-decoration-none hvr-red">Privacy Protocol</Link></li>
                    <li><Link href="/terms" className="text-white text-decoration-none hvr-red">Terms of Service</Link></li>
                    <li><a href="#" className="text-white text-decoration-none hvr-red">Compliance</a></li>
                  </ul>
                </div>
                <div className="col-6 col-lg-3">
                  <h6 className="fw-800 text-white small uppercase tracking-widest mb-3">Resources</h6>
                  <ul className="list-unstyled extra-small opacity-40 d-flex flex-column gap-2">
                    <li><a href="#" className="text-white text-decoration-none hvr-red">Documentation Hub</a></li>
                    <li><a href="#" className="text-white text-decoration-none hvr-red">API Spec v3.2</a></li>
                    <li><a href="#" className="text-white text-decoration-none hvr-red">Network Status</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-5 border-top border-white/5 d-flex justify-content-between align-items-center">
            <p className="opacity-20 x-small m-0">&copy; 2026 Virpanix Platform. All Rights Reserved.</p>
            <div className="d-flex gap-3">
              <i className="bi bi-twitter text-white opacity-20"></i>
              <i className="bi bi-linkedin text-white opacity-20"></i>
              <i className="bi bi-github text-white opacity-20"></i>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .hvr-red { transition: all 0.3s ease; }
        .hvr-red:hover { color: var(--primary-red) !important; opacity: 1 !important; transform: translateY(-1px); }
        .hvr-translate-right { transition: all 0.3s ease; display: inline-block; }
        .hvr-translate-right:hover { transform: translateX(8px); }

        .fw-900 { font-weight: 900; }
        .max-w-800 { max-width: 800px; }
        .pt-10 { padding-top: 10rem; }
        .mb-10 { margin-bottom: 10rem; }
        
        .bg-grid-hero {
          background-image: 
            linear-gradient(rgba(230,0,38,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(230,0,38,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 2.5rem;
        }

        .hero-glow-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(230,0,38,0.08) 0%, transparent 70%);
          filter: blur(100px);
          pointer-events: none;
        }

        .shadow-red-pulse {
          box-shadow: 0 0 30px rgba(230,0,38,0.5);
          animation: pulse-red-border 2s infinite;
        }

        @keyframes pulse-red-border {
          0% { transform: scale(1); border-color: rgba(230,0,38,0.2); }
          50% { transform: scale(1.05); border-color: rgba(230,0,38,0.8); }
          100% { transform: scale(1); border-color: rgba(230,0,38,0.2); }
        }

        .grayscale { filter: grayscale(100%) brightness(0.7); transition: all 0.8s ease; }
        .hover-color:hover { filter: grayscale(0%) brightness(1); }

        .shadow-primary-lg { box-shadow: 0 30px 60px -15px rgba(13,110,253,0.3); }
        .shadow-success-lg { box-shadow: 0 30px 60px -15px rgba(25,135,84,0.3); }
        .shadow-danger-lg { box-shadow: 0 30px 60px -15px rgba(220,53,69,0.3); }
        .shadow-info-lg { box-shadow: 0 30px 60px -15px rgba(13,202,240,0.3); }
        .shadow-warning-lg { box-shadow: 0 30px 60px -15px rgba(255,193,7,0.3); }
        .shadow-dark-lg { box-shadow: 0 30px 60px -15px rgba(230,0,38,0.5); }

        .hover-bg-red-light:hover { background: rgba(230,0,38,0.05); }

        .siri-bar {
            width: 4px;
            background: #e60026;
            border-radius: 10px;
            transition: height 0.1s ease;
            box-shadow: 0 0 10px rgba(230,0,38,0.5);
        }

        .animate-zoom-in {
            animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes zoomIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        .hvr-red-pulse:hover {
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(230, 0, 38, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(230, 0, 38, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(230, 0, 38, 0); }
        }

        .scanline {
          width: 100%;
          height: 100px;
          z-index: 2;
          background: linear-gradient(0deg, rgba(230,0,38,0) 0%, rgba(230,0,38,0.04) 50%, rgba(230,0,38,0) 100%);
          position: absolute;
          bottom: 100%;
          animation: scanline 10s linear infinite;
          pointer-events: none;
        }

        @keyframes scanline {
          0% { bottom: 100%; }
          100% { bottom: -100px; }
        }

        @media (max-width: 991px) {
          .display-1 { font-size: 3rem; }
          .display-4 { font-size: 2rem; }
          .section-padding { padding: 60px 0; }
        }
      `}</style>
    </div>
  );
}
