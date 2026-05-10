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
import RichTextEditor from '@/components/common/RichTextEditor';
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
        locality: '',
        subLocality: '',
        apartmentSociety: '',
        houseNo: '',
        carpetArea: 0,
        builtUpArea: 0,
        superBuiltUpArea: 0,
        balconies: 0,
        totalFloors: 0,
        floorNo: 0,
        availabilityStatus: '',
        ownership: '',
        pricePerSqft: 0,
        allInclusivePrice: false,
        taxExcl: false,
        priceNegotiable: false,
        furnishing: '',
        facing: '',
        flooring: '',
        roadWidth: 0,
        extraRooms: [],
        propertyFeatures: [],
        overlooking: [],
        powerBackup: '',
        reservedParking: false,
        pantryType: '',
        washroomType: '',
        ceilingHeight: 0,
        entranceWidth: 0,
        frontage: 0,
        camCharges: 0,
        lockInPeriod: 0,
        leaseTenure: 0,
        vaastuCompliant: false,
    });

    const [showMediaModal, setShowMediaModal] = useState(false);
    const [showAllSEOImprovements, setShowAllSEOImprovements] = useState(false);
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
                locality: initialData.locality || '',
                subLocality: initialData.subLocality || '',
                apartmentSociety: initialData.apartmentSociety || '',
                houseNo: initialData.houseNo || '',
                carpetArea: initialData.carpetArea || 0,
                builtUpArea: initialData.builtUpArea || 0,
                superBuiltUpArea: initialData.superBuiltUpArea || 0,
                balconies: initialData.balconies || 0,
                totalFloors: initialData.totalFloors || 0,
                floorNo: initialData.floorNo || 0,
                availabilityStatus: initialData.availabilityStatus || '',
                ownership: initialData.ownership || '',
                pricePerSqft: initialData.pricePerSqft || 0,
                allInclusivePrice: initialData.allInclusivePrice || false,
                taxExcl: initialData.taxExcl || false,
                priceNegotiable: initialData.priceNegotiable || false,
                furnishing: initialData.furnishing || '',
                facing: initialData.facing || '',
                flooring: initialData.flooring || '',
                roadWidth: initialData.roadWidth || 0,
                extraRooms: initialData.extraRooms || [],
                propertyFeatures: initialData.propertyFeatures || [],
                overlooking: initialData.overlooking || [],
                powerBackup: initialData.powerBackup || '',
                reservedParking: initialData.reservedParking || false,
                pantryType: initialData.pantryType || '',
                washroomType: initialData.washroomType || '',
                ceilingHeight: initialData.ceilingHeight || 0,
                entranceWidth: initialData.entranceWidth || 0,
                frontage: initialData.frontage || 0,
                camCharges: initialData.camCharges || 0,
                lockInPeriod: initialData.lockInPeriod || 0,
                leaseTenure: initialData.leaseTenure || 0,
                vaastuCompliant: initialData.vaastuCompliant || false,
            });
        }
    }, [initialData]);

    const calculateSEOScore = () => {
        let score = 0;
        const plainDescription = (formData.description || '').replace(/<[^>]*>/g, '');

        // Title (15 pts)
        if (formData.name) {
            score += 5;
            if (formData.name.length >= 20 && formData.name.length <= 60) score += 10;
            else if (formData.name.length > 5) score += 5;
        }

        // Description (20 pts)
        if (plainDescription) {
            score += 5;
            if (plainDescription.length > 300) score += 15;
            else if (plainDescription.length > 160) score += 10;
            else if (plainDescription.length > 50) score += 5;
        }

        // Slug (10 pts)
        if (formData.slug) {
            score += 5;
            if (/^[a-z0-9-]+$/.test(formData.slug)) score += 5;
        }

        // Media (20 pts)
        if (formData.mainImageId) score += 10;
        if ((formData.gallery || []).length >= 3) score += 5;
        if (formData.floorPlanId) score += 5;

        // Location & Map (15 pts)
        if (formData.address && formData.city && formData.state && formData.zipCode) score += 5;
        if (formData.latitude !== 0 && formData.longitude !== 0) score += 5;
        if ((formData.amenities || []).length >= 3) score += 5;

        // Rich Data (20 pts)
        if (formData.price && formData.price > 0) score += 5;
        if (formData.area && formData.bedrooms && formData.bathrooms) score += 5;
        if (formData.yearBuilt || formData.neighborhood) score += 5;
        if (formData.videoUrl) score += 5;

        return score;
    };

    const seoScore = calculateSEOScore();
    const getScoreColor = (score: number) => {
        if (score < 40) return 'danger';
        if (score < 75) return 'warning';
        return 'success';
    };

    const getScoreLabel = (score: number) => {
        if (score < 40) return 'Poor SEO';
        if (score < 75) return 'Fair SEO';
        return 'Optimized SEO';
    };

    const getSEOImprovements = () => {
        const tips = [];
        const plainDescription = (formData.description || '').replace(/<[^>]*>/g, '');
        if (!formData.name || (formData.name || '').length < 20) tips.push({ label: 'Short Title', tip: 'Target 20-60 characters for optimal Google indexing.', icon: 'bi-type-h1', color: 'danger' });
        if (!plainDescription || plainDescription.length < 300) tips.push({ label: 'Thin Content', tip: 'Detailed descriptions (300+ chars) vastly improve organic ranking.', icon: 'bi-text-paragraph', color: 'warning' });
        if (!formData.mainImageId) tips.push({ label: 'No Main Image', tip: 'Properties with high-quality main images get 80% more engagement.', icon: 'bi-image', color: 'danger' });
        if ((formData.gallery || []).length < 5) tips.push({ label: 'Small Gallery', tip: 'Add at least 5 images to keep users on page longer.', icon: 'bi-images', color: 'info' });
        if (!formData.floorPlanId) tips.push({ label: 'Missing Floor Plan', tip: 'Floor plans are the #2 most requested visual asset by serious buyers.', icon: 'bi-layers', color: 'primary' });
        if (!formData.videoUrl) tips.push({ label: 'No Video Tour', tip: 'Video walkthroughs increase dwell time, a massive SEO ranking signal.', icon: 'bi-play-circle', color: 'info' });
        if (!formData.latitude || formData.latitude === 0) tips.push({ label: 'GPS Unset', tip: 'Pin the location precisely to appear in "near me" map searches.', icon: 'bi-geo-alt', color: 'warning' });
        if ((formData.amenities || []).length < 5) tips.push({ label: 'Low Amenities', tip: 'Tagging 5+ amenities helps in filtered discovery searches.', icon: 'bi-stars', color: 'secondary' });
        return tips;
    };

    const seoImprovements = getSEOImprovements();


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
            {/* SEO Scoring Widget */}
            <div className={`card border-0 shadow-sm rounded-4 mb-4 border-start border-4 border-${getScoreColor(seoScore)}`}>
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                            <div className={`bg-${getScoreColor(seoScore)} bg-opacity-10 p-2 rounded-3`}>
                                <i className={`bi bi-graph-up-arrow text-${getScoreColor(seoScore)}`}></i>
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold">SEO Optimization Score</h6>
                                <span className={`extra-small fw-bold text-${getScoreColor(seoScore)} text-uppercase`}>{getScoreLabel(seoScore)}</span>
                            </div>
                        </div>
                        <div className="text-end">
                            <h4 className={`mb-0 fw-bold text-${getScoreColor(seoScore)}`}>{seoScore}<small className="text-muted fs-6">/100</small></h4>
                        </div>
                    </div>
                    <div className="progress" style={{ height: 8, backgroundColor: '#f0f0f0' }}>
                        <div
                            className={`progress-bar bg-${getScoreColor(seoScore)} progress-bar-striped progress-bar-animated`}
                            role="progressbar"
                            style={{ width: `${seoScore}%` }}
                            aria-valuenow={seoScore}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        ></div>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                        <span className="extra-small text-muted">Optimize title, description and media for better reach.</span>
                        <span className="extra-small fw-bold text-muted">{seoScore}% Complete</span>
                    </div>
                </div>
            </div>



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
                <div className="card-header bg-transparent border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
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
                                onChange={e => {
                                    const newName = e.target.value;
                                    const newSlug = newName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                                    const currentSlugFromName = (formData.name || '').toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                                    setFormData(prev => ({
                                        ...prev,
                                        name: newName,
                                        slug: (!prev.slug || prev.slug === currentSlugFromName) ? newSlug : prev.slug
                                    }));
                                }}
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
                                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/ /g, '-') }))}
                                placeholder="e.g. sunset-heights"
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                Description <span className="text-danger">*</span>
                            </label>
                            <RichTextEditor
                                value={formData.description || ''}
                                onChange={val => setFormData(prev => ({ ...prev, description: val }))}
                                placeholder="Describe the property's unique features, location highlights, and value proposition..."
                                className="border-0 shadow-sm"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Property Type</label>
                            <select className="form-select bg-light border-0" value={formData.propertyType} onChange={e => setFormData(prev => ({ ...prev, propertyType: e.target.value as any }))}>
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
                                onChange={val => setFormData(prev => ({ ...prev, categoryId: val }))}
                                placeholder="Select Category..."
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Status</label>
                            <select className="form-select bg-light border-0" value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Listing Type</label>
                            <select className="form-select bg-light border-0" value={formData.listingType || 'rent'} onChange={e => setFormData(prev => ({ ...prev, listingType: e.target.value as any }))}>
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
                                onChange={e => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
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
                                        onChange={e => setFormData(prev => ({ ...prev, displayPrice: e.target.checked }))}
                                    />
                                    <label className="form-check-label small text-muted" htmlFor="displayPriceToggle">Show price</label>
                                </div>
                            </div>
                            <input
                                type="number"
                                className="form-control bg-light border-0"
                                value={formData.price || ''}
                                onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                placeholder={`${currencySymbol}0.00`}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Area (Sqft / Sqm)</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.area || ''} onChange={e => setFormData(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 1200" />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Lot Size (Sqft)</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.lotSize || ''} onChange={e => setFormData(prev => ({ ...prev, lotSize: parseInt(e.target.value) || 0 }))} placeholder="e.g. 5000" />
                        </div>

                        {/* Area Sub-details */}
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Carpet Area (Sqft)</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.carpetArea || ''} onChange={e => setFormData(prev => ({ ...prev, carpetArea: parseInt(e.target.value) || 0 }))} placeholder="e.g. 1000" />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Built-up Area (Sqft)</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.builtUpArea || ''} onChange={e => setFormData({ ...formData, builtUpArea: parseInt(e.target.value) || 0 })} placeholder="e.g. 1100" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Super Built-up Area (Sqft)</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.superBuiltUpArea || ''} onChange={e => setFormData({ ...formData, superBuiltUpArea: parseInt(e.target.value) || 0 })} placeholder="e.g. 1300" />
                        </div>

                        {/* ── RESIDENTIAL ONLY ── */}
                        {formData.propertyType === 'residential' && (
                            <>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Bedrooms</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.bedrooms || ''} onChange={e => setFormData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))} placeholder="0" min="0" />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Bathrooms</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.bathrooms || ''} onChange={e => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))} placeholder="0" min="0" />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Balconies</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.balconies || ''} onChange={e => setFormData(prev => ({ ...prev, balconies: parseInt(e.target.value) || 0 }))} placeholder="0" min="0" />
                                </div>
                            </>
                        )}

                        {/* ── COMMERCIAL ONLY ── */}
                        {formData.propertyType === 'commercial' && (
                            <>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Pantry Type</label>
                                    <select className="form-select bg-light border-0" value={formData.pantryType || ''} onChange={e => setFormData(prev => ({ ...prev, pantryType: e.target.value }))}>
                                        <option value="">Select Pantry</option>
                                        <option value="Private">Private</option>
                                        <option value="Shared">Shared</option>
                                        <option value="None">None</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Washroom Type</label>
                                    <select className="form-select bg-light border-0" value={formData.washroomType || ''} onChange={e => setFormData(prev => ({ ...prev, washroomType: e.target.value }))}>
                                        <option value="">Select Washroom</option>
                                        <option value="Private">Private</option>
                                        <option value="Shared">Shared</option>
                                        <option value="None">None</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">CAM Charges ({currencySymbol})</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.camCharges || ''} onChange={e => setFormData(prev => ({ ...prev, camCharges: parseFloat(e.target.value) || 0 }))} placeholder="Monthly CAM" />
                                </div>
                            </>
                        )}

                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Parking Spaces</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.parkingSpaces || ''} onChange={e => setFormData(prev => ({ ...prev, parkingSpaces: parseInt(e.target.value) || 0 }))} placeholder="0" min="0" />
                        </div>

                        {/* Floor Details */}
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Total Floors</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.totalFloors || ''} onChange={e => setFormData(prev => ({ ...prev, totalFloors: parseInt(e.target.value) || 0 }))} placeholder="e.g. 10" min="0" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Property on Floor</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.floorNo || ''} onChange={e => setFormData(prev => ({ ...prev, floorNo: parseInt(e.target.value) || 0 }))} placeholder="e.g. 4" min="0" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Year Built</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.yearBuilt || ''} onChange={e => setFormData(prev => ({ ...prev, yearBuilt: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="e.g. 2020" />
                        </div>

                        {/* Pricing Sub-details */}
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Price per Sqft</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.pricePerSqft || ''} onChange={e => setFormData(prev => ({ ...prev, pricePerSqft: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 5000" />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Neighborhood</label>
                            <input type="text" className="form-control bg-light border-0" value={formData.neighborhood || ''} onChange={e => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))} placeholder="e.g. Downtown" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Availability Status</label>
                            <select className="form-select bg-light border-0" value={formData.availabilityStatus || ''} onChange={e => setFormData(prev => ({ ...prev, availabilityStatus: e.target.value }))}>
                                <option value="">Select Status</option>
                                <option value="Ready to move">Ready to move</option>
                                <option value="Under construction">Under construction</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Ownership</label>
                            <select className="form-select bg-light border-0" value={formData.ownership || ''} onChange={e => setFormData(prev => ({ ...prev, ownership: e.target.value }))}>
                                <option value="">Select Ownership</option>
                                <option value="Freehold">Freehold</option>
                                <option value="Leasehold">Leasehold</option>
                                <option value="Co-operative society">Co-operative society</option>
                                <option value="Power of Attorney">Power of Attorney</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Furnishing</label>
                            <select className="form-select bg-light border-0" value={formData.furnishing || ''} onChange={e => setFormData(prev => ({ ...prev, furnishing: e.target.value }))}>
                                <option value="">Select Furnishing</option>
                                <option value="Furnished">Furnished</option>
                                <option value="Semi-furnished">Semi-furnished</option>
                                <option value="Un-furnished">Un-furnished</option>
                            </select>
                        </div>
                        {/* ── LEASE SPECIFIC ── */}
                        {(formData.listingType === 'rent' || formData.listingType === 'lease') && (
                            <>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Lock-in Period (Months)</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.lockInPeriod || ''} onChange={e => setFormData({ ...formData, lockInPeriod: parseInt(e.target.value) || 0 })} placeholder="e.g. 6" />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Lease Tenure (Years)</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.leaseTenure || ''} onChange={e => setFormData({ ...formData, leaseTenure: parseInt(e.target.value) || 0 })} placeholder="e.g. 3" />
                                </div>
                            </>
                        )}
                        {/* ── COMMERCIAL EXTRAS ── */}
                        {formData.propertyType === 'commercial' && (
                            <>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Ceiling Height (Ft)</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.ceilingHeight || ''} onChange={e => setFormData({ ...formData, ceilingHeight: parseFloat(e.target.value) || 0 })} placeholder="e.g. 12" />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Entrance Width (Ft)</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.entranceWidth || ''} onChange={e => setFormData({ ...formData, entranceWidth: parseFloat(e.target.value) || 0 })} placeholder="e.g. 10" />
                                </div>
                            </>
                        )}
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Property Facing</label>
                            <select className="form-select bg-light border-0" value={formData.facing || ''} onChange={e => setFormData({ ...formData, facing: e.target.value })}>
                                <option value="">Select Facing</option>
                                <option value="North">North</option>
                                <option value="South">South</option>
                                <option value="East">East</option>
                                <option value="West">West</option>
                                <option value="North-East">North-East</option>
                                <option value="North-West">North-West</option>
                                <option value="South-East">South-East</option>
                                <option value="South-West">South-West</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Type of Flooring</label>
                            <select className="form-select bg-light border-0" value={formData.flooring || ''} onChange={e => setFormData({ ...formData, flooring: e.target.value })}>
                                <option value="">Select Flooring</option>
                                <option value="Marble">Marble</option>
                                <option value="Tiles">Tiles</option>
                                <option value="Wooden">Wooden</option>
                                <option value="Vinyl">Vinyl</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Power Back up</label>
                            <select className="form-select bg-light border-0" value={formData.powerBackup || ''} onChange={e => setFormData({ ...formData, powerBackup: e.target.value })}>
                                <option value="">Select Power Backup</option>
                                <option value="None">None</option>
                                <option value="Partial">Partial</option>
                                <option value="Full">Full</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Width of Facing Road (Feet)</label>
                            <input type="number" className="form-control bg-light border-0" value={formData.roadWidth || ''} onChange={e => setFormData({ ...formData, roadWidth: parseFloat(e.target.value) || 0 })} placeholder="e.g. 30" />
                        </div>

                        {/* ── ADDITIONAL PRICING & OPTIONS ── */}
                        <div className="col-12 mt-3 pt-3 border-top d-flex flex-wrap gap-4">
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="allInclusive" checked={formData.allInclusivePrice || false} onChange={e => setFormData({ ...formData, allInclusivePrice: e.target.checked })} />
                                <label className="form-check-label small fw-medium" htmlFor="allInclusive">All-inclusive Price</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="taxExcl" checked={formData.taxExcl || false} onChange={e => setFormData({ ...formData, taxExcl: e.target.checked })} />
                                <label className="form-check-label small fw-medium" htmlFor="taxExcl">Tax & Govt. charges excluded</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="priceNegotiable" checked={formData.priceNegotiable || false} onChange={e => setFormData({ ...formData, priceNegotiable: e.target.checked })} />
                                <label className="form-check-label small fw-medium" htmlFor="priceNegotiable">Price Negotiable</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="reservedParking" checked={formData.reservedParking || false} onChange={e => setFormData({ ...formData, reservedParking: e.target.checked })} />
                                <label className="form-check-label small fw-medium" htmlFor="reservedParking">Reserved Parking</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="vaastuCompliant" checked={formData.vaastuCompliant || false} onChange={e => setFormData({ ...formData, vaastuCompliant: e.target.checked })} />
                                <label className="form-check-label small fw-medium" htmlFor="vaastuCompliant">Vaastu Compliant</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CARD: Advanced Property Features ─────────────────────── */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-transparent border-bottom px-4 py-3">
                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                        Advanced Property Features
                    </h6>
                </div>
                <div className="card-body p-4">
                    <div className="mb-4">
                        <label className="form-label fw-semibold small text-uppercase text-muted mb-3 d-block">Other Rooms</label>
                        <div className="d-flex flex-wrap gap-2">
                            {['Pooja Room', 'Study Room', 'Servant Room', 'Store Room'].map(room => {
                                const selected = (formData.extraRooms || []).includes(room);
                                return (
                                    <button
                                        key={room}
                                        type="button"
                                        className={`btn btn-sm rounded-pill px-3 py-2 border ${selected ? 'btn-primary border-primary shadow-sm' : 'btn-light text-muted bg-white'}`}
                                        onClick={() => {
                                            setFormData(prev => {
                                                const current = prev.extraRooms || [];
                                                return {
                                                    ...prev,
                                                    extraRooms: selected ? current.filter(r => r !== room) : [...current, room]
                                                };
                                            });
                                        }}
                                    >
                                        <i className={`bi ${selected ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i> {room}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-semibold small text-uppercase text-muted mb-3 d-block">Property Specialities</label>
                        <div className="d-flex flex-wrap gap-2">
                            {[
                                'Corner Property', 'Vaastu Compliant', 'Recently Renovated', 'Private Garden', 
                                'High Ceiling Height', 'False Ceiling Lighting', 'Piped-gas', 
                                'Centrally Air Conditioned', 'Separate entry for servant room'
                            ].map(feature => {
                                const selected = (formData.propertyFeatures || []).includes(feature);
                                return (
                                    <button
                                        key={feature}
                                        type="button"
                                        className={`btn btn-sm rounded-pill px-3 py-2 border ${selected ? 'btn-primary border-primary shadow-sm' : 'btn-light text-muted bg-white'}`}
                                        onClick={() => {
                                            setFormData(prev => {
                                                const current = prev.propertyFeatures || [];
                                                return {
                                                    ...prev,
                                                    propertyFeatures: selected ? current.filter(f => f !== feature) : [...current, feature]
                                                };
                                            });
                                        }}
                                    >
                                        <i className={`bi ${selected ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i> {feature}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mb-0">
                        <label className="form-label fw-semibold small text-uppercase text-muted mb-3 d-block">Overlooking</label>
                        <div className="d-flex flex-wrap gap-2">
                            {['Pool', 'Park', 'Club', 'Main Road', 'Others'].map(item => {
                                const selected = (formData.overlooking || []).includes(item);
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        className={`btn btn-sm rounded-pill px-3 py-2 border ${selected ? 'btn-primary border-primary shadow-sm' : 'btn-light text-muted bg-white'}`}
                                        onClick={() => {
                                            setFormData(prev => {
                                                const current = prev.overlooking || [];
                                                return {
                                                    ...prev,
                                                    overlooking: selected ? current.filter(i => i !== item) : [...current, item]
                                                };
                                            });
                                        }}
                                    >
                                        <i className={`bi ${selected ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i> {item}
                                    </button>
                                );
                            })}
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
                            <input type="text" className="form-control bg-light border-0" value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="123 Business Way" required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Address Line 2 (Sub Locality)</label>
                            <input type="text" className="form-control bg-light border-0" value={formData.addressLine2 || ''} onChange={e => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))} placeholder="Suite, Floor, Unit, etc." />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Apartment / Society</label>
                            <input type="text" className="form-control bg-light border-0" value={formData.apartmentSociety || ''} onChange={e => setFormData(prev => ({ ...prev, apartmentSociety: e.target.value }))} placeholder="e.g. RR Amman Nagar" />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">House No. (Optional)</label>
                            <input type="text" className="form-control bg-light border-0" value={formData.houseNo || ''} onChange={e => setFormData(prev => ({ ...prev, houseNo: e.target.value }))} placeholder="e.g. 15-A" />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Locality</label>
                            <input type="text" className="form-control bg-light border-0" value={formData.locality || ''} onChange={e => setFormData(prev => ({ ...prev, locality: e.target.value }))} placeholder="e.g. Ganeshapuram" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                Zip / Postal Code <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control bg-light border-0" value={formData.zipCode} onChange={e => setFormData(prev => ({ ...prev, zipCode: e.target.value }))} placeholder="90210" required />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                City <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control bg-light border-0" value={formData.city} onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="e.g. Mumbai" required />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">
                                State <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control bg-light border-0" value={formData.state} onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))} placeholder="e.g. Maharashtra" required />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold small text-uppercase text-muted">Country</label>
                            <CountrySelect
                                value={formData.country || ''}
                                onChange={val => setFormData(prev => ({ ...prev, country: val }))}
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
                                    <input type="number" className="form-control bg-light border-0" value={formData.latitude} onChange={e => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))} step="0.000001" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold small text-uppercase text-muted">Longitude</label>
                                    <input type="number" className="form-control bg-light border-0" value={formData.longitude} onChange={e => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))} step="0.000001" />
                                </div>
                            </div>
                            <div className="rounded-4 overflow-hidden border shadow-sm" style={{ height: 320 }}>
                                <MapView
                                    latitude={formData.latitude || 0}
                                    longitude={formData.longitude || 0}
                                    onChange={(lat: number, lng: number) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
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

            {/* SEO Improvements Section */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-transparent border-bottom px-4 py-3">
                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                        <i className="bi bi-lightning-charge-fill text-warning"></i>
                        Actionable SEO Improvements
                        {seoImprovements.length > 0 && <span className="badge bg-warning-subtle text-dark border border-warning-subtle fw-normal ms-2">{seoImprovements.length} items</span>}
                    </h6>
                </div>
                <div className="card-body p-4">
                    {seoImprovements.length === 0 ? (
                        <div className="text-center py-4 bg-success-subtle rounded-4 border border-success-subtle">
                            <i className="bi bi-check-circle-fill text-success fs-2 mb-2"></i>
                            <h6 className="mb-1 fw-bold">Maximum SEO Strength Reached!</h6>
                            <p className="small text-muted mb-0">Your property is perfectly optimized for search engines and portals.</p>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {(showAllSEOImprovements ? seoImprovements : seoImprovements.slice(0, 4)).map((item, idx) => (
                                <div key={idx} className="col-md-6">
                                    <div className={`d-flex align-items-center gap-3 p-3 rounded-4 border border-${item.color}-subtle bg-${item.color}-subtle bg-opacity-10 h-100 transition-all hover-shadow-sm`}>
                                        <div className={`bg-${item.color} text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: 40, height: 40 }}>
                                            <i className={`bi ${item.icon}`}></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold small">{item.label}</div>
                                            <div className="text-muted" style={{ fontSize: '11px', lineHeight: '1.2' }}>{item.tip}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {seoImprovements.length > 4 && (
                                <div className="col-12 text-center mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-link text-muted fw-semibold text-decoration-none bg-light rounded-pill px-4 py-2 border-0 transition-all"
                                        onClick={() => setShowAllSEOImprovements(!showAllSEOImprovements)}
                                    >
                                        {showAllSEOImprovements ? (
                                            <>Show Fewer Improvements <i className="bi bi-chevron-up ms-1 small"></i></>
                                        ) : (
                                            <>+ {seoImprovements.length - 4} more suggestions pending <i className="bi bi-chevron-down ms-1 small"></i></>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Google Search Preview Card */}
            <div className="card shadow-sm rounded-4 mb-4 overflow-hidden" style={{ border: '1px solid #dfe1e5', borderLeft: '4px solid #4285f4' }}>
                <div className="card-header bg-white border-0 py-2 px-3 d-flex align-items-center gap-2">
                    <i className="bi bi-google text-primary small"></i>
                    <span className="small fw-bold text-muted text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Google Search Preview</span>
                </div>
                <div className="card-body p-4 bg-white pt-0">
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                            <i className="bi bi-globe" style={{ fontSize: '14px', color: '#202124' }}></i>
                        </div>
                        <div className="d-flex flex-column" style={{ overflow: 'hidden' }}>
                            <span style={{ fontSize: '14px', color: '#202124', lineHeight: '1.2' }}>yourportal.com</span>
                            <span className="text-muted text-truncate" style={{ fontSize: '12px', lineHeight: '1.2' }}>https://yourportal.com › p › {formData.slug || 'property-slug'}</span>
                        </div>
                    </div>

                    <h5 className="mb-1" style={{ color: '#1a0dab', cursor: 'pointer', fontFamily: 'arial,sans-serif', fontSize: '20px', fontWeight: '400', lineHeight: '1.3' }}>
                        {formData.name || 'Your Property Title'} | Real Estate Listing
                    </h5>

                    <div style={{ color: '#4d5156', fontFamily: 'arial,sans-serif', fontSize: '14px', lineHeight: '1.58' }}>
                        {formData.description ? (
                            (() => {
                                const plain = formData.description.replace(/<[^>]*>/g, '');
                                return plain.length > 160 ? plain.substring(0, 157) + '...' : plain;
                            })()
                        ) : (
                            'Provide a high-quality description for this property. This will be shown on search results pages to entice potential visitors.'
                        )}
                    </div>

                    {(formData.price || formData.city || formData.bedrooms) && (
                        <div className="mt-2 d-flex gap-3 small text-muted border-top border-light pt-2" style={{ fontSize: '13px' }}>
                            {formData.price !== undefined && formData.price > 0 && <span><strong>Price:</strong> {currencySymbol}{formData.price.toLocaleString()}</span>}
                            {formData.city && <span><strong>Location:</strong> {formData.city}</span>}
                            {formData.bedrooms !== undefined && formData.bedrooms > 0 && <span><strong>Beds:</strong> {formData.bedrooms}</span>}
                        </div>
                    )}
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
                            <div className="ms-auto me-3 d-flex align-items-center gap-3">
                                <div className="text-end d-none d-sm-block">
                                    <div className="extra-small text-white opacity-75 fw-bold text-uppercase">SEO Strength</div>
                                    <div className="fw-bold text-white small">{seoScore}/100</div>
                                </div>
                                <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" style={{ width: 40, height: 40, fontSize: 13, border: '2px solid rgba(255,255,255,0.4)' }}>
                                    {seoScore}
                                </div>
                            </div>
                            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
                        </div>
                        <div className="modal-body p-4">
                            {formBody}
                        </div>
                    </div>
                </div>
            </div>
            {mediaSelector}
            <style jsx>{`
                .extra-small { font-size: 10px; }
                .backdrop-blur { backdrop-filter: blur(10px); }
                .pointer-on-hover:hover { background-color: #eee !important; cursor: pointer; }
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.08); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.08); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.08); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.08); }
                
                @keyframes shine {
                    from { background-position: 200% center; }
                    to { background-position: -200% center; }
                }
                .progress-bar-animated {
                    background-image: linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent);
                    background-size: 1rem 1rem;
                    animation: progress-bar-stripes 1s linear infinite;
                }
            `}</style>
        </>
    );
}
