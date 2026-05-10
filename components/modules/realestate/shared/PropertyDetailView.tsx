'use client';

import React, { useState } from 'react';
import GallerySlider from './GallerySlider';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { widgetService } from '@/app/services/api';
import PlotMapViewer from '@/components/modules/realestate/properties/PlotMapViewer';
import { Seats } from '@/types';
import BookingModal from './BookingModal';

interface PropertyDetailViewProps {
    selectedProperty: any;
    propertyImageIndex: number;
    setPropertyImageIndex: (i: number) => void;
    theme: any;
    widget: any;
    widgetId: string;
    colClass: string;
    setCurrentView: (view: any) => void;
    selectedUnit: any;
    setSelectedUnit: (unit: any) => void;
    setUnitImageIndex: (i: number) => void;
    getFormattedPrice: (unit: any) => string;
    trackAction?: (type: string, metadata?: any, identity?: { id?: string, email?: string }) => void;
    identifyLead?: (id: string, email?: string) => void;
    currencySymbol?: string;
    setShowChat?: (show: boolean) => void;
    isChatbotEnabled?: boolean;
}

const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({
    selectedProperty,
    propertyImageIndex,
    setPropertyImageIndex,
    theme,
    widget,
    widgetId,
    colClass,
    setCurrentView,
    selectedUnit,
    setSelectedUnit,
    setUnitImageIndex,
    getFormattedPrice,
    trackAction,
    identifyLead,
    currencySymbol = '$',
    setShowChat = () => { },
    isChatbotEnabled = false
}) => {

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingUnit, setBookingUnit] = useState<any>(null);
    const [unitSearch, setUnitSearch] = useState('');
    const [unitStatusFilter, setUnitStatusFilter] = useState('');

    const images = [
        ...(selectedProperty.mainImage ? [selectedProperty.mainImage] : []),
        ...(selectedProperty.gallery || []).filter((g: any) => {
            if (!selectedProperty.mainImage) return true;
            const gUrl = typeof g === 'string' ? g : g?.url || '';
            const gId = typeof g === 'string' ? g : g?.id || '';
            return gId !== selectedProperty.mainImage.id && gUrl !== selectedProperty.mainImage.url;
        })
    ];

    return (
        <div className="container">
            <div className="property-detail animate-fade-up widget-container p-4">
                <button className="btn btn-link text-decoration-none text-muted mb-4 p-0 small fw-bold" onClick={() => setCurrentView('LISTING')}>
                    <i className="bi bi-chevron-left me-1"></i> Back to All Properties
                </button>

                <div className="row g-4">
                    <div className="col-lg-7">
                        <GallerySlider images={images} currentIndex={propertyImageIndex} setCurrentIndex={setPropertyImageIndex} />
                    </div>

                    <div className="col-lg-5">
                        <div className="glass-panel p-4 rounded-4 d-flex flex-column justify-content-between">
                            <div>
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                    <h3 className="fw-bold mb-0" style={{ color: theme.primaryColor }}>{selectedProperty.title}</h3>
                                    {(widget.configuration.bookingForm?.enabled || widget.configuration.builder?.enableBooking !== false) && (
                                        <button
                                            className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm d-md-none"
                                            style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                                            onClick={() => setShowBookingModal(true)}
                                        >
                                            Reserve
                                        </button>
                                    )}
                                </div>
                                <p className="text-muted small mb-4 d-flex align-items-center">
                                    <i className="bi bi-geo-alt-fill me-2 text-primary" style={{ color: theme.primaryColor }}></i>
                                    {selectedProperty.addressLine1}, {selectedProperty.city}
                                </p>

                                <div className="row g-3 mb-4">
                                    <div className="col-6">
                                        <div className="feature-box p-3">
                                            <span className="d-block text-muted extra-small">Category</span>
                                            <span className="fw-bold text-capitalize small">
                                                {selectedProperty.propertyType === 1 ? 'Residential' :
                                                    selectedProperty.propertyType === 2 ? 'Commercial' :
                                                        selectedProperty.propertyType === 3 ? 'Industrial' :
                                                            selectedProperty.propertyType === 4 ? 'Mixed Use' : 'Residential'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="feature-box p-3">
                                            <span className="d-block text-muted extra-small">Internal Area</span>
                                            <span className="fw-bold small">{selectedProperty.area?.toLocaleString('en-US') || 0} sqft</span>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="feature-box p-3">
                                            <span className="d-block text-muted extra-small">Built In</span>
                                            <span className="fw-bold small">{selectedProperty.yearBuilt || '2024'}</span>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="feature-box p-3">
                                            <span className="d-block text-muted extra-small">Listing Mode</span>
                                            <span className="badge bg-primary rounded-4 extra-small px-3 mt-1" style={{ backgroundColor: theme.primaryColor }}>{selectedProperty.listingType || 'Rent'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>



                            {(widget.configuration.bookingForm?.enabled || widget.configuration.builder?.enableBooking !== false) && (
                                <button
                                    className="btn btn-dark w-100 rounded-4 py-3 shadow-lg d-flex align-items-center justify-content-center gap-3 mt-3 transition-all hover:translate-y-[-2px]"
                                    onClick={() => {
                                        setBookingUnit(null);
                                        setShowBookingModal(true);
                                        if (trackAction) trackAction('BOOKING_STEP_START', { propertyId: selectedProperty.id });
                                    }}
                                    style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                                >
                                    <i className="bi bi-calendar-plus fs-5"></i>
                                    <span className="fw-bold">Reserve Property Now</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-12 mt-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4">
                            <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: theme.primaryColor }}>
                                <i className="bi bi-info-circle me-2 text-primary" style={{ color: theme.primaryColor }}></i>
                                Property Description
                            </h5>
                            <div className="text-dark lh-lg mb-4 small description-content" dangerouslySetInnerHTML={{ __html: selectedProperty.description || '' }} />

                            <hr className="opacity-10 my-4" />

                            <div className="row g-4">
                                <div className="col-md-6">
                                    <h6 className="fw-bold small mb-3">Key Details</h6>
                                    <div className="d-flex flex-wrap gap-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-light p-2 rounded-3 text-primary"><i className="bi bi-geo-fill"></i></div>
                                            <div>
                                                <span className="d-block extra-small text-muted">Neighborhood</span>
                                                <span className="fw-bold small">{selectedProperty.neighborhood || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-light p-2 rounded-3 text-primary"><i className="bi bi-p-square-fill"></i></div>
                                            <div>
                                                <span className="d-block extra-small text-muted">Parking</span>
                                                <span className="fw-bold small">{selectedProperty.parkingSpaces || 0} Spaces</span>
                                            </div>
                                        </div>
                                        {selectedProperty.propertyType === 1 && (
                                            <>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-light p-2 rounded-3 text-primary" style={{ color: theme.primaryColor }}><i className="bi bi-droplet-fill"></i></div>
                                                    <div>
                                                        <span className="d-block extra-small text-muted">Bedrooms</span>
                                                        <span className="fw-bold small">{selectedProperty.bedrooms || 0} Beds</span>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-light p-2 rounded-3 text-primary" style={{ color: theme.primaryColor }}><i className="bi bi-water text-primary"></i></div>
                                                    <div>
                                                        <span className="d-block extra-small text-muted">Bathrooms</span>
                                                        <span className="fw-bold small">{selectedProperty.bathrooms || 0} Baths</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {selectedProperty.propertyType === 2 && (
                                            <>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-light p-2 rounded-3 text-primary" style={{ color: theme.primaryColor }}><i className="bi bi-box-seam"></i></div>
                                                    <div>
                                                        <span className="d-block extra-small text-muted">Pantry</span>
                                                        <span className="fw-bold small">{selectedProperty.pantryType || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-light p-2 rounded-3 text-primary" style={{ color: theme.primaryColor }}><i className="bi bi-door-closed"></i></div>
                                                    <div>
                                                        <span className="d-block extra-small text-muted">Washroom</span>
                                                        <span className="fw-bold small">{selectedProperty.washroomType || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {selectedProperty.lotSize && (
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-light p-2 rounded-3 text-primary" style={{ color: theme.primaryColor }}><i className="bi bi-aspect-ratio text-primary"></i></div>
                                                <div>
                                                    <span className="d-block extra-small text-muted">Lot Size</span>
                                                    <span className="fw-bold small">{selectedProperty.lotSize?.toLocaleString('en-US')} sqft</span>
                                                </div>
                                            </div>
                                        )}
                                        {selectedProperty.camCharges > 0 && (
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-light p-2 rounded-3 text-primary" style={{ color: theme.primaryColor }}><i className="bi bi-cash-stack"></i></div>
                                                <div>
                                                    <span className="d-block extra-small text-muted">CAM Charges</span>
                                                    <span className="fw-bold small">{currencySymbol}{selectedProperty.camCharges?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}
                                        {(selectedProperty.listingType?.toLowerCase() === 'rent' || selectedProperty.listingType?.toLowerCase() === 'lease') && selectedProperty.leaseTenure > 0 && (
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-light p-2 rounded-3 text-primary" style={{ color: theme.primaryColor }}><i className="bi bi-calendar-check"></i></div>
                                                <div>
                                                    <span className="d-block extra-small text-muted">Lease Tenure</span>
                                                    <span className="fw-bold small">{selectedProperty.leaseTenure} Years</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-bold small mb-3">Property Amenities</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {selectedProperty.propertyAmenities?.map((pa: any) => (
                                            <span key={pa.amenityId} className="badge bg-light text-dark border px-3 py-2 fw-medium rounded-3">
                                                <i className={`bi ${pa.amenity.icon || 'bi-check-circle'} me-2 text-primary`} style={{ color: theme.primaryColor }}></i>
                                                {pa.amenity.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-12 mt-4">
                                    <h6 className="fw-bold small mb-3">Features & Specifications</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {selectedProperty.vaastuCompliant && <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-bold rounded-pill"><i className="bi bi-compass me-2"></i>Vaastu Compliant</span>}
                                        {selectedProperty.allInclusivePrice && <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fw-bold rounded-pill">All-inclusive Price</span>}
                                        {selectedProperty.priceNegotiable && <span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 fw-bold rounded-pill">Negotiable</span>}
                                        {selectedProperty.reservedParking && <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 fw-bold rounded-pill"><i className="bi bi-p-circle me-2"></i>Reserved Parking</span>}
                                        {selectedProperty.facing && <span className="badge bg-light text-dark border px-3 py-2 fw-medium rounded-pill">Facing: {selectedProperty.facing}</span>}
                                        {selectedProperty.flooring && <span className="badge bg-light text-dark border px-3 py-2 fw-medium rounded-pill">Flooring: {selectedProperty.flooring}</span>}
                                        {selectedProperty.furnishing && <span className="badge bg-light text-dark border px-3 py-2 fw-medium rounded-pill">{selectedProperty.furnishing}</span>}
                                        {(selectedProperty.extraRooms || []).map((room: string) => (
                                            <span key={room} className="badge bg-light text-dark border px-3 py-2 fw-medium rounded-pill">{room}</span>
                                        ))}
                                        {(selectedProperty.propertyFeatures || []).map((feature: string) => (
                                            <span key={feature} className="badge bg-light text-dark border px-3 py-2 fw-medium rounded-pill">{feature}</span>
                                        ))}
                                    </div>
                                </div>

                                {(selectedProperty.floorPlan || selectedProperty.brochure) && (
                                    <div className="col-12 mt-2">
                                        <h6 className="fw-bold small mb-3">Documents & Floor Plans</h6>
                                        <div className="d-flex flex-wrap gap-3">
                                            {selectedProperty.floorPlan && (
                                                <a
                                                    href={selectedProperty.floorPlan.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-outline-primary d-flex align-items-center gap-2 rounded-3 px-4 py-2 small fw-bold"
                                                    style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                                                    onClick={() => trackAction && trackAction('FLOOR_PLAN_VIEW', { propertyId: selectedProperty.id })}
                                                >
                                                    <i className="bi bi-map-fill"></i>
                                                    View Floor Plan
                                                </a>
                                            )}
                                            {selectedProperty.brochure && (
                                                <a
                                                    href={selectedProperty.brochure.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-outline-dark d-flex align-items-center gap-2 rounded-3 px-4 py-2 small fw-bold"
                                                    onClick={() => trackAction && trackAction('BROCHURE_DOWNLOAD', { propertyId: selectedProperty.id })}
                                                >
                                                    <i className="bi bi-file-earmark-pdf-fill"></i>
                                                    Download Brochure
                                                </a>
                                            )}
                                            {isChatbotEnabled && (
                                                <button
                                                    onClick={() => setShowChat(true)}
                                                    className="btn btn-dark d-flex align-items-center gap-2 rounded-3 px-4 py-2 small fw-bold animate-pulse"
                                                    style={{ backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }}
                                                >
                                                    <i className="bi bi-robot"></i>
                                                    Chat with AI Expert
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {selectedProperty.metadata?.interactiveSvg && (
                        <div className="col-12 mt-5">
                            <div className="interactive-plot-container position-relative p-[2px] rounded-4 overflow-hidden mb-5 shadow-lg">
                                <div className="border-trace"></div>
                                <div className="glass-panel p-4 rounded-4 shadow-sm position-relative bg-white" style={{ zIndex: 2 }}>
                                    <h5 className="fw-bold mb-4 d-flex align-items-center justify-content-between" style={{ color: theme.primaryColor }}>
                                        <span>
                                            <i className="bi bi-map-fill me-2"></i>
                                            Interactive Property Plot Layout
                                        </span>
                                    </h5>
                                    <div style={{ height: 'min(1200px, 90vh)', width: '100%' }}>
                                        <PlotMapViewer
                                            units={(selectedProperty.units || []).map((u: any) => {
                                                let statusStr = 'available';
                                                if (typeof u.status === 'string' && u.status.length > 0) {
                                                    statusStr = u.status.toLowerCase().trim();
                                                } else {
                                                    const statusNum = Number(u.status);
                                                    if (statusNum === 2) statusStr = 'occupied';
                                                    else if (statusNum === 3) statusStr = 'maintenance';
                                                    else if (statusNum === 4) statusStr = 'sold';
                                                }
                                                return {
                                                    id: u.id,
                                                    unitCode: u.unitCode,
                                                    name: u.unitCode || u.name || `Unit ${u.id.substring(0, 4)}`,
                                                    status: statusStr,
                                                    price: u.unitPricing?.[0]?.price || 0,
                                                    sizeSqft: u.sizeSqft || 0
                                                } as any;
                                            })}
                                            svgContent={selectedProperty.metadata.interactiveSvg}
                                            mapping={selectedProperty.metadata.svgMapping || {}}
                                            themeColor={theme.primaryColor}
                                            currencySymbol={currencySymbol}
                                            onUnitSelect={(id) => {
                                                const unit = selectedProperty.units?.find((u: any) => u.id === id);
                                                if (unit) {
                                                    setSelectedUnit(unit);
                                                    setUnitImageIndex(0);
                                                    setCurrentView('UNIT_DETAIL');
                                                    if (trackAction) trackAction('UNIT_VIEW', { unitId: unit.id, propertyId: selectedProperty.id });
                                                }
                                            }}
                                            onBookingSelect={(id) => {
                                                const unit = selectedProperty.units?.find((u: any) => u.id === id);
                                                if (unit) {
                                                    setBookingUnit(unit);
                                                    setShowBookingModal(true);
                                                    if (trackAction) trackAction('UNIT_BOOKING_START', { unitId: unit.id, propertyId: selectedProperty.id });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="mt-4 d-flex gap-4 justify-content-center p-3 bg-light rounded-4 border">
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="rounded-circle shadow-sm" style={{ width: '14px', height: '14px', background: '#4ade80', border: '2px solid #16a34a' }}></div>
                                            <span className="small fw-bold text-dark">Available</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="rounded-circle shadow-sm" style={{ width: '14px', height: '14px', background: '#fb7185', border: '2px solid #e11d48' }}></div>
                                            <span className="small fw-bold text-dark">Reserved</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="rounded-circle shadow-sm" style={{ width: '14px', height: '14px', background: '#ef4444', border: '2px solid #b91c1c' }}></div>
                                            <span className="small fw-bold text-dark">Sold Out</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="rounded-circle shadow-sm" style={{ width: '14px', height: '14px', background: '#94a3b8', border: '2px solid #475569' }}></div>
                                            <span className="small fw-bold text-dark">Maintenance</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <style jsx>{`
                        .interactive-plot-container {
                            padding: 5px;
                            transition: all 5s ease;
                        }

                        .interactive-plot-container:hover {
                            transform: translateY(-5px);
                            box-shadow: 0 1rem 3rem rgba(0,0,0,0.175) !important;
                        }
                        
                        .border-trace {
                            position: absolute;
                            top: -100%;
                            left: -100%;
                            width: 300%;
                            height: 300%;
                            background: conic-gradient(
                                from 0deg,
                                transparent 0%,
                                transparent 70%,
                                ${theme.primaryColor} 90%,
                                transparent 100%
                            );
                            animation: rotate-border 5s linear infinite;
                            z-index: 1;
                            opacity: 0.7;
                        }

                        .interactive-plot-container:hover .border-trace {
                            opacity: 1;
                            animation-duration: 3s;
                        }

                        @keyframes rotate-border {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }

                        .glass-panel {
                            position: relative;
                            z-index: 2;
                        }

                        .description-content :global(*) {
                            color: #333 !important;
                        }
                    `}</style>

                    <div className="col-12 mt-5">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                            <h4 className="fw-bold mb-0">Unit Availability</h4>
                            <div className="d-flex gap-2 flex-grow-1 flex-md-grow-0" style={{ maxWidth: '600px' }}>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text bg-white border-end-0 rounded-start-4 ps-3">
                                        <i className="bi bi-search text-muted"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 rounded-end-0 py-2"
                                        placeholder="Search unit name or code..."
                                        onChange={(e) => setUnitSearch(e.target.value)}
                                        value={unitSearch}
                                    />
                                    <select
                                        className="form-select border-start-0 rounded-end-4 py-2"
                                        style={{ maxWidth: '140px' }}
                                        onChange={(e) => setUnitStatusFilter(e.target.value)}
                                        value={unitStatusFilter}
                                    >
                                        <option value="">All Status</option>
                                        <option value="1">Available</option>
                                        <option value="2">Reserved</option>
                                        <option value="4">Sold Out</option>
                                        <option value="3">Maintenance</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="row g-3">
                            {(() => {
                                let units = selectedProperty.units || [];

                                if (unitSearch) {
                                    const s = unitSearch.toLowerCase();
                                    units = units.filter((u: any) =>
                                        (u.name || '').toLowerCase().includes(s) ||
                                        (u.unitCode || '').toLowerCase().includes(s)
                                    );
                                }

                                if (unitStatusFilter) {
                                    units = units.filter((u: any) => String(u.status) === String(unitStatusFilter));
                                }

                                if (units.length === 0) {
                                    return (
                                        <div className="col-12 text-center py-5 bg-light rounded-4">
                                            <i className="bi bi-door-closed fs-1 text-muted opacity-25 d-block mb-2"></i>
                                            <p className="text-muted small mb-0">No units found matching your search.</p>
                                            <button className="btn btn-link btn-sm mt-1" onClick={() => { setUnitSearch(''); setUnitStatusFilter(''); }}>Clear Filters</button>
                                        </div>
                                    );
                                }

                                return units.map((unit: any) => (
                                    <div key={unit.id} className={colClass}>
                                        <div
                                            className="card border-0 shadow-sm rounded-4 h-100 feature-box p-0 cursor-pointer overflow-hidden transition-all hover:translate-y-[-4px]"
                                            onClick={() => {
                                                setSelectedUnit(unit);
                                                setUnitImageIndex(0);
                                                setCurrentView('UNIT_DETAIL');
                                                if (trackAction) trackAction('UNIT_VIEW', { unitId: unit.id, propertyId: selectedProperty.id });
                                            }}
                                        >
                                            <div className="bg-light position-relative" style={{ height: '240px' }}>
                                                {unit.mainImage ? (
                                                    <img src={unit.mainImage.url} alt={unit.unitCode} className="w-100 h-100 object-fit-cover" />
                                                ) : (
                                                    <div className="h-100 d-flex align-items-center justify-content-center opacity-25"><i className="bi bi-door-closed fs-1"></i></div>
                                                )}
                                                <div className="position-absolute top-0 end-0 m-2">
                                                    {(() => {
                                                        const statusNum = Number(unit.status);
                                                        if (statusNum === 2) return <span className="badge bg-warning text-dark border-0 shadow-sm px-3 rounded-pill">Reserved</span>;
                                                        if (statusNum === 3) return <span className="badge bg-secondary text-white border-0 shadow-sm px-3 rounded-pill">Maintenance</span>;
                                                        if (statusNum === 4) return <span className="badge bg-danger text-white border-0 shadow-sm px-3 rounded-pill">Sold Out</span>;
                                                        return <span className="badge bg-success text-white border-0 shadow-sm px-3 rounded-pill">Available</span>;
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <h6 className="fw-bold mb-0 text-truncate" style={{ color: theme.primaryColor }}>{unit.name || `${unit.unitCode}`}</h6>
                                                    {widget.configuration.builder?.showPrice !== false && (
                                                        <span className="fw-bold extra-small text-primary" style={{ color: theme.primaryColor }}>
                                                            {getFormattedPrice(unit)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="d-flex gap-2 mb-3">
                                                    <span className="extra-small text-muted"><i className="bi bi-bed me-1"></i>{unit.realEstateDetails?.bedrooms || 0} Bed</span>
                                                    <span className="extra-small text-muted"><i className="bi bi-arrows-fullscreen me-1"></i>{unit.sizeSqft || 0} sqft</span>
                                                    <span className="extra-small text-muted"><i className="bi bi-bath me-1"></i>{unit.realEstateDetails?.bathrooms || 0} Bath</span>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm flex-grow-1 rounded-4 extra-small fw-bold"
                                                        style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                                                    >
                                                        View Details
                                                    </button>
                                                    {(widget.configuration.bookingForm?.enabled || widget.configuration.builder?.enableBooking !== false) && Number(unit.status) === 1 && (
                                                        <button
                                                            className="btn btn-dark btn-sm flex-grow-1 rounded-4 extra-small fw-bold"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setBookingUnit(unit);
                                                                setShowBookingModal(true);
                                                                if (trackAction) trackAction('UNIT_BOOKING_START', { unitId: unit.id, propertyId: selectedProperty.id });
                                                            }}
                                                        >
                                                            Reserve Now
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {(() => {
                        const inquiryConfig = (widget.configuration?.inquiryForm?.useMarketingForm && widget.configuration?.inquiryForm?.marketingFormId)
                            ? widget.configuration.inquiryForm
                            : (widget.configuration.inquiryForm && widget.configuration.inquiryForm.enabled)
                                ? widget.configuration.inquiryForm
                                : (widget.configuration.builder?.showInquiry !== false ? {
                                    enabled: true,
                                    title: 'Property Inquiry',
                                    description: 'Send us a message about this property and we will get back to you shortly.',
                                    submitButtonLabel: 'Submit Inquiry',
                                    fields: [
                                        { id: 'f1', type: 'text', label: 'Full Name', required: true, placeholder: 'Your Name' },
                                        { id: 'f2', type: 'email', label: 'Email Address', required: true, placeholder: 'email@example.com' },
                                        { id: 'f3', type: 'phone', label: 'Phone Number', required: false, placeholder: '+1 234 567 890' },
                                        { id: 'f4', type: 'textarea', label: 'Message', required: true, placeholder: 'I am interested in this property...' }
                                    ]
                                } : null);

                        if (!inquiryConfig || !inquiryConfig.enabled) return null;

                        return (
                            <div className="col-12 mt-5">
                                <div className="glass-panel p-4 rounded-4 inquiry-form-container border-primary border-opacity-25" style={{ borderLeft: `4px solid ${theme.primaryColor}` }}>
                                    <h5 className="fw-bold mb-4 d-flex align-items-center">
                                        <i className="bi bi-chat-left-dots-fill me-2 text-primary" style={{ color: theme.primaryColor }}></i>
                                        Direct Inquiry
                                    </h5>
                                    <FormRenderer
                                        config={inquiryConfig}
                                        primaryColor={theme.primaryColor}
                                        onInteraction={() => trackAction && trackAction('FORM_INIT', { type: 'property-inquiry', propertyId: selectedProperty.id })}
                                        onSubmit={async (formData, configUsed) => {
                                            const leadPayload: any = {
                                                source: 1,
                                                propertyId: selectedProperty.id,
                                                notes: `Property Inquiry for ${selectedProperty.title}\n${(configUsed.fields || []).map((f: any) => `${f.label}: ${formData[f.id] || 'N/A'}`).join('\n')}`
                                            };

                                            (configUsed.fields || []).forEach((field: any) => {
                                                const val = formData[field.id];
                                                if (!val) return;
                                                if (field.type === 'email' && !leadPayload.email) leadPayload.email = val;
                                                else if (field.type === 'phone' && !leadPayload.phone) leadPayload.phone = val;
                                                else if ((field.type === 'text' || field.id === 'f1') && !leadPayload.name) leadPayload.name = val;
                                                else if (field.id === 'f2' && !leadPayload.email) leadPayload.email = val;
                                            });

                                            if (!leadPayload.name) leadPayload.name = 'Property Interest';
                                            const res = await widgetService.createPublicLead(widgetId, leadPayload, !!widget.slug);

                                            if (res.success && res.data?.id) {
                                                const identity = { id: res.data.id, email: res.data.email };
                                                if (identifyLead) identifyLead(identity.id, identity.email);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>



            <BookingModal
                show={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                widget={widget}
                widgetId={widgetId}
                selectedProperty={selectedProperty}
                selectedUnit={bookingUnit || selectedUnit}
                theme={theme}
                identifyLead={identifyLead}
            />
        </div>
    );
};

export default PropertyDetailView;
