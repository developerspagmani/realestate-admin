'use client';

import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface LeadSourceData {
    source: string;
    count: number;
}

interface LeadSourceChartProps {
    data: LeadSourceData[];
    loading?: boolean;
}

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#6610f2', '#fd7e14', '#20c997', '#d63384'];

export default function LeadSourceChart({ data, loading }: LeadSourceChartProps) {
    if (loading) {
        return (
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="placeholder-glow h-100 w-100 rounded-3 bg-light" style={{ minHeight: '300px' }}></div>
            </div>
        );
    }

    const filteredData = data.filter(item => item.count > 0);

    if (filteredData.length === 0) {
        return (
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5">
                    <i className="bi bi-pie-chart text-light display-1 mb-3"></i>
                    <p className="text-muted">No lead data available for this period</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm rounded-4 p-4 h-100 hvr-float">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Lead Conversion Sources</h5>
                    <p className="text-muted small mb-0">Where your leads come from</p>
                </div>
                <div className="rounded-circle bg-primary-soft p-2">
                    <i className="bi bi-funnel text-primary"></i>
                </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={filteredData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="source"
                        >
                            {filteredData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                            }} 
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-4 pt-3 border-top">
                <div className="row g-2">
                    {filteredData.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="col-6">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                <span className="small text-muted text-truncate">{item.source}</span>
                            </div>
                            <div className="fw-bold h5 mb-0 ms-3">{item.count}</div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
            `}</style>
        </div>
    );
}
