'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStandalone } from '../../StandaloneProvider';
import PropertyDetailView from '@/components/modules/realestate/shared/PropertyDetailView';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';
import { trackPropertyView } from '@/app/hooks/useIntelligentPopup';


type ViewType = 'PROPERTY_DETAIL';


export default function PropertyDetailClient({ propertySlug, initialProperty }: { propertySlug: string, initialProperty?: any }) {
    const { website, properties, theme, trackAction, identifyLead, slugOrDomain, currencySymbol } = useStandalone();
    const router = useRouter();

    // Find the property in the pre-loaded list by ID or Slug, or use the initial data from server
    const [property, setProperty] = useState(initialProperty || properties.find(p => p.id === propertySlug || p.slug === propertySlug));
    const [fullPropertyLoading, setFullPropertyLoading] = useState(false);

    const [currentView, setCurrentView] = useState<ViewType>('PROPERTY_DETAIL');
    const [propertyImageIndex, setPropertyImageIndex] = useState(0);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [unitImageIndex, setUnitImageIndex] = useState(0);

    // Fetch full property details if metadata is missing (usually partial data from list)
    React.useEffect(() => {
        const fetchFullDetails = async () => {
            if (!property || property.metadata?.interactiveSvg) return;
            try {
                setFullPropertyLoading(true);
                // Use relative path or env-aware URL
                const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api'
                const res = await fetch(`${BACKEND_URL}/public/properties/${property.id || propertySlug}`);
                const result = await res.json();
                if (result.success && result.data) {
                    setProperty(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch full property details:', err);
            } finally {
                setFullPropertyLoading(false);
            }
        };
        fetchFullDetails();
    }, [propertySlug, property?.id, property?.metadata?.interactiveSvg]);
    // Auto-track property view for the matching engine
    React.useEffect(() => {
        if (property?.id) {
            trackPropertyView(property.id);
            trackAction('PROPERTY_VIEW', { 
                propertyId: property.id,
                propertyTitle: property.title 
            });
        }
    }, [property?.id, property?.title, trackAction]);

    if (!property) return <div className="p-5 text-center">Property not found.</div>;

    const getFormattedPrice = (unit: any) => {
        if (!unit.unitPricing?.length) return 'Price on Inquiry';
        const pricing = unit.unitPricing[0];
        return `${currencySymbol || '$'}${Number(pricing.price).toLocaleString('en-US')}`;
    };



    const renderContent = () => {
        switch (currentView) {


            default:
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
                            else setCurrentView(view as ViewType);
                        }}
                        selectedUnit={selectedUnit}
                        setSelectedUnit={(unit) => {
                            if (unit) {
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
    };

    return renderContent();
}
