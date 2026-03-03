'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import BrochureManager from './BrochureManager';
import { propertyService, amenityService, mediaService } from '@/app/services/api';
import { useAuthContext } from '@/app/contexts/AuthContext';

interface BrochureIntelligentProps {
    mode: 'admin' | 'owner';
}

export default function BrochureIntelligent({ mode }: BrochureIntelligentProps) {
    const { token } = useAuthContext();
    const [properties, setProperties] = useState<any[]>([]);
    const [amenities, setAmenities] = useState<any[]>([]);
    const [mediaItems, setMediaItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState<any>(null);

    useEffect(() => {
        if (token) {
            loadData();
        }
    }, [token]);

    const loadData = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const [pRes, aRes, mRes] = await Promise.all([
                propertyService.getProperties(token, { limit: '100' }),
                amenityService.getAmenities(token),
                mediaService.getMedia(token)
            ]);

            if (pRes.success) {
                const propsList = pRes.data.properties || [];
                setProperties(propsList);
                if (propsList.length > 0) {
                    await fetchFullProperty(propsList[0].id);
                }
            }
            if (aRes.success) setAmenities(aRes.data.amenities || []);
            if (mRes.success) setMediaItems(mRes.data.media || []);
        } catch (error) {
            console.error('Failed to load data for Brochure Intelligent:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFullProperty = async (id: string) => {
        try {
            const res = await propertyService.getPropertyById(token!, id);
            if (res.success) {
                setSelectedProperty(res.data.property);
            } else {
                // Fallback to basic data if full fetch fails
                const basic = properties.find(p => p.id === id);
                if (basic) setSelectedProperty(basic);
            }
        } catch (error) {
            console.error('Error fetching full property details:', error);
        }
    };

    const handlePropertyChange = (id: string) => {
        fetchFullProperty(id);
    };

    return (
        <MainLayout activePage="brochure-ai">
            <div className="container-fluid p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-0">Brochure Intelligent AI</h4>
                        <p className="text-muted small">Generate professional property brochures using Gemini Nano AI</p>
                    </div>
                </div>

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
