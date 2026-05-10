'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { moduleService, getAuthToken, tenantService } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import Loader from '@/components/common/Loader';

export default function ModuleManager() {
    const { user, isAdmin } = useAuthContext();
    const [tenants, setTenants] = useState<any[]>([]);
    const [allModules, setAllModules] = useState<any[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string>('');
    const [tenantActiveModules, setTenantActiveModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'assignments' | 'system'>('assignments');
    const [showSystemForm, setShowSystemForm] = useState(false);
    const [moduleFormData, setModuleFormData] = useState({ id: '', name: '', slug: '', description: '' });
    const [toastState, setToastState] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
    const { activeTenantId } = useManagementContext();

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToastState({ show: true, message, type });
    };

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

    const handleSystemModuleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            let res;
            if (moduleFormData.id) {
                res = await moduleService.updateModule(token, moduleFormData.id, moduleFormData);
            } else {
                res = await moduleService.createModule(token, moduleFormData);
            }

            if (res.success) {
                showToast(moduleFormData.id ? 'Module updated successfully' : 'Module created successfully', 'success');
                setShowSystemForm(false);
                setModuleFormData({ id: '', name: '', slug: '', description: '' });
                const modulesRes = await moduleService.getAllModules(token);
                if (modulesRes.success) setAllModules(modulesRes.data);
            } else {
                showToast(res.message || 'Error saving module', 'error');
            }
        } catch (error) {
            showToast('Failed to save module', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteModule = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete the module "${name}"? This will remove access for all tenants.`)) return;
        try {
            const token = getAuthToken();
            if (!token) return;

            const res = await moduleService.deleteModule(token, id);
            if (res.success) {
                showToast('Module deleted successfully', 'success');
                setAllModules(allModules.filter(m => m.id !== id));
            } else {
                showToast(res.message || 'Error deleting module', 'error');
            }
        } catch (error) {
            showToast('Failed to delete module', 'error');
        }
    };

    return (
        <MainLayout activePage="modules">
            <Toast 
                show={toastState.show} 
                message={toastState.message} 
                type={toastState.type} 
                onClose={() => setToastState({ ...toastState, show: false })} 
            />
            {loading && <Loader />}
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Module Center</h1>
                        <p className="text-muted small">Manage platform features and tenant access controls.</p>
                    </div>
                    <div className="btn-group shadow-sm">
                        <button 
                            className={`btn ${viewMode === 'assignments' ? 'btn-primary fw-bold' : 'btn-light text-muted'}`}
                            onClick={() => setViewMode('assignments')}
                        >
                            <i className="bi bi-diagram-3 me-2"></i>Tenant Entitlements
                        </button>
                        <button 
                            className={`btn ${viewMode === 'system' ? 'btn-primary fw-bold' : 'btn-light text-muted'}`}
                            onClick={() => setViewMode('system')}
                        >
                            <i className="bi bi-pc-display me-2"></i>System Modules
                        </button>
                    </div>
                </div>

                {viewMode === 'assignments' ? (

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
                                    {saving && <span className="ms-2"><Loader message="" fullPage={false} /></span>}
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
                                                let icon = 'grid-fill';
                                                let color = 'primary';

                                                if (module.slug === 'marketing_hub') {
                                                    icon = 'megaphone-fill';
                                                    color = 'danger';
                                                } else if (module.slug === 'widget_creator') {
                                                    icon = 'code-slash';
                                                    color = 'info';
                                                } else if (module.slug === 'analytics_pro') {
                                                    icon = 'bar-chart-fill';
                                                    color = 'success';
                                                } else if (module.slug === '3d_viewer') {
                                                    icon = 'box';
                                                    color = 'warning';
                                                } else if (module.slug === 'propintel_ai') {
                                                    icon = 'robot';
                                                    color = 'primary';
                                                } else if (module.slug === 'website_popups' || module.slug === 'popups') {
                                                    icon = 'chat-square-text-fill';
                                                    color = 'secondary';
                                                }

                                                return (
                                                    <div key={module.id} className="col-md-6">
                                                        <div className={`card border rounded-4 p-3 h-100 transition-all ${active ? `border-${color} bg-${color}-soft` : 'bg-light opacity-75'}`}>
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <div className={`bg-white rounded-3 p-2 shadow-xs mb-2 text-${color}`}>
                                                                    <i className={`bi bi-${icon}`}></i>
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
                ) : (
                    <div className="row g-4 animate-fade-in">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0">System Modules Definition</h5>
                                    <button 
                                        className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm"
                                        onClick={() => {
                                            setModuleFormData({ id: '', name: '', slug: '', description: '' });
                                            setShowSystemForm(true);
                                        }}
                                    >
                                        <i className="bi bi-plus-lg me-1"></i> Add Module
                                    </button>
                                </div>
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-light bg-opacity-50">
                                                <tr>
                                                    <th className="px-4 py-3 border-0 small text-muted text-uppercase fw-bold">Module ID (Slug)</th>
                                                    <th className="py-3 border-0 small text-muted text-uppercase fw-bold">Name</th>
                                                    <th className="py-3 border-0 small text-muted text-uppercase fw-bold">Description</th>
                                                    <th className="py-3 border-0 text-end px-4 small text-muted text-uppercase fw-bold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allModules.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-5 text-muted">No system modules defined.</td>
                                                    </tr>
                                                ) : (
                                                    allModules.map(module => (
                                                        <tr key={module.id}>
                                                            <td className="px-4 py-3"><code className="bg-light px-2 py-1 rounded">{module.slug}</code></td>
                                                            <td className="py-3 fw-bold">{module.name}</td>
                                                            <td className="py-3 text-muted small">{module.description}</td>
                                                            <td className="py-3 px-4 text-end">
                                                                <button 
                                                                    className="btn btn-sm btn-light rounded-circle me-2"
                                                                    onClick={() => {
                                                                        setModuleFormData({ id: module.id, name: module.name, slug: module.slug, description: module.description || '' });
                                                                        setShowSystemForm(true);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button 
                                                                    className="btn btn-sm btn-light-danger text-danger rounded-circle"
                                                                    onClick={() => handleDeleteModule(module.id, module.name)}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Module Modal Form */}
                        {showSystemForm && (
                            <>
                                <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                                <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
                                    <div className="modal-dialog modal-dialog-centered">
                                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                            <div className="modal-header bg-light border-0 px-4 py-3">
                                                <h5 className="modal-title fw-bold">{moduleFormData.id ? 'Edit System Module' : 'Create New Module'}</h5>
                                                <button type="button" className="btn-close" onClick={() => setShowSystemForm(false)}></button>
                                            </div>
                                            <div className="modal-body p-4">
                                                <form onSubmit={handleSystemModuleSubmit}>
                                                    <div className="mb-3">
                                                        <label className="form-label small fw-bold">Module Name</label>
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            required 
                                                            placeholder="e.g. Marketing Hub"
                                                            value={moduleFormData.name}
                                                            onChange={e => setModuleFormData({...moduleFormData, name: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="form-label small fw-bold">URL Slug / Identifier</label>
                                                        <input 
                                                            type="text" 
                                                            className="form-control text-monospace" 
                                                            required 
                                                            placeholder="e.g. marketing_hub"
                                                            value={moduleFormData.slug}
                                                            onChange={e => setModuleFormData({...moduleFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                                                        />
                                                        <div className="form-text small">Unique system identifier. Only lowercase, numbers, and underscores.</div>
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="form-label small fw-bold">Description</label>
                                                        <textarea 
                                                            className="form-control" 
                                                            rows={3}
                                                            placeholder="Describe what this module allows tenants to do..."
                                                            value={moduleFormData.description}
                                                            onChange={e => setModuleFormData({...moduleFormData, description: e.target.value})}
                                                        ></textarea>
                                                    </div>
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowSystemForm(false)}>Cancel</button>
                                                        <button type="submit" className="btn btn-primary rounded-pill px-4 shadow-sm" disabled={saving}>
                                                            {saving ? 'Saving...' : 'Save Module'}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            <style jsx>{`
                .bg-primary-soft { background-color: rgba(99, 102, 241, 0.05); }
                .bg-danger-soft { background-color: rgba(239, 68, 68, 0.05); }
                .bg-info-soft { background-color: rgba(59, 130, 246, 0.05); }
                .bg-success-soft { background-color: rgba(34, 197, 94, 0.05); }
                .bg-warning-soft { background-color: rgba(245, 158, 11, 0.05); }
                .extra-small { font-size: 11px; }
                .transition-all { transition: all 0.2s ease; }
                .bg-light.opacity-75 { border: 1px dashed #dee2e6; }
            `}</style>
        </MainLayout>
    );
}
