'use client';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for Leaflet default marker icons in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// SUB-COMPONENT: This handles the zoom-in animation logic
function MapHandler({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      // The "Fly To" effect: [coords], zoomLevel, {animation options}
      map.flyTo(position, 13, {
        animate: true,
        duration: 1.5, // seconds
      });
    }
  }, [position, map]);

  return null;
}

// SUB-COMPONENT: This handles clicking on the map to move the pin
function ClickHandler({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapPicker({ 
  position, 
  setPosition 
}: { 
  position: [number, number] | null, 
  setPosition: (pos: [number, number]) => void 
}) {
  // Default world view before location is found
  const defaultCenter: [number, number] = [20, 0];

  return (
    <div className="h-full w-full relative z-10">
      <MapContainer 
        center={defaultCenter} 
        zoom={2} 
        scrollWheelZoom={false} 
        className="h-full w-full"
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Logic for Zoom-in Animation */}
        <MapHandler position={position} />
        
        {/* Logic for Map Clicking */}
        <ClickHandler setPosition={setPosition} />

        {/* The Visual Pin */}
        {position && <Marker position={position} icon={icon} />}
      </MapContainer>
    </div>
  );
}