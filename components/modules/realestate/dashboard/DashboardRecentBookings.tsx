'use client';

interface DashboardRecentBookingsProps {
    bookings: any[];
    loading: boolean;
}

export default function DashboardRecentBookings({ bookings, loading }: DashboardRecentBookingsProps) {
    return (
        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Recent Bookings</h5>
                {/* Helper link could be added here if needed */}
            </div>
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-4 py-3 border-0 small text-uppercase text-muted">User / Client</th>
                            <th className="py-3 border-0 small text-uppercase text-muted">Property / Unit</th>
                            <th className="py-3 border-0 small text-uppercase text-muted">Price</th>
                            <th className="py-3 border-0 small text-uppercase text-muted text-center">Status</th>
                            <th className="pe-4 py-3 border-0 small text-uppercase text-muted text-end">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3"><div className="skeleton h-2rem w-100"></div></td>
                                    <td className="py-3"><div className="skeleton h-1rem w-75"></div></td>
                                    <td className="py-3"><div className="skeleton h-1rem w-50"></div></td>
                                    <td className="py-3 text-center"><div className="skeleton h-2rem w-50 mx-auto rounded-pill"></div></td>
                                    <td className="pe-4 py-3 text-end"><div className="skeleton h-1rem w-75 ms-auto"></div></td>
                                </tr>
                            ))
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-5 text-muted small">No recent bookings found</td></tr>
                        ) : bookings.map((booking) => (
                            <tr key={booking.id}>
                                <td className="px-4 py-3">
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-sm bg-light rounded-circle p-2 me-2 text-center" style={{ width: '35px', height: '35px' }}>
                                            <i className="bi bi-person text-secondary small"></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold small">{booking.user?.name || 'Guest'}</div>
                                            <div className="text-muted extra-small">{booking.user?.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3">
                                    <div className="fw-bold small">{booking.unit?.unitCode || booking.unit?.name || 'N/A'}</div>
                                    <div className="text-muted extra-small">{booking.unit?.property?.title || booking.unit?.unitCategory}</div>
                                </td>
                                <td className="py-3">
                                    <span className="fw-bold text-dark small">${booking.totalPrice}</span>
                                </td>
                                <td className="py-3 text-center">
                                    <span className={`badge rounded-pill px-3 ${booking.status === 2 || booking.status === 3 ? 'bg-success-soft text-success' : // Confirmed/Completed
                                        booking.status === 4 ? 'bg-danger-soft text-danger' : // Cancelled
                                            'bg-warning-soft text-warning' // Pending
                                        }`}>
                                        {booking.status === 2 ? 'Confirmed' :
                                            booking.status === 3 ? 'Completed' :
                                                booking.status === 4 ? 'Cancelled' : 'Pending'}
                                    </span>
                                </td>
                                <td className="pe-4 py-3 text-end text-muted small">
                                    {new Date(booking.createdAt || booking.startAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
        .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
        .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
        .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
        .extra-small { font-size: 11px; }
        .skeleton {
            background: rgba(0,0,0,0.05);
            border-radius: 4px;
            animation: pulse 1.5s infinite ease-in-out;
        }
        .h-2rem { height: 2rem; }
        .h-1rem { height: 1rem; }
        @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }
      `}</style>
        </div>
    );
}
