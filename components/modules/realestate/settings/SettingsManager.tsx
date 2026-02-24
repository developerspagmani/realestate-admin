'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import { getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import SubscriptionSubTab from './SubscriptionSubTab';
import SystemConfigSubTab from './SystemConfigSubTab';

interface SettingsManagerProps {
    mode: 'admin' | 'owner';
}

export default function SettingsManager({ mode }: SettingsManagerProps) {
    const { user, isAuthenticated, loading: authLoading, isAdmin, isOwner } = useAuthContext();
    const { activeTenantId, refreshTenant } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const [settings, setSettings] = useState<any>({
        general: {
            siteName: '',
            supportEmail: '',
            contactPhone: '',
            address: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
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
            type: 2,
        },
        backup: {
            autoBackup: false,
            frequency: 'weekly',
            lastBackup: null,
        },
        privacy: {
            gdprConsent: false,
            cookieNotice: true,
            privacyLink: '',
            termsLink: '',
        }
    });

    const [profile, setProfile] = useState<any>({
        firstName: '',
        lastName: '',
        name: '',
        email: '',
        phone: '',
        companyName: '',
        website: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [resetLoading, setResetLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

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
        if (!user) return;
        setLoading(true);
        try {
            const { tenantService, userService } = await import('@/app/services/api');
            const token = getAuthToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const effectiveTenantId = mode === 'admin' ? activeTenantId : (user?.tenantId || null);

            // Load Tenant Settings if tenantId exists
            if (effectiveTenantId) {
                const tenantRes = await tenantService.getTenantById(token, effectiveTenantId);
                if (tenantRes.success && tenantRes.data) {
                    const tenant = tenantRes.data;
                    const dbSettings = tenant.settings || {};

                    setSettings({
                        general: {
                            siteName: tenant.name || '',
                            supportEmail: dbSettings.general?.supportEmail || '',
                            contactPhone: dbSettings.general?.contactPhone || '',
                            address: tenant.address || '',
                            city: tenant.city || '',
                            state: tenant.state || '',
                            country: tenant.country || '',
                            postalCode: tenant.postalCode || '',
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
                            type: tenant.type || (mode === 'owner' ? 1 : 2),
                        },
                        backup: {
                            autoBackup: dbSettings.backup?.autoBackup || false,
                            frequency: dbSettings.backup?.frequency || 'weekly',
                            lastBackup: dbSettings.backup?.lastBackup || null,
                        },
                        privacy: {
                            gdprConsent: dbSettings.privacy?.gdprConsent ?? false,
                            cookieNotice: dbSettings.privacy?.cookieNotice ?? true,
                            privacyLink: dbSettings.privacy?.privacyLink || '',
                            termsLink: dbSettings.privacy?.termsLink || '',
                        }
                    });
                }
            }

            // Load User Profile
            const profileRes = await userService.getProfile(token);
            if (profileRes.success && profileRes.data?.user) {
                const u = profileRes.data.user;
                setProfile({
                    firstName: u.firstName || '',
                    lastName: u.lastName || '',
                    name: u.name || '',
                    email: u.email || '',
                    phone: u.phone || '',
                    companyName: u.companyName || '',
                    website: u.website || '',
                    addressLine1: u.addressLine1 || '',
                    addressLine2: u.addressLine2 || '',
                    city: u.city || '',
                    state: u.state || '',
                    country: u.country || '',
                    zipCode: u.zipCode || '',
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
        if (settings.appearance.darkMode) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
        }
    }, [settings.appearance.darkMode]);

    useEffect(() => {
        if (!mounted || authLoading) return;
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }
        loadSettings();
    }, [user, isAuthenticated, mounted, authLoading, router]);

    const handleSaveSettings = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const token = getAuthToken();
        if (!token) return;

        const effectiveTenantId = mode === 'admin' ? activeTenantId : (user?.tenantId || null);
        if (!effectiveTenantId) {
            showToast('No tenant context found to save settings', 'error');
            setSaving(false);
            return;
        }

        setSaving(true);
        try {
            const { tenantService } = await import('@/app/services/api');

            const timestamp = new Date().toISOString();
            const newSettings = activeTab === 'backup' ? {
                ...settings,
                backup: { ...settings.backup, lastBackup: timestamp }
            } : settings;

            const updatePayload = {
                name: newSettings.general.siteName,
                address: newSettings.general.address,
                city: newSettings.general.city,
                state: newSettings.general.state,
                country: newSettings.general.country,
                postalCode: newSettings.general.postalCode,
                settings: newSettings
            };

            const response = await tenantService.updateTenant(token, effectiveTenantId, updatePayload);
            if (response.success) {
                if (activeTab === 'backup') {
                    setSettings(newSettings);
                }

                // Refresh the global management context to update currency symbols etc.
                await refreshTenant();

                // Re-fetch local settings to stay in sync
                await loadSettings();

                showToast('Organization settings updated successfully!');
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

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSaving(true);
        try {
            const { userService } = await import('@/app/services/api');
            const token = getAuthToken();
            if (!token) return;

            const profileUpdateData = {
                ...profile,
                name: `${profile.firstName} ${profile.lastName}`.trim()
            };

            const res = await userService.updateProfile(token, profileUpdateData);
            if (res.success) {
                showToast('Profile updated successfully!');
                // Update profile local state with response just in case
                if (res.data?.user) {
                    setProfile(res.data.user);
                }
            } else {
                showToast(res.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showToast('Error updating profile', 'error');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        setPasswordLoading(true);
        try {
            const { authService } = await import('@/app/services/api');
            const token = getAuthToken();
            if (!token) return;

            const res = await authService.updatePassword(token, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (res.success) {
                showToast('Password updated successfully!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                showToast(res.message || 'Failed to update password', 'error');
            }
        } catch (error) {
            console.error('Password update error:', error);
            showToast('Error updating password', 'error');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSendResetEmail = async () => {
        if (!user?.email) return;
        setResetLoading(true);
        try {
            const { authService } = await import('@/app/services/api');
            const res = await authService.forgotPassword(user.email);
            if (res.success) {
                showToast(`Reset link sent to ${user.email}`);
            } else {
                showToast(res.message || 'Failed to send reset email', 'error');
            }
        } catch (error) {
            console.error('Reset email error:', error);
            showToast('Error sending reset email', 'error');
        } finally {
            setResetLoading(false);
        }
    };

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
                if (!importedSettings.general || !importedSettings.appearance) {
                    throw new Error('Invalid backup file format');
                }

                await setSettings(importedSettings);
                const effectiveTenantId = mode === 'admin' ? activeTenantId : (user?.tenantId || null);
                if (!effectiveTenantId) return;

                setSaving(true);
                const { tenantService } = await import('@/app/services/api');
                const token = getAuthToken();
                if (!token) return;

                const updatePayload = {
                    name: importedSettings.general.siteName,
                    address: importedSettings.general.address,
                    city: importedSettings.general.city,
                    state: importedSettings.general.state,
                    country: importedSettings.general.country,
                    postalCode: importedSettings.general.postalCode,
                    settings: importedSettings
                };

                const response = await tenantService.updateTenant(token, effectiveTenantId, updatePayload);
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

    if (!mounted || !user) return null;

    return (
        <MainLayout activePage="settings">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">{mode === 'admin' ? 'Global Settings' : 'Account Settings'}</h1>
                        <p className="text-muted small mb-0">Manage your organization preferences and details.</p>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-lg-3">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="list-group list-group-flush p-2">
                                <button
                                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center py-3 ${activeTab === 'general' ? 'bg-primary text-white shadow-sm fw-bold' : 'text-muted'}`}
                                    onClick={() => setActiveTab('general')}
                                >
                                    <i className={`bi bi-person-bounding-box me-3 ${activeTab === 'general' ? '' : 'text-primary'}`}></i>
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
                                <button
                                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center py-3 ${activeTab === 'privacy' ? 'bg-primary text-white shadow-sm fw-bold' : 'text-muted'}`}
                                    onClick={() => setActiveTab('privacy')}
                                >
                                    <i className={`bi bi-shield-check me-3 ${activeTab === 'privacy' ? '' : 'text-primary'}`}></i>
                                    <span>Privacy & GDPR</span>
                                </button>
                                {mode === 'owner' && (
                                    <button
                                        className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center py-3 ${activeTab === 'subscription' ? 'bg-primary text-white shadow-sm fw-bold' : 'text-muted'}`}
                                        onClick={() => setActiveTab('subscription')}
                                    >
                                        <i className={`bi bi-gem me-3 ${activeTab === 'subscription' ? '' : 'text-primary'}`}></i>
                                        <span>Subscription</span>
                                    </button>
                                )}
                                <button
                                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center py-3 ${activeTab === 'security' ? 'bg-primary text-white shadow-sm fw-bold' : 'text-muted'}`}
                                    onClick={() => setActiveTab('security')}
                                >
                                    <i className={`bi bi-shield-lock-fill me-3 ${activeTab === 'security' ? '' : 'text-primary'}`}></i>
                                    <span>Security</span>
                                </button>
                                {mode === 'admin' && (
                                    <button
                                        className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center py-3 ${activeTab === 'system' ? 'bg-primary text-white shadow-sm fw-bold' : 'text-muted'}`}
                                        onClick={() => setActiveTab('system')}
                                    >
                                        <i className={`bi bi-gear-wide-connected me-3 ${activeTab === 'system' ? '' : 'text-primary'}`}></i>
                                        <span>System Config</span>
                                    </button>
                                )}
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
                                    <div className="fade-in">
                                        {activeTab === 'general' && (
                                            <div>
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <h4 className="fw-bold mb-0">Owner Profile</h4>
                                                    <button
                                                        className="btn btn-primary rounded-4 px-4"
                                                        onClick={handleSaveProfile}
                                                        disabled={profileSaving}
                                                    >
                                                        {profileSaving ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Update Profile'}
                                                    </button>
                                                </div>
                                                <div className="row g-4 mb-5">
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-muted">First Name</label>
                                                        <input type="text" className="form-control bg-light border-0" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-muted">Last Name</label>
                                                        <input type="text" className="form-control bg-light border-0" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-muted">Email Address</label>
                                                        <input type="email" className="form-control bg-light border-0" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-muted">Phone Number</label>
                                                        <input type="tel" className="form-control bg-light border-0" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-muted">Company Name</label>
                                                        <input type="text" className="form-control bg-light border-0" value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-muted">Website</label>
                                                        <input type="url" className="form-control bg-light border-0" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold text-muted">Address Line 1</label>
                                                        <input type="text" className="form-control bg-light border-0" value={profile.addressLine1} onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })} />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold text-muted">Address Line 2 (Optional)</label>
                                                        <input type="text" className="form-control bg-light border-0" value={profile.addressLine2} onChange={(e) => setProfile({ ...profile, addressLine2: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="form-label small fw-bold text-muted">City</label>
                                                        <input type="text" className="form-control bg-light border-0" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="form-label small fw-bold text-muted">State</label>
                                                        <input type="text" className="form-control bg-light border-0" value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="form-label small fw-bold text-muted">Country</label>
                                                        <input type="text" className="form-control bg-light border-0" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="form-label small fw-bold text-muted">Zip Code</label>
                                                        <input type="text" className="form-control bg-light border-0" value={profile.zipCode} onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })} />
                                                    </div>
                                                </div>

                                                <hr className="my-5" />

                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <h4 className="fw-bold mb-0">Platform Preferences</h4>
                                                    <button
                                                        className="btn btn-outline-primary rounded-4 px-4"
                                                        onClick={() => handleSaveSettings()}
                                                        disabled={saving}
                                                    >
                                                        {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Save Preferences'}
                                                    </button>
                                                </div>
                                                <div className="row g-4">
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Base Currency</label>
                                                        <select
                                                            className="form-select bg-light border-0"
                                                            value={settings.general.currency}
                                                            onChange={(e) => setSettings({ ...settings, general: { ...settings.general, currency: e.target.value } })}
                                                        >
                                                            <option value="USD">USD - US Dollar</option>
                                                            <option value="EUR">EUR - Euro</option>
                                                            <option value="GBP">GBP - British Pound</option>
                                                            <option value="INR">INR - Indian Rupee</option>
                                                            <option value="AED">AED - UAE Dirham</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Timezone</label>
                                                        <select
                                                            className="form-select bg-light border-0"
                                                            value={settings.general.timezone}
                                                            onChange={(e) => setSettings({ ...settings, general: { ...settings.general, timezone: e.target.value } })}
                                                        >
                                                            <option value="UTC">UTC (Universal Coordinated Time)</option>
                                                            <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                                                            <option value="America/New_York">EST (America/New_York)</option>
                                                            <option value="Europe/London">GMT (Europe/London)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'tenant' && (
                                            <div>
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <h4 className="fw-bold mb-0">Organization Profile</h4>
                                                    <button className="btn btn-primary rounded-4 px-4" onClick={() => handleSaveSettings()} disabled={saving}>
                                                        {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Update Org Info'}
                                                    </button>
                                                </div>
                                                <div className="row g-4">
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Organization Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-lg bg-light border-0"
                                                            value={settings.general.siteName}
                                                            onChange={(e) => setSettings({ ...settings, general: { ...settings.general, siteName: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Support Email</label>
                                                        <input type="email" className="form-control bg-light border-0" value={settings.general.supportEmail} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, supportEmail: e.target.value } })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Contact Phone</label>
                                                        <input type="tel" className="form-control bg-light border-0" value={settings.general.contactPhone} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, contactPhone: e.target.value } })} />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Address</label>
                                                        <input type="text" className="form-control bg-light border-0" value={settings.general.address} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, address: e.target.value } })} />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">City</label>
                                                        <input type="text" className="form-control bg-light border-0" value={settings.general.city || ''} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, city: e.target.value } })} />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">State</label>
                                                        <input type="text" className="form-control bg-light border-0" value={settings.general.state || ''} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, state: e.target.value } })} />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Country</label>
                                                        <input type="text" className="form-control bg-light border-0" value={settings.general.country || ''} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, country: e.target.value } })} />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Zip Code</label>
                                                        <input type="text" className="form-control bg-light border-0" value={settings.general.postalCode || ''} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, postalCode: e.target.value } })} />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small fw-bold text-uppercase text-muted">Custom Domain</label>
                                                        <div className="input-group">
                                                            <span className="input-group-text bg-light border-0 text-muted fw-bold">https://</span>
                                                            <input type="text" className="form-control bg-light border-0" value={settings.tenant.domain} readOnly />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'appearance' && (
                                            <div>
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <h4 className="fw-bold mb-0">Platform Appearance</h4>
                                                    <button className="btn btn-primary rounded-4 px-4" onClick={() => handleSaveSettings()} disabled={saving}>Save Preferences</button>
                                                </div>
                                                <div className="row g-4">
                                                    <div className="col-12">
                                                        <div className="form-check form-switch p-4 bg-light rounded-4 d-flex justify-content-between align-items-center ps-5 border-0 shadow-sm mb-3">
                                                            <div>
                                                                <label className="form-check-label fw-bold h5 mb-1 d-block">Dark Mode</label>
                                                                <span className="text-muted small">Switch the entire administrative interface to a dark theme for low-light environments.</span>
                                                            </div>
                                                            <input
                                                                className="form-check-input ms-0 fs-3"
                                                                type="checkbox"
                                                                checked={settings.appearance.darkMode}
                                                                onChange={(e) => {
                                                                    const isDark = e.target.checked;
                                                                    setSettings({ ...settings, appearance: { ...settings.appearance, darkMode: isDark } });
                                                                    // Immediate toggle for preview
                                                                    if (isDark) document.documentElement.setAttribute('data-bs-theme', 'dark');
                                                                    else document.documentElement.setAttribute('data-bs-theme', 'light');
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'notifications' && (
                                            <div>
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <h4 className="fw-bold mb-0">Notifications</h4>
                                                    <button className="btn btn-primary rounded-4 px-4" onClick={() => handleSaveSettings()} disabled={saving}>Save Changes</button>
                                                </div>
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

                                        {activeTab === 'privacy' && (
                                            <div>
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <h4 className="fw-bold mb-0">Privacy & GDPR Compliance</h4>
                                                    <button className="btn btn-primary rounded-4 px-4" onClick={() => handleSaveSettings()} disabled={saving}>Save Privacy Settings</button>
                                                </div>
                                                <div className="card bg-light border-0 rounded-4 mb-4">
                                                    <div className="card-body p-4">
                                                        <div className="form-check form-switch d-flex justify-content-between align-items-center mb-4 p-0">
                                                            <div className="ps-0">
                                                                <label className="form-check-label fw-bold h5 mb-1 d-block">Cookie Consent Banner</label>
                                                                <p className="text-muted small mb-0">Display a GDPR-compliant cookie consent popup to your visitors.</p>
                                                            </div>
                                                            <input
                                                                className="form-check-input ms-0 fs-3"
                                                                type="checkbox"
                                                                checked={settings.privacy.cookieNotice}
                                                                onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, cookieNotice: e.target.checked } })}
                                                            />
                                                        </div>
                                                        <div className="form-check form-switch d-flex justify-content-between align-items-center mb-4 p-0">
                                                            <div className="ps-0">
                                                                <label className="form-check-label fw-bold h5 mb-1 d-block">Strictly GDPR Compliant</label>
                                                                <p className="text-muted small mb-0">Force users to accept cookies before tracking any analytical data.</p>
                                                            </div>
                                                            <input
                                                                className="form-check-input ms-0 fs-3"
                                                                type="checkbox"
                                                                checked={settings.privacy.gdprConsent}
                                                                onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, gdprConsent: e.target.checked } })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row g-4 mt-2">
                                                    <h5 className="fw-bold mb-0">Legal Links</h5>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-muted">Privacy Policy URL</label>
                                                        <input
                                                            type="url"
                                                            className="form-control bg-light border-0"
                                                            placeholder="https://example.com/privacy"
                                                            value={settings.privacy.privacyLink}
                                                            onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, privacyLink: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label small fw-bold text-muted">Terms of Service URL</label>
                                                        <input
                                                            type="url"
                                                            className="form-control bg-light border-0"
                                                            placeholder="https://example.com/terms"
                                                            value={settings.privacy.termsLink}
                                                            onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, termsLink: e.target.value } })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'backup' && (
                                            <div>
                                                <h4 className="fw-bold mb-4">Data Backup & Restore</h4>
                                                <div className="card bg-light border-0 rounded-4 mb-4">
                                                    <div className="card-body p-4 d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center">
                                                            <div className="p-3 bg-white rounded-circle shadow-sm me-3">
                                                                <i className="bi bi-cloud-download text-primary fs-4"></i>
                                                            </div>
                                                            <div>
                                                                <h5 className="fw-bold mb-1">Export Settings</h5>
                                                                <p className="text-muted small mb-0">Download a JSON file of your current configuration.</p>
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={handleExportBackup} className="btn btn-primary rounded-4 px-4">Download</button>
                                                    </div>
                                                </div>
                                                <div className="card bg-light border-0 rounded-4 mb-4">
                                                    <div className="card-body p-4 d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center">
                                                            <div className="p-3 bg-white rounded-circle shadow-sm me-3">
                                                                <i className="bi bi-cloud-upload text-success fs-4"></i>
                                                            </div>
                                                            <div>
                                                                <h5 className="fw-bold mb-1">Import Settings</h5>
                                                                <p className="text-muted small mb-0">Restore configuration from a backup file.</p>
                                                            </div>
                                                        </div>
                                                        <label className="btn btn-outline-success rounded-4 px-4 cursor-pointer mb-0">
                                                            Restore
                                                            <input type="file" accept=".json" onChange={handleImportBackup} hidden />
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="mt-5">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h5 className="fw-bold mb-0">Automatic Backup</h5>
                                                        <button className="btn btn-sm btn-link" onClick={() => handleSaveSettings()}>Apply Automation</button>
                                                    </div>
                                                    <div className="list-group list-group-flush rounded-4 overflow-hidden border">
                                                        <div className="list-group-item p-4 d-flex justify-content-between align-items-center border-0 border-bottom">
                                                            <div>
                                                                <div className="fw-bold">Enable Auto-Backup</div>
                                                                <div className="small text-muted">Automatically save settings snapshots.</div>
                                                            </div>
                                                            <div className="form-check form-switch fs-4">
                                                                <input className="form-check-input" type="checkbox" checked={settings.backup.autoBackup} onChange={(e) => setSettings({ ...settings, backup: { ...settings.backup, autoBackup: e.target.checked } })} />
                                                            </div>
                                                        </div>
                                                        <div className="list-group-item p-4 border-0">
                                                            <label className="form-label fw-bold mb-2">Backup Frequency</label>
                                                            <select className="form-select bg-light border-0" value={settings.backup.frequency} onChange={(e) => setSettings({ ...settings, backup: { ...settings.backup, frequency: e.target.value } })} disabled={!settings.backup.autoBackup}>
                                                                <option value="daily">Daily</option>
                                                                <option value="weekly">Weekly</option>
                                                                <option value="monthly">Monthly</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'subscription' && mode === 'owner' && (
                                            <SubscriptionSubTab showToast={showToast} />
                                        )}

                                        {activeTab === 'system' && mode === 'admin' && (
                                            <SystemConfigSubTab showToast={showToast} />
                                        )}

                                        {activeTab === 'security' && (
                                            <div>
                                                <h4 className="fw-bold mb-4">Security & Password</h4>
                                                <div className="row g-4">
                                                    <div className="col-lg-7">
                                                        <div className="card bg-light border-0 rounded-4">
                                                            <div className="card-body p-4">
                                                                <h5 className="fw-bold mb-3">Change Password</h5>
                                                                <div className="mb-3">
                                                                    <label className="form-label small fw-bold text-muted">Current Password</label>
                                                                    <input type="password" className="form-control bg-white border-0" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                                                                </div>
                                                                <div className="mb-3">
                                                                    <label className="form-label small fw-bold text-muted">New Password</label>
                                                                    <input type="password" className="form-control bg-white border-0" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                                                                </div>
                                                                <div className="mb-4">
                                                                    <label className="form-label small fw-bold text-muted">Confirm New Password</label>
                                                                    <input type="password" className="form-control bg-white border-0" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
                                                                </div>
                                                                <button type="button" className="btn btn-primary rounded-4 px-4" disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword} onClick={handleUpdatePassword}>
                                                                    {passwordLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Update Password'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-5">
                                                        <div className="card border p-4 rounded-4 h-100">
                                                            <div className="px-3 py-2 bg-primary bg-opacity-10 text-white rounded-circle d-inline-block mb-3" style={{ width: 'fit-content' }}>
                                                                <i className="bi bi-envelope-check fs-4"></i>
                                                            </div>
                                                            <h5 className="fw-bold mb-2">Password Reset Link</h5>
                                                            <p className="text-muted small mb-4">Prefer a secure reset link? We can send one to your registered email address <strong>{profile.email}</strong>.</p>
                                                            <button type="button" className="btn btn-outline-primary rounded-4 px-4 mt-auto" onClick={handleSendResetEmail} disabled={resetLoading}>
                                                                {resetLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Send Reset Email'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
