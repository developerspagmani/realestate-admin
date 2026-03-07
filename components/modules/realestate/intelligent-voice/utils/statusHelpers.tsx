import React from 'react';

export const getStatusBadge = (status: number, type: 'lead' | 'booking') => {
    if (type === 'lead') {
        switch (status) {
            case 1: return <span className="badge bg-primary-subtle text-primary">New</span>;
            case 2: return <span className="badge bg-info-subtle text-info">Contacted</span>;
            case 3: return <span className="badge bg-success-subtle text-success">Qualified</span>;
            case 4: return <span className="badge bg-danger-subtle text-danger">Lost</span>;
            default: return <span className="badge bg-secondary-subtle text-secondary">Unknown</span>;
        }
    } else {
        switch (status) {
            case 1: return <span className="badge bg-warning-subtle text-warning">Pending</span>;
            case 2: return <span className="badge bg-success-subtle text-success">Confirmed</span>;
            case 3: return <span className="badge bg-danger-subtle text-danger">Cancelled</span>;
            case 4: return <span className="badge bg-secondary-subtle text-secondary">Completed</span>;
            default: return <span className="badge bg-secondary-subtle text-secondary">Unknown</span>;
        }
    }
};
