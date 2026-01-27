'use client';

import { useState, useEffect } from 'react';
import { marketingService, getAuthToken } from '@/app/services/api';

interface WorkflowManagerProps {
    tenantId: string;
}

export default function WorkflowManager({ tenantId }: WorkflowManagerProps) {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [currentWorkflow, setCurrentWorkflow] = useState<any>({
        name: '',
        description: '',
        trigger: { type: 'LEAD_CREATED', source: 'Any' },
        steps: [
            { id: 's1', type: 'DELAY', duration: 24, unit: 'hours' },
            { id: 's2', type: 'EMAIL', templateId: '' }
        ],
        status: 1
    });

    const loadWorkflows = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.getWorkflows(token, { tenantId });
            if (res.success) setWorkflows(res.data);
        } catch (error) {
            console.error('Failed to load workflows:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWorkflows();
    }, [tenantId]);

    const handleSave = async () => {
        if (!currentWorkflow.name) return;
        setSaving(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            let res;
            if (currentWorkflow.id) {
                res = await marketingService.updateWorkflow(token, currentWorkflow.id, {
                    ...currentWorkflow,
                    tenantId
                });
            } else {
                res = await marketingService.createWorkflow(token, {
                    ...currentWorkflow,
                    tenantId
                });
            }

            if (res.success) {
                setIsEditing(false);
                loadWorkflows();
            }
        } catch (error) {
            console.error('Failed to save workflow:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete workflow "${name}"?`)) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.deleteWorkflow(token, id);
            if (res.success) loadWorkflows();
        } catch (error) {
            console.error('Failed to delete workflow:', error);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.toggleWorkflow(token, id);
            if (res.success) loadWorkflows();
        } catch (error) {
            console.error('Failed to toggle workflow:', error);
        }
    };

    const addStep = (type: 'DELAY' | 'EMAIL' | 'CONDITION' | 'TAG' | 'ASSIGN') => {
        const newStep = {
            id: `s${Date.now()}`,
            type,
            ...(type === 'DELAY' ? { duration: 24, unit: 'hours' } : {}),
            ...(type === 'EMAIL' ? { templateId: '' } : {}),
            ...(type === 'CONDITION' ? { field: 'budget', operator: 'greater_than', value: '1000000' } : {}),
            ...(type === 'TAG' ? { action: 'add', tag: 'VIP' } : {}),
            ...(type === 'ASSIGN' ? { agentId: 'auto' } : {})
        };
        setCurrentWorkflow({ ...currentWorkflow, steps: [...currentWorkflow.steps, newStep] });
    };

    const removeStep = (id: string) => {
        setCurrentWorkflow({ ...currentWorkflow, steps: currentWorkflow.steps.filter((s: any) => s.id !== id) });
    };

    const openCreate = () => {
        setCurrentWorkflow({
            name: '',
            description: '',
            trigger: { type: 'LEAD_CREATED', source: 'Any' },
            steps: [
                { id: 's1', type: 'DELAY', duration: 24, unit: 'hours' },
                { id: 's2', type: 'EMAIL', templateId: '' }
            ],
            status: 1
        });
        setIsEditing(true);
    };

    const openEdit = (wf: any) => {
        setCurrentWorkflow({
            ...wf,
            steps: Array.isArray(wf.steps) ? wf.steps : (typeof wf.steps === 'string' ? JSON.parse(wf.steps) : [])
        });
        setIsEditing(true);
    };

    if (isEditing) {
        return (
            <div className="workflow-editor animate-fade-in">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                        <button className="btn btn-link text-decoration-none text-muted p-0 me-3" onClick={() => setIsEditing(false)}>
                            <i className="bi bi-chevron-left me-1"></i> Back
                        </button>
                        <h4 className="fw-bold mb-0">Workflow Canvas: {currentWorkflow.id ? 'Edit' : 'New'}</h4>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setIsEditing(false)}>Cancel</button>
                        <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                            onClick={handleSave} disabled={saving || !currentWorkflow.name}>
                            {saving && <span className="spinner-border spinner-border-sm"></span>}
                            <i className="bi bi-cloud-check"></i> {currentWorkflow.id ? 'Update Workflow' : 'Activate Workflow'}
                        </button>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                            <h6 className="fw-bold mb-3">Workflow Details</h6>
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted text-uppercase">Workflow Name</label>
                                <input type="text" className="form-control bg-light border-0" placeholder="e.g. High Value Lead Nurture"
                                    value={currentWorkflow.name} onChange={e => setCurrentWorkflow({ ...currentWorkflow, name: e.target.value })} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted text-uppercase">Description</label>
                                <textarea className="form-control bg-light border-0" rows={3} placeholder="Describe the goal of this automation..."
                                    value={currentWorkflow.description} onChange={e => setCurrentWorkflow({ ...currentWorkflow, description: e.target.value })}></textarea>
                            </div>
                            <div className="mb-0">
                                <label className="form-label small fw-bold text-muted text-uppercase">Initial Trigger</label>
                                <select className="form-select bg-light border-0" value={currentWorkflow.trigger?.type}
                                    onChange={e => setCurrentWorkflow({ ...currentWorkflow, trigger: { ...currentWorkflow.trigger, type: e.target.value } })}>
                                    <option value="LEAD_CREATED">New Lead Created</option>
                                    <option value="FORM_SUBMITTED">Website Form Submission</option>
                                    <option value="STATUS_CHANGED">Lead Status Changed</option>
                                    <option value="TAG_ADDED">Tag Added to Lead</option>
                                </select>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white">
                            <h6 className="fw-bold mb-2"><i className="bi bi-stars me-2"></i>Advanced Tips</h6>
                            <p className="extra-small opacity-75 mb-0">
                                Workflows run automatically in the background. Use "Delay" steps to avoid overwhelming leads with instant messages. Branching logic allows you to send different content based on budget or interest.
                            </p>
                        </div>
                    </div>

                    <div className="col-lg-8">
                        {/* canvas visualization */}
                        <div className="canvas-area bg-light rounded-4 p-4 border border-dashed text-center mb-4" style={{ minHeight: '500px' }}>
                            {/* Trigger Start Node */}
                            <div className="workflow-node-trigger mx-auto bg-white shadow-sm rounded-4 p-3 border-start border-primary border-4 mb-3" style={{ maxWidth: '400px' }}>
                                <div className="d-flex align-items-center gap-3 text-start">
                                    <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
                                        <i className="bi bi-play-fill fs-5"></i>
                                    </div>
                                    <div>
                                        <div className="extra-small text-muted fw-bold text-uppercase">Trigger</div>
                                        <div className="fw-bold small">{currentWorkflow.trigger?.type.replace('_', ' ')}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="connector-line mx-auto bg-primary opacity-25" style={{ width: '2px', height: '30px' }}></div>

                            {/* Sequential Steps */}
                            {currentWorkflow.steps.map((step: any, index: number) => (
                                <div key={step.id}>
                                    <div className="workflow-node mx-auto bg-white shadow-sm rounded-4 p-3 mb-3 position-relative" style={{ maxWidth: '400px' }}>
                                        <div className="d-flex align-items-center justify-content-between text-start">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className={`p-2 rounded-circle bg-opacity-10 ${step.type === 'DELAY' ? 'bg-warning text-warning' :
                                                        step.type === 'EMAIL' ? 'bg-info text-info' :
                                                            step.type === 'CONDITION' ? 'bg-success text-success' :
                                                                'bg-secondary text-secondary'
                                                    }`}>
                                                    <i className={`bi ${step.type === 'DELAY' ? 'bi-clock-history' :
                                                            step.type === 'EMAIL' ? 'bi-envelope' :
                                                                step.type === 'CONDITION' ? 'bi-shuffle' :
                                                                    'bi-gear'
                                                        } fs-6`}></i>
                                                </div>
                                                <div>
                                                    <div className="extra-small text-muted fw-bold text-uppercase">Step {index + 1}: {step.type}</div>
                                                    <div className="fw-bold small">
                                                        {step.type === 'DELAY' ? `Wait for ${step.duration} ${step.unit}` :
                                                            step.type === 'EMAIL' ? 'Send Personalized Email' :
                                                                step.type === 'CONDITION' ? `IF ${step.field} ${step.operator} ${step.value}` :
                                                                    step.type === 'TAG' ? `${step.action === 'add' ? 'Add' : 'Remove'} Tag: ${step.tag}` :
                                                                        'Assign Team Member'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="btn btn-link text-danger p-0" onClick={() => removeStep(step.id)}>
                                                <i className="bi bi-x-circle"></i>
                                            </button>
                                        </div>
                                    </div>
                                    {index < currentWorkflow.steps.length - 1 && (
                                        <div className="connector-line mx-auto bg-primary opacity-25" style={{ width: '2px', height: '30px' }}></div>
                                    )}
                                </div>
                            ))}

                            {/* Add Node Dropdown */}
                            <div className="connector-line mx-auto bg-primary opacity-25" style={{ width: '2px', height: '30px' }}></div>
                            <div className="dropdown">
                                <button className="btn btn-white border shadow-sm rounded-circle p-0 d-flex align-items-center justify-content-center mx-auto"
                                    data-bs-toggle="dropdown" style={{ width: '40px', height: '40px' }}>
                                    <i className="bi bi-plus text-primary fs-4"></i>
                                </button>
                                <ul className="dropdown-menu border-0 shadow-lg rounded-4 p-2">
                                    <li><button className="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2" onClick={() => addStep('DELAY')}><i className="bi bi-clock text-warning"></i> Wait Delay</button></li>
                                    <li><button className="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2" onClick={() => addStep('EMAIL')}><i className="bi bi-envelope text-info"></i> Send Communication</button></li>
                                    <li><button className="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2" onClick={() => addStep('CONDITION')}><i className="bi bi-shuffle text-success"></i> Branching Filter</button></li>
                                    <li><button className="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2" onClick={() => addStep('TAG')}><i className="bi bi-tag text-primary"></i> Update Tag</button></li>
                                    <li><button className="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2" onClick={() => addStep('ASSIGN')}><i className="bi bi-person-check text-dark"></i> Assign Agent</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="workflow-list">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Automated Marketing Flows</h5>
                <button className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm" onClick={openCreate}>
                    <i className="bi bi-magic me-1"></i> Create Workflow
                </button>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></div>
            ) : workflows.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-light bg-opacity-50 border-dashed">
                    <div className="py-4">
                        <i className="bi bi-bezier2 display-1 text-primary opacity-25 mb-4 d-block"></i>
                        <h5 className="fw-bold mb-2">Build Your First Automation</h5>
                        <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
                            Convert more leads by sending automated follow-ups, assigning agents, and tracking interest levels without lifting a finger.
                        </p>
                        <button className="btn btn-outline-primary rounded-pill px-4 mt-3 fw-bold" onClick={openCreate}>Get Started</button>
                    </div>
                </div>
            ) : (
                <div className="row g-4">
                    {workflows.map(wf => (
                        <div key={wf.id} className="col-md-6">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 transition-all workflow-list-card">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className={`p-3 rounded-4 ${wf.status === 1 ? 'bg-success text-success' : 'bg-light text-muted'} bg-opacity-10`}>
                                        <i className={`bi ${wf.status === 1 ? 'bi-activity' : 'bi-pause-fill'} fs-4`}></i>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="form-check form-switch m-0 me-2">
                                            <input className="form-check-input" type="checkbox" checked={wf.status === 1} onChange={() => handleToggle(wf.id)} />
                                        </div>
                                        <div className="dropdown">
                                            <button className="btn btn-link btn-sm p-0 text-muted" data-bs-toggle="dropdown"><i className="bi bi-three-dots-vertical"></i></button>
                                            <ul className="dropdown-menu dropdown-menu-end border-0 shadow rounded-3">
                                                <li><button className="dropdown-item small d-flex align-items-center gap-2" onClick={() => openEdit(wf)}><i className="bi bi-pencil"></i> Edit Canvas</button></li>
                                                <li><hr className="dropdown-divider" /></li>
                                                <li><button className="dropdown-item small text-danger d-flex align-items-center gap-2" onClick={() => handleDelete(wf.id, wf.name)}><i className="bi bi-trash"></i> Delete Workflow</button></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <h6 className="fw-bold mb-1">{wf.name}</h6>
                                <p className="text-muted extra-small mb-4 line-clamp-2">{wf.description || 'No description provided.'}</p>

                                <div className="mt-auto pt-3 border-top border-light d-flex justify-content-between align-items-center">
                                    <div className="d-flex -space-x-1">
                                        <span className="badge bg-light text-dark extra-small border rounded-pill px-2 py-1">
                                            <i className="bi bi-lightning-fill text-warning me-1"></i>
                                            {wf.trigger?.type?.split('_')[0]}
                                        </span>
                                        <span className="badge bg-light text-dark extra-small border rounded-pill px-2 py-1 ms-1">
                                            <i className="bi bi-list-check text-primary me-1"></i>
                                            {Array.isArray(wf.steps) ? wf.steps.length : (wf.steps ? JSON.parse(wf.steps).length : 0)} Steps
                                        </span>
                                    </div>
                                    <button className="btn btn-link btn-sm text-primary text-decoration-none fw-bold p-0 extra-small" onClick={() => openEdit(wf)}>
                                        Open Canvas <i className="bi bi-arrow-right-short"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .extra-small { font-size: 0.72rem; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .workflow-list-card { border: 1px solid rgba(0,0,0,0.05); }
                .workflow-list-card:hover { transform: translateY(-4px); border-color: rgba(var(--bs-primary-rgb), 0.2); box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important; }
                .hvr-grow { transition: all 0.2s; }
                .hvr-grow:hover { transform: scale(1.02); }
                .-space-x-2 > * { margin-left: -8px; }
                .-space-x-2 > *:first-child { margin-left: 0; }
                .canvas-area {
                   background-image: radial-gradient(#6c757d22 1px, transparent 1px);
                   background-size: 20px 20px;
                }
            `}</style>
        </div>
    );
}
