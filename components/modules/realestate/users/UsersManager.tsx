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
import CountrySelect from '@/components/common/CountrySelect';


interface UsersManagerProps {
    mode: 'admin' | 'owner';
}

export default function UsersManager({ mode }: UsersManagerProps) {
    const { user: currentUser, isAuthenticated, isAdmin, isOwner, loading: authLoading } = useAuthContext();
    const { tenantType, activeTenantId } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'user',
        status: 'active',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        companyName: '',
        website: '',
        password: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importStep, setImportStep] = useState<'file' | 'mapping' | 'progress'>('file');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importProgress, setImportProgress] = useState(0);
    const [importTotal, setImportTotal] = useState(0);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const tenantId = mode === 'admin' ? activeTenantId : (currentUser as any)?.tenantId;
            const industryType = mode === 'admin' ? tenantType : undefined;

            const roleMap: Record<string, string> = {
                'user': '1', 'admin': '2', 'owner': '3', 'agent': '4'
            };

            const params: any = {
                tenantId: tenantId || undefined,
                industryType,
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                search: searchTerm || undefined
            };
            if (filterRole !== 'all') params.role = roleMap[filterRole];

            const response = await userService.getUsers(token, params);

            if (response.success && response.data) {
                const data = response.data;
                const usersList = data.users || data;
                const pagination = data.pagination;

                if (pagination) {
                    setTotalUsers(pagination.total);
                } else {
                    setTotalUsers(usersList.length);
                }

                const mappedUsers: User[] = usersList
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
                        addressLine1: u.addressLine1,
                        addressLine2: u.addressLine2,
                        city: u.city,
                        state: u.state,
                        country: u.country,
                        zipCode: u.zipCode,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        companyName: u.companyName,
                        website: u.website,
                        bookingsCount: u._count?.bookings || 0
                    }))
                    // Strict client-side filter to ensure isolation
                    .filter((u: any) => !tenantId || u.tenantId === tenantId);

                setUsers(mappedUsers);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!mounted || authLoading) return;

        if (!isAuthenticated || !currentUser) {
            router.push('/login');
            return;
        }

        loadUsers();
    }, [currentUser, isAuthenticated, mounted, authLoading, router, filterRole, activeTenantId, tenantType, currentPage, itemsPerPage, searchTerm]);

    const paginatedUsers = users;

    const totalPages = Math.ceil(totalUsers / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRole, itemsPerPage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = getAuthToken();
            if (!token) return;

            const currentTenantId = mode === 'admin' ? activeTenantId : (currentUser as any)?.tenantId;
            const targetTenantId = currentTenantId || localStorage.getItem('tenant-id');

            const roleMap: Record<string, number> = {
                'user': 1, 'admin': 2, 'owner': 3, 'agent': 4
            };

            if (editingUser) {
                await userService.updateUser(token, editingUser.id, {
                    name: formData.name,
                    phone: formData.phone,
                    password: formData.password || undefined,
                    status: formData.status === 'active' ? 1 : formData.status === 'inactive' ? 2 : 3,
                    role: isAdmin ? roleMap[formData.role as string] : (editingUser.role === 'admin' ? 2 : (editingUser.role === 'owner' ? 3 : 1))
                });
            } else {
                await userService.createUser(token, {
                    name: `${formData.firstName} ${formData.lastName}`,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password || 'Password123!',
                    tenantId: targetTenantId || '',
                    role: isAdmin ? (roleMap[formData.role as string] || 1) : 1,
                    addressLine1: formData.addressLine1,
                    addressLine2: formData.addressLine2,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    zipCode: formData.zipCode,
                    companyName: formData.companyName,
                    website: formData.website
                });
            }

            resetForm();
            loadUsers();
            showToast(editingUser ? 'User updated successfully' : 'User created successfully');
        } catch (error) {
            console.error('Failed to save user:', error);
            showToast('Error saving user. Please check all fields.', 'error');
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);

        // Extract names if they are missing but full name exists
        let fName = user.firstName || '';
        let lName = user.lastName || '';
        if (!fName && user.name) {
            const parts = user.name.split(' ');
            fName = parts[0] || '';
            if (!lName && parts.length > 1) {
                lName = parts.slice(1).join(' ');
            }
        }

        setFormData({
            name: user.name || '',
            firstName: fName,
            lastName: lName,
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
            status: user.status,
            addressLine1: user.addressLine1 || '',
            addressLine2: user.addressLine2 || '',
            city: user.city || '',
            state: user.state || '',
            country: user.country || '',
            zipCode: user.zipCode || '',
            companyName: user.companyName || '',
            website: user.website || '',
            password: ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        if (window.confirm(`Are you sure you want to delete ${ids.length > 1 ? ids.length + ' users' : 'this user'}? This action cannot be undone.`)) {
            try {
                const token = getAuthToken();
                if (!token) return;

                await Promise.all(ids.map(userId => userService.deleteUser(token, userId)));

                loadUsers();
                setSelectedUsers(prev => prev.filter(uid => !ids.includes(uid)));
                showToast(`${ids.length > 1 ? ids.length + ' users' : 'User'} deleted successfully`);
            } catch (error) {
                console.error('Failed to delete user(s):', error);
                showToast('Could not delete user(s).', 'error');
            }
        }
    };

    const toggleSelectAll = () => {
        setSelectedUsers(selectedUsers.length === users.length && users.length > 0 ? [] : users.map((u: User) => u.id));
    };

    const toggleSelect = (id: string) => {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    const handleExport = () => {
        const exportList = selectedUsers.length > 0
            ? users.filter((u: User) => selectedUsers.includes(u.id))
            : users;

        if (exportList.length === 0) {
            showToast('No users to export', 'error');
            return;
        }

        const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Joined'];
        const rows = exportList.map((u: User) => [
            `"${u.id}"`,
            `"${u.name}"`,
            `"${u.email}"`,
            `"${u.phone}"`,
            `"${u.role}"`,
            `"${u.status}"`,
            `"${formatDate(u.createdAt)}"`
        ]);

        const csv = [headers, ...rows].map(r => r.join(',').replace(/\r?\n|\r/g, ' ')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast(`${exportList.length} user${exportList.length !== 1 ? 's' : ''} exported successfully`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const lines = (event.target?.result as string).split('\n').filter(l => l.trim());
            if (lines.length < 2) {
                showToast('Invalid CSV file', 'error');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
            setCsvHeaders(headers);
            setCsvRows(rows);

            const fields = ['name', 'email', 'phone', 'role'];
            const init: Record<string, string> = {};
            fields.forEach(f => {
                const match = headers.find(h => h.toLowerCase().includes(f.toLowerCase()));
                if (match) init[f] = match;
            });
            setMapping(init);
            setImportStep('mapping');
        };
        reader.readAsText(file);
    };

    const executeImport = async () => {
        setImportStep('progress');
        setImportTotal(csvRows.length);
        setImportProgress(0);
        const token = getAuthToken();
        const tenantId = mode === 'admin' ? activeTenantId : (currentUser as any)?.tenantId || localStorage.getItem('tenant-id');

        if (!token || !tenantId) {
            showToast('Authentication or Tenant context missing', 'error');
            return;
        }

        const roleMap: Record<string, number> = {
            'user': 1, 'admin': 2, 'owner': 3, 'agent': 4
        };

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < csvRows.length; i++) {
            const row = csvRows[i];
            const get = (f: string) => {
                const h = mapping[f];
                if (!h) return undefined;
                return row[csvHeaders.indexOf(h)];
            };

            try {
                const email = (get('email') || '').trim();
                if (!email) continue;

                await userService.createUser(token, {
                    name: (get('name') || 'Imported User').trim(),
                    email: email,
                    phone: (get('phone') || '').trim(),
                    password: 'Password123!',
                    tenantId: tenantId as string,
                    role: roleMap[(get('role') || 'user').toLowerCase()] || 1
                });
                successCount++;
            } catch (err) {
                console.error('Import failed for row', i, err);
                errorCount++;
            }
            setImportProgress(i + 1);
        }

        showToast(`Import completed: ${successCount} successful, ${errorCount} failed`);
        loadUsers();
        setShowImportModal(false);
        setImportStep('file');
    };

    const handleRoleChange = async (id: string, newRole: User['role']) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const roleMap: Record<string, number> = {
                'user': 1, 'admin': 2, 'owner': 3, 'agent': 4
            };

            await userService.updateUserStatus(token, id, {
                role: roleMap[newRole]
            });
            loadUsers();
        } catch (error) {
            console.error('Failed to update role:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', firstName: '', lastName: '', email: '', phone: '', role: 'user', status: 'active',
            addressLine1: '', addressLine2: '', city: '', state: '', country: '', zipCode: '', companyName: '', website: '', password: ''
        });
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
                    <div className="d-flex gap-2">
                        <button className="btn btn-light d-flex align-items-center gap-2 px-3 shadow-sm border fw-bold" onClick={handleExport}>
                            <i className="bi bi-download"></i>
                            <span className="d-none d-md-inline">Export{selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}</span>
                        </button>
                        <button className="btn btn-light d-flex align-items-center gap-2 px-3 shadow-sm border fw-bold" onClick={() => setShowImportModal(true)}>
                            <i className="bi bi-upload"></i>
                            <span className="d-none d-md-inline">Import</span>
                        </button>
                        <button
                            className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm fw-bold"
                            onClick={() => { resetForm(); setShowModal(true); }}
                        >
                            <i className="bi bi-person-plus-fill"></i>
                            <span>Create User</span>
                        </button>
                    </div>
                </div>

                <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
                    <div className="card-body p-4">
                        <div className="row g-3 align-items-center">
                            <div className="col-md-4">
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
                            <div className="col-md-2">
                                <select
                                    className="form-select bg-light border-0"
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                >
                                    <option value="10">10 / pg</option>
                                    <option value="25">25 / pg</option>
                                    <option value="50">50 / pg</option>
                                    <option value="100">100 / pg</option>
                                </select>
                            </div>
                            <div className="col-md-3 d-flex align-items-center justify-content-end gap-3">
                                <span className="text-muted small fw-medium">
                                    {loading ? 'Updating...' : `${totalUsers} Matches`}
                                </span>
                                {selectedUsers.length > 0 && (
                                    <button className="btn btn-sm btn-outline-danger border-0 ms-2" onClick={() => handleDelete(selectedUsers)} title="Delete Selected">
                                        <i className="bi bi-trash-fill"></i>
                                        <span className="ms-1">Delete ({selectedUsers.length})</span>
                                    </button>
                                )}
                                <div className="vr h-50 mx-2"></div>
                                <button
                                    className="btn btn-sm btn-link text-decoration-none p-0"
                                    onClick={loadUsers}
                                >
                                    <i className="bi bi-arrow-clockwise fs-5"></i>
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
                                    <th className="py-3 px-4 border-0" style={{ width: 40 }}>
                                        <input className="form-check-input shadow-none cursor-pointer" type="checkbox"
                                            checked={selectedUsers.length === users.length && users.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="py-3 border-0 small text-uppercase fw-bold text-muted">Member</th>
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
                                            <Loader message="Loading system users..." />
                                        </td>
                                    </tr>
                                ) : paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((u: User) => {
                                        const isSelected = selectedUsers.includes(u.id);
                                        return (
                                            <tr key={u.id} className={isSelected ? 'table-active' : ''}>
                                                <td className="px-4 py-3">
                                                    <input className="form-check-input shadow-none cursor-pointer" type="checkbox"
                                                        checked={isSelected} onChange={() => toggleSelect(u.id)} />
                                                </td>
                                                <td className="py-3">
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-shrink-0 me-3">
                                                            <div className="rounded-circle bg-primary-soft text-primary d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                                                                {u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
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
                                        );
                                    })
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
                    {totalPages > 1 && (
                        <div className="card-footer bg-white border-0 py-3 px-4 border-top">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="text-muted small">
                                    Showing <span className="fw-bold text-dark">{Math.min(totalUsers, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(totalUsers, currentPage * itemsPerPage)}</span> of <span className="fw-bold text-dark">{totalUsers}</span> users
                                </div>
                                <nav>
                                    <ul className="pagination pagination-sm mb-0 gap-2">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link rounded-2 border-0 bg-light text-dark" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                                                <i className="bi bi-chevron-left"></i>
                                            </button>
                                        </li>
                                        <li className="page-item disabled">
                                            <span className="page-link border-0 bg-white text-dark small fw-bold">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                        </li>
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link rounded-2 border-0 bg-light text-dark" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                                                <i className="bi bi-chevron-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-primary text-white p-4">
                                <h5 className="modal-title fw-bold text-white">
                                    {editingUser ? 'Update User Information' : 'Add New User'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={resetForm}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                                    <h6 className="fw-bold mb-3 d-flex align-items-center"><i className="bi bi-person-circle me-2 text-primary"></i>Personal Information</h6>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-uppercase text-muted">First Name</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.firstName || ''}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-uppercase text-muted">Last Name</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.lastName || ''}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-uppercase text-muted">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control bg-light border-0"
                                                value={formData.email || ''}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                disabled={!!editingUser}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-uppercase text-muted">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-control bg-light border-0"
                                                value={formData.phone || ''}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold text-uppercase text-muted">Password {editingUser ? '(Leave blank to keep current)' : '(Required)'}</label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control bg-light border-0"
                                                    value={formData.password || ''}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    placeholder={editingUser ? "New password" : "User password"}
                                                    required={!editingUser}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary border-0 bg-light"
                                                    onClick={() => {
                                                        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
                                                        let pass = "";
                                                        for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                                                        setFormData({ ...formData, password: pass });
                                                    }}
                                                >
                                                    <i className="bi bi-key-fill me-1"></i> Generate
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <h6 className="fw-bold mb-3 d-flex align-items-center"><i className="bi bi-geo-alt me-2 text-primary"></i>Address Details</h6>
                                    <div className="row g-3 mb-4">
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-uppercase text-muted">Address Line 1</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.addressLine1 || ''}
                                                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-bold text-uppercase text-muted">Address Line 2</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.addressLine2 || ''}
                                                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-uppercase text-muted">City</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.city || ''}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-uppercase text-muted">State / Province</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.state || ''}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-uppercase text-muted">Country</label>
                                            <CountrySelect
                                                value={formData.country || ''}
                                                onChange={(val) => setFormData({ ...formData, country: val })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-uppercase text-muted">Zip / Postal Code</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.zipCode || ''}
                                                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <h6 className="fw-bold mb-3 d-flex align-items-center"><i className="bi bi-briefcase me-2 text-primary"></i>Profile Details</h6>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-uppercase text-muted">Role</label>
                                            <select
                                                className="form-select bg-light border-0"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                            >
                                                <option value="user">Standard User</option>
                                                {isAdmin && (
                                                    <>
                                                        <option value="admin">Administrator</option>
                                                        <option value="owner">Property Owner</option>
                                                    </>
                                                )}
                                                {(isAdmin || isOwner) && <option value="agent">Sales Agent</option>}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-uppercase text-muted">Company Name</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.companyName || ''}
                                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer p-4 pt-0 border-0">
                                    <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={resetForm}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm">
                                        {editingUser ? 'Save Changes' : (isAdmin ? 'Create User' : 'Send Invite')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Import Modal */}
            {
                showImportModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="modal-header bg-dark text-white p-4">
                                    <h5 className="modal-title fw-bold text-white">Import Users via CSV</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowImportModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {importStep === 'file' && (
                                        <div className="text-center py-4">
                                            <i className="bi bi-file-earmark-spreadsheet display-1 text-muted mb-3 d-block"></i>
                                            <h4>Upload CSV File</h4>
                                            <p className="text-muted mb-4">Select a CSV file containing your users list.</p>
                                            <input type="file" accept=".csv" className="form-control" onChange={handleFileChange} />
                                        </div>
                                    )}

                                    {importStep === 'mapping' && (
                                        <div>
                                            <h5>Field Mapping</h5>
                                            <p className="text-muted small mb-4">Map your CSV columns to the system fields.</p>
                                            <div className="row g-3">
                                                {['name', 'email', 'phone', 'role'].map(field => (
                                                    <div className="col-md-6" key={field}>
                                                        <label className="form-label small fw-bold text-uppercase">{field}</label>
                                                        <select className="form-select" value={mapping[field] || ''} onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}>
                                                            <option value="">Select Column</option>
                                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {importStep === 'progress' && (
                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                                            <h4>Importing Users...</h4>
                                            <p className="text-muted">{importProgress} of {importTotal} processed</p>
                                            <div className="progress rounded-pill mt-3" style={{ height: '10px' }}>
                                                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${(importProgress / importTotal) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer p-4 pt-0 border-0">
                                    {importStep === 'file' && <button className="btn btn-light px-4" onClick={() => setShowImportModal(false)}>Cancel</button>}
                                    {importStep === 'mapping' && (
                                        <>
                                            <button className="btn btn-light px-4" onClick={() => setImportStep('file')}>Back</button>
                                            <button className="btn btn-primary px-4 fw-bold" onClick={executeImport}>Start Import</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

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
        </MainLayout >
    );
}
