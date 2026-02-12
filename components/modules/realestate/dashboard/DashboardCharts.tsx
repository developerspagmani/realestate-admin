'use client';

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface DashboardChartsProps {
    data: any[];
    loading?: boolean;
    periodLabel?: string;
    onRangeChange: (params: { period: string; startDate?: string; endDate?: string }) => void;
}

export default function DashboardCharts({ data, loading, periodLabel, onRangeChange }: DashboardChartsProps) {
    const [period, setPeriod] = useState('last6months');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (period !== 'custom') {
            onRangeChange({ period });
        }
    }, [period]);

    const handleCustomSubmit = () => {
        if (startDate && endDate) {
            onRangeChange({ period: 'custom', startDate, endDate });
        }
    }

    if (loading) {
        return (
            <div className="row g-4 mt-2">
                <div className="col-12">
                    <div className="d-flex justify-content-end mb-2">
                        <div className="placeholder-glow w-25 h-2rem bg-light rounded-3"></div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 p-4" style={{ height: '350px' }}>
                        <div className="placeholder-glow h-100 w-100 rounded-3 bg-light"></div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 p-4" style={{ height: '350px' }}>
                        <div className="placeholder-glow h-100 w-100 rounded-3 bg-light"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="row g-4 mt-2">
            <div className="col-12">
                <div className="d-flex flex-wrap justify-content-end align-items-center gap-3 mb-2">
                    {period === 'custom' && (
                        <div className="d-flex align-items-center gap-2 animate__animated animate__fadeIn">
                            <input
                                type="date"
                                className="form-control form-control-sm border-0 shadow-sm rounded-3"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-muted small">to</span>
                            <input
                                type="date"
                                className="form-control form-control-sm border-0 shadow-sm rounded-3"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            <button
                                className="btn btn-primary btn-sm rounded-3 px-3 shadow-sm"
                                onClick={handleCustomSubmit}
                                disabled={!startDate || !endDate}
                            >
                                Apply
                            </button>
                        </div>
                    )}
                    <select
                        className="form-select form-select-sm border-0 shadow-sm rounded-4 px-3"
                        style={{ width: 'auto', minWidth: '150px' }}
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="last30days">Last 30 Days</option>
                        <option value="last6months">Last 6 Months</option>
                        <option value="custom">Custom Date Range</option>
                    </select>
                </div>
            </div>

            {/* Bookings Trend Chart */}
            <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold mb-0">Bookings Trend</h5>
                        <span className="badge bg-primary-soft text-primary px-3 py-2 rounded-4 small">{periodLabel || 'Report'}</span>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6c757d', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6c757d', fontSize: 12 }}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="bookings"
                                    stroke="#0d6efd"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorBookings)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Leads Trend Chart */}
            <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold mb-0">Leads Acquisition</h5>
                        <span className="badge bg-success-soft text-success px-3 py-2 rounded-4 small">{periodLabel || 'Report'}</span>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6c757d', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6c757d', fontSize: 12 }}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                    cursor={{ fill: 'rgba(25, 135, 84, 0.05)' }}
                                />
                                <Bar
                                    dataKey="leads"
                                    fill="#198754"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
            `}</style>
        </div>
    );
}
