'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
    loadingMessage: string;
    showLoader: (message?: string) => void;
    hideLoader: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Global singleton for non-component access
export const loadingState = {
    show: (message?: string) => {
        window.dispatchEvent(new CustomEvent('app:show-loader', { detail: { message } }));
    },
    hide: () => {
        window.dispatchEvent(new CustomEvent('app:hide-loader'));
    }
};

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading...');

    React.useEffect(() => {
        const handleShow = (e: any) => {
            setLoadingMessage(e.detail?.message || 'Loading...');
            setIsLoading(true);
        };
        const handleHide = () => setIsLoading(false);

        window.addEventListener('app:show-loader', handleShow);
        window.addEventListener('app:hide-loader', handleHide);
        return () => {
            window.removeEventListener('app:show-loader', handleShow);
            window.removeEventListener('app:hide-loader', handleHide);
        };
    }, []);

    const showLoader = (message: string = 'Processing...') => {
        setLoadingMessage(message);
        setIsLoading(true);
    };

    const hideLoader = () => {
        setIsLoading(false);
    };

    return (
        <LoadingContext.Provider value={{
            isLoading,
            setLoading: setIsLoading,
            loadingMessage,
            showLoader,
            hideLoader
        }}>
            {children}
            {isLoading && <GlobalLoader message={loadingMessage} />}
        </LoadingContext.Provider>
    );
};

const GlobalLoader: React.FC<{ message: string }> = ({ message }) => {
    return (
        <div className="global-loader-overlay">
            <div className="loader-content">
                <div className="loader-logo-container">
                    <img src="/images/virpnix-logo-loader.gif" alt="Loading..." className="loader-logo" />
                </div>
                <p className="loader-text">{message}</p>
            </div>
            <style jsx>{`
               
                .global-loader-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease-out;
                }

                .loader-content {
                    text-align: center;
                    background: white;
                    padding: 40px;
                    border-radius: 30px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    transform: scale(1);
                    animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .loader-logo-container {
                    width: 75px;
                    height: 75px;
                    margin: 0 auto 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .loader-logo {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .loader-text {
                    color: #1e293b;
                    font-weight: 500;
                    font-size: 0.9rem;
                    margin: 0;
                    letter-spacing: 0.02em;
                    opacity: 0.8;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
