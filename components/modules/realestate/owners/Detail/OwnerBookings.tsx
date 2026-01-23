'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { userService, getAuthToken } from '@/app/services/api';

export default function OwnerBookings() {
    const { id } = useParams();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;
                const response = await userService.getOwnerBookings(token, id as string);
                if (response.success) {
                    setBookings(response.data.bookings);
                }
            } catch (error) {
                console.error('Failed to load bookings:', error);
            } finally {
                setLoading(false);
            }
        };
        loadBookings();
    }, [id]);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <span className="badge bg-warning-soft text-warning rounded-pill px-3 py-2">Pending</span>;
            case 2: return <span className="badge bg-success-soft text-success rounded-pill px-3 py-2">Confirmed</span>;
            case 3: return <span className="badge bg-danger-soft text-danger rounded-pill px-3 py-2">Cancelled</span>;
            case 4: return <span className="badge bg-info-soft text-info rounded-pill px-3 py-2">Completed</span>;
            default: return <span className="badge bg-secondary-soft text-secondary rounded-pill px-3 py-2">Other</span>;
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Booking Details</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Customer</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0 text-center">Stay Duration</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0 text-end">Total Price</th>
                            <th className="py-3 text-uppercase small fw-bold text-muted border-0">Status</th>
                            <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0 text-end">Booked Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-5 text-muted">No bookings found for property owner's assets.</td></tr>
                        ) : bookings.map((booking) => (
                            <tr key={booking.id}>
                                <td className="px-4 py-3">
                                    <div className="fw-bold text-dark">{booking.unit?.unitCode}</div>
                                    <div className="text-muted small">{booking.unit?.property?.title}</div>
                                </td>
                                <td className="py-3 text-dark small">
                                    <div className="fw-medium">{booking.user?.name}</div>
                                    <div className="text-muted extra-small">{booking.user?.email}</div>
                                </td>
                                <td className="py-3 text-center small text-muted">
                                    {new Date(booking.startAt).toLocaleDateString()} - {new Date(booking.endAt).toLocaleDateString()}
                                </td>
                                <td className="py-3 text-end fw-bold text-dark">
                                    ${Number(booking.totalPrice || 0).toLocaleString()}
                                </td>
                                <td className="py-3">
                                    {getStatusBadge(booking.status)}
                                </td>
                                <td className="px-4 py-3 text-end text-muted small">
                                    {new Date(booking.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                .bg-info-soft { background-color: rgba(13, 202, 240, 0.1); }
                .bg-secondary-soft { background-color: rgba(108, 117, 125, 0.1); }
                .extra-small { font-size: 11px; }
            `}</style>
        </div>
    );
}
