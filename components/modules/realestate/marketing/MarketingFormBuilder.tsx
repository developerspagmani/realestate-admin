'use client';

import { useState, useEffect } from 'react';
import { marketingService, getAuthToken } from '@/app/services/api';
import FormRenderer from '../widgets/FormRenderer';

interface MarketingFormBuilderProps {
    tenantId: string;
}

export default function MarketingFormBuilder({ tenantId }: MarketingFormBuilderProps) {
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form Configuration State
    const [currentForm, setCurrentForm] = useState<any>({
        name: '',
        targetGroupId: '',
        configuration: {
            enabled: true,
            title: 'Request a Callback',
            description: 'Fill out the form below and we will get back to you.',
            fields: [
                { id: 'mkt_f1', label: 'Full Name', type: 'text', placeholder: 'Enter your name', required: true },
                { id: 'mkt_f2', label: 'Email Address', type: 'email', placeholder: 'your@email.com', required: true }
            ]
        }
    });

    const [audienceGroups, setAudienceGroups] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const [formsRes, groupsRes] = await Promise.all([
                marketingService.getForms(token, { tenantId }),
                marketingService.getAudienceGroups(token, { tenantId })
            ]);

            if (formsRes.success) setForms(formsRes.data);
            if (groupsRes.success) setAudienceGroups(groupsRes.data);
        } catch (error) {
            console.error('Failed to load marketing forms:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [tenantId]);

    const addField = () => {
        const newField = {
            id: `f${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            label: 'New Field',
            type: 'text',
            placeholder: 'Enter text...',
            required: false
        };
        setCurrentForm((prev: any) => ({
            ...prev,
            configuration: {
                ...prev.configuration,
                fields: [...prev.configuration.fields, newField]
            }
        }));
    };

    const updateField = (id: string, updates: any) => {
        setCurrentForm((prev: any) => {
            const updatedFields = prev.configuration.fields.map((f: any) =>
                f.id === id ? { ...f, ...updates } : f
            );
            return {
                ...prev,
                configuration: { ...prev.configuration, fields: updatedFields }
            };
        });
    };

    const removeField = (id: string) => {
        setCurrentForm((prev: any) => {
            const updatedFields = prev.configuration.fields.filter((f: any) => f.id !== id);
            return {
                ...prev,
                configuration: { ...prev.configuration, fields: updatedFields }
            };
        });
    };

    const handleSave = async () => {
        if (!currentForm.name) {
            alert('Please provide a form name');
            return;
        }
        setSaving(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const payload = { ...currentForm, tenantId };
            let res;
            if (currentForm.id) {
                res = await marketingService.updateForm(token, currentForm.id, payload);
            } else {
                res = await marketingService.createForm(token, payload);
            }

            if (res.success) {
                setIsEditing(false);
                loadData();
                resetCurrentForm();
            }
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete form "${name}"?`)) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.deleteForm(token, id);
            if (res.success) loadData();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const openEdit = (form: any) => {
        const config = typeof form.configuration === 'string' ? JSON.parse(form.configuration) : (form.configuration || {});
        setCurrentForm({
            ...form,
            configuration: {
                ...config,
                fields: config.fields || []
            }
        });
        setIsEditing(true);
    };

    const openCreate = () => {
        resetCurrentForm();
        setIsEditing(true);
    };

    const resetCurrentForm = () => {
        setCurrentForm({
            name: '',
            targetGroupId: '',
            configuration: {
                enabled: true,
                title: 'Request a Callback',
                description: 'Fill out the form below and we will get back to you.',
                fields: [
                    { id: 'mkt_f1', label: 'Full Name', type: 'text', placeholder: 'Enter your name', required: true },
                    { id: 'mkt_f2', label: 'Email Address', type: 'email', placeholder: 'your@email.com', required: true }
                ]
            }
        });
    };

    const copyEmbedCode = (formId: string) => {
        const url = `${window.location.origin}/public/forms/${formId}`;
        const script = `<iframe src="${url}" width="100%" height="600px" frameborder="0"></iframe>`;
        navigator.clipboard.writeText(script);
        alert('Embed code copied to clipboard!');
    }

    if (isEditing) {
        return (
            <div className="form-builder animate-fade-in">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <button className="btn btn-link text-decoration-none text-muted p-0 me-3" onClick={() => setIsEditing(false)}>
                            <i className="bi bi-chevron-left me-1"></i> Back
                        </button>
                        <h5 className="fw-bold d-inline-block">{currentForm.id ? 'Edit' : 'Build'} Lead Form</h5>
                    </div>
                    <button className="btn btn-primary rounded-4 px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                        onClick={handleSave} disabled={saving}>
                        {saving && <span className="spinner-border spinner-border-sm"></span>}
                        {currentForm.id ? 'Update Form' : 'Save & Publish'}
                    </button>
                </div>

                <div className="row g-4">
                    {/* Sidebar Editor */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 p-4">
                            <h6 className="fw-bold mb-3 border-bottom pb-2">Form Basics</h6>
                            <div className="mb-3">
                                <label className="form-label extra-small fw-bold text-muted text-uppercase">Internal Form Name</label>
                                <input
                                    type="text"
                                    className="form-control bg-light border-0 py-2"
                                    placeholder="e.g. Website Contact Form"
                                    value={currentForm.name || ''}
                                    onChange={e => setCurrentForm({ ...currentForm, name: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="form-label extra-small fw-bold text-muted text-uppercase">Auto-Add Leads to Group</label>
                                <select
                                    className="form-select bg-light border-0 py-2"
                                    value={currentForm.targetGroupId || ''}
                                    onChange={e => setCurrentForm({ ...currentForm, targetGroupId: e.target.value })}
                                >
                                    <option value="">Do not add to any group</option>
                                    {audienceGroups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label extra-small fw-bold text-muted text-uppercase">Display Title</label>
                                <input
                                    type="text"
                                    className="form-control bg-light border-0 py-2"
                                    value={currentForm.configuration.title || ''}
                                    onChange={e => setCurrentForm({ ...currentForm, configuration: { ...currentForm.configuration, title: e.target.value } })}
                                />
                            </div>

                            <h6 className="fw-bold mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center mt-4">
                                Form Fields
                                <button className="btn btn-primary btn-xs rounded-4 px-3" onClick={addField}>
                                    <i className="bi bi-plus-lg"></i> Add Field
                                </button>
                            </h6>

                            <div className="fields-list custom-scrollbar pe-2" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                {currentForm.configuration.fields.map((field: any, index: number) => (
                                    <div key={field.id} className="field-item p-3 bg-light rounded-4 mb-3 position-relative border border-transparent hover-border-primary">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="badge bg-white text-dark border extra-small">Field {index + 1}</span>
                                            <button className="btn btn-link text-danger p-0" onClick={() => removeField(field.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                        <div className="row g-2">
                                            <div className="col-6">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm border-0 shadow-none bg-white"
                                                    placeholder="Label"
                                                    value={field.label || ''}
                                                    onChange={e => updateField(field.id, { label: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <select
                                                    className="form-select form-select-sm border-0 shadow-none bg-white"
                                                    value={field.type}
                                                    onChange={e => updateField(field.id, { type: e.target.value })}
                                                >
                                                    <option value="text">Short Text</option>
                                                    <option value="email">Email Address</option>
                                                    <option value="tel">Phone Number</option>
                                                    <option value="textarea">Long Text</option>
                                                    <option value="date">Date Picker</option>
                                                    <option value="select">Dropdown / Select</option>
                                                </select>
                                            </div>
                                            <div className="col-12 mt-2">
                                                {field.type === 'select' && (
                                                    <div className="mt-2 p-2 bg-white rounded-3 border">
                                                        <label className="extra-small fw-bold text-muted d-block mb-1 text-uppercase">Dropdown Options</label>
                                                        <div className="d-flex flex-wrap gap-1 mb-2">
                                                            {(field.options || []).map((opt: string, optIdx: number) => (
                                                                <span key={optIdx} className="badge bg-light text-dark border d-flex align-items-center gap-1">
                                                                    {opt}
                                                                    <i className="bi bi-x cursor-pointer" onClick={() => {
                                                                        const newOpts = [...(field.options || [])];
                                                                        newOpts.splice(optIdx, 1);
                                                                        updateField(field.id, { options: newOpts });
                                                                    }}></i>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="input-group input-group-sm">
                                                            <input
                                                                type="text"
                                                                className="form-control border-0 bg-light"
                                                                placeholder="Add option..."
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        const val = e.currentTarget.value.trim();
                                                                        if (val) {
                                                                            updateField(field.id, { options: [...(field.options || []), val] });
                                                                            e.currentTarget.value = '';
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <button className="btn btn-outline-primary" type="button" onClick={(e) => {
                                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                const val = input.value.trim();
                                                                if (val) {
                                                                    updateField(field.id, { options: [...(field.options || []), val] });
                                                                    input.value = '';
                                                                }
                                                            }}>Add</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-12 text-end">
                                                <div className="form-check form-switch d-inline-flex align-items-center gap-2 m-0 p-0">
                                                    <label className="form-check-label extra-small text-muted" htmlFor={`check-${field.id}`}>Required</label>
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`check-${field.id}`}
                                                        checked={field.required}
                                                        onChange={e => updateField(field.id, { required: e.target.checked })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* LIVE PREVIEW */}
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm rounded-4 p-5 d-flex align-items-center justify-content-center bg-light bg-opacity-50" style={{ minHeight: '600px' }}>
                            <div className="w-100" style={{ maxWidth: '400px' }}>
                                <div className="text-center mb-4">
                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-4 mb-2 px-3 fw-bold">Live Preview</span>
                                </div>
                                <div className="bg-white p-4 shadow-sm rounded-4 border">
                                    <FormRenderer
                                        config={currentForm.configuration}
                                        onSubmit={async () => { }}
                                        primaryColor="#0d6efd"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="forms-list">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Lead Capture Forms</h5>
                <button className="btn btn-primary btn-sm rounded-4 px-3 fw-bold shadow-sm" onClick={openCreate}>
                    <i className="bi bi-file-earmark-plus me-1"></i> Create Form
                </button>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></div>
            ) : forms.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-light bg-opacity-50 border-dashed">
                    <i className="bi bi-input-cursor-text display-4 text-muted opacity-25 mb-3"></i>
                    <h6 className="fw-bold">No Lead Forms Yet</h6>
                    <p className="text-muted small">Create custom forms to embed on your website or share with potential leads.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {forms.map(form => (
                        <div key={form.id} className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 position-relative transition-all hover-translate-up">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="bg-success bg-opacity-10 text-success p-3 rounded-4">
                                        <i className="bi bi-check-square-fill fs-4"></i>
                                    </div>
                                    <div className="dropdown">
                                        <button className="btn btn-link btn-sm p-0 text-muted" data-bs-toggle="dropdown"><i className="bi bi-three-dots-vertical"></i></button>
                                        <ul className="dropdown-menu dropdown-menu-end border-0 shadow rounded-3">
                                            <li><button className="dropdown-item small d-flex align-items-center gap-2" onClick={() => openEdit(form)}><i className="bi bi-pencil"></i> Edit Form</button></li>
                                            <li><button className="dropdown-item small d-flex align-items-center gap-2" onClick={() => copyEmbedCode(form.id)}><i className="bi bi-code-slash"></i> Copy Script</button></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><button className="dropdown-item small text-danger d-flex align-items-center gap-2" onClick={() => handleDelete(form.id, form.name)}><i className="bi bi-trash"></i> Delete Form</button></li>
                                        </ul>
                                    </div>
                                </div>
                                <h6 className="fw-bold mb-1">{form.name}</h6>
                                <p className="text-muted extra-small mb-4">Fields: {form.configuration.fields?.length || 0} • Status: Active</p>
                                <div className="d-flex gap-2 mt-auto">
                                    <button className="btn btn-outline-primary btn-xs rounded-4 px-3 flex-grow-1 border-opacity-25 extra-small fw-bold" onClick={() => copyEmbedCode(form.id)}>
                                        <i className="bi bi-code-slash me-1"></i> Embed Code
                                    </button>
                                    <button className="btn btn-light btn-xs rounded-4 border px-3 extra-small fw-bold" onClick={() => openEdit(form)}>
                                        <i className="bi bi-pencil me-1"></i> Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .extra-small { font-size: 0.7rem; }
                .btn-xs { padding: 6px 12px; font-size: 11px; }
                .hover-translate-up { transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid rgba(0,0,0,0.03); }
                .hover-translate-up:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; border-color: rgba(var(--bs-primary-rgb), 0.2); }
                .hover-border-primary:hover { border-color: var(--bs-primary) !important; }
            `}</style>
        </div>
    );
}
