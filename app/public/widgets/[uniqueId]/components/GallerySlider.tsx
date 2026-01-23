'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface GallerySliderProps {
    images: any[];
    currentIndex?: number;
    setCurrentIndex?: (i: number) => void;
}

const GallerySlider: React.FC<GallerySliderProps> = ({ images }) => {
    if (!images || images.length === 0) return (
        <div className="gallery-container d-flex align-items-center justify-content-center bg-light rounded-4" style={{ height: '400px' }}>
            <i className="bi bi-image text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
        </div>
    );

    return (
        <div className="gallery-container swiper-custom-outer rounded-4 overflow-hidden shadow-sm">
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
            >
                {images.map((img: any, idx: number) => (
                    <SwiperSlide key={img.id || idx}>
                        <img
                            src={img.url}
                            className="w-100 h-100 object-fit-cover shadow-inner"
                            alt={`Slide ${idx + 1}`}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

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
