'use client';

import { useState, useEffect } from 'react';
import { analyzeLeadBehavior, QualificationResult } from './behavioralReasoner';
import { Lead } from './LeadsManager';
import Loader from '@/components/common/Loader';
import MainLayout from '@/components/MainLayout';
import { useManagementContext } from '@/app/contexts/ManagementContext';

interface LeadQualificationHubProps {
    leads: Lead[];
    loading: boolean;
    onViewInsights: (lead: Lead) => void;
}

export default function LeadQualificationHub({ leads, loading, onViewInsights }: LeadQualificationHubProps) {
    const { currencySymbol } = useManagementContext();
    const [qualifiedLeads, setQualifiedLeads] = useState<{
        sqls: (Lead & { qualification: QualificationResult })[];
        mqls: (Lead & { qualification: QualificationResult })[];
    }>({ sqls: [], mqls: [] });

    useEffect(() => {
        const processed = leads.map(lead => ({
            ...lead,
            qualification: analyzeLeadBehavior(lead)
        }));

        setQualifiedLeads({
            sqls: processed.filter(l => l.qualification.status === 'SQL') as any,
            mqls: processed.filter(l => l.qualification.status === 'MQL') as any
        });
    }, [leads]);

    const renderLeadCard = (lead: Lead & { qualification: QualificationResult }, type: 'SQL' | 'MQL') => (
        <div 
            key={lead.id}
            className="card border-0 mb-3 shadow-sm rounded-4 overflow-hidden lead-qual-card position-relative"
            onClick={() => onViewInsights(lead)}
            style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: type === 'SQL' ? 'linear-gradient(145deg, #ffffff, #fffdf8)' : '#ffffff'
            }}
        >
            {/* Qualification Aura */}
            <div className="position-absolute" style={{
                top: '-20px',
                left: '-20px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: lead.qualification.auraColor,
                filter: 'blur(30px)',
                zIndex: 0,
                opacity: 0.6
            }}></div>

            <div className="card-body p-3 position-relative" style={{ zIndex: 1 }}>
                {lead.qualification.vibe === 'VIP' && (
                    <div className="position-absolute top-0 end-0 m-2">
                        <span className="badge bg-warning text-dark border-0 shadow-sm px-2 animate-pulse" style={{ fontSize: '0.6rem' }}>
                            <i className="bi bi-crown-fill me-1"></i> VIP LEAD
                        </span>
                    </div>
                )}
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-3">
                        <div 
                            className="avatar-circle shadow-sm d-flex align-items-center justify-content-center fw-bold text-white position-relative"
                            style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '12px',
                                background: type === 'SQL' ? 'linear-gradient(45deg, #ff4757, #ff6b81)' : 'linear-gradient(45deg, #2ed573, #7bed9f)'
                            }}
                        >
                            {lead.name.charAt(0)}
                            {lead.qualification.badges.includes('High Momentum') && (
                                <span className="position-absolute bottom-0 start-100 translate-middle badge rounded-circle bg-warning p-1 border border-white">
                                    <i className="bi bi-lightning-fill text-white" style={{ fontSize: '0.5rem' }}></i>
                                </span>
                            )}
                        </div>
                        <div>
                            <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                                {lead.name}
                                {lead.qualification.status === 'SQL' && <i className="bi bi-patch-check-fill text-primary" style={{ fontSize: '0.8rem' }}></i>}
                            </h6>
                            <p className="extra-small text-muted mb-0">{lead.company || 'Private Lead'}</p>
                        </div>
                    </div>
                    <div className="text-end me-4">
                        <div className={`fw-bold small ${type === 'SQL' ? 'text-danger' : 'text-success'}`}>
                            {lead.leadScore}% V-Score
                        </div>
                        <div className="progress mt-1" style={{ height: '3px', width: '50px' }}>
                            <div 
                                className={`progress-bar ${type === 'SQL' ? 'bg-danger' : 'bg-success'}`} 
                                style={{ width: `${lead.leadScore}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mb-3">
                    {lead.qualification.badges.map(badge => (
                        <span key={badge} className={`badge rounded-pill extra-small-badge ${
                            badge === 'High Momentum' ? 'bg-warning text-dark' :
                            badge === 'VIP Whale' ? 'bg-dark text-warning' :
                            type === 'SQL' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'
                        }`}>
                            {badge}
                        </span>
                    ))}
                    <span className="badge bg-light text-dark border extra-small-badge rounded-pill">
                        {currencySymbol}{Number(lead.budget).toLocaleString()}
                    </span>
                </div>

                <div className="bg-light-soft p-2 rounded-3 border-start border-3" style={{ borderColor: lead.qualification.auraColor }}>
                    <div className="d-flex align-items-center gap-2 extra-small text-muted mb-1">
                        <i className={`bi ${type === 'SQL' ? 'bi-lightning-fill text-warning' : 'bi-magic text-primary'}`}></i>
                        <strong>Insight:</strong> {lead.qualification.reason}
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .lead-qual-card:hover {
                    transform: translateY(-4px) scale(1.01);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.1) !important;
                }
                .extra-small { font-size: 0.7rem; }
                .extra-small-badge { font-size: 0.6rem; padding: 4px 10px; }
                .bg-light-soft { background-color: rgba(0,0,0,0.03); }
            `}</style>
        </div>
    );

    if (loading) return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <Loader size="lg" message="Reading digital body language..." />
        </div>
    );

    return (
        <div className="qualification-hub-container animate-fade-in">
            <div className="row g-4">
                {/* SQL Column */}
                <div className="col-lg-6">
                    <div className="p-4 rounded-4 bg-danger-soft border border-danger border-opacity-10">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="fw-bold text-dark mb-0">Sales Qualified (SQL)</h5>
                                <p className="text-muted small mb-0">High-intent leads ready for immediate closing.</p>
                            </div>
                            <span className="badge bg-danger rounded-pill px-3 py-2">{qualifiedLeads.sqls.length}</span>
                        </div>
                        
                        <div className="scroll-area custom-scrollbar pe-2" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                            {qualifiedLeads.sqls.length === 0 ? (
                                <div className="text-center py-5 bg-white rounded-4 border border-dashed">
                                    <i className="bi bi-funnel text-muted display-6 opacity-25"></i>
                                    <p className="text-muted small mt-2">No SQLs detected yet.</p>
                                </div>
                            ) : (
                                qualifiedLeads.sqls.map(l => renderLeadCard(l, 'SQL'))
                            )}
                        </div>
                    </div>
                </div>

                {/* MQL Column */}
                <div className="col-lg-6">
                    <div className="p-4 rounded-4 bg-success-soft border border-success border-opacity-10">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="fw-bold text-dark mb-0">Marketing Qualified (MQL)</h5>
                                <p className="text-muted small mb-0">Engaged prospects showing interest patterns.</p>
                            </div>
                            <span className="badge bg-success rounded-pill px-3 py-2">{qualifiedLeads.mqls.length}</span>
                        </div>

                        <div className="scroll-area custom-scrollbar pe-2" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                            {qualifiedLeads.mqls.length === 0 ? (
                                <div className="text-center py-5 bg-white rounded-4 border border-dashed">
                                    <i className="bi bi-people text-muted display-6 opacity-25"></i>
                                    <p className="text-muted small mt-2">No MQLs detected yet.</p>
                                </div>
                            ) : (
                                qualifiedLeads.mqls.map(l => renderLeadCard(l, 'MQL'))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
}
