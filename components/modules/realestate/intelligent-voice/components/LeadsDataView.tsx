import React from 'react';
import { Lead } from '@/app/services/api';
import { getStatusBadge } from '../utils/statusHelpers';

interface LeadsDataViewProps {
    leads: Lead[];
}

export default function LeadsDataView({ leads }: LeadsDataViewProps) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', overflow: 'hidden',
            marginBottom: '1.5rem',
            animation: 'fadeInUp 0.5s ease',
            backdropFilter: 'blur(12px)'
        }}>
            {/* Card Header */}
            <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(59,130,246,0.05)'
            }}>
                <div className="d-flex align-items-center gap-2">
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#3b82f6', boxShadow: '0 0 8px #3b82f6'
                    }} />
                    <span style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.3px' }}>
                        Lead Intelligence
                    </span>
                </div>
                <span style={{
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: '20px', padding: '3px 12px',
                    color: '#93c5fd', fontSize: '0.78rem', fontWeight: 600
                }}>
                    {leads.length} Results
                </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['Client', 'Contact', 'Property Interest', 'Status', 'Date'].map(h => (
                                <th key={h} style={{
                                    padding: '10px 20px', textAlign: h === 'Date' ? 'right' : 'left',
                                    color: '#475569', fontSize: '0.72rem', fontWeight: 700,
                                    letterSpacing: '1px', textTransform: 'uppercase'
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length > 0 ? leads.map((lead) => (
                            <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <td style={{ padding: '14px 20px' }}>
                                    <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.88rem' }}>{lead.name}</div>
                                    <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '2px' }}>
                                        #{lead.id.substring(0, 8).toUpperCase()}
                                    </div>
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                        <i className="bi bi-envelope me-1" style={{ color: '#3b82f6' }}></i>{lead.email || 'N/A'}
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '3px' }}>
                                        <i className="bi bi-telephone me-1" style={{ color: '#8b5cf6' }}></i>{lead.phone || 'N/A'}
                                    </div>
                                </td>
                                <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: '0.85rem' }}>
                                    {lead.property?.title || 'General Inquiry'}
                                </td>
                                <td style={{ padding: '14px 20px' }}>{getStatusBadge(lead.status, 'lead')}</td>
                                <td style={{ padding: '14px 20px', textAlign: 'right', color: '#475569', fontSize: '0.8rem' }}>
                                    {new Date(lead.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#334155' }}>
                                    No leads found matching this criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
