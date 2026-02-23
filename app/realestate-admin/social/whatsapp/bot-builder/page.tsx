'use client';

import { useEffect, useState } from 'react';
import { whatsappApi } from '@/lib/api/social';
import MainLayout from '@/components/MainLayout';
import ModuleGuard from '@/components/common/ModuleGuard';
import { useRouter } from 'next/navigation';
import Toast from '@/components/common/Toast';

export default function WhatsAppBotBuilderPage() {
    return (
        <ModuleGuard moduleSlug="social_whatsapp">
            <BotBuilderContent />
        </ModuleGuard>
    );
}

interface BotStep {
    id: string;
    type: 'question' | 'message' | 'action';
    content: string;
    actionType?: string;
    buttons: {
        id: string;
        label: string;
        nextStepId: string;
        fieldToSave?: string;
        valueToSave?: any;
    }[];
}

function BotBuilderContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<{
        id?: string;
        isActive: boolean;
        steps: BotStep[];
        startStepId: string;
    }>({
        isActive: true,
        steps: [],
        startStepId: ''
    });

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            // We need to add getBotConfig to whatsappApi in social.ts
            const res = await (whatsappApi as any).getBotConfig();
            if (res.success) {
                setConfig(res.data);
            }
        } catch (error) {
            console.error('Error loading bot config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const res = await (whatsappApi as any).updateBotConfig(config);
            if (res.success) {
                showToast('Chatbot configuration saved!', 'success');
            }
        } catch (error) {
            showToast('Failed to save configuration', 'error');
        }
    };

    const addStep = () => {
        const newId = `step_${Date.now()}`;
        const newStep: BotStep = {
            id: newId,
            type: 'question',
            content: 'New Step Question',
            buttons: []
        };
        setConfig({ ...config, steps: [...config.steps, newStep] });
    };

    const updateStep = (id: string, updates: Partial<BotStep>) => {
        setConfig({
            ...config,
            steps: config.steps.map(s => s.id === id ? { ...s, ...updates } : s)
        });
    };

    const removeStep = (id: string) => {
        setConfig({
            ...config,
            steps: config.steps.filter(s => s.id !== id)
        });
    };

    const addButton = (stepId: string) => {
        const step = config.steps.find(s => s.id === stepId);
        if (!step) return;

        const newButton = {
            id: `btn_${Date.now()}`,
            label: 'New Button',
            nextStepId: ''
        };

        updateStep(stepId, { buttons: [...step.buttons, newButton] });
    };

    return (
        <MainLayout activePage="social-whatsapp">
            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <button onClick={() => router.back()} className="btn btn-link text-decoration-none p-0 mb-2 text-muted small">
                            <i className="bi bi-arrow-left me-1"></i> Back to WhatsApp
                        </button>
                        <h1 className="fw-bold h3 mb-1">WhatsApp Chatbot Funnel</h1>
                        <p className="text-muted small mb-0">Design your automated conversation flow</p>
                    </div>
                    <div className="d-flex gap-2">
                        <div className="form-check form-switch bg-white p-2 px-3 rounded-pill shadow-sm border d-flex align-items-center gap-2">
                            <input
                                className="form-check-input ms-0"
                                type="checkbox"
                                checked={config.isActive}
                                onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                            />
                            <label className="form-check-label fw-bold small text-muted">Bot Active</label>
                        </div>
                        <button className="btn btn-success rounded-pill px-4" onClick={handleSave}>
                            <i className="bi bi-cloud-check me-2"></i> Save Funnel
                        </button>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4 mb-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '20px' }}>
                            <h5 className="fw-bold mb-3">Funnel Overview</h5>
                            <div className="list-group list-group-flush small">
                                {config.steps.map((step, idx) => (
                                    <div key={step.id} className={`list-group-item bg-transparent border-0 px-0 d-flex align-items-center gap-2 ${config.startStepId === step.id ? 'text-success fw-bold' : 'text-muted'}`}>
                                        <span className="badge bg-light text-dark rounded-circle" style={{ width: '20px' }}>{idx + 1}</span>
                                        <span className="text-truncate" style={{ maxWidth: '150px' }}>{step.id}</span>
                                        {config.startStepId === step.id && <i className="bi bi-play-circle-fill ms-auto"></i>}
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-outline-success btn-sm mt-4 rounded-pill w-100" onClick={addStep}>
                                <i className="bi bi-plus-lg me-1"></i> Add New Step
                            </button>
                        </div>
                    </div>

                    <div className="col-md-8">
                        {config.steps.length === 0 ? (
                            <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-dashed">
                                <i className="bi bi-robot fs-1 text-muted opacity-25"></i>
                                <h5 className="mt-3 text-muted">No steps defined yet</h5>
                                <button className="btn btn-success btn-sm mt-2 rounded-pill" onClick={addStep}>Initialize Bot</button>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-4">
                                {config.steps.map((step, idx) => (
                                    <div key={step.id} className={`card border-0 shadow-sm rounded-4 overflow-hidden ${config.startStepId === step.id ? 'border-start border-4 border-success' : ''}`}>
                                        <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>{idx + 1}</div>
                                                <div>
                                                    <h6 className="fw-bold mb-0">Step ID: <span className="text-muted">{step.id}</span></h6>
                                                    <div className="d-flex gap-2 mt-1">
                                                        <span className="badge bg-light text-dark border extra-small">{step.type.toUpperCase()}</span>
                                                        {config.startStepId === step.id && <span className="badge bg-success extra-small">STARTING STEP</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="dropdown">
                                                <button className="btn btn-light btn-sm rounded-circle" data-bs-toggle="dropdown"><i className="bi bi-three-dots-vertical"></i></button>
                                                <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-3 p-2">
                                                    <li><button className="dropdown-item rounded-2 small" onClick={() => setConfig({ ...config, startStepId: step.id })}>Set as Start</button></li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li><button className="dropdown-item rounded-2 small text-danger" onClick={() => removeStep(step.id)}>Delete Step</button></li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="card-body p-4 pt-0">
                                            <div className="mb-3">
                                                <label className="form-label extra-small fw-bold text-muted text-uppercase">Bot Content / Question</label>
                                                <textarea
                                                    className="form-control bg-light border-0 rounded-3 p-3 small"
                                                    rows={2}
                                                    value={step.content}
                                                    onChange={(e) => updateStep(step.id, { content: e.target.value })}
                                                    placeholder="Enter what the bot should say..."
                                                ></textarea>
                                            </div>

                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Step Type</label>
                                                    <select
                                                        className="form-select bg-light border-0 rounded-3 small"
                                                        value={step.type}
                                                        onChange={(e) => updateStep(step.id, { type: e.target.value as any })}
                                                    >
                                                        <option value="question">Question (with buttons)</option>
                                                        <option value="message">Info Message</option>
                                                        <option value="action">System Action</option>
                                                    </select>
                                                </div>
                                                {step.type === 'action' && (
                                                    <div className="col-md-6">
                                                        <label className="form-label extra-small fw-bold text-muted text-uppercase">Action Type</label>
                                                        <select
                                                            className="form-select bg-light border-0 rounded-3 small"
                                                            value={step.actionType}
                                                            onChange={(e) => updateStep(step.id, { actionType: e.target.value })}
                                                        >
                                                            <option value="SEARCH_PROPERTIES">Search & Show Properties</option>
                                                            <option value="HANDOFF">Handoff to Agent</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            {step.type !== 'action' && (
                                                <div className="mt-4">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <label className="form-label extra-small fw-bold text-muted text-uppercase mb-0">Interactive Buttons</label>
                                                        <button className="btn btn-link btn-sm text-success text-decoration-none p-0 fw-bold extra-small" onClick={() => addButton(step.id)}>+ Add Button</button>
                                                    </div>
                                                    <div className="d-flex flex-column gap-2">
                                                        {step.buttons.map((btn, bIdx) => (
                                                            <div key={btn.id} className="p-3 bg-light rounded-3 d-flex flex-wrap gap-2 align-items-center">
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm border-0 fw-bold"
                                                                    style={{ width: '150px' }}
                                                                    value={btn.label}
                                                                    onChange={(e) => {
                                                                        const newBtns = [...step.buttons];
                                                                        newBtns[bIdx].label = e.target.value;
                                                                        updateStep(step.id, { buttons: newBtns });
                                                                    }}
                                                                />
                                                                <i className="bi bi-arrow-right text-muted mx-2"></i>
                                                                <select
                                                                    className="form-select form-select-sm border-0 bg-white"
                                                                    style={{ width: '150px' }}
                                                                    value={btn.nextStepId}
                                                                    onChange={(e) => {
                                                                        const newBtns = [...step.buttons];
                                                                        newBtns[bIdx].nextStepId = e.target.value;
                                                                        updateStep(step.id, { buttons: newBtns });
                                                                    }}
                                                                >
                                                                    <option value="">End Chat</option>
                                                                    {config.steps.filter(s => s.id !== step.id).map(s => (
                                                                        <option key={s.id} value={s.id}>{s.id}</option>
                                                                    ))}
                                                                </select>
                                                                <select
                                                                    className="form-select form-select-sm border-0 bg-white ms-auto"
                                                                    style={{ width: '120px' }}
                                                                    value={btn.fieldToSave || ''}
                                                                    onChange={(e) => {
                                                                        const newBtns = [...step.buttons];
                                                                        newBtns[bIdx].fieldToSave = e.target.value;
                                                                        updateStep(step.id, { buttons: newBtns });
                                                                    }}
                                                                >
                                                                    <option value="">No Save</option>
                                                                    <option value="location">Save Location</option>
                                                                    <option value="maxPrice">Save Budget</option>
                                                                    <option value="propertyType">Save Property Type</option>
                                                                </select>
                                                                <button
                                                                    className="btn btn-link btn-sm text-danger p-0"
                                                                    onClick={() => {
                                                                        const newBtns = step.buttons.filter((_, i) => i !== bIdx);
                                                                        updateStep(step.id, { buttons: newBtns });
                                                                    }}
                                                                >
                                                                    <i className="bi bi-x-circle-fill"></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
            `}</style>
        </MainLayout>
    );
}
