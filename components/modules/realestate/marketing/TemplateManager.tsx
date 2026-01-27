'use client';

import { useState, useEffect } from 'react';
import { marketingService, getAuthToken } from '@/app/services/api';

interface TemplateManagerProps {
    tenantId: string;
}

export default function TemplateManager({ tenantId }: TemplateManagerProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
    const [templateData, setTemplateData] = useState({
        name: '',
        subject: '',
        content: '',
        type: 'email'
    });

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.getTemplates(token, { tenantId });
            if (res.success) {
                setTemplates(res.data);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, [tenantId]);

    const handleSave = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            let res;
            if (isEditing && currentTemplateId) {
                res = await marketingService.updateTemplate(token, currentTemplateId, { ...templateData, tenantId });
            } else {
                res = await marketingService.createTemplate(token, { ...templateData, tenantId });
            }

            if (res.success) {
                setShowModal(false);
                loadTemplates();
                resetForm();
            }
        } catch (error) {
            console.error('Failed to save template:', error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.deleteTemplate(token, id);
            if (res.success) {
                loadTemplates();
            }
        } catch (error) {
            console.error('Failed to delete template:', error);
        }
    };

    const openEdit = (template: any) => {
        setTemplateData({
            name: template.name,
            subject: template.subject || '',
            content: template.content || '',
            type: template.type || 'email'
        });
        setCurrentTemplateId(template.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setTemplateData({ name: '', subject: '', content: '', type: 'email' });
        setIsEditing(false);
        setCurrentTemplateId(null);
    };

    return (
        <div className="template-manager">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Email Templates</h5>
                <button className="btn btn-primary btn-sm rounded-pill px-3 fw-bold" onClick={() => { resetForm(); setShowModal(true); }}>
                    <i className="bi bi-plus-lg me-1"></i> New Template
                </button>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></div>
            ) : templates.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-light bg-opacity-50">
                    <i className="bi bi-layout-text-window display-4 text-muted opacity-25 mb-3"></i>
                    <h6 className="fw-bold">No Templates Yet</h6>
                    <p className="text-muted small">Create your first responsive email template to engage your audience.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {templates.map(template => (
                        <div key={template.id} className="col-md-4">
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 template-card">
                                <div className="template-preview bg-light p-4 d-flex align-items-center justify-content-center" style={{ height: '160px' }}>
                                    <i className="bi bi-file-earmark-richtext display-5 text-muted opacity-50"></i>
                                </div>
                                <div className="card-body p-3">
                                    <h6 className="fw-bold mb-1 text-truncate">{template.name}</h6>
                                    <p className="text-muted extra-small mb-3 text-truncate">{template.subject || 'No Subject'}</p>
                                    <div className="d-flex justify-content-between align-items-center mt-auto">
                                        <span className="badge bg-light text-dark border extra-small text-uppercase">{template.type}</span>
                                        <div className="btn-group">
                                            <button className="btn btn-link btn-sm p-0 text-muted me-2" onClick={() => openEdit(template)}><i className="bi bi-pencil"></i></button>
                                            <button className="btn btn-link btn-sm p-0 text-danger" onClick={() => handleDelete(template.id, template.name)}><i className="bi bi-trash"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="fw-bold mb-0">{isEditing ? 'Edit Template' : 'Create Template'}</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold text-muted">Template Name</label>
                                        <input type="text" className="form-control bg-light border-0" placeholder="e.g. Welcome Email" value={templateData.name} onChange={e => setTemplateData({ ...templateData, name: e.target.value })} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold text-muted">Template Type</label>
                                        <select className="form-select bg-light border-0" value={templateData.type} onChange={e => setTemplateData({ ...templateData, type: e.target.value })}>
                                            <option value="email">Email Campaign</option>
                                            <option value="newsletter">Newsletter</option>
                                            <option value="automaton">Automation Step</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted">Subject Line</label>
                                    <input type="text" className="form-control bg-light border-0" placeholder="{{name}}, check this out!" value={templateData.subject} onChange={e => setTemplateData({ ...templateData, subject: e.target.value })} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted">HTML Content</label>
                                    <textarea className="form-control bg-light border-0" rows={10} placeholder="<b>Hello!</b>..." value={templateData.content} style={{ fontFamily: 'monospace' }} onChange={e => setTemplateData({ ...templateData, content: e.target.value })}></textarea>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={handleSave} disabled={!templateData.name}>
                                    {isEditing ? 'Save Changes' : 'Save Template'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .template-card { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(0,0,0,0.05); }
                .template-card:hover { transform: translateY(-5px); border-color: rgba(var(--bs-primary-rgb), 0.3); box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; }
                .extra-small { font-size: 0.7rem; }
            `}</style>
        </div>
    );
}
