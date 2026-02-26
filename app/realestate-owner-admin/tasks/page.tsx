'use client';

import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { taskService, agentService, leadService, getAuthToken } from '@/app/services/api';
import TaskModal from '@/components/modules/realestate/tasks/TaskModal';
import Toast from '@/components/common/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function OwnerTasksPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [filter, setFilter] = useState({
        status: '',
        priority: '',
        assignedTo: ''
    });

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };


    const token = typeof window !== 'undefined' ? getAuthToken() : '';

    const { data: tasksData, isLoading: tasksLoading } = useQuery({
        queryKey: ['tasks', filter],
        queryFn: () => taskService.getAll(filter),
        enabled: !!token,
    });

    const { data: agentsData } = useQuery({
        queryKey: ['agents'],
        queryFn: () => agentService.getAgents(token!),
        enabled: !!token,
    });

    const { data: leadsData } = useQuery({
        queryKey: ['leads', { limit: '100' }],
        queryFn: () => leadService.getLeads(token!, { limit: '100' }),
        enabled: !!token,
    });

    const tasks = tasksData?.data || [];
    const agents = useMemo(() => {
        const res = agentsData?.data;
        return Array.isArray(res) ? res : (res?.agents || []);
    }, [agentsData]);
    const leads = useMemo(() => {
        const res = leadsData?.data;
        return Array.isArray(res) ? res : (res?.leads || []);
    }, [leadsData]);

    const loading = tasksLoading;

    const deleteMutation = useMutation({
        mutationFn: (id: string) => taskService.delete(id),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                showToast('Task deleted successfully');
            } else {
                showToast(res.message || 'Failed to delete task', 'error');
            }
        },
        onError: () => showToast('Failed to delete task', 'error')
    });

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        deleteMutation.mutate(id);
    };

    const getStatusLabel = (status: number) => {
        switch (status) {
            case 1: return <span className="badge bg-secondary">Pending</span>;
            case 2: return <span className="badge bg-primary">In Progress</span>;
            case 3: return <span className="badge bg-success">Completed</span>;
            default: return <span className="badge bg-light text-dark">Unknown</span>;
        }
    };

    const getPriorityBadge = (p: number) => {
        switch (p) {
            case 3: return <span className="badge bg-danger">High Priority</span>;
            case 2: return <span className="badge bg-warning text-dark">Medium</span>;
            default: return <span className="badge bg-light text-dark border">Low</span>;
        }
    };

    const handleEdit = (task: any) => {
        setSelectedTask(task);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedTask(null);
    };

    return (
        <MainLayout activePage="tasks">
            <div className="container-fluid py-4 text-dark">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-0">Master Task Control</h2>
                        <p className="text-muted">Direct and monitor your sales force activities</p>
                    </div>
                    <button
                        className="btn btn-primary rounded-pill px-4 shadow-sm"
                        onClick={() => {
                            setSelectedTask(null);
                            setModalOpen(true);
                        }}
                    >
                        <i className="bi bi-plus-lg me-2"></i> Create New Task
                    </button>
                </div>

                {/* Filters */}
                <div className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body p-3">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <select
                                    className="form-select border-0 bg-light rounded-3"
                                    value={filter.status}
                                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="1">Pending</option>
                                    <option value="2">In Progress</option>
                                    <option value="3">Completed</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <select
                                    className="form-select border-0 bg-light rounded-3"
                                    value={filter.priority}
                                    onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                                >
                                    <option value="">All Priorities</option>
                                    <option value="3">High Priority</option>
                                    <option value="2">Medium</option>
                                    <option value="1">Low</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <select
                                    className="form-select border-0 bg-light rounded-3"
                                    value={filter.assignedTo}
                                    onChange={(e) => setFilter({ ...filter, assignedTo: e.target.value })}
                                >
                                    <option value="">All Agents</option>
                                    {Array.isArray(agents) && agents.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.user?.name || (a.user?.firstName ? `${a.user.firstName} ${a.user?.lastName || ''}`.trim() : null) || a.user?.email || a.name || 'Unknown Agent'}
                                        </option>
                                    ))}

                                </select>
                            </div>
                            <div className="col-md-3">
                                <button
                                    className="btn btn-light w-100 rounded-3 text-muted"
                                    onClick={() => setFilter({ status: '', priority: '', assignedTo: '' })}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3">Task Details</th>
                                        <th>Assigned To</th>
                                        <th>Target Lead</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th className="text-end px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(tasks) && tasks.map((task) => (
                                        <tr key={task.id}>
                                            <td className="px-4">
                                                <div className="fw-bold text-dark">{task.title}</div>

                                                <div className="small text-muted text-truncate" style={{ maxWidth: '250px' }}>
                                                    {task.description || 'No description'}
                                                </div>
                                                <div className="mt-1 x-small text-muted">
                                                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar-xs bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                                        {(task.agent?.user?.name || (task.agent?.user?.firstName ? `${task.agent.user.firstName}` : null) || task.agent?.user?.email || task.agent?.name || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div className="small fw-medium">
                                                        {task.agent?.user?.name || (task.agent?.user?.firstName ? `${task.agent.user.firstName} ${task.agent.user?.lastName || ''}`.trim() : null) || task.agent?.user?.email || task.agent?.name || 'Unassigned'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {task.lead ? (
                                                    <div className="small">
                                                        <div className="fw-bold text-dark">{task.lead.name}</div>
                                                        <div className="text-muted">{task.lead.phone}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small italic">General</span>
                                                )}
                                            </td>
                                            <td>{getStatusLabel(task.status)}</td>
                                            <td>{getPriorityBadge(task.priority)}</td>
                                            <td className="text-end px-4">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button
                                                        className="btn btn-link text-primary p-0 border-0"
                                                        onClick={() => handleEdit(task)}
                                                        title="Edit Task"
                                                    >
                                                        <i className="bi bi-pencil-square fs-5"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-link text-danger p-0 border-0"
                                                        onClick={() => handleDelete(task.id)}
                                                        title="Delete Task"
                                                    >
                                                        <i className="bi bi-trash3 fs-5"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {tasks.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-5">
                                                <div className="py-4">
                                                    <i className="bi bi-journal-x display-4 text-muted opacity-25"></i>
                                                    <p className="mt-3 text-muted">No tasks found matching your filters.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <TaskModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                agents={agents}
                leads={leads}
                task={selectedTask}
                onSuccess={() => {
                    showToast(selectedTask ? 'Task updated successfully!' : 'Task created and assigned successfully!', 'success');
                    queryClient.invalidateQueries({ queryKey: ['tasks'] });
                }}
            />

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <style jsx>{`
                .avatar-xs {
                    background-color: rgba(13, 110, 253, 0.1);
                }
                .x-small {
                    font-size: 0.75rem;
                }
            `}</style>
        </MainLayout>
    );
}
