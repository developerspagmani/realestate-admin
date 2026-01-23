'use client';

import { useState } from 'react';

export interface FilterOptions {
  // Common filters
  search: string;
  city: string;
  state: string;
  priceMin: string;
  priceMax: string;
  amenities: string[];
  rating: number;
  
  // Co-working specific
  workspaceType: string[];
  capacity: string;
  
  // Property specific
  propertyType: string[];
  listingType: string[];
  bedrooms: string;
  bathrooms: string;
  squareFootageMin: string;
  squareFootageMax: string;
}

interface SharedFiltersProps {
  type: 'coworking' | 'property';
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

const coworkingAmenities = [
  'WiFi', 'Parking', 'Coffee', 'Kitchen', 'Meeting Rooms', 'Printing', 
  'Air Conditioning', 'Security', '24/7 Access', 'Elevator', 'Bike Storage'
];

const propertyAmenities = [
  'Air Conditioning', 'Parking', 'Pool', 'Gym', 'Security', 'Pet Friendly',
  'In-unit Laundry', 'Dishwasher', 'Balcony', 'Storage', 'Fireplace', 'Garden'
];

const workspaceTypes = [
  'desk', 'office', 'meeting_room', 'event_space'
];

const propertyTypes = [
  'residential', 'commercial', 'industrial', 'mixed_use'
];

const listingTypes = [
  'sale', 'rent', 'lease'
];

export default function SharedFilters({ type, filters, onFiltersChange, onReset }: SharedFiltersProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');

  const updateFilter = (key: keyof FilterOptions, value: string | number | string[]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    updateFilter('amenities', updated);
  };

  const toggleArrayFilter = (key: keyof FilterOptions, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(a => a !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const isProperty = type === 'property';
  const amenities = isProperty ? propertyAmenities : coworkingAmenities;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="shared-filters">
      {/* Basic Filters */}
      <div className="card mb-3">
        <div className="card-header">
          <h5 className="mb-0">
            <button 
              className="btn btn-link text-decoration-none w-100 text-start"
              onClick={() => toggleSection('basic')}
            >
              <i className={`bi bi-chevron-${expandedSection === 'basic' ? 'down' : 'right'} me-2`}></i>
              Basic Filters
            </button>
          </h5>
        </div>
        {expandedSection === 'basic' && (
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Search ${isProperty ? 'properties' : 'workspace'}...`}
                  value={filters.search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFilter('search', e.target.value)}
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter city"
                  value={filters.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFilter('city', e.target.value)}
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter state"
                  value={filters.state}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFilter('state', e.target.value)}
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Minimum Rating</label>
                <select
                  className="form-select"
                  value={filters.rating}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFilter('rating', Number(e.target.value))}
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price Filters */}
      <div className="card mb-3">
        <div className="card-header">
          <h5 className="mb-0">
            <button 
              className="btn btn-link text-decoration-none w-100 text-start"
              onClick={() => toggleSection('price')}
            >
              <i className={`bi bi-chevron-${expandedSection === 'price' ? 'down' : 'right'} me-2`}></i>
              Price
            </button>
          </h5>
        </div>
        {expandedSection === 'price' && (
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Minimum {isProperty ? 'Price' : 'Rate'}</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min"
                  value={filters.priceMin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFilter('priceMin', e.target.value)}
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Maximum {isProperty ? 'Price' : 'Rate'}</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max"
                  value={filters.priceMax}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFilter('priceMax', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary" onClick={onReset}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Reset Filters
        </button>
        <button className="btn btn-primary" onClick={() => setExpandedSection(null)}>
          <i className="bi bi-check-lg me-2"></i>
          Apply Filters
        </button>
      </div>
    </div>
  );
}
