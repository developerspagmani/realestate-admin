'use client';

import { useState } from 'react';
import { Workspace, Property, BaseListing } from '@/types';
import Link from 'next/link';

interface ListingCardProps {
  workspace: Workspace | Property;
  type: 'coworking' | 'property';
  showOwner?: boolean;
  compact?: boolean;
}

export default function ListingCard({ workspace, type, showOwner = false, compact = false }: ListingCardProps) {
  const [imageError, setImageError] = useState(false);

  const isProperty = type === 'property';
  const property = isProperty ? workspace as Property : null;
  const space = !isProperty ? workspace as Workspace : null;

  const getPriceDisplay = () => {
    if (isProperty && property) {
      const price = property.price;
      const priceType = property.priceType;

      switch (priceType) {
        case 'fixed':
          return `$${price.toLocaleString('en-US')}`;
        case 'per_month':
          return `$${price.toLocaleString('en-US')}/mo`;
        case 'per_year':
          return `$${price.toLocaleString('en-US')}/yr`;
        case 'per_sqft':
          return `$${price}/sqft`;
        default:
          return `$${price.toLocaleString('en-US')}`;
      }
    } else if (space) {
      return `$${space.availableWorkspaces > 0 ? 'From $25/hr' : 'Fully Booked'}`;
    }
    return 'Price on request';
  };

  const getStatusBadge = () => {
    const status = workspace.status;
    const isActive = status === 'active' || (status as any) === 1;
    const isInactive = status === 'inactive' || (status as any) === 2;

    const variant = isActive ? 'success' : isInactive ? 'danger' : 'warning';

    let text = '';
    if (typeof status === 'string' && status.length > 0) {
      text = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    } else if (typeof status === 'number') {
      text = isActive ? 'Active' : isInactive ? 'Inactive' : `Status ${status}`;
    } else {
      text = 'Unknown';
    }

    return <span className={`badge bg-${variant}`}>{text}</span>;
  };

  const getPrimaryInfo = () => {
    if (isProperty && property) {
      return {
        title: property.propertyType ? String(property.propertyType).replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Property',
        subtitle: `${property.squareFootage.toLocaleString('en-US')} sq ft`,
        details: [
          property.bedrooms && `${property.bedrooms} bed`,
          property.bathrooms && `${property.bathrooms} bath`,
          property.yearBuilt && `Built: ${property.yearBuilt}`
        ].filter(Boolean).join(' • ')
      };
    } else if (space) {
      return {
        title: 'Co-working Space',
        subtitle: `${space.totalWorkspaces} workspaces`,
        details: `${space.availableWorkspaces} available • ${space.amenities.slice(0, 2).join(', ')}`
      };
    }
    return { title: '', subtitle: '', details: '' };
  };

  const primaryInfo = getPrimaryInfo();
  const detailUrl = isProperty ? `/properties/${workspace.id}` : `/workspace/${workspace.slug}`;

  return (
    <div className={`card h-100 ${compact ? 'workspace-card-compact' : ''}`}>
      <div className="position-relative">
        {!imageError && workspace.photos && workspace.photos.length > 0 ? (
          <img
            src={workspace.photos[0]}
            alt={workspace.name}
            className="card-img-top workspace-image"
            style={{ height: compact ? '150px' : '200px', objectFit: 'cover' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="card-img-top d-flex align-items-center justify-content-center bg-light"
            style={{ height: compact ? '150px' : '200px' }}
          >
            <i className={`bi ${isProperty ? 'bi-house' : 'bi-building'} display-4 text-muted`}></i>
          </div>
        )}

        <div className="position-absolute top-0 end-0 m-2">
          {getStatusBadge()}
        </div>

        {workspace.rating > 0 && (
          <div className="position-absolute top-0 start-0 m-2">
            <span className="badge bg-dark d-flex align-items-center">
              <i className="bi bi-star-fill me-1"></i>
              {workspace.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="card-body d-flex flex-column">
        <div className="flex-grow-1">
          <h5 className="card-title mb-2">{workspace.name}</h5>

          <div className="text-muted small mb-2">
            <i className="bi bi-geo-alt me-1"></i>
            {workspace.city}, {workspace.state}
          </div>

          <div className="mb-3">
            <div className="fw-bold text-primary">{primaryInfo.title}</div>
            <div className="text-muted small">{primaryInfo.subtitle}</div>
            {primaryInfo.details && (
              <div className="text-muted small mt-1">{primaryInfo.details}</div>
            )}
          </div>

          {!compact && (
            <p className="card-text text-muted small">
              {workspace.description.length > 100
                ? `${workspace.description.substring(0, 100)}...`
                : workspace.description
              }
            </p>
          )}

          <div className="mb-3">
            <h5 className="text-primary mb-0">{getPriceDisplay()}</h5>
            {isProperty && property && (
              <div className="text-muted small">
                {property.listingType ? (property.listingType.charAt(0).toUpperCase() + property.listingType.slice(1)) : 'Unknown'}
              </div>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-auto">
          <Link href={detailUrl} className="btn btn-outline-primary btn-sm">
            View Details
          </Link>

          {showOwner && workspace.owner && (
            <div className="text-muted small">
              <i className="bi bi-person me-1"></i>
              {workspace.owner.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
