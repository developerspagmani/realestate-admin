'use client';

import React from 'react';
import FormRenderer from '@/components/modules/realestate/widgets/FormRenderer';
import { widgetService } from '@/app/services/api';

interface BookingModalProps {
    show: boolean;
    onClose: () => void;
    widget: any;
    widgetId: string;
    selectedProperty?: any;
    selectedUnit?: any;
    theme: any;
    identifyLead?: (id: string, email?: string) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
    show,
    onClose,
    widget,
    widgetId,
    selectedProperty,
    selectedUnit,
    theme,
    identifyLead
}) => {
    if (!show) return null;

    const bookingForm = widget?.configuration?.bookingForm;
    const builderBookingEnabled = widget?.configuration?.builder?.enableBooking;

    const bookingConfig = (bookingForm && bookingForm.enabled) ? bookingForm : (builderBookingEnabled || show ? {
        enabled: true,
        title: 'Reservation Request',
        submitLabel: 'Send Request',
        successMessage: 'We have received your request!',
        fields: [
            { id: 'f1', type: 'text', label: 'Full Name', required: true, placeholder: 'Your Name' },
            { id: 'f2', type: 'email', label: 'Email Address', required: true, placeholder: 'name@example.com' },
            { id: 'f3', type: 'phone', label: 'Phone Number', required: true, placeholder: '+1 234 567 890' },
            { id: 'f4', type: 'date', label: 'Preferred Date', required: true },
            { id: 'f5', type: 'textarea', label: 'Additional Notes', required: false, placeholder: 'Any specific requirements?' }
        ]
    } : null);

    if (!bookingConfig) return null;

    const handleSubmit = async (formData: any, configUsed: any) => {
        const leadPayload: any = {
            source: 1, // Website/Widget
            isBooking: true,
            propertyId: selectedProperty?.id,
            unitId: selectedUnit?.id,
            notes: `Booking Request: ${selectedUnit ? `${selectedProperty?.title} - ${selectedUnit.unitCode || selectedUnit.name}` : selectedProperty?.title}\n` +
                (configUsed.fields || []).map((f: any) => `${f.label}: ${formData[f.id] || 'N/A'}`).join('\n')
        };

        (configUsed.fields || []).forEach((field: any) => {
            const val = formData[field.id];
            if (!val) return;
            if (field.type === 'email' && !leadPayload.email) leadPayload.email = val;
            else if (field.type === 'phone' && !leadPayload.phone) leadPayload.phone = val;
            else if ((field.type === 'text' || field.id === 'f1') && !leadPayload.name) leadPayload.name = val;
            else if (field.id === 'f2' && !leadPayload.email) leadPayload.email = val;
            else if (field.type === 'date' || field.type === 'datetime-local') {
                if (!leadPayload.startAt) leadPayload.startAt = val;
            }
        });

        if (!leadPayload.name) leadPayload.name = 'Booking Lead';

        // Pass the form ID to the backend so it can trigger the correct workflow
        if (bookingConfig.useMarketingForm && bookingConfig.marketingFormId) {
            leadPayload.formId = bookingConfig.marketingFormId;
        }

        const res = await widgetService.createPublicLead(widgetId, leadPayload, !!widget.slug);

        if (res.success && res.data?.id) {
            const identity = { id: res.data.id, email: res.data.email };
            if (identifyLead) identifyLead(identity.id, identity.email);
            // Close after a short delay on success
            setTimeout(onClose, 2000);
        }
    };

    return (
        <div className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 animate-fade-in" style={{ zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="booking-modal bg-white rounded-5 shadow-2xl overflow-hidden animate-zoom-in" style={{ maxWidth: '500px', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="modal-header border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                            <i className="bi bi-calendar-check text-primary fs-5" style={{ color: theme.primaryColor }}></i>
                        </div>
                        <h5 className="fw-bold mb-0">Reserve Your Selection</h5>
                    </div>
                    <button className="btn btn-light rounded-circle p-2" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="px-4 pt-3">
                    <div className="p-3 bg-light rounded-4 border-dashed border-2 mb-4">
                        <div className="d-flex align-items-center gap-3">
                            {selectedUnit?.mainImage?.url ? (
                                <img src={selectedUnit.mainImage.url} className="rounded-3" style={{ width: '60px', height: '60px', objectFit: 'cover' }} alt="unit" />
                            ) : selectedProperty?.mainImage?.url ? (
                                <img src={selectedProperty.mainImage.url} className="rounded-3" style={{ width: '60px', height: '60px', objectFit: 'cover' }} alt="property" />
                            ) : null}
                            <div>
                                <span className="d-block extra-small text-muted fw-bold text-uppercase">Requesting Reservation</span>
                                <h6 className="fw-bold mb-1">
                                    {selectedUnit ? (
                                        <>{selectedProperty?.title} - {selectedUnit.unitCode || selectedUnit.name}</>
                                    ) : (
                                        selectedProperty?.title
                                    )}
                                </h6>
                                <span className="small text-primary fw-bold" style={{ color: theme.primaryColor }}>{selectedProperty?.city}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-body p-4 pt-0">
                    <FormRenderer
                        config={bookingConfig}
                        primaryColor={theme.primaryColor}
                        onSubmit={handleSubmit}
                    />
                </div>
            </div>

            <style jsx>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                .animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .extra-small { font-size: 10px; }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                .border-dashed { border: 2px dashed rgba(0,0,0,0.1) !important; }
            `}</style>
        </div>
    );
};

export default BookingModal;
