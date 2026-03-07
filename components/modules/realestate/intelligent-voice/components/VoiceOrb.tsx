import React from 'react';

type ViewMode = 'idle' | 'listening' | 'processing' | 'leads' | 'bookings' | 'sleep';

interface VoiceOrbProps {
    viewMode: ViewMode;
    activeData: 'leads' | 'bookings' | 'none';
    startListening: () => void;
    speechIntensity: number[];
    commandFeedback: string;
}

export default function VoiceOrb({ viewMode, activeData, startListening, speechIntensity, commandFeedback }: VoiceOrbProps) {
    const isSleeping = viewMode === 'sleep';

    return (
        <>
            {/* When SLEEPING: fixed to viewport bottom-right corner */}
            {isSleeping && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '28px',
                        right: '28px',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        animation: 'slideToCorner 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                        pointerEvents: 'auto',
                    }}
                >
                    <button
                        onClick={startListening}
                        className="btn rounded-circle p-0 position-relative border-0 shadow-lg bg-secondary"
                        title='Say "Wake up" or click to resume'
                        style={{ width: '56px', height: '56px', opacity: 0.85 }}
                    >
                        <i className="bi bi-mic-fill text-white fs-5"></i>
                    </button>
                    <div
                        className="mt-2 bg-white px-2 py-1 rounded-pill shadow-sm text-center"
                        style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', opacity: 0.8 }}
                    >
                        Say &quot;Wake up&quot;
                    </div>
                </div>
            )}

            {/* When AWAKE: normal relative flow */}
            {!isSleeping && (
                <div
                    className="z-3 text-center position-relative"
                    style={{
                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        pointerEvents: 'none',
                        marginTop: activeData !== 'none' ? '0' : '20px',
                        marginBottom: activeData !== 'none' ? '2.5rem' : '0',
                        animation: 'slideFromCorner 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                    }}
                >
                    <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <button
                            onClick={startListening}
                            className={`btn rounded-circle p-0 position-relative border-0 shadow-lg ${viewMode === 'listening' ? 'bg-danger' : 'bg-primary'}`}
                            style={{
                                width: viewMode === 'listening' ? '120px' : '100px',
                                height: viewMode === 'listening' ? '120px' : '100px',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                        >
                            <i className={`bi bi-mic-fill text-white ${viewMode === 'listening' ? 'fs-1' : 'fs-2'}`}></i>
                            {(viewMode === 'listening' || viewMode === 'processing') && (
                                <div
                                    className="position-absolute top-0 start-0 w-100 h-100 rounded-circle border border-2 border-white"
                                    style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                                ></div>
                            )}
                        </button>

                        {/* Text feedback under orb */}
                        <div
                            className="mt-4 bg-white px-4 py-2 rounded-4 shadow-sm text-center d-inline-block"
                            style={{ minWidth: '250px', opacity: 0.95 }}
                        >
                            {(viewMode === 'listening' || viewMode === 'processing') ? (
                                <div className="d-flex justify-content-center gap-1 mb-2" style={{ height: '30px', alignItems: 'center' }}>
                                    {speechIntensity.map((height, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: '4px',
                                                height: `${height}px`,
                                                backgroundColor: '#0d6efd',
                                                borderRadius: '2px',
                                                transition: 'height 0.1s ease',
                                                animation: viewMode === 'processing' ? 'pulse 1s infinite alternate' : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div style={{ height: '20px' }}></div>
                            )}
                            <h5 className="fw-bold text-dark mb-1">{commandFeedback}</h5>
                            {viewMode === 'idle' && (
                                <p className="text-secondary small mb-1">
                                    Try: &quot;List new leads&quot; or &quot;Show today&apos;s bookings&quot;
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideToCorner {
                    from { opacity: 0; transform: scale(1.4); }
                    to   { opacity: 1; transform: scale(1);   }
                }
                @keyframes slideFromCorner {
                    from { opacity: 0; transform: scale(0.5) translateY(60px); }
                    to   { opacity: 1; transform: scale(1)   translateY(0);    }
                }
            `}</style>
        </>
    );
}
