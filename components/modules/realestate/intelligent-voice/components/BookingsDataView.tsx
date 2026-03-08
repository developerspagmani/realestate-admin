import React from 'react';
import { Booking } from '@/app/services/api';
import { getStatusBadge } from '../utils/statusHelpers';

interface BookingsDataViewProps {
    bookings: Booking[];
}

export default function BookingsDataView({ bookings }: BookingsDataViewProps) {
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
                background: 'rgba(139,92,246,0.05)'
            }}>
                <div className="d-flex align-items-center gap-2">
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6'
                    }} />
                    <span style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.3px' }}>
                        Booking Intelligence
                    </span>
                </div>
                <span style={{
                    background: 'rgba(139,92,246,0.15)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: '20px', padding: '3px 12px',
                    color: '#c4b5fd', fontSize: '0.78rem', fontWeight: 600
                }}>
                    {bookings.length} Results
                </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['Reference', 'Client / Guest', 'Schedule', 'Status', 'Value'].map(h => (
                                <th key={h} style={{
                                    padding: '10px 20px', textAlign: h === 'Value' ? 'right' : 'left',
                                    color: '#475569', fontSize: '0.72rem', fontWeight: 700,
                                    letterSpacing: '1px', textTransform: 'uppercase'
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length > 0 ? bookings.map((booking) => (
                            <tr key={booking.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.04)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <td style={{ padding: '14px 20px' }}>
                                    <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.88rem' }}>
                                        #{booking.id.substring(0, 8).toUpperCase()}
                                    </div>
                                    <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '2px' }}>
                                        {booking.property?.title || 'Unknown Property'}
                                    </div>
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                    <div style={{ fontWeight: 600, color: '#cbd5e1', fontSize: '0.85rem' }}>
                                        {booking.guestName || booking.user?.name || 'Unknown'}
                                    </div>
                                    <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '3px' }}>
                                        {booking.guestEmail || booking.user?.email}
                                    </div>
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 500 }}>
                                        {new Date(booking.startAt).toLocaleDateString()}
                                    </div>
                                    <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '2px' }}>
                                        → {new Date(booking.endAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td style={{ padding: '14px 20px' }}>{getStatusBadge(booking.status, 'booking')}</td>
                                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                    <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.88rem' }}>
                                        {booking.totalPrice ? `$${booking.totalPrice.toLocaleString()}` : '—'}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#334155' }}>
                                    No bookings found matching this criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
