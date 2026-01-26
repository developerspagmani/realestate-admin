import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
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

    const bgColor = type === 'success' ? 'bg-success' : 'bg-danger';
    const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';

    return (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1090 }}>
            <div
                className={`toast show align-items-center text-white ${bgColor} border-0 shadow-lg`}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
            >
                <div className="d-flex">
                    <div className="toast-body d-flex align-items-center">
                        <i className={`bi ${icon} fs-5 me-2`}></i>
                        <div>
                            <strong className="d-block mb-0">{type === 'success' ? 'Success' : 'Error'}</strong>
                            <span className="small opacity-75">{message}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn-close btn-close-white me-2 m-auto"
                        onClick={onClose}
                        aria-label="Close"
                    ></button>
                </div>
            </div>
        </div>
    );
};

export default Toast;
