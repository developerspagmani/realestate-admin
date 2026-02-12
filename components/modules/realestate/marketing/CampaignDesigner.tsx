'use client';

import { useState, useEffect } from 'react';
import { marketingService, getAuthToken } from '@/app/services/api';

interface CampaignDesignerProps {
    tenantId: string;
    initialData?: any;
    onClose: () => void;
}

export default function CampaignDesigner({ tenantId, initialData, onClose }: CampaignDesignerProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data lists
    const [templates, setTemplates] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [marketingStats, setMarketingStats] = useState<any>(null);

    // Selection state
    const [campaignData, setCampaignData] = useState({
        name: initialData?.name || '',
        templateId: initialData?.templateId || '',
        groupId: initialData?.groupId || '',
        scheduledAt: initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : ''
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;
                const [tRes, gRes, sRes] = await Promise.all([
                    marketingService.getTemplates(token, { tenantId }),
                    marketingService.getAudienceGroups(token, { tenantId }),
                    marketingService.getMarketingStats(token)
                ]);
                if (tRes.success) setTemplates(tRes.data);
                if (gRes.success) setGroups(gRes.data);
                if (sRes.success) setMarketingStats(sRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        loadInitialData();
    }, [tenantId]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            let res;
            if (initialData?.id) {
                res = await marketingService.updateCampaign(token, initialData.id, { ...campaignData, tenantId });
            } else {
                res = await marketingService.createCampaign(token, { ...campaignData, tenantId });
            }

            if (res.success) {
                onClose();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="campaign-designer animate-fade-in py-2">
            {/* Header / Stepper */}
            <div className="d-flex justify-content-between align-items-center mb-5">
                <button className="btn btn-link text-muted p-0 text-decoration-none" onClick={onClose}>
                    <i className="bi bi-x-lg"></i>
                </button>
                <div className="d-flex gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`d-flex align-items-center gap-2 ${step >= i ? 'text-primary' : 'text-muted opacity-50'}`}>
                            <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all ${step === i ? 'bg-primary text-white shadow-sm scale-110' : 'border'}`} style={{ width: '28px', height: '28px', fontSize: '13px' }}>{i}</div>
                            <span className="small fw-bold">{i === 1 ? 'Details' : i === 2 ? 'Content' : 'Target'}</span>
                        </div>
                    ))}
                </div>
                <div style={{ width: '20px' }}></div>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-6">
                    {step === 1 && (
                        <div className="animate-fade-up">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="fw-bold mb-0">{initialData?.id ? 'Edit Blast Details' : 'Launch a New Blast'}</h4>
                                {marketingStats && (
                                    <div className="badge bg-white text-primary border px-3 py-2 rounded-4 fw-bold extra-small shadow-sm d-flex align-items-center gap-2">
                                        <i className="bi bi-file-earmark-check"></i>
                                        {marketingStats.totalSubmissions || 0} Submissions
                                    </div>
                                )}
                            </div>
                            <p className="text-muted small mb-4">Give your campaign a name and set a schedule (optional).</p>
                            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                                <div className="mb-3">
                                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Campaign Name</label>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-0 py-2"
                                        placeholder="e.g. Summer Property Sale 2024"
                                        value={campaignData.name}
                                        onChange={e => setCampaignData({ ...campaignData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Schedule Date (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control bg-light border-0 py-2"
                                        value={campaignData.scheduledAt}
                                        onChange={e => setCampaignData({ ...campaignData, scheduledAt: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button className="btn btn-primary w-100 rounded-4 py-3 fw-bold shadow-sm" disabled={!campaignData.name} onClick={() => setStep(2)}>
                                Choose Template <i className="bi bi-arrow-right ms-2"></i>
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-up">
                            <h4 className="fw-bold mb-3">Select Design</h4>
                            <p className="text-muted small mb-4">Choose from your pre-built templates for this blast.</p>
                            <div className="row g-3 mb-4 custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {templates.map(t => (
                                    <div key={t.id} className="col-6">
                                        <div
                                            className={`card rounded-4 border-2 p-3 cursor-pointer h-100 designer-card ${campaignData.templateId === t.id ? 'active' : 'inactive'}`}
                                            onClick={() => setCampaignData({ ...campaignData, templateId: t.id })}
                                        >
                                            <div className={`p-2 rounded-3 mb-2 d-inline-block ${campaignData.templateId === t.id ? 'bg-primary text-white' : 'bg-light text-muted'}`}>
                                                <i className="bi bi-layout-text-window fs-5"></i>
                                            </div>
                                            <h6 className="fw-bold small mb-1">{t.name}</h6>
                                            <div className="extra-small text-muted line-clamp-1">{t.subject}</div>
                                        </div>
                                    </div>
                                ))}
                                {templates.length === 0 && <div className="col-12 text-center py-5 bg-light rounded-4 border-dashed text-muted small">No templates found. Go to Templates tab to create designs first.</div>}
                            </div>
                            <div className="d-flex gap-3">
                                <button className="btn btn-light rounded-4 px-4 fw-bold" onClick={() => setStep(1)}>Back</button>
                                <button className="btn btn-primary flex-grow-1 rounded-4 fw-bold" disabled={!campaignData.templateId} onClick={() => setStep(3)}>Next: Select Audience</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-up">
                            <h4 className="fw-bold mb-3">Who receives this?</h4>
                            <p className="text-muted small mb-4">Select the audience group you want to target.</p>
                            <div className="list-group list-group-flush rounded-4 shadow-sm border-0 mb-4 overflow-hidden">
                                {groups.map(g => (
                                    <button
                                        key={g.id}
                                        type="button"
                                        className={`list-group-item list-group-item-action border-0 d-flex justify-content-between align-items-center py-3 ${campaignData.groupId === g.id ? 'bg-primary bg-opacity-10 text-primary fw-bold' : ''}`}
                                        onClick={() => setCampaignData({ ...campaignData, groupId: g.id })}
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`p-2 rounded-circle ${campaignData.groupId === g.id ? 'bg-primary text-white' : 'bg-light text-muted'}`}>
                                                <i className={`bi ${g.isDynamic ? 'bi-lightning-charge' : 'bi-people'}`}></i>
                                            </div>
                                            {g.name}
                                        </div>
                                        <span className="badge bg-light text-dark border fw-normal">{g._count?.leads || 0} Members</span>
                                    </button>
                                ))}
                                {groups.length === 0 && <div className="p-4 text-center bg-light text-muted small">No audience groups found.</div>}
                            </div>
                            <div className="d-flex gap-3">
                                <button className="btn btn-light rounded-4 px-4 fw-bold" onClick={() => setStep(2)}>Back</button>
                                <button className="btn btn-success flex-grow-1 rounded-4 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2"
                                    disabled={!campaignData.groupId || loading} onClick={handleSave}>
                                    {loading && <span className="spinner-border spinner-border-sm"></span>}
                                    {initialData?.id ? 'Update Campaign' : (campaignData.scheduledAt ? 'Schedule Campaign' : 'Launch Campaign Now')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .extra-small { font-size: 0.7rem; }
                .cursor-pointer { cursor: pointer; }
                .designer-card { transition: all 0.25s ease; border: 2px solid transparent; }
                .designer-card.inactive { background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
                .designer-card.active { border-color: var(--bs-primary); background: rgba(var(--bs-primary-rgb), 0.05); transform: translateY(-3px); }
                .designer-card:hover:not(.active) { border-color: rgba(var(--bs-primary-rgb), 0.2); }
                .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
                .scale-110 { transform: scale(1.1); }
            `}</style>
        </div>
    );
}
