'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { dashboardService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import DashboardStats from '@/components/modules/realestate/dashboard/DashboardStats';
import DashboardRecentBookings from '@/components/modules/realestate/dashboard/DashboardRecentBookings';
import DashboardTopUnits from '@/components/modules/realestate/dashboard/DashboardTopUnits';
import DashboardCharts from '@/components/modules/realestate/dashboard/DashboardCharts';
import Toast from '@/components/common/Toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface DashboardManagerProps {
    mode: 'admin' | 'owner';
}

export default function DashboardManager({ mode }: DashboardManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [chartParams, setChartParams] = useState<any>({ period: 'last6months' });
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const router = useRouter();

    useEffect(() => { setMounted(true); }, []);

    // --- TanStack Query ---

    const queryClient = useQueryClient();
    const token = typeof window !== 'undefined' ? getAuthToken() : '';
    const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;

    const { data: dashboardData, isLoading, isFetching } = useQuery({
        queryKey: ['dashboard', mode, tenantId, activeOwnerId, tenantType, chartParams],
        queryFn: async () => {
            const industryType = mode === 'admin' ? tenantType : undefined;
            const res = await dashboardService.getStats(token!, {
                tenantId: tenantId || undefined,
                industryType,
                ...chartParams,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });
            if (!res.success) throw new Error(res.message || 'Failed to fetch dashboard stats');
            return res.data;
        },
        enabled: !!token && mounted && isAuthenticated,
    });

    const stats = useMemo(() => {
        const overview = dashboardData?.overview || {};
        return {
            totalOwners: overview.totalOwners || 0,
            totalUsers: overview.totalUsers || 0,
            totalProperties: overview.totalProperties || 0,
            totalUnits: overview.totalUnits || 0,
            totalBookings: overview.totalBookings || 0,
            totalRevenue: overview.totalRevenue || 0,
            availableUnits: overview.availableUnits || 0,
            occupiedUnits: overview.occupiedUnits || 0,
            pendingBookings: overview.pendingBookings || 0,
            confirmedBookings: overview.activeBookings || 0,
        };
    }, [dashboardData]);

    const recentBookings = dashboardData?.recentBookings || [];
    const topUnits = dashboardData?.topWorkspaces || [];
    const historicalData = dashboardData?.historicalData || [];
    const periodLabel = dashboardData?.periodLabel || 'Report';

    const loading = isLoading;
    const isRefreshing = isFetching && !isLoading;

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };



    if (!mounted || !isAuthenticated) return null;

    return (
        <MainLayout activePage="dashboard">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">
                            {mode === 'admin' ? 'Dashboard' : 'Owner Dashboard'}
                        </h1>
                        <p className="text-muted small">
                            Welcome back, {user?.name}. Here's your system overview.
                        </p>
                    </div>
                    <button
                        className="btn btn-white shadow-sm border-0 px-3"
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                    >
                        <i className={`bi bi-arrow-clockwise me-2 ${(loading || isRefreshing) ? 'spin' : ''}`}></i>
                        {isRefreshing ? 'Updating...' : 'Refresh'}
                    </button>
                </div>

                {/* Stats Section */}
                <DashboardStats mode={mode} stats={stats} loading={loading} />

                {/* Charts Section */}
                <DashboardCharts
                    data={historicalData}
                    loading={loading}
                    periodLabel={periodLabel}
                    onRangeChange={(params) => setChartParams(params)}
                />

                <div className="row g-4 mt-2">
                    {/* Recent Bookings */}
                    <div className="col-lg-8">
                        <DashboardRecentBookings bookings={recentBookings} loading={loading} />
                    </div>

                    {/* Top Units */}
                    <div className="col-lg-4">
                        <DashboardTopUnits units={topUnits} loading={loading} totalBookings={stats.totalBookings} />
                    </div>
                </div>
            </div>

            <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </MainLayout>
    );
}
