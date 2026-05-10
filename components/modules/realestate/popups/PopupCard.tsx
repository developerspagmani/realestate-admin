'use client';

import { WebsitePopup } from '@/types';

interface PopupCardProps {
    popup: WebsitePopup;
    websiteName: string;
    onEdit: (popup: WebsitePopup) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (popup: WebsitePopup) => void;
    onViewSubmissions: (popup: WebsitePopup) => void;
}

export default function PopupCard({ popup, websiteName, onEdit, onDelete, onToggleStatus, onViewSubmissions }: PopupCardProps) {
    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'modal': return <span className="badge bg-primary-soft text-primary px-2 py-1 rounded-pill">Modal</span>;
            case 'banner': return <span className="badge bg-info-soft text-info px-2 py-1 rounded-pill">Banner</span>;
            case 'slide_in': return <span className="badge bg-warning-soft text-warning px-2 py-1 rounded-pill">Slide-in</span>;
            default: return <span className="badge bg-secondary-soft text-secondary px-2 py-1 rounded-pill">{type}</span>;
        }
    };

    const getTriggerInfo = (trigger: string, value?: string) => {
        switch (trigger) {
            case 'on_load': return 'Immediately on load';
            case 'exit_intent': return 'On exit intent';
            case 'scroll': return `After ${value || '0'}% scroll`;
            case 'delay': return `After ${value || '0'} seconds delay`;
            default: return trigger;
        }
    };

    return (
        <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden transition-all hover-translate-y">
            <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex flex-column gap-1">
                        <h5 className="fw-bold mb-0 text-dark">{popup.name}</h5>
                        <div className="text-muted small">
                            <i className="bi bi-globe me-1"></i> {websiteName}
                        </div>
                    </div>
                    <div className="form-check form-switch p-0 m-0">
                        <input
                            className="form-check-input ms-0 cursor-pointer"
                            type="checkbox"
                            checked={popup.isActive}
                            onChange={() => onToggleStatus(popup)}
                            style={{ width: '40px', height: '20px' }}
                        />
                    </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mb-3">
                    {getTypeBadge(popup.type)}
                    <span className="badge bg-light text-dark px-2 py-1 rounded-pill border">
                        <i className="bi bi-lightning-charge me-1"></i> {getTriggerInfo(popup.trigger, popup.triggerValue)}
                    </span>
                    {popup.content?.isIntelligentEnabled && (
                        <span className="badge magic-glitter-badge px-2 py-1 rounded-pill border-0 text-white">
                            <i className="bi bi-magic me-1"></i> Intelligent Match
                        </span>
                    )}
                </div>

                <div className="bg-light p-3 rounded-3 mb-4">
                    <div className="fw-bold small mb-1">Preview Content:</div>
                    <div className="text-truncate small text-muted">
                        {popup.content?.title || 'No Title'}
                    </div>
                    {popup.content?.marketingFormId && (
                        <div className="text-primary small mt-1">
                            <i className="bi bi-layout-text-window-reverse me-1"></i> Marketing Form Linked
                        </div>
                    )}
                </div>

                <div className="d-flex flex-wrap gap-2">
                    <button
                        className="btn btn-light border btn-sm rounded-pill flex-grow-1 fw-bold"
                        onClick={() => onEdit(popup)}
                    >
                        <i className="bi bi-pencil me-1"></i> Edit
                    </button>
                    <button
                        className="btn btn-primary-soft text-primary border-0 btn-sm rounded-pill flex-grow-1 fw-bold"
                        onClick={() => {
                            if (typeof onViewSubmissions === 'function') {
                                onViewSubmissions(popup);
                            } else {
                                console.error('onViewSubmissions is not a function in PopupCard', { onViewSubmissions });
                            }
                        }}
                    >
                        <i className="bi bi-people me-1"></i> Audience
                    </button>
                    <button
                        className="btn btn-outline-danger btn-sm rounded-pill px-3"
                        onClick={() => onDelete(popup.id)}
                    >
                        <i className="bi bi-trash"></i>
                    </button>
                </div>
            </div>

            <style jsx>{`
                .hover-translate-y:hover {
                    transform: translateY(-5px);
                }
                .magic-glitter-badge {
                    background: linear-gradient(135deg, #8e44ad, #c0392b, #2980b9);
                    background-size: 200% 200%;
                    animation: gradientShift 3s ease infinite;
                    box-shadow: 0 4px 10px rgba(142, 68, 173, 0.3);
                }
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        </div>
    );
}
