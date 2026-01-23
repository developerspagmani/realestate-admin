'use client';

import React from 'react';

interface WidgetCardProps {
    widget: any;
    tenantType: number;
    onEdit: (widget: any) => void;
    onDelete: (id: string) => void;
    onCopyEmbed: (uniqueId: string) => void;
    onCopyShortLink: (uniqueId: string) => void;
    onShowQR?: (widget: any) => void;
}

export default function WidgetCard({
    widget,
    tenantType,
    onEdit,
    onDelete,
    onCopyEmbed,
    onCopyShortLink,
    onShowQR
}: WidgetCardProps) {
    return (
        <div key={widget.id} className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden hvr-float">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="bg-primary-soft rounded-circle px-3 py-2">
                            <i className="bi bi-window text-primary fs-4"></i>
                        </div>
                        <div className="dropdown">
                            <button className="btn btn-link text-muted p-0" data-bs-toggle="dropdown">
                                <i className="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3">
                                <li>
                                    <button className="dropdown-item py-2" onClick={() => onEdit(widget)}>
                                        <i className="bi bi-pencil me-2"></i>Edit
                                    </button>
                                </li>
                                {onShowQR && (
                                    <li>
                                        <button className="dropdown-item py-2" onClick={() => onShowQR(widget)}>
                                            <i className="bi bi-qr-code me-2"></i>QR Code
                                        </button>
                                    </li>
                                )}
                                <li>
                                    <button className="dropdown-item py-2 text-danger" onClick={() => onDelete(widget.id)}>
                                        <i className="bi bi-trash me-2"></i>Delete
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <h5 className="fw-bold mb-1">{widget.name}</h5>
                    <p className="text-muted extra-small mb-3">ID: {widget.uniqueId}</p>

                    <div className="bg-light rounded-3 p-3 mb-3">
                        <div className="d-flex justify-content-between small mb-1">
                            <span className="text-muted">{tenantType === 1 ? 'Property' : 'Workspace'}</span>
                            <span className="fw-bold">{widget.property?.title || 'None'}</span>
                        </div>
                        <div className="d-flex justify-content-between small mb-1">
                            <span className="text-muted">Status</span>
                            <div className="d-flex gap-2">
                                <span className={`badge rounded-pill ${widget.configuration.chatbot?.enabled ? 'bg-success-subtle text-success' : 'bg-light text-muted'}`}>
                                    Chatbot: {widget.configuration.chatbot?.enabled ? 'ON' : 'OFF'}
                                </span>
                                <span className={`badge rounded-pill ${widget.configuration.inquiryForm?.enabled ? 'bg-info-subtle text-info' : 'bg-light text-muted'}`}>
                                    Form: {widget.configuration.inquiryForm?.enabled ? 'ON' : 'OFF'}
                                </span>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between small">
                            <span className="text-muted">Theme</span>
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle me-1" style={{ width: '12px', height: '12px', backgroundColor: widget.configuration.theme.primaryColor }}></div>
                                <span className="extra-small">{widget.configuration.theme.primaryColor}</span>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-outline-primary flex-fill rounded-pill extra-small py-2"
                            onClick={() => onCopyShortLink(widget.uniqueId)}
                            title="Copy Short Link"
                        >
                            <i className="bi bi-link-45deg me-1"></i>
                            Short Link
                        </button>
                        <button
                            className="btn btn-outline-secondary flex-fill rounded-pill extra-small py-2"
                            onClick={() => onCopyEmbed(widget.uniqueId)}
                            title="Copy Embed Code"
                        >
                            <i className="bi bi-code-square me-1"></i>
                            Embed
                        </button>
                        <a
                            href={`/go/${widget.uniqueId}`}
                            target="_blank"
                            className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center hvr-shrink"
                            style={{ width: '32px', height: '32px', backgroundColor: widget.configuration.theme.primaryColor, border: 'none' }}
                            title="View Portal"
                        >
                            <i className="bi bi-arrow-up-right small"></i>
                        </a>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .bg-primary-soft { background-color: rgba(99, 102, 241, 0.1); }
                .extra-small { font-size: 11px; }
                .hvr-float {
                    transition: transform 0.3s ease;
                }
                .hvr-float:hover {
                    transform: translateY(-5px);
                }
                .hvr-shrink {
                    transition: transform 0.2s ease;
                }
                .hvr-shrink:hover {
                    transform: scale(0.9);
                }
            `}</style>
        </div>
    );
}
