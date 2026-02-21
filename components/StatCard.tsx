'use client';

import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    color?: string;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = 'primary', onClick }) => {
    const colorClasses: Record<string, string> = {
        primary: 'bg-success text-success',
        success: 'bg-success text-success',
        info: 'bg-info text-info',
        warning: 'bg-warning text-warning',
        danger: 'bg-danger text-danger',
    };

    const bgColorClass = colorClasses[color] || colorClasses.primary;

    return (
        <div
            className={`card border-0 shadow-sm h-100 rounded-4 overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            style={{ transition: 'transform 0.2s ease-in-out' }}
            onMouseOver={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-5px)')}
            onMouseOut={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
        >
            <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <div className="text-uppercase small fw-bold mb-1 text-muted">{label}</div>
                        <div className={`display-6 fw-bold mb-0 text-${color}`}>{value}</div>
                    </div>
                    <div className={`rounded-5 px-4 py-3 ${bgColorClass} bg-opacity-10`} style={{ minWidth: '60px', textAlign: 'center' }}>
                        <i className={`bi ${icon} fs-3`}></i>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
