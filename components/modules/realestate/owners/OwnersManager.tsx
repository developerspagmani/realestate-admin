'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { userService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import Link from 'next/link';

interface Owner {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: number;
    createdAt: string;
    tenantId: string;
    tenant?: {
        subscriptionStatus: number;
        subscriptionExpiresAt: string | null;
    };
    _count?: {
        properties: number;
    };
}

interface OwnersManagerProps {
    mode: 'admin' | 'realestate-admin';
}

export default function OwnersManager({ mode }: OwnersManagerProps) {
    const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuthContext();
    const { activeTenantId } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        status: 1, // 1: active
        password: '' // Only for new owners
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const [showExtendModal, setShowExtendModal] = useState(false);
    const [extendingOwner, setExtendingOwner] = useState<Owner | null>(null);
    const [extendDays, setExtendDays] = useState('15');
    const [extending, setExtending] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const router = useRouter();

    const basePath = mode === 'realestate-admin' ? '/realestate-admin/owners' : '/realestate-admin/owners';

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadOwners = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const tenantId = activeTenantId || (user as any)?.tenantId || localStorage.getItem('tenant-id');
            const response = await userService.getOwners(token, { tenantId });

            if (response.success && response.data) {
                const ownersList = response.data.users || response.data.owners || (Array.isArray(response.data) ? response.data : []);
                const mappedOwners = ownersList.map((o: any) => ({
                    ...o,
                    _count: {
                        properties: o._count?.userPropertyAccess || 0
                    }
                }));
                setOwners(mappedOwners);
            }
        } catch (error) {
            console.error('Failed to load owners:', error);
            showToast('Failed to load owners', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mounted || authLoading) return;

        if (!isAuthenticated || !user || !isAdmin) {
            router.push('/login');
            return;
        }

        loadOwners();
    }, [user, isAuthenticated, isAdmin, mounted, authLoading, router, activeTenantId]);

    const filteredOwners = useMemo(() => {
        return owners.filter(owner =>
            owner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [owners, searchTerm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getAuthToken();
            if (!token) return;

            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id');

            if (editingOwner) {
                const response = await userService.updateUser(token, editingOwner.id, {
                    name: formData.name,
                    phone: formData.phone,
                    status: formData.status
                });
                if (response.success) {
                    setShowModal(false);
                    loadOwners();
                    showToast('Owner updated successfully');
                }
            } else {
                const response = await userService.createUser(token, {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password || 'Temporary123!',
                    phone: formData.phone,
                    role: 3, // Owner
                    tenantId: tenantId,
                    status: formData.status
                });

                if (response.success) {
                    setShowModal(false);
                    loadOwners();
                    showToast('Owner created successfully');
                } else {
                    showToast(response.message || 'Failed to create owner', 'error');
                }
            }
        } catch (error) {
            console.error('Error saving owner:', error);
            showToast('An error occurred while saving the owner', 'error');
        }
    };

    const handleEdit = (owner: Owner) => {
        setEditingOwner(owner);
        setFormData({
            name: owner.name,
            email: owner.email,
            phone: owner.phone || '',
            status: owner.status,
            password: ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this owner? This will also remove their access.')) return;

        try {
            const token = getAuthToken();
            if (!token) return;
            const response = await userService.deleteUser(token, id);
            if (response.success) {
                loadOwners();
                showToast('Owner deleted successfully');
            } else {
                showToast(response.message || 'Failed to delete owner', 'error');
            }
        } catch (error) {
            console.error('Error deleting owner:', error);
            showToast('Error deleting owner', 'error');
        }
    };

    const handleExtendTrial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!extendingOwner || !extendingOwner.tenantId) return;

        setExtending(true);
        try {
            const { adminService } = await import('@/app/services/admin');
            const token = getAuthToken();
            if (!token) return;

            const response = await adminService.extendTrial(token, extendingOwner.tenantId, parseInt(extendDays));
            if (response.success) {
                showToast(`Trial extended for ${extendingOwner.name}`);
                setShowExtendModal(false);
                loadOwners();
            } else {
                showToast(response.message || 'Failed to extend trial', 'error');
            }
        } catch (error) {
            console.error('Extension error:', error);
            showToast('Error extending trial', 'error');
        } finally {
            setExtending(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', status: 1, password: '' });
        setEditingOwner(null);
        setShowModal(false);
    };

    if (!mounted || !isAuthenticated) return null;

    return (
        <MainLayout activePage="owners">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Property Owners</h2>
                        <p className="text-muted small mb-0">Manage stakeholders and property managers</p>
                    </div>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                        onClick={() => { resetForm(); setShowModal(true); }}
                    >
                        <i className="bi bi-person-plus-fill"></i>
                        <span>Create Owner</span>
                    </button>
                </div>

                <div className="row g-4 mb-4">
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-primary-soft p-3 rounded-circle">
                                    <i className="bi bi-people text-primary fs-4"></i>
                                </div>
                                <div>
                                    <div className="text-muted small">Total Owners</div>
                                    <div className="fw-bold fs-4">{owners.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-success-soft p-3 rounded-circle">
                                    <i className="bi bi-building text-success fs-4"></i>
                                </div>
                                <div>
                                    <div className="text-muted small">Managed Properties</div>
                                    <div className="fw-bold fs-4">
                                        {owners.reduce((acc, o) => acc + (o._count?.properties || 0), 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-0 p-4">
                        <div className="input-group input-group-lg bg-light rounded-3 border-0">
                            <span className="input-group-text bg-transparent border-0 pe-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control bg-transparent border-0 ps-3 fs-6"
                                placeholder="Search by name, email or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="vi-table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Owner Details</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted border-0">Contact Info</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted border-0 text-center">Properties</th>
                                    <th className="py-3 text-uppercase small fw-bold text-muted border-0">Status</th>
                                    <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status"></div>
                                        </td>
                                    </tr>
                                ) : filteredOwners.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <div className="text-muted">No owners found matching your search.</div>
                                        </td>
                                    </tr>
                                ) : filteredOwners.map((owner) => (
                                    <tr key={owner.id} className="transition-all">
                                        <td className="px-4 py-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                                    {owner.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??'}
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{owner.name}</div>
                                                    <div className="text-muted extra-small">ID: {owner.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex flex-column">
                                                <span className="text-dark small"><i className="bi bi-envelope me-2"></i>{owner.email}</span>
                                                <span className="text-muted small"><i className="bi bi-telephone me-2"></i>{owner.phone || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="badge bg-info-soft text-info rounded-4 px-3 py-2 fw-bold">
                                                {owner._count?.properties || 0} Properties
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className={`badge rounded-4 px-3 py-2 ${owner.status === 1 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                                                {owner.status === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <Link
                                                    href={`${basePath}/${owner.id}`}
                                                    className="btn btn-icon btn-light-info rounded-circle hvr-float"
                                                    title="View Details"
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </Link>
                                                <button
                                                    className="btn btn-icon btn-light-primary rounded-circle hvr-float"
                                                    onClick={() => handleEdit(owner)}
                                                    title="Edit Owner"
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                                <button
                                                    className="btn btn-icon btn-light-danger rounded-circle hvr-float"
                                                    onClick={() => handleDelete(owner.id)}
                                                    title="Delete Owner"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                                {owner.tenant?.subscriptionStatus === 3 && (
                                                    <button
                                                        className="btn btn-icon btn-light-warning rounded-circle hvr-float border-warning"
                                                        onClick={() => {
                                                            setExtendingOwner(owner);
                                                            setShowExtendModal(true);
                                                        }}
                                                        title="Extend Trial"
                                                    >
                                                        <i className="bi bi-calendar-plus text-warning"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h4 className="fw-bold text-dark">{editingOwner ? 'Update Owner Profile' : 'Create New Owner'}</h4>
                                <button type="button" className="btn-close" onClick={resetForm}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Full Name</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg bg-light border-0"
                                                placeholder="e.g. John Doe"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control form-control-lg bg-light border-0"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                disabled={!!editingOwner}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-control form-control-lg bg-light border-0"
                                                placeholder="+1-234-567-890"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        {!editingOwner && (
                                            <div className="col-12">
                                                <label className="form-label small fw-bold text-muted text-uppercase">Initial Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control form-control-lg bg-light border-0"
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                />
                                                <div className="form-text extra-small">Recommended: 8+ characters with mixed symbols.</div>
                                            </div>
                                        )}
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Account Status</label>
                                            <select
                                                className="form-select form-select-lg bg-light border-0"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                            >
                                                <option value={1}>Active</option>
                                                <option value={2}>Inactive / Blocked</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light px-4 hvr-float" onClick={resetForm}>Discard</button>
                                    <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm hvr-float">
                                        {editingOwner ? 'Update Stakeholder' : 'Register Stakeholder'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .btn-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; padding: 0; }
                .btn-light-primary { background: rgba(13, 110, 253, 0.05); color: #0d6efd; border: none; }
                .btn-light-primary:hover { background: #0d6efd; color: white; }
                .btn-light-danger { background: rgba(220, 53, 69, 0.05); color: #dc3545; border: none; }
                .btn-light-danger:hover { background: #dc3545; color: white; }
                .btn-light-info { background: rgba(13, 202, 240, 0.05); color: #0dcaf0; border: none; }
                .btn-light-info:hover { background: #0dcaf0; color: white; }
                .extra-small { font-size: 11px; }
                .transition-all { transition: all 0.2s ease; }
                .table-hover tbody tr:hover { background-color: rgba(0,0,0,0.01); }
            `}</style>

            {showExtendModal && extendingOwner && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-warning border-0 p-4">
                                <h4 className="fw-bold mb-0 text-dark"><i className="bi bi-calendar-plus me-2"></i>Extend Trial Period</h4>
                                <button type="button" className="btn-close" onClick={() => setShowExtendModal(false)}></button>
                            </div>
                            <form onSubmit={handleExtendTrial}>
                                <div className="modal-body p-4">
                                    <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3">
                                        <div className="p-2 bg-white rounded-circle shadow-sm">
                                            <i className="bi bi-person text-secondary"></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold">{extendingOwner.name}</div>
                                            <div className="text-muted small">Current Expiry: {extendingOwner.tenant?.subscriptionExpiresAt ? new Date(extendingOwner.tenant.subscriptionExpiresAt).toLocaleDateString() : 'None'}</div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Days to Extend</label>
                                        <div className="input-group input-group-lg">
                                            <input
                                                type="number"
                                                className="form-control bg-light border-0"
                                                value={extendDays}
                                                onChange={(e) => setExtendDays(e.target.value)}
                                                min="1"
                                                max="120"
                                                required
                                            />
                                            <span className="input-group-text bg-light border-0 text-muted">Days</span>
                                        </div>
                                        <div className="form-text mt-2 small text-muted">
                                            New expiry will be set to (current expiry + days).
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light px-4" onClick={() => setShowExtendModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-warning px-4 fw-bold shadow-sm" disabled={extending}>
                                        {extending ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Extend License Now'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </MainLayout>
    );
}
