'use client';

import { useState, useEffect } from 'react';
import { Property, MediaItem } from '@/types';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MapView from '@/components/common/MapView';
import MediaSelector from '@/components/shared/MediaSelector';

interface PropertyFormProps {
    initialData?: Property | null;
    onSubmit: (data: Partial<Property>) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    mediaItems: MediaItem[]; // We pass media items down to avoid re-fetching
    amenities: any[];
    categories: any[]; // Property categories
}

export default function PropertyForm({
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
    mediaItems,
    amenities,
    categories
}: PropertyFormProps) {
    const { currencySymbol } = useManagementContext();
    const [formData, setFormData] = useState<Partial<Property>>({
        name: '',
        slug: '',
        description: '',
        address: '',
        addressLine2: '',
        city: '',
        state: '',
        country: 'USA',
        zipCode: '',
        latitude: 0,
        longitude: 0,
        price: 0,
        propertyType: 'residential',
        status: 'active',
        mainImageId: '',
        gallery: [],
        amenities: [],
        area: 0,
        yearBuilt: undefined,
        neighborhood: '',
        parkingSpaces: 0,
        bedrooms: 0,
        bathrooms: 0,
        lotSize: 0,
        listingType: 'rent',
        categoryId: '',
        videoUrl: '',
        displayPrice: true
    });

    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaModalType, setMediaModalType] = useState<'main' | 'gallery' | 'floorPlan' | 'brochure'>('main');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Use passed amenities
    const amenityOptions = amenities;

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                slug: (initialData as any).slug || '',
                description: initialData.description,
                address: initialData.address,
                addressLine2: (initialData as any).addressLine2 || '',
                city: initialData.city,
                state: initialData.state,
                country: (initialData as any).country || 'USA',
                zipCode: initialData.zipCode,
                latitude: (initialData as any).latitude || 0,
                longitude: (initialData as any).longitude || 0,
                price: initialData.price || 0,
                area: initialData.area || 0,
                propertyType: initialData.propertyType,
                status: initialData.status,
                mainImageId: initialData.mainImageId || '',
                gallery: initialData.gallery || [],
                floorPlanId: initialData.floorPlanId || '',
                brochureId: initialData.brochureId || '',
                amenities: initialData.amenities || [],
                yearBuilt: initialData.yearBuilt,
                neighborhood: initialData.neighborhood || '',
                parkingSpaces: initialData.parkingSpaces || 0,
                bedrooms: initialData.bedrooms || 0,
                bathrooms: initialData.bathrooms || 0,
                lotSize: initialData.lotSize || 0,
                listingType: initialData.listingType || 'rent',
                categoryId: (initialData as any).categoryId || '',
                videoUrl: (initialData as any).videoUrl || '',
                displayPrice: (initialData as any).displayPrice !== undefined ? (initialData as any).displayPrice : true
            });
        }
    }, [initialData]);

    const validateForm = () => {
        const errors: string[] = [];
        if (!formData.name) errors.push('Property Title');
        if (!formData.description) errors.push('Description');
        if (!formData.address) errors.push('Street Address');
        if (!formData.city) errors.push('City');
        if (!formData.state) errors.push('State');
        if (!formData.zipCode) errors.push('Zip Code');

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        } else {
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) modalBody.scrollTop = 0;
        }
    };

    const getMediaUrl = (id?: string) => {
        if (!id) return undefined;
        const item = mediaItems.find(m => m.id === id);
        return item ? item.url : undefined;
    };

    const handleAmenityToggle = (amenityId: string) => {
        const currentAmenities = formData.amenities || [];
        if (currentAmenities.includes(amenityId)) {
            setFormData({ ...formData, amenities: currentAmenities.filter(id => id !== amenityId) });
        } else {
            setFormData({ ...formData, amenities: [...currentAmenities, amenityId] });
        }
    };

    return (
        <>
            <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-primary text-white border-0 p-4">
                            <h5 className="modal-title fw-bold text-white">
                                {initialData ? 'Edit Property Details' : 'Register New Property'}
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onCancel}
                            ></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body p-4">
                                {validationErrors.length > 0 && (
                                    <div className="alert alert-danger border-0 shadow-sm rounded-3 mb-4 d-flex align-items-center gap-3">
                                        <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                                        <div>
                                            <div className="fw-bold mb-1">Please fill in the following required fields:</div>
                                            <div className="d-flex flex-wrap gap-2">
                                                {validationErrors.map((err, i) => (
                                                    <span key={i} className="badge bg-danger-subtle text-danger border border-danger-subtle">{err}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <ul className="nav nav-tabs mb-4" id="propertyTab" role="tablist">
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link active" id="details-tab" data-bs-toggle="tab" data-bs-target="#details" type="button" role="tab" aria-selected="true">Basic Details</button>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link" id="media-tab" data-bs-toggle="tab" data-bs-target="#media" type="button" role="tab" aria-selected="false">Media & Files</button>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link" id="amenities-tab" data-bs-toggle="tab" data-bs-target="#amenities" type="button" role="tab" aria-selected="false">Amenities</button>
                                    </li>
                                    <li className="nav-item" role="presentation">
                                        <button className="nav-link" id="location-tab" data-bs-toggle="tab" data-bs-target="#location" type="button" role="tab" aria-selected="false">Location & Map</button>
                                    </li>
                                </ul>

                                <div className="tab-content" id="propertyTabContent">
                                    {/* Basic Details Tab */}
                                    <div className="tab-pane fade show active" id="details" role="tabpanel" aria-labelledby="details-tab">
                                        <div className="row g-4">
                                            <div className="col-md-8">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Property Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                    placeholder="e.g. Sunset Heights Business Center"
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">URL Slug (Unique)</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg bg-light border-0"
                                                    value={formData.slug}
                                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                                    placeholder="e.g. sunset-heights"
                                                />
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Description</label>
                                                <textarea
                                                    className="form-control bg-light border-0"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    rows={3}
                                                    required
                                                    placeholder="Provide a detailed description of the property..."
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Property Type</label>
                                                <select
                                                    className="form-select bg-light border-0"
                                                    value={formData.propertyType}
                                                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as any })}
                                                    required
                                                >
                                                    <option value="residential">Residential</option>
                                                    <option value="commercial">Commercial</option>
                                                    <option value="industrial">Industrial</option>
                                                    <option value="mixed_use">Mixed Use</option>
                                                </select>
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Category</label>
                                                <select
                                                    className="form-select bg-light border-0"
                                                    value={(formData as any).categoryId || ''}
                                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value } as any)}
                                                >
                                                    <option value="">No Category</option>
                                                    {categories.filter(c => c.status === 1).map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Status</label>
                                                <select
                                                    className="form-select bg-light border-0"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                    required
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                    <option value="maintenance">Maintenance</option>
                                                </select>
                                            </div>

                                            <div className="col-md-12">
                                                <label className="form-label fw-bold small text-uppercase text-muted">
                                                    <i className="bi bi-youtube text-danger me-1"></i>
                                                    YouTube Video URL
                                                </label>
                                                <input
                                                    type="url"
                                                    className="form-control bg-light border-0"
                                                    value={(formData as any).videoUrl || ''}
                                                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value } as any)}
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                />
                                                <div className="form-text small">Add a YouTube video tour or walkthrough of the property</div>
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Area (Sqft/Sqm)</label>
                                                <input
                                                    type="number"
                                                    className="form-control bg-light border-0"
                                                    value={formData.area || ''}
                                                    onChange={(e) => setFormData({ ...formData, area: e.target.value ? parseFloat(e.target.value) : 0 })}
                                                    placeholder="e.g. 1200"
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <label className="form-label fw-bold small text-uppercase text-muted mb-0">Base Price ({currencySymbol})</label>
                                                    <div className="form-check form-switch p-0 m-0 d-flex align-items-center">
                                                        <label className="form-check-label extra-small text-muted me-2" style={{ fontSize: '10px' }} htmlFor="displayPrice">Show in Widget</label>
                                                        <input
                                                            className="form-check-input ms-0 mt-0"
                                                            type="checkbox"
                                                            role="switch"
                                                            id="displayPrice"
                                                            checked={formData.displayPrice !== false}
                                                            onChange={(e) => setFormData({ ...formData, displayPrice: e.target.checked })}
                                                        />
                                                    </div>
                                                </div>
                                                <input
                                                    type="number"
                                                    className="form-control bg-light border-0"
                                                    value={formData.price || ''}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : 0 })}
                                                    placeholder={`${currencySymbol}0.00`}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Listing Type</label>
                                                <select
                                                    className="form-select bg-light border-0"
                                                    value={formData.listingType || 'rent'}
                                                    onChange={(e) => setFormData({ ...formData, listingType: e.target.value as any })}
                                                    required
                                                >
                                                    <option value="rent">Rent</option>
                                                    <option value="sale">Sale</option>
                                                    <option value="lease">Lease</option>
                                                </select>
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Neighborhood</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-light border-0"
                                                    value={formData.neighborhood || ''}
                                                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                                    placeholder="e.g. Downtown"
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Year Built</label>
                                                <input
                                                    type="number"
                                                    className="form-control bg-light border-0"
                                                    value={formData.yearBuilt || ''}
                                                    onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value ? parseInt(e.target.value) : undefined })}
                                                    placeholder="e.g. 2020"
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Lot Size (Sqft)</label>
                                                <input
                                                    type="number"
                                                    className="form-control bg-light border-0"
                                                    value={formData.lotSize || ''}
                                                    onChange={(e) => setFormData({ ...formData, lotSize: e.target.value ? parseInt(e.target.value) : 0 })}
                                                    placeholder="e.g. 5000"
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Bedrooms</label>
                                                <input
                                                    type="number"
                                                    className="form-control bg-light border-0"
                                                    value={formData.bedrooms || ''}
                                                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value ? parseInt(e.target.value) : 0 })}
                                                    placeholder="0"
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Bathrooms</label>
                                                <input
                                                    type="number"
                                                    className="form-control bg-light border-0"
                                                    value={formData.bathrooms || ''}
                                                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value ? parseInt(e.target.value) : 0 })}
                                                    placeholder="0"
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Parking Spaces</label>
                                                <input
                                                    type="number"
                                                    className="form-control bg-light border-0"
                                                    value={formData.parkingSpaces || ''}
                                                    onChange={(e) => setFormData({ ...formData, parkingSpaces: e.target.value ? parseInt(e.target.value) : 0 })}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Media Tab */}
                                    <div className="tab-pane fade" id="media" role="tabpanel" aria-labelledby="media-tab">
                                        <div className="row g-4">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-muted text-uppercase">Main Property Image</label>
                                                <div
                                                    className="border-2 border-dashed rounded-4 p-3 text-center cursor-pointer bg-light hvr-light"
                                                    onClick={() => { setMediaModalType('main'); setShowMediaModal(true); }}
                                                >
                                                    {formData.mainImageId ? (
                                                        <div className="position-relative d-inline-block">
                                                            <img
                                                                src={getMediaUrl(formData.mainImageId || '') || (initialData as any)?.mainImage?.url || undefined}
                                                                className="rounded-3 shadow-sm"
                                                                style={{ maxHeight: '120px' }}
                                                                alt="Main Property"
                                                            />
                                                            <div className="mt-2 small text-primary">Click to change</div>
                                                        </div>
                                                    ) : (
                                                        <div className="py-3">
                                                            <i className="bi bi-image display-6 text-muted mb-2 d-block"></i>
                                                            <span className="text-primary fw-semibold">Select Main Image</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <label className="form-label small fw-bold text-muted text-uppercase">Floor Plan</label>
                                                <div
                                                    className="border-2 border-dashed rounded-4 p-3 text-center cursor-pointer bg-light hvr-light"
                                                    onClick={() => { setMediaModalType('floorPlan'); setShowMediaModal(true); }}
                                                >
                                                    {formData.floorPlanId ? (
                                                        <div className="position-relative">
                                                            <i className="bi bi-file-earmark-image display-6 text-success d-block mb-2"></i>
                                                            <div className="small text-success text-truncate">Floor Plan Selected</div>
                                                            <div className="extra-small text-muted mt-1">Click to change</div>
                                                        </div>
                                                    ) : (
                                                        <div className="py-3">
                                                            <i className="bi bi-layers display-6 text-muted mb-2 d-block"></i>
                                                            <span className="text-primary fw-semibold">Upload Floor Plan</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <label className="form-label small fw-bold text-muted text-uppercase">Brochure</label>
                                                <div
                                                    className="border-2 border-dashed rounded-4 p-3 text-center cursor-pointer bg-light hvr-light"
                                                    onClick={() => { setMediaModalType('brochure'); setShowMediaModal(true); }}
                                                >
                                                    {formData.brochureId ? (
                                                        <div className="position-relative">
                                                            <i className="bi bi-file-earmark-pdf display-6 text-danger d-block mb-2"></i>
                                                            <div className="small text-danger text-truncate">Brochure Selected</div>
                                                            <div className="extra-small text-muted mt-1">Click to change</div>
                                                        </div>
                                                    ) : (
                                                        <div className="py-3">
                                                            <i className="bi bi-file-text display-6 text-muted mb-2 d-block"></i>
                                                            <span className="text-primary fw-semibold">Upload Brochure</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-md-12">
                                                <label className="form-label small fw-bold text-muted text-uppercase">Property Gallery</label>
                                                <div className="row g-2">
                                                    {formData.gallery && formData.gallery.map((imgId: string, idx: number) => (
                                                        <div key={idx} className="col-3 col-md-2">
                                                            <div className="position-relative aspect-ratio-square bg-light rounded-3 overflow-hidden">
                                                                <img
                                                                    src={getMediaUrl(imgId) || undefined}
                                                                    className="w-100 h-100 object-fit-cover"
                                                                    alt={`Gallery ${idx}`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                                    style={{ width: '20px', height: '20px' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFormData({ ...formData, gallery: (formData.gallery || []).filter((id: string) => id !== imgId) });
                                                                    }}
                                                                >
                                                                    <i className="bi bi-x small"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="col-3 col-md-2">
                                                        <div
                                                            className="aspect-ratio-square border-2 border-dashed rounded-3 d-flex flex-column align-items-center justify-content-center cursor-pointer bg-light hvr-light"
                                                            onClick={() => { setMediaModalType('gallery'); setShowMediaModal(true); }}
                                                        >
                                                            <i className="bi bi-plus-lg text-primary"></i>
                                                            <span className="extra-small text-primary mt-1">Add</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amenities Tab */}
                                    <div className="tab-pane fade" id="amenities" role="tabpanel" aria-labelledby="amenities-tab">
                                        {[
                                            { id: 1, name: 'Facilities', icon: 'bi-grid-fill' },
                                            { id: 2, name: 'Technology', icon: 'bi-cpu-fill' },
                                            { id: 3, name: 'Comfort', icon: 'bi-sun-fill' },
                                            { id: 4, name: 'Safety', icon: 'bi-shield-fill' },
                                            { id: 5, name: 'Others', icon: 'bi-plus-circle-fill' }
                                        ].map((cat) => {
                                            const catAmenities = amenityOptions.filter(a => (a.category || 5) === cat.id);
                                            if (catAmenities.length === 0) return null;

                                            return (
                                                <div key={cat.id} className="mb-4">
                                                    <h6 className="fw-bold text-uppercase small text-primary mb-3 d-flex align-items-center gap-2">
                                                        <i className={`bi ${cat.icon}`}></i>
                                                        {cat.name}
                                                    </h6>
                                                    <div className="row g-3">
                                                        {catAmenities.map((amenity) => (
                                                            <div key={amenity.id} className="col-md-4 col-lg-3">
                                                                <div
                                                                    className={`card h-100 cursor-pointer transition-all border-0 shadow-sm ${formData.amenities?.includes(amenity.id) ? 'bg-primary text-white' : 'bg-light'}`}
                                                                    onClick={() => handleAmenityToggle(amenity.id)}
                                                                >
                                                                    <div className="card-body d-flex align-items-center gap-3 p-3">
                                                                        <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${formData.amenities?.includes(amenity.id) ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'}`} style={{ width: '32px', height: '32px' }}>
                                                                            <i className={`bi ${amenity.icon || 'bi-check-circle'} small`}></i>
                                                                        </div>
                                                                        <span className="fw-medium small">{amenity.name}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {amenityOptions.length === 0 && (
                                            <div className="text-center py-5 text-muted bg-light rounded-4">
                                                <i className="bi bi-inbox display-4 mb-3 d-block opacity-50"></i>
                                                <h5>No Amenities Available</h5>
                                                <p className="small mb-0">Please add amenities from the Settings/Amenities module first.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Location Tab */}
                                    <div className="tab-pane fade" id="location" role="tabpanel" aria-labelledby="location-tab">
                                        <div className="row g-4 mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Street Address</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-light border-0"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    required
                                                    placeholder="123 Business Way"
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Address Line 2</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-light border-0"
                                                    value={formData.addressLine2}
                                                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                                                    placeholder="Suite, Floor, etc."
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Zip Code</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-light border-0"
                                                    value={formData.zipCode}
                                                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                                    required
                                                    placeholder="90210"
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">City</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-light border-0"
                                                    value={formData.city}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">State</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-light border-0"
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Country</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-light border-0"
                                                    value={formData.country}
                                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                    required
                                                    placeholder="e.g. India"
                                                />
                                            </div>
                                        </div>

                                        <hr className="my-4 text-muted opacity-25" />

                                        <div className="row g-4">
                                            <div className="col-12 mb-2">
                                                <label className="form-label fw-bold small text-uppercase text-muted d-flex justify-content-between align-items-center">
                                                    <span>Map Location (Pin Point)</span>
                                                    <span className="badge bg-light text-dark fw-normal">Drag marker to adjust</span>
                                                </label>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Latitude</label>
                                                <input
                                                    type="number"
                                                    className="form-control bg-light border-0"
                                                    value={formData.latitude}
                                                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                                    step="0.000001"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold small text-uppercase text-muted">Longitude</label>
                                                <input
                                                    type="number"
                                                    className="form-control bg-light border-0"
                                                    value={formData.longitude}
                                                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                                    step="0.000001"
                                                />
                                            </div>
                                            <div className="col-12">
                                                <div className="bg-light rounded-4 overflow-hidden position-relative border" style={{ height: '300px' }}>
                                                    <MapView
                                                        latitude={formData.latitude || 0}
                                                        longitude={formData.longitude || 0}
                                                        onChange={(lat: number, lng: number) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                                                    />
                                                </div>
                                                <div className="mt-2 text-end">
                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-link text-decoration-none">
                                                        <i className="bi bi-box-arrow-up-right me-1"></i>Open in Google Maps
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-light px-4 fw-bold"
                                    onClick={onCancel}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            {initialData ? 'Saving...' : 'Creating...'}
                                        </>
                                    ) : (
                                        initialData ? 'Save Changes' : 'Register Property'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <MediaSelector
                show={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                multiple={mediaModalType === 'gallery'}
                onSelect={(selection) => {
                    if (mediaModalType === 'main') {
                        const media = selection as MediaItem;
                        setFormData({ ...formData, mainImageId: media.id });
                    } else if (mediaModalType === 'floorPlan') {
                        const media = selection as MediaItem;
                        setFormData({ ...formData, floorPlanId: media.id });
                    } else if (mediaModalType === 'brochure') {
                        const media = selection as MediaItem;
                        setFormData({ ...formData, brochureId: media.id });
                    } else {
                        const mediaList = selection as MediaItem[];
                        const newIds = mediaList.map(m => m.id);
                        setFormData({
                            ...formData,
                            gallery: Array.from(new Set([...(formData.gallery || []), ...newIds]))
                        });
                    }
                }}
                selectedIds={
                    mediaModalType === 'main' ? (formData.mainImageId ? [formData.mainImageId] : []) :
                        mediaModalType === 'floorPlan' ? (formData.floorPlanId ? [formData.floorPlanId] : []) :
                            mediaModalType === 'brochure' ? (formData.brochureId ? [formData.brochureId] : []) :
                                (formData.gallery || [])
                }
                title={
                    mediaModalType === 'main' ? 'Select Property Image' :
                        mediaModalType === 'floorPlan' ? 'Select Floor Plan' :
                            mediaModalType === 'brochure' ? 'Select Brochure' :
                                'Add to Gallery'
                }
            />

            <style jsx>{`
        .hvr-light:hover { background-color: #f8f9fa !important; border-color: #0d6efd !important; }
        .aspect-ratio-square { aspect-ratio: 1/1; }
        .cursor-pointer { cursor: pointer; }
        .extra-small { font-size: 11px; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
        </>
    );
}
