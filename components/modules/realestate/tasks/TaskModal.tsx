'use client';

import React, { useState } from 'react';
import { taskService } from '@/app/services/api';
import { useMutation } from '@tanstack/react-query';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId?: string;
    leadName?: string;
    agentId?: string;
    agentName?: string;
    agents?: any[];
    leads?: any[];
    task?: any; // Add task prop for editing
    onSuccess: () => void;
}

export default function TaskModal({ isOpen, onClose, leadId, leadName, agentId, agentName, agents, leads, task, onSuccess }: TaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState(2);
    const [dueDate, setDueDate] = useState('');
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState('');

    const isEditing = !!task;

    const mutation = useMutation({
        mutationFn: async (taskData: any) => {
            if (isEditing) return taskService.update(task.id, taskData);
            return taskService.create(taskData);
        },
        onSuccess: (res) => {
            if (res.success) {
                onSuccess();
                onClose();
            } else {
                alert(res.message || `Failed to ${isEditing ? 'update' : 'create'} task.`);
            }
        },
        onError: (error: any) => {
            alert(error.message || `Failed to ${isEditing ? 'update' : 'create'} task.`);
        }
    });

    const loading = mutation.isPending;

    // Sync state with props when modal opens or props change
    React.useEffect(() => {
        if (isOpen) {
            if (task) {
                // Pre-fill for editing
                setTitle(task.title || '');
                setDescription(task.description || '');
                setPriority(task.priority || 2);
                setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
                setSelectedAgentId(task.assignedTo || '');
                setSelectedLeadId(task.leadId || '');
            } else {
                // Default for new task
                setSelectedAgentId(agentId || '');
                setSelectedLeadId(leadId || '');
                setTitle(leadName ? `Follow up with ${leadName}` : '');
                setDescription('');
                setPriority(2);
                setDueDate('');
            }
        }
    }, [isOpen, task, agentId, leadId, leadName]);

    // Update title when lead changes if it was empty or auto-generated
    const handleLeadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedLeadId(id);
        if (leads && !isEditing) {
            const lead = leads.find(l => l.id === id);
            if (lead && (!title || title.startsWith('Follow up with'))) {
                setTitle(`Follow up with ${lead.name}`);
            }
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const taskData = {
            title,
            description,
            priority,
            dueDate: dueDate || null,
            assignedTo: selectedAgentId || null,
            leadId: selectedLeadId || null
        };
        mutation.mutate(taskData);
    };


    if (!isOpen) return null;

    return (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow rounded-4 text-dark">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">
                            {isEditing ? 'Edit Task Details' : 'Assign Task to Agent'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body py-4">
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Task Title</label>
                                <input
                                    type="text"
                                    className="form-control rounded-3"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Instructions / Description</label>
                                <textarea
                                    className="form-control rounded-3"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g. Call client to discuss price drop, send updated proposal."
                                ></textarea>
                            </div>
                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Priority</label>
                                    <select
                                        className="form-select rounded-3"
                                        value={priority}
                                        onChange={(e) => setPriority(parseInt(e.target.value))}
                                    >
                                        <option value={1}>Low</option>
                                        <option value={2}>Medium</option>
                                        <option value={3}>High</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-bold">Due Date</label>
                                    <input
                                        type="date"
                                        className="form-control rounded-3"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold">Assign to Agent</label>
                                <select
                                    className="form-select rounded-3"
                                    value={selectedAgentId}
                                    onChange={(e) => setSelectedAgentId(e.target.value)}
                                    required
                                    disabled={loading}
                                >
                                    <option value="">Select an Agent...</option>
                                    {(Array.isArray(agents) ? agents : (agents as any)?.agents || []).map((a: any) => (
                                        <option key={a.id} value={a.id}>
                                            {a.user?.name || (a.user?.firstName ? `${a.user.firstName} ${a.user?.lastName || ''}`.trim() : null) || a.user?.email || a.name || 'Unknown Agent'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold">Related Lead (Optional)</label>
                                <select
                                    className="form-select rounded-3"
                                    value={selectedLeadId}
                                    onChange={handleLeadChange}
                                    disabled={loading}
                                >
                                    <option value="">No specific lead</option>
                                    {(Array.isArray(leads) ? leads : (leads as any)?.leads || []).map((l: any) => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            {!isEditing && ((agentName && agentId) || (leadName && leadId)) && (
                                <div className="p-3 bg-light rounded-3 mb-0 border border-white shadow-sm">
                                    {agentName && agentId && (
                                        <p className="small mb-1 text-muted">
                                            Assigning to: <span className="fw-bold text-dark">{agentName}</span>
                                        </p>
                                    )}
                                    {leadName && leadId && (
                                        <p className="small mb-0 text-muted">
                                            Target Lead: <span className="fw-bold text-dark">{leadName}</span>
                                        </p>
                                    )}
                                </div>
                            )}

                        </div>
                        <div className="modal-footer border-0 pt-0 pb-4 justify-content-center">
                            <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={loading}>
                                {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Assign Task')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
