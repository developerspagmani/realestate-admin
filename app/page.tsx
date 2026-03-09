'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AOS from 'aos';

// Components
import Navbar from '@/components/home/Navbar';
import Hero from '@/components/home/Hero';
import AboutSection from '@/components/home/AboutSection';
import Modules from '@/components/home/Modules';
import VoiceShowcase from '@/components/home/VoiceShowcase';
import StatsROI from '@/components/home/StatsROI';
import HomeFooter from '@/components/home/HomeFooter';
import VoiceModal from '@/components/home/VoiceModal';
import ChatbotWidget from '@/components/modules/realestate/widgets/ChatbotWidget';
import Platform from '@/components/home/Platform';
import SecureData from '@/components/home/SecureData';
import { seoData, SEOConfig } from '@/utils/seoData';

const MOCK_PROPERTIES = [
  { id: '1', title: 'Skyline Institutional Tower', city: 'Dubai', neighborhood: 'Marina', propertyTypeLabel: 'Office', listingType: 'Rent', units: [{ unitPricing: [{ price: 15000 }] }], createdAt: new Date().toISOString() },
  { id: '2', title: 'Oasis Luxury Villa', city: 'Dubai', neighborhood: 'Palm Jumeirah', propertyTypeLabel: 'Villa', listingType: 'Sale', units: [{ unitPricing: [{ price: 45000 }] }], createdAt: new Date().toISOString() },
  { id: '3', title: 'Urban Tech Hub', city: 'Bangalore', neighborhood: 'Whitefield', propertyTypeLabel: 'Apartment', listingType: 'Rent', units: [{ unitPricing: [{ price: 2500 }] }], createdAt: new Date().toISOString() }
];

export default function Home() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [showVirpa, setShowVirpa] = useState(false);

  // --- Voice Protocol Hub Logic ---
  const [isListening, setIsListening] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState('How can I help you?');
  const [speechIntensity, setSpeechIntensity] = useState([1, 1, 1, 1, 1]);

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

  const runVoiceCommand = async () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Please use Chrome or Edge.");
      return;
    }

    setIsListening(true);

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setCommandFeedback('INSECURE ORIGIN (HTTPS REQUIRED)');
      return;
    }

    setCommandFeedback('Initializing Neural Hub...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (e) {
      setCommandFeedback('PERMISSION BLOCKED');
      return;
    }

    try {
      const speak = (text: string) => {
        return new Promise((resolve) => {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 0.8;
          utterance.onend = () => resolve(true);
          window.speechSynthesis.speak(utterance);
        });
      };

      setCommandFeedback('Waking up...');
      await speak("Welcome to Virpanix. Protocol engaged. How can I help you?");

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

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
        setCommandFeedback(`Processing: ${command}`);

        // Command Matching: Dynamic + Fallbacks
        let matched = false;

        // 1. Dynamic check against all SEO pages
        for (const [key, data] of Object.entries(seoData) as [string, SEOConfig][]) {
          // Check if the spoken command includes the page's title or key
          // We use simple token matching for robustness
          const tokens = key.split('-');
          const titleTokens = data.title.toLowerCase().split(' ');

          if (
            tokens.some((t: string) => command.includes(t)) ||
            titleTokens.some((t: string) => t.length > 3 && command.includes(t))
          ) {
            router.push(`/pages/${key}`);
            matched = true;
            break;
          }
        }

        // 2. Static Fallbacks for core interactions
        if (!matched) {
          if (command.includes('home')) {
            router.push('/');
            matched = true;
          } else if (command.includes('login') || command.includes('sign in')) {
            router.push('/login');
            matched = true;
          } else if (command.includes('register') || command.includes('join')) {
            router.push('/register');
            matched = true;
          } else if (command.includes('dashboard')) {
            router.push('/realestate-owner-admin');
            matched = true;
          }
        }

        if (!matched) {
          setCommandFeedback('Protocol unrecognized.');
          setTimeout(() => setIsListening(false), 2000);
          return;
        }

        setTimeout(() => setIsListening(false), 1500);
      };

      recognition.onerror = (event: any) => {
        clearInterval(interval);
        setSpeechIntensity([1, 1, 1, 1, 1]);
        if (event.error === 'not-allowed') {
          setCommandFeedback('PERMISSION BLOCKED');
        } else {
          setCommandFeedback('Connection interrupted.');
          setTimeout(() => setIsListening(false), 2000);
        }
      };

      setTimeout(() => {
        recognition.start();
      }, 200);

    } catch (e) {
      setIsListening(false);
      alert("Could not start voice protocol.");
    }
  };

  return (
    <div className="landing-page bg-black text-white min-vh-100">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800&display=swap" />

      <Navbar scrolled={scrolled} onMicClick={runVoiceCommand} />

      <Hero />

      <Platform />

      <AboutSection />

      <SecureData />

      <Modules />

      <StatsROI />

      <VoiceShowcase />

      <HomeFooter />

      <VoiceModal
        isListening={isListening}
        setIsListening={setIsListening}
        commandFeedback={commandFeedback}
        speechIntensity={speechIntensity}
      />

      {/* Floating Voice Button */}
      {!isListening && (
        <div className="fixed-bottom p-4 d-flex flex-column align-items-center gap-3" style={{ zIndex: 1100 }}>

          {/* Virpa Testing Shortcut */}
          {!showVirpa && (
            <button
              onClick={() => setShowVirpa(true)}
              className="btn glass-card border-red/20 px-4 py-3 d-flex align-items-center gap-3 animate-bounce-subtle shadow-red-lg"
              style={{ borderRadius: '100px' }}
            >
              <div className="bg-red rounded-circle pulse" style={{ width: '10px', height: '10px' }}></div>
              <span className="small fw-900 text-white letter-spacing-1">PREVIEW VIRPA AI</span>
            </button>
          )}

          {/* Chatbot Instance */}
          {showVirpa && (
            <div className="shadow-red-lg rounded-4 overflow-hidden animate-zoom-in" style={{ width: '380px', height: '600px', marginBottom: '10px' }}>
              <ChatbotWidget
                theme={{ primaryColor: '#e60026' }}
                properties={MOCK_PROPERTIES}
                onFilterResults={() => { }}
                onClose={() => setShowVirpa(false)}
                onSelectProperty={() => { }}
                onCreateLead={async () => { }}
              />
            </div>
          )}

        </div>
      )}

      <style jsx global>{`
        :root {
          --primary-red: #e60026;
        }

        .text-red { color: var(--primary-red) !important; }
        .bg-red { background-color: var(--primary-red) !important; }
        .border-red { border-color: var(--primary-red) !important; }
        .btn-red { 
          background-color: var(--primary-red); 
          color: white; 
          border: none; 
          border-radius: 0.5rem;
          font-weight: 800;
          transition: all 0.3s ease;
        }
        .btn-red:hover { background-color: #c40020; transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(230,0,38,0.4); }
        .btn-outline-red {
          background-color: transparent;
          color: var(--primary-red);
          border: 1px solid var(--primary-red);
          border-radius: 0.5rem;
          font-weight: 800;
          transition: all 0.3s ease;
        }
        .btn-outline-red:hover { background-color: rgba(230,0,38,0.05); transform: translateY(-2px); }

        .shadow-red-lg { box-shadow: 0 20px 40px -10px rgba(230,0,38,0.3); }

        .tracking-widest { letter-spacing: 0.2em; }
        .tracking-tight { letter-spacing: -0.02em; }
        .tracking-tighter { letter-spacing: -0.05em; }

        .extra-small { font-size: 0.65rem; }
        .x-small { font-size: 0.75rem; }

        .hvr-red { transition: all 0.3s ease; }
        .hvr-red:hover { color: var(--primary-red) !important; opacity: 1 !important; transform: translateY(-1px); }
        .hvr-translate-right { transition: all 0.3s ease; display: inline-block; }
        .hvr-translate-right:hover { transform: translateX(8px); }

        .fw-800 { font-weight: 800; }
        .fw-900 { font-weight: 900; }
        .max-w-800 { max-width: 800px; }
        .pt-10 { padding-top: 10rem; }
        .mb-10 { margin-bottom: 10rem; }
        .section-padding { padding: 100px 0; }
        
        .bg-grid-hero {
          background-image: 
            linear-gradient(rgba(230,0,38,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(230,0,38,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .glass-card {
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
          box-shadow: 0 0 30px rgba(230,0,38,0.2);
          animation: pulse-red-border 4s infinite;
        }

        @keyframes pulse-red-border {
          0% { transform: scale(1); border-color: rgba(230,0,38,0.1); }
          50% { transform: scale(1.02); border-color: rgba(230,0,38,0.4); }
          100% { transform: scale(1); border-color: rgba(230,0,38,0.1); }
        }

        .grayscale { filter: grayscale(100%) brightness(0.6); transition: all 0.8s ease; }
        .hover-color:hover { filter: grayscale(0%) brightness(1); }

        .hover-bg-red-light:hover { background: rgba(230,0,38,0.05); }

        .siri-bar {
            width: 4px;
            background: #e60026;
            border-radius: 10px;
            transition: height 0.1s ease;
            box-shadow: 0 0 10px rgba(230,0,38,0.5);
        }

        .wave-bar {
            width: 4px;
            border-radius: 2px;
            animation: wave-animation 1s infinite alternate ease-in-out;
            box-shadow: 0 0 15px rgba(230, 0, 38, 0.4);
        }

        @keyframes wave-animation {
            from { transform: scaleY(1); opacity: 0.6; }
            to { transform: scaleY(1.8); opacity: 1; }
        }

        .max-w-500 { max-width: 500px; }
        .pulse-slow { animation: pulse-opacity 3s infinite; }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
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
          background: linear-gradient(0deg, rgba(230,0,38,0) 0%, rgba(230,0,38,0.02) 50%, rgba(230,0,38,0) 100%);
          position: absolute;
          bottom: 100%;
          animation: scanline 10s linear infinite;
          pointer-events: none;
        }

        @keyframes scanline {
          0% { bottom: 100%; }
          100% { bottom: -100px; }
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }

        @media (max-width: 991px) {
          .display-1 { font-size: 3rem; }
          .display-4 { font-size: 2.5rem; }
          .display-3 { font-size: 3rem; }
          .section-padding { padding: 60px 0; }
        }
      `}</style>
    </div>
  );
}
