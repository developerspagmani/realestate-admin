'use client';

import React from 'react';

interface Suggestion {
    id: string;
    propertyName: string;
    type: 'Price' | 'Spec' | 'Content';
    impact: 'High' | 'Medium' | 'Low';
    suggestion: string;
    action: string;
}

interface SuggestionEngineProps {
    suggestions: Suggestion[];
}

const SuggestionEngine: React.FC<SuggestionEngineProps> = ({ suggestions }) => {
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Price': return 'bi-tag-fill text-primary';
            case 'Spec': return 'bi-tools text-secondary';
            case 'Content': return 'bi-file-richtext-fill text-info';
            default: return 'bi-lightbulb-fill';
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'High': return 'text-success fw-bold';
            case 'Medium': return 'text-warning fw-bold';
            case 'Low': return 'text-secondary fw-bold';
            default: return '';
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 transition-all hover-up">
            <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="fw-bold mb-0">Intelligent Suggestion Engine</h5>
                    <p className="text-muted small mb-0">AI-driven optimizations to increase conversion</p>
                </div>
                <div className="badge bg-warning-subtle text-dark rounded-pill px-3 fw-bold">Prescriptive Engine</div>
            </div>
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted">Asset Name</th>
                            <th className="py-3 border-0 small text-uppercase fw-bold text-muted text-center">AI Optimization</th>
                            <th className="py-3 border-0 small text-uppercase fw-bold text-muted text-center">ROI Impact</th>
                            <th className="px-4 py-3 border-0 small text-uppercase fw-bold text-muted text-end">AI Action Item</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suggestions.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3">
                                    <div className="fw-bold fs-14">{item.propertyName}</div>
                                    <div className="extra-small text-muted">{item.id}</div>
                                </td>
                                <td className="py-3 text-center">
                                    <div className="d-flex align-items-center justify-content-center gap-2">
                                        <i className={`bi ${getTypeIcon(item.type)} fs-5 opacity-75`}></i>
                                        <span className="small">{item.type} Optimization</span>
                                    </div>
                                </td>
                                <td className="py-3 text-center">
                                    <span className={`small ${getImpactColor(item.impact)}`}>
                                        {item.impact}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-end">
                                    <button className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold extra-small transition-all">
                                        Apply: {item.action}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx>{`
        .fs-14 { font-size: 14px; }
        .extra-small { font-size: 10px; }
        .hover-up:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; }
      `}</style>
        </div>
    );
};

export default SuggestionEngine;
