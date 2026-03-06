'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import Loader from '@/components/common/Loader';
import Toast from '@/components/common/Toast';
import { propIntelService } from '@/app/services/api';
import PerformanceDiagnostics from './PerformanceDiagnostics';
import PMFAnalysis from './PMFAnalysis';
import SuggestionEngine from './SuggestionEngine';
import StrategySessionModal from './StrategySessionModal';

export interface DiagnosticData {
    id: string;
    name: string;
    views: number;
    enquiries: number;
    status: 'Invisibility' | 'Rejection' | 'Dead-end';
    reason: string;
}

export interface PMFData {
    id: string;
    name: string;
    score: number;
    gap: string;
    trend: 'up' | 'down' | 'stable';
}

export interface AISuggestion {
    id: string;
    propertyName: string;
    type: 'Price' | 'Spec' | 'Content';
    impact: 'High' | 'Medium' | 'Low';
    suggestion: string;
    action: string;
}

export default function PropIntelManager() {
    const [loading, setLoading] = useState(true);
    const [diagnostics, setDiagnostics] = useState<DiagnosticData[]>([]);
    const [pmf, setPmf] = useState<PMFData[]>([]);
    const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
    const [showStrategyModal, setShowStrategyModal] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        loadPropIntelData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadPropIntelData = async () => {
        setLoading(true);
        try {
            const [diagRes, pmfRes, sugRes] = await Promise.all([
                propIntelService.getPerformanceDiagnostics(),
                propIntelService.getPMFAnalysis(),
                propIntelService.getSuggestions()
            ]);

            if (diagRes.success) {
                setDiagnostics(diagRes.data);
            }

            if (pmfRes.success) {
                setPmf(pmfRes.data);
            }

            if (sugRes.success) {
                setSuggestions(sugRes.data);
            }

        } catch (error) {
            console.error('Failed to load PropIntel data:', error);
            showToast('Failed to load intelligence data', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout activePage="propintel">
            <div className="container-fluid py-4">
                <header className="mb-5">
                    <div className="d-flex align-items-center gap-3 mb-2">
                        <div className="bg-danger bg-opacity-10 p-3 rounded-4">
                            <i className="bi bi-robot text-danger fs-3"></i>
                        </div>
                        <div>
                            <h2 className="fw-bold mb-0">PropIntel AI Dashboard</h2>
                            <p className="text-muted small mb-0">Deep property performance intelligence & actionable growth suggestions</p>
                        </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-3 justify-content-between align-items-center w-100">
                        <div className="d-flex gap-2">
                            <span className="badge bg-light text-dark border rounded-pill px-3 py-2"><i className="bi bi-cpu me-1"></i> Neural Engine: Active</span>
                            <span className="badge bg-light text-dark border rounded-pill px-3 py-2"><i className="bi bi-graph-up me-1"></i> Market Accuracy: 98.4%</span>
                            <span className="badge bg-light text-dark border rounded-pill px-3 py-2"><i className="bi bi-lightning-charge-fill text-warning me-1"></i> Recommendations Fresh</span>
                        </div>
                        <button
                            className="btn btn-primary rounded-pill px-4 btn-sm fw-bold shadow-sm hvr-grow"
                            onClick={loadPropIntelData}
                            disabled={loading}
                        >
                            <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin' : ''}`}></i>
                            {loading ? 'Analyzing Data...' : 'Refresh AI Intelligence'}
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="py-5">
                        <Loader message="Synthesizing property intelligence reports..." />
                    </div>
                ) : (
                    <div className="row">
                        <div className="col-12 col-xl-8">
                            <PerformanceDiagnostics data={diagnostics} />
                            <PMFAnalysis data={pmf} />
                            <SuggestionEngine suggestions={suggestions} />
                        </div>
                        <div className="col-12 col-xl-4">
                            <div className="card border-0 shadow-sm rounded-4 bg-danger bg-opacity-10 text-white p-4 position-relative overflow-hidden mb-4">
                                <div className="position-relative z-1">
                                    <h5 className="fw-bold mb-3">Professional Insight</h5>
                                    <p className="small mb-4 text-muted">Your portfolio efficiency is currently at 72.4%. We detected that optimizing descriptions for &quot;Remote Work Ready&quot; could increase your lead flow by up to 30% in the current market climate.</p>
                                    <button className="btn btn-light btn-sm rounded-pill px-4 fw-bold" onClick={() => setShowStrategyModal(true)}>Deep Strategy Session</button>
                                </div>
                                <i className="bi bi-stars position-absolute top-0 end-0 m-4 opacity-25 display-1"></i>
                            </div>
                            <div className="card border-0 shadow-sm rounded-4 p-4 border-start border-3 border-info">
                                <h6 className="fw-bold fs-14 mb-2">Upcoming Market Trend</h6>
                                <p className="extra-small text-muted mb-0 font-monospace">Eco-friendly amenities are trending +22% in search intent this week. Align your &quot;Spec&quot; optimization with Sustainable Living keywords for better reach.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <StrategySessionModal
                show={showStrategyModal}
                onClose={() => setShowStrategyModal(false)}
                portfolioEfficiency={pmf.length > 0 ? Math.round(pmf.reduce((acc, curr) => acc + curr.score, 0) / pmf.length) : 72.4}
                diagnostics={diagnostics}
                pmf={pmf}
                suggestions={suggestions}
            />

            <style jsx>{`
        .fs-14 { font-size: 14px; }
        .extra-small { font-size: 11px; }
        .bg-primary { background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%); }
      `}</style>
        </MainLayout >
    );
}
