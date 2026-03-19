'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStandalone } from '../../StandaloneProvider';
import UnitDetailView from '@/components/modules/realestate/shared/UnitDetailView';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';

export default function UnitDetailClient({ unitSlug }: { unitSlug: string }) {
    const { website, properties, theme, trackAction, identifyLead, slugOrDomain, currencySymbol } = useStandalone();
    const router = useRouter();

    // Find the unit and its parent property in the pre-loaded list by ID or Slug
    let unit: any = null;
    let property: any = null;

    for (const p of properties) {
        const found = p.units?.find((u: any) => u.id === unitSlug || u.slug === unitSlug);
        if (found) {
            unit = found;
            property = p;
            break;
        }
    }

    const [unitImageIndex, setUnitImageIndex] = useState(0);

    if (!unit || !property) return <div className="p-5 text-center">Unit information not found.</div>;

    const getFormattedPrice = (u: any) => {
        if (!u.unitPricing?.length) return 'Price on Inquiry';
        const pricing = u.unitPricing[0];
        return `${currencySymbol || '$'}${Number(pricing.price).toLocaleString('en-US')}`;
    };

    return (
        <UnitDetailView
            selectedUnit={unit}
            selectedProperty={property}
            unitImageIndex={unitImageIndex}
            setUnitImageIndex={setUnitImageIndex}
            theme={theme}
            widget={website}
            widgetId={website.id}
            // Back to Property Detail using slug or ID
            setCurrentView={(view) => {
                if (view === 'PROPERTY_DETAIL') {
                    router.push(`/standalone/${slugOrDomain}/p/${property.slug || property.id}`);
                }
            }}
            getFormattedPrice={getFormattedPrice}
            trackAction={trackAction}
            identifyLead={identifyLead}
            currencySymbol={currencySymbol}
        />
    );
}
