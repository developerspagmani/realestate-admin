'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import BrochureManager from './BrochureManager';
import { propertyService, amenityService, mediaService } from '@/app/services/api';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import { Property, Amenity, MediaItem } from '@/types';

interface BrochureIntelligentProps {
    mode: 'admin' | 'owner';
    initialPropertyId?: string;
}

export default function BrochureIntelligent({ mode, initialPropertyId }: BrochureIntelligentProps) {
    const { token, user } = useAuthContext();
    const { activeTenantId, tenantType, activeOwnerId } = useManagementContext();
    const [properties, setProperties] = useState<Property[]>([]);
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('brochure_ai_hideGuide');
        if (saved === 'true') {
            setShowHowItWorks(false);
        }
    }, []);

    const toggleGuide = (show: boolean) => {
        setShowHowItWorks(show);
        localStorage.setItem('brochure_ai_hideGuide', (!show).toString());
    };

    useEffect(() => {
        if (token) {
            loadData();
        }
    }, [token, activeTenantId, activeOwnerId]);

    const loadData = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
            const industryType = (mode === 'admin' && !activeOwnerId && !activeTenantId) ? tenantType : undefined;

            const [pRes, aRes, mRes] = await Promise.all([
                propertyService.getProperties(token, { 
                    tenantId: tenantId || undefined,
                    industryType,
                    ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId }),
                    limit: '100' 
                }),
                amenityService.getAmenities(token),
                mediaService.getMedia(token, tenantId ? { tenantId } : undefined)
            ]);

            if (pRes.success) {
                const rawProps = pRes.data.properties || pRes.data || [];
                const propsList: Property[] = rawProps.map((p: any) => ({
                    ...p,
                    name: p.title || p.name || 'Untitled',
                    address: p.addressLine1 || p.address || '',
                    addressLine2: p.addressLine2 || '',
                    zipCode: p.postalCode || p.zipCode || '',
                    priceType: 'fixed',
                    squareFootage: p.area || p.sizeSqft || 0,
                    features: [],
                    photos: p.gallery || [],
                    rating: 0,
                    totalReviews: 0,
                    propertyType: typeof p.propertyType === 'number'
                        ? (p.propertyType === 1 ? 'residential' : p.propertyType === 2 ? 'commercial' : p.propertyType === 3 ? 'industrial' : 'mixed_use')
                        : (p.propertyType || 'residential'),
                    listingType: (p.listingType?.toLowerCase() as Property['listingType']) || 'rent',
                    status: typeof p.status === 'number'
                        ? (p.status === 1 ? 'active' : p.status === 2 ? 'inactive' : 'maintenance')
                        : (p.status || 'active'),
                    mainImageId: p.mainImageId || '',
                }));
                setProperties(propsList);
                
                const targetId = initialPropertyId || (propsList.length > 0 ? propsList[0].id : null);
                if (targetId) {
                    await fetchFullProperty(targetId, propsList);
                }
            }
            if (aRes.success) setAmenities(aRes.data.amenities || []);
            if (mRes.success) setMediaItems(Array.isArray(mRes.data) ? mRes.data : (mRes.data?.media || []));
        } catch (error) {
            console.error('Failed to load data for Brochure Intelligent:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFullProperty = async (id: string, currentProperties?: Property[]) => {
        if (!token) return;
        try {
            setIsFetchingDetails(true);
            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
            const res = await propertyService.getPropertyById(token, id, tenantId || undefined);

            const list = currentProperties || properties;
            const basic = list.find(p => p.id === id);

            if (res.success && res.data.property) {
                const p = res.data.property;
                const fullProperty: Property = {
                    ...p,
                    name: p.title || p.name || basic?.name || 'Untitled Property',
                    address: p.addressLine1 || p.address || basic?.address || '',
                    addressLine2: p.addressLine2 || basic?.addressLine2 || '',
                    zipCode: p.postalCode || p.zipCode || basic?.zipCode || '',
                    priceType: 'fixed',
                    squareFootage: p.area || p.sizeSqft || basic?.squareFootage || 0,
                    features: [],
                    photos: p.gallery || basic?.photos || [],
                    rating: 0,
                    totalReviews: 0,
                    propertyType: typeof p.propertyType === 'number'
                        ? (p.propertyType === 1 ? 'residential' : p.propertyType === 2 ? 'commercial' : p.propertyType === 3 ? 'industrial' : 'mixed_use')
                        : (p.propertyType || basic?.propertyType || 'residential'),
                    listingType: (p.listingType?.toLowerCase() as Property['listingType']) || basic?.listingType || 'rent',
                    status: typeof p.status === 'number'
                        ? (p.status === 1 ? 'active' : p.status === 2 ? 'inactive' : 'maintenance')
                        : (p.status || basic?.status || 'active'),
                    mainImageId: p.mainImageId || basic?.mainImageId || '',
                };
                setSelectedProperty(fullProperty);
            } else {
                if (basic) setSelectedProperty(basic);
            }
        } catch (error) {
            console.error('Error fetching full property details:', error);
            const list = currentProperties || properties;
            const basic = list.find(p => p.id === id);
            if (basic) setSelectedProperty(basic);
        } finally {
            setTimeout(() => setIsFetchingDetails(false), 300);
        }
    };

    const handlePropertyChange = (id: string) => {
        if (!id) return;
        fetchFullProperty(id);
    };

    return (
        <MainLayout activePage="brochure-ai">
            <div className="container-fluid p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div>
                            <h4 className="fw-bold mb-0">Brochure Intelligent AI</h4>
                            <p className="text-muted small mb-0">Generate professional property brochures using Gemini Nano AI</p>
                        </div>
                        <div className="d-flex gap-2">
                            <span className={`badge ${properties.length > 0 ? 'bg-success' : 'bg-warning'} rounded-pill px-3`}>
                                <i className="bi bi-database-check me-1"></i> {properties.length} Props
                            </span>
                            <span className={`badge ${selectedProperty ? 'bg-primary' : 'bg-secondary'} rounded-pill px-3`}>
                                <i className="bi bi-tag me-1"></i> {selectedProperty ? 'Ready' : 'Waiting...'}
                            </span>
                        </div>
                        {!showHowItWorks && (
                            <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold text-primary shadow-sm border mt-1" onClick={() => toggleGuide(true)}>
                                <i className="bi bi-info-circle me-1"></i> How it Works
                            </button>
                        )}
                    </div>
                </div>

                {showHowItWorks && (
                    <div className="card border-0 shadow-sm rounded-4 mb-4 bg-primary text-white overflow-hidden position-relative animate-fade-in">
                        <button
                            className="btn position-absolute top-0 end-0 m-3 text-white opacity-50 hover-opacity-100 p-2"
                            style={{ zIndex: 1 }}
                            onClick={() => toggleGuide(false)}
                            title="Hide this section"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                        <div className="card-body p-4 p-lg-5">
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <h3 className="fw-bold mb-3 text-white">Instant Property Brochures</h3>
                                    <p className="opacity-75 mb-4">Transform your property inventory into stunning, print-ready sales material using advanced generative AI:</p>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-database-fill-check text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">1. Source Synchronization</div>
                                                    <div className="small opacity-75">Auto-pulls specs, amenities, and high-res images directly from your digital inventory.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-robot text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">2. AI-Powered Copy</div>
                                                    <div className="small opacity-75">Uses neural networks to transform technical specs into persuasive, market-ready sales descriptions.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-qr-code text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">3. Smart Interactivity</div>
                                                    <div className="small opacity-75">Injects dynamic QR codes that link leads back to your property's landing page.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex gap-3">
                                                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <i className="bi bi-file-earmark-pdf-fill text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-bold">4. Universal Export</div>
                                                    <div className="small opacity-75">One-click generation of PDFs ready for print, email, or WhatsApp distribution.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 d-none d-lg-block text-center">
                                    <i className="bi bi-file-earmark-richtext display-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                        <i className="bi bi-building display-1 text-muted opacity-25 mb-4 d-block"></i>
                        <h5>No Properties Found</h5>
                        <p className="text-muted">You need at least one property to generate a brochure.</p>
                    </div>
                ) : (
                    <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ height: 'calc(100vh - 180px)', minHeight: '750px' }}>
                        <div className="card-body p-0 h-100">
                            <BrochureManager
                                isEmbedded={true}
                                show={true}
                                property={selectedProperty}
                                properties={properties}
                                mode={mode}
                                allAmenities={amenities}
                                allMedia={mediaItems}
                                onPropertyChange={handlePropertyChange}
                                fetching={isFetchingDetails}
                                onClose={() => { }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .container-fluid {
                    max-width: 1600px;
                    margin: 0 auto;
                }
            `}</style>
        </MainLayout>
    );
}
