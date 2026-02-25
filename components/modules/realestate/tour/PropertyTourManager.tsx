'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { property3DService, getAuthToken, propertyService } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import PropertyTour from './PropertyTour';
import Loader from '@/components/common/Loader';

interface PropertyTourManagerProps {
    propertyId: string;
}

export default function PropertyTourManager({ propertyId }: PropertyTourManagerProps) {
    const [loading, setLoading] = useState(true);
    const [property, setProperty] = useState<any>(null);
    const [tourData, setTourData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [propertyId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            // Load Property Details
            const propRes = await propertyService.getPropertyById(token, propertyId);
            if (propRes.success) {
                setProperty(propRes.data);
            }

            // Load 3D/Tour Config
            const configRes = await property3DService.getByPropertyId(token, propertyId);
            if (configRes.success && configRes.data?.tourData) {
                setTourData(configRes.data.tourData);
            }
        } catch (err) {
            console.error('Failed to load tour data:', err);
            setError('Could not load 3D tour details.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout activePage="properties">
                <Loader message="Loading your 3D immersive experience..." size="lg" />
            </MainLayout>
        );
    }

    if (!property) {
        return (
            <MainLayout activePage="properties">
                <div className="container py-5">
                    <div className="alert alert-danger">Property not found.</div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="properties">
            <div className="container-fluid py-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-4 px-3">
                    <div>
                        <h4 className="fw-bold mb-1">{property.name} - Immersive 3D Tour</h4>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb small">
                                <li className="breadcrumb-item"><Link href="/realestate-owner-admin/properties" className="text-decoration-none">Properties</Link></li>
                                <li className="breadcrumb-item active">{property.name}</li>
                                <li className="breadcrumb-item active">3D Tour</li>
                            </ol>
                        </nav>
                    </div>
                </div>

                <div className="row justify-content-center">
                    <div className="col-12">
                        <PropertyTour propertyId={propertyId} data={tourData} />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
