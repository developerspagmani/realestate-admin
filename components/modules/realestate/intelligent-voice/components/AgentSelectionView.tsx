import React from 'react';

interface AgentSelectionViewProps {
    agents: any[];
    selectedLeadName?: string;
}

export default function AgentSelectionView({ agents, selectedLeadName }: AgentSelectionViewProps) {
    if (!Array.isArray(agents) || agents.length === 0) return (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
            No agents found to assign tasks.
        </div>
    );

    return (
        <div style={{ animation: 'fadeInUp 0.6s ease', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ color: '#3b82f6', fontSize: '0.78rem', letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                    ◆ AGENT ASSIGNMENT ◆
                </div>
                <h4 style={{ color: '#e2e8f0', fontWeight: 700 }}>
                    Select Agent for <span style={{ color: '#ef4444' }}>{selectedLeadName || 'this lead'}</span>
                </h4>
                <p style={{ color: '#475569', fontSize: '0.9rem' }}>Say the name of the agent to confirm assignment</p>
            </div>

            <div className="row g-3">
                {agents.slice(0, 8).map((agent: any, i: number) => (
                    <div key={i} className="col-md-3">
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '16px', padding: '20px', textAlign: 'center',
                            transition: 'all 0.3s ease',
                        }}>
                            <div style={{
                                width: '48px', height: '48px', margin: '0 auto 12px',
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '1.1rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {agent.name?.charAt(0) || 'A'}
                            </div>
                            <h6 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: '4px', fontSize: '0.9rem' }}>{agent.name}</h6>
                            <p style={{ color: '#475569', fontSize: '0.7rem', margin: 0 }}>{agent.email || 'Agent Profile'}</p>
                            <div style={{
                                borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '12px', paddingTop: '8px',
                                color: '#93c5fd', fontSize: '0.65rem', fontWeight: 700
                            }}>
                                {agent.role || 'Sales Associate'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
