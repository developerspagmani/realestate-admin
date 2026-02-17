'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade, Thumbs, FreeMode } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

import ImageModal from './ImageModal';

interface GallerySliderProps {
    images: any[];
    currentIndex?: number;
    setCurrentIndex?: (i: number) => void;
}

const GallerySlider: React.FC<GallerySliderProps> = ({ images, currentIndex = 0, setCurrentIndex }) => {
    const [thumbsSwiper, setThumbsSwiper] = React.useState<any>(null);
    const [mainSwiper, setMainSwiper] = React.useState<any>(null);
    const [showPopup, setShowPopup] = React.useState(false);
    const [popupImageUrl, setPopupImageUrl] = React.useState('');

    // Sync swiper with currentIndex prop if external control is needed
    React.useEffect(() => {
        if (mainSwiper && !mainSwiper.destroyed) {
            const index = Number(currentIndex);
            if (mainSwiper.params.loop) {
                if (index !== mainSwiper.realIndex) {
                    mainSwiper.slideToLoop(index);
                }
            } else {
                if (index !== mainSwiper.activeIndex) {
                    mainSwiper.slideTo(index);
                }
            }
        }
    }, [currentIndex, mainSwiper]);

    // Force main swiper update when thumbs swiper becomes available
    React.useEffect(() => {
        if (mainSwiper && thumbsSwiper && !mainSwiper.destroyed && !thumbsSwiper.destroyed) {
            mainSwiper.thumbs.swiper = thumbsSwiper;
            mainSwiper.thumbs.init();
            mainSwiper.thumbs.update();
        }
    }, [mainSwiper, thumbsSwiper]);

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
        <div className="gallery-container swiper-custom-outer position-relative d-flex flex-column gap-3">
            <div className="rounded-5 overflow-hidden shadow-2xl main-slider-wrapper">
                <Swiper
                    modules={[Navigation, Pagination, Autoplay, Thumbs]}
                    navigation={{
                        nextEl: '.swiper-button-next-custom',
                        prevEl: '.swiper-button-prev-custom',
                    }}
                    pagination={{ clickable: true, dynamicBullets: true }}
                    autoplay={{ delay: 6000, disableOnInteraction: false }}
                    loop={images.length > 1}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    className="mainSwiper main-slider-container"
                    onSwiper={setMainSwiper}
                    onSlideChange={(s) => {
                        const newIndex = s.realIndex;
                        if (setCurrentIndex && newIndex !== currentIndex) {
                            setCurrentIndex(newIndex);
                        }
                    }}
                    initialSlide={currentIndex}
                    key={images.length} // Force re-mount if images change
                >
                    {images.map((img: any, idx: number) => {
                        const imgUrl = typeof img === 'string' ? img : (img?.url || '');
                        if (!imgUrl) return null;

                        return (
                            <SwiperSlide key={img.id || idx}>
                                <div className="w-100 h-100 position-relative cursor-zoom-in slider-image-container" onClick={() => handleImageClick(imgUrl)}>
                                    <img
                                        src={imgUrl}
                                        className="w-100 h-100 object-fit-cover shadow-inner main-slide-img"
                                        alt={`Slide ${idx + 1}`}
                                        loading="eager"
                                        onError={(e: any) => {
                                            e.target.src = 'https://placehold.co/800x600?text=Image+Not+Found';
                                        }}
                                    />
                                    <div className="image-overlay-gradient"></div>
                                    <div className="zoom-hint">
                                        <i className="bi bi-arrows-angle-expand"></i>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                {images.length > 1 && (
                    <>
                        <div className="swiper-button-prev-custom">
                            <i className="bi bi-chevron-left"></i>
                        </div>
                        <div className="swiper-button-next-custom">
                            <i className="bi bi-chevron-right"></i>
                        </div>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <div className="thumbnail-strip-wrapper px-1">
                    <Swiper
                        onSwiper={setThumbsSwiper}
                        loop={images.length > 1}
                        spaceBetween={12}
                        slidesPerView={Math.min(images.length, 5)}
                        freeMode={true}
                        watchSlidesProgress={true}
                        slideToClickedSlide={true}
                        modules={[FreeMode, Navigation, Thumbs]}
                        className="thumbsSwiper"
                        style={{ height: '80px' }}
                        breakpoints={{
                            320: { slidesPerView: 3, spaceBetween: 8 },
                            480: { slidesPerView: 4, spaceBetween: 10 },
                            768: { slidesPerView: 5, spaceBetween: 12 }
                        }}
                    >
                        {images.map((img: any, idx: number) => {
                            const thumbUrl = typeof img === 'string' ? img : (img?.url || '');
                            if (!thumbUrl) return null;

                            return (
                                <SwiperSlide key={`thumb-${idx}`} className="rounded-4 overflow-hidden cursor-pointer thumb-slide">
                                    <img
                                        src={thumbUrl}
                                        className="w-100 h-100 object-fit-cover thumb-img"
                                        alt={`Thumb ${idx + 1}`}
                                        onError={(e: any) => {
                                            e.target.src = 'https://placehold.co/200x150?text=No+Img';
                                        }}
                                    />
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>
            )}

            <ImageModal
                show={showPopup}
                imageUrl={popupImageUrl}
                onClose={() => setShowPopup(false)}
            />

            <style jsx>{`
                .cursor-zoom-in { cursor: zoom-in; }
                .main-slider-wrapper {
                    position: relative;
                }
                .main-slide-img {
                    transition: transform 0.7s ease;
                }
                .slider-image-container:hover .main-slide-img {
                    transform: scale(1.05);
                }
                .image-overlay-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.3), transparent);
                    pointer-events: none;
                }
                .zoom-hint {
                    position: absolute;
                    bottom: 25px;
                    right: 25px;
                    background: rgba(0,0,0,0.4);
                    color: white;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.2);
                    z-index: 10;
                }
                .slider-image-container:hover .zoom-hint {
                    opacity: 1;
                    transform: scale(1);
                }
                .shadow-2xl {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
                .main-slider-container {
                    height: 500px;
                }
                .swiper-button-prev-custom,
                .swiper-button-next-custom {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 44px;
                    height: 44px;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 20;
                    transition: all 0.3s;
                    font-size: 1.2rem;
                }
                .swiper-button-prev-custom:hover,
                .swiper-button-next-custom:hover {
                    background: rgba(255, 255, 255, 0.4);
                    transform: translateY(-50%) scale(1.1);
                }
                .swiper-button-prev-custom {
                    left: 20px;
                }
                .swiper-button-next-custom {
                    right: 20px;
                }
                @media (max-width: 768px) {
                    .main-slider-container {
                        height: 350px;
                    }
                }
                @media (max-width: 480px) {
                    .main-slider-container {
                        height: 280px;
                    }
                }
                .thumbsSwiper .swiper-slide-thumb-active {
                    border: 2px solid var(--primary-color, #6366f1) !important;
                    opacity: 1 !important;
                }
                .thumbsSwiper .swiper-slide {
                    opacity: 0.5;
                    transition: all 0.3s;
                    border: 2px solid transparent;
                }
                .thumb-slide {
                    border-radius: 12px;
                    overflow: hidden;
                }
                .thumb-img {
                    transition: opacity 0.3s;
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
