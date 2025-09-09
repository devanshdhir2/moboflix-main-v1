"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';

// Custom icon to prevent Next.js issues with default markers
const technicianIcon = new Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to recenter the map when the technician's position updates
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function LiveLocationMap({ technicianLocation }) {
    // Show a placeholder if the location hasn't been shared yet
    if (!technicianLocation || typeof technicianLocation.lat === 'undefined') {
        return (
            <div className="bg-slate-100 rounded-lg p-8 text-center flex items-center justify-center h-[400px]">
                <p className="text-slate-600 animate-pulse">Awaiting technician's live location...</p>
            </div>
        );
    }

    const position = [technicianLocation.lat, technicianLocation.lng];
    const lastUpdated = technicianLocation.timestamp?.toDate ? technicianLocation.timestamp.toDate().toLocaleTimeString() : 'N/A';

    return (
        <MapContainer 
            center={position} 
            zoom={16} 
            scrollWheelZoom={true} 
            style={{ height: '400px', width: '100%', borderRadius: '8px', zIndex: 0 }}
        >
            <ChangeView center={position} zoom={16} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={technicianIcon}>
                <Popup>
                    Technician's Location <br />
                    Last updated: {lastUpdated}
                </Popup>
            </Marker>
        </MapContainer>
    );
}

