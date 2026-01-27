'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import ImageModal from './ImageModal';

interface GallerySliderProps {
    images: any[];
    currentIndex?: number;
    setCurrentIndex?: (i: number) => void;
}

const GallerySlider: React.FC<GallerySliderProps> = ({ images, currentIndex = 0, setCurrentIndex }) => {
    const [swiper, setSwiper] = React.useState<any>(null);
    const [showPopup, setShowPopup] = React.useState(false);
    const [popupImageUrl, setPopupImageUrl] = React.useState('');

    // Sync swiper with currentIndex prop if external control is needed
    React.useEffect(() => {
        if (swiper && currentIndex !== swiper.activeIndex) {
            swiper.slideTo(currentIndex);
        }
    }, [currentIndex, swiper]);

    if (!images || images.length === 0) return (
        <div className="gallery-container d-flex align-items-center justify-content-center bg-light rounded-4" style={{ height: '400px' }}>
            <i className="bi bi-image text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
        </div>
    );

    const handleImageClick = (url: string) => {
        setPopupImageUrl(url);
        setShowPopup(true);
    };

    return (
        <div className="gallery-container swiper-custom-outer rounded-4 overflow-hidden shadow-sm position-relative">
            <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                navigation={images.length > 1}
                pagination={{ clickable: true, dynamicBullets: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={images.length > 1}
                className="mySwiper h-100"
                style={{ height: '450px' }}
                onSwiper={setSwiper}
                onSlideChange={(s) => setCurrentIndex?.(s.activeIndex)}
                initialSlide={currentIndex}
            >
                {images.map((img: any, idx: number) => (
                    img && img.url ? (
                        <SwiperSlide key={img.id || idx}>
                            <div className="w-100 h-100 position-relative cursor-zoom-in" onClick={() => handleImageClick(img.url)}>
                                <img
                                    src={img.url}
                                    className="w-100 h-100 object-fit-cover shadow-inner"
                                    alt={`Slide ${idx + 1}`}
                                />
                                <div className="zoom-hint">
                                    <i className="bi bi-zoom-in"></i>
                                </div>
                            </div>
                        </SwiperSlide>
                    ) : null
                ))}
            </Swiper>

            <ImageModal
                show={showPopup}
                imageUrl={popupImageUrl}
                onClose={() => setShowPopup(false)}
            />

            <style jsx>{`
                .cursor-zoom-in { cursor: zoom-in; }
                .zoom-hint {
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s;
                    backdrop-filter: blur(4px);
                }
                .cursor-zoom-in:hover .zoom-hint {
                    opacity: 1;
                }
            `}</style>

            <style jsx global>{`
                .swiper-custom-outer .swiper-button-next,
                .swiper-custom-outer .swiper-button-prev {
                    color: white;
                    background: rgba(0,0,0,0.3);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    backdrop-filter: blur(4px);
                }
                .swiper-custom-outer .swiper-button-next:after,
                .swiper-custom-outer .swiper-button-prev:after {
                    font-size: 18px;
                    font-weight: bold;
                }
                .swiper-custom-outer .swiper-pagination-bullet-active {
                    background: white;
                }
                .swiper-slide {
                    background: #eee;
                }
            `}</style>
        </div>
    );
};

export default GallerySlider;
