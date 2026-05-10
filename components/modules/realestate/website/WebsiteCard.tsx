'use client';

import React from 'react';
import { Website } from '@/types';

interface WebsiteCardProps {
    website: Website;
    onEdit: (website: Website) => void;
    onDelete: (id: string) => void;
    onGenerateQR: (website: Website) => void;
}

export default function WebsiteCard({ website, onEdit, onDelete, onGenerateQR }: WebsiteCardProps) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const publicUrl = website.customDomain 
        ? `https://${website.customDomain}/go/${website.slug}` 
        : `${baseUrl}/go/${website.slug}`;
    const customDomain = website.customDomain;

    const calculateSEOScore = () => {
        let score = 0;
        const config = website.configuration || {};
        const seo = config.seo || {};
        const builder = config.builder || {};

        if (seo.title) score += 10;
        if (seo.title?.length >= 30 && seo.title?.length <= 60) score += 10;
        if (seo.description) score += 10;
        if (seo.description?.length >= 120 && seo.description?.length <= 160) score += 15;
        if (seo.keywords) score += 5;
        if (builder.logoUrl) score += 5;
        if (builder.faviconUrl) score += 5;
        if (builder.heroBgUrl) score += 5;
        if (builder.heroTitle) score += 10;
        if (builder.heroSubtitle) score += 5;
        if ((builder.modules || []).length >= 3) score += 10;
        if (website.customDomain) score += 10;

        return Math.min(score, 100);
    };

    const seoScore = calculateSEOScore();
    const scoreColor = seoScore < 40 ? 'danger' : seoScore < 75 ? 'warning' : 'success';

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="col-md-6 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 transition-all hover-translate-y">
                <div className="card-header bg-white border-0 p-4 pb-0 d-flex justify-content-between align-items-start">
                    <div>
                        <span className={`badge mb-2 rounded-4 ${website.status === 1 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                            {website.status === 1 ? 'Active' : 'Draft'}
                        </span>
                        <h5 className="fw-bold mb-1">{website.name}</h5>
                        <p className="text-muted extra-small mb-0">Created {new Date(website.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="dropdown">
                        <button className="btn btn-link link-dark p-0" data-bs-toggle="dropdown">
                            <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                            <li><button className="dropdown-item py-2" onClick={() => onEdit(website)}><i className="bi bi-pencil me-2"></i> Edit Settings</button></li>
                            <li><button className="dropdown-item py-2" onClick={() => onGenerateQR(website)}><i className="bi bi-qr-code me-2"></i> Generate QR Code</button></li>
                            <li><hr className="dropdown-divider opacity-50" /></li>
                            <li><button className="dropdown-item py-2 text-danger" onClick={() => onDelete(website.id)}><i className="bi bi-trash me-2"></i> Delete Website</button></li>
                        </ul>
                    </div>
                </div>

                <div className="card-body p-4">
                    <div className="mb-4">
                        <label className="extra-small fw-bold text-muted text-uppercase mb-2 d-block">Public Access URL</label>
                        <div className="input-group input-group-sm">
                            <input type="text" className="form-control bg-light border-0 rounded-start-3" readOnly value={publicUrl} />
                            <button className="btn btn-light border-0 rounded-end-3" onClick={() => copyToClipboard(publicUrl)}>
                                <i className="bi bi-clipboard"></i>
                            </button>
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary ms-2 rounded-3">
                                <i className="bi bi-box-arrow-up-right"></i>
                            </a>
                        </div>
                    </div>

                    {customDomain && (
                        <div className="mb-4 p-3 bg-info bg-opacity-10 border border-info border-opacity-25 rounded-4">
                            <label className="extra-small fw-bold text-info text-uppercase mb-2 d-block">Custom Domain Enabled</label>
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="small fw-bold">{customDomain}</span>
                                <a href={`http://${customDomain}`} target="_blank" rel="noopener noreferrer" className="text-info">
                                    <i className="bi bi-link-45deg"></i>
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="d-flex gap-2 mt-auto">
                        <div className="flex-grow-1 p-2 bg-light rounded-3 text-center">
                            <div className="fw-bold small">{website.propertyId ? 'Single Prop' : 'Multi Prop'}</div>
                            <div className="extra-small text-muted">Scope</div>
                        </div>
                        <div className="flex-grow-1 p-2 bg-light rounded-3 text-center">
                            <div className={`fw-bold small text-${scoreColor}`}>{seoScore}%</div>
                            <div className="extra-small text-muted text-uppercase fw-bold" style={{ fontSize: '8px' }}>SEO Score</div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .extra-small { font-size: 0.75rem; }
                .hover-translate-y:hover { transform: translateY(-5px); }
            `}</style>
        </div>
    );
}
