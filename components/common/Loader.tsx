'use client';

import React from 'react';

interface LoaderProps {
    message?: string;
    fullPage?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'light';
}

const Loader: React.FC<LoaderProps> = ({
    message = 'Loading...',
    fullPage = false,
    size = 'md',
    variant = 'primary'
}) => {
    const spinnerSize = size === 'sm' ? 'spinner-border-sm' : size === 'lg' ? '' : '';
    const spinnerStyle = size === 'lg' ? { width: '3rem', height: '3rem' } : {};

    const containerClasses = fullPage
        ? "position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75"
        : "text-center py-5 d-flex flex-column align-items-center justify-content-center w-100";

    const zIndex = fullPage ? { zIndex: 9999 } : {};

    return (
        <div className={containerClasses} style={zIndex}>
            <div className="loader-element mb-3">
                <div
                    className={`spinner-border text-${variant} ${spinnerSize} opacity-75`}
                    role="status"
                    style={spinnerStyle}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
            {message && (
                <p className={`text-muted animate-pulse ${size === 'sm' ? 'extra-small' : 'small'} mb-0 fw-medium`}>
                    {message}
                </p>
            )}

            <style jsx>{`
                .extra-small { font-size: 11px; }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
                .loader-element {
                    position: relative;
                }
                .loader-element::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid currentColor;
                    opacity: 0.1;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                @keyframes ping {
                    75%, 100% {
                        transform: translate(-50%, -50%) scale(2);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default Loader;
