'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { dashboardService, getAuthToken } from '@/app/services/api';
import { Booking, Lead, Property, Task } from '@/app/services/types';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import DashboardStats from '@/components/modules/realestate/dashboard/DashboardStats';
import DashboardRecentBookings from '@/components/modules/realestate/dashboard/DashboardRecentBookings';
import DashboardRecentLeads from '@/components/modules/realestate/dashboard/DashboardRecentLeads';
import DashboardRecentProperties from '@/components/modules/realestate/dashboard/DashboardRecentProperties';
import DashboardUpcomingTasks from '@/components/modules/realestate/dashboard/DashboardUpcomingTasks';
import DashboardTopUnits, { DashboardUnit } from '@/components/modules/realestate/dashboard/DashboardTopUnits';
import DashboardCharts, { ChartData } from '@/components/modules/realestate/dashboard/DashboardCharts';
import LeadSourceChart from '@/components/modules/realestate/dashboard/LeadSourceChart';
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
        totalLeads: 0,
    });

    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
    const [recentProperties, setRecentProperties] = useState<Property[]>([]);
    const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
    const [topUnits, setTopUnits] = useState<DashboardUnit[]>([]);
    const [historicalData, setHistoricalData] = useState<ChartData[]>([]);
    const [leadSourceStats, setLeadSourceStats] = useState<{ source: string; count: number }[]>([]);
    const [periodLabel, setPeriodLabel] = useState('Last 6 Months');
    const [chartParams, setChartParams] = useState<Record<string, string | number | undefined>>({ period: 'last6months' });
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

    const loadDashboardData = useCallback(async (paramsToLoad: Record<string, string | number | undefined>) => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
            const industryType = mode === 'admin' ? tenantType : undefined;

            const response = await dashboardService.getStats(token, {
                tenantId: tenantId || undefined,
                industryType,
                ...paramsToLoad,
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
                    totalLeads: overview.totalLeads || 0,
                });

                setRecentBookings(response.data.recentBookings || []);
                setRecentLeads(response.data.recentLeads || []);
                setRecentProperties(response.data.recentProperties || []);
                setUpcomingTasks(response.data.upcomingTasks || []);
                setTopUnits(response.data.topWorkspaces || []);
                setHistoricalData(response.data.historicalData || []);
                setLeadSourceStats(response.data.leadSourceStats || []);
                setPeriodLabel(response.data.periodLabel || 'Report');
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showToast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    }, [mode, activeTenantId, user?.tenantId, tenantType, activeOwnerId]); // Removed chartParams to break stability loop

    const handleRangeChange = useCallback((params: { period: string; startDate?: string; endDate?: string }) => {
        setChartParams(params);
        loadDashboardData(params);
    }, [loadDashboardData]);

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }

        // Initial load
        loadDashboardData(chartParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, isAuthenticated, user, router, loadDashboardData]);

    if (!mounted || !isAuthenticated) return null;

    return (
        <MainLayout activePage="dashboard">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold h2 mb-1">
                            {mode === 'admin' ? 'System Dashboard' : 'Dashboard'}
                        </h1>
                        <p className="text-muted small">
                            {mode === 'admin' ? `Welcome back, ${user?.name}. Global operations overview.` : `Neural insights for ${user?.name}. Everything is under control.`}
                        </p>
                    </div>
                    <button
                        className="btn btn-white shadow-sm border-0 px-3"
                        onClick={() => loadDashboardData(chartParams)}
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
                    onRangeChange={handleRangeChange}
                />

                <div className="row g-4 mt-2">

                </div>

                <div className="row g-4 mt-2">
                    {/* Lead Conversion Sources */}
                    <div className="col-lg-6">
                        <LeadSourceChart data={leadSourceStats} loading={loading} />
                    </div>

                    {/* Recent Bookings */}
                    <div className="col-lg-6">
                        <DashboardRecentBookings bookings={recentBookings} loading={loading} />
                    </div>
                </div>

                <div className="row g-4 mt-2">
                    {/* Recent Leads */}
                    <div className="col-lg-6">
                        <DashboardRecentLeads leads={recentLeads} loading={loading} />
                    </div>

                    {/* Upcoming Tasks */}
                    <div className="col-lg-6">
                        <DashboardUpcomingTasks tasks={upcomingTasks} loading={loading} />
                    </div>
                </div>

                <div className="row g-4 mt-2 mb-5">
                    {/* Recent Properties */}
                    <div className="col-lg-6">
                        <DashboardRecentProperties properties={recentProperties} loading={loading} />
                    </div>
                    {/* Top Units */}
                    <div className="col-lg-6">
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
