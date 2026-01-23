import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Head from 'next/head';

interface MapViewProps {
    latitude: number;
    longitude: number;
    onChange: (lat: number, lng: number) => void;
}

declare global {
    interface Window {
        L: any;
    }
}

export default function MapView({ latitude, longitude, onChange }: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const [libLoaded, setLibLoaded] = useState(false);

    useEffect(() => {
        if (libLoaded && mapRef.current && !mapInstance.current && window.L) {
            // Initialize Map
            const L = window.L;

            // Default to 0,0 if invalid
            const initialLat = latitude || 0;
            const initialLng = longitude || 0;

            const map = L.map(mapRef.current).setView([initialLat, initialLng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            const icon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            const marker = L.marker([initialLat, initialLng], {
                draggable: true,
                icon: icon
            }).addTo(map);

            marker.on('dragend', function (e: any) {
                const latlng = marker.getLatLng();
                onChange(latlng.lat, latlng.lng);
            });

            map.on('click', function (e: any) {
                marker.setLatLng(e.latlng);
                onChange(e.latlng.lat, e.latlng.lng);
            });

            mapInstance.current = map;
            markerInstance.current = marker;
        }
    }, [libLoaded]);

    // Update marker when props change
    useEffect(() => {
        if (mapInstance.current && markerInstance.current) {
            const currentLatLng = markerInstance.current.getLatLng();
            if (currentLatLng.lat !== latitude || currentLatLng.lng !== longitude) {
                if (latitude && longitude) {
                    const newLatLng = [latitude, longitude];
                    markerInstance.current.setLatLng(newLatLng);
                    mapInstance.current.setView(newLatLng);
                }
            }
        }
    }, [latitude, longitude]);

    return (
        <>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                // @ts-ignore
                crossOrigin=""
            />

            <Script
                src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
                crossOrigin=""
                onLoad={() => setLibLoaded(true)}
            />

            <div
                ref={mapRef}
                className="w-100 h-100 rounded-4 shadow-sm"
                style={{ minHeight: '300px', zIndex: 1 }}
            />
        </>
    );
}
