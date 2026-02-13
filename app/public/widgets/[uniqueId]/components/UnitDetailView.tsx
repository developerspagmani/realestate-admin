'use client';

import React from 'react';
import GallerySlider from './GallerySlider';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { widgetService } from '@/app/services/api';
import BookingModal from './BookingModal';

interface UnitDetailViewProps {
    selectedUnit: any;
    selectedProperty: any;
    unitImageIndex: number;
    setUnitImageIndex: (i: number) => void;
    theme: any;
    widget: any;
    widgetId: string;
    setCurrentView: (view: any) => void;
    getFormattedPrice: (unit: any) => string;
    trackAction?: (type: string, metadata?: any, identity?: { id?: string, email?: string }) => void;
    identifyLead?: (id: string, email?: string) => void;
}

const UnitDetailView: React.FC<UnitDetailViewProps> = ({
    selectedUnit,
    selectedProperty,
    unitImageIndex,
    setUnitImageIndex,
    theme,
    widget,
    widgetId,
    setCurrentView,
    getFormattedPrice,
    trackAction,
    identifyLead
}) => {
    const [showBookingModal, setShowBookingModal] = React.useState(false);
    const uImages = [
        ...(selectedUnit.mainImage ? [selectedUnit.mainImage] : []),
        ...(selectedUnit.gallery || []).filter((g: any) => g.id !== selectedUnit.mainImage?.id && g.url !== selectedUnit.mainImage?.url)
    ];

    return (
        <div className="container">
            <div className="unit-detail animate-fade-up widget-container p-4">
                <button className="btn btn-link text-decoration-none text-muted mb-4 p-0 small fw-bold" onClick={() => setCurrentView('PROPERTY_DETAIL')}>
                    <i className="bi bi-arrow-left-short fs-5"></i> Back to Property
                </button>

                <div className="row g-4">
                    <div className="col-lg-7">
                        <GallerySlider images={uImages} currentIndex={unitImageIndex} setCurrentIndex={setUnitImageIndex} />
                    </div>

                    <div className="col-lg-5">
                        <div className="glass-panel p-4 rounded-4 h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <span className="badge bg-dark rounded-4 px-3 py-2">Unit {selectedUnit.unitCode}</span>
                                    <div className="text-end">
                                        <span className="d-block extra-small text-muted">Asking Price</span>
                                        <span className="text-primary fw-extrabold fs-3" style={{ color: theme.primaryColor }}>{getFormattedPrice(selectedUnit)}</span>
                                    </div>
                                </div>
                                <h4 className="fw-bold mb-4">{selectedUnit.name || selectedProperty.title}</h4>

                                <div className="row g-3">
                                    <div className="col-6">
                                        <div className="feature-box text-center">
                                            <i className="bi bi-house text-primary opacity-75"></i>
                                            <span className="d-block text-muted extra-small mt-1">Typology</span>
                                            <span className="fw-bold small">{selectedUnit.unitCategory === 1 ? 'Studio' : selectedUnit.unitCategory === 2 ? 'Office' : 'Apartment'}</span>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="feature-box text-center">
                                            <i className="bi bi-rulers text-primary opacity-75"></i>
                                            <span className="d-block text-muted extra-small mt-1">Area</span>
                                            <span className="fw-bold small">{selectedUnit.sizeSqft || 0} sqft</span>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="feature-box text-center">
                                            <i className="bi bi-door-open text-primary opacity-75"></i>
                                            <span className="d-block text-muted extra-small mt-1">Bedrooms</span>
                                            <span className="fw-bold small">{selectedUnit.realEstateDetails?.bedrooms || 0}</span>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="feature-box text-center">
                                            <i className="bi bi-water text-primary opacity-75"></i>
                                            <span className="d-block text-muted extra-small mt-1">Bathrooms</span>
                                            <span className="fw-bold small">{selectedUnit.realEstateDetails?.bathrooms || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-top">
                                <button
                                    className="btn btn-primary w-100 rounded-4 py-3 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2"
                                    style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                                    onClick={() => {
                                        const formElement = document.querySelector('.unit-inquiry-form');
                                        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    <i className="bi bi-calendar-check"></i>
                                    Request Official Tour
                                </button>
                                {widget.configuration.bookingForm?.enabled && (
                                    <button
                                        className="btn btn-dark w-100 rounded-4 py-3 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2 mt-3"
                                        onClick={() => setShowBookingModal(true)}
                                    >
                                        <i className="bi bi-calendar-plus"></i>
                                        Instant Booking Request
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-12 mt-4">
                        <div className="row g-4">
                            <div className="col-md-8">
                                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                    <h5 className="fw-bold mb-4 d-flex align-items-center">
                                        <i className="bi bi-list-stars me-2 text-primary" style={{ color: theme.primaryColor }}></i>
                                        Detailed Specifications
                                    </h5>
                                    <div className="row g-4 mb-4">
                                        <div className="col-sm-6">
                                            <ul className="list-unstyled">
                                                <li className="mb-3 d-flex justify-content-between border-bottom pb-2">
                                                    <span className="text-muted small">Current Status</span>
                                                    <span className={`small fw-bold ${selectedUnit.status === 1 ? 'text-success' : 'text-danger'}`}>{selectedUnit.status === 1 ? 'Available' : 'Reserved'}</span>
                                                </li>
                                                <li className="mb-3 d-flex justify-content-between border-bottom pb-2">
                                                    <span className="text-muted small">Floor Level</span>
                                                    <span className="small fw-bold">{selectedUnit.floorNo || 'Ground'}</span>
                                                </li>
                                                <li className="mb-3 d-flex justify-content-between border-bottom pb-2">
                                                    <span className="text-muted small">Condition</span>
                                                    <span className="small fw-bold">Brand New</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-sm-6">
                                            <ul className="list-unstyled">
                                                <li className="mb-3 d-flex justify-content-between border-bottom pb-2">
                                                    <span className="text-muted small">Parking Allowance</span>
                                                    <span className="small fw-bold">{selectedUnit.realEstateDetails?.parkingSlots || 0} Units</span>
                                                </li>
                                                <li className="mb-3 d-flex justify-content-between border-bottom pb-2">
                                                    <span className="text-muted small">Furnishing</span>
                                                    <span className="small fw-bold">{selectedUnit.realEstateDetails?.furnishing === 1 ? 'Unfurnished' : selectedUnit.realEstateDetails?.furnishing === 2 ? 'Semi-Furnished' : 'Fully Furnished'}</span>
                                                </li>
                                                <li className="mb-3 d-flex justify-content-between border-bottom pb-2">
                                                    <span className="text-muted small">Annual Service Fee</span>
                                                    <span className="small fw-bold">Included</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <h6 className="fw-bold small mb-3">Unit Level Amenities</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {selectedUnit.unitAmenities?.length > 0 ? selectedUnit.unitAmenities.map((ua: any) => (
                                            <span key={ua.amenityId} className="badge bg-light text-dark border px-3 py-2 rounded-3">
                                                <i className={`bi ${ua.amenity.icon || 'bi-check-circle'} me-2 text-primary`} style={{ color: theme.primaryColor }}></i>
                                                {ua.amenity.name}
                                            </span>
                                        )) : (
                                            <span className="text-muted extra-small">Check property level amenities for shared services.</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="glass-panel p-4 rounded-4 h-100 unit-inquiry-form shadow-sm">
                                    <div className="text-center mb-4">
                                        <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                                            <i className="bi bi-headset fs-4 text-primary" style={{ color: theme.primaryColor }}></i>
                                        </div>
                                        <h5 className="fw-bold">Contact Listing Agent</h5>
                                        <p className="extra-small text-muted">Receive a call within 15 minutes</p>
                                    </div>

                                    <FormRenderer
                                        config={widget.configuration.inquiryForm}
                                        primaryColor={theme.primaryColor}
                                        onSubmit={async (formData) => {
                                            const leadPayload: any = {
                                                source: 1,
                                                propertyId: selectedProperty.id,
                                                unitId: selectedUnit.id,
                                                notes: `Unit Specific Inquiry: ${selectedUnit.unitCode}\n${widget.configuration.inquiryForm.fields.map((f: any) => `${f.label}: ${formData[f.id] || 'N/A'}`).join('\n')}`
                                            };

                                            widget.configuration.inquiryForm.fields.forEach((field: any) => {
                                                const val = formData[field.id];
                                                if (!val) return;
                                                if (field.type === 'email' && !leadPayload.email) leadPayload.email = val;
                                                else if (field.type === 'phone' && !leadPayload.phone) leadPayload.phone = val;
                                                else if ((field.type === 'text' || field.id === 'f1') && !leadPayload.name) leadPayload.name = val;
                                                else if (field.id === 'f2' && !leadPayload.email) leadPayload.email = val;
                                            });

                                            if (!leadPayload.name) leadPayload.name = 'Direct Unit Inquiry';
                                            const res = await widgetService.createPublicLead(widgetId, leadPayload);

                                            if (res.success && res.data?.id) {
                                                const identity = { id: res.data.id, email: res.data.email };
                                                if (identifyLead) identifyLead(identity.id, identity.email);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <BookingModal
                show={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                widget={widget}
                widgetId={widgetId}
                selectedProperty={selectedProperty}
                selectedUnit={selectedUnit}
                theme={theme}
                identifyLead={identifyLead}
            />
        </div>
    );
};

export default UnitDetailView;
