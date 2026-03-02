'use client';

import { useState, useEffect } from 'react';
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

interface DashboardManagerProps {
    mode: 'admin' | 'owner';
}

export default function DashboardManager({ mode }: DashboardManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        // Admin specific
        totalOwners: 0,
        totalUsers: 0,

        // Shared / Renamed
        totalProperties: 0, // Admin calls this 'Spaces'
        totalUnits: 0,      // Admin calls this 'Workspaces'

        totalBookings: 0,
        totalRevenue: 0,

        availableUnits: 0,
        occupiedUnits: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
    });

    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [topUnits, setTopUnits] = useState<any[]>([]);
    const [historicalData, setHistoricalData] = useState<any[]>([]);
    const [periodLabel, setPeriodLabel] = useState('Last 6 Months');
    const [chartParams, setChartParams] = useState<any>({ period: 'last6months' });
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }
        loadDashboardData(chartParams);
    }, [mounted, isAuthenticated, user, router, activeTenantId, activeOwnerId, tenantType]);

    const loadDashboardData = async (params: any = chartParams) => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const industryType = mode === 'admin' ? tenantType : undefined;

            const response = await dashboardService.getStats(token, {
                tenantId: tenantId || undefined,
                industryType,
                ...params,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });

            if (response.success && response.data) {
                const overview = response.data.overview || {};

                setStats({
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
                });

                setRecentBookings(response.data.recentBookings || []);
                setTopUnits(response.data.topWorkspaces || []);
                setHistoricalData(response.data.historicalData || []);
                setPeriodLabel(response.data.periodLabel || 'Report');
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showToast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
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
                        onClick={loadDashboardData}
                        disabled={loading}
                    >
                        <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin' : ''}`}></i>
                        Refresh
                    </button>
                </div>

                {/* Stats Section */}
                <DashboardStats mode={mode} stats={stats} loading={loading} />

                {/* Charts Section */}
                <DashboardCharts
                    data={historicalData}
                    loading={loading}
                    periodLabel={periodLabel}
                    onRangeChange={(params) => {
                        setChartParams(params);
                        loadDashboardData(params);
                    }}
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
