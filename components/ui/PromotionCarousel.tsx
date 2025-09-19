import React, { useState, useEffect, useCallback } from 'react';
import { PromotionItem, ViewName } from '../../types.ts';
import { ChevronLeftIcon, ChevronRightIcon } from '../../constants.tsx';
import Button from './Button.tsx';
import PromotionSlide from './PromotionSlide.tsx';

interface PromotionCarouselProps {
    items: PromotionItem[];
    setCurrentView: (view: ViewName) => void;
    onAuthRequired?: () => void;
}

const PromotionCarousel: React.FC<PromotionCarouselProps> = ({ items, setCurrentView, onAuthRequired }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = useCallback(() => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? items.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, items]);

    const goToNext = useCallback(() => {
        const isLastSlide = currentIndex === items.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, items]);

    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setTimeout(() => {
            goToNext();
        }, 5000); // Auto-slide every 5 seconds
        return () => clearTimeout(timer);
    }, [currentIndex, goToNext, items.length]);

    if (!items || items.length === 0) {
        return null;
    }
    
    const handleCtaClick = (item: PromotionItem) => {
        if (item.requires_auth && onAuthRequired) {
            onAuthRequired();
            return;
        }
        
        if (item.cta_link) {
            // Check if it's an external URL
            if (item.cta_link.startsWith('http')) {
                window.open(item.cta_link, '_blank', 'noopener noreferrer');
            } 
            // Check if it's a known internal view name
            else if (Object.values(ViewName).includes(item.cta_link as ViewName)) {
                setCurrentView(item.cta_link as ViewName);
            }
        }
    }

    return (
        <div className="relative w-full h-80 rounded-lg overflow-hidden group shadow-lg">
            {/* Slides container */}
            <div
                className="w-full h-full flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {items.map((item) => (
                    <PromotionSlide
                        key={item.id}
                        item={item}
                        imageSrc={item.image_url}
                        onCtaClick={() => handleCtaClick(item)}
                    />
                ))}
            </div>

            {/* Navigation Arrows (only show if more than one item) */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute top-1/2 left-3 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Previous promotion"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Next promotion"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>

                    {/* Dot indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {items.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    currentIndex === index ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white'
                                }`}
                                aria-label={`Go to promotion slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default PromotionCarousel;