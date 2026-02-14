'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStandalone } from '../../StandaloneProvider';
import PropertyDetailView from '@/components/modules/realestate/shared/PropertyDetailView';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';

export default function PropertyDetailClient({ propertySlug }: { propertySlug: string }) {
    const { website, properties, theme, trackAction, identifyLead, slugOrDomain } = useStandalone();
    const router = useRouter();

    // Find the property in the pre-loaded list by ID or Slug
    const property = properties.find(p => p.id === propertySlug || p.slug === propertySlug);

    const [propertyImageIndex, setPropertyImageIndex] = useState(0);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [unitImageIndex, setUnitImageIndex] = useState(0);

    if (!property) return <div className="p-5 text-center">Property not found.</div>;

    const country = website?.tenant?.country || 'USA';
    const currencyConfig = getCurrencyConfig(country);
    const currencySymbol = currencyConfig?.symbol || '$';

    const getFormattedPrice = (unit: any) => {
        if (!unit.unitPricing?.length) return 'Price on Inquiry';
        const pricing = unit.unitPricing[0];
        return `${currencySymbol}${Number(pricing.price).toLocaleString()}`;
    };

    return (
        <PropertyDetailView
            selectedProperty={property}
            propertyImageIndex={propertyImageIndex}
            setPropertyImageIndex={setPropertyImageIndex}
            theme={theme}
            widget={website}
            widgetId={website.id}
            colClass="col-lg-4"
            setCurrentView={(view) => {
                if (view === 'LISTING') router.push(`/standalone/${slugOrDomain}`);
            }}
            selectedUnit={selectedUnit}
            setSelectedUnit={(unit) => {
                if (unit) {
                    // Navigate to Unit Detail Page using slug or ID
                    router.push(`/standalone/${slugOrDomain}/u/${unit.slug || unit.id}`);
                }
            }}
            setUnitImageIndex={setUnitImageIndex}
            getFormattedPrice={getFormattedPrice}
            trackAction={trackAction}
            identifyLead={identifyLead}
            currencySymbol={currencySymbol}
        />
    );
}
