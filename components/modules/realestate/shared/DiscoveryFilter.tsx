'use client';

import React, { useState, useEffect } from 'react';

interface DiscoveryFilterProps {
    onFilter: (filters: any) => void;
    theme: any;
}

const DiscoveryFilter: React.FC<DiscoveryFilterProps> = ({ onFilter, theme }) => {
    const [search, setSearch] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [bathrooms, setBathrooms] = useState('');
    const [propertyType, setPropertyType] = useState('');
    const [listingType, setListingType] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
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
        <div className="discovery-filter-container mb-4">
            <form onSubmit={handleSearch} className="glass-panel p-3 rounded-4 shadow-sm border-0">
                <div className="row g-2 align-items-center">
                    {/* Main Search */}
                    <div className="col-lg-4">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 rounded-start-4 ps-3">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 py-2 rounded-end-4"
                                placeholder="Search neighborhood, city or property..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="col-lg-2">
                        <select
                            className="form-select py-2 rounded-4"
                            value={listingType}
                            onChange={(e) => setListingType(e.target.value)}
                        >
                            <option value="">Any Type</option>
                            <option value="Sale">For Sale</option>
                            <option value="Rent">For Rent</option>
                        </select>
                    </div>

                    <div className="col-lg-2">
                        <select
                            className="form-select py-2 rounded-4"
                            value={propertyType}
                            onChange={(e) => setPropertyType(e.target.value)}
                        >
                            <option value="">Any Property</option>
                            <option value="1">Residential</option>
                            <option value="2">Commercial</option>
                            <option value="3">Industrial</option>
                        </select>
                    </div>

                    <div className="col-lg-2">
                        <div className="dropdown w-100">
                            <button
                                className="btn btn-white w-100 py-2 rounded-4 border d-flex justify-content-between align-items-center"
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                <span className="small fw-bold">Price & Beds</span>
                                <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'} small`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="col-lg-2">
                        <button
                            type="submit"
                            className="btn btn-primary w-100 py-2 rounded-4 fw-bold shadow-sm"
                            style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                        >
                            Find Home
                        </button>
                    </div>
                </div>

                {/* Advanced Options Panel */}
                {showAdvanced && (
                    <div className="advanced-filters mt-3 pt-3 border-top animate-fade-in">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="form-label extra-small fw-bold text-muted">Budget Range</label>
                                <div className="d-flex gap-2 align-items-center">
                                    <input
                                        type="number"
                                        className="form-control form-control-sm rounded-3"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                    />
                                    <span className="text-muted small">-</span>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm rounded-3"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label extra-small fw-bold text-muted">Min Bedrooms</label>
                                <select
                                    className="form-select form-select-sm rounded-3"
                                    value={bedrooms}
                                    onChange={(e) => setBedrooms(e.target.value)}
                                >
                                    <option value="">Any</option>
                                    <option value="1">1+</option>
                                    <option value="2">2+</option>
                                    <option value="3">3+</option>
                                    <option value="4">4+</option>
                                    <option value="5">5+</option>
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label extra-small fw-bold text-muted">Min Bathrooms</label>
                                <select
                                    className="form-select form-select-sm rounded-3"
                                    value={bathrooms}
                                    onChange={(e) => setBathrooms(e.target.value)}
                                >
                                    <option value="">Any</option>
                                    <option value="1">1+</option>
                                    <option value="2">2+</option>
                                    <option value="3">3+</option>
                                </select>
                            </div>

                            <div className="col-md-5 d-flex align-items-end justify-content-end gap-2">
                                <button type="button" className="btn btn-link link-danger btn-sm text-decoration-none" onClick={handleReset}>
                                    Clear Filters
                                </button>
                                <button type="submit" className="btn btn-dark btn-sm rounded-pill px-4">
                                    Apply filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            <style jsx>{`
                .extra-small { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
                .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default DiscoveryFilter;
