'use client';

import { useState, useEffect } from 'react';
import Loader from '@/components/common/Loader';
import { marketingService, getAuthToken } from '@/app/services/api';
import Toast from '@/components/common/Toast';

interface LeadInteraction {
    id: string;
    type: string;
    scoreWeight: number;
    occurredAt: string;
    metadata?: any;
}

interface LeadEngagementInsightsProps {
    leadId: string;
    leadName: string;
    leadScore: number;
    onClose: () => void;
}

export default function LeadEngagementInsights({ leadId, leadName, leadScore, onClose }: LeadEngagementInsightsProps) {
    const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [activeView, setActiveView] = useState<'timeline' | 'recommendations' | 'report'>('timeline');

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const [intRes, recRes] = await Promise.all([
                marketingService.getLeadInteractions(token, leadId),
                marketingService.getRecommendations(token, leadId)
            ]);

            if (intRes.success) setInteractions(intRes.data);
            if (recRes.success) setRecommendations(recRes.data);

        } catch (error) {
            console.error('Failed to load insight data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [leadId]);

    const handleSendRecommendation = async () => {
        try {
            setSending(true);
            const token = getAuthToken();
            if (!token) return;

            const res = await marketingService.sendRecommendations(token, leadId);
            if (res.success) {
                setToast({ show: true, message: 'Success: Recommendation email has been sent to the lead.', type: 'success' });
                loadData(); // Reload to show the EMAIL_SENT interaction
            } else {
                setToast({ show: true, message: 'Error: ' + res.message, type: 'error' });
            }
        } catch (error) {
            console.error('Send error:', error);
            setToast({ show: true, message: 'Error: Failed to send recommendation email', type: 'error' });
        } finally {
            setSending(false);
        }
    };

    const getInteractionIcon = (type: string) => {
        switch (type) {
            case 'EMAIL_OPEN': return 'bi-envelope-open text-primary';
            case 'EMAIL_CLICK': return 'bi-cursor text-info';
            case 'PROPERTY_VIEW': return 'bi-building text-primary';
            case 'UNIT_VIEW': return 'bi-building text-primary';
            case 'WIDGET_VIEW': return 'bi-grid-3x3-gap text-primary';
            case 'FORM_SUBMIT': return 'bi-file-earmark-check-fill text-success';
            case 'FORM_INIT': return 'bi-pencil-square text-warning';
            case 'LEAD_SUBMITTED': return 'bi-person-check-fill text-success';
            case 'POPUP_SUBMIT': return 'bi-megaphone-fill text-warning';
            case 'POPUP_VIEW': return 'bi-eye-fill text-info';
            case 'CHAT_INIT': return 'bi-chat-dots text-secondary';
            case 'CHAT_START_CONVERSATION': return 'bi-chat-heart-fill text-danger';
            case 'BOOKING_REQUEST': return 'bi-calendar-check text-danger';
            case 'BOOKING_STEP_START': return 'bi-calendar-plus text-warning';
            case 'UNIT_BOOKING_START': return 'bi-calendar-plus text-danger';
            case 'BROCHURE_DOWNLOAD': return 'bi-file-pdf text-danger';
            case 'FLOOR_PLAN_VIEW': return 'bi-map text-info';
            default: return 'bi-activity text-muted';
        }
    };

    return (
        <div className="offcanvas offcanvas-end show border-0 shadow-lg" style={{ visibility: 'visible', width: '750px', zIndex: 1050 }}>
            <div className="offcanvas-header border-bottom p-4 bg-white sticky-top">
                <div>
                    <h5 className="offcanvas-title fw-bold mb-1">{leadName}</h5>
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary rounded-4">Score: {leadScore}</span>
                        <span className="text-muted extra-small"><i className="bi bi-person me-1"></i> Lead Insights</span>
                    </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
            </div>

            <div className="offcanvas-body p-0 d-flex flex-column">
                <div className="px-4 py-3 bg-light border-bottom sticky-top" style={{ top: '0', zIndex: 10 }}>
                    <ul className="nav nav-pills nav-fill bg-white p-1 rounded-4 shadow-sm border">
                        <li className="nav-item">
                            <button
                                className={`nav-link rounded-4 extra-small fw-bold transition-all ${activeView === 'timeline' ? 'active bg-primary' : 'text-muted border-0 bg-transparent'}`}
                                onClick={() => setActiveView('timeline')}
                            >
                                <i className="bi bi-clock-history me-1"></i> Timeline
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link rounded-4 extra-small fw-bold transition-all ${activeView === 'recommendations' ? 'active bg-primary' : 'text-muted border-0 bg-transparent'}`}
                                onClick={() => setActiveView('recommendations')}
                            >
                                <i className="bi bi-magic me-1"></i> AI Matches
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link rounded-4 extra-small fw-bold transition-all ${activeView === 'report' ? 'active bg-primary' : 'text-muted border-0 bg-transparent'}`}
                                onClick={() => setActiveView('report')}
                            >
                                <i className="bi bi-bar-chart-line me-1"></i> Analysis
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="flex-grow-1 p-4">
                    {loading ? (
                        <div className="text-center py-5 mt-5">
                            <Loader size="sm" message="" />
                            <div className="text-muted extra-small italic">Analyzing lead behavior...</div>
                        </div>
                    ) : (
                        <>
                            {activeView === 'timeline' && (
                                <div className="animate-fade-in">
                                    <h6 className="fw-bold extra-small text-muted text-uppercase mb-4 track-wider">Engagement Journey</h6>
                                    {interactions.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                                                <i className="bi bi-clock-history display-6 text-muted opacity-25"></i>
                                            </div>
                                            <p className="text-muted small">No interactions recorded for this lead yet.</p>
                                        </div>
                                    ) : (
                                        <div className="timeline-container px-2">
                                            {interactions.map((item, index) => (
                                                <div key={item.id} className="timeline-item pb-4 position-relative">
                                                    {index !== interactions.length - 1 && (
                                                        <div className="timeline-line position-absolute" style={{
                                                            left: '12px', top: '24px', bottom: '0', width: '2px', backgroundColor: '#eef0f2'
                                                        }}></div>
                                                    )}
                                                    <div className="d-flex gap-3 position-relative">
                                                        <div className="bg-white rounded-circle shadow-sm border d-flex align-items-center justify-content-center"
                                                            style={{ width: '26px', height: '26px', minWidth: '26px', zIndex: 1 }}>
                                                            <i className={`bi ${getInteractionIcon(item.type)}`} style={{ fontSize: '12px' }}></i>
                                                        </div>
                                                        <div className="flex-grow-1 bg-white p-2 rounded-3 border-light shadow-xs">
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div className="extra-small text-muted d-flex align-items-center gap-2">
                                                                    {item.type === 'PROPERTY_VIEW' ? 'VIEWED PROPERTY' :
                                                                        item.type === 'UNIT_VIEW' ? 'VIEWED UNIT' :
                                                                            item.type === 'WIDGET_VIEW' ? 'WIDGET VIEWED' :
                                                                                item.type === 'WEBSITE_VIEW' ? 'WEBSITE ACCESSED' :
                                                                                    item.type === 'POPUP_SUBMIT' ? 'POPUP SUBMITTED' :
                                                                                        item.type === 'POPUP_VIEW' ? 'POPUP VIEWED' :
                                                                                            item.type === 'FORM_INIT' ? 'STARTED INQUIRY FORM' :
                                                                                                item.type === 'FORM_SUBMIT' ? 'SUBMITTED INQUIRY' :
                                                                                                    item.type === 'CHAT_INIT' ? 'OPENED CHAT' :
                                                                                                        item.type === 'CHAT_START_CONVERSATION' ? 'STARTED CHAT CONVERSATION' :
                                                                                                            item.type === 'BOOKING_STEP_START' ? 'CLICKED RESERVE' :
                                                                                                                item.type === 'BROCHURE_DOWNLOAD' ? 'DOWNLOADED BROCHURE' :
                                                                                                                    item.type === 'FLOOR_PLAN_VIEW' ? 'VIEWED FLOOR PLAN' :
                                                                                                                        item.type.replace(/_/g, ' ')}
                                                                    {item.scoreWeight > 0 && <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2" style={{ fontSize: '9px' }}>+{item.scoreWeight}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="text-muted" style={{ fontSize: '0.65rem' }}>{new Date(item.occurredAt).toLocaleString()}</div>
                                                            {(item.metadata?.propertyTitle || item.metadata?.propertyId) && (
                                                                <div className="mt-2 p-2 bg-light rounded-2 border extra-small text-dark fw-medium">
                                                                    <i className="bi bi-house-heart me-1 text-primary"></i> 
                                                                    {item.metadata.propertyTitle || `Property #${item.metadata.propertyId?.substring(0,8)}`}
                                                                    {item.metadata?.unitCode && <span className="text-muted ms-2">• Unit: {item.metadata.unitCode}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeView === 'recommendations' && (
                                <div className="animate-fade-in">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h6 className="fw-bold extra-small text-muted text-uppercase mb-0 track-wider">Matching Opportunities</h6>
                                        <span className="badge bg-primary-soft text-primary border-0 extra-small">{recommendations.length} Matches</span>
                                    </div>

                                    {recommendations.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                                                <i className="bi bi-robot display-6 text-muted opacity-25"></i>
                                            </div>
                                            <h6 className="fw-bold small mb-1">Incomplete Profile</h6>
                                            <p className="text-muted extra-small px-4">We need more interaction data (property views, etc.) to generate accurate AI matches.</p>
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {recommendations.map((rec: any) => (
                                                <div key={rec.id} className="card border-0 shadow-sm rounded-4 overflow-hidden recommendation-card transition-all">
                                                    <div className="card-body p-3">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <h6 className="fw-bold small mb-0 text-dark">{rec.title}</h6>
                                                            <div className="text-end">
                                                                <div className={`fw-bold small ${rec.matchScore >= 80 ? 'text-success' : 'text-warning'}`}>
                                                                    {rec.matchScore}% Match
                                                                </div>
                                                                <div className="progress mt-1" style={{ height: '3px', width: '40px' }}>
                                                                    <div className={`progress-bar ${rec.matchScore >= 80 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${rec.matchScore}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="extra-small text-muted mb-3"><i className="bi bi-geo-alt me-1"></i> {rec.city}, {rec.propertyType}</div>

                                                        <div className="bg-light rounded-3 p-2 mb-3 border">
                                                            <div className="extra-small fw-bold text-muted mb-2 px-1">Top Matching Units</div>
                                                            {rec.units?.slice(0, 2).map((u: any) => (
                                                                <div key={u.id} className="d-flex justify-content-between align-items-center py-1 px-1 border-bottom border-white last-border-0">
                                                                    <span className="extra-small fw-medium text-dark">{u.unitCode}</span>
                                                                    <span className="extra-small text-primary fw-bold">${Number(u.price).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <button
                                                            className="btn btn-primary w-100 btn-sm rounded-4 extra-small fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                                                            onClick={handleSendRecommendation}
                                                            disabled={sending}
                                                        >
                                                            {sending ? (
                                                                <Loader size="sm" message="" />
                                                            ) : (
                                                                <i className="bi bi-send-fill" style={{ fontSize: '10px' }}></i>
                                                            )}
                                                            {sending ? 'Sending...' : 'Send Suggestion to Lead'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeView === 'report' && (
                                <div className="animate-fade-in">
                                    <h6 className="fw-bold extra-small text-muted text-uppercase mb-4 track-wider">Performance Metrics</h6>

                                    <div className="row g-3 mb-4">
                                        <div className="col-6">
                                            <div className="bg-white p-3 rounded-4 border shadow-xs h-100">
                                                <span className="extra-small text-muted d-block mb-1">Lead Temperature</span>
                                                <div className="fw-bold d-flex align-items-center gap-2">
                                                    {leadScore > 100 ? '🔥 Hot' : leadScore > 40 ? '⚡ Warm' : '❄️ Cold'}
                                                    <div className="flex-grow-1 progress" style={{ height: '4px' }}>
                                                        <div className={`progress-bar ${leadScore > 100 ? 'bg-danger' : leadScore > 40 ? 'bg-warning' : 'bg-info'}`} style={{ width: `${Math.min(leadScore, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="bg-white p-3 rounded-4 border shadow-xs h-100">
                                                <span className="extra-small text-muted d-block mb-1">Conversion Prop.</span>
                                                <div className="fw-bold fs-5">
                                                    {Math.min(25 + (interactions.length * 2) + (interactions.some(i => i.type === 'FORM_SUBMIT') ? 30 : 0), 98)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-4 border shadow-sm mb-4">
                                        <h6 className="fw-bold extra-small text-muted text-uppercase mb-3">Interaction Velocity</h6>
                                        <div className="d-flex justify-content-between align-items-end" style={{ height: '60px' }}>
                                            {[15, 45, 25, 65, 35, 85, 20].map((h, i) => (
                                                <div key={i} className="bg-primary rounded-4 opacity-25" style={{ width: '8%', height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                        <div className="mt-3 d-flex justify-content-between extra-small text-muted">
                                            <span>Total Events: <strong>{interactions.length}</strong></span>
                                            <span>Frequency: <strong>High</strong></span>
                                        </div>
                                    </div>

                                    <div className="card border-0 bg-dark text-white rounded-4 p-4 shadow-lg mb-4">
                                        <h6 className="text-white extra-small text-uppercase mb-3">Predicted Intent Markers</h6>
                                        <div className="d-flex flex-column gap-3">
                                            {interactions.some(i => i.type === 'BOOKING_STEP_START' || i.type === 'UNIT_BOOKING_START') && (
                                                <div className="d-flex align-items-center gap-3 animate-fade-in">
                                                    <div className="bg-danger bg-opacity-20 rounded-circle p-2"><i className="bi bi-calendar-check text-danger"></i></div>
                                                    <div><div className="extra-small fw-bold">Intent: High Purchase Probability</div><div className="extra-small text-muted opacity-75">Started reservation process.</div></div>
                                                </div>
                                            )}
                                            {interactions.some(i => i.type === 'CHAT_START_CONVERSATION') && (
                                                <div className="d-flex align-items-center gap-3 animate-fade-in">
                                                    <div className="bg-primary bg-opacity-20 rounded-circle p-2"><i className="bi bi-chat-heart text-primary"></i></div>
                                                    <div><div className="extra-small fw-bold">Engagement: Conversational Interest</div><div className="extra-small text-muted opacity-75">Interacted with Virpa AI chatbot.</div></div>
                                                </div>
                                            )}
                                            {interactions.some(i => i.type === 'BROCHURE_DOWNLOAD') && (
                                                <div className="d-flex align-items-center gap-3 animate-fade-in">
                                                    <div className="bg-warning bg-opacity-20 rounded-circle p-2"><i className="bi bi-file-pdf text-warning"></i></div>
                                                    <div><div className="extra-small fw-bold">Research: Deep Analysis</div><div className="extra-small text-muted opacity-75">Downloaded property brochure.</div></div>
                                                </div>
                                            )}
                                            {interactions.filter(i => i.type === 'PROPERTY_VIEW').length > 5 && (
                                                <div className="d-flex align-items-center gap-3 animate-fade-in">
                                                    <div className="bg-info bg-opacity-20 rounded-circle p-2"><i className="bi bi-eye text-info"></i></div>
                                                    <div><div className="extra-small fw-bold">Discovery: Frequent Navigator</div><div className="extra-small text-muted opacity-75">Viewed 5+ property pages.</div></div>
                                                </div>
                                            )}
                                            {!interactions.some(i => ['BOOKING_STEP_START', 'CHAT_START_CONVERSATION', 'FORM_SUBMIT', 'BROCHURE_DOWNLOAD'].includes(i.type)) && (
                                                <div className="d-flex align-items-center gap-3 opacity-50">
                                                    <div className="bg-light rounded-circle p-2"><i className="bi bi-lightning text-muted"></i></div>
                                                    <div><div className="extra-small fw-bold">Status: Passive Research</div><div className="extra-small text-muted">Lead is browsing without high-intent actions yet.</div></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="activity-summary bg-light rounded-4 p-3 mb-4">
                                        <h6 className="fw-bold extra-small mb-3">Session Breakdown</h6>
                                        <div className="d-flex flex-column gap-2">
                                            {[
                                                { label: 'Property Views', count: interactions.filter(i => ['PROPERTY_VIEW', 'UNIT_VIEW', 'WIDGET_VIEW'].includes(i.type)).length, color: 'text-primary' },
                                                { label: 'Form Inquiries', count: interactions.filter(i => i.type === 'FORM_SUBMIT').length, color: 'text-warning' },
                                                { label: 'AI Chat Matches', count: interactions.filter(i => i.type === 'CHAT_INIT').length, color: 'text-info' },
                                                { label: 'Email Interactions', count: interactions.filter(i => i.type.startsWith('EMAIL')).length, color: 'text-primary' },
                                            ].map((item, idx) => (
                                                <div key={idx} className="d-flex justify-content-between align-items-center extra-small py-1 border-bottom border-white last-border-0">
                                                    <span className="text-muted">{item.label}</span>
                                                    <span className={`fw-bold ${item.color}`}>{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ show: false, message: '', type: 'success' })}
            />

            <style jsx>{`
                .extra-small { font-size: 0.7rem; }
                .track-wider { letter-spacing: 0.05em; }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .offcanvas { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); border-left: 1px solid rgba(0,0,0,0.05) !important; }
                .recommendation-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.08) !important; }
                .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .last-border-0:last-child { border-bottom: 0 !important; }
            `}</style>
        </div>
    );
}
