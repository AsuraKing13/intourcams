

import React from 'react';
import { PromotionItem } from '../../types.ts';
import Button from './Button.tsx';

interface PromotionSlideProps {
    item: Partial<PromotionItem>; // Partial to allow previewing unsaved data
    imageSrc: string;
    onCtaClick: () => void;
}

const PromotionSlide: React.FC<PromotionSlideProps> = ({ item, imageSrc, onCtaClick }) => {
    return (
        <div className="relative w-full h-full flex-shrink-0">
            <img src={imageSrc} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20"></div>
            <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 text-white max-w-lg">
                <h3 className="text-3xl md:text-4xl font-bold text-shadow-md">{item.title || 'Your Title Here'}</h3>
                <p className="mt-2 text-md md:text-lg opacity-90 text-shadow-md">{item.description || 'Your description will appear here.'}</p>
                <div className="mt-6">
                    <Button 
                        variant="primary"
                        size="lg"
                        onClick={onCtaClick}
                        // Preview button should not be clickable to navigate
                        disabled={!item.id} 
                        title={!item.id ? "Button is disabled in preview" : item.cta_text}
                    >
                        {item.cta_text || 'Learn More'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PromotionSlide;