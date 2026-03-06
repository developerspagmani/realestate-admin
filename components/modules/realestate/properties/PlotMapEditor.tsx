'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Seats } from '@/types';
import Toast from '@/components/common/Toast';

interface PlotMapEditorProps {
    units: Seats[];
    propertyName?: string;
    initialMapping?: Record<string, string>; // pathId -> unitId
    initialSvgContent?: string | null;
    onSave: (mapping: Record<string, string>, svgContent: string) => void;
}

export default function PlotMapEditor({ units, propertyName, initialMapping = {}, initialSvgContent = null, onSave }: PlotMapEditorProps) {
    const [svgContent, setSvgContent] = useState<string | null>(initialSvgContent);
    const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);
    const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
    const [hoveredUnit, setHoveredUnit] = useState<Seats | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const svgContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialMapping && Object.keys(initialMapping).length > 0) {
            setMapping(initialMapping);
        }
    }, [initialMapping]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const handlePathClick = (e: MouseEvent) => {
        const target = e.target as SVGElement;
        const path = target.closest('path');
        if (path) {
            let id = path.getAttribute('id');
            if (!id) {
                // Generate a temporary ID if missing
                id = `path-${Math.random().toString(36).substr(2, 9)}`;
                path.setAttribute('id', id);
            }
            setSelectedPathId(id);
        } else {
            setSelectedPathId(null);
        }
    };

    const sanitizeSvg = (content: string) => {
        if (!content.includes('<svg')) return content;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'image/svg+xml');
        const paths = doc.querySelectorAll('path');
        let needsUpdate = false;
        paths.forEach((path, index) => {
            if (!path.getAttribute('id')) {
                path.setAttribute('id', `plot-${index + 1}`);
                needsUpdate = true;
            }
        });
        if (needsUpdate) {
            const serializer = new XMLSerializer();
            return serializer.serializeToString(doc);
        }
        return content;
    };

    useEffect(() => {
        if (initialSvgContent) {
            setSvgContent(sanitizeSvg(initialSvgContent));
        }
    }, [initialSvgContent]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setSvgContent(sanitizeSvg(content));
            showToast('SVG loaded and parsed successfully');
        };
        reader.readAsText(file);
    };

    const handlePathHover = (e: MouseEvent) => {
        const target = e.target as SVGElement;
        const path = target.closest('path');
        const container = svgContainerRef.current?.closest('.flex-grow-1');

        if (path && container) {
            const id = path.getAttribute('id');
            const unitId = id ? mapping[id] : null;
            const unit = units.find(u => u.id === unitId);

            if (unit) {
                const rect = container.getBoundingClientRect();
                setHoveredUnit(unit);
                // Large offset and pointer-events: none on tooltip will stop flicker
                setTooltipPos({
                    x: e.clientX - rect.left + 30,
                    y: e.clientY - rect.top + 30
                });
            } else {
                setHoveredUnit(null);
            }
        } else {
            setHoveredUnit(null);
        }
    };

    const assignUnit = (unitId: string) => {
        if (!selectedPathId) {
            showToast('Please select a plot path first', 'error');
            return;
        }

        const newMapping = { ...mapping, [selectedPathId]: unitId };
        setMapping(newMapping);
        showToast('Unit assigned to plot');
    };

    const unassignUnit = () => {
        if (!selectedPathId) return;
        const newMapping = { ...mapping };
        delete newMapping[selectedPathId];
        setMapping(newMapping);
        showToast('Unit unassigned');
    };

    const router = useRouter();

    const handleConvertTo3D = () => {
        if (!svgContent) {
            showToast('No SVG content to convert', 'error');
            return;
        }

        // Save to localStorage for the 3D converter page
        localStorage.setItem('svg_to_3d_content', svgContent);
        localStorage.setItem('svg_to_3d_mapping', JSON.stringify(mapping));
        localStorage.setItem('svg_to_3d_units', JSON.stringify(units));

        router.push('/realestate-owner-admin/svg-3d-converter');
    };

    const handleSave = () => {
        if (!svgContent) {
            showToast('No SVG content to save', 'error');
            return;
        }
        onSave(mapping, svgContent);
        showToast('Mapping saved successfully');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return { fill: '#4ade80', stroke: '#16a34a' };
            case 'occupied': return { fill: '#fb7185', stroke: '#e11d48' };
            case 'maintenance': return { fill: '#94a3b8', stroke: '#475569' };
            case 'sold': return { fill: '#ef4444', stroke: '#b91c1c' };
            default: return { fill: '#6366f1', stroke: '#4338ca' };
        }
    };

    // Inject SVG labels (colors are handled by dynamic CSS below)
    useEffect(() => {
        if (!svgContainerRef.current) return;
        const paths = svgContainerRef.current.querySelectorAll('path');

        // Remove existing labels/icons if any to redraw
        const existingLabels = svgContainerRef.current.querySelectorAll('.plot-label-group');
        existingLabels.forEach(el => el.remove());

        const svgElement = svgContainerRef.current.querySelector('svg');
        if (!svgElement) return;

        paths.forEach(p => {
            const id = p.getAttribute('id');
            const unitId = id ? mapping[id] : null;
            // Robust check for unit (string vs number comparison)
            const unit = units.find(u => String(u.id) === String(unitId));

            p.style.cursor = 'pointer';

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
                            icon.setAttribute('y', (centerY - 5).toString());
                            icon.setAttribute('text-anchor', 'middle');
                            icon.setAttribute('font-family', 'bootstrap-icons');
                            icon.setAttribute('font-size', '14px');
                            icon.setAttribute('fill', 'white');
                            icon.textContent = '\uF471';
                            g.appendChild(icon);
                        }

                        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        text.setAttribute('x', centerX.toString());
                        text.setAttribute('y', (centerY + 10).toString());
                        text.setAttribute('text-anchor', 'middle');
                        text.setAttribute('font-size', '10px');
                        text.setAttribute('font-weight', 'bold');
                        text.setAttribute('fill', 'white');
                        text.textContent = unit.name || 'Unit';
                        g.appendChild(text);

                        svgElement.appendChild(g);
                    }
                } catch (err) {
                    console.error('Error adding label to path:', id, err);
                }
            }
        });
    }, [selectedPathId, mapping, svgContent, units]);

    // Construct dynamic CSS for colors and selection state
    const dynamicStyles = (
        <style dangerouslySetInnerHTML={{
            __html: `
            ${Object.entries(mapping).map(([pathId, unitId]) => {
                const unit = units.find(u => String(u.id) === String(unitId));
                if (!unit) return '';
                const colors = getStatusColor(unit.status);
                return `
                    [id="${pathId}"] {
                        fill: ${colors.fill} !important;
                        stroke: ${colors.stroke} !important;
                        fill-opacity: ${pathId === selectedPathId ? '0.95' : '0.85'} !important;
                        stroke-width: ${pathId === selectedPathId ? '3px' : '1.5px'} !important;
                        ${pathId === selectedPathId ? 'stroke: #ff3b3b !important;' : ''}
                    }
                    [id="${pathId}"]:hover {
                        filter: brightness(1.1) !important;
                        fill-opacity: 1 !important;
                    }
                `;
            }).join('\n')}
            
            /* Highlight selected path even if not mapped */
            ${selectedPathId && !mapping[selectedPathId] ? `
                [id="${selectedPathId}"] {
                    stroke: #ff3b3b !important;
                    stroke-width: 3px !important;
                    fill-opacity: 0.5 !important;
                    fill: #ff3b3b33 !important;
                }
            ` : ''}
        `}} />
    );

    return (
        <div className="d-flex flex-column h-100 bg-white text-dark overflow-hidden">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white shadow-sm">
                <div className="d-flex align-items-center gap-3">
                    <h5 className="mb-0 fw-bold text-primary">
                        Plot Map Manager
                        {propertyName && <span className="text-muted fw-normal ms-2">| {propertyName}</span>}
                    </h5>
                    <div className="vr opacity-25"></div>
                    <label className="btn btn-primary btn-sm mb-0 rounded-4 px-3">
                        <i className="bi bi-upload me-2"></i>Upload SVG
                        <input type="file" hidden accept=".svg" onChange={handleFileUpload} />
                    </label>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-dark btn-sm px-4 rounded-4 fw-bold" onClick={handleConvertTo3D}>
                        <i className="bi bi-box-fill me-2"></i>Convert to 3D
                    </button>
                    <button className="btn btn-outline-primary btn-sm px-4 rounded-4 fw-bold" onClick={handleSave}>
                        <i className="bi bi-save me-2"></i>Save Mapping
                    </button>
                </div>
            </div>

            <div className="d-flex flex-grow-1 overflow-hidden">
                {/* Main Canvas Area */}
                <div className="flex-grow-1 position-relative bg-light d-flex align-items-center justify-content-center">
                    {!svgContent ? (
                        <div className="text-center p-5 border border-dashed border-secondary rounded-4 bg-white shadow-sm">
                            <i className="bi bi-file-earmark-arrow-up display-4 text-muted mb-3 d-block"></i>
                            <p className="text-muted fw-medium">Upload property SVG layout to map units</p>
                        </div>
                    ) : (
                        <TransformWrapper minScale={0.1} maxScale={10} initialScale={1}>
                            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                {dynamicStyles}
                                <div
                                    ref={svgContainerRef}
                                    className="svg-map-canvas p-4"
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
                        </TransformWrapper>
                    )}

                    {/* Hover Tooltip */}
                    {hoveredUnit && (
                        <div
                            className="position-absolute p-3 bg-white border border-light rounded-4 shadow-lg pointer-events-none animate-fade-in"
                            style={{
                                left: tooltipPos.x + 15,
                                top: tooltipPos.y + 15,
                                zIndex: 2000,
                                backdropFilter: 'blur(8px)',
                                minWidth: '220px',
                                pointerEvents: 'none',
                                borderLeft: `5px solid ${getStatusColor(hoveredUnit.status).fill}`
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <span className="d-block extra-small text-uppercase fw-bold text-muted mb-1 ls-1">Plot Details</span>
                                    <h6 className="fw-bold text-dark mb-0">{hoveredUnit.name}</h6>
                                </div>
                                <span className={`badge rounded-4 px-2 py-1 fw-bold`} style={{
                                    fontSize: '9px',
                                    backgroundColor: getStatusColor(hoveredUnit.status).fill + '20',
                                    color: getStatusColor(hoveredUnit.status).stroke
                                }}>
                                    {hoveredUnit.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="small border-top pt-2">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Price:</span>
                                    <span className="fw-bold">${hoveredUnit.price?.toLocaleString() || 'N/A'}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Status:</span>
                                    <span className="fw-medium text-capitalize">{hoveredUnit.status}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar (Right) - Units */}
                <div className="bg-white border-start" style={{ width: '340px' }}>
                    <div className="p-3 border-bottom">
                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                            <i className="bi bi-list-task text-primary"></i>
                            Unit Assignment
                        </h6>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control bg-light border-0"
                                placeholder="Find unit by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Status Legend */}
                        <div className="mt-3 p-2 bg-light rounded-3 d-flex flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-1">
                                <div className="rounded-circle" style={{ width: '10px', height: '10px', background: '#4ade80' }}></div>
                                <span className="extra-small text-muted fw-bold">Available</span>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                                <div className="rounded-circle" style={{ width: '10px', height: '10px', background: '#ef4444' }}></div>
                                <span className="extra-small text-muted fw-bold">Sold</span>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                                <div className="rounded-circle" style={{ width: '10px', height: '10px', background: '#fb7185' }}></div>
                                <span className="extra-small text-muted fw-bold">Reserved</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 overflow-auto" style={{ height: 'calc(100vh - 480px)' }}>
                        <div className="list-group list-group-flush gap-2">
                            {units
                                .filter(u => (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((unit) => {
                                    const isAssigned = Object.values(mapping).includes(unit.id);
                                    const isMappedToCurrent = selectedPathId && mapping[selectedPathId] === unit.id;

                                    return (
                                        <div
                                            key={unit.id}
                                            className={`list-group-item border rounded-4 p-3 mb-2 transition-all shadow-sm ${isMappedToCurrent ? 'border-primary ring-2 ring-primary bg-primary bg-opacity-10' : 'bg-white hover-bg-light'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => assignUnit(unit.id)}
                                        >
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className={`fw-bold small ${isMappedToCurrent ? 'text-primary' : 'text-dark'}`}>{unit.name}</span>
                                                {isAssigned && !isMappedToCurrent && (
                                                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '14px' }}></i>
                                                )}
                                            </div>
                                            <div className="extra-small text-muted d-flex gap-2">
                                                <span className={`badge ${unit.status === 'available' ? 'bg-success' : 'bg-secondary'} bg-opacity-10 text-${unit.status === 'available' ? 'success' : 'secondary'} px-2`}>
                                                    {unit.status}
                                                </span>
                                                <span>•</span>
                                                <span>{unit.sizeSqft} sqft</span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Selected Path Controls */}
                    {selectedPathId && (
                        <div className="p-3 border-top bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <p className="extra-small text-muted mb-0">Select path: <span className="fw-bold text-primary">{selectedPathId}</span></p>
                                {mapping[selectedPathId] && (
                                    <button className="btn btn-link btn-sm text-danger p-0 text-decoration-none extra-small fw-bold" onClick={unassignUnit}>
                                        <i className="bi bi-trash me-1"></i>Reset
                                    </button>
                                )}
                            </div>
                            {!mapping[selectedPathId] && (
                                <div className="alert alert-warning p-2 extra-small mb-0 rounded-3">
                                    <i className="bi bi-info-circle me-1"></i> Select a unit above to map
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <style jsx>{`
                .letter-spacing-1 { letter-spacing: 1px; }
                .extra-small { font-size: 11px; }
                .hover-bg-light:hover { background-color: #f8fafc !important; transform: translateY(-2px); }
                .ls-1 { letter-spacing: 0.05em; }
                .svg-map-canvas path {
                    pointer-events: auto !important;
                }
                .svg-map-canvas text, .svg-map-canvas g {
                    pointer-events: none !important;
                }
                .svg-map-canvas path:hover {
                    fill-opacity: 0.9 !important;
                    filter: brightness(1.05);
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
