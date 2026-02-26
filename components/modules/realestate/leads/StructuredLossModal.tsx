'use client';

import React, { useState } from 'react';

interface StructuredLossModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    leadName: string;
    isSubmitting?: boolean;
}

export default function StructuredLossModal({ show, onClose, onConfirm, leadName, isSubmitting }: StructuredLossModalProps) {
    const [formData, setFormData] = useState({
        primaryReason: '',
        secondaryReason: '',
        stageAtLoss: 'Enquiry',
        competitorName: '',
        notes: ''
    });

    if (!show) return null;

    const primaryReasons = [
        "Budget too high",
        "Location mismatch",
        "Project amenities not suitable",
        "Preferred competitor project",
        "Poor follow-up / delayed response",
        "Loan / eligibility issue",
        "Timeline mismatch",
        "Trust / credibility issue",
        "Not genuine lead"
    ];

    const secondaryReasons = [
        "Price negotiation failed",
        "Wanted ready-to-move",
        "Wanted resale",
        "Builder reputation concern",
        "Family decision pending",
        "Site visit experience issue"
    ];

    const stages = ["Enquiry", "Site Visit", "Negotiation", "Booking Stage"];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(formData);
    };

    return (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header border-0 pb-0 pt-4 px-4">
                        <h5 className="modal-title fw-bold d-flex align-items-center">
                            <i className="bi bi-shield-x text-danger me-2"></i> Mark Lead as Lost: {leadName}
                        </h5>
                        <button type="button" className="btn-close shadow-none" onClick={onClose} disabled={isSubmitting}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            <p className="text-muted small mb-4">
                                Please provide structured feedback for this lost deal. This data helps our AI improve your matching and identifies leakage points in your sales process.
                            </p>

                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted text-uppercase">Primary Reason *</label>
                                <select
                                    className="form-select rounded-3 p-2 bg-light border-0"
                                    required
                                    value={formData.primaryReason}
                                    onChange={(e) => setFormData({ ...formData, primaryReason: e.target.value })}
                                >
                                    <option value="">Select a reason</option>
                                    {primaryReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted text-uppercase">Secondary Reason (Context)</label>
                                <select
                                    className="form-select rounded-3 p-2 bg-light border-0"
                                    value={formData.secondaryReason}
                                    onChange={(e) => setFormData({ ...formData, secondaryReason: e.target.value })}
                                >
                                    <option value="">Optional detail</option>
                                    {secondaryReasons.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted text-uppercase">Loss Stage *</label>
                                        <select
                                            className="form-select rounded-3 p-2 bg-light border-0"
                                            required
                                            value={formData.stageAtLoss}
                                            onChange={(e) => setFormData({ ...formData, stageAtLoss: e.target.value })}
                                        >
                                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted text-uppercase">Competitor Name</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-3 p-2 bg-light border-0"
                                            placeholder="If applicable"
                                            value={formData.competitorName}
                                            onChange={(e) => setFormData({ ...formData, competitorName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-0">
                                <label className="form-label small fw-bold text-muted text-uppercase">Internal Notes</label>
                                <textarea
                                    className="form-control rounded-3 bg-light border-0"
                                    rows={3}
                                    placeholder="Add any additional context..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer border-0 p-4 pt-0">
                            <button type="button" className="btn btn-light rounded-3 px-4" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                            <button type="submit" className="btn btn-danger rounded-3 px-4 shadow-sm" disabled={isSubmitting}>
                                {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                Mark as Lost & Finalize
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
