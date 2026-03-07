import { useManagementContext } from '@/app/contexts/ManagementContext';

interface DashboardStatsProps {
    mode: 'admin' | 'owner';
    loading: boolean;
    stats: {
        totalOwners: number;
        totalUsers: number;
        totalProperties: number;
        totalUnits: number;
        totalBookings: number;
        totalRevenue: number;
        availableUnits: number;
        occupiedUnits: number;
        pendingBookings: number;
        confirmedBookings: number;
        totalLeads: number;
    };
}

interface StatCardProps {
    label: string;
    value: string | number;
    subLabel?: string;
    icon: string;
    color: string;
    bgClass?: string;
    loading: boolean;
}

const StatCard = ({ label, value, subLabel, icon, color, bgClass, loading }: StatCardProps) => (
    <div className="card border-0 shadow-sm h-100 rounded-4 overflow-hidden hvr-float">
        <div className={`card-body p-4 ${bgClass ? bgClass : 'bg-white'}`}>
            <div className="d-flex align-items-center justify-content-between">
                <div>
                    <div className={`text-uppercase small fw-bold mb-1 ${bgClass ? 'opacity-75' : 'text-muted'}`}>{label}</div>
                    {loading ? (
                        <div className="skeleton h-2rem w-75 mb-1"></div>
                    ) : (
                        <div className="display-6 fw-bold mb-0">{value}</div>
                    )}
                    {subLabel && (
                        loading ? (
                            <div className="skeleton h-1rem w-50 mt-1"></div>
                        ) : (
                            <div className={`small mt-1 ${bgClass ? 'opacity-75' : 'text-secondary'}`}>{subLabel}</div>
                        )
                    )}
                </div>
                <div className={`rounded-circle px-4 py-3 ${bgClass ? 'bg-white bg-opacity-25' : `bg-${color}-soft`}`}>
                    <i className={`bi ${icon} fs-3 ${bgClass ? 'text-white' : `text-${color}`}`}></i>
                </div>
            </div>
        </div>
        <style jsx>{`
            .skeleton {
                background: ${bgClass ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'};
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

export default function DashboardStats({ mode, stats, loading }: DashboardStatsProps) {
    const { currencySymbol } = useManagementContext();

    if (mode === 'admin') {
        return (
            <>
                {/* Admin Top Row */}
                <div className="row g-4 mb-4">
                    <div className="col-md-3">
                        <StatCard label="Total Owners" value={stats.totalOwners} subLabel="Space owners" icon="bi-people" color="primary" bgClass="bg-primary text-white" loading={loading} />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Total Spaces" value={stats.totalProperties} subLabel="Managed properties" icon="bi-building" color="success" bgClass="bg-success text-white" loading={loading} />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Workspaces" value={stats.totalUnits} subLabel="Total units" icon="bi-laptop" color="info" bgClass="bg-info text-white" loading={loading} />
                    </div>
                    <div className="col-md-3">
                        <StatCard label="Users" value={stats.totalUsers} subLabel="Registered users" icon="bi-person" color="warning" bgClass="bg-warning text-dark" loading={loading} />
                    </div>
                </div>

                {/* Admin Operational Row */}
                <div className="row g-4 mb-4">
                    <div className="col-md-2-4 col-sm-6">
                        <StatCard label="Total Bookings" value={stats.totalBookings} icon="bi-calendar-check" color="secondary" loading={loading} />
                    </div>
                    <div className="col-md-2-4 col-sm-6">
                        <StatCard label="Total Leads" value={stats.totalLeads} icon="bi-graph-up-arrow" color="primary" loading={loading} />
                    </div>
                    <div className="col-md-2-4 col-sm-6">
                        <StatCard label="Available" value={stats.availableUnits} icon="bi-check-circle" color="success" loading={loading} />
                    </div>
                    <div className="col-md-2-4 col-sm-6">
                        <StatCard label="Occupied" value={stats.occupiedUnits} icon="bi-dash-circle" color="danger" loading={loading} />
                    </div>
                    <div className="col-md-2-4 col-sm-6">
                        <StatCard label="Total Revenue" value={`${currencySymbol}${stats.totalRevenue.toLocaleString()}`} icon="bi-cash-coin" color="dark" bgClass="bg-dark text-white" loading={loading} />
                    </div>
                </div>

                <style jsx>{`
                    .col-md-2-4 {
                        flex: 0 0 auto;
                        width: 20%;
                    }
                    @media (max-width: 992px) {
                        .col-md-2-4 {
                            width: 33.333%;
                        }
                    }
                    @media (max-width: 768px) {
                        .col-md-2-4 {
                            width: 50%;
                        }
                    }
                `}</style>

                {/* Admin Booking Status Row */}
                <div className="row g-4 mt-1">
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm bg-warning-subtle text-warning-emphasis rounded-4">
                            <div className="card-body p-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0 fw-bold">Pending Bookings</h5>
                                    <small>Awaiting confirmation</small>
                                </div>
                                <div className="display-6 fw-bold">{stats.pendingBookings}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm bg-success-subtle text-success-emphasis rounded-4">
                            <div className="card-body p-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0 fw-bold">Confirmed Bookings</h5>
                                    <small>Secured reservations</small>
                                </div>
                                <div className="display-6 fw-bold">{stats.confirmedBookings}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Owner Mode
    return (
        <div className="row g-4 mb-4">
            <div className="col-md-3">
                <StatCard label="My Properties" value={stats.totalProperties} icon="bi-building" color="primary" loading={loading} />
            </div>
            <div className="col-md-3">
                <StatCard label="Total Units" value={stats.totalUnits} icon="bi-laptop" color="success" loading={loading} />
            </div>
            <div className="col-md-3">
                <StatCard label="Total Bookings" value={stats.totalBookings} icon="bi-calendar-check" color="info" loading={loading} />
            </div>
            <div className="col-md-3">
                <StatCard label="Revenue" value={`${currencySymbol}${stats.totalRevenue.toLocaleString()}`} icon="bi-cash-coin" color="warning" loading={loading} />
            </div>
        </div>
    );
}
