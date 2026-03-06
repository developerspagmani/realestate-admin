'use client';

import React from 'react';

interface PMFData {
    id: string;
    name: string;
    score: number;
    gap: string;
    trend: 'up' | 'down' | 'stable';
}

interface PMFAnalysisProps {
    data: PMFData[];
}

const PMFAnalysis: React.FC<PMFAnalysisProps> = ({ data }) => {
    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 transition-all">
            <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="fw-bold mb-0">Product-Market Fit (PMF) Analysis</h5>
                    <p className="text-muted small mb-0">How well the property matches current market demand</p>
                </div>
                <div className="badge bg-success-subtle text-success rounded-pill px-3 fw-bold">Market-Sync: Active</div>
            </div>
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted">Asset</th>
                            <th className="py-3 border-0 small text-uppercase fw-bold text-muted text-center">PMF Accuracy</th>
                            <th className="py-3 border-0 small text-uppercase fw-bold text-muted text-center">Trend Indicator</th>
                            <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted">Feature Gap Identified</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3">
                                    <div className="fw-bold">{item.name}</div>
                                    <div className="extra-small text-muted">Category Fit: High</div>
                                </td>
                                <td className="py-3 text-center">
                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                        <div className="progress w-100" style={{ height: '8px', maxWidth: '100px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                                            <div className={`progress-bar rounded-pill ${item.score < 50 ? 'bg-danger' : item.score < 75 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${item.score}%` }}></div>
                                        </div>
                                        <span className="fw-bold small">{item.score}%</span>
                                    </div>
                                </td>
                                <td className="py-3 text-center">
                                    <span className={`badge ${item.trend === 'up' ? 'bg-success-soft text-success' : item.trend === 'down' ? 'bg-danger-soft text-danger' : 'bg-secondary-soft text-secondary'} rounded-pill px-3 py-1 fs-12 uppercase`}>
                                        <i className={`bi bi-arrow-${item.trend === 'up' ? 'up-short' : item.trend === 'down' ? 'down-short' : 'right-short'} me-1`}></i>
                                        {item.trend}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="small text-muted ps-2 border-start border-3 border-success-subtle italic">
                                        {item.gap}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
        .fs-12 { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
        .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
        .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
        .bg-secondary-soft { background-color: rgba(108, 117, 125, 0.1); }
      `}</style>
        </div>
    );
};

export default PMFAnalysis;
