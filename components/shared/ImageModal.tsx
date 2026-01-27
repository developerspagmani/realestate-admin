'use client';

import React, { useEffect } from 'react';

interface ImageModalProps {
    show: boolean;
    imageUrl: string;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ show, imageUrl, onClose }) => {
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [show]);

    if (!show) return null;

    return (
        <div
            className="image-modal-overlay"
            onClick={onClose}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            tabIndex={-1}
        >
            <div className="image-modal-content animate-zoom-in" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <i className="bi bi-x-lg"></i>
                </button>
                <img src={imageUrl} alt="Preview" className="img-fluid border shadow-lg" />
            </div>

            <style jsx>{`
                .image-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    cursor: zoom-out;
                    backdrop-filter: blur(10px);
                }
                .image-modal-content {
                    position: relative;
                    max-width: 90vw;
                    max-height: 90vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: default;
                }
                .image-modal-content img {
                    max-width: 100%;
                    max-height: 90vh;
                    border-radius: 12px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .close-btn {
                    position: absolute;
                    top: -45px;
                    right: 0;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .close-btn:hover {
                    background: rgba(255,255,255,0.2);
                    transform: rotate(90deg);
                }
                .animate-zoom-in {
                    animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes zoomIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ImageModal;
