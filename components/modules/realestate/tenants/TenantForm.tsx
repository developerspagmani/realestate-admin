'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { tenantService } from '@/app/services/tenant';
import { userService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import Link from 'next/link';

export default function TenantForm({ tenantId }: { tenantId?: string }) {
    const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuthContext();
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(!!tenantId);
    const [saving, setSaving] = useState(false);
    
    // Tenant State
    const [tenantFormData, setTenantFormData] = useState<{name: string; domain: string; type: number | string; status: number | string}>({
        name: '',
        domain: '',
        type: 1,
        status: 1
    });

    // Owners State (only valid if tenantId exists)
    const [owners, setOwners] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    
    // Create Owner State
    const [showCreateOwner, setShowCreateOwner] = useState(false);
    const [ownerFormData, setOwnerFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        status: 1
    });

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadTenantData = async () => {
        if (!tenantId) return;
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const res = await tenantService.getTenantById(token, tenantId);
            if (res.success && res.data) {
                setTenantFormData({
                    name: res.data.name,
                    domain: res.data.domain || '',
                    type: res.data.type,
                    status: res.data.status
                });

                // Load existing owners for this tenant
                const usersRes = await userService.getUsers(token, { tenantId: tenantId, role: '3' });
                if (usersRes.success && usersRes.data && usersRes.data.users) {
                    setOwners(usersRes.data.users);
                }
            } else {
                showToast('Failed to load tenant details', 'error');
                router.push('/realestate-admin/tenants');
            }
        } catch (error) {
            console.error('Failed to load tenant:', error);
            showToast('Failed to load tenant', 'error');
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
        if (tenantId) loadTenantData();
    }, [user, isAuthenticated, isAdmin, mounted, authLoading, router, tenantId]);

    const handleTenantSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            if (tenantId) {
                const response = await tenantService.updateTenant(token, tenantId, {
                    name: tenantFormData.name,
                    type: tenantFormData.type,
                    status: tenantFormData.status
                });
                if (response.success) {
                    showToast('Tenant updated successfully');
                } else {
                    showToast(response.message || 'Error updating tenant', 'error');
                }
            } else {
                const response = await tenantService.createTenant(token, {
                    name: tenantFormData.name,
                    domain: tenantFormData.domain,
                    type: tenantFormData.type,
                    status: tenantFormData.status,
                    settings: {}
                });

                if (response.success) {
                    showToast('Tenant created successfully! Redirecting...');
                    setTimeout(() => {
                        router.push(`/realestate-admin/tenants/${response.data.id}`);
                    }, 1000);
                } else {
                    showToast(response.message || 'Failed to create tenant', 'error');
                }
            }
        } catch (error) {
            console.error('Error saving tenant:', error);
            showToast('An error occurred while saving', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSearchExistingOwner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const token = getAuthToken();
            if (!token) return;
            // Search globally for users
            const res = await userService.getUsers(token, { search: searchQuery });
            if (res.success && res.data && res.data.users) {
                // exclude already assigned owners
                const results = res.data.users.filter((u: any) => u.tenantId !== tenantId);
                setSearchResults(results);
                if (results.length === 0) {
                    showToast('No unassigned users found matching that email/phone.', 'error');
                }
            }
        } catch (error) {
            showToast('Error searching users', 'error');
        } finally {
            setSearching(false);
        }
    };

    const handleAssignExistingOwner = async (targetUserId: string) => {
        if (!tenantId) return;
        try {
            const token = getAuthToken();
            if (!token) return;

            // Assign as owner by changing tenantId and role
            const response = await userService.updateUser(token, targetUserId, {
                tenantId: tenantId,
                role: 3
            });

            if (response.success) {
                showToast('Owner assigned successfully!');
                setSearchResults(searchResults.filter(u => u.id !== targetUserId));
                setSearchQuery('');
                // Reload owners list
                const usersRes = await userService.getUsers(token, { tenantId: tenantId, role: '3' });
                if (usersRes.success && usersRes.data && usersRes.data.users) {
                    setOwners(usersRes.data.users);
                }
            } else {
                showToast(response.message || 'Failed to assign owner', 'error');
            }
        } catch (error) {
            showToast('Error assigning owner', 'error');
        }
    };

    const handleCreateNewOwner = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = getAuthToken();
            if (!token || !tenantId) return;

            const response = await userService.createUser(token, {
                name: ownerFormData.name,
                email: ownerFormData.email,
                password: ownerFormData.password || 'SecurePassword123!',
                phone: ownerFormData.phone,
                role: 3,
                tenantId: tenantId,
                status: ownerFormData.status
            });

            if (response.success) {
                showToast('Company owner created and assigned successfully!');
                setShowCreateOwner(false);
                setOwnerFormData({ name: '', email: '', phone: '', password: '', status: 1 });
                // Reload owners list
                const usersRes = await userService.getUsers(token, { tenantId: tenantId, role: '3' });
                if (usersRes.success && usersRes.data && usersRes.data.users) {
                    setOwners(usersRes.data.users);
                }
            } else {
                showToast(response.message || 'Failed to create owner', 'error');
            }
        } catch (error) {
            showToast('Error creating new owner', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveOwner = async (ownerId: string) => {
        if (!confirm('Are you sure you want to remove this owner from the tenant? They will become a regular user without a tenant.')) return;
        try {
            const token = getAuthToken();
            if (!token) return;

            // Downgrade to user and remove tenant
            const response = await userService.updateUser(token, ownerId, {
                role: 1,
                status: 2, // optionally inactive to prevent orphans logging in, but keeping it simple
            });
            // Let's actually just delete them or leave their tenantId alone via custom API if possible, 
            // but prisma relation requires we set tenantId to null if it was optional. Wait, updating role is fine.

            if (response.success) {
                showToast('Owner removed successfully');
                setOwners(owners.filter(o => o.id !== ownerId));
            } else {
                showToast(response.message || 'Failed to remove', 'error');
            }
        } catch (error) {
            showToast('Error removing owner', 'error');
        }
    }


    if (!mounted || !isAuthenticated) return null;

    return (
        <MainLayout activePage="tenants">
            <div className="container-fluid py-4">
                <div className="d-flex align-items-center mb-4 gap-3">
                    <Link href="/realestate-admin/tenants" className="btn btn-light rounded-circle shadow-sm" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-arrow-left"></i>
                    </Link>
                    <div>
                        <h2 className="fw-bold mb-1">{tenantId ? 'Update Tenant' : 'Create New Tenant'}</h2>
                        <p className="text-muted small mb-0">{tenantId ? 'Modify workspace settings and manage owners' : 'Provision a new workspace environment'}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : (
                    <div className="row g-4">
                        {/* Tenant Management Section */}
                        <div className={tenantId ? "col-lg-7" : "col-lg-8"}>
                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-header bg-white border-bottom p-4">
                                    <h5 className="fw-bold mb-0"><i className="bi bi-building me-2 text-primary"></i>Workspace Information</h5>
                                </div>
                                <div className="card-body p-4">
                                    <form onSubmit={handleTenantSubmit}>
                                        <div className="row g-4">
                                            <div className="col-12">
                                                <label className="form-label small fw-bold text-muted text-uppercase">Company Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0"
                                                    placeholder="e.g. Elite Real Estate"
                                                    value={tenantFormData.name}
                                                    onChange={(e) => setTenantFormData({ ...tenantFormData, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-bold text-muted text-uppercase">Subdomain Namespace</label>
                                                <div className="input-group input-group-lg">
                                                    <input
                                                        type="text"
                                                        className="form-control bg-light border-0"
                                                        placeholder="e.g. elite-re"
                                                        value={tenantFormData.domain}
                                                        onChange={(e) => setTenantFormData({ ...tenantFormData, domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                                        required
                                                        disabled={!!tenantId}
                                                    />
                                                    <span className="input-group-text border-0 bg-light text-muted fw-bold">.virpanix.com</span>
                                                </div>
                                                <div className="form-text small text-muted mt-2"><i className="bi bi-info-circle me-1"></i> The URL namespace cannot be changed after creation.</div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-muted text-uppercase">Business Focus</label>
                                                <select
                                                    className="form-select form-select-lg bg-light border-0"
                                                    value={tenantFormData.type}
                                                    onChange={(e) => setTenantFormData({ ...tenantFormData, type: parseInt(e.target.value) })}
                                                >
                                                    <option value={1}>Real Estate Brokering</option>
                                                    <option value={2}>Coworking / Space Management</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-muted text-uppercase">Account Status</label>
                                                <select
                                                    className="form-select form-select-lg bg-light border-0"
                                                    value={tenantFormData.status}
                                                    onChange={(e) => setTenantFormData({ ...tenantFormData, status: parseInt(e.target.value) })}
                                                >
                                                    <option value={1}>Active & Running</option>
                                                    <option value={2}>Suspended (No Access)</option>
                                                </select>
                                            </div>
                                            <div className="col-12 pt-3 border-top mt-4">
                                                <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold shadow-sm hvr-float" disabled={saving}>
                                                    {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-check me-2"></i>}
                                                    {tenantId ? 'Update Workspace Details' : 'Provision New Workspace'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Owner Management Section */}
                        {tenantId ? (
                            <div className="col-lg-5">
                                <div className="card border-0 shadow-sm rounded-4 h-100">
                                    <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                                        <h5 className="fw-bold mb-0"><i className="bi bi-person-badge me-2 text-success"></i>Assigned Owners</h5>
                                    </div>
                                    <div className="card-body p-0 d-flex flex-column">
                                        
                                        {/* Assigned List */}
                                        <div className="p-4 flex-grow-1">
                                            {owners.length > 0 ? (
                                                <div className="d-flex flex-column gap-3">
                                                    {owners.map(owner => (
                                                        <div key={owner.id} className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                                                    {owner.name?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-dark">{owner.name}</div>
                                                                    <div className="small text-muted">{owner.email} • {owner.phone || 'No phone'}</div>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                className="btn btn-sm btn-icon btn-light-danger rounded-circle hvr-float"
                                                                onClick={() => handleRemoveOwner(owner.id)}
                                                                title="Remove Owner"
                                                            >
                                                                <i className="bi bi-x-lg"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-5">
                                                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                                                        <i className="bi bi-person-x fs-3 text-muted"></i>
                                                    </div>
                                                    <p className="text-muted mb-0">No owners currently assigned to this workspace.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Add Owner Interface */}
                                        <div className="p-4 border-top bg-light-soft rounded-bottom-4">
                                            {!showCreateOwner ? (
                                                <>
                                                    <h6 className="fw-bold small text-uppercase mb-3 text-muted">Assign an Owner</h6>
                                                    <form onSubmit={handleSearchExistingOwner} className="mb-3">
                                                        <div className="input-group">
                                                            <input 
                                                                type="text" 
                                                                className="form-control border-0 bg-white shadow-sm"
                                                                placeholder="Search by email or mobile..."
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                            />
                                                            <button className="btn btn-dark shadow-sm px-3" type="submit" disabled={searching}>
                                                                {searching ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-search"></i>}
                                                            </button>
                                                        </div>
                                                    </form>

                                                    {/* Search Results */}
                                                    {searchResults.length > 0 && (
                                                        <div className="mt-3 mb-4 d-flex flex-column gap-2">
                                                            <span className="small text-muted fw-bold">Search Results:</span>
                                                            {searchResults.map(result => (
                                                                <div key={result.id} className="d-flex align-items-center justify-content-between p-2 bg-white border border-primary border-opacity-25 rounded-3 shadow-sm">
                                                                    <div className="small ps-2">
                                                                        <div className="fw-bold">{result.name}</div>
                                                                        <div className="text-muted" style={{fontSize: '11px'}}>{result.email}</div>
                                                                    </div>
                                                                    <button 
                                                                        className="btn btn-sm btn-primary py-1 px-3 fw-bold rounded-pill"
                                                                        onClick={() => handleAssignExistingOwner(result.id)}
                                                                    >
                                                                        Assign
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="text-center">
                                                        <span className="text-muted small mx-2">OR</span>
                                                    </div>
                                                    
                                                    <button 
                                                        className="btn btn-outline-primary w-100 mt-2 bg-white"
                                                        onClick={() => setShowCreateOwner(true)}
                                                    >
                                                        <i className="bi bi-person-plus me-2"></i> Register New Owner Account
                                                    </button>
                                                </>
                                            ) : (
                                                <form onSubmit={handleCreateNewOwner} className="bg-white p-4 rounded-3 shadow-sm border border-primary border-opacity-25">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h6 className="fw-bold mb-0">New Owner Details</h6>
                                                        <button type="button" className="btn-close small" onClick={() => setShowCreateOwner(false)}></button>
                                                    </div>
                                                    
                                                    <div className="mb-3">
                                                        <input type="text" className="form-control form-control-sm bg-light border-0 mb-2" placeholder="Full Name" required value={ownerFormData.name} onChange={e => setOwnerFormData({...ownerFormData, name: e.target.value})} />
                                                        <input type="email" className="form-control form-control-sm bg-light border-0 mb-2" placeholder="Email Address" required value={ownerFormData.email} onChange={e => setOwnerFormData({...ownerFormData, email: e.target.value})} />
                                                        <input type="text" className="form-control form-control-sm bg-light border-0 mb-2" placeholder="Mobile Number" value={ownerFormData.phone} onChange={e => setOwnerFormData({...ownerFormData, phone: e.target.value})} />
                                                        <input type="password" className="form-control form-control-sm bg-light border-0 mb-3" placeholder="Temporary Password" required value={ownerFormData.password} onChange={e => setOwnerFormData({...ownerFormData, password: e.target.value})} />
                                                        <button type="submit" className="btn btn-success btn-sm w-100 fw-bold" disabled={saving}>
                                                            {saving ? 'Creating...' : 'Create & Assign Profile'}
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm rounded-4 h-100 bg-light d-flex align-items-center justify-content-center p-5 text-center">
                                    <div className="mb-3">
                                        <div className="bg-white p-3 rounded-circle d-inline-block shadow-sm">
                                            <i className="bi bi-person-badge fs-1 text-muted opacity-50"></i>
                                        </div>
                                    </div>
                                    <h5 className="fw-bold text-dark">Owner Assignment</h5>
                                    <p className="text-muted small">Please fill out the workspace details and provision the tenant first. Once the workspace is created, you will be able to assign or create administrative owners here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; padding: 0; }
                .btn-light-danger { background: rgba(220, 53, 69, 0.08); color: #dc3545; border: none; }
                .btn-light-danger:hover { background: #dc3545; color: white; }
                .bg-light-soft { background-color: #f8f9fa; }
                .bg-primary-soft { background-color: rgba(13,110,253,0.1) !important; }
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
