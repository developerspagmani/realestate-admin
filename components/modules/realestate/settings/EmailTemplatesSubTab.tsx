import React, { useState } from 'react';

interface EmailTemplatesSubTabProps {
    settings: any;
    setSettings: (settings: any) => void;
    onSave: () => void;
    saving: boolean;
}

export default function EmailTemplatesSubTab({ settings, setSettings, onSave, saving }: EmailTemplatesSubTabProps) {
    const [activeTemplate, setActiveTemplate] = useState('registration');

    const handleTemplateChange = (field: string, value: string) => {
        setSettings({
            ...settings,
            emailTemplates: {
                ...settings.emailTemplates,
                [activeTemplate]: {
                    ...settings.emailTemplates?.[activeTemplate],
                    [field]: value
                }
            }
        });
    };

    const defaultTemplates: any = {
        registration: {
            subject: 'Welcome to the platform, {name}!',
            content: '<p style="font-size: 16px; color: #374151;">Hello {name},</p><p style="font-size: 16px; color: #374151;">Thank you for registering with us. We are thrilled to have you on board!</p><p style="font-size: 16px; color: #374151;">To get started, please log in to your dashboard and complete your profile setup so we can tailor our recommendations for you.</p><p style="font-size: 16px; color: #374151;">Best regards,<br/>The Administration Team</p>',
            primaryColor: '#4f46e5'
        },
        activation: {
            subject: 'Please verify your email address',
            content: '<p style="font-size: 16px; color: #374151;">Hello {name},</p><p style="font-size: 16px; color: #374151;">You are just one step away from joining. Please click the button below to verify your email address and securely activate your account.</p><p style="font-size: 14px; color: #6b7280;">If you did not request this account creation, please completely ignore this email.</p>',
            primaryColor: '#059669'
        },
        resetPassword: {
            subject: 'Reset your password request',
            content: '<p style="font-size: 16px; color: #374151;">Hello {name},</p><p style="font-size: 16px; color: #374151;">We received a security request to reset the password for your account. Click the button below to enter a new password.</p><p style="font-size: 14px; color: #6b7280;">This secure link will expire in exactly 1 hour. If you did not request this password reset, please ignore this email and your password will remain entirely safe.</p>',
            primaryColor: '#ef4444'
        }
    };

    const currentTemplate = settings.emailTemplates?.[activeTemplate] || defaultTemplates[activeTemplate] || {
        subject: '',
        content: '',
        primaryColor: '#4f46e5'
    };

    const templatesList = [
        { id: 'registration', name: 'Registration / Welcome Link', icon: 'bi-envelope-paper' },
        { id: 'activation', name: 'Account Activation', icon: 'bi-check2-circle' },
        { id: 'resetPassword', name: 'Reset Password', icon: 'bi-key' }
    ];

    const logoUrl = settings.appearance?.logoUrl || 'https://via.placeholder.com/150x50?text=Your+Logo';
    const siteName = settings.general?.siteName || 'Your Organization';

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Email Templates</h4>
                    <p className="text-muted small mb-0">Customize your automated emails (Logos & names are appended automatically).</p>
                </div>
                <button
                    className="btn btn-primary rounded-4 px-4"
                    onClick={onSave}
                    disabled={saving}
                >
                    {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Save Templates'}
                </button>
            </div>

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-header bg-white border-0 pt-4 pb-0">
                            <h6 className="fw-bold text-uppercase extra-small text-muted mb-3">Select Template</h6>
                        </div>
                        <div className="card-body p-2 pt-0">
                            <ul className="list-group list-group-flush">
                                {templatesList.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTemplate(t.id)}
                                        className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 py-3 px-3 d-flex align-items-center ${activeTemplate === t.id ? 'bg-primary text-white fw-bold shadow-sm' : 'text-dark'}`}
                                    >
                                        <i className={`bi ${t.icon} me-3 ${activeTemplate === t.id ? 'text-white' : 'text-primary'}`}></i>
                                        {t.name}
                                    </button>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 rounded-4 h-100">
                        <div className="card-body p-4">
                            <div className="mb-4">
                                <label className="form-label small fw-bold text-muted">Email Subject Line</label>
                                <input
                                    type="text"
                                    className="form-control bg-light border-0 py-2"
                                    value={currentTemplate.subject || ''}
                                    onChange={(e) => handleTemplateChange('subject', e.target.value)}
                                    placeholder="E.g., Welcome to {AppName}!"
                                />
                            </div>

                            <div className="mb-4">
                                <div className="d-flex justify-content-between">
                                    <label className="form-label small fw-bold text-muted">Body Content (HTML allowed)</label>
                                    <span className="extra-small text-muted">Available variables: {'{name}, {token}, {link}'}</span>
                                </div>
                                <textarea
                                    className="form-control bg-light border-0"
                                    rows={8}
                                    value={currentTemplate.content || ''}
                                    onChange={(e) => handleTemplateChange('content', e.target.value)}
                                    placeholder="<p>Hello {name},</p><p>Welcome to our platform!</p>"
                                ></textarea>
                            </div>

                            <div className="mb-4">
                                <label className="form-label small fw-bold text-muted">Action Button Color</label>
                                <div className="d-flex align-items-center gap-3">
                                    <input
                                        type="color"
                                        className="form-control form-control-color border-0 p-1"
                                        value={currentTemplate.primaryColor || '#4f46e5'}
                                        onChange={(e) => handleTemplateChange('primaryColor', e.target.value)}
                                        title="Choose button color"
                                    />
                                    <span className="small text-muted font-monospace">{currentTemplate.primaryColor || '#4f46e5'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 mt-5">
                    <h6 className="fw-bold mb-3 extra-small pe-none text-muted text-uppercase">Live Preview</h6>
                    <div className="d-flex justify-content-center bg-light p-4 rounded-4 border">
                        <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", width: '100%', maxWidth: '600px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '40px' }} className="shadow-sm">
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" style={{ maxHeight: '50px', maxWidth: '180px' }} />
                                ) : (
                                    <h2 style={{ margin: 0, color: '#111827' }}>{siteName}</h2>
                                )}
                            </div>

                            <div dangerouslySetInnerHTML={{ __html: currentTemplate.content || `<p style="color: #6b7280; text-align: center; font-style: italic;">Your email content will appear here...</p>` }} />

                            <div style={{ textAlign: 'center', margin: '35px 0' }}>
                                <a href="#" style={{ backgroundColor: currentTemplate.primaryColor || '#4f46e5', color: '#ffffff', padding: '14px 30px', textDecoration: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '16px', display: 'inline-block' }}>Action Button Simulation</a>
                            </div>

                            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
                                <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', marginBottom: 0 }}>
                                    &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
