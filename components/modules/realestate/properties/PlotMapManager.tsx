'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import { propertyService, unitService, getAuthToken } from '@/app/services/api';
import PlotMapEditor from './PlotMapEditor';
import MainLayout from '@/components/MainLayout';
import Toast from '@/components/common/Toast';
import { Property, Seats } from '@/types';

interface PlotMapManagerProps {
    mode: 'admin' | 'owner';
    propertyId?: string;
    propertyName?: string;
}

export default function PlotMapManager({ mode, propertyId: propId, propertyName: propName }: PlotMapManagerProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId } = useManagementContext();

    const propertyId = propId || searchParams.get('propertyId');
    const propertyName = propName || searchParams.get('propertyName') || 'Property';
    const [mounted, setMounted] = useState(false);
    const [property, setProperty] = useState<Property | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [units, setUnits] = useState<Seats[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialMapping, setInitialMapping] = useState<Record<string, string>>({});
    const [initialSvg, setInitialSvg] = useState<string | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }

        loadData();
    }, [mounted, isAuthenticated, user, propertyId, mode, activeTenantId, activeOwnerId, tenantType]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const tenantId = (mode === 'admin' ? activeTenantId : (user as any)?.tenantId) || undefined;
            const industryType = (mode === 'admin' && !activeOwnerId && !activeTenantId) ? tenantType : undefined;

            if (propertyId) {
                // Load specific Property data
                console.log('PlotMapManager: Loading data for property:', { propertyId, tenantId, mode });
                const propRes = await propertyService.getPropertyById(token, propertyId!, tenantId);
                if (propRes.success && propRes.data) {
                    const prop = propRes.data.property || propRes.data;
                    setProperty(prop);
                    if (prop.metadata?.svgMapping) setInitialMapping(prop.metadata.svgMapping);
                    if (prop.metadata?.interactiveSvg) setInitialSvg(prop.metadata.interactiveSvg);
                }

                // Load Units for this property
                const unitsRes = await unitService.getUnits(token, {
                    propertyId: propertyId as string,
                    tenantId: tenantId || undefined,
                    ownerId: mode === 'admin' ? (activeOwnerId || undefined) : undefined,
                    industryType
                });

                if (unitsRes.success && unitsRes.data) {
                    const rawUnits = Array.isArray(unitsRes.data) ? unitsRes.data : (unitsRes.data.units || unitsRes.data.workspaces || []);
                    const mappedUnits: Seats[] = rawUnits.map((u: any) => {
                        const priceVal = u.unitPricing?.find((p: any) => p.pricingModel === 1)?.price || 0;
                        const statusNum = Number(u.status);
                        let statusStr = 'available';
                        if (statusNum === 2) statusStr = 'occupied';
                        else if (statusNum === 3) statusStr = 'maintenance';
                        else if (statusNum === 4) statusStr = 'sold';
                        else if (typeof u.status === 'string' && u.status.length > 1) statusStr = u.status.toLowerCase();

                        return {
                            id: u.id,
                            name: u.unitCode || u.name || 'Unit ' + u.id.substring(0, 4),
                            slug: u.slug || u.id,
                            type: u.unitCategory === 1 ? 'apartment' : u.unitCategory === 2 ? 'house' : u.unitCategory === 3 ? 'office' : 'shop',
                            floorNo: u.floorNo || 0,
                            sizeSqft: u.sizeSqft || 0,
                            price: typeof priceVal === 'string' ? parseFloat(priceVal) : priceVal,
                            status: statusStr,
                        };
                    });
                    setUnits(mappedUnits);
                }
            } else {
                // Load Properties list
                console.log('PlotMapManager: Loading property list');
                const propsRes = await propertyService.getProperties(token, {
                    tenantId: tenantId || undefined,
                    industryType,
                    ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
                });

                if (propsRes.success) {
                    const rawProps = propsRes.data?.properties || propsRes.data || [];
                    setProperties(rawProps.map((p: any) => ({
                        id: p.id,
                        name: p.title || p.name || 'Untitled',
                        city: p.city || '',
                        state: p.state || '',
                        address: p.addressLine1 || p.address || '',
                        description: p.description || ''
                    })));
                }
            }

        } catch (error: any) {
            console.error('Failed to load data for Plot Map Manager:', error);
            showToast(error.message || 'Error loading data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMapping = async (mapping: Record<string, string>, svgContent: string) => {
        try {
            const token = getAuthToken();
            if (!token || !propertyId) return;

            const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const targetTenantId = property?.ownerId || tenantId || '';

            const payload = {
                metadata: {
                    ...(property as any)?.metadata,
                    svgMapping: mapping,
                    interactiveSvg: svgContent
                }
            };

            const res = await propertyService.updateProperty(token, propertyId, payload as any, targetTenantId);
            if (res.success) {
                showToast('Plot map saved successfully');
                setProperty(prev => prev ? { ...prev, metadata: payload.metadata } : null);
                setInitialMapping(payload.metadata.svgMapping);
                setInitialSvg(payload.metadata.interactiveSvg);
            } else {
                showToast(res.message || 'Error saving plot map', 'error');
            }
        } catch (error) {
            console.error('Failed to save mapping:', error);
            showToast('Error saving plot map', 'error');
        }
    };

    if (!mounted || !isAuthenticated) return null;

    if (loading) {
        return (
            <MainLayout activePage="plot-map">
                <div className="d-flex justify-content-center align-items-center vh-100">
                    <div className="spinner-border text-primary" role="status"></div>
                    <span className="ms-3 text-muted">Loading Plot Map Manager...</span>
                </div>
            </MainLayout>
        );
    }

    if (!propertyId) {
        const basePath = mode === 'admin' ? '/realestate-admin/plot-map' : '/realestate-owner-admin/plot-map';
        return (
            <MainLayout activePage="plot-map">
                <div className="container-fluid p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h4 className="fw-bold mb-1">Plot Map Manager</h4>
                            <p className="text-muted mb-0">Select a property to configure its interactive SVG plot map</p>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm overflow-hidden">
                        <div className="card-body p-0">
                            <div className="vi-table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light text-muted small text-uppercase fw-bold">
                                        <tr>
                                            <th className="px-4 py-3 border-0">Property</th>
                                            <th className="py-3 border-0">Location</th>
                                            <th className="py-3 border-0 text-end px-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {properties.length > 0 ? (
                                            properties.map((prop) => (
                                                <tr key={prop.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-light rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                                <i className="bi bi-map-fill text-primary h5 mb-0"></i>
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold text-dark">{prop.name}</div>
                                                                <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>{prop.description}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="small">{prop.city}, {prop.state}</div>
                                                    </td>
                                                    <td className="py-3 text-end px-4">
                                                        <button
                                                            onClick={() => router.push(`${basePath}?propertyId=${prop.id}&propertyName=${encodeURIComponent(prop.name)}`)}
                                                            className="btn btn-sm btn-primary rounded-4 px-4"
                                                        >
                                                            <i className="bi bi-map me-2"></i>Launch Editor
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="text-center py-5 text-muted">
                                                    No properties found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="plot-map">
            <div className="vh-100 overflow-hidden" style={{ marginTop: '-24px' }}>
                <PlotMapEditor
                    units={units}
                    propertyName={propertyName}
                    initialMapping={initialMapping}
                    initialSvgContent={initialSvg}
                    onSave={handleSaveMapping}
                />
            </div>
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </MainLayout>
    );
}
