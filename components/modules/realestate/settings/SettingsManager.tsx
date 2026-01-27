'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';

interface SettingsManagerProps {
    mode: 'admin' | 'owner';
}

export default function SettingsManager({ mode }: SettingsManagerProps) {
    const { user, isAuthenticated, isAdmin, isOwner, loading: authLoading } = useAuthContext();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<any>({
        general: {
            siteName: 'Antigravity Coworking',
            supportEmail: 'support@antigravity.com',
            contactPhone: '+1 (555) 123-4567',
            address: '123 Workspace Ave, Tech City',
            currency: 'USD',
            timezone: 'UTC',
        },
        appearance: {
            primaryColor: '#6366f1',
            logoUrl: '',
            darkMode: false,
        },
        notifications: {
            emailBookings: true,
            emailLeads: true,
            emailUpdates: false,
            whatsappAlerts: true,
        },
        tenant: {
            name: '',
            domain: '',
            type: 2, // 2: Co-working
        },
        backup: {
            autoBackup: false,
            frequency: 'weekly',
            lastBackup: null,
        }
    });



    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadSettings = async () => {
        if (!user || !user.tenantId) return;
        setLoading(true);
        try {
            const { tenantService } = await import('@/app/services/api');
            const token = getAuthToken();
            if (!token) return;

            const response = await tenantService.getTenantById(token, user.tenantId);
            if (response.success && response.data) {
                const tenant = response.data;
                const dbSettings = tenant.settings || {};

                setSettings({
                    general: {
                        siteName: tenant.name || '',
                        supportEmail: dbSettings.general?.supportEmail || 'support@antigravity.com',
                        contactPhone: dbSettings.general?.contactPhone || '+1 (555) 123-4567',
                        address: tenant.address || '',
                        currency: dbSettings.general?.currency || 'USD',
                        timezone: dbSettings.general?.timezone || 'UTC',
                    },
                    appearance: {
                        primaryColor: dbSettings.appearance?.primaryColor || '#6366f1',
                        logoUrl: dbSettings.appearance?.logoUrl || '',
                        darkMode: dbSettings.appearance?.darkMode || false,
                    },
                    notifications: {
                        emailBookings: dbSettings.notifications?.emailBookings ?? true,
                        emailLeads: dbSettings.notifications?.emailLeads ?? true,
                        emailUpdates: dbSettings.notifications?.emailUpdates ?? false,
                        whatsappAlerts: dbSettings.notifications?.whatsappAlerts ?? true,
                    },
                    tenant: {
                        name: tenant.name || '',
                        domain: tenant.domain || '',
                        type: tenant.type || 2,
                    },
                    backup: {
                        autoBackup: dbSettings.backup?.autoBackup || false,
                        frequency: dbSettings.backup?.frequency || 'weekly',
                        lastBackup: dbSettings.backup?.lastBackup || null,
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            showToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mounted || authLoading) return;
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }
        loadSettings();
    }, [user, isAuthenticated, mounted, authLoading, router]);

    const handleExportBackup = () => {
        const backupData = JSON.stringify(settings, null, 2);
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${mode}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Backup downloaded successfully!');
    };

    const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedSettings = JSON.parse(event.target?.result as string);
                // Validate structure roughly
                if (!importedSettings.general || !importedSettings.appearance) {
                    throw new Error('Invalid backup file format');
                }

                await setSettings(importedSettings); // Update state

                // Automatically save after import? Or let user click save.
                // Let's autosave to persist

                // We reuse the save logic but passing the new settings directly would be better
                // For now, we update state and trigger save. 
                // However, state update is async, so we should call update API directly here.

                if (!user?.tenantId) return;
                setSaving(true);

                const { tenantService } = await import('@/app/services/api');
                const token = getAuthToken();
                if (!token) return;

                const updatePayload = {
                    name: importedSettings.general.siteName,
                    address: importedSettings.general.address,
                    settings: importedSettings
                };

                const response = await tenantService.updateTenant(token, user.tenantId, updatePayload);
                if (response.success) {
                    showToast('Backup restored successfully!');
                } else {
                    showToast('Restored settings locally but failed to save to server.', 'error');
                }

            } catch (err) {
                console.error('Import error:', err);
                showToast('Failed to import backup. Invalid file.', 'error');
            } finally {
                setSaving(false);
            }
        };
        reader.readAsText(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user?.tenantId) return;

        setSaving(true);
        try {
            const { tenantService } = await import('@/app/services/api');
            const token = getAuthToken();
            if (!token) return;

            // Update last backup date if saving backup settings
            const timestamp = new Date().toISOString();
            const newSettings = activeTab === 'backup' ? {
                ...settings,
                backup: { ...settings.backup, lastBackup: timestamp }
            } : settings;

            // Prepare update payload
            const updatePayload = {
                name: newSettings.general.siteName,
                address: newSettings.general.address,
                settings: newSettings // Entire settings object as a JSON blob
            };

            const response = await tenantService.updateTenant(token, user.tenantId, updatePayload);
            if (response.success) {
                if (activeTab === 'backup') {
                    setSettings(newSettings); // Update local state
                }
                showToast('Settings updated successfully!');
            } else {
                showToast(response.message || 'Failed to update settings', 'error');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            showToast('Error saving settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!mounted || !user) return null;

    return (
        <MainLayout activePage="settings">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">{mode === 'admin' ? 'Global Settings' : 'Account Settings'}</h1>
                        <p className="text-muted small mb-0">Manage your organization preferences and details.</p>
                    </div>
                    <button
                        className="btn btn-primary px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <><span className="spinner-border spinner-border-sm"></span>Saving...</>
                        ) : (
                            <><i className="bi bi-check2-circle"></i>Save Changes</>
                        )}
                    </button>
                </div>

                <div className="row g-4">
                    <div className="col-lg-3">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="list-group list-group-flush p-2">
                                <button
                                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center py-3 ${activeTab === 'general' ? 'bg-primary text-white shadow-sm fw-bold' : 'text-muted'}`}
                                    onClick={() => setActiveTab('general')}
                                >
                                    <i className={`bi bi-gear-fill me-3 ${activeTab === 'general' ? '' : 'text-primary'}`}></i>
                                    <span>General</span>
                                </button>
                                <button
                                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center py-3 ${activeTab === 'tenant' ? 'bg-primary text-white shadow-sm fw-bold' : 'text-muted'}`}
                                    onClick={() => setActiveTab('tenant')}
                                >
                                    <i className={`bi bi-building me-3 ${activeTab === 'tenant' ? '' : 'text-primary'}`}></i>
                                    <span>Organization</span>
                                </button>
                                <button
                                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center py-3 ${activeTab === 'appearance' ? 'bg-primary text-white shadow-sm fw-bold' : 'text-muted'}`}
                                    onClick={() => setActiveTab('appearance')}
                                >
                                    <i className={`bi bi-palette-fill me-3 ${activeTab === 'appearance' ? '' : 'text-primary'}`}></i>
                                    <span>Appearance</span>
                                </button>
                                <button
                                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center py-3 ${activeTab === 'notifications' ? 'bg-primary text-white shadow-sm fw-bold' : 'text-muted'}`}
                                    onClick={() => setActiveTab('notifications')}
                                >
                                    <i className={`bi bi-bell-fill me-3 ${activeTab === 'notifications' ? '' : 'text-primary'}`}></i>
                                    <span>Notifications</span>
                                </button>
                                <button
                                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center py-3 ${activeTab === 'backup' ? 'bg-primary text-white shadow-sm fw-bold' : 'text-muted'}`}
                                    onClick={() => setActiveTab('backup')}
                                >
                                    <i className={`bi bi-database-fill-gear me-3 ${activeTab === 'backup' ? '' : 'text-primary'}`}></i>
                                    <span>Data Backup</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-9">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                            <div className="card-body p-4 p-md-5">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary opacity-50 mb-3"></div>
                                        <p className="text-muted small">Loading your preferences...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSave}>
                                        {activeTab === 'general' && (
                                            <div className="fade-in">
                                                <h4 className="fw-bold mb-4">General Configuration</h4>
                                                <div className="row g-4">
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Platform Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-lg bg-light border-0"
                                                            value={settings.general.siteName}
                                                            onChange={(e) => setSettings({ ...settings, general: { ...settings.general, siteName: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Base Currency</label>
                                                        <select
                                                            className="form-select form-select-lg bg-light border-0"
                                                            value={settings.general.currency}
                                                            onChange={(e) => setSettings({ ...settings, general: { ...settings.general, currency: e.target.value } })}
                                                        >
                                                            <option value="USD">USD - US Dollar</option>
                                                            <option value="EUR">EUR - Euro</option>
                                                            <option value="GBP">GBP - British Pound</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Support Email</label>
                                                        <input type="email" className="form-control form-control-lg bg-light border-0" value={settings.general.supportEmail} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, supportEmail: e.target.value } })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Contact Phone</label>
                                                        <input type="tel" className="form-control form-control-lg bg-light border-0" value={settings.general.contactPhone} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, contactPhone: e.target.value } })} />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Organization Address</label>
                                                        <textarea
                                                            className="form-control form-control-lg bg-light border-0"
                                                            rows={2}
                                                            value={settings.general.address}
                                                            onChange={(e) => setSettings({ ...settings, general: { ...settings.general, address: e.target.value } })}
                                                            placeholder="e.g. 123 Workspace Ave, Tech City"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'tenant' && (
                                            <div className="fade-in">
                                                <h4 className="fw-bold mb-4">Organization Profile</h4>
                                                <div className="row g-4">
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Organization Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-lg bg-light border-0"
                                                            value={settings.tenant.name}
                                                            onChange={(e) => setSettings({ ...settings, tenant: { ...settings.tenant, name: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Custom Domain</label>
                                                        <div className="input-group input-group-lg">
                                                            <span className="input-group-text bg-light border-0 text-muted fw-bold">https://</span>
                                                            <input type="text" className="form-control bg-light border-0" value={settings.tenant.domain} readOnly />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'appearance' && (
                                            <div className="fade-in">
                                                <h4 className="fw-bold mb-4">Branding & UI</h4>
                                                <div className="row g-4">
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-uppercase text-muted d-block">Brand Color</label>
                                                        <div className="d-flex align-items-center p-3 bg-light rounded-3">
                                                            <input
                                                                type="color"
                                                                className="form-control form-control-color border-0 rounded-circle me-3"
                                                                value={settings.appearance.primaryColor}
                                                                onChange={(e) => setSettings({ ...settings, appearance: { ...settings.appearance, primaryColor: e.target.value } })}
                                                            />
                                                            <span className="fw-bold font-monospace">{settings.appearance.primaryColor.toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 d-flex align-items-end">
                                                        <div className="form-check form-switch p-3 bg-light rounded-3 w-100 ps-5 border-0">
                                                            <input className="form-check-input ms-0" type="checkbox" checked={settings.appearance.darkMode} onChange={(e) => setSettings({ ...settings, appearance: { ...settings.appearance, darkMode: e.target.checked } })} />
                                                            <label className="form-check-label fw-bold text-uppercase small text-muted ms-3">Enable Dark Mode</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'notifications' && (
                                            <div className="fade-in">
                                                <h4 className="fw-bold mb-4">Notifications</h4>
                                                <div className="list-group list-group-flush rounded-4 overflow-hidden border">
                                                    <div className="list-group-item p-4 d-flex justify-content-between align-items-center border-0 border-bottom">
                                                        <div>
                                                            <div className="fw-bold">Booking Emails</div>
                                                            <div className="small text-muted">Send automated confirmation emails for new bookings.</div>
                                                        </div>
                                                        <div className="form-check form-switch fs-4">
                                                            <input className="form-check-input" type="checkbox" checked={settings.notifications.emailBookings} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, emailBookings: e.target.checked } })} />
                                                        </div>
                                                    </div>
                                                    <div className="list-group-item p-4 d-flex justify-content-between align-items-center border-0 border-bottom">
                                                        <div>
                                                            <div className="fw-bold">Lead Alerts</div>
                                                            <div className="small text-muted">Push notifications for new leads from the website.</div>
                                                        </div>
                                                        <div className="form-check form-switch fs-4">
                                                            <input className="form-check-input" type="checkbox" checked={settings.notifications.emailLeads} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, emailLeads: e.target.checked } })} />
                                                        </div>
                                                    </div>
                                                    <div className="list-group-item p-4 d-flex justify-content-between align-items-center border-0 border-bottom">
                                                        <div>
                                                            <div className="fw-bold">Marketing Updates</div>
                                                            <div className="small text-muted">Receive news about new features and platform updates.</div>
                                                        </div>
                                                        <div className="form-check form-switch fs-4">
                                                            <input className="form-check-input" type="checkbox" checked={settings.notifications.emailUpdates} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, emailUpdates: e.target.checked } })} />
                                                        </div>
                                                    </div>
                                                    <div className="list-group-item p-4 d-flex justify-content-between align-items-center border-0">
                                                        <div>
                                                            <div className="fw-bold">WhatsApp Alerts</div>
                                                            <div className="small text-muted">Receive critical booking alerts directly on WhatsApp.</div>
                                                        </div>
                                                        <div className="form-check form-switch fs-4">
                                                            <input className="form-check-input" type="checkbox" checked={settings.notifications.whatsappAlerts} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, whatsappAlerts: e.target.checked } })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'backup' && (
                                            <div className="fade-in">
                                                <h4 className="fw-bold mb-4">Data Backup & Restore</h4>

                                                <div className="card bg-light border-0 rounded-4 mb-4">
                                                    <div className="card-body p-4">
                                                        <div className="d-flex align-items-center mb-3">
                                                            <div className="p-3 bg-white rounded-circle shadow-sm me-3">
                                                                <i className="bi bi-cloud-download text-primary fs-4"></i>
                                                            </div>
                                                            <div>
                                                                <h5 className="fw-bold mb-1">Export Settings</h5>
                                                                <p className="text-muted small mb-0">Download a JSON file of your current configuration.</p>
                                                            </div>
                                                            <div className="ms-auto">
                                                                <button type="button" onClick={handleExportBackup} className="btn btn-primary rounded-pill px-4">
                                                                    Download
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="card bg-light border-0 rounded-4 mb-4">
                                                    <div className="card-body p-4">
                                                        <div className="d-flex align-items-center mb-3">
                                                            <div className="p-3 bg-white rounded-circle shadow-sm me-3">
                                                                <i className="bi bi-cloud-upload text-success fs-4"></i>
                                                            </div>
                                                            <div>
                                                                <h5 className="fw-bold mb-1">Import Settings</h5>
                                                                <p className="text-muted small mb-0">Restore configuration from a backup file.</p>
                                                            </div>
                                                            <div className="ms-auto">
                                                                <label className="btn btn-outline-success rounded-pill px-4 cursor-pointer">
                                                                    Restore
                                                                    <input type="file" accept=".json" onChange={handleImportBackup} hidden />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <hr className="my-5" />

                                                <h5 className="fw-bold mb-3">Automatic Backup</h5>
                                                <div className="list-group list-group-flush rounded-4 overflow-hidden border">
                                                    <div className="list-group-item p-4 d-flex justify-content-between align-items-center border-0 border-bottom">
                                                        <div>
                                                            <div className="fw-bold">Enable Auto-Backup</div>
                                                            <div className="small text-muted">Automatically save settings snapshots.</div>
                                                        </div>
                                                        <div className="form-check form-switch fs-4">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={settings.backup.autoBackup}
                                                                onChange={(e) => setSettings({ ...settings, backup: { ...settings.backup, autoBackup: e.target.checked } })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="list-group-item p-4 border-0">
                                                        <label className="form-label fw-bold mb-2">Backup Frequency</label>
                                                        <select
                                                            className="form-select bg-light border-0"
                                                            value={settings.backup.frequency}
                                                            onChange={(e) => setSettings({ ...settings, backup: { ...settings.backup, frequency: e.target.value } })}
                                                            disabled={!settings.backup.autoBackup}
                                                        >
                                                            <option value="daily">Daily</option>
                                                            <option value="weekly">Weekly</option>
                                                            <option value="monthly">Monthly</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.4s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </MainLayout>
    );
}
