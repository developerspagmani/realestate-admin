'use client';

import React from 'react';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';

interface UnitListingViewProps {
    units: any[];
    theme: any;
    widget?: any;
    onSelectUnit: (unit: any) => void;
    trackAction?: (type: string, metadata?: any) => void;
    currencySymbol?: string;
}

const UnitListingView: React.FC<UnitListingViewProps> = ({
    units,
    theme,
    widget,
    onSelectUnit,
    trackAction,
    currencySymbol
}) => {
    const getSymbol = (_propertyCountry?: string) => {
        if (currencySymbol) return currencySymbol;
        const baseCurrency = widget?.tenant?.settings?.general?.currency;
        const tenantCountry = widget?.tenant?.country;
        const input = baseCurrency || tenantCountry || _propertyCountry || 'USA';
        const config = getCurrencyConfig(input);
        return config?.symbol || '$';
    };
    return (
        <div className="row g-4">
            {!units || units.length === 0 ? (
                <div className="col-12 text-center py-5">
                    <i className="bi bi-door-closed fs-1 text-muted opacity-25 d-block mb-3"></i>
                    <h5 className="text-muted">No units available matching your criteria.</h5>
                </div>
            ) : (
                units.map((unit: any) => (
                    <div key={unit.id} className="col-md-6 col-lg-4 animate-fade-up">
                        <div
                            className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 property-card cursor-pointer"
                            onClick={() => onSelectUnit(unit)}
                        >
                            <div className="position-relative overflow-hidden" style={{ height: '220px' }}>
                                {unit.mainImage ? (
                                    <img
                                        src={unit.mainImage.url}
                                        alt={unit.name || unit.unitCode}
                                        className="w-100 h-100 object-fit-cover"
                                    />
                                ) : (
                                    <div className="h-100 bg-light d-flex align-items-center justify-content-center opacity-50">
                                        <i className="bi bi-door-closed fs-1 text-muted"></i>
                                    </div>
                                )}
                                <div className="position-absolute top-0 end-0 m-3 px-3 py-1 bg-white rounded-pill shadow-sm small fw-bold" style={{ color: theme.primaryColor }}>
                                    {(() => {
                                        const statusNum = Number(unit.status);
                                        if (statusNum === 2) return <span className="text-warning">Reserved</span>;
                                        if (statusNum === 3) return <span className="text-secondary">Maintenance</span>;
                                        if (statusNum === 4) return <span className="text-danger">Sold</span>;
                                        return <span style={{ color: theme.primaryColor }}>Available</span>;
                                    })()}
                                </div>
                            </div>
                            <div className="card-body p-4">
                                <h6 className="fw-black mb-1" style={{ color: theme.primaryColor }}>
                                    {unit.name || `Unit ${unit.unitCode}`}
                                </h6>
                                <p className="small text-muted mb-3 text-truncate">
                                    {unit.property?.title || 'Residential Project'}
                                </p>

                                <div className="d-flex justify-content-between align-items-center mb-4 p-2 bg-light rounded-3">
                                    <div>
                                        <span className="d-block extra-small text-muted text-uppercase fw-bold">Price</span>
                                        <span className="fw-bold fs-5 text-dark">
                                            {getSymbol(unit.property?.country)}{Number(unit.unitPricing?.[0]?.price || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-end">
                                        <span className="d-block extra-small text-muted text-uppercase fw-bold">Area</span>
                                        <span className="fw-bold text-dark">{unit.sizeSqft || 0} sqft</span>
                                    </div>
                                </div>

                                <div className="d-flex gap-2 mb-3">
                                    <div className="flex-fill bg-light p-2 rounded-3 text-center">
                                        <i className="bi bi-bed small me-1" style={{ color: theme.primaryColor }}></i>
                                        <span className="fw-bold small">{unit.realEstateDetails?.bedrooms || 0}</span>
                                    </div>
                                    <div className="flex-fill bg-light p-2 rounded-3 text-center">
                                        <i className="bi bi-water small me-1" style={{ color: theme.primaryColor }}></i>
                                        <span className="fw-bold small">{unit.realEstateDetails?.bathrooms || 0}</span>
                                    </div>
                                    <div className="flex-fill bg-light p-2 rounded-3 text-center">
                                        <i className="bi bi-building small me-1" style={{ color: theme.primaryColor }}></i>
                                        <span className="fw-bold small">{unit.floorNo || 0}</span>
                                    </div>
                                </div>

                                <button 
                                    className="btn w-100 rounded-3 fw-bold py-2 shadow-sm text-white"
                                    style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectUnit(unit);
                                    }}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}

            <style jsx>{`
                .extra-small { font-size: 10px; }
                .property-card { transition: all 0.3s ease; border: 1px solid transparent; }
                .property-card:hover { 
                    transform: translateY(-5px); 
                    box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important;
                    border-color: ${theme.primaryColor}20;
                }
            `}</style>
        </div>
    );
};

export default UnitListingView;
