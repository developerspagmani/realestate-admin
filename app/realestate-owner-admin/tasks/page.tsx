'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { taskService, agentService, leadService } from '@/app/services/api';
import TaskModal from '@/components/modules/realestate/tasks/TaskModal';
import Toast from '@/components/common/Toast';

export default function OwnerTasksPage() {
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
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

    // Multi-select and Import/Export state
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importStep, setImportStep] = useState<'file' | 'mapping' | 'progress'>('file');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importProgress, setImportProgress] = useState(0);
    const [importTotal, setImportTotal] = useState(0);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };


    useEffect(() => {
        fetchData();
        setSelectedTasks([]);
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || '';

            const [tasksRes, agentsRes, leadsRes] = await Promise.all([
                taskService.getAll(filter),
                agentService.getAgents(token),
                leadService.getLeads(token, { limit: '100' })
            ]);

            if (tasksRes.success) setTasks(tasksRes.data);
            if (agentsRes.success) {
                const agentData = Array.isArray(agentsRes.data) ? agentsRes.data : (agentsRes.data?.agents || []);
                setAgents(agentData);
            }
            if (leadsRes.success) {
                const leadData = Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.data?.leads || []);
                setLeads(leadData);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        if (!confirm(`Are you sure you want to delete ${ids.length > 1 ? ids.length + ' tasks' : 'this task'}?`)) return;
        try {
            await Promise.all(ids.map(taskId => taskService.delete(taskId)));
            showToast(`${ids.length > 1 ? ids.length + ' tasks' : 'Task'} deleted successfully`);
            setSelectedTasks(prev => prev.filter(tid => !ids.includes(tid)));
            fetchData();
        } catch (error) {
            showToast('Failed to delete task(s)', 'error');
        }
    };

    const toggleSelectAll = () => {
        setSelectedTasks(selectedTasks.length === tasks.length && tasks.length > 0 ? [] : tasks.map(t => t.id));
    };

    const toggleSelect = (id: string) => {
        setSelectedTasks(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]);
    };

    const handleExport = () => {
        const exportList = selectedTasks.length > 0
            ? tasks.filter(t => selectedTasks.includes(t.id))
            : tasks;
        if (exportList.length === 0) { showToast('No tasks to export', 'error'); return; }

        const csvHeaders = ['Task ID', 'Title', 'Description', 'Assigned To', 'Lead', 'Status', 'Priority', 'Due Date'];
        const rows = exportList.map(t => [
            `"${t.id}"`,
            `"${t.title || ''}"`,
            `"${t.description || ''}"`,
            `"${t.agent?.user?.name || t.agent?.name || 'Unassigned'}"`,
            `"${t.lead?.name || 'General'}"`,
            `"${t.status === 1 ? 'Pending' : t.status === 2 ? 'In Progress' : 'Completed'}"`,
            `"${t.priority === 3 ? 'High' : t.priority === 2 ? 'Medium' : 'Low'}"`,
            `"${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}"`
        ]);

        const csv = [csvHeaders, ...rows].map(r => r.join(',').replace(/\r?\n|\r/g, ' ')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast(`${exportList.length} task${exportList.length !== 1 ? 's' : ''} exported successfully`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const lines = (event.target?.result as string).split('\n').filter(l => l.trim());
            if (lines.length < 2) { showToast('Invalid CSV file', 'error'); return; }
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));
            setCsvHeaders(headers);
            setCsvRows(rows);

            const fields = ['title', 'description', 'agentEmail', 'leadEmail', 'priority', 'dueDate'];
            const init: Record<string, string> = {};
            fields.forEach(f => {
                const match = headers.find(h => h.toLowerCase().includes(f.toLowerCase().replace(/([A-Z])/g, ' $1').trim().toLowerCase()));
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

        for (let i = 0; i < csvRows.length; i++) {
            const row = csvRows[i];
            const get = (f: string) => { const h = mapping[f]; if (!h) return undefined; return row[csvHeaders.indexOf(h)]; };

            try {
                const title = (get('title') || '').trim();
                if (!title) continue;

                const description = (get('description') || '').trim();
                const agentEmail = (get('agentEmail') || '').trim();
                const leadEmail = (get('leadEmail') || '').trim();
                const priority = parseInt(get('priority') || '1');
                const dueDate = get('dueDate') ? new Date(get('dueDate')!) : new Date();

                // 1. Resolve Agent
                let resolvedAgentId = '';
                if (agentEmail) {
                    const match = agents.find(a => (a.user?.email || a.email)?.toLowerCase() === agentEmail.toLowerCase());
                    if (match) resolvedAgentId = match.id;
                }

                // 2. Resolve Lead
                let resolvedLeadId = '';
                if (leadEmail) {
                    const match = leads.find(l => l.email?.toLowerCase() === leadEmail.toLowerCase());
                    if (match) resolvedLeadId = match.id;
                }

                await taskService.create({
                    title,
                    description,
                    agentId: resolvedAgentId || undefined,
                    leadId: resolvedLeadId || undefined,
                    priority,
                    dueDate: dueDate.toISOString(),
                    status: 1 // pending
                });
            } catch (err) {
                console.error('Import failed for row', i, err);
            }
            setImportProgress(i + 1);
        }
        showToast(`Import completed: ${csvRows.length} tasks processed`);
        fetchData();
        setShowImportModal(false);
        setImportStep('file');
    };

    const getStatusLabel = (status: number) => {
        const config: any = {
            1: { label: 'Pending', class: 'bg-warning-soft text-warning', icon: 'bi-clock' },
            2: { label: 'In Progress', class: 'bg-primary-soft text-primary', icon: 'bi-play-circle' },
            3: { label: 'Completed', class: 'bg-success-soft text-success', icon: 'bi-check-circle' },
            4: { label: 'Cancelled', class: 'bg-danger-soft text-danger', icon: 'bi-x-circle' }
        };
        const s = config[status] || { label: 'Unknown', class: 'bg-light text-muted', icon: 'bi-question' };
        return (
            <span className={`badge ${s.class} border-0 rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2`}>
                <i className={`bi ${s.icon}`}></i>
                {s.label}
            </span>
        );
    };

    const getPriorityBadge = (p: number) => {
        const config: any = {
            3: { label: 'High Priority', class: 'bg-danger-soft text-danger', icon: 'bi-exclamation-octagon' },
            2: { label: 'Medium', class: 'bg-warning-soft text-warning', icon: 'bi-exclamation-triangle' },
            1: { label: 'Low', class: 'bg-secondary-soft text-secondary', icon: 'bi-info-circle' }
        };
        const s = config[p] || { label: 'Normal', class: 'bg-light text-muted', icon: 'bi-info-circle' };
        return (
            <span className={`badge ${s.class} border-0 rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2`}>
                <i className={`bi ${s.icon}`}></i>
                {s.label}
            </span>
        );
    };

    const [selectedTask, setSelectedTask] = useState<any>(null);

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
                    <div className="d-flex gap-2">
                        <button className="btn btn-light d-flex align-items-center gap-2 px-3 shadow-sm border" onClick={handleExport}>
                            <i className="bi bi-download"></i>
                            <span className="d-none d-md-inline">Export{selectedTasks.length > 0 ? ` (${selectedTasks.length})` : ''}</span>
                        </button>
                        <button className="btn btn-light d-flex align-items-center gap-2 px-3 shadow-sm border" onClick={() => setShowImportModal(true)}>
                            <i className="bi bi-upload"></i>
                            <span className="d-none d-md-inline">Import</span>
                        </button>
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
                                        <option key={a.id} value={a.id}>{a.user?.name || a.name}</option>
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

                {/* Bulk Actions */}
                {selectedTasks.length > 0 && (
                    <div className="alert bg-primary-soft border-primary-subtle d-flex justify-content-between align-items-center p-3 mb-4 rounded-4 shadow-sm animate__animated animate__fadeIn">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                <i className="bi bi-check2-all"></i>
                            </div>
                            <span className="fw-bold text-primary">{selectedTasks.length} tasks selected</span>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-danger btn-sm px-3 rounded-pill fw-bold" onClick={() => handleDelete(selectedTasks)}>
                                <i className="bi bi-trash3 me-2"></i> Delete Selected
                            </button>
                            <button className="btn btn-link btn-sm text-muted text-decoration-none" onClick={() => setSelectedTasks([])}>
                                Deselect All
                            </button>
                        </div>
                    </div>
                )}

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
                                        <th className="px-4 py-3" style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={tasks.length > 0 && selectedTasks.length === tasks.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="py-3">Task Details</th>
                                        <th>Assigned To</th>
                                        <th>Target Lead</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th className="text-end px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(tasks) && tasks.map((task) => (
                                        <tr key={task.id} className={selectedTasks.includes(task.id) ? 'bg-primary-soft' : ''}>
                                            <td className="px-4">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedTasks.includes(task.id)}
                                                    onChange={() => toggleSelect(task.id)}
                                                />
                                            </td>
                                            <td>
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
                                                        {(task.agent?.user?.name || task.agent?.name || 'U')[0]}
                                                    </div>
                                                    <div className="small fw-medium">{task.agent?.user?.name || task.agent?.name || 'Unassigned'}</div>


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
                                            <td colSpan={7} className="text-center py-5">
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
                    fetchData();
                }}
            />

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            {/* Import Modal */}
            {showImportModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h4 className="fw-bold mb-0">Import Tasks from CSV</h4>
                                <button type="button" className="btn-close" onClick={() => { setShowImportModal(false); setImportStep('file'); }}></button>
                            </div>
                            <div className="modal-body p-4">
                                {importStep === 'file' && (
                                    <div className="text-center py-4">
                                        <div className="mb-4">
                                            <i className="bi bi-file-earmark-spreadsheet text-primary opacity-25" style={{ fontSize: '5rem' }}></i>
                                        </div>
                                        <h5 className="fw-bold">Choose your CSV file</h5>
                                        <p className="text-muted mb-4 small">Prepare your spreadsheet with task titles, descriptions, and agent emails.</p>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                        />
                                        <div className="mt-4 p-3 bg-light rounded-3 text-start">
                                            <h6 className="fw-bold small text-uppercase">Recommended Columns:</h6>
                                            <code className="small">title, description, agentEmail, leadEmail, priority (1-3), dueDate (YYYY-MM-DD)</code>
                                        </div>
                                    </div>
                                )}

                                {importStep === 'mapping' && (
                                    <div>
                                        <h6 className="fw-bold mb-3">Map CSV Columns to Task Fields</h6>
                                        <div className="vstack gap-3">
                                            {['title', 'description', 'agentEmail', 'leadEmail', 'priority', 'dueDate'].map(field => (
                                                <div key={field} className="row align-items-center">
                                                    <div className="col-5">
                                                        <span className="small fw-bold text-muted text-capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                                                    </div>
                                                    <div className="col-7">
                                                        <select
                                                            className="form-select form-select-sm bg-light border-0"
                                                            value={mapping[field] || ''}
                                                            onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                                                        >
                                                            <option value="">Skip this field</option>
                                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="btn btn-primary w-100 mt-4 py-2 fw-bold" onClick={executeImport}>
                                            Start Import ({csvRows.length} rows)
                                        </button>
                                    </div>
                                )}

                                {importStep === 'progress' && (
                                    <div className="text-center py-4">
                                        <div className="progress mb-3 rounded-pill" style={{ height: '10px' }}>
                                            <div
                                                className="progress-bar progress-bar-striped progress-bar-animated"
                                                style={{ width: `${(importProgress / importTotal) * 100}%` }}
                                            ></div>
                                        </div>
                                        <h5 className="fw-bold">{importProgress} / {importTotal}</h5>
                                        <p className="text-muted mb-0">Importing tasks, please wait...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .avatar-xs {
                    background-color: rgba(13, 110, 253, 0.1);
                }
                .x-small {
                    font-size: 0.75rem;
                }
                .bg-primary-soft {
                    background-color: rgba(13, 110, 253, 0.08) !important;
                }
                .bg-success-soft {
                    background-color: rgba(25, 135, 84, 0.1) !important;
                }
                .bg-warning-soft {
                    background-color: rgba(255, 193, 7, 0.1) !important;
                }
                .bg-danger-soft {
                    background-color: rgba(220, 53, 69, 0.1) !important;
                }
                .bg-secondary-soft {
                    background-color: rgba(108, 117, 125, 0.1) !important;
                }
            `}</style>
        </MainLayout>
    );
}
