'use client';

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DiagnosticData, PMFData, AISuggestion } from './PropIntelManager';

interface StrategySessionModalProps {
    show: boolean;
    onClose: () => void;
    portfolioEfficiency: number;
    diagnostics: DiagnosticData[];
    pmf: PMFData[];
    suggestions: AISuggestion[];
}

const StrategySessionModal: React.FC<StrategySessionModalProps> = ({
    show,
    onClose,
    portfolioEfficiency,
    diagnostics,
    pmf,
    suggestions
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    if (!show) return null;

    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF();
            const timestamp = new Date().toLocaleString();

            // --- Header & Title ---
            doc.setFillColor(220, 53, 69); // Danger color
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('PropIntel AI Strategy Report', 15, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${timestamp}`, 150, 25);

            // --- Executive Summary ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('1. Executive Summary', 15, 55);

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text([
                `Current Portfolio Efficiency: ${portfolioEfficiency}%`,
                `Total Properties Analyzed: ${diagnostics.length}`,
                `Critical Suggestions: ${suggestions.filter(s => s.impact === 'High').length}`,
                '',
                'This report provides a deep analytical breakdown of your real estate portfolio performance,',
                'identifying friction points in the conversion funnel and suggesting data-driven optimizations.'
            ], 15, 65);

            // --- Performance Diagnostics Table ---
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('2. Performance Diagnostics', 15, 105);

            autoTable(doc, {
                startY: 110,
                head: [['Property name', 'Views', 'Enquiries', 'Zone', 'Primary Issue']],
                body: diagnostics.map(d => [
                    d.name,
                    d.views.toString(),
                    d.enquiries.toString(),
                    d.status,
                    d.reason
                ]),
                headStyles: { fillColor: [220, 53, 69] },
                margin: { left: 15, right: 15 }
            });

            // --- PMF Analysis Section ---
            const finalY = (doc as any).lastAutoTable.finalY || 150;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('3. Product-Market Fit (PMF) Accuracy', 15, finalY + 15);

            autoTable(doc, {
                startY: finalY + 20,
                head: [['Property', 'Score', 'Identified Gap', 'Trend']],
                body: pmf.map(p => [
                    p.name,
                    `${p.score}%`,
                    p.gap,
                    p.trend.toUpperCase()
                ]),
                headStyles: { fillColor: [13, 110, 253] }, // Primary color
                margin: { left: 15, right: 15 }
            });

            // --- AI Strategic Recommendations ---
            const sugY = (doc as any).lastAutoTable.finalY || 220;
            if (sugY > 230) doc.addPage();

            const currentY = sugY > 230 ? 25 : sugY + 15;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('4. Actionable AI Recommendations', 15, currentY);

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Property', 'Type', 'Impact', 'Strategic Suggestion', 'Immediate Action']],
                body: suggestions.map(s => [
                    s.propertyName,
                    s.type,
                    s.impact,
                    s.suggestion,
                    s.action
                ]),
                headStyles: { fillColor: [25, 135, 84] }, // Success color
                margin: { left: 15, right: 15 }
            });

            // --- Footer ---
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`PropIntel AI - Proprietary Intelligence Report - Page ${i} of ${pageCount}`, 75, 290);
            }

            doc.save(`PropIntel_Detailed_Strategy_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Dynamic Logic for UI (Simulated)
    const highImpactSugs = suggestions.filter(s => s.impact === 'High');
    const criticalGaps = pmf.filter(p => p.score < 60).slice(0, 3);
    const rejectionZoneCount = diagnostics.filter(d => d.status === 'Rejection').length;

    const baseGrowth = (portfolioEfficiency / 20).toFixed(1);
    const optimisticGrowth = ((portfolioEfficiency / 20) * 1.5).toFixed(1);
    const lowGrowth = ((portfolioEfficiency / 20) * 0.4).toFixed(1);

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header bg-danger text-white border-0 py-3 px-4">
                        <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-robot fs-4"></i>
                            <h5 className="modal-title fw-bold text-white">Deep AI Strategy Session</h5>
                        </div>
                        <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4 bg-light">
                        <div className="row g-4">
                            {/* Score Card */}
                            <div className="col-12 col-md-4">
                                <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100 border-top border-4 border-danger">
                                    <h6 className="text-muted small text-uppercase fw-bold mb-3">Portfolio Efficiency</h6>
                                    <div className="display-4 fw-bold text-danger mb-2">{portfolioEfficiency}%</div>
                                    <div className="progress rounded-pill mb-3" style={{ height: '10px' }}>
                                        <div className="progress-bar bg-danger" style={{ width: `${portfolioEfficiency}%` }}></div>
                                    </div>
                                    <p className="extra-small text-muted mb-0">Calculated based on 30-day conversion velocity and search resonance.</p>
                                </div>
                            </div>

                            {/* Insight Areas */}
                            <div className="col-12 col-md-8">
                                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                        <i className="bi bi-lightning-charge text-warning"></i>
                                        Strategic Priorities
                                    </h6>
                                    <div className="d-grid gap-3">
                                        <div className="p-3 bg-white rounded-4 border-start border-4 border-primary">
                                            <div className="fw-bold fs-14">High-Yield Content Expansion</div>
                                            <p className="extra-small text-muted mb-0">
                                                {rejectionZoneCount > 0
                                                    ? `${rejectionZoneCount} properties in Rejection Zone require high-resolution video walkthroughs. AI detects 40% higher engagement on properties with "Living Experience" descriptions.`
                                                    : "Your content engagement is stable. Maintain current description quality to sustain lead flow."}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white rounded-4 border-start border-4 border-success">
                                            <div className="fw-bold fs-14">Market Equilibrium Pricing</div>
                                            <p className="extra-small text-muted mb-0">
                                                {highImpactSugs.some(s => s.type === 'Price')
                                                    ? `Dynamic price adjustment for ${highImpactSugs.find(s => s.type === 'Price')?.propertyName} is projected to trigger dormant leads and improve conversion.`
                                                    : "Pricing strategy is aligned with market benchmarks. No immediate radical shifts required."}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white rounded-4 border-start border-4 border-info">
                                            <div className="fw-bold fs-14">Amenity Resonance Sync</div>
                                            <p className="extra-small text-muted mb-0">
                                                {criticalGaps.length > 0
                                                    ? `Gaps identified: ${criticalGaps.map(g => g.gap).join(', ')}. Syncing these amenities will boost visibility by ~22%.`
                                                    : "Amenity alignment is high. Focus on content presentation to differentiate from competitors."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trend Map */}
                            <div className="col-12">
                                <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark text-white">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0 text-white">Predictive Revenue Forecast (90 Days)</h6>
                                        <span className="badge bg-danger rounded-pill px-3">AI Projection</span>
                                    </div>
                                    <div className="row g-3 text-center">
                                        <div className="col-4">
                                            <div className="text-muted extra-small">Optimistic</div>
                                            <div className="fw-bold text-success fs-5">+{optimisticGrowth}%</div>
                                        </div>
                                        <div className="col-4 border-start border-end border-secondary">
                                            <div className="text-muted extra-small">Baseline</div>
                                            <div className="fw-bold text-info fs-5">+{baseGrowth}%</div>
                                        </div>
                                        <div className="col-4">
                                            <div className="text-muted extra-small">Risk-Averse</div>
                                            <div className="fw-bold text-warning fs-5">+{lowGrowth}%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Final Call */}
                            <div className="col-12">
                                <div className="bg-danger bg-opacity-10 border-0 shadow-sm rounded-4 p-4 mb-0 d-flex align-items-center gap-4">
                                    <div className="display-6"><i className="bi bi-robot"></i></div>
                                    <div>
                                        <h6 className="fw-bold mb-1">Deep Strategy recommendation:</h6>
                                        <p className="small mb-0 text-dark">
                                            {highImpactSugs.length > 0
                                                ? `Execute the "${highImpactSugs[0].action}" for ${highImpactSugs[0].propertyName} immediately to capture the current market surge.`
                                                : "Continue monitoring market trends. Your portfolio is currently performing within target parameters."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer bg-white border-0 py-3 px-4">
                        <button type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-bold shadow-sm" onClick={onClose}>Close Session</button>
                        <button
                            type="button"
                            className="btn btn-danger rounded-pill px-4 fw-bold shadow-sm hvr-grow"
                            onClick={handleGeneratePDF}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Generating Detailed Report...
                                </>
                            ) : (
                                'Generate Full PDF Strategy'
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .fs-14 { font-size: 14px; }
                .extra-small { font-size: 11px; }
                .hvr-grow { transition: all .2s ease-in-out; }
                .hvr-grow:hover { transform: scale(1.05); }
            `}</style>
        </div>
    );
};

export default StrategySessionModal;
