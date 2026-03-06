'use client';

import { useState } from 'react';
import MediaSelector from '@/components/shared/MediaSelector';
import { Page } from '@/app/services/cms';
import { MediaItem } from '@/types';
import Image from 'next/image';

interface CMSFormProps {
    initialData?: Page | null;
    onSubmit: (data: Partial<Page>) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    mediaItems: MediaItem[];
}

export default function CMSForm({
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
    mediaItems
}: CMSFormProps) {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        slug: initialData?.slug || '',
        content: initialData?.content || '',
        featureImageId: initialData?.featureImageId || '',
        seoTitle: initialData?.seoTitle || '',
        seoDescription: initialData?.seoDescription || '',
        seoKeywords: initialData?.seoKeywords || '',
        status: initialData?.status || 1
    });

    const [showMediaModal, setShowMediaModal] = useState(false);

    // No need for useEffect to sync props to state if we use a key to re-mount the component
    // or if we strictly initialize once. In this project, we'll follow the re-mount pattern
    // typically or just initialize here since the modal is likely unmounted when closed.

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const getMediaUrl = (id?: string) => {
        if (!id) return undefined;
        const item = mediaItems.find(m => m.id === id);
        return item ? item.url : undefined;
    };

    return (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header bg-primary text-white border-0 p-4">
                        <h5 className="modal-title fw-bold text-white">
                            {initialData ? 'Edit Page' : 'Create New Page'}
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onCancel}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            <ul className="nav nav-tabs mb-4" id="cmsTab" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link active" id="content-tab" data-bs-toggle="tab" data-bs-target="#content" type="button" role="tab" aria-selected="true">Content</button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link" id="seo-tab" data-bs-toggle="tab" data-bs-target="#seo" type="button" role="tab" aria-selected="false">SEO Fields</button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link" id="settings-tab" data-bs-toggle="tab" data-bs-target="#settings" type="button" role="tab" aria-selected="false">Settings</button>
                                </li>
                            </ul>

                            <div className="tab-content" id="cmsTabContent">
                                {/* Content Tab */}
                                <div className="tab-pane fade show active" id="content" role="tabpanel" aria-labelledby="content-tab">
                                    <div className="row g-4">
                                        <div className="col-md-8">
                                            <div className="mb-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Page Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0"
                                                    value={formData.title}
                                                    onChange={(e) => {
                                                        const title = e.target.value;
                                                        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                                        setFormData({ ...formData, title, slug: initialData ? formData.slug : slug });
                                                    }}
                                                    required
                                                    placeholder="e.g. About Us"
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">URL Slug (URL)</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-0">/page/</span>
                                                    <input
                                                        type="text"
                                                        className="form-control bg-light border-0"
                                                        value={formData.slug}
                                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                                        required
                                                        placeholder="about-us"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Page Content</label>
                                                <textarea
                                                    className="form-control bg-light border-0"
                                                    value={formData.content}
                                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                    rows={15}
                                                    placeholder="Enter page content here (HTML supported)..."
                                                />
                                                <div className="form-text small">Standard Rich Text Editor (CKEditor) would go here. For now, use HTML tags if needed.</div>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Feature Image</label>
                                            <div
                                                className="border-2 border-dashed rounded-4 p-3 text-center cursor-pointer bg-light mb-4"
                                                onClick={() => setShowMediaModal(true)}
                                                style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                                            >
                                                {formData.featureImageId ? (
                                                    <div className="position-relative w-100 overflow-hidden" style={{ height: '250px' }}>
                                                        <Image
                                                            src={getMediaUrl(formData.featureImageId) || '/placeholder-image.jpg'}
                                                            className="rounded-3 shadow-sm object-fit-cover"
                                                            fill
                                                            alt="Feature"
                                                        />
                                                        <div className="mt-2 small text-primary">Click to change</div>
                                                    </div>
                                                ) : (
                                                    <div className="py-3">
                                                        <i className="bi bi-image display-6 text-muted mb-2 d-block"></i>
                                                        <span className="text-primary fw-semibold">Select Feature Image</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="card border-0 shadow-sm rounded-4 p-3 bg-light bg-opacity-50">
                                                <h6 className="fw-bold mb-3 small text-uppercase text-muted text-center border-bottom pb-2">Actions</h6>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary w-100 rounded-4 py-2 fw-bold shadow-sm mb-2"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
                                                    {initialData ? 'Save Changes' : 'Create Page'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary w-100 rounded-4 py-2"
                                                    onClick={onCancel}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SEO Tab */}
                                <div className="tab-pane fade" id="seo" role="tabpanel" aria-labelledby="seo-tab">
                                    <div className="row g-4">
                                        <div className="col-12">
                                            <label className="form-label fw-bold small text-uppercase text-muted">SEO Meta Title</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.seoTitle}
                                                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                                                placeholder="Enter SEO title (replaces page title in search results)"
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-bold small text-uppercase text-muted">SEO Meta Description</label>
                                            <textarea
                                                className="form-control bg-light border-0"
                                                value={formData.seoDescription}
                                                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                                                rows={3}
                                                placeholder="Enter meta description for search engines..."
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-bold small text-uppercase text-muted">SEO Meta Keywords</label>
                                            <input
                                                type="text"
                                                className="form-control bg-light border-0"
                                                value={formData.seoKeywords}
                                                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                                                placeholder="e.g. real estate, apartments, properties (comma separated)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Settings Tab */}
                                <div className="tab-pane fade" id="settings" role="tabpanel" aria-labelledby="settings-tab">
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Status</label>
                                            <select
                                                className="form-select bg-light border-0"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                                required
                                            >
                                                <option value={1}>Draft</option>
                                                <option value={2}>Published</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <MediaSelector
                show={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                multiple={false}
                onSelect={(selection: MediaItem | MediaItem[]) => {
                    const item = Array.isArray(selection) ? selection[0] : selection;
                    if (item) setFormData({ ...formData, featureImageId: item.id });
                }}
                selectedIds={formData.featureImageId ? [formData.featureImageId] : []}
                title="Select Feature Image"
            />

            <style jsx>{`
                .cursor-pointer { cursor: pointer; }
                .nav-link { color: #6c757d; font-weight: 500; border: none; padding: 1rem 1.5rem; transition: all 0.2s ease; }
                .nav-link.active { color: #0d6efd; border-bottom: 2px solid #0d6efd; background: transparent; }
                .tab-content { padding-top: 1rem; }
            `}</style>
        </div>
    );
}
