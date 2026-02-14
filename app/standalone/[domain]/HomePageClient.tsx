'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStandalone } from './StandaloneProvider';
import ListingView from '@/components/modules/realestate/shared/ListingView';
import PageBuilder from '@/components/modules/realestate/shared/PageBuilder';

export default function HomePageClient() {
    const { website, properties, builder, theme, slugOrDomain, trackAction } = useStandalone();
    const [filteredData, setFilteredData] = useState(properties);
    const [isFiltered, setIsFiltered] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setFilteredData(properties);
    }, [properties]);

    const onSelectProperty = (property: any) => {
        if (trackAction) trackAction('PROPERTY_VIEW', { propertyId: property.id });
        router.push(`/standalone/${slugOrDomain}/p/${property.slug || property.id}`);
    };

    const onReset = () => {
        setFilteredData(properties);
        setIsFiltered(false);
    };

    return builder.showHero ? (
        <PageBuilder
            config={builder}
            data={filteredData}
            theme={theme}
            widget={website}
            widgetId={website.id}
            onSelectProperty={onSelectProperty}
        />
    ) : (
        <ListingView
            filteredData={filteredData}
            isFiltered={isFiltered}
            theme={theme}
            widget={website}
            widgetId={website.id}
            onReset={onReset}
            onSelectProperty={onSelectProperty}
            colClass={builder.gridStrategy === 'list' ? 'col-12' : ''}
        />
    );
}
