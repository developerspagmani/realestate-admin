'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import {
    propertyService,
    mediaService,
    amenityService,
    categoryService,
    getAuthToken
} from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PropertiesList from './PropertiesList';
import PropertyForm from './PropertyForm';
import Toast from '@/components/common/Toast';
import { Property, MediaItem } from '@/types';

interface PropertiesManagerProps {
    mode: 'admin' | 'owner';
}

export default function PropertiesManager({ mode }: PropertiesManagerProps) {
    const queryClient = useQueryClient();
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId, currencySymbol } = useManagementContext();
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => { setMounted(true); }, []);

    // --- TanStack Queries ---

    const token = typeof window !== 'undefined' ? getAuthToken() : '';
    const tenantId = mode === 'admin' ? activeTenantId : (user as any)?.tenantId;

    const { data: propertiesData, isLoading: propsLoading } = useQuery({
        queryKey: ['properties', mode, activeTenantId, activeOwnerId, tenantType],
        queryFn: async () => {
            const industryType = (mode === 'admin' && !activeOwnerId && !activeTenantId) ? tenantType : undefined;
            const res = await propertyService.getProperties(token!, {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId }),
            });
            if (!res.success) throw new Error(res.message || 'Failed to fetch properties');
            return res.data?.properties || res.data || [];
        },
        enabled: !!token && mounted && isAuthenticated,
    });

    const { data: mediaItems = [] } = useQuery({
        queryKey: ['media', tenantId],
        queryFn: async () => {
            const res = await mediaService.getMedia(token!, tenantId ? { tenantId } : undefined);
            return res.data?.media || [];
        },
        enabled: !!token && mounted && isAuthenticated,
    });

    const { data: amenities = [] } = useQuery({
        queryKey: ['amenities'],
        queryFn: async () => {
            const res = await amenityService.getAmenities(token!);
            return res.data?.amenities || [];
        },
        enabled: !!token && mounted && isAuthenticated,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await categoryService.getCategories(token!);
            return res.data?.categories || [];
        },
        enabled: !!token && mounted && isAuthenticated,
    });

    // Mapping Raw Data to Property Interface
    const properties = useMemo(() => {
        const rawProps = Array.isArray(propertiesData) ? propertiesData : [];
        return rawProps.map((p: any) => ({
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
            priceType: p.priceType || 'fixed',
            area: p.area || p.sizeSqft || 0,
            squareFootage: p.area || p.sizeSqft || 0,
            floorPlanId: p.floorPlanId || '',
            brochureId: p.brochureId || '',
            amenities: p.propertyAmenities ? p.propertyAmenities.map((pa: any) => pa.amenity?.id || pa.amenityId) : [],
            features: p.features || [],
            photos: p.gallery || [],
            rating: p.rating || 0,
            totalReviews: p.totalReviews || 0,
            yearBuilt: p.yearBuilt,
            neighborhood: p.neighborhood || '',
            parkingSpaces: p.parkingSpaces || 0,
            bedrooms: p.bedrooms || 0,
            bathrooms: p.bathrooms || 0,
            lotSize: p.lotSize || 0,
            listingType: (p.listingType?.toLowerCase() as any) || 'rent',
            categoryId: p.categoryId || '',
            videoUrl: p.videoUrl || '',
            displayPrice: p.displayPrice !== undefined ? p.displayPrice : true,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        }));
    }, [propertiesData]);

    const loading = propsLoading;

    // --- TanStack Mutations ---

    const saveMutation = useMutation({
        mutationFn: async (formData: Partial<Property>) => {
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
                amenities: formData.amenities,
                yearBuilt: formData.yearBuilt,
                neighborhood: formData.neighborhood,
                parkingSpaces: formData.parkingSpaces,
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                lotSize: formData.lotSize,
                listingType: formData.listingType,
                categoryId: (formData as any).categoryId || null,
                videoUrl: (formData as any).videoUrl || null,
                displayPrice: (formData as any).displayPrice,
                price: formData.price,
            };

            if (editingProperty) {
                return propertyService.updateProperty(token!, editingProperty.id, payload, tenantId);
            }
            return propertyService.createProperty(token!, payload, tenantId);
        },
        onSuccess: (res) => {
            if (res.success) {
                showToast(editingProperty ? 'Property updated successfully!' : 'Property registered successfully!');
                queryClient.invalidateQueries({ queryKey: ['properties'] });
                handleBackToList();
            } else {
                showToast(res.message || 'Error saving property', 'error');
            }
        },
        onError: () => showToast('Error saving property.', 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => propertyService.deleteProperty(token!, id, tenantId),
        onSuccess: (res) => {
            if (res.success) {
                showToast('Property deleted successfully');
                queryClient.invalidateQueries({ queryKey: ['properties'] });
            } else {
                showToast(res.message || 'Error deleting property', 'error');
            }
        },
        onError: () => showToast('Error deleting property.', 'error')
    });



    // ── VIEW TRANSITIONS ──────────────────────────────────────────────────────

    const handleCreate = () => {
        setEditingProperty(null);
        setView('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEdit = (property: Property) => {
        setEditingProperty(property);
        setView('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToList = () => {
        setView('list');
        setEditingProperty(null);
    };

    // ── CRUD ACTIONS ──────────────────────────────────────────────────────────

    const handleSubmit = async (formData: Partial<Property>) => {
        try {
            await saveMutation.mutateAsync(formData);
        } catch (error) {
            // Error already handled in mutation
        }
    };

    const isSubmitting = saveMutation.isPending;

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this property?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleNavigateToUnits = (id: string) => {
        const basePath = mode === 'admin' ? '/realestate-admin/units' : '/realestate-owner-admin/units';
        router.push(`${basePath}?propertyId=${id}`);
    };

    const filteredProperties = useMemo(() => {
        return properties.filter((p: any) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.state.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [properties, searchTerm]);

    if (!mounted || !isAuthenticated) return null;

    // ── FORM VIEW ─────────────────────────────────────────────────────────────
    if (view === 'form') {
        return (
            <MainLayout activePage="properties">
                <div className="container-fluid py-4">
                    <PropertyForm
                        initialData={editingProperty}
                        onSubmit={handleSubmit}
                        onCancel={handleBackToList}
                        isSubmitting={isSubmitting}
                        mediaItems={mediaItems}
                        amenities={amenities}
                        categories={categories}
                        inline={true}
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

    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    return (
        <MainLayout activePage="properties">
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="fw-bold text-dark h3 mb-0">
                            {mode === 'admin' ? 'All Properties' : 'My Properties'}
                        </h1>
                        <p className="text-muted small mb-0">
                            {filteredProperties.length} propert{filteredProperties.length !== 1 ? 'ies' : 'y'} found
                        </p>
                    </div>
                    <button
                        id="add-property-btn"
                        className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                        onClick={handleCreate}
                    >
                        <i className="bi bi-plus-circle"></i>
                        Add Property
                    </button>
                </div>

                {/* Search Bar */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-3">
                        <div className="input-group">
                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                id="property-search"
                                type="text"
                                className="form-control bg-light border-0"
                                placeholder="Search properties by name, city or state..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="btn btn-light border-0" onClick={() => setSearchTerm('')}>
                                    <i className="bi bi-x text-muted"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Properties List */}
                <PropertiesList
                    properties={filteredProperties}
                    isLoading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onNavigateToUnits={handleNavigateToUnits}
                    userRole={user?.role}
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
