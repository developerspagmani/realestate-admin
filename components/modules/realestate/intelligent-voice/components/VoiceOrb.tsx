import React from 'react';

type ViewMode = 'idle' | 'listening' | 'processing' | 'leads' | 'bookings' | 'forecasting' | 'prevention' | 'awaiting_agent_selection' | 'sleep';

interface VoiceOrbProps {
    viewMode: ViewMode;
    activeData: 'leads' | 'bookings' | 'forecasting' | 'prevention' | 'agent_selection' | 'none';
    startListening: () => void;
    speechIntensity: number[];
    commandFeedback: string;
}

export default function VoiceOrb({ viewMode, activeData, startListening, speechIntensity, commandFeedback }: VoiceOrbProps) {
    const isSleeping = viewMode === 'sleep';
    const isListening = viewMode === 'listening';
    const isProcessing = viewMode === 'processing';

    const orbGradient = isListening
        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
        : isProcessing
            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
            : 'linear-gradient(135deg, #991b1b, #ef4444)';

    const orbGlow = isListening
        ? '0 0 40px rgba(239,68,68,0.5), 0 0 80px rgba(239,68,68,0.2)'
        : isProcessing
            ? '0 0 40px rgba(245,158,11,0.5), 0 0 80px rgba(245,158,11,0.2)'
            : '0 0 40px rgba(239,68,68,0.3), 0 0 80px rgba(153,27,27,0.15)';

    return (
        <>
            {/* SLEEPING — Fixed corner button */}
            {isSleeping && (
                <div style={{
                    position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    animation: 'slideToCorner 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
                    pointerEvents: 'auto',
                }}>
                    <button
                        onClick={startListening}
                        title='Say "Wake up" or click to resume'
                        style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.06)',
                            backdropFilter: 'blur(12px)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}
                    >
                        <i className="bi bi-mic-mute-fill" style={{ color: '#64748b', fontSize: '1.1rem' }}></i>
                    </button>
                    <div style={{
                        marginTop: '6px', fontSize: '0.6rem', color: '#475569',
                        whiteSpace: 'nowrap', letterSpacing: '0.5px'
                    }}>
                        SLEEPING
                    </div>
                </div>
            )}

            {/* AWAKE — Main orb in document flow */}
            {!isSleeping && (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    marginBottom: activeData !== 'none' ? '2rem' : '0',
                    animation: 'slideFromCorner 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
                    pointerEvents: 'none',
                }}>
                    {/* Outer ring glow */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Pulse ring */}
                        {(isListening || isProcessing) && (
                            <div style={{
                                position: 'absolute',
                                width: '160px', height: '160px',
                                borderRadius: '50%',
                                border: `2px solid ${isListening ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
                                animation: 'orbPulse 1.5s ease infinite',
                            }} />
                        )}
                        {/* Second ring (idle) */}
                        {!isListening && !isProcessing && (
                            <div style={{
                                position: 'absolute',
                                width: '150px', height: '150px',
                                borderRadius: '50%',
                                border: '1px solid rgba(239,68,68,0.2)',
                                animation: 'orbPulse 3s ease infinite',
                            }} />
                        )}

                        {/* Main button */}
                        <button
                            onClick={startListening}
                            style={{
                                width: isListening ? '120px' : '110px',
                                height: isListening ? '120px' : '110px',
                                borderRadius: '50%', border: 'none', cursor: 'pointer',
                                background: orbGradient,
                                boxShadow: orbGlow,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                                position: 'relative', pointerEvents: 'auto',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Shine overlay */}
                            <div style={{
                                position: 'absolute', top: '-40%', left: '-40%',
                                width: '80%', height: '80%',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                pointerEvents: 'none'
                            }} />
                            <i className={`bi ${isProcessing ? 'bi-activity' : 'bi-mic-fill'} text-white`}
                                style={{ fontSize: isListening ? '2rem' : '1.7rem', position: 'relative', zIndex: 1 }}>
                            </i>
                        </button>
                    </div>

                    {/* Waveform / feedback card */}
                    <div style={{
                        marginTop: '20px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px', padding: '16px 24px',
                        backdropFilter: 'blur(12px)',
                        minWidth: '280px', textAlign: 'center',
                        pointerEvents: 'none'
                    }}>
                        {(isListening || isProcessing) && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '10px', height: '28px', alignItems: 'center' }}>
                                {speechIntensity.map((height, i) => (
                                    <div key={i} style={{
                                        width: '3px',
                                        height: `${height}px`,
                                        background: isListening ? '#ef4444' : '#f59e0b',
                                        borderRadius: '2px',
                                        transition: 'height 0.08s ease',
                                        animation: isProcessing ? 'pulse-bar 0.8s ease infinite alternate' : 'none'
                                    }} />
                                ))}
                            </div>
                        )}
                        <p style={{
                            margin: 0, fontSize: '0.85rem', fontWeight: 600,
                            color: isListening ? '#fca5a5' : isProcessing ? '#fcd34d' : '#94a3b8',
                        }}>
                            {commandFeedback}
                        </p>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes orbPulse {
                    0%   { transform: scale(1); opacity: 0.6; }
                    50%  { transform: scale(1.15); opacity: 0.2; }
                    100% { transform: scale(1); opacity: 0.6; }
                }
                @keyframes pulse-bar {
                    from { transform: scaleY(0.6); }
                    to   { transform: scaleY(1.4); }
                }
                @keyframes ping {
                    75%, 100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes slideToCorner {
                    from { opacity: 0; transform: scale(1.3); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes slideFromCorner {
                    from { opacity: 0; transform: scale(0.5) translateY(40px); }
                    to   { opacity: 1; transform: scale(1)   translateY(0); }
                }
            `}</style>
        </>
    );
}
