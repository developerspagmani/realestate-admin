'use client';

import React from 'react';

interface DiagnosticData {
    id: string;
    name: string;
    views: number;
    enquiries: number;
    status: 'Invisibility' | 'Rejection' | 'Dead-end';
    reason: string;
}

interface PerformanceDiagnosticsProps {
    data: DiagnosticData[];
}

const PerformanceDiagnostics: React.FC<PerformanceDiagnosticsProps> = ({ data }) => {
    const getBadgeColor = (status: string) => {
        switch (status) {
            case 'Invisibility': return 'bg-secondary';
            case 'Rejection': return 'bg-warning text-dark';
            case 'Dead-end': return 'bg-danger';
            default: return 'bg-primary';
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 transition-all">
            <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="fw-bold mb-0">Performance Diagnostics</h5>
                    <p className="text-muted small mb-0">Identifying why properties are not moving</p>
                </div>
                <div className="badge bg-primary-subtle text-primary rounded-pill px-3">AI Diagnostic Ready</div>
            </div>
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted">Property</th>
                            <th className="py-3 border-0 small text-uppercase fw-bold text-muted text-center">Engagement</th>
                            <th className="py-3 border-0 small text-uppercase fw-bold text-muted text-center">Diagnostic Zone</th>
                            <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted">Core Issue Identified</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3">
                                    <div className="fw-bold">{item.name}</div>
                                    <div className="extra-small text-muted">ID: {item.id}</div>
                                </td>
                                <td className="py-3 text-center">
                                    <div className="d-flex justify-content-center gap-3">
                                        <div className="text-center">
                                            <div className="fw-bold small">{item.views}</div>
                                            <div className="extra-small text-muted">Views</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="fw-bold small">{item.enquiries}</div>
                                            <div className="extra-small text-muted">Enq.</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 text-center">
                                    <span className={`badge ${getBadgeColor(item.status)} rounded-pill px-3 py-1 fs-12 uppercase`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="small text-muted ps-2 border-start border-3 border-primary-subtle italic">
                                        {item.reason}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
        .fs-12 { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
        .extra-small { font-size: 10px; }
      `}</style>
        </div>
    );
};

export default PerformanceDiagnostics;
