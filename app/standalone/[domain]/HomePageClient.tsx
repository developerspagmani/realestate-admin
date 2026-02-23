'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStandalone } from './StandaloneProvider';
import ListingView from '@/components/modules/realestate/shared/ListingView';
import PageBuilder from '@/components/modules/realestate/shared/PageBuilder';

export default function HomePageClient() {
    const { website, properties, builder, theme, slugOrDomain, trackAction, updateFilters, loading } = useStandalone();
    const router = useRouter();

    const onSelectProperty = React.useCallback(async (property: any) => {
        // Track the general view
        await trackAction('PROPERTY_VIEW', {
            propertyId: property.id,
            propertyTitle: property.title
        });
        router.push(`/standalone/${slugOrDomain}/p/${property.slug || property.id}`);
    }, [trackAction, router, slugOrDomain]);

    const handleFilter = React.useCallback((filters: any) => {
        trackAction('SEARCH_FILTER', filters);
        updateFilters(filters);
    }, [trackAction, updateFilters]);

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
                    onFilter={handleFilter}
                    trackAction={trackAction}
                />
            ) : (
                <ListingView
                    filteredData={properties}
                    isFiltered={false}
                    theme={theme}
                    widget={website}
                    widgetId={website.id}
                    onReset={() => handleFilter({})}
                    onSelectProperty={onSelectProperty}
                    onFilter={handleFilter}
                    trackAction={trackAction}
                    colClass={builder.gridStrategy === 'list' ? 'col-12' : ''}
                />
            )}
        </div>
    );
}
