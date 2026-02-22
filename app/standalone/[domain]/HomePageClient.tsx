'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStandalone } from './StandaloneProvider';
import ListingView from '@/components/modules/realestate/shared/ListingView';
import PageBuilder from '@/components/modules/realestate/shared/PageBuilder';

export default function HomePageClient() {
    const { website, properties, builder, theme, slugOrDomain, trackAction, updateFilters, loading } = useStandalone();
    const router = useRouter();

    const onSelectProperty = (property: any) => {
        if (trackAction) trackAction('PROPERTY_VIEW', { propertyId: property.id });
        router.push(`/standalone/${slugOrDomain}/p/${property.slug || property.id}`);
    };

    return (
        <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
            {builder.showHero ? (
                <PageBuilder
                    config={builder}
                    data={properties}
                    theme={theme}
                    widget={website}
                    widgetId={website.id}
                    onSelectProperty={onSelectProperty}
                    onFilter={updateFilters}
                />
            ) : (
                <ListingView
                    filteredData={properties}
                    isFiltered={false}
                    theme={theme}
                    widget={website}
                    widgetId={website.id}
                    onReset={() => updateFilters({})}
                    onSelectProperty={onSelectProperty}
                    onFilter={updateFilters}
                    colClass={builder.gridStrategy === 'list' ? 'col-12' : ''}
                />
            )}
        </div>
    );
}
