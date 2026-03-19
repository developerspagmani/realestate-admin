'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStandalone } from '../StandaloneProvider';
import SideDiscoveryFilter from '@/components/modules/realestate/shared/SideDiscoveryFilter';
import ListingView from '@/components/modules/realestate/shared/ListingView';
import UnitListingView from '@/components/modules/realestate/shared/UnitListingView';
export default function ExplorePageClient({ domain, initialWebsite }: { domain?: string, initialWebsite?: any }) {
    const context = useStandalone();
    const website = initialWebsite || context.website;
    const { properties, theme: contextTheme, slugOrDomain: contextSlug, trackAction, identifyLead, updateFilters, loading, currencySymbol } = context;

    const slugOrDomain = domain || contextSlug;
    const theme = website?.configuration?.theme || contextTheme;

    const router = useRouter();
    const [viewMode, setViewMode] = useState<'properties' | 'units'>('properties');

    const onSelectProperty = useCallback(async (property: any) => {
        await trackAction('PROPERTY_VIEW', {
            propertyId: property.id,
            propertyTitle: property.title,
            source: 'explore_page'
        });
        router.push(`/standalone/${slugOrDomain}/p/${property.slug || property.id}`);
    }, [trackAction, router, slugOrDomain]);

    const onSelectUnit = useCallback(async (unit: any) => {
        await trackAction('UNIT_VIEW', {
            unitId: unit.id,
            unitCode: unit.unitCode,
            source: 'explore_page'
        });
        router.push(`/standalone/${slugOrDomain}/u/${unit.slug || unit.id}`);
    }, [trackAction, router, slugOrDomain]);

    const handleFilter = useCallback((filters: any) => {
        trackAction('SEARCH_FILTER_EXPLORE', filters);
        updateFilters(filters);
    }, [trackAction, updateFilters]);

    // Flatten units from all properties
    const allUnits = React.useMemo(() => {
        return properties.flatMap(p => (p.units || []).map((u: any) => ({ ...u, property: p })));
    }, [properties]);

    return (
        <div className="container-fluid py-5 bg-light min-vh-100">
            <div className="container">
                <div className="row g-4">
                    {/* Left Sidebar Filter */}
                    <div className="col-lg-3 d-none d-lg-block">
                        <SideDiscoveryFilter onFilter={handleFilter} theme={theme} />
                    </div>

                    {/* Main Listing Content */}
                    <div className="col-lg-9">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 animate-fade-in gap-3">
                            <div>
                                <h2 className="fw-600 mb-1" style={{ color: theme.primaryColor }}>Explore {viewMode === 'properties' ? 'Properties' : 'Units'}</h2>
                                <p className="text-muted mb-0">Discover your perfect space</p>
                            </div>

                            <div className="d-flex align-items-center gap-2 bg-white p-1 rounded-pill shadow-sm border" style={{ width: 'fit-content' }}>
                                <button
                                    className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${viewMode === 'properties' ? 'btn-primary shadow' : 'btn-link text-dark text-decoration-none'}`}
                                    style={viewMode === 'properties' ? { backgroundColor: theme.primaryColor, border: 'none' } : {}}
                                    onClick={() => setViewMode('properties')}
                                >
                                    Properties
                                </button>
                                <button
                                    className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${viewMode === 'units' ? 'btn-primary shadow' : 'btn-link text-dark text-decoration-none'}`}
                                    style={viewMode === 'units' ? { backgroundColor: theme.primaryColor, border: 'none' } : {}}
                                    onClick={() => setViewMode('units')}
                                >
                                    Units
                                </button>
                            </div>
                        </div>

                        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
                            {viewMode === 'properties' ? (
                                <ListingView
                                    filteredData={properties}
                                    isFiltered={false}
                                    theme={theme}
                                    widget={website}
                                    widgetId={website.id}
                                    onReset={() => handleFilter({})}
                                    onSelectProperty={onSelectProperty}
                                    colClass="col-md-6"
                                    trackAction={trackAction}
                                    identifyLead={identifyLead}
                                    noContainer={true}
                                    showHeader={false}
                                    currencySymbol={currencySymbol}
                                />
                            ) : (
                                <UnitListingView
                                    units={allUnits}
                                    theme={theme}
                                    widget={website}
                                    onSelectUnit={onSelectUnit}
                                    trackAction={trackAction}
                                    currencySymbol={currencySymbol}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
