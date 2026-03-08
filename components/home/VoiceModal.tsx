'use client';

interface VoiceModalProps {
    isListening: boolean;
    setIsListening: (val: boolean) => void;
    commandFeedback: string;
    speechIntensity: number[];
}

export default function VoiceModal({ isListening, setIsListening, commandFeedback, speechIntensity }: VoiceModalProps) {
    if (!isListening) return null;

    return (
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
    );
}
