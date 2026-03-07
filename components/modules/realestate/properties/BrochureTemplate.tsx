import React from 'react';
import { Property } from '@/types';
import { BaseTemplateProps } from './templates/types';
import BrochureDispatcher from './templates/BrochureDispatcher';

interface BrochureTemplateProps extends Omit<BaseTemplateProps, 'property'> {
    property: Property | null;
    design?: 'modern' | 'luxury' | 'classic' | 'elegant_landscape' | 'premium_landscape' | 'artistic';
}

export default function BrochureTemplate(props: BrochureTemplateProps) {
    const { property, design = 'modern', ...rest } = props;

    if (!property) return null;

    // A4 Dimension configurations
    const isLandscape = design.includes('landscape');
    const pageWidth = isLandscape ? '297mm' : '210mm';

    return (
        <div
            id={props.isPreview ? "brochure-preview-area" : "brochure-capture-area"}
            style={{
                width: pageWidth,
                position: props.isPreview ? 'relative' : 'static',
                margin: props.isPreview ? '0' : '0 auto',
                boxSizing: 'border-box',
                boxShadow: props.isPreview ? '0 30px 60px rgba(0,0,0,0.1)' : 'none'
            }}
        >
            <BrochureDispatcher
                property={property}
                design={design as any}
                {...rest}
            />
        </div>
    );
}
