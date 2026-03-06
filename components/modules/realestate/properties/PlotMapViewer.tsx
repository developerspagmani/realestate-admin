'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Seats } from '@/types';

interface PlotMapViewerProps {
    units: Seats[];
    svgContent: string;
    mapping: Record<string, string>; // pathId -> unitId
    themeColor?: string;
    currencySymbol?: string;
    onUnitSelect?: (unitId: string) => void;
    onBookingSelect?: (unitId: string) => void;
}

export default function PlotMapViewer({ units, svgContent, mapping, themeColor = '#6366f1', currencySymbol = '$', onUnitSelect, onBookingSelect }: PlotMapViewerProps) {
    const [selectedUnit, setSelectedUnit] = useState<Seats | null>(null);
    const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
    const svgContainerRef = useRef<HTMLDivElement>(null);

    const handlePathClick = (e: MouseEvent) => {
        const target = e.target as SVGElement;
        const path = target.closest('path');
        const container = svgContainerRef.current?.closest('.plot-map-viewer');

        if (path && container) {
            const id = path.getAttribute('id');
            const unitId = id ? mapping[id] : null;
            const unit = units.find(u => String(u.id) === String(unitId));

            if (unit) {
                const rect = container.getBoundingClientRect();
                setSelectedUnit(unit);
                // Center the popup roughly near the click or just show as modal
                setPopupPos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });

                if (onUnitSelect) {
                    // We don't necessarily want to trigger onUnitSelect immediately if we just want a popup
                    // but keeping it if needed for external sync
                    // onUnitSelect(unitId!); 
                }
            } else {
                setSelectedUnit(null);
            }
        } else {
            setSelectedUnit(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return { fill: '#4ade80', stroke: '#16a34a' }; // Green
            case 'occupied': return { fill: '#fb7185', stroke: '#e11d48' };  // Pink/Rose (Reserved)
            case 'maintenance': return { fill: '#94a3b8', stroke: '#475569' }; // Grey
            case 'sold': return { fill: '#ef4444', stroke: '#b91c1c' };      // Bold Red
            default: return { fill: '#6366f1', stroke: '#4338ca' };          // Indigo (Theme default)
        }
    };

    // Inject SVG labels (only labels, colors are handled by CSS)
    useEffect(() => {
        if (!svgContainerRef.current) return;
        const paths = svgContainerRef.current.querySelectorAll('path');

        // Sanitize path IDs to ensure they match normalized mapping keys
        paths.forEach((p, index) => {
            if (!p.getAttribute('id')) {
                p.setAttribute('id', `plot-${index + 1}`);
            }
        });

        // 2. Clear existing labels/icons before redrawing
        const existingLabels = svgContainerRef.current.querySelectorAll('.plot-label-group');
        existingLabels.forEach(el => el.remove());

        const svgElement = svgContainerRef.current.querySelector('svg');
        if (!svgElement) return;

        paths.forEach(p => {
            const id = p.getAttribute('id');
            const unitId = id ? mapping[id] : null;

            // Failsafe Find: Try ID, Name, then UnitCode
            const unit = units.find(u =>
                String(u.id) === String(unitId) ||
                (unitId && (String(u.name) === String(unitId) || String((u as any).unitCode) === String(unitId)))
            );

            p.style.cursor = unit ? 'pointer' : 'inherit';
            p.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

            if (unit && svgElement) {
                try {
                    const bbox = (p as unknown as SVGGraphicsElement).getBBox();
                    if (bbox.width > 5 && bbox.height > 5) {
                        const centerX = bbox.x + bbox.width / 2;
                        const centerY = bbox.y + bbox.height / 2;

                        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                        g.setAttribute('class', 'plot-label-group');
                        g.setAttribute('pointer-events', 'none');
                        g.style.pointerEvents = 'none';

                        if (unit.status !== 'available') {
                            const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
                            icon.setAttribute('x', centerX.toString());
                            icon.setAttribute('y', (centerY - 3).toString());
                            icon.setAttribute('text-anchor', 'middle');
                            icon.setAttribute('font-family', 'bootstrap-icons');
                            icon.setAttribute('font-size', '12px');
                            icon.setAttribute('fill', 'white');
                            icon.textContent = '\uF471';
                            g.appendChild(icon);
                        }

                        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        text.setAttribute('x', centerX.toString());
                        text.setAttribute('y', (unit.status === 'available' ? centerY + 5 : centerY + 10).toString());
                        text.setAttribute('text-anchor', 'middle');
                        text.setAttribute('font-size', '8px');
                        text.setAttribute('font-weight', 'bold');
                        text.setAttribute('fill', 'white');
                        text.textContent = unit.name || 'Unit';
                        g.appendChild(text);

                        svgElement.appendChild(g);
                    }
                } catch (e) {
                    console.error('Error adding SVG label:', e);
                }
            } else {
                // Clear styles for unmapped paths
                p.style.fill = '';
                p.style.stroke = '';
                p.style.fillOpacity = '';
                p.style.strokeWidth = '';
            }
        });
    }, [mapping, svgContent, units]);

    // Construct dynamic CSS for colors - using same logic as PlotMapEditor
    const dynamicStyles = (
        <style dangerouslySetInnerHTML={{
            __html: `
            ${Object.entries(mapping).map(([pathId, unitId]) => {
                // Use simple String comparison like PlotMapEditor - this is what works!
                const unit = units.find(u => String(u.id) === String(unitId));
                if (!unit) return '';
                const colors = getStatusColor(unit.status);
                console.log("MAP COLORS", colors);
                return `
                    [id="${pathId}"] {
                        fill: ${colors.fill} !important;
                        stroke: ${colors.stroke} !important;
                        fill-opacity: 0.85 !important;
                        stroke-width: 1.5px !important;
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                    }
                    [id="${pathId}"]:hover {
                        fill-opacity: 1 !important;
                        stroke-width: 2.5px !important;
                        filter: brightness(1.1) drop-shadow(0 0 5px rgba(0,0,0,0.2)) !important;
                    }
                `;
            }).join('\n')}
        `}} />
    );

    const handlePathHover = (e: MouseEvent) => {
        // Optional: Add subtle highlight or cursor change
        // console.log("MAP HOVER", e);
    };

    return (
        <div className="plot-map-viewer position-relative w-100 h-100 bg-white rounded-4 border overflow-hidden shadow-sm">
            <TransformWrapper minScale={0.1} maxScale={4} initialScale={1}>
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="position-absolute top-0 end-0 p-2 z-3 d-flex flex-column gap-2">
                            <button className="btn btn-white btn-sm shadow-sm rounded-3 border p-0 d-flex align-items-center justify-content-center bg-white" style={{ width: '36px', height: '36px' }} onClick={() => zoomIn()}>
                                <i className="bi bi-plus-lg"></i>
                            </button>
                            <button className="btn btn-white btn-sm shadow-sm rounded-3 border p-0 d-flex align-items-center justify-content-center bg-white" style={{ width: '36px', height: '36px' }} onClick={() => zoomOut()}>
                                <i className="bi bi-dash-lg"></i>
                            </button>
                            <button className="btn btn-white btn-sm shadow-sm rounded-3 border p-0 d-flex align-items-center justify-content-center bg-white" style={{ width: '36px', height: '36px' }} onClick={() => resetTransform()}>
                                <i className="bi bi-arrow-counterclockwise"></i>
                            </button>
                        </div>
                        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                            {dynamicStyles}
                            <div
                                ref={svgContainerRef}
                                className="svg-map-canvas"
                                onClick={handlePathClick}
                                onMouseMove={handlePathHover}
                                onMouseLeave={() => { }}
                                dangerouslySetInnerHTML={{ __html: svgContent }}
                                style={{
                                    display: 'inline-block',
                                    padding: '50px'
                                }}
                            />
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>

            {/* Plot Detail Popup */}
            {selectedUnit && (
                <div
                    className="position-absolute shadow-lg animate-fade-in"
                    style={{
                        left: Math.min(popupPos.x, (svgContainerRef.current?.clientWidth || 800) - 260),
                        top: Math.min(popupPos.y, (svgContainerRef.current?.clientHeight || 600) - 300),
                        zIndex: 9999,
                        width: '260px',
                        borderRadius: '16px',
                        background: 'white',
                        border: '1px solid rgba(0,0,0,0.1)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                    }}
                >
                    <div className="p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className={`badge rounded-pill px-2 py-1 extra-small fw-bold text-uppercase`} style={{
                                backgroundColor: getStatusColor(selectedUnit.status).fill + '20',
                                color: getStatusColor(selectedUnit.status).stroke
                            }}>
                                {selectedUnit.status}
                            </span>
                            <button className="btn-close" style={{ fontSize: '10px' }} onClick={() => setSelectedUnit(null)}></button>
                        </div>

                        <h5 className="fw-bold text-dark mb-1">{selectedUnit.name}</h5>
                        <p className="text-muted small mb-3">Premium Plot Selection</p>

                        <div className="row g-2 mb-4">
                            <div className="col-6">
                                <div className="p-2 bg-light rounded-3">
                                    <span className="text-muted extra-small d-block">Price</span>
                                    <span className="fw-bold text-dark small">{currencySymbol}{selectedUnit.price?.toLocaleString('en-US') || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-2 bg-light rounded-3">
                                    <span className="text-muted extra-small d-block">Area</span>
                                    <span className="fw-bold text-dark small">{selectedUnit.sizeSqft} sqft</span>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-2">
                            <button
                                className="btn btn-primary btn-sm rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                                style={{ backgroundColor: themeColor, border: 'none' }}
                                onClick={() => onUnitSelect?.(String(selectedUnit.id))}
                            >
                                <i className="bi bi-eye"></i>
                                View Unit Details
                            </button>
                            {selectedUnit.status === 'available' && (
                                <button
                                    className="btn btn-dark btn-sm rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onBookingSelect?.(String(selectedUnit.id));
                                    }}
                                >
                                    <i className="bi bi-calendar-check"></i>
                                    Reserve Now
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .extra-small { font-size: 10px; }
                .ls-1 { letter-spacing: 0.05em; }
                .svg-map-canvas path {
                   will-change: transform, fill;
                   pointer-events: auto !important;
                }
                .svg-map-canvas g, .svg-map-canvas text {
                   pointer-events: none !important;
                }
                .svg-map-canvas path:hover {
                    fill-opacity: 0.9 !important;
                    filter: drop-shadow(0 0 8px rgba(0,0,0,0.1));
                    stroke-width: 2px !important;
                }
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
