'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { userService, getAuthToken } from '@/app/services/api';

export default function OwnerUsers() {
    const { id } = useParams();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;
                const response = await userService.getOwnerUsers(token, id as string);
                if (response.success) {
                    setUsers(response.data.users);
                }
            } catch (error) {
                console.error('Failed to load users:', error);
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, [id]);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="vi-table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">User Details</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Contact Info</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0 text-center">Role</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Status</th>
                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0 text-end">Registered On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-5 text-muted">No sub-users registered under this owner's tenant.</td></tr>
                        ) : users.map((u) => (
                            <tr key={u.id}>
                                <td className="px-4 py-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="avatar bg-light text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '38px', height: '38px' }}>
                                            {u.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || '??'}
                                        </div>
                                        <div>
                                            <div className="fw-bold text-dark">{u.name}</div>
                                            <div className="text-muted extra-small">UID: {u.id.substring(0, 8)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3">
                                    <div className="text-dark small"><i className="bi bi-envelope me-2"></i>{u.email}</div>
                                    <div className="text-muted extra-small"><i className="bi bi-telephone me-2"></i>{u.phone || 'No phone'}</div>
                                </td>
                                <td className="py-3 text-center">
                                    <span className="badge bg-secondary-soft text-secondary px-3 py-2 rounded-4 fw-bold">
                                        End-User
                                    </span>
                                </td>
                                <td className="py-3">
                                    <span className={`badge rounded-4 px-3 py-2 ${u.status === 1 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                                        {u.status === 1 ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-end text-muted small">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                .bg-secondary-soft { background-color: rgba(108, 117, 125, 0.1); }
                .extra-small { font-size: 11px; }
            `}</style>
        </div>
    );
}
