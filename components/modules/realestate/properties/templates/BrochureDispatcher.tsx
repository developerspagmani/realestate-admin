import React from 'react';
import { BaseTemplateProps } from './types';
import ModernFlowTemplate from './ModernFlow';
import LuxuryPrestigeTemplate from './LuxuryPrestige';
import ElegantLandscapeTemplate from './ElegantLandscape';
import ArtisticMinimalTemplate from './ArtisticMinimal';
import PremiumRoyaleTemplate from './PremiumRoyale';

interface BrochureDispatcherProps extends BaseTemplateProps {
    design: 'modern' | 'luxury' | 'classic' | 'elegant_landscape' | 'premium_landscape' | 'artistic';
}

export default function BrochureDispatcher(props: BrochureDispatcherProps) {
    const { design, ...rest } = props;

    switch (design) {
        case 'modern':
            return <ModernFlowTemplate {...rest} />;
        case 'luxury':
            return <LuxuryPrestigeTemplate {...rest} />;
        case 'elegant_landscape':
            return <ElegantLandscapeTemplate {...rest} />;
        case 'premium_landscape':
            return <PremiumRoyaleTemplate {...rest} />;
        case 'artistic':
        case 'classic':
            return <ArtisticMinimalTemplate {...rest} />;
        // Fallback or other templates
        default:
            return <ModernFlowTemplate {...rest} />;
    }
}
