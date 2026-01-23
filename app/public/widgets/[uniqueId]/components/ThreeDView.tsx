'use client';

import React from 'react';
import Workspace3D from '@/components/Workspace3D';

interface ThreeDViewProps {
    selectedProperty: any;
    theme: any;
    setCurrentView: (view: any) => void;
    setSelectedUnit: (unit: any) => void;
    mapUnitsToSeats: (units: any[]) => any[];
}

const ThreeDView: React.FC<ThreeDViewProps> = ({
    selectedProperty,
    theme,
    setCurrentView,
    setSelectedUnit,
    mapUnitsToSeats
}) => {
    return (
        <div className="view-3d animate-fade-in widget-container">
            <div className="p-4 bg-white border-bottom d-flex justify-content-between align-items-center shadow-sm">
                <div>
                    <h5 className="fw-extrabold mb-0 d-flex align-items-center">
                        <i className="bi bi-box-seam me-2 text-primary"></i>
                        Virtual Property Exploration
                    </h5>
                    <p className="extra-small text-muted mb-0">{selectedProperty.title}</p>
                </div>
                <button className="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold" onClick={() => setCurrentView('PROPERTY_DETAIL')}>
                    <i className="bi bi-x-circle me-2"></i>Exit VR Mode
                </button>
            </div>
            <div className="bg-light position-relative" style={{ height: '750px' }}>
                <Workspace3D
                    workspaces={mapUnitsToSeats(selectedProperty.units)}
                    layout={selectedProperty.workspace3D?.layout}
                    config={selectedProperty.workspace3D?.config}
                    onWorkspaceClick={(seats) => {
                        const unit = selectedProperty.units.find((u: any) => u.id === seats.id);
                        if (unit) {
                            setSelectedUnit(unit);
                            setCurrentView('UNIT_DETAIL');
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default ThreeDView;
