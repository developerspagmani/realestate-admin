'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getAuthToken } from '@/app/services/api';

interface Module {
    id: string;
    name: string;
    slug: string;
    description: string;
}

interface TenantModuleEntry {
    moduleId: string;
    isActive: boolean;
    module: Module;
}

// Derive tier from slug for labeling purposes
function getModuleTier(slug: string): { label: string; color: string } {
    const proPrefixes = ['social_', 'automation_', 'analytics_pro', 'discovery'];
    const addonPrefixes = ['website_cms', 'social_whatsapp', 'social_interactions'];
    if (addonPrefixes.some(p => slug.startsWith(p) || slug === p)) {
        return { label: 'Add-on', color: 'purple' };
    }
    if (proPrefixes.some(p => slug.startsWith(p) || slug === p)) {
        return { label: 'Pro', color: 'primary' };
    }
    return { label: 'Standard', color: 'success' };
}

const MODULE_ICONS: Record<string, string> = {
    properties: 'bi-building',
    units: 'bi-grid-3x3-gap',
    bookings: 'bi-calendar-check',
    leads: 'bi-person-lines-fill',
    agents: 'bi-person-badge',
    payments: 'bi-credit-card',
    social_all: 'bi-share',
    social_posts: 'bi-megaphone',
    social_whatsapp: 'bi-whatsapp',
    social_interactions: 'bi-chat-dots',
    automation_engine: 'bi-robot',
    website_cms: 'bi-globe',
    discovery: 'bi-compass',
    analytics_pro: 'bi-graph-up-arrow',
};

export default function OwnerModules() {
    const { id: ownerId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // moduleId being toggled
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [allModules, setAllModules] = useState<Module[]>([]);
    const [activeMap, setActiveMap] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            // Get owner → tenantId
            const { userService, moduleService } = await import('@/app/services/api');
            const ownerRes = await userService.getUserById(token, ownerId as string);
            if (!ownerRes.success || !ownerRes.data?.user?.tenantId) {
                setLoading(false);
                return;
            }

            const tid = ownerRes.data.user.tenantId;
            setTenantId(tid);

            // Parallel: all system modules + tenant module assignments
            const [allRes, tenantRes] = await Promise.all([
                moduleService.getAllModules(token),
                moduleService.getTenantModules(token, tid)
            ]);

            if (allRes.success) {
                const mods: Module[] = allRes.data?.modules || allRes.data || [];
                setAllModules(mods);
            }

            if (tenantRes.success) {
                const entries: TenantModuleEntry[] = tenantRes.data || [];
                const map: Record<string, boolean> = {};
                entries.forEach(e => { map[e.moduleId] = e.isActive; });
                setActiveMap(map);
            }
        } catch (err) {
            console.error('Failed to load modules:', err);
            showToast('Failed to load module data', 'error');
        } finally {
            setLoading(false);
        }
    }, [ownerId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleToggle = async (moduleId: string, currentValue: boolean) => {
        if (!tenantId) return;
        const newValue = !currentValue;

        // Optimistic update
        setActiveMap(prev => ({ ...prev, [moduleId]: newValue }));
        setSaving(moduleId);

        try {
            const token = getAuthToken();
            if (!token) return;
            const { moduleService } = await import('@/app/services/api');
            const res = await moduleService.toggleModule(token, { tenantId, moduleId, isActive: newValue });
            if (res.success) {
                showToast(`Module ${newValue ? 'enabled' : 'disabled'} successfully`);
            } else {
                // Revert on failure
                setActiveMap(prev => ({ ...prev, [moduleId]: currentValue }));
                showToast(res.message || 'Failed to toggle module', 'error');
            }
        } catch (err: any) {
            setActiveMap(prev => ({ ...prev, [moduleId]: currentValue }));
            showToast(err.message || 'Error toggling module', 'error');
        } finally {
            setSaving(null);
        }
    };

    const enableAll = async () => {
        if (!tenantId || !window.confirm('Enable ALL modules for this owner?')) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const { moduleService } = await import('@/app/services/api');
            const newMap = { ...activeMap };
            for (const mod of allModules) {
                if (!activeMap[mod.id]) {
                    await moduleService.toggleModule(token, { tenantId, moduleId: mod.id, isActive: true });
                    newMap[mod.id] = true;
                }
            }
            setActiveMap(newMap);
            showToast('All modules enabled');
        } catch (err: any) {
            showToast(err.message || 'Error enabling modules', 'error');
        }
    };

    const disableAll = async () => {
        if (!tenantId || !window.confirm('Disable ALL modules for this owner?')) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const { moduleService } = await import('@/app/services/api');
            const newMap = { ...activeMap };
            for (const mod of allModules) {
                if (activeMap[mod.id]) {
                    await moduleService.toggleModule(token, { tenantId, moduleId: mod.id, isActive: false });
                    newMap[mod.id] = false;
                }
            }
            setActiveMap(newMap);
            showToast('All modules disabled');
        } catch (err: any) {
            showToast(err.message || 'Error disabling modules', 'error');
        }
    };

    const filteredModules = allModules.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.slug.toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = allModules.filter(m => activeMap[m.id]).length;

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-3 small">Loading module configuration...</p>
            </div>
        );
    }

    if (!tenantId) {
        return (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                <i className="bi bi-exclamation-circle text-warning fs-1 mb-3"></i>
                <h5 className="fw-bold">No Tenant Linked</h5>
                <p className="text-muted">This owner does not have a tenant account associated yet.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header Card */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3"
                    style={{ background: 'linear-gradient(135deg, #11998e20, #38ef7d20)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-success p-3 rounded-3 text-white">
                            <i className="bi bi-puzzle-fill fs-4"></i>
                        </div>
                        <div>
                            <h5 className="fw-bold mb-0">Module Configuration</h5>
                            <p className="text-muted small mb-0">
                                <span className="text-success fw-semibold">{activeCount}</span> of {allModules.length} modules enabled
                            </p>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-success rounded-3 px-3" onClick={enableAll}>
                            <i className="bi bi-check-all me-1"></i>Enable All
                        </button>
                        <button className="btn btn-sm btn-outline-danger rounded-3 px-3" onClick={disableAll}>
                            <i className="bi bi-x-circle me-1"></i>Disable All
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="input-group input-group-lg bg-white shadow-sm rounded-3 border-0">
                    <span className="input-group-text bg-transparent border-0 pe-0">
                        <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                        type="text"
                        className="form-control bg-transparent border-0 ps-3"
                        placeholder="Search modules..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="btn btn-link text-muted border-0" onClick={() => setSearch('')}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Module Grid */}
            <div className="row g-3">
                {filteredModules.length === 0 ? (
                    <div className="col-12 text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 mb-3 d-block"></i>
                        No modules match your search.
                    </div>
                ) : filteredModules.map(mod => {
                    const isActive = activeMap[mod.id] ?? false;
                    const isSaving = saving === mod.id;
                    const tier = getModuleTier(mod.slug);
                    const icon = MODULE_ICONS[mod.slug] || 'bi-grid';
                    return (
                        <div key={mod.id} className="col-md-6 col-xl-4">
                            <div className={`card border-0 shadow-sm rounded-4 overflow-hidden module-card ${isActive ? 'active-module' : ''}`}>
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-start justify-content-between mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`p-2 rounded-3 ${isActive ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                                                style={{ transition: 'all 0.2s' }}>
                                                <i className={`bi ${icon} fs-5`}></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark small">{mod.name}</div>
                                                <div className="extra-small text-muted font-monospace">{mod.slug}</div>
                                            </div>
                                        </div>
                                        <span className={`badge rounded-pill px-2 py-1 bg-${tier.color}-soft text-${tier.color} extra-small`}>
                                            {tier.label}
                                        </span>
                                    </div>

                                    {mod.description && (
                                        <p className="text-muted extra-small mb-3 lh-base">{mod.description}</p>
                                    )}

                                    <div className="d-flex align-items-center justify-content-between">
                                        <span className={`small fw-semibold ${isActive ? 'text-success' : 'text-muted'}`}>
                                            {isActive ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <div className="form-check form-switch mb-0">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                checked={isActive}
                                                onChange={() => handleToggle(mod.id, isActive)}
                                                disabled={isSaving}
                                                style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                                            />
                                        </div>
                                        {isSaving && (
                                            <span className="spinner-border spinner-border-sm text-primary ms-2" style={{ width: '16px', height: '16px' }}></span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Toast */}
            {toast.show && (
                <div
                    className={`position-fixed bottom-0 end-0 m-4 alert alert-${toast.type === 'success' ? 'success' : 'danger'} shadow-lg rounded-4 d-flex align-items-center gap-3`}
                    style={{ zIndex: 9999, minWidth: '260px', animation: 'slideUp 0.3s ease' }}
                >
                    <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} fs-5`}></i>
                    <span className="fw-medium small">{toast.message}</span>
                </div>
            )}

            <style>{`
                .extra-small { font-size: 11px; }
                .module-card { transition: all 0.2s ease; }
                .module-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important; }
                .active-module { border-left: 3px solid #0d6efd !important; }
                .bg-primary-soft { background-color: rgba(13,110,253,0.1); }
                .bg-success-soft { background-color: rgba(25,135,84,0.1); }
                .bg-purple-soft { background-color: rgba(111,66,193,0.1); }
                .text-purple { color: #6f42c1; }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
