'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Seats } from '@/types';

interface PlotMapViewerProps {
    units: Seats[];
    svgContent: string;
    mapping: Record<string, string>; // pathId -> unitId
    themeColor?: string;
    onUnitSelect?: (unitId: string) => void;
}

export default function PlotMapViewer({ units, svgContent, mapping, themeColor = '#6366f1', onUnitSelect }: PlotMapViewerProps) {
    const [hoveredUnit, setHoveredUnit] = useState<Seats | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const svgContainerRef = useRef<HTMLDivElement>(null);

    const handlePathClick = (e: MouseEvent) => {
        const target = e.target as SVGElement;
        const path = target.closest('path');
        if (path) {
            const id = path.getAttribute('id');
            const unitId = id ? mapping[id] : null;
            if (unitId && onUnitSelect) {
                onUnitSelect(unitId);
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return { fill: '#4ade80', stroke: '#16a34a' };
            case 'occupied': return { fill: '#fb7185', stroke: '#e11d48' };
            case 'maintenance': return { fill: '#94a3b8', stroke: '#475569' };
            case 'sold': return { fill: '#f43f5e', stroke: '#9f1239' };
            default: return { fill: '#6366f1', stroke: '#4338ca' };
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
                    const bbox = (p as any).getBBox();
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
        const target = e.target as SVGElement;
        const path = target.closest('path');
        const container = svgContainerRef.current?.closest('.plot-map-viewer');

        if (path && container) {
            const id = path.getAttribute('id');
            const unitId = id ? mapping[id] : null;
            // Use simple String comparison like PlotMapEditor
            const unit = units.find(u => String(u.id) === String(unitId));

            if (unit) {
                const rect = container.getBoundingClientRect();
                setHoveredUnit(unit);
                setTooltipPos({
                    x: e.clientX - rect.left + 35,
                    y: e.clientY - rect.top + 35
                });
            } else {
                setHoveredUnit(null);
            }
        } else {
            setHoveredUnit(null);
        }
    };

    return (
        <div className="plot-map-viewer position-relative w-100 h-100 bg-white rounded-4 border overflow-hidden shadow-sm">
            <TransformWrapper minScale={0.1} maxScale={5} initialScale={1}>
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="position-absolute top-0 end-0 p-3 z-3 d-flex flex-column gap-2">
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
                                onMouseLeave={() => setHoveredUnit(null)}
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

            {/* Hover Tooltip - Position relative to container now */}
            {hoveredUnit && (
                <div
                    className="position-absolute p-3 shadow-2xl animate-fade-in"
                    style={{
                        left: tooltipPos.x,
                        top: tooltipPos.y,
                        zIndex: 9999,
                        minWidth: '220px',
                        pointerEvents: 'none',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        borderLeft: `5px solid ${getStatusColor(hoveredUnit.status).fill}`
                    }}
                >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span className="d-block extra-small text-uppercase fw-bold text-muted mb-1 ls-1">Property Unit</span>
                            <h6 className="fw-bold text-dark mb-0">{hoveredUnit.name}</h6>
                        </div>
                        <span className={`badge rounded-pill px-2 py-1 fw-bold`} style={{
                            fontSize: '9px',
                            backgroundColor: getStatusColor(hoveredUnit.status).fill + '20',
                            color: getStatusColor(hoveredUnit.status).stroke
                        }}>
                            {hoveredUnit.status.toUpperCase()}
                        </span>
                    </div>

                    <div className="mt-2 pt-2 border-top border-light">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted extra-small">Price</span>
                            <span className="fw-bold text-dark extra-small">${hoveredUnit.price?.toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted extra-small">Area</span>
                            <span className="text-dark fw-bold extra-small">{hoveredUnit.sizeSqft} sqft</span>
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
