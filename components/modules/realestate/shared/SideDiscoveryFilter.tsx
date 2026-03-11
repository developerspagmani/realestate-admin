'use client';

import React, { useState } from 'react';

interface SideDiscoveryFilterProps {
    onFilter: (filters: any) => void;
    theme: any;
}

const SideDiscoveryFilter: React.FC<SideDiscoveryFilterProps> = ({ onFilter, theme }) => {
    const [search, setSearch] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [bathrooms, setBathrooms] = useState('');
    const [propertyType, setPropertyType] = useState('');
    const [listingType, setListingType] = useState('');

    const handleApply = () => {
        onFilter({
            search,
            minPrice,
            maxPrice,
            bedrooms,
            bathrooms,
            propertyType,
            listingType
        });
    };

    const handleReset = () => {
        setSearch('');
        setMinPrice('');
        setMaxPrice('');
        setBedrooms('');
        setBathrooms('');
        setPropertyType('');
        setListingType('');
        onFilter({});
    };

    return (
        <div className="side-filter p-4 bg-white rounded-4 border shadow-sm sticky-top" style={{ top: '100px', color: theme.primaryColor }}>
            <h4 className="mb-4 d-flex align-items-center gap-2" style={{ color: theme.primaryColor }}>
                <i className="bi bi-sliders" style={{ color: theme.primaryColor }}></i>
                Filters
            </h4>

            <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase ls-1">Search</label>
                <div className="input-group">
                    <span className="input-group-text bg-light border-0"><i className="bi bi-search"></i></span>
                    <input
                        type="text"
                        className="form-control bg-light border-0 small"
                        placeholder="Location, Property..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase ls-1">Listing Type</label>
                <select
                    className="form-select bg-light border-0 small"
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value)}
                >
                    <option value="">Any Status</option>
                    <option value="Sale">For Sale</option>
                    <option value="Rent">For Rent</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase ls-1">Property Category</label>
                <select
                    className="form-select bg-light border-0 small"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                >
                    <option value="">Any Category</option>
                    <option value="1">Residential</option>
                    <option value="2">Commercial</option>
                    <option value="3">Industrial</option>
                    <option value="4">Mixed Use</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase ls-1">Price Range</label>
                <div className="d-flex gap-2 align-items-center">
                    <input
                        type="number"
                        className="form-control bg-light border-0 small"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span className="text-muted">-</span>
                    <input
                        type="number"
                        className="form-control bg-light border-0 small"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                    />
                </div>
            </div>

            <div className="row g-2 mb-4">
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase ls-1">Beds</label>
                    <select
                        className="form-select bg-light border-0 small"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                    >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                    </select>
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase ls-1">Baths</label>
                    <select
                        className="form-select bg-light border-0 small"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                    >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                    </select>
                </div>
            </div>

            <div className="d-grid gap-2">
                <button
                    className="btn btn-primary rounded-3 fw-400 py-2 shadow-sm"
                    style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                    onClick={handleApply}
                >
                    Apply Filters
                </button>
                <button
                    className="btn btn-link link-muted text-decoration-none small fw-400"
                    onClick={handleReset}
                >
                    Reset All
                </button>
            </div>

            <style jsx>{`
                .ls-1 { letter-spacing: 0.05em; }
                .side-filter {
                    transition: all 0.3s ease;
                }
            `}</style>
        </div>
    );
};

export default SideDiscoveryFilter;
