'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface LeadMarker {
    id: string;
    title: string;
    lat: number;
    lng: number;
    type: string;
    timestamp: string;
}

interface ActiveLeadsMapProps {
    markers: LeadMarker[];
}

export default function ActiveLeadsMap({ markers }: ActiveLeadsMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerGroupRef = useRef<any>(null);
    const [libLoaded, setLibLoaded] = useState(false);

    useEffect(() => {
        if (libLoaded && mapRef.current && !mapInstance.current && (window as any).L) {
            const L = (window as any).L;

            // Initialize Map
            const map = L.map(mapRef.current, {
                zoomControl: true,
                scrollWheelZoom: true
            }).setView([25.2048, 55.2708], 2); // Start global

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            markerGroupRef.current = L.featureGroup().addTo(map);
            mapInstance.current = map;
        }
    }, [libLoaded]);

    // Update Markers
    useEffect(() => {
        if (mapInstance.current && markerGroupRef.current && (window as any).L) {
            const L = (window as any).L;
            markerGroupRef.current.clearLayers();

            if (markers.length > 0) {
                markers.forEach(m => {
                    const icon = L.divIcon({
                        className: 'custom-pulse-marker',
                        html: `<div class="pulse ${m.type === 'PROPERTY_VIEW' ? 'bg-primary' : 'bg-danger'}"></div>`,
                        iconSize: [20, 20]
                    });

                    const marker = L.marker([m.lat, m.lng], { icon })
                        .bindPopup(`
                            <div style="font-family: 'Outfit', sans-serif; padding: 5px;">
                                <div style="font-size: 10px; font-weight: bold; color: #dc3545; text-transform: uppercase;">Live Interest</div>
                                <div style="font-weight: bold; font-size: 13px;">${m.title}</div>
                                <div style="font-size: 11px; color: #666; margin-top: 4px;">Active just now</div>
                            </div>
                        `);
                    markerGroupRef.current.addLayer(marker);
                });

                // Auto-fit to markers if they exist
                try {
                    const bounds = markerGroupRef.current.getBounds();
                    if (bounds.isValid()) {
                        mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
                    }
                } catch (e) {}
            }
        }
    }, [markers, libLoaded]);

    return (
        <div className="w-100 h-100 position-relative rounded-4 overflow-hidden border shadow-sm bg-light" style={{ minHeight: '400px' }}>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <Script
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                strategy="afterInteractive"
                onLoad={() => setLibLoaded(true)}
            />
            
            <div ref={mapRef} className="w-100 h-100" style={{ zIndex: 1 }} />
            
            {!libLoaded && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 z-2">
                    <div className="text-center">
                        <div className="spinner-border text-danger spinner-border-sm mb-2"></div>
                        <div className="extra-small text-muted">Loading Satellite Intelligence...</div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-pulse-marker {
                    background: transparent;
                    border: none;
                }
                .pulse {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #dc3545;
                    box-shadow: 0 0 0 rgba(220, 53, 69, 0.4);
                    animation: pulse-ring 1.5s infinite;
                }
                .pulse.bg-primary {
                    background: #6366f1;
                    box-shadow: 0 0 0 rgba(99, 102, 241, 0.4);
                }
                @keyframes pulse-ring {
                    0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 12px;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
}
