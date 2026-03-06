'use client';

import { useState, useEffect } from 'react';
import { adminService, getAuthToken } from '@/app/services/api';

interface SystemSetting {
    key: string;
    value: string;
    type?: string;
}

interface SystemConfigSubTabProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function SystemConfigSubTab({ showToast }: SystemConfigSubTabProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [trialDays, setTrialDays] = useState('15');

    useEffect(() => {
        loadSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const token = getAuthToken() || '';
            const res = await adminService.getSystemSettings(token);
            if (res.success) {
                const trialSetting = (res.data as SystemSetting[]).find((s) => s.key === 'default_trial_days');
                if (trialSetting) {
                    setTrialDays(trialSetting.value);
                }
            }
        } catch (error) {
            console.error('Failed to load system settings:', error);
            showToast('Failed to load system settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTrial = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = getAuthToken() || '';
            const res = await adminService.updateSystemSetting(token, 'default_trial_days', trialDays, 'number');
            if (res.success) {
                showToast('Trial period updated successfully!');
                loadSettings();
            }
        } catch (_error) {
            showToast('Failed to update trial period', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary opacity-50 mb-3"></div>
                <p className="text-muted small">Loading system configuration...</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <h4 className="fw-bold mb-4">System Configuration</h4>

            <div className="row g-4">
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 p-4 border border-primary-subtle bg-primary-soft">
                        <h5 className="fw-bold mb-3"><i className="bi bi-clock-history me-2 text-primary"></i> Default Trial Period</h5>
                        <p className="text-muted small mb-4">Set the number of days new registered owners can access premium modules for free.</p>

                        <form onSubmit={handleSaveTrial}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted">Trial Duration (Days)</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control border-primary-subtle"
                                        value={trialDays}
                                        onChange={(e) => setTrialDays(e.target.value)}
                                        min="1"
                                        max="365"
                                        required
                                    />
                                    <span className="input-group-text bg-white border-primary-subtle">Days</span>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-100 py-2 fw-bold"
                                disabled={saving}
                            >
                                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Update Default Trial'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-light">
                        <h5 className="fw-bold mb-3"><i className="bi bi-info-circle-fill me-2 text-primary"></i> System Info</h5>
                        <ul className="list-unstyled small mb-0">
                            <li className="mb-2 d-flex justify-content-between">
                                <span className="text-muted">Active Modules:</span>
                                <span className="fw-bold text-primary">Fully Enabled</span>
                            </li>
                            <li className="mb-2 d-flex justify-content-between">
                                <span className="text-muted">Database Status:</span>
                                <span className="text-success fw-bold">Connected</span>
                            </li>
                            <li className="mb-2 d-flex justify-content-between">
                                <span className="text-muted">Environment:</span>
                                <span className="badge bg-secondary-soft text-secondary">Production-Ready</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
