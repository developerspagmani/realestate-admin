'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { propertyService, mediaService, amenityService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import PropertiesList from './PropertiesList';
import PropertyForm from './PropertyForm';
import { Property, MediaItem } from '@/types';

interface PropertiesManagerProps {
    mode: 'admin' | 'owner';
}

export default function PropertiesManager({ mode }: PropertiesManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId } = useManagementContext();
    const [mounted, setMounted] = useState(false);
    const [properties, setProperties] = useState<Property[]>([]);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [amenities, setAmenities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const router = useRouter();

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
    }, [mounted, isAuthenticated, user, router, activeTenantId, activeOwnerId, tenantType]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;
            const industryType = mode === 'admin' ? tenantType : undefined;

            // Load Properties
            const propsRes = await propertyService.getProperties(token, {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId })
            });
            let loadedProps: Property[] = [];

            if (propsRes.success) {
                // Handle different possible response structures
                const rawProps = propsRes.data?.properties || propsRes.data || [];

                loadedProps = rawProps.map((p: any) => ({
                    id: p.id,
                    name: p.title || p.name || 'Untitled Property',
                    slug: p.slug || '',
                    description: p.description || '',
                    address: p.addressLine1 || p.address || '',
                    addressLine2: p.addressLine2 || '',
                    city: p.city || '',
                    state: p.state || '',
                    country: p.country || 'USA',
                    zipCode: p.postalCode || p.zipCode || '',
                    latitude: p.latitude || 0,
                    longitude: p.longitude || 0,
                    ownerId: p.tenantId || '',
                    propertyType: typeof p.propertyType === 'number'
                        ? (p.propertyType === 1 ? 'residential' : p.propertyType === 2 ? 'commercial' : p.propertyType === 3 ? 'industrial' : 'mixed_use')
                        : (p.propertyType || 'residential'),
                    status: typeof p.status === 'number'
                        ? (p.status === 1 ? 'active' : p.status === 2 ? 'inactive' : 'maintenance')
                        : (p.status || 'active'),
                    mainImageId: p.mainImageId || '',
                    gallery: p.gallery || [],
                    price: p.price || 0,
                    area: p.area || p.sizeSqft || 0,
                    floorPlanId: p.floorPlanId || '',
                    brochureId: p.brochureId || '',
                    amenities: p.propertyAmenities ? p.propertyAmenities.map((pa: any) => pa.amenity?.id || pa.amenityId) : [],
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                }));
                setProperties(loadedProps);
            }

            // Load Media
            const mediaRes = await mediaService.getMedia(token, tenantId ? { tenantId } : undefined);
            if (mediaRes.success) {
                setMediaItems(mediaRes.data.media || []);
            }

            // Load Amenities
            const amenRes = await amenityService.getAmenities(token);
            if (amenRes.success) {
                setAmenities(amenRes.data.amenities || []);
            }

        } catch (error) {
            console.error('Failed to load properties data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (property: Property) => {
        setEditingProperty(property);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this property?')) return;

        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (user as any)?.tenantId;

            await propertyService.deleteProperty(token, id, tenantId);
            setProperties(properties.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to delete property:', error);
            alert('Error deleting property.');
        }
    };

    const handleSubmit = async (formData: Partial<Property>) => {
        try {
            setIsSubmitting(true);
            const token = getAuthToken();
            if (!token) return;

            const tenantId = (user as any)?.tenantId || localStorage.getItem('tenant-id');
            if (!tenantId) return;

            // Map back to API format
            const payload = {
                tenantId,
                title: formData.name,
                slug: (formData as any).slug || undefined,
                description: formData.description,
                addressLine1: formData.address,
                addressLine2: (formData as any).addressLine2 || null,
                city: formData.city,
                state: formData.state,
                country: (formData as any).country || 'USA',
                postalCode: formData.zipCode,
                latitude: (formData as any).latitude || 0,
                longitude: (formData as any).longitude || 0,
                propertyType: formData.propertyType === 'residential' ? 1
                    : formData.propertyType === 'commercial' ? 2
                        : formData.propertyType === 'industrial' ? 3 : 4,
                status: formData.status === 'active' ? 1 : formData.status === 'inactive' ? 2 : 3,
                mainImageId: formData.mainImageId,
                gallery: formData.gallery,
                area: formData.area,
                floorPlanId: formData.floorPlanId,
                brochureId: formData.brochureId,
                amenities: formData.amenities
            };

            if (editingProperty) {
                await propertyService.updateProperty(token, editingProperty.id, payload, tenantId);
                setSuccessMessage('Property updated successfully!');
            } else {
                await propertyService.createProperty(token, payload, tenantId);
                setSuccessMessage('Property registered successfully!');
            }

            await loadData(); // Reload to get fresh data

            setTimeout(() => {
                setIsSubmitting(false);
                setSuccessMessage(null);
                handleCloseModal();
            }, 1000);

        } catch (error) {
            console.error('Failed to save property:', error);
            alert('Error saving property.');
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProperty(null);
        setSuccessMessage(null);
    };

    const handleNavigateToUnits = (id: string) => {
        const basePath = mode === 'admin' ? '/realestate-admin/units' : '/realestate-owner-admin/units';
        router.push(`${basePath}?propertyId=${id}`);
    };

    const filteredProperties = properties.filter(property =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.state.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!mounted || !isAuthenticated) return null; // Or loading spinner

    return (
        <MainLayout activePage="properties">
            {/* Search and Header Section */}
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="fw-bold text-dark h3">
                        {mode === 'admin' ? 'All Properties' : 'My Properties'}
                    </h1>
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                        onClick={() => { setEditingProperty(null); setShowModal(true); }}
                    >
                        <i className="bi bi-plus-circle"></i>
                        Add Property
                    </button>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-0">
                                        <i className="bi bi-search text-muted"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-0"
                                        placeholder="Search properties by name, city or state..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6 text-end">
                                <span className="text-muted small">Showing {filteredProperties.length} properties</span>
                            </div>
                        </div>
                    </div>
                </div>

                <PropertiesList
                    properties={filteredProperties}
                    isLoading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onNavigateToUnits={handleNavigateToUnits}
                    userRole={user?.role}
                />
            </div>

            {showModal && (
                <PropertyForm
                    initialData={editingProperty}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                    isSubmitting={isSubmitting}
                    mediaItems={mediaItems}
                    amenities={amenities}
                />
            )}
        </MainLayout>
    );
}
