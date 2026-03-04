'use client';

import { useState, useEffect } from 'react';

interface ImageModalProps {
    show: boolean;
    imageUrl?: string; // For backward compatibility
    images?: any[];    // Array of {url: string} or strings
    startIndex?: number;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ show, imageUrl, images, startIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
            setCurrentIndex(startIndex);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [show, startIndex]);

    if (!show) return null;

    // Normalize images to an array of URLs
    const imageList = images ? images.map(img => typeof img === 'string' ? img : img.url) : (imageUrl ? [imageUrl] : []);
    const currentUrl = imageList[currentIndex];

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % imageList.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    };

    return (
        <div
            className="image-modal-overlay"
            onClick={onClose}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
                if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % imageList.length);
                if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
            }}
            tabIndex={-1}
        >
            <div className="image-modal-content animate-zoom-in" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose} aria-label="Close">
                    <i className="bi bi-x-lg"></i>
                </button>

                {imageList.length > 1 && (
                    <>
                        <button className="nav-btn prev" onClick={prevImage}>
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        <button className="nav-btn next" onClick={nextImage}>
                            <i className="bi bi-chevron-right"></i>
                        </button>
                        <div className="gallery-counter">
                            {currentIndex + 1} / {imageList.length}
                        </div>
                    </>
                )}

                <div className="img-wrapper">
                    <img key={currentUrl} src={currentUrl} alt={`Gallery image ${currentIndex + 1}`} className="img-fluid" />
                </div>
            </div>

            <style jsx>{`
                .image-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    cursor: zoom-out;
                    backdrop-filter: blur(12px);
                }
                .image-modal-content {
                    position: relative;
                    width: 95vw;
                    height: 90vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: default;
                }
                .img-wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .image-modal-content img {
                    max-width: 100%;
                    max-height: 100%;
                    width: auto;
                    height: auto;
                    object-fit: contain;
                    border-radius: 12px;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
                    animation: fadeIn 0.4s ease-out;
                }
                .close-btn {
                    position: absolute;
                    top: -50px;
                    right: 0;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 28px;
                    cursor: pointer;
                    transition: all 0.3s;
                    z-index: 10001;
                }
                .close-btn:hover {
                    transform: rotate(90deg) scale(1.2);
                    color: #ff4757;
                }
                .nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(8px);
                    color: white;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    cursor: pointer;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    transition: all 0.3s;
                }
                .nav-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-50%) scale(1.1);
                }
                .nav-btn.prev { left: 20px; }
                .nav-btn.next { right: 20px; }
                
                .gallery-counter {
                    position: absolute;
                    bottom: -40px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: white;
                    font-weight: 600;
                    background: rgba(0,0,0,0.5);
                    padding: 4px 16px;
                    border-radius: 50px;
                    font-size: 14px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-zoom-in {
                    animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes zoomIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                
                @media (max-width: 768px) {
                    .nav-btn { width: 40px; height: 40px; font-size: 16px; }
                    .nav-btn.prev { left: 10px; }
                    .nav-btn.next { right: 10px; }
                }
            `}</style>
        </div>
    );
};

export default ImageModal;
