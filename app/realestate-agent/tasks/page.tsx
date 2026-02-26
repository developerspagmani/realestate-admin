'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { taskService } from '@/app/services/api';

export default function AgentTasksPage() {
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<any[]>([]);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await taskService.getMyTasks();
            if (res.success) {
                setTasks(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (taskId: string, status: number) => {
        try {
            const res = await taskService.updateStatus(taskId, status);
            if (res.success) {
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };

    const getPriorityBadge = (p: number) => {
        switch (p) {
            case 3: return <span className="badge bg-danger">High Priority</span>;
            case 2: return <span className="badge bg-warning text-dark">Medium</span>;
            default: return <span className="badge bg-light text-dark border">Low</span>;
        }
    };

    return (
        <MainLayout activePage="tasks">
            <div className="container-fluid py-4 text-dark">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-0">My Assignments</h2>
                        <p className="text-muted">Tasks assigned to you by the platform owner</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="row g-4">
                        <div className="col-12">
                            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3">Task Details</th>
                                                <th>Related Lead</th>
                                                <th>Due Date</th>
                                                <th>Priority</th>
                                                <th className="text-end px-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((task) => (
                                                <tr key={task.id} className={task.status === 3 ? 'opacity-50' : ''}>
                                                    <td className="px-4">
                                                        <div className="fw-bold text-dark">{task.title}</div>
                                                        <div className="small text-muted text-truncate" style={{ maxWidth: '300px' }}>
                                                            {task.description || 'No instructions provided.'}
                                                        </div>
                                                        <div className="mt-1" style={{ fontSize: '10px' }}>
                                                            Assigned by: <span className="fw-semibold">{task.creator?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {task.lead ? (
                                                            <div>
                                                                <div className="fw-medium text-primary">{task.lead.name}</div>
                                                                <div className="small text-muted">{task.lead.phone || task.lead.email}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted small">General Task</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="small">
                                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
                                                        </div>
                                                    </td>
                                                    <td>{getPriorityBadge(task.priority)}</td>
                                                    <td className="text-end px-4">
                                                        {task.status !== 3 ? (
                                                            <div className="btn-group">
                                                                <button
                                                                    className="btn btn-sm btn-outline-success rounded-pill px-3"
                                                                    onClick={() => handleUpdateStatus(task.id, 3)}
                                                                >
                                                                    <i className="bi bi-check2 me-1"></i> Mark Done
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-success small fw-bold">
                                                                <i className="bi bi-check-circle-fill me-1"></i> Completed
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {tasks.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-5">
                                                        <div className="py-4">
                                                            <i className="bi bi-clipboard-check display-4 text-muted opacity-25"></i>
                                                            <p className="mt-3 text-muted">You're all caught up! No pending tasks.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
