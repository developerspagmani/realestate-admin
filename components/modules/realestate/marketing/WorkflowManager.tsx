'use client';

import { useState, useEffect } from 'react';
import { marketingService, agentService, getAuthToken } from '@/app/services/api';
import WorkflowEnrollmentList from './WorkflowEnrollmentList';
import Toast from '@/components/common/Toast';

interface WorkflowManagerProps {
    tenantId: string;
}

export default function WorkflowManager({ tenantId }: WorkflowManagerProps) {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [selectedWorkflowForEnrollments, setSelectedWorkflowForEnrollments] = useState<any>(null);
    const [leadForms, setLeadForms] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

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

    const loadResources = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;
            const tRes = await marketingService.getTemplates(token, { tenantId });
            if (tRes.success && Array.isArray(tRes.data)) {
                setTemplates(tRes.data);
            }

            const aRes = await agentService.getAgents(token, { tenantId });
            if (aRes.success && Array.isArray(aRes.data)) {
                setAgents([
                    { id: 'auto', name: 'Auto-Assign (Round Robin)' },
                    ...aRes.data.map((a: any) => ({ id: a.id, name: a.name || a.email || 'Unnamed Agent' }))
                ]);
            } else if (aRes.success) {
                // If success but no agents array, just keep the default
                setAgents([{ id: 'auto', name: 'Auto-Assign (Round Robin)' }]);
            }

            const fRes = await marketingService.getForms(token, { tenantId });
            if (fRes.success && Array.isArray(fRes.data)) {
                setLeadForms(fRes.data);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        loadWorkflows();
        loadResources();
    }, [tenantId]);

    const handleProcessWorkflows = async () => {
        setProcessing(true);
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await marketingService.processWorkflows(token);
            if (res.success) {
                alert('Workflow engine triggered successfully. Active enrollments have been processed.');
            }
        } catch (error) {
            console.error('Failed to process workflows:', error);
        } finally {
            setProcessing(false);
        }
    };

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

    const handleTestWorkflow = async () => {
        // Validation logic
        const validateSteps = (steps: any[]): string[] => {
            let errors: string[] = [];
            steps.forEach((step, idx) => {
                const stepNum = idx + 1;
                if (step.type === 'EMAIL' && !step.templateId) {
                    errors.push(`Step ${stepNum}: Email template is missing.`);
                }
                if (step.type === 'ASSIGN' && !step.agentId) {
                    errors.push(`Step ${stepNum}: Assignment target is missing.`);
                }
                if (step.yesSteps) errors = [...errors, ...validateSteps(step.yesSteps)];
                if (step.noSteps) errors = [...errors, ...validateSteps(step.noSteps)];
            });
            return errors;
        };

        const errors = validateSteps(currentWorkflow.steps);
        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }

        setProcessing(true);
        // Simulate a test run
        setTimeout(() => {
            setProcessing(false);
            showToast('Workflow simulation successful! All paths are valid.', 'success');
        }, 1500);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
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

    const [showTemplatesModal, setShowTemplatesModal] = useState(false);

    const PREBUILT_WORKFLOWS = [
        {
            id: 'tpl1',
            name: 'New Lead Welcome & Nurture',
            description: 'Send immediate welcome and follow up after 2 days.',
            trigger: { type: 'LEAD_CREATED', source: 'Any' },
            steps: [
                { id: `s1-${Date.now()}`, type: 'EMAIL', templateId: '', name: 'Intro Email' },
                { id: `s2-${Date.now()}`, type: 'DELAY', duration: 2, unit: 'days' },
                { id: `s3-${Date.now()}`, type: 'EMAIL', templateId: '', name: 'Follow-up Email' }
            ]
        },
        {
            id: 'tpl2',
            name: 'High-Value Lead Priority',
            description: 'Route leads with budget > $1M to senior agents immediately.',
            trigger: { type: 'LEAD_CREATED', source: 'Any' },
            steps: [
                {
                    id: `s1-${Date.now()}`,
                    type: 'CONDITION',
                    field: 'budget',
                    operator: 'greater_than',
                    value: '1000000',
                    yesSteps: [
                        { id: `s2-${Date.now()}`, type: 'ASSIGN', agentId: 'auto' },
                        { id: `s3-${Date.now()}`, type: 'TAG', action: 'add', tag: 'VIP' }
                    ],
                    noSteps: [
                        { id: `s4-${Date.now()}`, type: 'ASSIGN', agentId: 'auto' }
                    ]
                }
            ]
        },
        {
            id: 'tpl3',
            name: 'Property Inquiry Follow-up',
            description: 'Automated response for property viewing requests.',
            trigger: { type: 'FORM_SUBMITTED', source: 'Website' },
            steps: [
                { id: `s1-${Date.now()}`, type: 'EMAIL', templateId: '', name: 'Scheduling Email' },
                { id: `s2-${Date.now()}`, type: 'DELAY', duration: 24, unit: 'hours' },
                { id: `s3-${Date.now()}`, type: 'ASSIGN', agentId: 'auto' }
            ]
        },
        {
            id: 'tpl4',
            name: 'Long-term Drip Campaign',
            description: 'Stay top-of-mind with monthly check-ins.',
            trigger: { type: 'LEAD_CREATED', source: 'Any' },
            steps: [
                { id: `s1-${Date.now()}`, type: 'DELAY', duration: 7, unit: 'days' },
                { id: `s2-${Date.now()}`, type: 'EMAIL', templateId: '', name: 'Week 1 Update' },
                { id: `s3-${Date.now()}`, type: 'DELAY', duration: 30, unit: 'days' },
                { id: `s4-${Date.now()}`, type: 'EMAIL', templateId: '', name: 'Monthly Market Report' }
            ]
        },
        {
            id: 'tpl5',
            name: 'Re-engagement for Cold Leads',
            description: 'Try to revive leads that haven\'t responded in 30 days.',
            trigger: { type: 'STATUS_CHANGED', source: 'Any' },
            steps: [
                { id: `s1-${Date.now()}`, type: 'DELAY', duration: 30, unit: 'days' },
                { id: `s2-${Date.now()}`, type: 'EMAIL', templateId: '', name: 'Check-in Email' },
                {
                    id: `s3-${Date.now()}`,
                    type: 'CONDITION',
                    field: 'score',
                    operator: 'greater_than',
                    value: '50',
                    yesSteps: [
                        { id: `s4-${Date.now()}`, type: 'TAG', action: 'add', tag: 'High Interest' }
                    ],
                    noSteps: []
                }
            ]
        }
    ];

    const applyTemplate = (tpl: any) => {
        setCurrentWorkflow({
            ...tpl,
            id: undefined, // Create new
            steps: tpl.steps.map((s: any) => ({ ...s, id: `s${Math.random().toString(36).substr(2, 9)}` }))
        });
        setIsEditing(true);
        setShowTemplatesModal(false);
    };

    const addStep = (type: 'DELAY' | 'EMAIL' | 'CONDITION' | 'TAG' | 'ASSIGN', parentStepId?: string, branch?: 'yes' | 'no') => {
        const newStep: any = {
            id: `s${Math.random().toString(36).substr(2, 9)}`,
            type,
            ...(type === 'DELAY' ? { duration: 24, unit: 'hours' } : {}),
            ...(type === 'EMAIL' ? { templateId: '' } : {}),
            ...(type === 'CONDITION' ? { field: 'budget', operator: 'greater_than', value: '1000000', yesSteps: [], noSteps: [] } : {}),
            ...(type === 'TAG' ? { action: 'add', tag: 'VIP' } : {}),
            ...(type === 'ASSIGN' ? { agentId: 'auto' } : {})
        };

        if (parentStepId && branch) {
            const updateRecursive = (steps: any[]): any[] => {
                return steps.map(s => {
                    if (s.id === parentStepId) {
                        return {
                            ...s,
                            [branch === 'yes' ? 'yesSteps' : 'noSteps']: [...(s[branch === 'yes' ? 'yesSteps' : 'noSteps'] || []), newStep]
                        };
                    }
                    if (s.yesSteps || s.noSteps) {
                        return {
                            ...s,
                            yesSteps: s.yesSteps ? updateRecursive(s.yesSteps) : [],
                            noSteps: s.noSteps ? updateRecursive(s.noSteps) : []
                        };
                    }
                    return s;
                });
            };
            setCurrentWorkflow({ ...currentWorkflow, steps: updateRecursive(currentWorkflow.steps) });
        } else {
            setCurrentWorkflow({ ...currentWorkflow, steps: [...(currentWorkflow.steps || []), newStep] });
        }
    };

    const updateStep = (id: string, updates: any) => {
        const updateRecursive = (steps: any[]): any[] => {
            return steps.map(s => {
                if (s.id === id) return { ...s, ...updates };
                if (s.yesSteps || s.noSteps) {
                    return {
                        ...s,
                        yesSteps: s.yesSteps ? updateRecursive(s.yesSteps) : [],
                        noSteps: s.noSteps ? updateRecursive(s.noSteps) : []
                    };
                }
                return s;
            });
        };
        setCurrentWorkflow({ ...currentWorkflow, steps: updateRecursive(currentWorkflow.steps) });
    };

    const removeStep = (id: string) => {
        if (selectedStepId === id) setSelectedStepId(null);
        const removeRecursive = (steps: any[]): any[] => {
            return steps.filter(s => s.id !== id).map(s => {
                if (s.yesSteps || s.noSteps) {
                    return {
                        ...s,
                        yesSteps: s.yesSteps ? removeRecursive(s.yesSteps) : [],
                        noSteps: s.noSteps ? removeRecursive(s.noSteps) : []
                    };
                }
                return s;
            });
        };
        setCurrentWorkflow({ ...currentWorkflow, steps: removeRecursive(currentWorkflow.steps) });
    };

    const openCreate = () => {
        setCurrentWorkflow({
            name: '',
            description: '',
            trigger: { type: 'LEAD_CREATED', source: 'Any' },
            steps: [],
            status: 1
        });
        setIsEditing(true);
    };

    const openEdit = (wf: any) => {
        setCurrentWorkflow({
            ...wf,
            steps: typeof wf.steps === 'string' ? JSON.parse(wf.steps) : (wf.steps || [])
        });
        setIsEditing(true);
    };

    function renderStepNodes(steps: any[], isNested = false) {
        return (
            <div className={`workflow-steps-chain ${isNested ? 'nested-chain' : ''}`}>
                {(steps || []).map((step: any, index: number) => (
                    <div key={step.id} className="workflow-step-container">
                        <div
                            onClick={() => setSelectedStepId(step.id)}
                            className={`workflow-node mx-auto bg-white shadow-sm rounded-4 p-3 mb-3 position-relative cursor-pointer transition-all border-2 ${selectedStepId === step.id ? 'border-primary' : 'border-white'}`}
                            style={{ maxWidth: '400px' }}
                        >
                            <div className="d-flex align-items-center justify-content-between text-start">
                                <div className="d-flex align-items-center gap-3">
                                    <div className={`p-2 rounded-circle bg-opacity-10 ${step.type === 'DELAY' ? 'bg-warning text-white' :
                                        step.type === 'EMAIL' ? 'bg-info text-white' :
                                            step.type === 'CONDITION' ? 'bg-success text-white' :
                                                'bg-secondary text-white'
                                        }`}>
                                        <i className={`bi ${step.type === 'DELAY' ? 'bi-clock-history' :
                                            step.type === 'EMAIL' ? 'bi-envelope' :
                                                step.type === 'CONDITION' ? 'bi-shuffle' :
                                                    'bi-gear'
                                            } fs-6`}></i>
                                    </div>
                                    <div>
                                        <div className="extra-small text-muted fw-bold text-uppercase">Step: {step.type}</div>
                                        <div className="fw-bold small text-dark">
                                            {step.type === 'DELAY' ? `Wait for ${step.duration} ${step.unit}` :
                                                step.type === 'EMAIL' ? `Email: ${templates.find(t => t.id === step.templateId)?.name || 'Needs Setup'}` :
                                                    step.type === 'CONDITION' ? `IF ${step.field} ${step.operator} ${step.value}` :
                                                        step.type === 'TAG' ? `${step.action === 'add' ? 'Add' : 'Remove'} Tag: ${step.tag}` :
                                                            'Assign Team Member'}
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <i className="bi bi-sliders text-muted small"></i>
                                    <button className="btn btn-link text-danger p-0" onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}>
                                        <i className="bi bi-trash small"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {step.type === 'CONDITION' ? (
                            <div className="workflow-branches-wrapper mb-4 position-relative">
                                {/* Vertical line from parent to split point */}
                                <div className="connector-line-split mx-auto bg-primary opacity-25" style={{ width: '2px', height: '15px', marginTop: '-16px' }}></div>

                                <div className="row g-0 px-2 justify-content-center position-relative">
                                    <div className="col-6 border-end-DASHED position-relative">
                                        <div className="connector-horizontal bg-primary opacity-25" style={{ height: '2px', width: '50%', position: 'absolute', top: '0', right: '0' }}></div>
                                        <div className="branch-label yes-label text-success fw-bold extra-small mb-3 pt-3">
                                            <i className="bi bi-check-circle-fill me-1"></i> IF YES
                                        </div>
                                        {renderStepNodes(step.yesSteps || [], true)}
                                        <div className="mt-2 text-center">
                                            {renderAddButton(step.id, 'yes')}
                                        </div>
                                    </div>
                                    <div className="col-6 position-relative">
                                        <div className="connector-horizontal bg-primary opacity-25" style={{ height: '2px', width: '50%', position: 'absolute', top: '0', left: '0' }}></div>
                                        <div className="branch-label no-label text-danger fw-bold extra-small mb-3 pt-3">
                                            <i className="bi bi-x-circle-fill me-1"></i> IF NO
                                        </div>
                                        {renderStepNodes(step.noSteps || [], true)}
                                        <div className="mt-2 text-center">
                                            {renderAddButton(step.id, 'no')}
                                        </div>
                                    </div>
                                </div>
                                <div className="connector-line mx-auto bg-primary opacity-25" style={{ width: '2px', height: '30px' }}></div>
                            </div>
                        ) : (
                            index < steps.length - 1 && (
                                <div className="connector-line mx-auto bg-primary opacity-25" style={{ width: '2px', height: '30px' }}></div>
                            )
                        )}
                    </div>
                ))}
            </div>
        );
    }

    function renderAddButton(parentId?: string, branch?: 'yes' | 'no') {
        return (
            <div className="dropdown">
                <button className="btn btn-white border shadow-sm rounded-circle p-0 d-flex align-items-center justify-content-center mx-auto"
                    data-bs-toggle="dropdown" style={{ width: '32px', height: '32px' }}>
                    <i className="bi bi-plus text-primary fs-5"></i>
                </button>
                <ul className="dropdown-menu border-0 shadow-lg rounded-4 p-2">
                    <li><h6 className="dropdown-header extra-small text-uppercase fw-bold text-muted">Add Automation Step</h6></li>
                    <li><button className="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2" onClick={() => addStep('DELAY', parentId, branch)}><i className="bi bi-clock text-warning"></i> Wait Delay</button></li>
                    <li><button className="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2" onClick={() => addStep('EMAIL', parentId, branch)}><i className="bi bi-envelope text-info"></i> Send Communication</button></li>
                    <li><button className="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2" onClick={() => addStep('CONDITION', parentId, branch)}><i className="bi bi-shuffle text-success"></i> Branching Filter</button></li>
                    <li><button className="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2" onClick={() => addStep('TAG', parentId, branch)}><i className="bi bi-tag text-primary"></i> Update Tag</button></li>
                    <li><button className="dropdown-item rounded-3 small py-2 d-flex align-items-center gap-2" onClick={() => addStep('ASSIGN', parentId, branch)}><i className="bi bi-person-check text-dark"></i> Assign Agent</button></li>
                </ul>
            </div>
        );
    }

    return (
        <div className="workflow-container">
            {isEditing ? (
                <div className="workflow-editor animate-fade-in">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center">
                            <button className="btn btn-link text-decoration-none text-muted p-0 me-3" onClick={() => setIsEditing(false)}>
                                <i className="bi bi-chevron-left me-1"></i> Back
                            </button>
                            <h4 className="fw-bold mb-0">Workflow Canvas: {currentWorkflow.id ? 'Edit' : 'New'}</h4>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-info rounded-4 px-4 fw-bold d-flex align-items-center gap-2"
                                onClick={handleTestWorkflow} disabled={processing || saving}>
                                {processing ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-play-circle"></i>}
                                Test Logic
                            </button>
                            <button className="btn btn-light rounded-4 px-4 fw-bold" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button className="btn btn-primary rounded-4 px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
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
                                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Workflow Name</label>
                                    <input type="text" className="form-control bg-light border-0" placeholder="e.g. High Value Lead Nurture"
                                        value={currentWorkflow.name} onChange={e => setCurrentWorkflow({ ...currentWorkflow, name: e.target.value })} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Description</label>
                                    <textarea className="form-control bg-light border-0" rows={2} placeholder="Describe the goal..."
                                        value={currentWorkflow.description} onChange={e => setCurrentWorkflow({ ...currentWorkflow, description: e.target.value })}></textarea>
                                </div>
                                <div className="mb-0">
                                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Initial Trigger</label>
                                    <select className="form-select bg-light border-0" value={currentWorkflow.trigger?.type}
                                        onChange={e => setCurrentWorkflow({ ...currentWorkflow, trigger: { ...currentWorkflow.trigger, type: e.target.value } })}>
                                        <option value="LEAD_CREATED">New Lead Created</option>
                                        <option value="FORM_SUBMITTED">Website Form Submission</option>
                                        <option value="STATUS_CHANGED">Lead Status Changed</option>
                                        <option value="TAG_ADDED">Tag Added to Lead</option>
                                    </select>
                                </div>

                                {currentWorkflow.trigger?.type === 'FORM_SUBMITTED' && (
                                    <div className="mb-0 mt-3 animate-fade-in">
                                        <label className="form-label extra-small fw-bold text-muted text-uppercase">Target Lead Form</label>
                                        <select className="form-select bg-light border-0" value={currentWorkflow.trigger?.formId || ''}
                                            onChange={e => setCurrentWorkflow({ ...currentWorkflow, trigger: { ...currentWorkflow.trigger, formId: e.target.value } })}>
                                            <option value="">Any Form Submission</option>
                                            {leadForms.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                        <div className="extra-small text-muted mt-1 px-1">This workflow will trigger when the selected form is submitted.</div>
                                    </div>
                                )}
                            </div>

                            {selectedStepId && (
                                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white animate-fade-in border-start border-primary border-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0">Step Configuration</h6>
                                        <button className="btn btn-sm btn-light rounded-circle" onClick={() => setSelectedStepId(null)}><i className="bi bi-x"></i></button>
                                    </div>

                                    {(() => {
                                        const findRecursive = (steps: any[]): any => {
                                            for (const s of steps) {
                                                if (s.id === selectedStepId) return s;
                                                if (s.yesSteps) { const found = findRecursive(s.yesSteps); if (found) return found; }
                                                if (s.noSteps) { const found = findRecursive(s.noSteps); if (found) return found; }
                                            }
                                            return null;
                                        };
                                        const step = findRecursive(currentWorkflow.steps);
                                        if (!step) return null;

                                        return (
                                            <div className="step-options">
                                                {step.type === 'DELAY' && (
                                                    <div className="row g-2">
                                                        <div className="col-8">
                                                            <label className="extra-small text-muted mb-1">Duration</label>
                                                            <input type="number" className="form-control form-control-sm border-0 bg-light" value={step.duration} onChange={e => updateStep(step.id, { duration: parseInt(e.target.value) })} />
                                                        </div>
                                                        <div className="col-4">
                                                            <label className="extra-small text-muted mb-1">Unit</label>
                                                            <select className="form-select form-select-sm border-0 bg-light" value={step.unit} onChange={e => updateStep(step.id, { unit: e.target.value })}>
                                                                <option value="minutes">Mins</option>
                                                                <option value="hours">Hours</option>
                                                                <option value="days">Days</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {step.type === 'EMAIL' && (
                                                    <div className="mb-0">
                                                        <label className="extra-small text-muted mb-1">Select Email Template</label>
                                                        <select className="form-select form-select-sm border-0 bg-light mb-2" value={step.templateId} onChange={e => updateStep(step.id, { templateId: e.target.value })}>
                                                            <option value="">Choose a template...</option>
                                                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                        </select>
                                                        <div className="extra-small text-primary"><i className="bi bi-info-circle me-1"></i> Personalized tags will be auto-filled.</div>
                                                    </div>
                                                )}

                                                {step.type === 'CONDITION' && (
                                                    <div className="mb-0 text-start">
                                                        <label className="extra-small text-muted mb-1">Field to evaluate</label>
                                                        <select className="form-select form-select-sm border-0 bg-light mb-2" value={step.field} onChange={e => updateStep(step.id, { field: e.target.value })}>
                                                            <option value="budget">Lead Budget</option>
                                                            <option value="type">Property Type</option>
                                                            <option value="source">Lead Source</option>
                                                            <option value="score">Lead Score</option>
                                                        </select>
                                                        <div className="row g-2">
                                                            <div className="col-6">
                                                                <select className="form-select form-select-sm border-0 bg-light" value={step.operator} onChange={e => updateStep(step.id, { operator: e.target.value })}>
                                                                    <option value="equals">Equals</option>
                                                                    <option value="greater_than">Greater Than</option>
                                                                    <option value="contains">Contains</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-6">
                                                                <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="Value..." value={step.value} onChange={e => updateStep(step.id, { value: e.target.value })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {step.type === 'TAG' && (
                                                    <div className="mb-0 text-start">
                                                        <label className="extra-small text-muted mb-1">Tag Operation</label>
                                                        <div className="btn-group btn-group-sm w-100 mb-2 shadow-none">
                                                            <button className={`btn ${step.action === 'add' ? 'btn-primary' : 'btn-light border'} extra-small`} onClick={() => updateStep(step.id, { action: 'add' })}>Add</button>
                                                            <button className={`btn ${step.action === 'remove' ? 'btn-danger' : 'btn-light border'} extra-small`} onClick={() => updateStep(step.id, { action: 'remove' })}>Remove</button>
                                                        </div>
                                                        <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="Enter tag name..." value={step.tag} onChange={e => updateStep(step.id, { tag: e.target.value })} />
                                                    </div>
                                                )}

                                                {step.type === 'ASSIGN' && (
                                                    <div className="mb-0 text-start">
                                                        <label className="extra-small text-muted mb-1">Assign To Owner/Agent</label>
                                                        <select className="form-select form-select-sm border-0 bg-light" value={step.agentId} onChange={e => updateStep(step.id, { agentId: e.target.value })}>
                                                            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark text-white">
                                <h6 className="fw-bold mb-2 small text-white"><i className="bi bi-lightbulb me-2"></i>Automation Logic</h6>
                                <p className="extra-small opacity-75 mb-0">
                                    Select any step on the canvas to configure the specific logic, such as wait times or email templates.
                                </p>
                            </div>
                        </div>

                        <div className="col-lg-8">
                            <div className="canvas-area bg-light rounded-4 p-4 border border-dashed text-center mb-4" style={{ minHeight: '500px' }}>
                                <div className="workflow-node-trigger mx-auto bg-white shadow-sm rounded-4 px-3 py-2 border-start border-primary border-4 mb-3" style={{ maxWidth: '400px' }}>
                                    <div className="d-flex align-items-center gap-3 text-start">
                                        <div className="bg-primary bg-opacity-10 text-white px-2 py-1 rounded-circle">
                                            <i className="bi bi-play-fill fs-5"></i>
                                        </div>
                                        <div>
                                            <div className="extra-small text-muted fw-bold text-uppercase">Trigger</div>
                                            <div className="fw-bold small">{currentWorkflow.trigger?.type?.replace('_', ' ')}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="connector-line mx-auto bg-primary opacity-25" style={{ width: '2px', height: '30px' }}></div>

                                {renderStepNodes(currentWorkflow.steps)}

                                <div className="connector-line mx-auto bg-primary opacity-25" style={{ width: '2px', height: '30px' }}></div>
                                {renderAddButton()}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="workflow-list">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold mb-0">Automated Marketing Flows</h5>
                        <div className="d-flex gap-2">
                            <button className="btn btn-light btn-sm rounded-4 px-3 fw-bold border" onClick={handleProcessWorkflows} disabled={processing}>
                                <i className={`bi ${processing ? 'spinner-border spinner-border-sm' : 'bi-cpu'} me-1`}></i>
                                {processing ? 'Processing...' : 'Run Engine Now'}
                            </button>
                            <button className="btn btn-outline-primary btn-sm rounded-4 px-3 fw-bold" onClick={() => setShowTemplatesModal(true)}>
                                <i className="bi bi-layers me-1"></i> Use Template
                            </button>
                            <button className="btn btn-primary btn-sm rounded-4 px-3 fw-bold shadow-sm" onClick={openCreate}>
                                <i className="bi bi-magic me-1"></i> Create Workflow
                            </button>
                        </div>
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
                                <button className="btn btn-outline-primary rounded-4 px-4 mt-3 fw-bold" onClick={openCreate}>Get Started</button>
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
                                                <span className="badge bg-light text-dark extra-small border rounded-4 px-2 py-1">
                                                    <i className="bi bi-lightning-fill text-warning me-1"></i>
                                                    {wf.trigger?.type?.split('_')[0]}
                                                </span>
                                                <span className="badge bg-light text-dark extra-small border rounded-4 px-2 py-1 ms-1">
                                                    <i className="bi bi-list-check text-primary me-1"></i>
                                                    {Array.isArray(wf.steps) ? wf.steps.length : (wf.steps ? JSON.parse(wf.steps).length : 0)} Steps
                                                </span>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-link btn-sm text-primary text-decoration-none fw-bold p-0 extra-small" onClick={() => setSelectedWorkflowForEnrollments(wf)}>
                                                    <i className="bi bi-people me-1"></i> Active Leads
                                                </button>
                                                <button className="btn btn-link btn-sm text-primary text-decoration-none fw-bold p-0 extra-small" onClick={() => openEdit(wf)}>
                                                    Open Canvas <i className="bi bi-arrow-right-short"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedWorkflowForEnrollments && (
                <WorkflowEnrollmentList
                    workflowId={selectedWorkflowForEnrollments.id}
                    workflowName={selectedWorkflowForEnrollments.name}
                    onClose={() => setSelectedWorkflowForEnrollments(null)}
                />
            )}

            {showTemplatesModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 animation-scale-in">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="fw-bold mb-0">Workflow Templates</h5>
                                <button type="button" className="btn-close" onClick={() => setShowTemplatesModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="text-muted small mb-4">Choose a pre-built automation to get started instantly. You can customize the steps after selection.</p>
                                <div className="row g-3">
                                    {PREBUILT_WORKFLOWS.map(tpl => (
                                        <div key={tpl.id} className="col-12">
                                            <div className="card border p-3 rounded-4 cursor-pointer hover-bg-light transition-all hvr-grow" onClick={() => applyTemplate(tpl)}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="fw-bold mb-1 text-primary">{tpl.name}</h6>
                                                        <p className="extra-small text-muted mb-0">{tpl.description}</p>
                                                    </div>
                                                    <i className="bi bi-chevron-right text-muted"></i>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button className="btn btn-light rounded-4 px-4 fw-bold" onClick={() => setShowTemplatesModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

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
                .border-end-dashed { border-right: 1px dashed rgba(var(--bs-primary-rgb), 0.15); }
            `}</style>
        </div>
    );
}
