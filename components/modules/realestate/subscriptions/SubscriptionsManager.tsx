'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { subscriptionService, licenseKeyService, upgradeRequestService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
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
    features: Record<string, string | number | boolean>;
    modules?: PlanModule[];
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

interface PlanModule {
    id: string;
    name: string;
    slug?: string;
}

interface SubscriptionsManagerProps {
    mode?: 'admin' | 'owner';
}

export default function SubscriptionsManager({ mode = 'admin' }: SubscriptionsManagerProps) {
    const { user, isAuthenticated, isAdmin, isOwner, loading: authLoading } = useAuthContext();
    const { activeTenant } = useManagementContext();
    const [activeTab, setActiveTab] = useState<'plans' | 'keys'>('plans');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [allModules, setAllModules] = useState<PlanModule[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<Plan | null>(null);
    const [upgradeMessage, setUpgradeMessage] = useState('');
    const [submittingUpgrade, setSubmittingUpgrade] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
    const [deleteConfirmLevel, setDeleteConfirmLevel] = useState(0);

    const [planForm, setPlanForm] = useState({
        name: '',
        slug: '',
        description: '',
        price: 0,
        interval: 'yearly',
        status: 1,
        features: {} as Record<string, string | number | boolean>,
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
        if (mode === 'admin') {
            loadModules();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                showToast(editingPlan ? 'Plan saved & synced to all tenants' : 'Plan created successfully');
                setShowPlanModal(false);
                loadData();
            } else {
                showToast(res.message || 'Action failed', 'error');
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Action failed';
            showToast(msg, 'error');
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (deletingPlanId !== id) {
            setDeletingPlanId(id);
            setDeleteConfirmLevel(1);
            setTimeout(() => {
                setDeletingPlanId(null);
                setDeleteConfirmLevel(0);
            }, 5000); // 5s to confirm
            return;
        }

        if (deleteConfirmLevel === 1) {
            setDeleteConfirmLevel(2);
            return;
        }

        try {
            const token = getAuthToken() || '';
            const res = await subscriptionService.deletePlan(token, id);
            if (res.success) {
                showToast('Plan deleted successfully');
                setDeletingPlanId(null);
                setDeleteConfirmLevel(0);
                loadData();
            } else {
                showToast(res.message || 'Failed to delete plan', 'error');
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error deleting plan';
            showToast(msg, 'error');
        }
    };

    const handleAddFeature = () => {
        setPlanForm(prev => ({
            ...prev,
            features: { ...prev.features, '': '' }
        }));
    };

    const handleUpdateFeature = (oldKey: string, newKey: string, value: string | number | boolean) => {
        const newFeatures = { ...planForm.features };
        if (oldKey !== newKey) {
            delete newFeatures[oldKey];
        }
        newFeatures[newKey] = value;
        setPlanForm(prev => ({ ...prev, features: newFeatures }));
    };

    const handleRemoveFeature = (key: string) => {
        const newFeatures = { ...planForm.features };
        delete newFeatures[key];
        setPlanForm(prev => ({ ...prev, features: newFeatures }));
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
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Action failed';
            showToast(msg, 'error');
        }
    };

    const handleUpgradeRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUpgradePlan || !user) return;

        setSubmittingUpgrade(true);
        try {
            const res = await upgradeRequestService.submitRequest({
                requestedPlanId: selectedUpgradePlan.id,
                email: user.email,
                message: upgradeMessage
            });

            if (res.success) {
                showToast('Upgrade request sent successfully! We will contact you at ' + user.email);
                setShowUpgradeModal(false);
                setUpgradeMessage('');
            } else {
                showToast(res.message || 'Failed to send request', 'error');
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Action failed';
            showToast(msg, 'error');
        } finally {
            setSubmittingUpgrade(false);
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

                {mode === 'owner' && (
                    <div className="card border-0 shadow-sm rounded-4 mb-5 overflow-hidden">
                        <div className="card-body p-0">
                            <div className="row g-0">
                                <div className="col-lg-8 p-4">
                                    <div className="d-flex align-items-center gap-4">
                                        <div className="bg-primary bg-opacity-10 rounded-5 p-4">
                                            <i className="bi bi-shield-check text-white display-6"></i>
                                        </div>
                                        <div>
                                            <div className="extra-small text-uppercase fw-bold text-muted mb-1 ls-1">Account Standing</div>
                                            <h3 className="fw-bold mb-1">
                                                {activeTenant?.plan?.name || 'Free Trial'}
                                                <span className="ms-3 badge bg-success bg-opacity-10 text-success fs-14 align-middle border border-success border-opacity-25 rounded-pill px-3 py-1">
                                                    <i className="bi bi-patch-check-fill me-1"></i> Active
                                                </span>
                                            </h3>
                                            <p className="text-muted mb-0 small">
                                                Your organization is currently on the <strong>{activeTenant?.plan?.name || 'Starter'}</strong> plan billed {activeTenant?.plan?.interval || 'monthly'}.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 bg-light bg-opacity-50 p-4 border-start d-flex align-items-center">
                                    <div className="w-100">
                                        <div className="extra-small text-uppercase fw-bold text-muted mb-3 ls-1 text-center">Plan Management</div>
                                        <div className="d-flex flex-column gap-2">
                                            <button className="btn btn-primary rounded-4 fw-bold shadow-sm" onClick={() => {
                                                const proPlan = plans.find(p => p.name === 'Professional');
                                                if (proPlan) {
                                                    setSelectedUpgradePlan(proPlan);
                                                    setShowUpgradeModal(true);
                                                }
                                            }}>
                                                <i className="bi bi-lightning-fill me-2"></i> Request Upgrade
                                            </button>
                                            <div className="text-center extra-small text-muted italic">Need custom features? <span className="text-primary pointer" onClick={() => setShowUpgradeModal(true)}>Contact Billing</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }

                {
                    mode === 'admin' && (
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
                    )
                }

                {
                    activeTab === 'plans' ? (
                        <div>
                            {mode === 'admin' && (
                                <div className="d-flex justify-content-end mb-3">
                                    <button className="btn btn-primary px-4 rounded-4 fw-bold shadow-sm" onClick={() => { setEditingPlan(null); setPlanForm({ name: '', slug: '', description: '', price: 0, interval: 'yearly', status: 1, features: {}, moduleIds: [] }); setShowPlanModal(true); }}>
                                        <i className="bi bi-plus-lg me-2"></i> Create New Plan
                                    </button>
                                </div>
                            )}
                            <div className="row g-4">
                                {plans.map((plan: Plan) => {
                                    const isCurrentPlan = activeTenant?.planId === plan.id;
                                    return (
                                        <div className="col-md-4" key={plan.id}>
                                            <div className={`card border-0 shadow-sm rounded-4 h-100 p-4 transition-all hover-up ${isCurrentPlan ? 'border-2 border-primary ring-2 ring-primary ring-opacity-10 position-relative overflow-visible' : ''}`}>
                                                {isCurrentPlan && (
                                                    <div className="position-absolute top-0 start-50 translate-middle">
                                                        <span className="badge bg-primary rounded-pill px-3 py-1 shadow-sm">Your Current Plan</span>
                                                    </div>
                                                )}
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <span className={`badge rounded-4 px-3 py-1 ${plan.status === 1 ? 'bg-success-soft text-success' : 'bg-secondary-soft text-secondary'}`}>
                                                        {plan.status === 1 ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {mode === 'admin' && (
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className={`btn btn-link p-0 ${deletingPlanId === plan.id ? 'text-danger fw-bold scale-110' : 'text-primary'}`}
                                                                onClick={() => handleDeletePlan(plan.id)}
                                                                title={deletingPlanId === plan.id ? 'Click 2 more times (Double Confirmation)' : 'Delete Plan'}
                                                            >
                                                                {deletingPlanId === plan.id ? (
                                                                    <span>{deleteConfirmLevel === 1 ? 'CONFIRM?' : 'DELETE NOW!'}</span>
                                                                ) : (
                                                                    <i className="bi bi-trash3"></i>
                                                                )}
                                                            </button>
                                                            <button className="btn btn-link text-primary p-0" onClick={() => {
                                                                setEditingPlan(plan);
                                                                setPlanForm({
                                                                    ...plan,
                                                                    moduleIds: plan.modules?.map((m: PlanModule) => m.id) || []
                                                                });
                                                                setShowPlanModal(true);
                                                            }}>
                                                                <i className="bi bi-pencil-square"></i>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className="fw-bold mb-1">{plan.name}</h4>
                                                <div className="text-muted small mb-3">{plan.slug}</div>
                                                <div className="display-5 fw-bold mb-4">
                                                    ${plan.price}<span className="fs-6 fw-normal text-muted">/{plan.interval}</span>
                                                </div>
                                                <p className="text-muted small flex-grow-1">{plan.description}</p>

                                                <div className="mt-3">
                                                    <h6 className="small-caps mb-2">Modules:</h6>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {plan.modules?.map((mod: PlanModule) => (
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
                                                        {Object.entries(plan.features || {}).map(([key, val]: [string, string | number | boolean]) => (
                                                            <li key={key} className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i> {key}: {String(val)}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {mode === 'owner' && !isCurrentPlan && (
                                                    <div className="mt-4">
                                                        <button
                                                            className="btn btn-outline-primary w-100 rounded-4 fw-bold py-2"
                                                            onClick={() => {
                                                                setSelectedUpgradePlan(plan);
                                                                setShowUpgradeModal(true);
                                                            }}
                                                        >
                                                            Upgrade Now
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
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
                    )
                }
            </div >

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
                                            <input type="text" className="form-control bg-light border-0" value={planForm.name} onChange={e => {
                                                const name = e.target.value;
                                                setPlanForm({
                                                    ...planForm,
                                                    name,
                                                    slug: editingPlan ? planForm.slug : name.toLowerCase().replace(/\s+/g, '-')
                                                });
                                            }} required />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted">PLAN SLUG (UNIQUE)</label>
                                            <input type="text" className="form-control bg-light border-0" value={planForm.slug} onChange={e => setPlanForm({ ...planForm, slug: e.target.value })} required />
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
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold text-muted">STATUS</label>
                                            <select className="form-select bg-light border-0" value={planForm.status} onChange={e => setPlanForm({ ...planForm, status: parseInt(e.target.value) })}>
                                                <option value={1}>Active</option>
                                                <option value={2}>Inactive</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted">DESCRIPTION</label>
                                            <textarea className="form-control bg-light border-0" rows={2} value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })}></textarea>
                                        </div>

                                        <div className="col-12">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <label className="form-label small fw-bold text-muted mb-0">PLAN FEATURES (JSON)</label>
                                                <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={handleAddFeature}>
                                                    <i className="bi bi-plus-circle me-1"></i> Add Feature
                                                </button>
                                            </div>
                                            <div className="bg-light p-2 rounded-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                {Object.entries(planForm.features).map(([key, val], idx) => (
                                                    <div key={idx} className="d-flex gap-2 mb-2">
                                                        <input type="text" className="form-control form-control-sm border-0 shadow-none w-50" placeholder="Key" value={key} onChange={e => handleUpdateFeature(key, e.target.value, val)} />
                                                        <input type="text" className="form-control form-control-sm border-0 shadow-none w-50" placeholder="Value" value={String(val)} onChange={e => handleUpdateFeature(key, key, e.target.value)} />
                                                        <button type="button" className="btn btn-link text-danger p-0 px-1" onClick={() => handleRemoveFeature(key)}>
                                                            <i className="bi bi-x-circle"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                                {Object.keys(planForm.features || {}).length === 0 && (
                                                    <div className="text-center py-2 text-muted extra-small italic">No custom features added</div>
                                                )}
                                            </div>
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
            )
            }

            {
                showKeyModal && (
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
                )
            }

            {
                showUpgradeModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="modal-header bg-primary text-white border-0 p-4">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-white bg-opacity-20 rounded-3 p-3">
                                            <i className="bi bi-rocket-takeoff-fill text-primary fs-4"></i>
                                        </div>
                                        <div>
                                            <h4 className="fw-bold mb-0 text-white mb-2">Request Plan Upgrade</h4>
                                            <div className="extra-small">Switching to: <span className='text-white fs-6 fw-bold'> {selectedUpgradePlan?.name}</span></div>
                                        </div>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowUpgradeModal(false)}></button>
                                </div>
                                <form onSubmit={handleUpgradeRequest}>
                                    <div className="modal-body p-4 pt-4">
                                        <div className="alert alert-info border-0 rounded-4 p-3 mb-4 d-flex align-items-center gap-3">
                                            <i className="bi bi-info-circle-fill fs-4 text-primary"></i>
                                            <div className="small">
                                                Upgrading requires manual verification. Our billing team will contact you within 24 hours to finalize the payment and activation.
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label small-caps mb-2">Confirmation Email</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0"><i className="bi bi-envelope-fill text-muted"></i></span>
                                                <input
                                                    type="email"
                                                    className="form-control bg-light border-0 py-2"
                                                    value={user?.email || ''}
                                                    disabled
                                                />
                                            </div>
                                            <div className="extra-small text-muted mt-2">We will send the invoice and upgrade details to this address.</div>
                                        </div>

                                        <div className="mb-0">
                                            <label className="form-label small-caps mb-2">Message (Optional)</label>
                                            <textarea
                                                className="form-control bg-light border-0 rounded-3"
                                                rows={3}
                                                placeholder="Tell us about your requirements or specific modules you need..."
                                                value={upgradeMessage}
                                                onChange={(e) => setUpgradeMessage(e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-0 p-4 pt-0">
                                        <button type="button" className="btn btn-light px-4 rounded-4" onClick={() => setShowUpgradeModal(false)} disabled={submittingUpgrade}>Cancel</button>
                                        <button type="submit" className="btn btn-primary px-5 rounded-4 fw-bold shadow-sm" disabled={submittingUpgrade}>
                                            {submittingUpgrade ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span> Sending...</>
                                            ) : (
                                                <><i className="bi bi-send-fill me-2"></i> Send Request</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }


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
        </MainLayout >
    );
}
