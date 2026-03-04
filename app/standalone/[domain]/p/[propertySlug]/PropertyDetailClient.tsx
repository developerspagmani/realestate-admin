'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStandalone } from '../../StandaloneProvider';
import PropertyDetailView from '@/components/modules/realestate/shared/PropertyDetailView';
import ThreeDView from '@/components/modules/realestate/shared/ThreeDView';
import PropertyTour from '@/components/modules/realestate/tour/PropertyTour';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';

type ViewType = 'PROPERTY_DETAIL' | 'THREE_D' | 'TOUR';

export default function PropertyDetailClient({ propertySlug }: { propertySlug: string }) {
    const { website, properties, theme, trackAction, identifyLead, slugOrDomain } = useStandalone();
    const router = useRouter();

    // Find the property in the pre-loaded list by ID or Slug
    const property = properties.find(p => p.id === propertySlug || p.slug === propertySlug);

    const [currentView, setCurrentView] = useState<ViewType>('PROPERTY_DETAIL');
    const [propertyImageIndex, setPropertyImageIndex] = useState(0);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [unitImageIndex, setUnitImageIndex] = useState(0);

    if (!property) return <div className="p-5 text-center">Property not found.</div>;

    const country = property?.country || website?.tenant?.country || 'USA';
    const currencyConfig = getCurrencyConfig(country);
    const currencySymbol = currencyConfig?.symbol || '$';

    const getFormattedPrice = (unit: any) => {
        if (!unit.unitPricing?.length) return 'Price on Inquiry';
        const pricing = unit.unitPricing[0];
        return `${currencySymbol}${Number(pricing.price).toLocaleString('en-US')}`;
    };

    const mapUnitsToSeats = (units: any[]) => {
        return units.map(u => ({
            id: u.id,
            name: u.name || `Unit ${u.unitCode}`,
            slug: u.unitCode || u.id,
            type: (u.unitCategory === 1 ? 'desk' : u.unitCategory === 2 ? 'office' : u.unitCategory === 3 ? 'apartment' : 'villa') as any,
            capacity: u.capacity || (u.realEstateDetails?.bedrooms || 1),
            hourlyRate: Number(u.unitPricing?.[0]?.price || 0),
            status: u.status === 1 ? 'available' : u.status === 2 ? 'occupied' : 'maintenance',
        }));
    };

    const renderContent = () => {
        switch (currentView) {
            case 'THREE_D':
                return (
                    <ThreeDView
                        selectedProperty={property}
                        theme={theme}
                        setCurrentView={setCurrentView as any}
                        setSelectedUnit={setSelectedUnit}
                        mapUnitsToSeats={mapUnitsToSeats as any}
                        currencySymbol={currencySymbol}
                    />
                );
            case 'TOUR':
                return (
                    <div className="container py-5">
                        <div className="glass-panel p-0 rounded-4 overflow-hidden shadow-2xl">
                            <div className="p-4 bg-white border-bottom d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold mb-0">Virtual Reality Tour</h5>
                                    <p className="extra-small text-muted mb-0">{property.title}</p>
                                </div>
                                <button className="btn btn-outline-dark btn-sm rounded-4 px-3" onClick={() => setCurrentView('PROPERTY_DETAIL')}>
                                    <i className="bi bi-arrow-left me-2"></i>Exit Tour
                                </button>
                            </div>
                            <div style={{ height: '70vh' }}>
                                <PropertyTour propertyId={property.id} />
                            </div>
                        </div>
                    </div>
                );
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
