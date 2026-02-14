'use client';

import React from 'react';
import Workspace3D from '@/components/Workspace3D';
import { DEMO_HOUSE_PLANS } from '@/app/constants/demoPlans';

interface ThreeDViewProps {
    selectedProperty: any;
    theme: any;
    setCurrentView: (view: any) => void;
    setSelectedUnit: (unit: any) => void;
    mapUnitsToSeats: (units: any[]) => any[];
    currencySymbol?: string;
}

const ThreeDView: React.FC<ThreeDViewProps> = ({
    selectedProperty,
    theme,
    setCurrentView,
    setSelectedUnit,
    mapUnitsToSeats,
    currencySymbol = '$'
}) => {
    // Demo House Plan State
    const [showDemoModal, setShowDemoModal] = React.useState(false);
    const [selectedPlot, setSelectedPlot] = React.useState<any>(null);
    const [activeDemoTour, setActiveDemoTour] = React.useState<any>(null);
    const [suggestedPlans, setSuggestedPlans] = React.useState<any[]>([]);

    const handleOpenDemoPlans = (seats: any) => {
        const unit = selectedProperty.units.find((u: any) => u.id === seats.id);
        if (!unit) return;

        setSelectedPlot({ ...seats, sizeSqft: unit.sizeSqft });

        // Check if layout has a preferred plan assigned in metadata
        const layoutObj = selectedProperty.workspace3D?.layout?.find((l: any) => (l.unitId || l.id) === unit.id);
        const preferredId = layoutObj?.metadata?.preferredPlanId;

        if (preferredId) {
            const plan = DEMO_HOUSE_PLANS.find(p => p.id === preferredId);
            if (plan) {
                setActiveDemoTour(plan);
                return;
            }
        }

        // Otherwise suggest plans based on sqft
        const sqft = unit.sizeSqft || 1000;
        let tier = 'Small (< 1200 Sqft)';
        if (sqft >= 1200 && sqft <= 2500) tier = 'Medium (1200-2500 Sqft)';
        else if (sqft > 2500) tier = 'Large (> 2500 Sqft)';

        const filtered = DEMO_HOUSE_PLANS.filter(p => p.tier === tier);
        if (filtered.length < 3) {
            const others = DEMO_HOUSE_PLANS.filter(p => p.tier !== tier).slice(0, 3 - filtered.length);
            setSuggestedPlans([...filtered, ...others]);
        } else {
            setSuggestedPlans(filtered.slice(0, 3));
        }
        setShowDemoModal(true);
    };

    return (
        <div className="view-3d animate-fade-in widget-container h-100 overflow-hidden">
            <div className="p-4 bg-white border-bottom d-flex justify-content-between align-items-center shadow-sm">
                <div>
                    <h5 className="fw-extrabold mb-0 d-flex align-items-center">
                        <i className="bi bi-box-seam me-2 text-primary"></i>
                        Virtual Property Exploration
                    </h5>
                    <p className="extra-small text-muted mb-0">{selectedProperty.title}</p>
                </div>
                <button className="btn btn-outline-dark btn-sm rounded-4 px-4 fw-bold" onClick={() => setCurrentView('PROPERTY_DETAIL')}>
                    <i className="bi bi-x-circle me-2"></i>Exit VR Mode
                </button>
            </div>
            <div className="bg-light position-relative" style={{ height: 'calc(100% - 85px)' }}>
                <Workspace3D
                    workspaces={mapUnitsToSeats(selectedProperty.units)}
                    layout={selectedProperty.workspace3D?.layout}
                    config={selectedProperty.workspace3D?.config}
                    currencySymbol={currencySymbol}
                    onWorkspaceClick={(seats) => {
                        const unit = selectedProperty.units.find((u: any) => u.id === seats.id);
                        if (unit) {
                            setSelectedUnit(unit);
                            setCurrentView('UNIT_DETAIL');
                        }
                    }}
                    onShowDemoPlans={handleOpenDemoPlans}
                />

                {/* Demo Plans Modal */}
                {showDemoModal && selectedPlot && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060, backdropFilter: 'blur(5px)' }}>
                        <div className="bg-white rounded-5 shadow-lg overflow-hidden w-100" style={{ maxWidth: '700px' }}>
                            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="fw-bold mb-0 text-primary">Suggesting House Plans</h6>
                                    <p className="extra-small text-muted mb-0">Based on plot <strong>{selectedPlot.name}</strong> ({selectedPlot.sizeSqft || 1000} Sqft)</p>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setShowDemoModal(false)}></button>
                            </div>
                            <div className="p-4 overflow-auto" style={{ maxHeight: '500px' }}>
                                <div className="row g-3">
                                    {suggestedPlans.map(plan => (
                                        <div key={plan.id} className="col-md-4">
                                            <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden border">
                                                <img src={plan.preview} className="card-img-top" alt={plan.name} style={{ height: '100px', objectFit: 'cover' }} />
                                                <div className="p-3">
                                                    <h6 className="fw-bold mb-1 extra-small">{plan.name}</h6>
                                                    <p className="extra-small text-muted mb-3" style={{ height: '30px', overflow: 'hidden' }}>{plan.description}</p>
                                                    <button
                                                        className="btn btn-primary w-100 btn-xs rounded-4 fw-bold"
                                                        onClick={() => {
                                                            setActiveDemoTour(plan);
                                                            setShowDemoModal(false);
                                                        }}
                                                    >
                                                        3D Tour
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3D House Plan Tour Viewer Overlay */}
                {activeDemoTour && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-white" style={{ zIndex: 2000 }}>
                        <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white shadow-sm" style={{ zIndex: 2001, position: 'relative' }}>
                            <div>
                                <h6 className="fw-bold mb-0">{activeDemoTour.name}</h6>
                                <p className="extra-small text-muted mb-0">3D Virtual Structural Visualization</p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-dark btn-sm rounded-4 px-3 fw-bold"
                                onClick={() => setActiveDemoTour(null)}
                            >
                                <i className="bi bi-x-lg me-2"></i> Close
                            </button>
                        </div>
                        <div style={{ height: 'calc(100% - 65px)' }}>
                            <Workspace3D
                                workspaces={activeDemoTour.layout.map((l: any) => ({
                                    id: l.id,
                                    name: l.unitCode,
                                    type: l.type,
                                    status: 'available',
                                    features: [],
                                }))}
                                layout={activeDemoTour.layout}
                                config={activeDemoTour.config}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThreeDView;
