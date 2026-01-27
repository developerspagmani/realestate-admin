'use client';

import React from 'react';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { widgetService } from '@/app/services/api';
import ImageModal from './ImageModal';

interface ListingViewProps {
    filteredData: any[];
    isFiltered: boolean;
    colClass: string;
    theme: any;
    widget: any;
    widgetId: string;
    onReset: () => void;
    onSelectProperty: (property: any) => void;
}

const ListingView: React.FC<ListingViewProps> = ({
    filteredData,
    isFiltered,
    colClass: propColClass,
    theme,
    widget,
    widgetId,
    onReset,
    onSelectProperty
}) => {
    const [showPopup, setShowPopup] = React.useState(false);
    const [popupImageUrl, setPopupImageUrl] = React.useState('');

    // Dynamic Column Calculation
    const gridCols = widget.configuration?.display?.columns || 3;
    const colClass = propColClass || (
        gridCols === 1 ? 'col-12' :
            gridCols === 2 ? 'col-md-6' :
                'col-md-6 col-lg-4'
    );

    return (
        <div className="container py-4 widget-container">
            <div className="row g-4">
                <div className="col-12 mb-2 d-flex justify-content-between align-items-center animate-fade-up">
                    <div>
                        <h4 className="fw-bold mb-0">Discover Premium Properties</h4>
                        <p className="text-muted small mb-0">Exclusive listings curated for your needs</p>
                    </div>
                    {isFiltered && (
                        <button className="btn btn-light btn-sm rounded-pill px-3 border" onClick={onReset}>
                            <i className="bi bi-x-circle me-1"></i>Reset
                        </button>
                    )}
                </div>
                {filteredData.length === 0 ? (
                    <div className="col-12 text-center py-5 glass-panel rounded-4">
                        <i className="bi bi-search display-4 text-muted mb-3 d-block"></i>
                        <h5 className="fw-bold">No Matches Found</h5>
                        <p className="text-muted small">Update your search or check back later.</p>
                    </div>
                ) : filteredData.map((property: any) => (
                    <div key={property.id} className={`${colClass} animate-fade-up`}>
                        <div
                            className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 cursor-pointer feature-box p-0"
                            onClick={() => onSelectProperty(property)}
                        >
                            <div className="position-relative" style={{ height: '220px' }}>
                                {property.mainImage ? (
                                    <>
                                        <img src={property.mainImage.url} alt={property.title} className="w-100 h-100 object-fit-cover" />
                                        <div
                                            className="zoom-overlay"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPopupImageUrl(property.mainImage.url);
                                                setShowPopup(true);
                                            }}
                                        >
                                            <i className="bi bi-zoom-in"></i>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-100 bg-light d-flex align-items-center justify-content-center">
                                        <i className="bi bi-building fs-1 text-muted opacity-25"></i>
                                    </div>
                                )}
                                <div className="floating-badge">
                                    {property.units?.length || 0} Units Available
                                </div>
                            </div>
                            <div className="card-body p-4">
                                <h5 className="fw-bold mb-2 text-truncate">{property.title}</h5>
                                <p className="small text-muted mb-3 d-flex align-items-center">
                                    <i className="bi bi-geo-alt-fill me-2 text-primary" style={{ color: theme.primaryColor }}></i>
                                    {property.city}, {property.state}
                                </p>
                                <div className="d-flex gap-3 mb-4 text-center">
                                    <div className="flex-fill border-end">
                                        <span className="d-block fw-bold small">{property.area?.toLocaleString() || '--'}</span>
                                        <span className="extra-small text-muted">sqft</span>
                                    </div>
                                    <div className="flex-fill border-end">
                                        <span className="d-block fw-bold small">{property.yearBuilt || '2024'}</span>
                                        <span className="extra-small text-muted">Built</span>
                                    </div>
                                    <div className="flex-fill">
                                        <span className="d-block fw-bold small">{property.listingType === 'sale' ? 'Sale' : 'Rent'}</span>
                                        <span className="extra-small text-muted">Type</span>
                                    </div>
                                </div>
                                <button className="btn btn-primary w-100 rounded-pill py-2 shadow-sm fw-bold" style={{ backgroundColor: theme.primaryColor, border: 'none' }}>
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {widget.configuration.inquiryForm?.enabled && (
                    <div className="col-12 mt-5 animate-fade-up">
                        <div className="glass-panel p-4 rounded-4 inquiry-form-container">
                            <h5 className="fw-bold mb-3 d-flex align-items-center">
                                <i className="bi bi-envelope-paper me-2 text-primary" style={{ color: theme.primaryColor }}></i>
                                Send us an Inquiry
                            </h5>
                            <FormRenderer
                                config={widget.configuration.inquiryForm}
                                primaryColor={theme.primaryColor}
                                onSubmit={async (formData) => {
                                    const leadPayload: any = {
                                        source: 1,
                                        notes: `Website Inquiry: ${widget.name}\n${widget.configuration.inquiryForm.fields.map((f: any) => `${f.label}: ${formData[f.id] || 'N/A'}`).join('\n')}`
                                    };

                                    widget.configuration.inquiryForm.fields.forEach((field: any) => {
                                        const val = formData[field.id];
                                        if (!val) return;
                                        if (field.type === 'email' && !leadPayload.email) leadPayload.email = val;
                                        else if (field.type === 'phone' && !leadPayload.phone) leadPayload.phone = val;
                                        else if ((field.type === 'text' || field.id === 'f1') && !leadPayload.name) leadPayload.name = val;
                                        else if (field.id === 'f2' && !leadPayload.email) leadPayload.email = val;
                                    });

                                    if (!leadPayload.name) leadPayload.name = 'Web Inquiry';
                                    await widgetService.createPublicLead(widgetId, leadPayload);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <ImageModal
                show={showPopup}
                imageUrl={popupImageUrl}
                onClose={() => setShowPopup(false)}
            />

            <style jsx>{`
                .zoom-overlay {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 255, 255, 0.9);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    z-index: 10;
                    color: #2563eb;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .card:hover .zoom-overlay {
                    opacity: 1;
                    transform: scale(1);
                }
                .zoom-overlay:hover {
                    background: white;
                    color: #1d4ed8;
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
};

export default ListingView;
