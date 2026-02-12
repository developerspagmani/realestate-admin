'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { subscriptionService, licenseKeyService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';

interface Plan {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    interval: string;
    status: number;
    features: any;
}

interface LicenseKey {
    id: string;
    key: string;
    planId: string;
    status: number;
    activatedAt: string;
    plan: { name: string };
    tenant?: { name: string; domain: string };
}

interface SubscriptionsManagerProps {
    mode?: 'admin' | 'owner';
}

export default function SubscriptionsManager({ mode = 'admin' }: SubscriptionsManagerProps) {
    const { user, isAuthenticated, isAdmin, isOwner, loading: authLoading } = useAuthContext();
    const [activeTab, setActiveTab] = useState<'plans' | 'keys'>('plans');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [allModules, setAllModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const [planForm, setPlanForm] = useState({
        name: '',
        slug: '',
        description: '',
        price: 0,
        interval: 'yearly',
        status: 1,
        features: {},
        moduleIds: [] as string[]
    });

    const [keyForm, setKeyForm] = useState({
        planId: '',
        count: 1
    });

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const router = useRouter();

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        if (authLoading) return;

        const isAuthorized = mode === 'admin' ? isAdmin : (isAdmin || isOwner);

        if (!isAuthenticated || !isAuthorized) {
            router.push('/login');
            return;
        }
        loadData();
        loadModules();
    }, [isAuthenticated, isAdmin, isOwner, authLoading, activeTab, mode]);

    const loadModules = async () => {
        try {
            const token = getAuthToken() || '';
            const { moduleService } = await import('@/app/services/module');
            const res = await moduleService.getAllModules(token);
            if (res.success) {
                setAllModules(res.data.modules || res.data || []);
            }
        } catch (error) {
            console.error('Failed to load modules:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const token = getAuthToken() || '';
            if (activeTab === 'plans') {
                const res = await subscriptionService.getPlans();
                if (res.success) setPlans(res.data.plans);
            } else {
                const res = await licenseKeyService.getAll(token);
                if (res.success) setKeys(res.data.keys);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getAuthToken() || '';
            let res;
            if (editingPlan) {
                res = await subscriptionService.updatePlan(token, editingPlan.id, planForm);
            } else {
                res = await subscriptionService.createPlan(token, planForm);
            }

            if (res.success) {
                showToast(editingPlan ? 'Plan updated' : 'Plan created');
                setShowPlanModal(false);
                loadData();
            }
        } catch (error: any) {
            showToast(error.message || 'Action failed', 'error');
        }
    };

    const handleKeyGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getAuthToken() || '';
            const res = await licenseKeyService.generate(token, keyForm);
            if (res.success) {
                showToast('Keys generated successfully');
                setShowKeyModal(false);
                loadData();
            }
        } catch (error: any) {
            showToast(error.message || 'Action failed', 'error');
        }
    };

    return (
        <MainLayout activePage="subscriptions">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">{mode === 'admin' ? 'Subscription Management' : 'Available Plans'}</h2>
                        <p className="text-muted small mb-0">
                            {mode === 'admin'
                                ? 'Manage plans and license keys for property owners'
                                : 'Explore subscription plans and premium module bundles'}
                        </p>
                    </div>
                </div>

                {mode === 'admin' && (
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-header bg-white border-0 p-0">
                            <ul className="nav nav-tabs nav-fill border-bottom-0">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link py-3 border-0 rounded-0 fs-6 fw-bold ${activeTab === 'plans' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                                        onClick={() => setActiveTab('plans')}
                                    >
                                        Subscription Plans
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link py-3 border-0 rounded-0 fs-6 fw-bold ${activeTab === 'keys' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                                        onClick={() => setActiveTab('keys')}
                                    >
                                        License Keys
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'plans' ? (
                    <div>
                        {mode === 'admin' && (
                            <div className="d-flex justify-content-end mb-3">
                                <button className="btn btn-primary px-4 rounded-4 fw-bold shadow-sm" onClick={() => { setEditingPlan(null); setPlanForm({ name: '', slug: '', description: '', price: 0, interval: 'yearly', status: 1, features: {}, moduleIds: [] }); setShowPlanModal(true); }}>
                                    <i className="bi bi-plus-lg me-2"></i> Create New Plan
                                </button>
                            </div>
                        )}
                        <div className="row g-4">
                            {plans.map((plan: any) => (
                                <div className="col-md-4" key={plan.id}>
                                    <div className="card border-0 shadow-sm rounded-4 h-100 p-4 transition-all hover-up">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <span className={`badge rounded-4 px-3 py-1 ${plan.status === 1 ? 'bg-success-soft text-success' : 'bg-secondary-soft text-secondary'}`}>
                                                {plan.status === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                            {mode === 'admin' && (
                                                <button className="btn btn-link text-primary p-0" onClick={() => {
                                                    setEditingPlan(plan);
                                                    setPlanForm({
                                                        ...plan,
                                                        moduleIds: plan.modules?.map((m: any) => m.id) || []
                                                    });
                                                    setShowPlanModal(true);
                                                }}>
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                            )}
                                        </div>
                                        <h4 className="fw-bold mb-1">{plan.name}</h4>
                                        <div className="text-muted small mb-3">{plan.slug}</div>
                                        <div className="display-5 fw-bold mb-4">${plan.price}<span className="fs-6 fw-normal text-muted">/{plan.interval}</span></div>
                                        <p className="text-muted small flex-grow-1">{plan.description}</p>

                                        <div className="mt-3">
                                            <h6 className="small-caps mb-2">Modules:</h6>
                                            <div className="d-flex flex-wrap gap-1">
                                                {plan.modules?.map((mod: any) => (
                                                    <span key={mod.id} className="badge bg-light text-primary border border-primary-subtle extra-small">
                                                        {mod.name}
                                                    </span>
                                                ))}
                                                {(!plan.modules || plan.modules.length === 0) && <span className="text-muted extra-small italic">No modules assigned</span>}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-top">
                                            <h6 className="small-caps mb-3">Included Features:</h6>
                                            <ul className="list-unstyled mb-0 extra-small">
                                                {Object.entries(plan.features || {}).map(([key, val]: any) => (
                                                    <li key={key} className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i> {key}: {String(val)}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="d-flex justify-content-end mb-3">
                            <button className="btn btn-primary px-4 rounded-4 fw-bold shadow-sm" onClick={() => setShowKeyModal(true)}>
                                <i className="bi bi-key-fill me-2"></i> Generate Batch
                            </button>
                        </div>
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="vi-table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">License Key</th>
                                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Plan</th>
                                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Status</th>
                                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Used By</th>
                                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0 text-end">Created At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {keys.map(key => (
                                            <tr key={key.id}>
                                                <td className="px-4 py-3 fw-mono text-primary font-monospace">{key.key}</td>
                                                <td className="py-3 fw-bold">{key.plan.name}</td>
                                                <td className="py-3">
                                                    <span className={`badge rounded-4 px-3 py-1 ${key.status === 1 ? 'bg-success-soft text-success' : key.status === 2 ? 'bg-warning-soft text-warning' : 'bg-danger-soft text-danger'}`}>
                                                        {key.status === 1 ? 'Unused' : key.status === 2 ? 'Used' : 'Void'}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    {key.tenant ? (
                                                        <div>
                                                            <div className="fw-bold small">{key.tenant.name}</div>
                                                            <div className="text-muted extra-small">{key.tenant.domain}</div>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-end text-muted small">{new Date(key.activatedAt || key.id).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showPlanModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4">
                                <h4 className="fw-bold mb-0">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h4>
                                <button type="button" className="btn-close" onClick={() => setShowPlanModal(false)}></button>
                            </div>
                            <form onSubmit={handlePlanSubmit}>
                                <div className="modal-body p-4 pt-0">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted">PLAN NAME</label>
                                            <input type="text" className="form-control bg-light border-0" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-muted">PRICE (USD)</label>
                                            <input type="number" className="form-control bg-light border-0" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: parseFloat(e.target.value) })} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-muted">INTERVAL</label>
                                            <select className="form-select bg-light border-0" value={planForm.interval} onChange={e => setPlanForm({ ...planForm, interval: e.target.value })}>
                                                <option value="yearly">Yearly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted">DESCRIPTION</label>
                                            <textarea className="form-control bg-light border-0" rows={2} value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })}></textarea>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted">ASSIGN MODULES</label>
                                            <div className="bg-light p-3 rounded-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                {allModules.map(mod => (
                                                    <div key={mod.id} className="form-check mb-2">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`mod-${mod.id}`}
                                                            checked={planForm.moduleIds.includes(mod.id)}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setPlanForm(prev => ({
                                                                    ...prev,
                                                                    moduleIds: checked
                                                                        ? [...prev.moduleIds, mod.id]
                                                                        : prev.moduleIds.filter(id => id !== mod.id)
                                                                }));
                                                            }}
                                                        />
                                                        <label className="form-check-label fs-14" htmlFor={`mod-${mod.id}`}>
                                                            {mod.name} <span className="extra-small text-muted">({mod.slug})</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4">
                                    <button type="button" className="btn btn-light px-4" onClick={() => setShowPlanModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4 fw-bold">Save Plan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showKeyModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4">
                                <h4 className="fw-bold mb-0">Generate Keys</h4>
                                <button type="button" className="btn-close" onClick={() => setShowKeyModal(false)}></button>
                            </div>
                            <form onSubmit={handleKeyGenerate}>
                                <div className="modal-body p-4 pt-0">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted">FOR PLAN</label>
                                            <select className="form-select bg-light border-0" value={keyForm.planId} onChange={e => setKeyForm({ ...keyForm, planId: e.target.value })} required>
                                                <option value="">Select a plan</option>
                                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted">COUNT</label>
                                            <input type="number" className="form-control bg-light border-0" value={keyForm.count} onChange={e => setKeyForm({ ...keyForm, count: parseInt(e.target.value) })} min={1} max={50} required />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4">
                                    <button type="submit" className="btn btn-primary w-100 fw-bold py-2">Generate Keys</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .bg-primary-soft { background-color: rgba(0, 0, 0, 0.05); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                .bg-secondary-soft { background-color: rgba(108, 117, 125, 0.1); }
                .small-caps { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: #94a3b8; }
                .extra-small { font-size: 0.75rem; }
                .hover-up:hover { transform: translateY(-5px); }
                .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
            `}</style>

            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
        </MainLayout>
    );
}
