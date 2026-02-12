import { useManagementContext } from '@/app/contexts/ManagementContext';

interface DashboardTopUnitsProps {
    units: any[];
    loading: boolean;
    totalBookings: number;
}

export default function DashboardTopUnits({ units, loading, totalBookings }: DashboardTopUnitsProps) {
    const { currencySymbol } = useManagementContext();

    return (
        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="card-header bg-white border-0 p-4">
                <h5 className="fw-bold mb-0">Top Performing Units</h5>
            </div>
            <div className="card-body p-4 pt-0">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="mb-4">
                            <div className="d-flex justify-content-between mb-2">
                                <div className="w-50"><div className="skeleton h-1rem w-100 mb-1"></div><div className="skeleton h-1rem w-50"></div></div>
                                <div className="w-25"><div className="skeleton h-1rem w-100"></div></div>
                            </div>
                            <div className="skeleton h-6px w-100 rounded-4"></div>
                        </div>
                    ))
                ) : units.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-bar-chart display-1 opacity-25"></i>
                        <p className="mt-3 small">No performance data yet</p>
                    </div>
                ) : units.map((unit, index) => (
                    <div key={unit.id || index} className="mb-4">
                        <div className="d-flex justify-content-between mb-2">
                            <div>
                                <span className="small fw-bold text-dark d-block">
                                    {unit.unitCode || unit.name || 'Unknown Unit'}
                                </span>
                                <span className="extra-small text-muted">
                                    {unit.property?.title || 'Unknown Property'}
                                </span>
                            </div>
                            <div className="text-end">
                                <span className="small fw-bold text-primary d-block">
                                    {unit.bookingCount} bookings
                                </span>
                                {unit.totalRevenue && (
                                    <span className="extra-small text-muted">
                                        {currencySymbol}{unit.totalRevenue.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="progress rounded-4" style={{ height: '6px' }}>
                            <div
                                className={`progress-bar rounded-4 transition-all ${index === 0 ? 'bg-primary' : 'bg-secondary'}`}
                                style={{ width: `${Math.min(100, (unit.bookingCount / (totalBookings || 1)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
            <style jsx>{`
        .transition-all { transition: all 1s ease-out; }
        .extra-small { font-size: 11px; }
        .skeleton {
            background: rgba(0,0,0,0.05);
            border-radius: 4px;
            animation: pulse 1.5s infinite ease-in-out;
        }
        .h-1rem { height: 1rem; }
        .h-6px { height: 6px; }
        @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }
      `}</style>
        </div>
    );
}
