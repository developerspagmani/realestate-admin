import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
    onClose: () => void;
    duration?: number; // Optional auto-hide duration in ms (default: 3000)
}

const Toast: React.FC<ToastProps> = ({ message, type, show, onClose, duration = 3000 }) => {

    useEffect(() => {
        if (show && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show) return null;

    const accentColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

    return (
        <div className="toast-container position-fixed top-0 end-0 p-4" style={{ zIndex: 1090 }}>
            <div
                className={`toast show border-0 shadow-lg position-relative overflow-hidden`}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                style={{
                    minWidth: '450px',
                    maxWidth: '100%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    animation: 'toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '6px',
                    height: '100%',
                    background: accentColor
                }} />

                <div className="d-flex p-3">
                    <div className="toast-body d-flex align-items-center w-100 py-1">
                        <div
                            className="flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: `${accentColor}15`,
                                color: accentColor
                            }}
                        >
                            <i className={`bi ${icon} fs-4`}></i>
                        </div>
                        <div className="ms-3 flex-grow-1">
                            <p className="mb-0 text-muted small fw-medium" style={{ lineHeight: '1.4', fontSize: '1rem' }}>{message}</p>
                            <p className="d-block mb-1 text-dark pt-2prgr">
                                {type === 'success' ? 'Success' : type === 'error' ? 'Attention Required' : 'Information'}
                            </p>

                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn-close ms-2 shadow-none border-0"
                        style={{ fontSize: '0.8rem' }}
                        onClick={onClose}
                        aria-label="Close"
                    ></button>
                </div>
            </div>

            <style jsx>{`
                @keyframes toast-in {
                    from { transform: translateX(100%) scale(0.9); opacity: 0; }
                    to { transform: translateX(0) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Toast;
