'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { whatsappApi } from '@/lib/api/social';
import Loader from '@/components/common/Loader';

export default function WhatsAppTemplateDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState<any>(null);

    const basePath = pathname.includes('/realestate-owner-admin')
        ? '/realestate-owner-admin'
        : '/realestate-admin';

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await whatsappApi.getTemplateById(id as string);
            if (res.success) {
                setTemplate(res.data.template);
            }
        } catch (error) {
            console.error('Error loading template:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this template? This will also attempt to delete it from Meta.')) return;

        try {
            const res = await whatsappApi.deleteTemplate(id as string);
            if (res.success) {
                alert('Template deleted successfully');
                router.push(`${basePath}/social/whatsapp`);
            } else {
                alert(res.message || 'Failed to delete template');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred');
        }
    };

    if (loading) {
        return (
            <MainLayout activePage="social">
                <div className="container py-5 text-center">
                    <Loader size="md" message="Loading template details..." />
                </div>
            </MainLayout>
        );
    }

    if (!template) {
        return (
            <MainLayout activePage="social-whatsapp">
                <div className="container py-5 text-center">
                    <h3>Template not found</h3>
                    <button onClick={() => router.push(`${basePath}/social/whatsapp`)} className="btn btn-link">Back to WhatsApp</button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="social-whatsapp">
            <div className="container py-4">
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="btn btn-link text-decoration-none text-muted p-0 mb-2"
                        >
                            <i className="bi bi-arrow-left me-1"></i> Back
                        </button>
                        <h1 className="fw-bold h2">{template.name}</h1>
                        <p className="text-muted small">Template Details & Preview</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            onClick={handleDelete}
                            className="btn btn-outline-danger px-4 rounded-pill"
                        >
                            <i className="bi bi-trash me-1"></i> Delete
                        </button>
                        <button
                            onClick={() => router.push(`${basePath}/social/whatsapp/campaigns/create?template=${template.id}`)}
                            className="btn btn-success px-4 rounded-pill"
                        >
                            <i className="bi bi-whatsapp me-1"></i> Use Template
                        </button>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Preview Card */}
                    <div className="col-md-5">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-light">
                            <div className="card-header bg-success text-white p-3 border-0">
                                <h6 className="mb-0 fw-bold">Message Preview</h6>
                            </div>
                            <div className="card-body p-4" style={{
                                backgroundImage: 'url(https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png)',
                                backgroundSize: 'cover'
                            }}>
                                <div className="bg-white p-3 rounded-3 shadow-sm d-inline-block mw-100 position-relative animate__animated animate__fadeInUp">
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {template.components.find((c: any) => c.type === 'BODY')?.text || 'No body content'}
                                    </div>
                                    <div className="text-end mt-1">
                                        <small className="text-muted" style={{ fontSize: '10px' }}>
                                            {new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="col-md-7">
                        <div className="card border-0 shadow-sm rounded-4 p-4">
                            <h5 className="fw-bold mb-4">Meta Information</h5>
                            <div className="row g-4">
                                <div className="col-6">
                                    <label className="small text-muted text-uppercase fw-bold mb-1">Status</label>
                                    <div>
                                        <span className={`badge rounded-pill ${template.status === 'APPROVED' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                                            {template.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <label className="small text-muted text-uppercase fw-bold mb-1">Category</label>
                                    <div className="fw-medium">{template.category}</div>
                                </div>
                                <div className="col-6">
                                    <label className="small text-muted text-uppercase fw-bold mb-1">Language</label>
                                    <div className="fw-medium">{template.language}</div>
                                </div>
                                <div className="col-6">
                                    <label className="small text-muted text-uppercase fw-bold mb-1">WABA ID</label>
                                    <div className="font-monospace small">{template.wabaId}</div>
                                </div>
                                <div className="col-12">
                                    <label className="small text-muted text-uppercase fw-bold mb-1">Raw Components</label>
                                    <pre className="bg-light p-3 rounded-3 small mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {JSON.stringify(template.components, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
