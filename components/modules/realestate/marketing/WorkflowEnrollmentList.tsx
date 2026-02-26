'use client';

import React, { useState, useEffect } from 'react';
import Loader from '@/components/common/Loader';
import { marketingService, getAuthToken } from '@/app/services/api';
import { useQuery } from '@tanstack/react-query';

interface EnrollmentLog {
    id: string;
    stepId: string;
    actionType: string;
    status: string;
    result: any;
    occurredAt: string;
}

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
    logs?: EnrollmentLog[];
}

interface WorkflowEnrollmentListProps {
    workflowId: string;
    workflowName: string;
    onClose: () => void;
}

export default function WorkflowEnrollmentList({ workflowId, workflowName, onClose }: WorkflowEnrollmentListProps) {
    const [selectedEnrollment, setSelectedEnrollment] = useState<string | null>(null);

    const token = typeof window !== 'undefined' ? getAuthToken() : '';

    const { data: enrollmentsRes, isLoading: loading } = useQuery({
        queryKey: ['workflow-enrollments', workflowId],
        queryFn: () => marketingService.getWorkflowEnrollments(token!, workflowId),
        enabled: !!token && !!workflowId,
    });

    const { data: logsRes, isLoading: loadingLogs } = useQuery({
        queryKey: ['workflow-enrollment-logs', selectedEnrollment],
        queryFn: () => marketingService.getWorkflowEnrollmentLogs(token!, selectedEnrollment!),
        enabled: !!token && !!selectedEnrollment,
    });

    const enrollments = enrollmentsRes?.data || [];
    const enrollmentLogs = logsRes?.data || [];

    const handleToggleLogs = (enrollmentId: string) => {
        if (selectedEnrollment === enrollmentId) {
            setSelectedEnrollment(null);
        } else {
            setSelectedEnrollment(enrollmentId);
        }
    };

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
        <div className="offcanvas offcanvas-end show border-0 shadow" style={{ visibility: 'visible', width: '550px' }}>
            <div className="offcanvas-header border-bottom p-4">
                <div>
                    <h5 className="offcanvas-title fw-bold mb-1">Active Enrollments</h5>
                    <p className="text-muted extra-small mb-0">{workflowName}</p>
                </div>
                <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="offcanvas-body p-0">
                {loading ? (
                    <div className="py-5">
                        <Loader message="Fetching enrollments..." />
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
                                    <th className="px-4 py-3 extra-small fw-bold text-muted text-uppercase text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map((item: Enrollment) => (
                                    <React.Fragment key={item.id}>
                                        <tr className={selectedEnrollment === item.id ? 'bg-light' : ''}>
                                            <td className="px-4 py-3">
                                                <div className="fw-bold small">{item.lead?.name || 'Anonymous'}</div>
                                                <div className="extra-small text-muted">{item.lead?.email}</div>
                                            </td>
                                            <td className="py-3">{getStatusBadge(item.status)}</td>
                                            <td className="px-4 py-3 text-end">
                                                <button
                                                    className="btn btn-sm btn-outline-primary extra-small px-3 rounded-pill"
                                                    onClick={() => handleToggleLogs(item.id)}
                                                >
                                                    {selectedEnrollment === item.id ? 'Hide Logs' : 'View History'}
                                                </button>
                                            </td>
                                        </tr>
                                        {selectedEnrollment === item.id && (
                                            <tr>
                                                <td colSpan={3} className="bg-light p-0">
                                                    <div className="p-4 border-bottom">
                                                        <h6 className="extra-small fw-bold text-uppercase text-muted mb-3">Execution History</h6>
                                                        {loadingLogs ? (
                                                            <div className="text-center py-3">
                                                                <Loader message="" fullPage={false} />
                                                            </div>
                                                        ) : enrollmentLogs.length === 0 ? (
                                                            <div className="text-center py-3 extra-small text-muted">No logs recorded yet.</div>
                                                        ) : (
                                                            <div className="log-timeline">
                                                                {enrollmentLogs.map((log: EnrollmentLog) => (
                                                                    <div key={log.id} className="log-item mb-3 d-flex gap-3">
                                                                        <div className="log-time extra-small text-muted pt-1" style={{ width: '70px' }}>
                                                                            {new Date(log.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                        <div className="log-content flex-grow-1">
                                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                                <span className={`badge extra-small rounded-pill ${log.status === 'SUCCESS' ? 'bg-success' : log.status === 'FAILED' ? 'bg-warning' : 'bg-danger'}`}>
                                                                                    {log.status}
                                                                                </span>
                                                                                <span className="extra-small fw-bold text-dark">{log.actionType}</span>
                                                                            </div>
                                                                            <div className="extra-small text-muted bg-white border p-2 rounded">
                                                                                {log.result?.message || log.result?.error || 'Processed step'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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
                .log-timeline { position: relative; }
            `}</style>
        </div>
    );
}
