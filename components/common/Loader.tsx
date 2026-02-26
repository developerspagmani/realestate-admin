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
    const containerClasses = fullPage
        ? "position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75"
        : "text-center py-5 d-flex flex-column align-items-center justify-content-center w-100";

    const zIndex = fullPage ? { zIndex: 9999 } : {};
    const pingColor = variant === 'light' ? '#f8f9fa' : variant === 'secondary' ? '#6c757d' : '#0d6efd';

    return (
        <div className={containerClasses} style={zIndex}>
            <div className="loader-element mb-2">
                <div className={`loader-gif-wrapper size-${size}`}>
                    <img
                        src="/images/virpnix-logo-loader.gif"
                        alt="Loading..."
                        className="loader-gif"
                    />
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

                .loader-gif-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                }
                
                .size-sm { width: 32px; height: 32px; }
                .size-md { width: 64px; height: 64px; }
                .size-lg { width: 96px; height: 96px; }

                .loader-gif {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
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
                    border: 2px solid ${pingColor};
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
