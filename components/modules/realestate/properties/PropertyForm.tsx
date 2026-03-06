'use client';
import { useState, useEffect } from 'react';
import { propertyService, getAuthToken } from '@/app/services/api';
import { Property, MediaItem, Amenity, Category } from '@/types';
import Loader from '@/components/common/Loader';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import MapView from '@/components/common/MapView';
import MediaSelector from '@/components/shared/MediaSelector';
import CountrySelect from '@/components/common/CountrySelect';
import SearchableSelect from '@/components/common/SearchableSelect';
import Image from 'next/image';

interface PropertyFormProps {
    initialData?: Property | null;
    onSubmit: (data: Partial<Property>) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    mediaItems: MediaItem[];
    amenities: Amenity[];
    categories: Category[];
    /** When true, renders inline (full-page card). When false, renders as a modal overlay. */
    inline?: boolean;
}

export default function PropertyForm({
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
    mediaItems,
    amenities,
    categories,
    inline = false,
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
        country: 'United States',
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
        displayPrice: true,
    });

    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaModalType, setMediaModalType] = useState<'main' | 'gallery' | 'floorPlan' | 'brochure'>('main');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                slug: initialData.slug || '',
                description: initialData.description,
                address: initialData.address,
                addressLine2: initialData.addressLine2 || '',
                city: initialData.city,
                state: initialData.state,
                country: initialData.country || 'United States',
                zipCode: initialData.zipCode,
                latitude: initialData.latitude || 0,
                longitude: initialData.longitude || 0,
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
                categoryId: initialData.categoryId || '',
                videoUrl: initialData.videoUrl || '',
                displayPrice: initialData.displayPrice !== undefined ? initialData.displayPrice : true,
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getMediaUrl = (id?: string) => {
        if (!id) return undefined;
        const item = mediaItems.find(m => m.id === id);
        return item ? item.url : undefined;
    };

    const handleAmenityToggle = (amenityId: string) => {
        const current = formData.amenities || [];
        setFormData({
            ...formData,
            amenities: current.includes(amenityId)
                ? current.filter(id => id !== amenityId)
                : [...current, amenityId],
        });
    };

    const handleMediaSelect = (selection: MediaItem | MediaItem[]) => {
        if (mediaModalType === 'main') {
            setFormData({ ...formData, mainImageId: (selection as MediaItem).id });
        } else if (mediaModalType === 'floorPlan') {
            setFormData({ ...formData, floorPlanId: (selection as MediaItem).id });
        } else if (mediaModalType === 'brochure') {
            setFormData({ ...formData, brochureId: (selection as MediaItem).id });
        } else {
            const newIds = (selection as MediaItem[]).map(m => m.id);
            setFormData({
                ...formData,
                gallery: Array.from(new Set([...(formData.gallery || []), ...newIds])),
            });
        }
        setShowMediaModal(false);
    };

    const AMENITY_CATS = [
        { id: 1, name: 'Facilities', icon: 'bi-grid-fill' },
        { id: 2, name: 'Technology', icon: 'bi-cpu-fill' },
        { id: 3, name: 'Comfort', icon: 'bi-sun-fill' },
        { id: 4, name: 'Safety', icon: 'bi-shield-fill' },
        { id: 5, name: 'Others', icon: 'bi-plus-circle-fill' },
    ];

    // ── SHARED FORM BODY ───────────────────────────────────────────────────────
    const formBody = (
        <form onSubmit={handleSubmit}>

            {/* Validation Banner */}
            {validationErrors.length > 0 && (
                <div className="alert alert-danger border-0 shadow-sm rounded-3 mb-4 d-flex align-items-start gap-3">
                    <i className="bi bi-exclamation-triangle-fill fs-5 mt-1 flex-shrink-0"></i>
                    <div>
                        <div className="fw-bold mb-1">Please fill in the required fields:</div>
                        <div className="d-flex flex-wrap gap-2">
                            {validationErrors.map((err, i) => (
                                <span key={i} className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">{err}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── CARD 1: Basic Information ─────────────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-transparent border-bottom px-4 py-3">
                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                        <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>1</span>
                        Basic Information
                    </h6>
                </div>
                <div className="card-body p-4">
                    <div className="row g-4">
                        <div className="col-md-8">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                Property Title <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control bg-light border-0"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Sunset Heights Business Center"
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">URL Slug</label>
                            <input
                                type="text"
                                className="form-control bg-light border-0"
                                value={formData.slug || ''}
                                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                placeholder="e.g. sunset-heights"
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                Description <span className="text-danger">*</span>
                            </label>
                            <textarea
                                className="form-control bg-light border-0"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                placeholder="Provide a detailed description of the property..."
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Property Type</label>
                            <select className="form-select bg-light border-0" value={formData.propertyType} onChange={e => setFormData({ ...formData, propertyType: e.target.value as any })}>
                                <option value="residential">Residential</option>
                                <option value="commercial">Commercial</option>
                                <option value="industrial">Industrial</option>
                                <option value="mixed_use">Mixed Use</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Category</label>
                            <SearchableSelect
                                options={categories.filter(c => c.status === 1).map(c => ({ id: c.id, name: c.name }))}
                                value={formData.categoryId || ''}
                                onChange={val => setFormData({ ...formData, categoryId: val })}
                                placeholder="Select Category..."
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Status</label>
                            <select className="form-select bg-light border-0" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Listing Type</label>
                            <select className="form-select bg-light border-0" value={formData.listingType || 'rent'} onChange={e => setFormData({ ...formData, listingType: e.target.value as any })}>
                                <option value="rent">Rent</option>
                                <option value="sale">Sale</option>
                                <option value="lease">Lease</option>
                            </select>
                        </div>
                        <div className="col-md-8">
                            <label className="form-label fw-semibold small text-uppercase text-muted d-flex align-items-center gap-2">
                                <i className="bi bi-youtube text-danger"></i>YouTube Video URL
                            </label>
                            <input
                                type="url"
                                className="form-control bg-light border-0"
                                value={formData.videoUrl || ''}
                                onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <div className="form-text">Optional: Add a YouTube video tour or walkthrough</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CARD 2: Pricing & Specifications ─────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-transparent border-bottom px-4 py-3">
                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                        <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>2</span>
                        Pricing &amp; Specifications
                    </h6>
                </div>
                <div className="card-body p-4">
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label fw-semibold small text-uppercase text-muted mb-0">
                                    Base Price ({currencySymbol})
                                </label>
                                <div className="form-check form-switch mb-0 ms-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        id="displayPriceToggle"
                                        checked={formData.displayPrice !== false}
                                        onChange={e => setFormData({ ...formData, displayPrice: e.target.checked })}
                                    />
                                    <label className="form-check-label small text-muted" htmlFor="displayPriceToggle">Show price</label>
                                </div>
                            </div>
                            <input
                                type="number"
                                className="form-control bg-light border-0"
                                value={formData.price || ''}
                                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                placeholder={`${currencySymbol}0.00`}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Area (Sqft / Sqm)</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.area || ''} onChange={e => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })} placeholder="e.g. 1200" />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Lot Size (Sqft)</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.lotSize || ''} onChange={e => setFormData({ ...formData, lotSize: parseInt(e.target.value) || 0 })} placeholder="e.g. 5000" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Bedrooms</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.bedrooms || ''} onChange={e => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })} placeholder="0" min="0" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Bathrooms</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.bathrooms || ''} onChange={e => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })} placeholder="0" min="0" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Parking Spaces</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.parkingSpaces || ''} onChange={e => setFormData({ ...formData, parkingSpaces: parseInt(e.target.value) || 0 })} placeholder="0" min="0" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Year Built</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.yearBuilt || ''} onChange={e => setFormData({ ...formData, yearBuilt: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="e.g. 2020" />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Neighborhood</label>
                            <input type="text" className="form-control bg-light border-0" value={formData.neighborhood || ''} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} placeholder="e.g. Downtown" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CARD 3: Media & Files ─────────────────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-transparent border-bottom px-4 py-3">
                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                        <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>3</span>
                        Media &amp; Files
                    </h6>
                </div>
                <div className="card-body p-4">
                    <div className="row g-4">
                        {/* Main Image */}
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Main Property Image</label>
                            <div
                                className="border border-2 border-dashed rounded-4 p-4 text-center bg-light"
                                style={{ cursor: 'pointer', minHeight: 140 }}
                                onClick={() => { setMediaModalType('main'); setShowMediaModal(true); }}
                            >
                                {formData.mainImageId ? (
                                    <div className="position-relative" style={{ height: 100, width: '100%' }}>
                                        <Image
                                            src={getMediaUrl(formData.mainImageId) || initialData?.mainImage?.url || '/images/placeholder.jpg'}
                                            fill
                                            className="rounded-3 shadow-sm mb-2 object-fit-contain"
                                            alt="Main"
                                        />
                                        <div className="position-absolute bottom-0 start-50 translate-middle-x small text-primary fw-semibold bg-white px-2 rounded-pill shadow-sm">Click to change</div>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        <i className="bi bi-image display-5 text-muted d-block mb-2"></i>
                                        <span className="text-primary fw-semibold">Select Main Image</span>
                                        <div className="small text-muted mt-1">Click to browse</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Floor Plan + Brochure */}
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Floor Plan</label>
                            <div
                                className="border border-2 border-dashed rounded-4 p-3 text-center bg-light"
                                style={{ cursor: 'pointer', minHeight: 140 }}
                                onClick={() => { setMediaModalType('floorPlan'); setShowMediaModal(true); }}
                            >
                                {formData.floorPlanId ? (
                                    <div className="py-2">
                                        <i className="bi bi-file-earmark-image display-5 text-success d-block mb-1"></i>
                                        <div className="small text-success fw-semibold">Floor Plan Selected</div>
                                        <div className="text-muted" style={{ fontSize: 11 }}>Click to change</div>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        <i className="bi bi-layers display-5 text-muted d-block mb-2"></i>
                                        <span className="text-primary fw-semibold small">Upload Floor Plan</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Brochure (PDF)</label>
                            <div
                                className="border border-2 border-dashed rounded-4 p-3 text-center bg-light"
                                style={{ cursor: 'pointer', minHeight: 140 }}
                                onClick={() => { setMediaModalType('brochure'); setShowMediaModal(true); }}
                            >
                                {formData.brochureId ? (
                                    <div className="py-2">
                                        <i className="bi bi-file-earmark-pdf display-5 text-danger d-block mb-1"></i>
                                        <div className="small text-danger fw-semibold">Brochure Selected</div>
                                        <div className="text-muted" style={{ fontSize: 11 }}>Click to change</div>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        <i className="bi bi-file-text display-5 text-muted d-block mb-2"></i>
                                        <span className="text-primary fw-semibold small">Upload Brochure</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gallery */}
                        <div className="col-12">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                Property Gallery
                                <span className="badge bg-light text-muted border ms-2 fw-normal">{(formData.gallery || []).length} images</span>
                            </label>
                            <div className="row g-2">
                                {(formData.gallery || []).map((imgId: string, idx: number) => (
                                    <div key={idx} className="col-4 col-sm-3 col-md-2">
                                        <div className="position-relative rounded-3 overflow-hidden bg-light" style={{ aspectRatio: '1/1' }}>
                                            <Image
                                                src={getMediaUrl(imgId) || '/images/placeholder.jpg'}
                                                fill
                                                className="w-100 h-100 object-fit-cover"
                                                alt={`Gallery ${idx + 1}`}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle p-0 d-flex align-items-center justify-content-center"
                                                style={{ width: 22, height: 22 }}
                                                onClick={() => setFormData({ ...formData, gallery: (formData.gallery || []).filter((id: string) => id !== imgId) })}
                                            >
                                                <i className="bi bi-x" style={{ fontSize: 10 }}></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {/* Add More */}
                                <div className="col-4 col-sm-3 col-md-2">
                                    <div
                                        className="border border-2 border-dashed rounded-3 d-flex flex-column align-items-center justify-content-center bg-light"
                                        style={{ aspectRatio: '1/1', cursor: 'pointer' }}
                                        onClick={() => { setMediaModalType('gallery'); setShowMediaModal(true); }}
                                    >
                                        <i className="bi bi-plus-lg text-primary fs-5"></i>
                                        <span className="small text-primary mt-1">Add</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CARD 4: Amenities ─────────────────────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-transparent border-bottom px-4 py-3">
                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                        <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>4</span>
                        Amenities
                        {(formData.amenities || []).length > 0 && (
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-normal ms-1">
                                {(formData.amenities || []).length} selected
                            </span>
                        )}
                    </h6>
                </div>
                <div className="card-body p-4">
                    {amenities.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-inbox display-4 d-block mb-3 opacity-50"></i>
                            <h6>No Amenities Available</h6>
                            <p className="small mb-0">Add amenities from Settings → Amenities first.</p>
                        </div>
                    ) : (
                        AMENITY_CATS.map(cat => {
                            const catAmenities = amenities.filter(a => (a.category || 5) === cat.id);
                            if (catAmenities.length === 0) return null;
                            return (
                                <div key={cat.id} className="mb-4">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <i className={`bi ${cat.icon} text-primary`}></i>
                                        <span className="fw-semibold small text-uppercase text-muted">{cat.name}</span>
                                    </div>
                                    <div className="row g-2">
                                        {catAmenities.map((amenity: Amenity) => {
                                            const selected = (formData.amenities || []).includes(amenity.id);
                                            return (
                                                <div key={amenity.id} className="col-6 col-md-4 col-lg-3">
                                                    <div
                                                        className={`rounded-3 px-3 py-2 d-flex align-items-center gap-2 border ${selected ? 'bg-primary border-primary text-white' : 'bg-light border-transparent'}`}
                                                        style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                                                        onClick={() => handleAmenityToggle(amenity.id)}
                                                    >
                                                        <i className={`bi ${amenity.icon || 'bi-check-circle'} small ${selected ? 'text-white' : 'text-primary'}`}></i>
                                                        <span className="small fw-medium text-truncate">{amenity.name}</span>
                                                        {selected && <i className="bi bi-check-circle-fill ms-auto flex-shrink-0 small"></i>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── CARD 5: Location & Map ───────────────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-transparent border-bottom px-4 py-3">
                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                        <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>5</span>
                        Location &amp; Map
                    </h6>
                </div>
                <div className="card-body p-4">
                    <div className="row g-4">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                Street Address <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control bg-light border-0" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="123 Business Way" required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Address Line 2</label>
                            <input type="text" className="form-control bg-light border-0" value={formData.addressLine2 || ''} onChange={e => setFormData({ ...formData, addressLine2: e.target.value })} placeholder="Suite, Floor, Unit, etc." />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                Zip / Postal Code <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control bg-light border-0" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} placeholder="90210" required />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                City <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control bg-light border-0" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="e.g. Mumbai" required />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                State <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control bg-light border-0" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="e.g. Maharashtra" required />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Country</label>
                            <CountrySelect
                                value={formData.country || ''}
                                onChange={val => setFormData({ ...formData, country: val })}
                            />
                        </div>

                        {/* Map */}
                        <div className="col-12">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <label className="form-label fw-semibold small text-uppercase text-muted mb-0">Pin on Map</label>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                                >
                                    <i className="bi bi-box-arrow-up-right"></i>
                                    Open in Maps
                                </a>
                            </div>
                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Latitude</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.latitude} onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })} step="0.000001" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Longitude</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.longitude} onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })} step="0.000001" />
                                </div>
                            </div>
                            <div className="rounded-4 overflow-hidden border shadow-sm" style={{ height: 320 }}>
                                <MapView
                                    latitude={formData.latitude || 0}
                                    longitude={formData.longitude || 0}
                                    onChange={(lat: number, lng: number) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                                />
                            </div>
                            <div className="form-text mt-2">
                                <i className="bi bi-info-circle me-1"></i>
                                Drag the map marker to fine-tune the pin location.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FOOTER ACTIONS ───────────────────────────────────────── */}
            <div className="d-flex justify-content-between align-items-center pt-2 pb-4">
                <button
                    type="button"
                    className="btn btn-light px-4 fw-semibold d-flex align-items-center gap-2"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    <i className="bi bi-arrow-left"></i>
                    {inline ? 'Back to List' : 'Cancel'}
                </button>
                <button
                    type="submit"
                    className="btn btn-primary px-5 fw-bold shadow-sm d-flex align-items-center gap-2"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            {initialData ? 'Saving...' : 'Creating...'}
                        </>
                    ) : (
                        <>
                            <i className={`bi ${initialData ? 'bi-check-lg' : 'bi-building-add'}`}></i>
                            {initialData ? 'Save Changes' : 'Register Property'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );

    // ── MEDIA SELECTOR (shared) ────────────────────────────────────────────────
    const mediaSelector = (
        <MediaSelector
            show={showMediaModal}
            onClose={() => setShowMediaModal(false)}
            multiple={mediaModalType === 'gallery'}
            onSelect={handleMediaSelect}
            selectedIds={
                mediaModalType === 'main' ? (formData.mainImageId ? [formData.mainImageId] : []) :
                    mediaModalType === 'floorPlan' ? (formData.floorPlanId ? [formData.floorPlanId] : []) :
                        mediaModalType === 'brochure' ? (formData.brochureId ? [formData.brochureId] : []) :
                            (formData.gallery || [])
            }
            title={
                mediaModalType === 'main' ? 'Select Property Image' :
                    mediaModalType === 'floorPlan' ? 'Select Floor Plan' :
                        mediaModalType === 'brochure' ? 'Select Brochure' : 'Add to Gallery'
            }
        />
    );

    // ── INLINE (FULL-PAGE) MODE ────────────────────────────────────────────────
    if (inline) {
        return (
            <>
                {/* Page Header Card */}
                <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                    <div className="card-body bg-primary bg-gradient p-4">
                        <div className="d-flex align-items-center gap-3">
                            <button
                                type="button"
                                className="btn btn-sm btn-light border-0 d-flex align-items-center gap-2 flex-shrink-0"
                                onClick={onCancel}
                            >
                                <i className="bi bi-arrow-left"></i>
                                <span className="d-none d-sm-inline">Properties</span>
                            </button>
                            <div>
                                <h5 className="mb-0 fw-bold text-white">
                                    {initialData ? 'Edit Property' : 'Register New Property'}
                                </h5>
                                <p className="mb-0 small text-white opacity-75">
                                    {initialData
                                        ? `Editing: ${initialData.name}`
                                        : 'Fill in the details below to register a new property'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {formBody}
                {mediaSelector}
            </>
        );
    }

    // ── MODAL (LEGACY) MODE ────────────────────────────────────────────────────
    return (
        <>
            <div
                className="modal show d-block"
                tabIndex={-1}
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
            >
                <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-primary text-white border-0 p-4">
                            <h5 className="modal-title fw-bold text-white">
                                {initialData ? 'Edit Property Details' : 'Register New Property'}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
                        </div>
                        <div className="modal-body p-4">
                            {formBody}
                        </div>
                    </div>
                </div>
            </div>
            {mediaSelector}
        </>
    );
}
