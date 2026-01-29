'use client';

import React from 'react';
import GallerySlider from './GallerySlider';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { widgetService } from '@/app/services/api';

interface PropertyDetailViewProps {
    selectedProperty: any;
    propertyImageIndex: number;
    setPropertyImageIndex: (i: number) => void;
    theme: any;
    widget: any;
    widgetId: string;
    colClass: string;
    setCurrentView: (view: any) => void;
    setSelectedUnit: (unit: any) => void;
    setUnitImageIndex: (i: number) => void;
    getFormattedPrice: (unit: any) => string;
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
    setSelectedUnit,
    setUnitImageIndex,
    getFormattedPrice
}) => {
    const images = [
        ...(selectedProperty.mainImage ? [selectedProperty.mainImage] : []),
        ...(selectedProperty.gallery || []).filter((g: any) => g.id !== selectedProperty.mainImage?.id && g.url !== selectedProperty.mainImage?.url)
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
                        <div className="glass-panel p-4 rounded-4 h-100 d-flex flex-column justify-content-between">
                            <div>
                                <h3 className="fw-bold mb-1">{selectedProperty.title}</h3>
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
                                            <span className="fw-bold small">{selectedProperty.area?.toLocaleString() || 0} sqft</span>
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
                                            <span className="badge bg-primary rounded-pill extra-small px-3 mt-1" style={{ backgroundColor: theme.primaryColor }}>{selectedProperty.listingType || 'Rent'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {widget.configuration.workspace3D?.enabled && selectedProperty.workspace3D && (
                                <button
                                    className="btn btn-dark w-100 rounded-pill py-3 shadow-lg d-flex align-items-center justify-content-center gap-3 mb-3"
                                    onClick={() => setCurrentView('THREE_D')}
                                >
                                    <i className="bi bi-box-seam fs-5"></i>
                                    <span className="fw-bold">Interactive Layout Explorer</span>
                                </button>
                            )}

                            <button
                                className="btn btn-primary w-100 rounded-pill py-3 shadow-lg d-flex align-items-center justify-content-center gap-3 transition-all hover:translate-y-[-2px]"
                                style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                                onClick={() => setCurrentView('TOUR')}
                            >
                                <i className="bi bi-view-stacked fs-5"></i>
                                <span className="fw-bold">Experience Full 3D Walkthrough</span>
                            </button>
                        </div>
                    </div>

                    <div className="col-12 mt-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4">
                            <h5 className="fw-bold mb-3 d-flex align-items-center">
                                <i className="bi bi-info-circle me-2 text-primary" style={{ color: theme.primaryColor }}></i>
                                Property Description
                            </h5>
                            <p className="text-muted lh-lg mb-4 small">{selectedProperty.description}</p>

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
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-light p-2 rounded-3 text-primary"><i className="bi bi-droplet-fill"></i></div>
                                            <div>
                                                <span className="d-block extra-small text-muted">Bedrooms</span>
                                                <span className="fw-bold small">{selectedProperty.bedrooms || 0} Beds</span>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-light p-2 rounded-3 text-primary"><i className="bi bi-water text-primary"></i></div>
                                            <div>
                                                <span className="d-block extra-small text-muted">Bathrooms</span>
                                                <span className="fw-bold small">{selectedProperty.bathrooms || 0} Baths</span>
                                            </div>
                                        </div>
                                        {selectedProperty.lotSize && (
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-light p-2 rounded-3 text-primary"><i className="bi bi-aspect-ratio text-primary"></i></div>
                                                <div>
                                                    <span className="d-block extra-small text-muted">Lot Size</span>
                                                    <span className="fw-bold small">{selectedProperty.lotSize?.toLocaleString()} sqft</span>
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
                                                >
                                                    <i className="bi bi-file-earmark-pdf-fill"></i>
                                                    Download Brochure
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-12 mt-4">
                        <h4 className="fw-bold mb-4">Unit Availability</h4>
                        <div className="row g-3">
                            {selectedProperty.units?.map((unit: any) => (
                                <div key={unit.id} className={colClass}>
                                    <div
                                        className="card border-0 shadow-sm rounded-4 h-100 feature-box p-0 cursor-pointer overflow-hidden"
                                        onClick={() => {
                                            setSelectedUnit(unit);
                                            setUnitImageIndex(0);
                                            setCurrentView('UNIT_DETAIL');
                                        }}
                                    >
                                        <div className="bg-light" style={{ height: '120px' }}>
                                            {unit.mainImage ? (
                                                <img src={unit.mainImage.url} alt={unit.unitCode} className="w-100 h-100 object-fit-cover" />
                                            ) : (
                                                <div className="h-100 d-flex align-items-center justify-content-center opacity-25"><i className="bi bi-door-closed fs-1"></i></div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="fw-extrabold text-primary" style={{ color: theme.primaryColor }}>
                                                    {getFormattedPrice(unit)}
                                                </span>
                                                <span className="badge bg-success bg-opacity-10 text-success extra-small">Available</span>
                                            </div>
                                            <h6 className="fw-bold mb-1 text-truncate">{unit.name || `Unit ${unit.unitCode}`}</h6>
                                            <div className="d-flex gap-2 mb-3">
                                                <span className="extra-small text-muted"><i className="bi bi-bed me-1"></i>{unit.realEstateDetails?.bedrooms || 0} Bed</span>
                                                <span className="extra-small text-muted"><i className="bi bi-arrows-fullscreen me-1"></i>{unit.sizeSqft || 0} sqft</span>
                                            </div>
                                            <button className="btn btn-outline-primary btn-sm w-100 rounded-pill extra-small fw-bold" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
                                                View Unit Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {widget.configuration.inquiryForm?.enabled && (
                        <div className="col-12 mt-5">
                            <div className="glass-panel p-4 rounded-4 inquiry-form-container border-primary border-opacity-25" style={{ borderLeft: `4px solid ${theme.primaryColor}` }}>
                                <h5 className="fw-bold mb-4 d-flex align-items-center">
                                    <i className="bi bi-chat-left-dots-fill me-2 text-primary" style={{ color: theme.primaryColor }}></i>
                                    Direct Inquiry
                                </h5>
                                <FormRenderer
                                    config={widget.configuration.inquiryForm}
                                    primaryColor={theme.primaryColor}
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
                                        await widgetService.createPublicLead(widgetId, leadPayload);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PropertyDetailView;
