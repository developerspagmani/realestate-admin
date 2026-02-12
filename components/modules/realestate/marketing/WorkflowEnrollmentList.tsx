'use client';

import { useState, useEffect } from 'react';
import { marketingService, getAuthToken } from '@/app/services/api';

interface Enrollment {
    id: string;
    leadId: string;
    lead: {
        name: string;
        email: string;
        leadScore: number;
    };
    currentStep: string;
    status: number;
    nextActionAt: string;
    enrolledAt: string;
}

interface WorkflowEnrollmentListProps {
    workflowId: string;
    workflowName: string;
    onClose: () => void;
}

export default function WorkflowEnrollmentList({ workflowId, workflowName, onClose }: WorkflowEnrollmentListProps) {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEnrollments = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;
                const res = await marketingService.getWorkflowEnrollments(token, workflowId);
                if (res.success) {
                    setEnrollments(res.data);
                }
            } catch (error) {
                console.error('Failed to load enrollments:', error);
            } finally {
                setLoading(false);
            }
        };

        loadEnrollments();
    }, [workflowId]);

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <span className="badge bg-success-soft text-success rounded-4 px-2">Active</span>;
            case 2: return <span className="badge bg-primary-soft text-primary rounded-4 px-2">Completed</span>;
            case 3: return <span className="badge bg-warning-soft text-warning rounded-4 px-2">Paused</span>;
            case 4: return <span className="badge bg-danger-soft text-danger rounded-4 px-2">Cancelled</span>;
            default: return <span className="badge bg-secondary-soft text-secondary rounded-4 px-2">Unknown</span>;
        }
    };

    return (
        <div className="offcanvas offcanvas-end show border-0 shadow" style={{ visibility: 'visible', width: '500px' }}>
            <div className="offcanvas-header border-bottom p-4">
                <div>
                    <h5 className="offcanvas-title fw-bold mb-1">Active Enrollments</h5>
                    <p className="text-muted extra-small mb-0">{workflowName}</p>
                </div>
                <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="offcanvas-body p-0">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border spinner-border-sm text-primary"></div>
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className="text-center py-5 px-4">
                        <i className="bi bi-people display-4 text-muted opacity-25"></i>
                        <p className="text-muted small mt-2">No leads are currently enrolled in this workflow.</p>
                    </div>
                ) : (
                    <div className="vi-table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 extra-small fw-bold text-muted text-uppercase">Lead</th>
                                    <th className="py-3 extra-small fw-bold text-muted text-uppercase">Status</th>
                                    <th className="py-3 extra-small fw-bold text-muted text-uppercase">Score</th>
                                    <th className="px-4 py-3 extra-small fw-bold text-muted text-uppercase text-end">Enrolled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">
                                            <div className="fw-bold small">{item.lead?.name || 'Anonymous'}</div>
                                            <div className="extra-small text-muted">{item.lead?.email}</div>
                                        </td>
                                        <td className="py-3">{getStatusBadge(item.status)}</td>
                                        <td className="py-3">
                                            <span className="badge bg-light text-dark border extra-small">{item.lead?.leadScore || 0}</span>
                                        </td>
                                        <td className="px-4 py-3 text-end extra-small text-muted">
                                            {new Date(item.enrolledAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <style jsx>{`
                .extra-small { font-size: 0.7rem; }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                .bg-secondary-soft { background-color: rgba(108, 117, 125, 0.1); }
            `}</style>
        </div>
    );
}
