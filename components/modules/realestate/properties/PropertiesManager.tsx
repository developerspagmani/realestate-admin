'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { propertyService, mediaService, amenityService, categoryService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MainLayout from '@/components/MainLayout';
import PropertiesList from './PropertiesList';
import PropertyForm from './PropertyForm';
import BrochureManager from './BrochureManager';
import Toast from '@/components/common/Toast';
import { Property, MediaItem, Amenity, Category } from '@/types';

interface PropertiesManagerProps {
    mode: 'admin' | 'owner';
}

interface RawProperty {
    id: string;
    title?: string;
    name?: string;
    slug?: string;
    description?: string;
    addressLine1?: string;
    address?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    tenantId?: string;
    propertyType?: number | string;
    status?: number | string;
    mainImageId?: string;
    gallery?: string[];
    price?: number;
    area?: number;
    sizeSqft?: number;
    floorPlanId?: string;
    brochureId?: string;
    propertyAmenities?: { amenity?: { id: string }; amenityId?: string }[];
    yearBuilt?: number;
    neighborhood?: string;
    parkingSpaces?: number;
    bedrooms?: number;
    bathrooms?: number;
    lotSize?: number;
    listingType?: string;
    categoryId?: string;
    videoUrl?: string;
    displayPrice?: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function PropertiesManager({ mode }: PropertiesManagerProps) {
    const { user, isAuthenticated } = useAuthContext();
    const { tenantType, activeTenantId, activeOwnerId, currencySymbol } = useManagementContext();
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    const [view, setView] = useState<'list' | 'form'>('list');   // ← replaces modal state
    const [properties, setProperties] = useState<Property[]>([]);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importStep, setImportStep] = useState<'file' | 'mapping' | 'progress'>('file');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importProgress, setImportProgress] = useState(0);
    const [importTotal, setImportTotal] = useState(0);
    const [showBrochureModal, setShowBrochureModal] = useState(false);
    const [selectedBrochureProperty, setSelectedBrochureProperty] = useState<Property | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success',
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => { setMounted(true); }, []);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
            const industryType = (mode === 'admin' && !activeOwnerId && !activeTenantId) ? tenantType : undefined;

            console.log('PropertiesManager: Loading data with:', { tenantId, industryType, activeOwnerId, mode });

            // Load Properties
            const propsRes = await propertyService.getProperties(token, {
                tenantId: tenantId || undefined,
                industryType,
                ...(mode === 'admin' && activeOwnerId && { ownerId: activeOwnerId }),
            });

            if (propsRes.success) {
                const rawProps: RawProperty[] = propsRes.data?.properties || propsRes.data || [];
                setProperties(rawProps.map((p) => ({
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
                        : ((p.propertyType as Property['propertyType']) || 'residential'),
                    status: typeof p.status === 'number'
                        ? (p.status === 1 ? 'active' : p.status === 2 ? 'inactive' : 'maintenance')
                        : ((p.status as Property['status']) || 'active'),
                    mainImageId: p.mainImageId || '',
                    gallery: p.gallery || [],
                    price: p.price || 0,
                    area: p.area || p.sizeSqft || 0,
                    floorPlanId: p.floorPlanId || '',
                    brochureId: p.brochureId || '',
                    amenities: p.propertyAmenities ? p.propertyAmenities.map((pa) => pa.amenity?.id || pa.amenityId || '') : [],
                    yearBuilt: p.yearBuilt,
                    neighborhood: p.neighborhood || '',
                    parkingSpaces: p.parkingSpaces || 0,
                    bedrooms: p.bedrooms || 0,
                    bathrooms: p.bathrooms || 0,
                    lotSize: p.lotSize || 0,
                    listingType: (p.listingType?.toLowerCase() as Property['listingType']) || 'rent',
                    categoryId: p.categoryId || '',
                    videoUrl: p.videoUrl || '',
                    displayPrice: p.displayPrice !== undefined ? p.displayPrice : true,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                    // Missing fields from Property interface
                    priceType: 'fixed',
                    squareFootage: p.area || p.sizeSqft || 0,
                    features: [],
                    photos: p.gallery || [],
                    rating: 0,
                    totalReviews: 0,
                })));
            }

            // Load Media
            const mediaRes = await mediaService.getMedia(token, tenantId ? { tenantId } : undefined);
            if (mediaRes.success) {
                const items = Array.isArray(mediaRes.data) ? mediaRes.data : (mediaRes.data?.media || []);
                setMediaItems(items);
            }

            // Load Amenities
            const amenRes = await amenityService.getAmenities(token);
            if (amenRes.success) setAmenities(amenRes.data.amenities || []);

            // Load Categories
            const catRes = await categoryService.getCategories(token);
            if (catRes.success) setCategories(catRes.data.categories || []);

        } catch (error) {
            console.error('Failed to load properties data:', error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, [activeOwnerId, activeTenantId, mode, tenantType, user?.tenantId]);

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated || !user) { router.push('/login'); return; }
        loadData();
    }, [mounted, isAuthenticated, user, router, loadData]);

    // ── DATA LOADING ──────────────────────────────────────────────────────────

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

    const toggleSelectAll = () => {
        if (selectedProperties.length === filteredProperties.length) setSelectedProperties([]);
        else setSelectedProperties(filteredProperties.map(p => p.id));
    };

    const toggleSelect = (id: string) => {
        setSelectedProperties(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleDelete = async (id: string | string[]) => {
        const ids = Array.isArray(id) ? id : [id];
        if (!window.confirm(`Are you sure you want to delete ${ids.length} property(ies)?`)) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const tenantId = (mode === 'admin' && activeTenantId)
                ? activeTenantId
                : (user?.tenantId || undefined);

            await Promise.all(ids.map(i => propertyService.deleteProperty(token, i, tenantId)));

            showToast(`${ids.length} property(ies) deleted successfully`);
            setProperties(prev => prev.filter(p => !ids.includes(p.id)));
            setSelectedProperties([]);
        } catch (error) {
            console.error('Failed to delete property:', error);
            showToast('Error deleting property.', 'error');
        }
    };

    const handleSaveProperty = async (data: Partial<Property>, propertyId?: string) => {
        const token = getAuthToken();
        if (!token) return;

        const tenantId = (mode === 'admin' && activeTenantId)
            ? activeTenantId
            : (user?.tenantId || undefined);

        if (!tenantId) throw new Error('Tenant ID is required');

        const payload = {
            tenantId,
            title: data.name,
            slug: data.slug || undefined,
            description: data.description,
            addressLine1: data.address,
            addressLine2: data.addressLine2 || undefined,
            city: data.city,
            state: data.state,
            country: data.country || 'USA',
            postalCode: data.zipCode,
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            propertyType: data.propertyType === 'residential' ? 1
                : data.propertyType === 'commercial' ? 2
                    : data.propertyType === 'industrial' ? 3 : 4,
            status: data.status === 'active' ? 1 : data.status === 'inactive' ? 2 : 3,
            mainImageId: data.mainImageId,
            gallery: data.gallery,
            area: data.area,
            floorPlanId: data.floorPlanId,
            brochureId: data.brochureId,
            amenities: data.amenities,
            yearBuilt: data.yearBuilt,
            neighborhood: data.neighborhood,
            parkingSpaces: data.parkingSpaces,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            lotSize: data.lotSize,
            listingType: data.listingType,
            categoryId: data.categoryId || undefined,
            videoUrl: data.videoUrl || undefined,
            displayPrice: data.displayPrice,
            price: data.price,
        };

        if (propertyId) {
            return await propertyService.updateProperty(token, propertyId, payload, tenantId);
        } else {
            return await propertyService.createProperty(token, payload, tenantId);
        }
    };

    const handleSubmit = async (formData: Partial<Property>) => {
        try {
            setIsSubmitting(true);
            await handleSaveProperty(formData, editingProperty?.id);
            showToast(editingProperty ? 'Property updated successfully!' : 'Property registered successfully!');
            await loadData();
            setIsSubmitting(false);
            handleBackToList();
        } catch (error: unknown) {
            console.error('Failed to save property:', error);
            const errorMessage = (error as { message?: string })?.message || 'Error saving property.';
            showToast(errorMessage, 'error');
            setIsSubmitting(false);
        }
    };

    const handleNavigateToUnits = (id: string) => {
        const basePath = mode === 'admin' ? '/realestate-admin/units' : '/realestate-owner-admin/units';
        router.push(`${basePath}?propertyId=${id}`);
    };

    const filteredProperties = properties.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.state.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleGenerateBrochure = (property: Property) => {
        setSelectedBrochureProperty(property);
        setShowBrochureModal(true);
    };

    const handleExport = () => {
        const exportList = selectedProperties.length > 0
            ? properties.filter(p => selectedProperties.includes(p.id))
            : filteredProperties;

        if (exportList.length === 0) { showToast('No properties to export', 'error'); return; }

        const headers = ['Property ID', 'Name', 'Description', 'Type', 'Address', 'City', 'State', 'Zip', 'Price', 'Area', 'Bedrooms', 'Bathrooms', 'Status'];
        const rows = exportList.map(p => [
            `"${p.id}"`,
            `"${p.name}"`,
            `"${p.description?.replace(/"/g, '""')}"`,
            `"${p.propertyType}"`,
            `"${p.address}"`,
            `"${p.city}"`,
            `"${p.state}"`,
            `"${p.zipCode}"`,
            `"${p.price}"`,
            `"${p.area}"`,
            `"${p.bedrooms}"`,
            `"${p.bathrooms}"`,
            `"${p.status}"`
        ]);

        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `properties_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        showToast(`${exportList.length} properties exported`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const lines = (event.target?.result as string).split('\n').filter(l => l.trim());
            if (lines.length < 2) { showToast('Invalid CSV file', 'error'); return; }
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
            setCsvHeaders(headers);
            setCsvRows(rows);

            const fields = ['name', 'description', 'propertyType', 'address', 'city', 'state', 'zipCode', 'price', 'area', 'bedrooms', 'bathrooms'];
            const init: Record<string, string> = {};
            fields.forEach(f => {
                const match = headers.find(h => h.toLowerCase().includes(f.toLowerCase().replace(/([A-Z])/g, ' $1').trim().toLowerCase()));
                if (match) init[f] = match;
            });
            setMapping(init);
            setImportStep('mapping');
        };
        reader.readAsText(file);
    };

    const executeImport = async () => {
        setImportStep('progress');
        setImportTotal(csvRows.length);
        const token = getAuthToken();
        const tenantId = mode === 'admin' ? activeTenantId : user?.tenantId;
        if (!token || !tenantId) return;

        for (let i = 0; i < csvRows.length; i++) {
            const row = csvRows[i];
            const get = (f: string) => { const h = mapping[f]; if (!h) return undefined; return row[csvHeaders.indexOf(h)]; };

            try {
                const payload = {
                    name: get('name') || 'Imported Property',
                    description: get('description'),
                    propertyType: get('propertyType') || 'residential',
                    address: get('address'),
                    city: get('city'),
                    state: get('state'),
                    zipCode: get('zipCode'),
                    price: Number(get('price')) || 0,
                    area: Number(get('area')) || 0,
                    bedrooms: Number(get('bedrooms')) || 0,
                    bathrooms: Number(get('bathrooms')) || 0,
                    status: 'active'
                };
                await handleSaveProperty(payload as Partial<Property>);
            } catch (err) {
                console.error('Import row failed', i, err);
            }
            setImportProgress(i + 1);
        }
        showToast(`Import completed: ${csvRows.length} processed`);
        setShowImportModal(false);
        setImportStep('file');
        loadData();
    };

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
                    <div className="d-flex gap-2">
                        {selectedProperties.length > 0 && (
                            <button
                                className="btn btn-outline-danger d-flex align-items-center gap-2 px-3 shadow-sm"
                                onClick={() => handleDelete(selectedProperties)}
                            >
                                <i className="bi bi-trash3"></i>
                                Delete Selected ({selectedProperties.length})
                            </button>
                        )}
                        <button
                            className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 shadow-sm"
                            onClick={handleExport}
                        >
                            <i className="bi bi-download"></i>
                            Export
                        </button>
                        <button
                            className="btn btn-outline-primary d-flex align-items-center gap-2 px-3 shadow-sm"
                            onClick={() => setShowImportModal(true)}
                        >
                            <i className="bi bi-upload"></i>
                            Import
                        </button>
                        <button
                            id="add-property-btn"
                            className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                            onClick={handleCreate}
                        >
                            <i className="bi bi-plus-circle"></i>
                            Add Property
                        </button>
                    </div>
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
                    selectedProperties={selectedProperties}
                    onToggleSelect={toggleSelect}
                    onToggleSelectAll={toggleSelectAll}
                    onGenerateBrochure={handleGenerateBrochure}
                />

                {/* Import Modal */}
                {showImportModal && (
                    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 p-4">
                                    <h5 className="modal-title fw-bold">Import Properties from CSV</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowImportModal(false)}></button>
                                </div>
                                <div className="modal-body p-4 pt-0">
                                    {importStep === 'file' && (
                                        <div className="text-center py-5 border-2 border-dashed rounded-4 bg-light">
                                            <i className="bi bi-file-earmark-spreadsheet display-4 text-primary opacity-50 mb-3 d-block"></i>
                                            <h5>Choose a CSV file</h5>
                                            <p className="text-muted small mb-4">Exported CSV files can be re-imported to batch create properties.</p>
                                            <input type="file" accept=".csv" onChange={handleFileChange} className="d-none" id="csvUpload" />
                                            <label htmlFor="csvUpload" className="btn btn-primary px-4">Browse Files</label>
                                        </div>
                                    )}

                                    {importStep === 'mapping' && (
                                        <div>
                                            <h6 className="fw-bold mb-3">Map CSV Columns to Property Fields</h6>
                                            <div className="row g-3">
                                                {['name', 'description', 'propertyType', 'address', 'city', 'state', 'zipCode', 'price', 'area', 'bedrooms', 'bathrooms'].map(field => (
                                                    <div className="col-md-6" key={field}>
                                                        <label className="form-label small text-muted text-uppercase fw-bold">{field.replace(/([A-Z])/g, ' $1')}</label>
                                                        <select
                                                            className="form-select bg-light border-0"
                                                            value={mapping[field] || ''}
                                                            onChange={e => setMapping({ ...mapping, [field]: e.target.value })}
                                                        >
                                                            <option value="">Select Column...</option>
                                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 text-end">
                                                <button className="btn btn-primary px-4" onClick={executeImport}>Start Import ({csvRows.length} rows)</button>
                                            </div>
                                        </div>
                                    )}

                                    {importStep === 'progress' && (
                                        <div className="text-center py-4">
                                            <h6 className="fw-bold mb-3">Importing Properties...</h6>
                                            <div className="progress mb-2" style={{ height: '10px' }}>
                                                <div
                                                    className="progress-bar progress-bar-striped progress-bar-animated"
                                                    style={{ width: `${(importProgress / importTotal) * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-muted small">{importProgress} / {importTotal} processed</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <BrochureManager
                show={showBrochureModal}
                property={selectedBrochureProperty}
                properties={filteredProperties}
                mode={mode}
                allAmenities={amenities}
                allMedia={mediaItems}
                onPropertyChange={(id) => {
                    const found = filteredProperties.find(p => p.id === id);
                    if (found) setSelectedBrochureProperty(found);
                }}
                onClose={() => {
                    setShowBrochureModal(false);
                    setSelectedBrochureProperty(null);
                }}
            />

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </MainLayout>
    );
}
