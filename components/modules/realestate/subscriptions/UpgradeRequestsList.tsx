'use client';

import { useState, useEffect } from 'react';
import Loader from '@/components/common/Loader';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { upgradeRequestService } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';

interface UpgradeRequest {
    id: string;
    status: number;
    email: string;
    message?: string;
    createdAt: string;
    owner?: { name: string };
    tenant?: { name: string };
    requestedPlan?: { name: string; price: number; interval: string };
}

export default function UpgradeRequestsList() {
    const { isAdmin } = useAuthContext();
    const [requests, setRequests] = useState<UpgradeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        if (isAdmin) {
            loadRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const res = await upgradeRequestService.getAllRequests();
            if (res.success) {
                setRequests(res.data);
            }
        } catch (error) {
            console.error('Failed to load upgrade requests:', error);
            showToast('Failed to load requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: number) => {
        try {
            const res = await upgradeRequestService.updateStatus(id, status);
            if (res.success) {
                showToast(`Request ${status === 2 ? 'approved' : 'rejected'} successfully`);
                loadRequests();
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Action failed';
            showToast(message, 'error');
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-3">Pending</span>;
            case 2: return <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">Approved</span>;
            case 3: return <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3">Rejected</span>;
            default: return null;
        }
    };

    return (
        <MainLayout activePage="upgrade-requests">
            <div className="container-fluid py-4">
                <div className="mb-4">
                    <h2 className="fw-bold mb-1">Upgrade Requests</h2>
                    <p className="text-muted small mb-0">Review and manage subscription upgrade requests from property owners</p>
                </div>

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 text-uppercase extra-small fw-bold text-muted border-0">Owner / Tenant</th>
                                    <th className="py-3 text-uppercase extra-small fw-bold text-muted border-0">Requested Plan</th>
                                    <th className="py-3 text-uppercase extra-small fw-bold text-muted border-0">Status</th>
                                    <th className="py-3 text-uppercase extra-small fw-bold text-muted border-0">Message</th>
                                    <th className="py-3 text-uppercase extra-small fw-bold text-muted border-0">Date</th>
                                    <th className="px-4 py-3 text-uppercase extra-small fw-bold text-muted border-0 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5">
                                            <Loader message="Loading requests..." />
                                        </td>
                                    </tr>
                                ) : requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5">
                                            <div className="text-muted italic">No upgrade requests found</div>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id}>
                                            <td className="px-4 py-3">
                                                <div className="fw-bold fs-14">{req.owner?.name || 'Unknown'}</div>
                                                <div className="text-muted extra-small">{req.tenant?.name}</div>
                                                <div className="extra-small text-primary">{req.email}</div>
                                            </td>
                                            <td className="py-3">
                                                <div className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 extra-small mb-1">
                                                    {req.requestedPlan?.name}
                                                </div>
                                                <div className="extra-small text-muted">${req.requestedPlan?.price}/{req.requestedPlan?.interval}</div>
                                            </td>
                                            <td className="py-3">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="py-3">
                                                <div className="text-muted extra-small" style={{ maxWidth: '200px' }}>
                                                    {req.message || <span className="opacity-50 italic">No message</span>}
                                                </div>
                                            </td>
                                            <td className="py-3 text-muted extra-small">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                                <div className="opacity-50">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-4 py-3 text-end">
                                                {req.status === 1 && (
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            className="btn btn-sm btn-outline-success rounded-3 px-3 fw-bold"
                                                            onClick={() => handleStatusUpdate(req.id, 2)}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger rounded-3 px-3 fw-bold"
                                                            onClick={() => handleStatusUpdate(req.id, 3)}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {req.status !== 1 && (
                                                    <span className="extra-small text-muted italic">Processed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <style jsx>{`
        .extra-small { font-size: 0.7rem; }
        .fs-14 { font-size: 0.875rem; }
        .bg-primary-subtle { background-color: rgba(13, 110, 253, 0.1); }
      `}</style>
        </MainLayout>
    );
}
