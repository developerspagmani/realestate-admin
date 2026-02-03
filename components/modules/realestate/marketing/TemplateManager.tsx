'use client';

import { useState, useEffect } from 'react';
import { marketingService, getAuthToken } from '@/app/services/api';

const DEFAULT_THEMES = [
    {
        id: 'modern',
        name: 'Modern Estate',
        preview: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&h=150',
        render: (design: designState, content: string) => `
            <div style="background-color: ${design.backgroundColor}; padding: 40px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: ${design.textColor};">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="background-color: ${design.primaryColor}; padding: 30px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 24px;">${design.headerText || 'PREMIUM PROPERTIES'}</h2>
                    </div>
                    <div style="padding: 40px; line-height: 1.6;">
                        ${content}
                    </div>
                    ${renderSocialIcons(design)}
                    <div style="background-color: #f1f1f1; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                        <p style="margin: 0; font-size: 12px; color: #888;">${design.footerText || '&copy; 2026 Real Estate Platform. All rights reserved.'}</p>
                        <div style="margin-top: 10px;">
                            <a href="#" style="color: ${design.primaryColor}; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 'minimal',
        name: 'Clean & Minimal',
        preview: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&h=150',
        render: (design: designState, content: string) => `
            <div style="padding: 40px; font-family: Arial, sans-serif; color: ${design.textColor}; line-height: 1.5;">
                <div style="max-width: 500px; margin: 0 auto; border: 1px solid #eeeeee; padding: 30px;">
                    <div style="margin-bottom: 30px; border-bottom: 2px solid ${design.primaryColor}; padding-bottom: 15px;">
                        <h1 style="margin: 0; font-size: 20px; color: ${design.primaryColor};">${design.headerText || 'Update from Agent'}</h1>
                    </div>
                    ${content}
                    ${renderSocialIcons(design)}
                    <div style="margin-top: 50px; font-size: 11px; color: #999; text-align: center;">
                        ${design.footerText || 'Sent via Intelligent Real Estate CRM'}
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 'luxury',
        name: 'Luxury Dark',
        preview: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=200&h=150',
        render: (design: designState, content: string) => `
            <div style="background-color: #1a1a1a; padding: 40px; font-family: 'Times New Roman', serif; color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #333; background-color: #000000; padding: 40px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                         <div style="display: inline-block; border: 1px solid ${design.primaryColor}; padding: 10px 20px;">
                            <span style="letter-spacing: 5px; color: ${design.primaryColor};">${design.headerText || 'LUXURY COLLECTION'}</span>
                         </div>
                    </div>
                    <div style="color: #cccccc;">
                        ${content}
                    </div>
                    ${renderSocialIcons(design, true)}
                    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #333; padding-top: 20px; font-size: 12px; color: #666;">
                        ${design.footerText || '&copy; 2026 High-End Estates'}
                    </div>
                </div>
            </div>
        `
    }
];

const DEFAULT_TEMPLATES = [
    {
        name: 'New Listing Alert',
        subject: 'New Apartment Matching Your Search!',
        content: '<h3>Great news!</h3><p>A new listing has just gone live that fits your criteria perfectly. Located in the heart of the city, this 2-bedroom unit features modern amenities and stunning views.</p><p>Check the listing details below to schedule a viewing before it\'s gone!</p>',
        type: 'email'
    },
    {
        name: 'Welcome Prospect',
        subject: 'Welcome to our platform',
        content: '<h1>Welcome.</h1><p>We are excited to help you find your dream home. Our portal gives you exclusive access to off-market listings and virtual tours.</p><p>What kind of property are you looking for today?</p>',
        type: 'email'
    },
    {
        name: 'Lead Re-engagement',
        subject: 'Still looking for property?',
        content: '<p>Hi there,</p><p>We noticed it\'s been a while since your last visit. The market has been moving fast! We have several new units that might interest you.</p><p>Would you like to schedule a quick call this week?</p>',
        type: 'email'
    }
];

interface designState {
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    headerText: string;
    footerText: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
}

const renderSocialIcons = (design: designState, isDark = false) => {
    const links = [
        { id: 'facebook', icon: 'fb' },
        { id: 'twitter', icon: 'tw' },
        { id: 'instagram', icon: 'ig' },
        { id: 'linkedin', icon: 'ln' }
    ].filter(s => (design as any)[s.id]);

    if (links.length === 0) return '';

    return `
        <div style="padding: 10px 40px; text-align: center;">
            ${links.map(l => `
                <a href="${(design as any)[l.id]}" style="display: inline-block; margin: 0 10px; color: ${isDark ? design.primaryColor : '#888'}; text-decoration: none; font-weight: bold;">${l.icon.toUpperCase()}</a>
            `).join('')}
        </div>
    `;
};

interface TemplateManagerProps {
    tenantId: string;
}

export default function TemplateManager({ tenantId }: TemplateManagerProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'designer'>('designer');
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [templateData, setTemplateData] = useState({
        name: '',
        subject: '',
        content: '',
        type: 'email'
    });

    const [design, setDesign] = useState<designState>({
        theme: 'modern',
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        backgroundColor: '#f8f9fa',
        textColor: '#333333',
        headerText: '',
        footerText: '',
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
    });

    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [showTestInput, setShowTestInput] = useState(false);
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
        if (!templateData.name) return;
        setSaving(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            let finalContent = templateData.content;
            if (activeTab === 'designer') {
                // Quick protection: If content already looks like a finished email, don't re-theme it
                const isAlreadyThemed = templateData.content.includes('<div style="background-color:') || templateData.content.includes('<!DOCTYPE');

                if (isAlreadyThemed) {
                    const proceed = window.confirm("This template appears to already have a design applied. Re-applying a theme may cause layout issues. Continue anyway?");
                    if (!proceed) {
                        setSaving(false);
                        return;
                    }
                }

                const theme = DEFAULT_THEMES.find(t => t.id === design.theme) || DEFAULT_THEMES[0];
                finalContent = theme.render(design, templateData.content);
            }

            let res;
            if (isEditing && currentTemplateId) {
                res = await marketingService.updateTemplate(token, currentTemplateId, { ...templateData, content: finalContent, tenantId });
            } else {
                res = await marketingService.createTemplate(token, { ...templateData, content: finalContent, tenantId });
            }

            if (res.success) {
                alert('Template saved successfully!');
                setShowModal(false);
                loadTemplates();
                resetForm();
            } else {
                alert(res.message || 'Failed to save template');
            }
        } catch (error) {
            console.error('Failed to save template:', error);
            alert('Error saving template. Please check your connection.');
        } finally {
            setSaving(false);
        }
    };

    const handleSendTest = async () => {
        if (!testEmail) {
            alert('Please enter a test email address');
            return;
        }

        setSendingTest(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            let finalContent = templateData.content;
            if (activeTab === 'designer') {
                const theme = DEFAULT_THEMES.find(t => t.id === design.theme) || DEFAULT_THEMES[0];
                finalContent = theme.render(design, templateData.content);
            }

            const res = await marketingService.sendTestTemplateEmail(token, {
                templateId: currentTemplateId || undefined,
                email: testEmail,
                subject: templateData.subject || 'Test Email',
                content: finalContent
            });

            if (res.success) {
                alert('Test email sent successfully!');
                setShowTestInput(false);
            } else {
                alert(res.message || 'Failed to send test email');
            }
        } catch (error) {
            console.error('Failed to send test email:', error);
            alert('Error sending test email');
        } finally {
            setSendingTest(false);
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
        setActiveTab('editor'); // When editing existing, default to code editor
        setShowModal(true);
    };

    const handleQuickUse = (tpl: any) => {
        setTemplateData({
            ...templateData,
            name: tpl.name,
            subject: tpl.subject,
            content: tpl.content
        });
        setActiveTab('designer');
        setShowGallery(false);
        setShowModal(true);
    };

    const resetForm = () => {
        setTemplateData({ name: '', subject: '', content: '', type: 'email' });
        setIsEditing(false);
        setCurrentTemplateId(null);
        setDesign({
            theme: 'modern',
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            backgroundColor: '#f8f9fa',
            textColor: '#333333',
            headerText: '',
            footerText: '',
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: ''
        });
        setActiveTab('designer');
    };

    const previewHtml = () => {
        const theme = DEFAULT_THEMES.find(t => t.id === design.theme) || DEFAULT_THEMES[0];
        return activeTab === 'designer'
            ? theme.render(design, templateData.content || '<p style="text-align:center; color:#999; padding:20px;">[Your content will appear here]</p>')
            : templateData.content;
    };

    return (
        <div className="template-manager">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">Email Center</h5>
                    <p className="extra-small text-muted mb-0">Designs responsive campaigns for your property leads.</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => setShowGallery(true)}>
                        <i className="bi bi-grid-3x3-gap me-1"></i> Pre-built Gallery
                    </button>
                    <button className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm" onClick={() => { resetForm(); setActiveTab('designer'); setShowModal(true); }}>
                        <i className="bi bi-magic me-1"></i> Design Theme
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></div>
            ) : templates.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-light bg-opacity-50">
                    <i className="bi bi-envelope-paper display-4 text-muted opacity-25 mb-3"></i>
                    <h6 className="fw-bold text-muted">No Templates Created</h6>
                    <p className="text-muted small">Choose from our pre-built gallery to get started quickly.</p>
                    <div className="mt-3">
                        <button className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => setShowGallery(true)}>Open Gallery</button>
                    </div>
                </div>
            ) : (
                <div className="row g-4">
                    {templates.map(template => (
                        <div key={template.id} className="col-md-4">
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 template-card">
                                <div className="template-preview bg-light p-2 d-flex align-items-center justify-content-center border-bottom" style={{ height: '180px', overflow: 'hidden' }}>
                                    <div className="w-100 h-100 scale-down" dangerouslySetInnerHTML={{ __html: template.content?.substring(0, 1000) || '' }}></div>
                                </div>
                                <div className="card-body p-3">
                                    <h6 className="fw-bold mb-1 text-truncate">{template.name}</h6>
                                    <p className="text-muted extra-small mb-3 text-truncate">{template.subject || 'No Subject'}</p>
                                    <div className="d-flex justify-content-between align-items-center mt-auto">
                                        <span className="badge bg-light text-dark border extra-small text-uppercase">{template.type}</span>
                                        <div className="btn-group">
                                            <button className="btn btn-link btn-sm p-0 text-muted me-3" onClick={() => openEdit(template)}><i className="bi bi-pencil-square"></i></button>
                                            <button className="btn btn-link btn-sm p-0 text-danger" onClick={() => handleDelete(template.id, template.name)}><i className="bi bi-trash"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Gallery Modal */}
            {showGallery && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060, backdropFilter: 'blur(5px)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content border-0 shadow-lg rounded-5 overflow-hidden">
                            <div className="modal-header border-0 p-4">
                                <div>
                                    <h4 className="fw-bold mb-0">Pre-built Library</h4>
                                    <p className="extra-small text-muted mb-0">Professionally written real estate sequences.</p>
                                </div>
                                <button className="btn-close" onClick={() => setShowGallery(false)}></button>
                            </div>
                            <div className="modal-body p-4 pt-0">
                                <div className="row g-4">
                                    {DEFAULT_TEMPLATES.map((tpl, idx) => (
                                        <div key={idx} className="col-md-4">
                                            <div className="card h-100 border rounded-4 hover-shadow cursor-default transition-all">
                                                <div className="card-body p-4">
                                                    <div className="btn btn-xs btn-outline-primary mb-3">Professional</div>
                                                    <h6 className="fw-bold">{tpl.name}</h6>
                                                    <small className="text-muted d-block mb-3 h-40px overflow-hidden">{tpl.subject}</small>
                                                    <button className="btn btn-primary w-100 rounded-pill btn-sm fw-bold" onClick={() => handleQuickUse(tpl)}>Use Template</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal with Designer */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, backdropFilter: 'blur(5px)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content border-0 shadow-lg rounded-5 overflow-hidden">
                            <div className="modal-header border-0 bg-primary bg-opacity-10 p-4">
                                <h5 className="fw-bold mb-0 text-dark">
                                    <i className="bi bi-palette2 me-2 text-primary"></i>
                                    {isEditing ? 'Edit Existing Template' : 'Template Designer'}
                                </h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body p-0">
                                <div className="d-flex flex-column flex-lg-row" style={{ minHeight: '650px' }}>
                                    {/* Sidebar Controls */}
                                    <div className="bg-light p-4" style={{ width: '100%', maxWidth: '380px', maxHeight: '650px', overflowY: 'auto' }}>
                                        <div className="nav nav-pills nav-fill bg-white border p-1 rounded-pill mb-4">
                                            <button className={`nav-link rounded-pill px-4 btn-sm ${activeTab === 'designer' ? 'active shadow-sm' : ''}`} onClick={() => setActiveTab('designer')}>Design</button>
                                            <button className={`nav-link rounded-pill px-4 btn-sm ${activeTab === 'editor' ? 'active shadow-sm' : ''}`} onClick={() => setActiveTab('editor')}>HTML</button>
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label extra-small fw-bold text-uppercase text-muted">Internal Name</label>
                                            <input type="text" className="form-control border-0 shadow-sm" placeholder="e.g. Welcome Email" value={templateData.name} onChange={e => setTemplateData({ ...templateData, name: e.target.value })} />
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label extra-small fw-bold text-uppercase text-muted">Subject Line</label>
                                            <input type="text" className="form-control border-0 shadow-sm" placeholder="{{name}}, check this out!" value={templateData.subject} onChange={e => setTemplateData({ ...templateData, subject: e.target.value })} />
                                        </div>

                                        {activeTab === 'designer' ? (
                                            <>
                                                <div className="mb-4">
                                                    <label className="form-label extra-small fw-bold text-uppercase text-muted">Choose Theme</label>
                                                    <div className="row g-2">
                                                        {DEFAULT_THEMES.map(theme => (
                                                            <div key={theme.id} className="col-4">
                                                                <div
                                                                    onClick={() => setDesign({ ...design, theme: theme.id })}
                                                                    className={`rounded-3 overflow-hidden border-2 cursor-pointer transition-all ${design.theme === theme.id ? 'border-primary' : 'border-transparent'}`}
                                                                    title={theme.name}
                                                                >
                                                                    <img src={theme.preview} className="w-100 object-fit-cover" height="60" />
                                                                    <div className="text-center bg-white py-1"><small style={{ fontSize: '10px' }}>{theme.name}</small></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <label className="form-label extra-small fw-bold text-uppercase text-muted">Theme branding</label>
                                                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
                                                        <div className="mb-3">
                                                            <label className="extra-small text-muted mb-1">Header Text</label>
                                                            <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="e.g. LUXURY HOMES" value={design.headerText} onChange={e => setDesign({ ...design, headerText: e.target.value })} />
                                                        </div>
                                                        <div className="mb-0">
                                                            <label className="extra-small text-muted mb-1">Footer Copyright</label>
                                                            <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="e.g. © 2026 My Agency" value={design.footerText} onChange={e => setDesign({ ...design, footerText: e.target.value })} />
                                                        </div>
                                                    </div>

                                                    <label className="form-label extra-small fw-bold text-uppercase text-muted">Social Media Links</label>
                                                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
                                                        <div className="mb-2 d-flex align-items-center">
                                                            <i className="bi bi-facebook me-2 text-primary"></i>
                                                            <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="Facebook URL" value={design.facebook} onChange={e => setDesign({ ...design, facebook: e.target.value })} />
                                                        </div>
                                                        <div className="mb-2 d-flex align-items-center">
                                                            <i className="bi bi-instagram me-2 text-danger"></i>
                                                            <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="Instagram URL" value={design.instagram} onChange={e => setDesign({ ...design, instagram: e.target.value })} />
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <i className="bi bi-linkedin me-2 text-primary"></i>
                                                            <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="LinkedIn URL" value={design.linkedin} onChange={e => setDesign({ ...design, linkedin: e.target.value })} />
                                                        </div>
                                                    </div>

                                                    <label className="form-label extra-small fw-bold text-uppercase text-muted">Visual Styling</label>
                                                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                                                        <div className="mb-3">
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <small>Primary Accent</small>
                                                                <small className="font-monospace text-muted upper">{design.primaryColor}</small>
                                                            </div>
                                                            <input type="color" className="form-control form-control-color w-100 border-0" value={design.primaryColor} onChange={e => setDesign({ ...design, primaryColor: e.target.value })} />
                                                        </div>
                                                        <div className="mb-0">
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <small>Outer Background</small>
                                                                <small className="font-monospace text-muted upper">{design.backgroundColor}</small>
                                                            </div>
                                                            <input type="color" className="form-control form-control-color w-100 border-0" value={design.backgroundColor} onChange={e => setDesign({ ...design, backgroundColor: e.target.value })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : null}

                                        <div className="mb-4">
                                            <label className="form-label extra-small fw-bold text-uppercase text-muted">Body Content (HTML allowed)</label>
                                            <textarea className="form-control border-0 shadow-sm" rows={8} placeholder="<b>Hello!</b>..." value={templateData.content} style={{ fontFamily: 'monospace', fontSize: '13px' }} onChange={e => setTemplateData({ ...templateData, content: e.target.value })}></textarea>
                                        </div>
                                    </div>

                                    {/* Preview Area */}
                                    <div className="flex-grow-1 bg-secondary bg-opacity-10 d-flex flex-column">
                                        <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
                                            <div className="badge bg-light text-dark border"><i className="bi bi-display me-1"></i> Live Desktop Preview</div>
                                            <div className="text-muted extra-small">Auto-saving locally...</div>
                                        </div>
                                        <div className="flex-grow-1 p-4 d-flex align-items-center justify-content-center overflow-auto">
                                            <div className="bg-white shadow-lg mx-auto" style={{ width: '100%', maxWidth: '600px', height: '550px', border: '1px solid #ddd' }}>
                                                <iframe
                                                    srcDoc={previewHtml()}
                                                    className="w-100 h-100 border-0"
                                                    title="Preview"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4 bg-light bg-opacity-50 justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    {showTestInput ? (
                                        <div className="input-group input-group-sm" style={{ width: '300px' }}>
                                            <input
                                                type="email"
                                                className="form-control rounded-start-pill ps-3"
                                                placeholder="Enter test email..."
                                                value={testEmail}
                                                onChange={e => setTestEmail(e.target.value)}
                                            />
                                            <button
                                                className="btn btn-dark rounded-end-pill px-3"
                                                onClick={handleSendTest}
                                                disabled={sendingTest}
                                            >
                                                {sendingTest ? <span className="spinner-border spinner-border-sm"></span> : 'Send'}
                                            </button>
                                            <button className="btn btn-link link-muted btn-sm ms-1" onClick={() => setShowTestInput(false)}>Cancel</button>
                                        </div>
                                    ) : (
                                        <button className="btn btn-outline-dark rounded-pill px-4 btn-sm" onClick={() => setShowTestInput(true)}>
                                            <i className="bi bi-send me-2"></i> Send Test
                                        </button>
                                    )}
                                </div>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-link link-dark fw-bold text-decoration-none px-4" onClick={() => setShowModal(false)}>Discard</button>
                                    <button className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm d-flex align-items-center gap-2" onClick={handleSave} disabled={!templateData.name || saving}>
                                        {saving && <span className="spinner-border spinner-border-sm"></span>}
                                        {isEditing ? 'Save Changes' : 'Finalize & Save'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .template-card { transition: all 0.3s ease; border: 1px solid rgba(0,0,0,0.05); }
                .template-card:hover { transform: translateY(-5px); border-color: #007bff33; box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important; }
                .extra-small { font-size: 0.75rem; }
                .h-40px { height: 40px; }
                .upper { text-transform: uppercase; }
                .scale-down { transform: scale(0.3); transform-origin: top center; pointer-events: none; }
                .hover-shadow:hover { box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; border-color: #007bff !important; }
            `}</style>
        </div>
    );
}
