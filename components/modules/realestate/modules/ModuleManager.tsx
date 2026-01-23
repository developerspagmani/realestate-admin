'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { moduleService, getAuthToken, tenantService } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';

export default function ModuleManager() {
    const { user, isAdmin } = useAuthContext();
    const [tenants, setTenants] = useState<any[]>([]);
    const [allModules, setAllModules] = useState<any[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string>('');
    const [tenantActiveModules, setTenantActiveModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { activeTenantId } = useManagementContext();

    useEffect(() => {
        if (isAdmin) {
            loadInitialData();
        }
    }, [isAdmin]);

    useEffect(() => {
        if (activeTenantId && tenants.length > 0) {
            setSelectedTenantId(activeTenantId);
            loadTenantModules(activeTenantId);
        }
    }, [activeTenantId, tenants]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const [tenantsRes, modulesRes] = await Promise.all([
                tenantService.getTenants(token),
                moduleService.getAllModules(token)
            ]);

            if (tenantsRes.success) setTenants(tenantsRes.data);
            if (modulesRes.success) setAllModules(modulesRes.data);
        } catch (error) {
            console.error('Failed to load module management data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTenantModules = async (tenantId: string) => {
        if (!tenantId) {
            setTenantActiveModules([]);
            return;
        }
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await moduleService.getTenantModules(token, tenantId);
            if (res.success) {
                setTenantActiveModules(res.data);
            }
        } catch (error) {
            console.error('Failed to load tenant modules:', error);
        }
    };

    const handleToggleModule = async (moduleId: string, currentStatus: boolean) => {
        if (!selectedTenantId) return;
        try {
            setSaving(true);
            const token = getAuthToken();
            if (!token) return;

            const response = await moduleService.toggleModule(token, {
                tenantId: selectedTenantId,
                moduleId,
                isActive: !currentStatus
            });

            if (response.success) {
                await loadTenantModules(selectedTenantId);
            }
        } catch (error) {
            console.error('Failed to toggle module:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isAdmin) return <div>Access Denied</div>;

    const isModuleActive = (moduleId: string) => {
        return tenantActiveModules.find(tm => tm.moduleId === moduleId)?.isActive || false;
    };

    return (
        <MainLayout activePage="modules">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Module Entitlements</h1>
                        <p className="text-muted small">Manage feature access for each property owner (Tenant).</p>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                            <div className="card-header bg-white border-0 p-4">
                                <h5 className="fw-bold mb-0">Select Tenant</h5>
                            </div>
                            <div className="card-body p-4 pt-0">
                                <ul className="list-group list-group-flush">
                                    {tenants.map(tenant => (
                                        <button
                                            key={tenant.id}
                                            className={`list-group-item list-group-item-action border-0 rounded-3 mb-2 d-flex justify-content-between align-items-center ${selectedTenantId === tenant.id ? 'active bg-primary' : ''}`}
                                            onClick={() => {
                                                setSelectedTenantId(tenant.id);
                                                loadTenantModules(tenant.id);
                                            }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className={`avatar-sm rounded-circle me-3 text-center d-flex align-items-center justify-content-center ${selectedTenantId === tenant.id ? 'bg-white text-primary' : 'bg-light text-muted'}`} style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-building"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold small">{tenant.name}</div>
                                                    <div className="extra-small opacity-75">{tenant.type === 1 ? 'Real Estate' : 'Co-working'}</div>
                                                </div>
                                            </div>
                                            <i className="bi bi-chevron-right small"></i>
                                        </button>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-8">
                        {selectedTenantId ? (
                            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                                <div className="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0">Available Features</h5>
                                    {saving && <div className="spinner-border spinner-border-sm text-primary"></div>}
                                </div>
                                <div className="card-body p-4 pt-0">
                                    {allModules.length === 0 ? (
                                        <div className="text-center py-5">
                                            <p className="text-muted">No modules defined in the system.</p>
                                        </div>
                                    ) : (
                                        <div className="row g-3">
                                            {allModules.map(module => {
                                                const active = isModuleActive(module.id);
                                                return (
                                                    <div key={module.id} className="col-md-6">
                                                        <div className={`card border rounded-4 p-3 h-100 transition-all ${active ? 'border-primary bg-primary-soft' : 'bg-light opacity-75'}`}>
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <div className="bg-white rounded-3 p-2 shadow-xs mb-2">
                                                                    <i className={`bi bi-${module.slug === 'widget_creator' ? 'code-slash' : 'grid-fill'} text-primary`}></i>
                                                                </div>
                                                                <div className="form-check form-switch border-0">
                                                                    <input
                                                                        className="form-check-input hvr-grow"
                                                                        type="checkbox"
                                                                        role="switch"
                                                                        checked={active}
                                                                        onChange={() => handleToggleModule(module.id, active)}
                                                                        disabled={saving}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <h6 className="fw-bold mb-1">{module.name}</h6>
                                                            <p className="extra-small text-muted mb-0">{module.description || `The ${module.name} allows advanced platform features.`}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="card border-0 shadow-sm rounded-4 h-100 d-flex align-items-center justify-content-center p-5 bg-light border-dashed">
                                <div className="text-center opacity-50">
                                    <i className="bi bi-person-check display-3"></i>
                                    <h5 className="mt-3">Select a tenant to manage their features</h5>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                .bg-primary-soft { background-color: rgba(99, 102, 241, 0.05); }
                .extra-small { font-size: 11px; }
                .transition-all { transition: all 0.2s ease; }
                .bg-light.opacity-75 { border: 1px dashed #dee2e6; }
            `}</style>
        </MainLayout>
    );
}
