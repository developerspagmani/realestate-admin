'use client';

import React, { useState } from 'react';

interface FormField {
    id: string;
    type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'number';
    label: string;
    placeholder: string;
    required: boolean;
    options?: string[]; // For select type
}

interface FormBuilderProps {
    config: {
        enabled: boolean;
        title: string;
        description: string;
        fields: FormField[];
    };
    onChange: (config: any) => void;
}

const FIELD_TYPES = [
    { type: 'text', label: 'Short Text', icon: 'bi-text-left' },
    { type: 'email', label: 'Email Address', icon: 'bi-envelope' },
    { type: 'phone', label: 'Phone Number', icon: 'bi-telephone' },
    { type: 'number', label: 'Budget / Number', icon: 'bi-hash' },
    { type: 'textarea', label: 'Long Message', icon: 'bi-textarea-t' },
    { type: 'select', label: 'Dropdown Select', icon: 'bi-list-ul' },
];

export default function FormBuilder({ config, onChange }: FormBuilderProps) {
    const [activeTab, setActiveTab] = useState<'settings' | 'fields'>('fields');

    const addField = (type: any) => {
        const newField: FormField = {
            id: `field_${Math.random().toString(36).substr(2, 9)}`,
            type: type as any,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
            placeholder: `Enter ${type}...`,
            required: false,
            ...(type === 'select' ? { options: ['Option 1', 'Option 2'] } : {})
        };
        onChange({ ...config, fields: [...config.fields, newField] });
    };

    const removeField = (id: string) => {
        onChange({ ...config, fields: config.fields.filter(f => f.id !== id) });
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        onChange({
            ...config,
            fields: config.fields.map(f => f.id === id ? { ...f, ...updates } : f)
        });
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newFields = [...config.fields];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < newFields.length) {
            [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
            onChange({ ...config, fields: newFields });
        }
    };

    return (
        <div className="form-builder border rounded-4 bg-light p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold mb-0 d-flex align-items-center">
                    <i className="bi bi-ui-checks-grid me-2 text-primary"></i>
                    Inquiry Form Builder
                </h6>
                <div className="form-check form-switch mb-0">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="formEnabled"
                        checked={config.enabled}
                        onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
                    />
                    <label className="form-check-label small fw-bold" htmlFor="formEnabled">Enable Form</label>
                </div>
            </div>

            {config.enabled && (
                <div className="animate-fade-in">
                    <ul className="nav nav-pills nav-sm mb-3">
                        <li className="nav-item">
                            <button
                                className={`nav-link py-1 px-3 small ${activeTab === 'fields' ? 'active' : ''}`}
                                onClick={() => setActiveTab('fields')}
                            >
                                Fields
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link py-1 px-3 small ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                Form Header
                            </button>
                        </li>
                    </ul>

                    {activeTab === 'settings' ? (
                        <div className="row g-3 p-2 bg-white rounded-3 shadow-sm">
                            <div className="col-12">
                                <label className="form-label x-small fw-bold">Form Title</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={config.title}
                                    onChange={(e) => onChange({ ...config, title: e.target.value })}
                                />
                            </div>
                            <div className="col-12">
                                <label className="form-label x-small fw-bold">Description</label>
                                <textarea
                                    className="form-control form-control-sm"
                                    rows={2}
                                    value={config.description}
                                    onChange={(e) => onChange({ ...config, description: e.target.value })}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="row g-3">
                            <div className="col-md-4">
                                <div className="p-3 bg-white rounded-3 shadow-sm h-100">
                                    <p className="x-small fw-bold text-muted mb-2">Available Fields</p>
                                    <div className="d-grid gap-2">
                                        {FIELD_TYPES.map(f => (
                                            <button
                                                key={f.type}
                                                type="button"
                                                className="btn btn-outline-secondary btn-sm text-start d-flex align-items-center"
                                                onClick={() => addField(f.type)}
                                            >
                                                <i className={`bi ${f.icon} me-2`}></i>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-8">
                                <div className="p-3 bg-white rounded-3 shadow-sm min-vh-25">
                                    {config.fields.length === 0 ? (
                                        <div className="text-center py-5 opacity-50">
                                            <i className="bi bi-plus-circle display-6"></i>
                                            <p className="small mt-2">Add fields to start building</p>
                                        </div>
                                    ) : (
                                        <div className="field-list">
                                            {config.fields.map((field, index) => (
                                                <div key={field.id} className="field-item border-bottom py-3 mb-2 px-2 hover-bg-light transition-all rounded-2">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div className="d-flex align-items-center">
                                                            <span className="badge bg-light text-dark me-2 small fw-normal">{index + 1}</span>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm fw-bold border-0 p-0 bg-transparent w-auto"
                                                                value={field.label}
                                                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="btn-group btn-group-sm">
                                                            <button type="button" className="btn btn-link text-muted p-1" onClick={() => moveField(index, 'up')} disabled={index === 0}>
                                                                <i className="bi bi-chevron-up"></i>
                                                            </button>
                                                            <button type="button" className="btn btn-link text-muted p-1" onClick={() => moveField(index, 'down')} disabled={index === config.fields.length - 1}>
                                                                <i className="bi bi-chevron-down"></i>
                                                            </button>
                                                            <button type="button" className="btn btn-link text-danger p-1" onClick={() => removeField(field.id)}>
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="row g-2">
                                                        <div className="col-md-7">
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                placeholder="Placeholder text"
                                                                value={field.placeholder}
                                                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="col-md-3 d-flex align-items-center">
                                                            <div className="form-check mb-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={field.required}
                                                                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                                                    id={`req_${field.id}`}
                                                                />
                                                                <label className="form-check-label x-small" htmlFor={`req_${field.id}`}>Required</label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {field.type === 'select' && (
                                                        <div className="mt-2">
                                                            <label className="x-small fw-bold text-muted">Options (comma separated)</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={field.options?.join(', ')}
                                                                onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .nav-sm .nav-link { font-size: 0.75rem; border-radius: 20px; }
                .x-small { font-size: 0.7rem; }
                .min-vh-25 { min-height: 250px; }
                .hover-bg-light:hover { background: #f8f9fa; }
                .animate-fade-in { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
