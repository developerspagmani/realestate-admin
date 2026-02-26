'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, getAuthToken } from '@/app/services/api';

interface SystemConfigSubTabProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function SystemConfigSubTab({ showToast }: SystemConfigSubTabProps) {
    const queryClient = useQueryClient();
    const token = typeof window !== 'undefined' ? getAuthToken() || '' : '';
    const [localTrialDays, setLocalTrialDays] = useState('15');

    const { data: systemSettings = [], isLoading: loading } = useQuery({
        queryKey: ['system-settings'],
        queryFn: async () => {
            const res = await adminService.getSystemSettings(token);
            if (res.success) {
                const trialSetting = res.data.find((s: any) => s.key === 'default_trial_days');
                if (trialSetting) setLocalTrialDays(trialSetting.value);
            }
            return res.success ? res.data : [];
        }
    });

    const updateSettingMutation = useMutation({
        mutationFn: async ({ key, value, type }: { key: string; value: string; type: string }) => {
            return await adminService.updateSystemSetting(token, key, value, type);
        },
        onSuccess: (res: any) => {
            if (res.success) {
                showToast('Trial period updated successfully!');
                queryClient.invalidateQueries({ queryKey: ['system-settings'] });
            } else {
                showToast(res.message || 'Failed to update setting', 'error');
            }
        },
        onError: () => {
            showToast('Failed to update trial period', 'error');
        }
    });

    const handleSaveTrial = (e: React.FormEvent) => {
        e.preventDefault();
        updateSettingMutation.mutate({ key: 'default_trial_days', value: localTrialDays, type: 'number' });
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary opacity-50 mb-3"></div>
                <p className="text-muted small">Loading system configuration...</p>
            </div>
        );
    }

    const saving = updateSettingMutation.isPending;

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
                                        name="trialDays"
                                        className="form-control border-primary-subtle"
                                        value={localTrialDays}
                                        onChange={(e) => setLocalTrialDays(e.target.value)}
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
