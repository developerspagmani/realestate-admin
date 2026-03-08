import React from 'react';
import { getStatusBadge } from '../utils/statusHelpers';

interface PreventionViewProps {
    data: any;
}

export default function PreventionView({ data }: PreventionViewProps) {
    if (!data) return null;

    return (
        <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            <div className="row g-4">
                {/* High Risk Deals */}
                <div className="col-lg-8">
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '16px', overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(239,68,68,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div className="d-flex align-items-center gap-2">
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: '#f87171', boxShadow: '0 0 8px #ef4444'
                                }} />
                                <span style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.3px' }}>
                                    High Risk Deals Awareness
                                </span>
                            </div>
                            <span style={{
                                background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '20px', padding: '3px 12px',
                                color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600
                            }}>
                                {data.highRiskDeals?.length || 0} Critical Leads
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        {['Lead', 'Assigned Agent', 'Risk Severity', 'Top Concern'].map(h => (
                                            <th key={h} style={{
                                                padding: '10px 20px', textAlign: 'left',
                                                color: '#475569', fontSize: '0.68rem', fontWeight: 700,
                                                letterSpacing: '1px', textTransform: 'uppercase'
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.highRiskDeals?.slice(0, 5).map((deal: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.88rem' }}>{deal.name}</div>
                                                <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
                                                    #{deal.id?.substring(0, 8).toUpperCase() || 'L-RISK'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div style={{
                                                        width: '24px', height: '24px', borderRadius: '50%',
                                                        background: 'rgba(185,28,28,0.2)', fontSize: '0.65rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5'
                                                    }}>{deal.agent?.charAt(0) || 'U'}</div>
                                                    {deal.agent || 'Unassigned'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div style={{ height: '6px', width: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%', width: `${deal.score}%`,
                                                            background: deal.score > 80 ? '#ef4444' : '#f59e0b',
                                                            boxShadow: deal.score > 80 ? '0 0 10px rgba(239,68,68,0.5)' : 'none'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: deal.score > 80 ? '#f87171' : '#fbbf24' }}>{deal.score}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span style={{
                                                    fontSize: '0.7rem', color: '#fca5a5', background: 'rgba(239,68,68,0.1)',
                                                    padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)'
                                                }}>
                                                    {deal.signals?.[0] || 'Idle Period'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Primary Risks */}
                <div className="col-lg-4">
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '16px', padding: '24px'
                    }}>
                        <h6 style={{ color: '#cbd5e1', fontWeight: 700, marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="bi bi-exclamation-triangle-fill text-danger"></i> Pipeline Leakage Signals
                        </h6>
                        <div className="d-flex flex-column gap-3">
                            {data.topRiskSignals?.slice(0, 4).map((sig: any, i: number) => (
                                <div key={i} style={{
                                    padding: '16px', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.02)',
                                    display: 'flex', flexDirection: 'column', gap: '10px'
                                }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem' }}>{sig.signal}</span>
                                        <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>{sig.count}</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${Math.min(100, sig.count * 10)}%`, background: '#dc2626' }} />
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: '0.65rem' }}>Affecting {sig.count} active sales deals</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
