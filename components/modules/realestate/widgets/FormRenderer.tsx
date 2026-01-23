'use client';

import React, { useState } from 'react';

interface FormRendererProps {
    config: {
        enabled: boolean;
        title: string;
        description: string;
        fields: any[];
    };
    onSubmit: (formData: any) => Promise<void>;
    primaryColor: string;
}

export default function FormRenderer({ config, onSubmit, primaryColor }: FormRendererProps) {
    const [formData, setFormData] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!config.enabled) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(formData);
            setSubmitted(true);
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (fieldId: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [fieldId]: value }));
    };

    if (submitted) {
        return (
            <div className="text-center py-5 animate-fade-in">
                <div className="mb-3">
                    <i className="bi bi-check-circle-fill display-4 text-success"></i>
                </div>
                <h5 className="fw-bold">Thank You!</h5>
                <p className="text-muted small">Your inquiry has been received. We will get back to you soon.</p>
                <button
                    className="btn btn-outline-primary btn-sm rounded-pill mt-2"
                    onClick={() => {
                        setSubmitted(false);
                        setFormData({});
                    }}
                    style={{ borderColor: primaryColor, color: primaryColor }}
                >
                    Send Another message
                </button>
            </div>
        );
    }

    return (
        <div className="inquiry-form-container bg-white p-4 rounded-4 shadow-sm border animate-fade-in">
            <h5 className="fw-bold mb-1">{config.title || 'Inquiry Form'}</h5>
            <p className="extra-small text-muted mb-4">{config.description}</p>

            <form onSubmit={handleSubmit}>
                <div className="row g-3">
                    {config.fields.map((field) => (
                        <div key={field.id} className="col-12 text-start">
                            <label className="extra-small fw-bold text-muted mb-1">
                                {field.label} {field.required && <span className="text-danger">*</span>}
                            </label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    className="form-control form-control-sm rounded-3"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    rows={3}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    className="form-select form-select-sm rounded-3"
                                    required={field.required}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                >
                                    <option value="">Select an option...</option>
                                    {field.options?.map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type}
                                    className="form-control form-control-sm rounded-3"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                />
                            )}
                        </div>
                    ))}

                    <div className="col-12 mt-4">
                        <button
                            type="submit"
                            className="btn btn-primary w-100 rounded-pill py-2 fw-bold"
                            style={{ backgroundColor: primaryColor, border: 'none' }}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <span className="spinner-border spinner-border-sm me-2"></span>
                            ) : <i className="bi bi-send me-2"></i>}
                            Submit Inquiry
                        </button>
                    </div>
                </div>
            </form>

            <style jsx>{`
                .extra-small { font-size: 11px; }
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
