'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import Loader from '@/components/common/Loader';
import Link from 'next/link';

function LoginContent() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, error: authError, getRedirectPath } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Voice Logic Hooks (Moved up to avoid conditional hook call) ---
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'session_expired') {
      setError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = getRedirectPath();
      router.push(redirectPath);
    }
  }, [isAuthenticated, router, getRedirectPath]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLocalLoading(true);

    try {
      const isEmail = formData.username.includes('@');
      const loginPayload = isEmail
        ? { email: formData.username, password: formData.password }
        : { phone: formData.username, password: formData.password };

      const success = await login(loginPayload);

      if (success) {
        const redirectPath = getRedirectPath();
        router.push(redirectPath);
      } else {
        setLocalLoading(false);
      }
    } catch (err) {
      setLocalLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) {
      setError('');
    }
  };

  // --- Voice Logic ---
  const runVoiceAuth = async () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice recognition not supported. Use Chrome or Edge.');
      return;
    }

    try {
      // PRE-FLIGHT CHECK: Request microphone permission synchronously on user click.
      // Doing this here ensures the browser prompt appears directly from the click event,
      // which bypasses strict browser policies that block async mic requests.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (e) {
      console.error('Microphone access denied:', e);
      setError('Microphone permission blocked. Please check your browser URL bar and allow microphone access.');
      return;
    }

    setIsVoiceActive(true);
    setError('');

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

    const listen = (statusText: string) => {
      return new Promise<string>((resolve, reject) => {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
          reject({ error: 'not-supported' });
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setVoiceStatus(statusText);

        recognition.onresult = (event: any) => {
          const result = event.results[0][0].transcript;
          console.log("Captured speech:", result);
          resolve(result);
        };

        recognition.onerror = (e: any) => {
          console.error("Speech Recognition Individual Error:", e.error);
          reject(e);
        };

        recognition.onend = () => {
          console.log("Speech recognition session ended.");
        };

        try {
          // Extra buffer to let hardware transition from output (synthesis) to input (recognition)
          setTimeout(() => {
            recognition.start();
          }, 400);
        } catch (e) {
          reject(e);
        }
      });
    };

    try {
      await speak("Welcome to Virpanix. State your username.");
      const rawUser = await listen("Listening for Username...");
      const username = rawUser.toLowerCase().replace(/\s/g, '');
      setFormData(prev => ({ ...prev, username }));

      // Short delay before next step
      await new Promise(r => setTimeout(r, 600));

      await speak(`Username set to ${username}. Now state your password.`);
      const rawPass = await listen("Listening for Password...");
      const password = rawPass.replace(/\s/g, '');
      setFormData(prev => ({ ...prev, password }));

      await speak("Authenticating credentials.");
      setLocalLoading(true);

      const loginPayload = username.includes('@')
        ? { email: username, password }
        : { phone: username, password };

      const success = await login(loginPayload);
      if (success) {
        router.push(getRedirectPath());
      } else {
        setIsVoiceActive(false);
        setLocalLoading(false);
      }
    } catch (err: any) {
      const errorCode = err?.error || 'unknown_failure';
      console.error("Voice Flow Failure Code:", errorCode);
      console.error("Voice Flow Full Error:", err);

      let friendlyError = 'Voice authentication interrupted. Please log in manually.';
      if (errorCode === 'no-speech') friendlyError = 'System did not hear any voice. Please try again.';
      if (errorCode === 'not-allowed') friendlyError = 'Microphone permission blocked. Please enable it in browser settings.';
      if (errorCode === 'network') friendlyError = 'Voice network error. Check your internet.';

      setError(friendlyError);
      setIsVoiceActive(false);
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden animate-fade-in">
          <div className="row g-0">
            {/* Brand/Accent Side */}
            <div className="col-lg-5 bg-dark text-white p-5 d-none d-lg-flex flex-column justify-content-center">
              <div className="mb-4">
                <i className="bi bi-grid-1x2-fill display-4 text-white opacity-25"></i>
              </div>
              <h2 className="fw-extrabold mb-3 text-white">Welcome Back</h2>
              <p className="small opacity-75 mb-5">Access your property management workspace and leverage AI insights to grow your business.</p>

              <div className="mt-auto">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-white bg-opacity-10 p-2 rounded-3">
                    <i className="bi bi-graph-up text-white"></i>
                  </div>
                  <span className="extra-small fw-semibold">Real-time Analytics</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-10 p-2 rounded-3">
                    <i className="bi bi-robot text-white"></i>
                  </div>
                  <span className="extra-small fw-semibold">AI Lead Predictions</span>
                </div>
              </div>
            </div>

            {/* Login Form Side */}
            <div className="col-lg-7 bg-white p-4 p-md-5 position-relative">
              {isVoiceActive && (
                <div className="voice-overlay position-absolute top-0 start-0 w-100 h-100 bg-black text-white z-3 d-flex flex-column align-items-center justify-content-center p-5 text-center">
                  <div className="orb-pulse mb-4"></div>
                  <h3 className="fw-900 text-red mb-2 uppercase tracking-widest">{voiceStatus}</h3>
                  <p className="opacity-50 small">Protocol active. Please speak clearly into the microphone.</p>
                  <button onClick={() => { setIsVoiceActive(false); window.speechSynthesis.cancel(); }} className="btn btn-outline-danger btn-sm mt-4 rounded-pill px-4">CANCEL VOICE PROTOCOL</button>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h2 className="fw-extrabold text-dark mb-1">Sign In</h2>
                  <p className="text-muted small">Enter your credentials to manage your portfolio</p>
                </div>
                <button
                  type="button"
                  onClick={runVoiceAuth}
                  className="btn btn-dark rounded-circle p-2 d-flex align-items-center justify-content-center shadow-lg hvr-red-pulse"
                  style={{ width: '50px', height: '50px' }}
                  title="Voice Login"
                >
                  <i className="bi bi-mic-fill fs-4 text-red"></i>
                </button>
              </div>

              {(error || authError) && (
                <div className="alert alert-danger border-0 rounded-3 small mb-4 animate-fade-in">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {error || authError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label small-caps mb-2">Email or Phone</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 rounded-start-3"><i className="bi bi-person text-muted"></i></span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0 ps-0"
                      name="username"
                      placeholder="email@example.com"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={localLoading}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label small-caps mb-0">Password</label>
                    <Link href="/forgot-password" style={{ fontSize: '0.7rem' }} className="text-dark fw-bold text-decoration-none">Forgot?</Link>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 rounded-start-3"><i className="bi bi-lock text-muted"></i></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control bg-light border-start-0 ps-0"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={localLoading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-light border-start-0 text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 rounded-4 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2"
                  disabled={localLoading}
                >
                  {localLoading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <i className="bi bi-box-arrow-in-right"></i>
                  )}
                  {localLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="text-center mt-5 pt-3 border-top">
                <p className="extra-small text-muted mb-0">
                  Don't have a account? <Link href="/register" className="text-dark fw-bold text-decoration-none">Register Portfolio</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .fw-extrabold { font-weight: 800; }
        .extra-small { font-size: 0.72rem; }
        .small-caps { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: #94a3b8; }
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .form-control { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; }
        .form-control:focus { background-color: #fff; border-color: #000; box-shadow: 0 0 0 4px rgba(0,0,0,0.05); }
        .input-group-text { border: 1px solid #e2e8f0; }
        .btn-primary { background-color: #000; border: none; }
        .btn-primary:hover { background-color: #222; transform: translateY(-1px); }

        .orb-pulse {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #e60026;
          box-shadow: 0 0 0 0 rgba(230, 0, 38, 0.7);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(230, 0, 38, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(230, 0, 38, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(230, 0, 38, 0); }
        }

        .hvr-red-pulse:hover {
          animation: pulse 1.5s infinite;
        }

        .voice-overlay {
          border-radius: 1rem;
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">Loading Portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}
