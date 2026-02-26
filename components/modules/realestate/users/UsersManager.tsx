'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { User } from '@/types';
import { userService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import Loader from '@/components/common/Loader';
import Toast from '@/components/common/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UsersManagerProps {
    mode: 'admin' | 'owner';
}

export default function UsersManager({ mode }: UsersManagerProps) {
    const { user: currentUser, isAuthenticated, isAdmin, isOwner, loading: authLoading } = useAuthContext();
    const { tenantType, activeTenantId } = useManagementContext();
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({
        name: '', email: '', phone: '', role: 'user', status: 'active'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const router = useRouter();

    useEffect(() => { setMounted(true); }, []);

    // --- TanStack Query ---

    const token = typeof window !== 'undefined' ? getAuthToken() : '';
    const tenantId = mode === 'admin' ? activeTenantId : (currentUser as any)?.tenantId;

    const { data: rawUsersData, isLoading: usersLoading, isFetching } = useQuery({
        queryKey: ['users', mode, tenantId, tenantType, filterRole],
        queryFn: async () => {
            const industryType = mode === 'admin' ? tenantType : undefined;
            const roleMap: Record<string, string> = { 'user': '1', 'admin': '2', 'owner': '3', 'agent': '4' };
            const params: any = { tenantId: tenantId || undefined, industryType };
            if (filterRole !== 'all') params.role = roleMap[filterRole];

            const res = await userService.getUsers(token!, params);
            if (!res.success) throw new Error(res.message || 'Failed to fetch users');
            return res.data.users || res.data || [];
        },
        enabled: !!token && mounted && isAuthenticated && !authLoading,
    });

    const users = useMemo(() => {
        const usersList = Array.isArray(rawUsersData) ? rawUsersData : [];
        return usersList
            .map((u: any) => ({
                id: u.id,
                name: u.name || 'Unknown User',
                email: u.email,
                phone: u.phone || '--',
                role: u.role === 2 ? 'admin' : u.role === 3 ? 'owner' : u.role === 4 ? 'agent' : 'user',
                status: u.status === 2 ? 'inactive' : u.status === 3 ? 'suspended' : 'active',
                tenantId: u.tenantId,
                createdAt: u.createdAt,
                lastLogin: u.lastLogin,
                bookingsCount: u._count?.bookings || u.bookingsCount || 0
            }))
            .filter((u: any) => !tenantId || u.tenantId === tenantId) as User[];
    }, [rawUsersData]);

    const loading = usersLoading;

    // --- Mutations ---

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingUser) return userService.updateUser(token!, editingUser.id, payload);
            return userService.createUser(token!, payload);
        },
        onSuccess: (res) => {
            if (res.success) {
                showToast(editingUser ? 'User updated successfully' : 'User created successfully');
                queryClient.invalidateQueries({ queryKey: ['users'] });
                resetForm();
            } else {
                showToast(res.message || 'Error saving user', 'error');
            }
        },
        onError: () => showToast('Error saving user', 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => userService.deleteUser(token!, id),
        onSuccess: (res) => {
            if (res.success) {
                showToast('User deleted successfully');
                queryClient.invalidateQueries({ queryKey: ['users'] });
            } else {
                showToast(res.message || 'Error deleting user', 'error');
            }
        },
        onError: () => showToast('Error deleting user', 'error')
    });

    const roleMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string, payload: any }) => userService.updateUserStatus(token!, id, payload),
        onSuccess: (res) => {
            if (res.success) {
                showToast('Role updated successfully');
                queryClient.invalidateQueries({ queryKey: ['users'] });
            } else {
                showToast(res.message || 'Error updating role', 'error');
            }
        },
        onError: () => showToast('Error updating role', 'error')
    });

    useEffect(() => {
        if (!mounted || authLoading) return;
        if (!isAuthenticated || !currentUser) router.push('/login');
    }, [currentUser, isAuthenticated, mounted, authLoading, router]);

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const currentTenantId = mode === 'admin' ? activeTenantId : (currentUser as any)?.tenantId;
        const targetTenantId = currentTenantId || localStorage.getItem('tenant-id');

        const roleMap: Record<string, number> = {
            'user': 1, 'admin': 2, 'owner': 3, 'agent': 4
        };

        if (editingUser) {
            saveMutation.mutate({
                name: formData.name,
                phone: formData.phone,
                status: formData.status === 'active' ? 1 : formData.status === 'inactive' ? 2 : 3,
                role: isAdmin ? roleMap[formData.role as string] : (editingUser.role === 'admin' ? 2 : (editingUser.role === 'owner' ? 3 : 1))
            });
        } else {
            saveMutation.mutate({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: 'Password123!',
                tenantId: targetTenantId || '',
                role: isAdmin ? (roleMap[formData.role as string] || 1) : 1
            });
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status
        });
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleRoleChange = (id: string, newRole: User['role']) => {
        const roleMap: Record<string, number> = { 'user': 1, 'admin': 2, 'owner': 3, 'agent': 4 };
        roleMutation.mutate({ id, payload: { role: roleMap[newRole] } });
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', role: 'user', status: 'active' });
        setEditingUser(null);
        setShowModal(false);
    };

    const getRoleBadge = (role: User['role']) => {
        const roleConfig = {
            user: { class: 'bg-primary-soft text-primary border-primary-soft', text: 'User', icon: 'bi-person' },
            admin: { class: 'bg-danger-soft text-danger border-danger-soft', text: 'Admin', icon: 'bi-shield-lock' },
            owner: { class: 'bg-success-soft text-success border-success-soft', text: 'Owner', icon: 'bi-building' },
            agent: { class: 'bg-info-soft text-info border-info-soft', text: 'Agent', icon: 'bi-person-badge' }
        };
        const config = roleConfig[role] || roleConfig.user;
        return (
            <span className={`badge border px-2 py-1 fw-medium d-inline-flex align-items-center ${config.class}`}>
                <i className={`bi ${config.icon} me-1`}></i>
                {config.text}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (!mounted || !isAuthenticated) return null;

    return (
        <MainLayout activePage="users">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">Users Management</h1>
                        <p className="text-muted small mb-0">Manage roles, permissions and user accounts for your organization.</p>
                    </div>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm fw-bold"
                        onClick={() => setShowModal(true)}
                    >
                        <i className="bi bi-person-plus-fill"></i>
                        <span>Create User</span>
                    </button>
                </div>

                <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
                    <div className="card-body p-4">
                        <div className="row g-3 align-items-center">
                            <div className="col-md-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0 px-3">
                                        <i className="bi bi-search text-muted"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-0 ps-0"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <select
                                    className="form-select bg-light border-0"
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">Standard Users</option>
                                    <option value="admin">Administrators</option>
                                    <option value="owner">Property Owners</option>
                                    <option value="agent">Sales Agents</option>
                                </select>
                            </div>
                            <div className="col-md-4 text-end">
                                <span className="text-muted small fw-medium">
                                    {loading ? 'Updating...' : `Showing ${filteredUsers.length} total members`}
                                </span>
                                <button
                                    className="btn btn-sm btn-link text-decoration-none ms-2"
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
                                    disabled={isFetching}
                                >
                                    <i className={`bi bi-arrow-clockwise ${isFetching ? 'spin' : ''}`}></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="vi-table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted">Member</th>
                                    <th className="py-3 border-0 small text-uppercase fw-bold text-muted">Contact</th>
                                    <th className="py-3 border-0 small text-uppercase fw-bold text-muted">Role</th>
                                    <th className="py-3 border-0 small text-uppercase fw-bold text-muted text-center">Bookings</th>
                                    <th className="py-3 border-0 small text-uppercase fw-bold text-muted">Joined</th>
                                    <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5">
                                            <Loader message="Loading users..." />
                                        </td>
                                    </tr>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id}>
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="flex-shrink-0 me-3">
                                                        <div className="rounded-circle bg-primary-soft text-primary d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                                                            {u.name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{u.name}</div>
                                                        <div className="text-muted small">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="small text-dark font-monospace">{u.phone}</div>
                                            </td>
                                            <td className="py-3">
                                                {getRoleBadge(u.role)}
                                            </td>
                                            <td className="py-3 text-center">
                                                <span className="badge rounded-4 bg-light text-dark border fw-medium px-3">
                                                    {(u as any).bookingsCount || 0}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <div className="small text-dark">{formatDate(u.createdAt)}</div>
                                                <div className="text-muted extra-small">Active since</div>
                                            </td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button
                                                        className="btn btn-sm btn-icon btn-light rounded-circle"
                                                        onClick={() => handleEdit(u)}
                                                        title="Edit User"
                                                    >
                                                        <i className="bi bi-pencil-square text-primary"></i>
                                                    </button>
                                                    <div className="dropdown">
                                                        <button
                                                            className="btn btn-sm btn-icon btn-light rounded-circle"
                                                            type="button"
                                                            data-bs-toggle="dropdown"
                                                        >
                                                            <i className="bi bi-shield-lock text-secondary"></i>
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg p-2 rounded-3">
                                                            <li><h6 className="dropdown-header small text-uppercase fw-bold text-muted">Change Role</h6></li>
                                                            <li><button className="dropdown-item py-2 small rounded" onClick={() => handleRoleChange(u.id, 'user')}><i className="bi bi-person me-2"></i>Standard User</button></li>
                                                            {isAdmin && (
                                                                <>
                                                                    <li><button className="dropdown-item py-2 small rounded" onClick={() => handleRoleChange(u.id, 'admin')}><i className="bi bi-shield-check me-2"></i>Administrator</button></li>
                                                                    <li><button className="dropdown-item py-2 small rounded" onClick={() => handleRoleChange(u.id, 'owner')}><i className="bi bi-building me-2"></i>Property Owner</button></li>
                                                                    <li><button className="dropdown-item py-2 small rounded" onClick={() => handleRoleChange(u.id, 'agent')}><i className="bi bi-person-badge me-2"></i>Sales Agent</button></li>
                                                                </>
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <button
                                                        className="btn btn-sm btn-icon btn-light rounded-circle"
                                                        onClick={() => handleDelete(u.id)}
                                                        title="Delete User"
                                                    >
                                                        <i className="bi bi-trash3 text-danger"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5">
                                            <i className="bi bi-people text-muted display-4 opacity-25"></i>
                                            <h5 className="mt-3 text-muted">No users found</h5>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-primary text-white p-4">
                                <h5 className="modal-title fw-bold">
                                    {editingUser ? 'Update User Information' : 'Invite New Team Member'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={resetForm}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-uppercase text-muted">Display Name</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg bg-light border-0"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-uppercase text-muted">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control form-control-lg bg-light border-0"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            disabled={!!editingUser}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-uppercase text-muted">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="form-control form-control-lg bg-light border-0"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-0">
                                        <label className="form-label small fw-bold text-uppercase text-muted">Access Role</label>
                                        <div className="row g-2">
                                            {isAdmin ? (
                                                ['user', 'admin', 'owner', 'agent'].map((r) => (
                                                    <div key={r} className="col-4">
                                                        <input
                                                            type="radio"
                                                            className="btn-check"
                                                            name="role"
                                                            id={`role-${r}`}
                                                            checked={formData.role === r}
                                                            onChange={() => setFormData({ ...formData, role: r as any })}
                                                        />
                                                        <label className="btn btn-outline-light text-dark border w-100 py-3 d-flex flex-column align-items-center rounded-3 shadow-none" htmlFor={`role-${r}`}>
                                                            <i className={`bi ${r === 'admin' ? 'bi-shield-lock' : r === 'owner' ? 'bi-building' : r === 'agent' ? 'bi-person-badge' : 'bi-person'} mb-1`}></i>
                                                            <span className="small text-capitalize fw-bold">{r}</span>
                                                        </label>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-12">
                                                    <div className="p-3 bg-light rounded-3 text-center border">
                                                        <i className="bi bi-person me-2 text-primary"></i>
                                                        <span className="fw-bold">Standard User</span>
                                                        <p className="extra-small text-muted mb-0 mt-1">Property owners can only invite standard users.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer p-4 pt-0 border-0">
                                    <button type="button" className="btn btn-light px-4 fw-bold" onClick={resetForm}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm">
                                        {editingUser ? 'Save Changes' : 'Send Invite'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
        .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
        .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
        .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
        .border-primary-soft { border-color: rgba(13, 110, 253, 0.2); }
        .border-success-soft { border-color: rgba(25, 135, 84, 0.2); }
        .border-danger-soft { border-color: rgba(220, 53, 69, 0.2); }
        .border-info-soft { border-color: rgba(13, 202, 240, 0.2); }
        .extra-small { font-size: 0.7rem; }
        .btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; padding: 0; }
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
