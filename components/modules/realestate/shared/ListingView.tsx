'use client';

import React from 'react';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { widgetService } from '@/app/services/api';
import ImageModal from './ImageModal';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';
import DiscoveryFilter from './DiscoveryFilter';

interface ListingViewProps {
    filteredData: any[];
    isFiltered: boolean;
    colClass: string;
    theme: any;
    widget: any;
    widgetId: string;
    onReset: () => void;
    onSelectProperty: (property: any) => void;
    onFilter?: (filters: any) => void;
    trackAction?: (type: string, metadata?: any, identity?: { id?: string, email?: string }) => void;
    identifyLead?: (id: string, email?: string) => void;
    noContainer?: boolean;
    showHeader?: boolean;
}

const ListingView: React.FC<ListingViewProps> = ({
    filteredData,
    theme,
    widget,
    widgetId,
    onReset,
    onSelectProperty,
    onFilter,
    trackAction,
    colClass: propColClass,
    noContainer = false,
    showHeader = true
}) => {
    const [showPopup, setShowPopup] = React.useState(false);
    const [popupImageUrl, setPopupImageUrl] = React.useState('');

    // Dynamic Column Calculation
    const gridCols = widget?.configuration?.builder?.columns || widget?.configuration?.display?.columns || 3;
    const strategy = widget?.configuration?.builder?.gridStrategy || 'grid';

    const resolvedColClass = propColClass || (strategy === 'list' ? 'col-12' :
        gridCols === 1 ? 'col-12' :
            gridCols === 2 ? 'col-md-6' :
                gridCols === 3 ? 'col-md-6 col-lg-4' :
                    'col-md-6 col-lg-3');

    const getSymbol = (_propertyCountry?: string) => {
        // Priority: 1) Tenant's explicit currency setting, 2) Tenant's country, 3) Property country (last resort)
        // We intentionally do NOT use propertyCountry as the primary source — it caused issues
        // when a property in Germany showed €, even though the tenant had configured AED/INR/etc.
        const baseCurrency = widget?.tenant?.settings?.general?.currency;
        const tenantCountry = widget?.tenant?.country;
        const input = baseCurrency || tenantCountry || _propertyCountry || 'USA';
        const config = getCurrencyConfig(input);
        return config?.symbol || '$';
    };

    return (
        <div className={`${noContainer ? 'py-2' : 'container py-4'} widget-container overflow-hidden`}>
            <div className="row g-4">
                {showHeader && (
                    <div className="col-12 mb-2 d-flex justify-content-between align-items-center animate-fade-up">
                        <div>
                            <h4 className="fw-bold mb-0" style={{ color: theme.primaryColor }}>Discover Premium Properties</h4>
                            <p className="small mb-0 text-dark">Exclusive listings curated for your needs</p>
                        </div>
                    </div>
                )}

                {onFilter && (
                    <div className="col-12 animate-fade-up">
                        <DiscoveryFilter onFilter={onFilter} theme={theme} />
                    </div>
                )}

                {!filteredData || filteredData.length === 0 ? (
                    <div className="col-12 text-center py-5">
                        <i className="bi bi-search fs-1 text-muted opacity-25 d-block mb-3"></i>
                        <h5 className="text-dark">No properties found matching your criteria.</h5>
                        <button className="btn btn-link" onClick={onReset}>Clear all filters</button>
                    </div>
                ) : (
                    filteredData.map((property: any) => (
                        <div key={property.id} className={`${resolvedColClass} animate-fade-up`}>
                            <div
                                className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 property-card transition-all cursor-pointer"
                                onClick={() => onSelectProperty(property)}
                            >
                                <div className="position-relative overflow-hidden" style={{ height: '240px' }}>
                                    {property.mainImage ? (
                                        <>
                                            <img
                                                src={property.mainImage.url}
                                                alt={property.title}
                                                className="w-100 h-100 object-fit-cover"
                                            />
                                            <div className="property-overlay">
                                                <div className="btn btn-white btn-sm rounded-circle shadow-sm" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPopupImageUrl(property.mainImage.url);
                                                    setShowPopup(true);
                                                }}>
                                                    <i className="bi bi-arrows-angle-expand"></i>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-100 bg-light d-flex align-items-center justify-content-center">
                                            <i className="bi bi-building fs-1 text-muted opacity-25"></i>
                                        </div>
                                    )}
                                    <div className="position-absolute bottom-0 end-0 m-3 px-3 py-1 bg-white rounded-pill shadow-sm small fw-bold text-primary">
                                        {property.units?.length || 0} Total Units
                                    </div>
                                    {property.displayPrice !== false && widget.configuration.builder?.showPrice !== false && Number(property.price) > 0 && (
                                        <div className="position-absolute bottom-0 start-0 m-3 px-3 py-1 bg-white rounded-pill shadow-sm small fw-bold text-primary">
                                            {getSymbol(property.country)}{Number(property.price).toLocaleString('en-US')}
                                        </div>
                                    )}
                                </div>
                                <div className="card-body p-4">
                                    <h5 className="fw-bold mb-2 text-truncate" style={{ color: theme.primaryColor }}>{property.title}</h5>
                                    <p className="small text-muted mb-3 d-flex align-items-center">
                                        <i className="bi bi-geo-alt-fill me-2 text-primary" style={{ color: theme.primaryColor }}></i>
                                        {property.city}, {property.state}
                                    </p>
                                    <div className="d-flex gap-3 mb-4 text-center">
                                        <div className="flex-fill border-end">
                                            <span className="d-block fw-bold small">{property.area?.toLocaleString('en-US') || '--'}</span>
                                            <span className="extra-small text-muted">sqft</span>
                                        </div>
                                        <div className="flex-fill border-end">
                                            <span className="d-block fw-bold small">{property.yearBuilt || '2024'}</span>
                                            <span className="extra-small text-muted">Built</span>
                                        </div>
                                        <div className="flex-fill">
                                            <span className="d-block fw-bold small text-capitalize">{property.listingType || 'Rent'}</span>
                                            <span className="extra-small text-muted">Type</span>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-outline-primary flex-grow-1 rounded-4 py-2 shadow-sm fw-bold"
                                            style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (trackAction) trackAction('PROPERTY_DETAIL_VIEW', { propertyId: property.id, title: property.title });
                                                onSelectProperty(property);
                                            }}
                                        >
                                            Details
                                        </button>
                                        {(widget.configuration.bookingForm?.enabled || widget.configuration.builder?.enableBooking) && (
                                            <button
                                                className="btn btn-dark flex-grow-1 rounded-4 py-2 shadow-sm fw-bold"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (trackAction) trackAction('RESERVE_CLICK', { propertyId: property.id, title: property.title });
                                                    onSelectProperty(property);
                                                }}
                                            >
                                                Reserve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ImageModal
                show={showPopup}
                imageUrl={popupImageUrl}
                onClose={() => setShowPopup(false)}
            />

            <style jsx>{`
                .property-card {
                    backface-visibility: hidden;
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
                }
                .property-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                }
                .property-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.2);
                    opacity: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.3s ease;
                }
                .property-card:hover .property-overlay {
                    opacity: 1;
                }
                .floating-badge {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(4px);
                    padding: 4px 12px;
                    border-radius: 50px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    );
};

export default ListingView;
