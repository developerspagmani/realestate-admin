'use client';

import React, { useState } from 'react';
import { Widget } from '@/types';

interface QRCodeGeneratorProps {
    widget: Widget;
    onClose: () => void;
}

export default function QRCodeGenerator({ widget, onClose }: QRCodeGeneratorProps) {
    const [title, setTitle] = useState(widget.name || 'Property Inquiry');
    const [description, setDescription] = useState('Scan to view property details and book a tour');
    const [qrSize, setQrSize] = useState(250);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shortUrl = `${baseUrl}/go/${widget.uniqueId}`;

    // Using a public QR code API for simplicity and reliability without new dependencies
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(shortUrl)}`;

    const handleDownload = async () => {
        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `qr-code-${widget.uniqueId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download QR code:', error);
            alert('Failed to download QR code. Please try again.');
        }
    };

    return (
        <div className="modal-backdrop d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="modal-content bg-white p-4 rounded-4 shadow-lg animate-scale-in" style={{ maxWidth: '500px', width: '90%' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Generate QR Code</h5>
                    <button className="btn-close" onClick={onClose}></button>
                </div>

                <div className="text-center mb-4 py-3 bg-light rounded-4">
                    <div className="qr-container bg-white p-3 d-inline-block rounded-3 shadow-sm border">
                        <img src={qrCodeUrl} alt="Widget QR Code" style={{ width: '100%', height: 'auto', maxWidth: '250px' }} />
                    </div>
                    <div className="mt-3">
                        <span className="badge bg-primary-subtle text-primary px-3 rounded-4">
                            <i className="bi bi-link-45deg me-1"></i>
                            {shortUrl}
                        </span>
                    </div>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-12">
                        <label className="form-label small fw-bold">Custom Title (Optional)</label>
                        <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Scan to Inquire"
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label small fw-bold">Description</label>
                        <textarea
                            className="form-control form-control-sm rounded-3"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">QR Size (px)</label>
                        <select
                            className="form-select form-select-sm rounded-3"
                            value={qrSize}
                            onChange={(e) => setQrSize(parseInt(e.target.value))}
                        >
                            <option value={150}>150 x 150</option>
                            <option value={250}>250 x 250</option>
                            <option value={500}>500 x 500</option>
                            <option value={1000}>1000 x 1000</option>
                        </select>
                    </div>
                </div>

                <div className="d-grid gap-2">
                    <button className="btn btn-primary rounded-4 py-2 fw-bold" onClick={handleDownload}>
                        <i className="bi bi-download me-2"></i>
                        Download QR Code
                    </button>
                    <button className="btn btn-link text-muted btn-sm" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in {
                    animation: scaleIn 0.3s ease-out;
                }
                .bg-primary-subtle {
                    background-color: #eef2ff !important;
                }
            `}</style>
        </div>
    );
}
