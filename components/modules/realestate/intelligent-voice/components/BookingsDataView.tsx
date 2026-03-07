import React from 'react';
import { Booking } from '@/app/services/api';
import { getStatusBadge } from '../utils/statusHelpers';

interface BookingsDataViewProps {
    bookings: Booking[];
}

export default function BookingsDataView({ bookings }: BookingsDataViewProps) {
    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ animation: 'fadeInUp 0.5s ease' }}>
            <div className="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0"><i className="bi bi-calendar-check text-primary me-2"></i> Booking Intelligence</h5>
                <span className="badge bg-primary rounded-pill px-3 py-2">{bookings.length} Results</span>
            </div>
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th className="ps-4">Reference</th>
                            <th>Client / Guest</th>
                            <th>Schedule</th>
                            <th>Status</th>
                            <th className="pe-4 text-end">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length > 0 ? bookings.map((booking) => (
                            <tr key={booking.id}>
                                <td className="ps-4">
                                    <div className="fw-bold text-dark">{booking.id.substring(0, 8).toUpperCase()}</div>
                                    <div className="small text-muted">{booking.property?.title || 'Unknown Property'}</div>
                                </td>
                                <td>
                                    <div className="fw-semibold">{booking.guestName || booking.user?.name || 'Unknown'}</div>
                                    <div className="small text-muted">{booking.guestEmail || booking.user?.email}</div>
                                </td>
                                <td>
                                    <div className="small fw-semibold">{new Date(booking.startAt).toLocaleDateString()}</div>
                                    <div className="small text-muted">to {new Date(booking.endAt).toLocaleDateString()}</div>
                                </td>
                                <td>{getStatusBadge(booking.status, 'booking')}</td>
                                <td className="pe-4 text-end fw-bold">
                                    {booking.totalPrice ? `$${booking.totalPrice.toLocaleString()}` : '-'}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="text-center py-5 text-muted">No bookings found matching this criteria.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
