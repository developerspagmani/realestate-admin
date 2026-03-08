import React from 'react';

interface ForecastingViewProps {
    data: any;
}

export default function ForecastingView({ data }: ForecastingViewProps) {
    if (!data) return null;

    return (
        <div style={{ animation: 'fadeInUp 0.6s ease' }}>
            {/* Quick Metrics */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div style={{
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: '16px', padding: '16px', textAlign: 'center'
                    }}>
                        <div style={{ color: '#93c5fd', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Potential Demand</div>
                        <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>{data.summary?.totalSearches?.toLocaleString() || 0}</div>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>Active Search Signals</div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div style={{
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '16px', padding: '16px', textAlign: 'center'
                    }}>
                        <div style={{ color: '#6ee7b7', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Avg Buyer Budget</div>
                        <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>${data.summary?.avgBuyerBudget?.toLocaleString() || 0}</div>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>Vs List Avg: ${data.summary?.avgListingPrice?.toLocaleString()}</div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div style={{
                        background: 'rgba(139,92,246,0.1)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        borderRadius: '16px', padding: '16px', textAlign: 'center'
                    }}>
                        <div style={{ color: '#c4b5fd', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Inventory Sync</div>
                        <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>{data.summary?.totalInventory || 0}</div>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>Properties In Portfolio</div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div style={{
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: '16px', padding: '16px', textAlign: 'center'
                    }}>
                        <div style={{ color: '#fcd34d', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Gaps Detected</div>
                        <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>{(data.keywordShortages?.length || 0) + (data.featureShortages?.length || 0)}</div>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>Supply Shortages</div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Shortages Grid */}
                <div className="col-lg-6">
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '16px', overflow: 'hidden'
                    }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                            <h6 style={{ color: '#cbd5e1', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>Market Gaps & Shortages</h6>
                        </div>
                        <div style={{ padding: '0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '10px 20px', color: '#475569', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Focus Area</th>
                                        <th style={{ padding: '10px 20px', color: '#475569', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Demand</th>
                                        <th style={{ padding: '10px 20px', color: '#475569', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Shortage</th>
                                        <th style={{ padding: '10px 20px', color: '#475569', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Priority</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.keywordShortages?.slice(0, 4).map((item: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '12px 20px', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>{item.keyword}</td>
                                            <td style={{ padding: '12px 20px', color: '#94a3b8', fontSize: '0.8rem' }}>{item.demandCount}</td>
                                            <td style={{ padding: '12px 20px', color: '#f87171', fontSize: '0.8rem' }}>+{item.gap}</td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <span style={{
                                                    fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700,
                                                    background: item.severity === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                                                    color: item.severity === 'CRITICAL' ? '#fca5a5' : '#fcd34d'
                                                }}>{item.severity}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.featureShortages?.slice(0, 3).map((item: any, i: number) => (
                                        <tr key={`f-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '12px 20px', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>{item.feature}</td>
                                            <td style={{ padding: '12px 20px', color: '#94a3b8', fontSize: '0.8rem' }}>{item.demandCount}</td>
                                            <td style={{ padding: '12px 20px', color: '#fbbf24', fontSize: '0.8rem' }}>+{item.gap}</td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <span style={{
                                                    fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700,
                                                    background: 'rgba(59,130,246,0.2)', color: '#93c5fd'
                                                }}>{item.severity}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* AI Recommendations */}
                <div className="col-lg-6">
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '16px', padding: '20px'
                    }}>
                        <h6 style={{ color: '#cbd5e1', fontWeight: 700, marginBottom: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="bi bi-stars text-warning"></i> AI Growth Recommendations
                        </h6>
                        <div className="d-flex flex-column gap-3">
                            {data.recommendations?.slice(0, 3).map((rec: any, i: number) => (
                                <div key={i} style={{
                                    padding: '16px', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderLeft: `3px solid ${rec.priority === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`
                                }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem' }}>{rec.title}</span>
                                        <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>{rec.priority}</span>
                                    </div>
                                    <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '8px', lineHeight: 1.4 }}>{rec.detail}</p>
                                    <div style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600 }}>Action Plan: {rec.impact}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
