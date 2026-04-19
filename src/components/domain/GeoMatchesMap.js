"use client";

import { useEffect, useRef } from "react";

function createDotIcon(leaflet, active) {
  return leaflet.divIcon({
    className: "",
    html: `<span style="display:block;width:${active ? 14 : 11}px;height:${active ? 14 : 11}px;border-radius:9999px;background:${active ? "#e05b42" : "#232323"};border:2px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,.3);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function GeoMatchesMap({ points, selectedId, onSelect }) {
  const mapContainerRef = useRef(null);
  const leafletRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    let cancelled = false;
    let createdMap = null;

    import("leaflet").then((leafletModule) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const leaflet = leafletModule.default;
      leafletRef.current = leaflet;

      const map = leaflet.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([20, 78], 4);

      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      markersLayerRef.current = leaflet.layerGroup().addTo(map);
      mapRef.current = map;
      createdMap = map;
    });

    return () => {
      cancelled = true;
      if (createdMap) createdMap.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!leaflet || !map || !markersLayer) return;

    markersLayer.clearLayers();

    if (!points.length) {
      map.setView([20, 78], 4);
      return;
    }

    const latLngs = [];
    for (const point of points) {
      if (typeof point.lat !== "number" || typeof point.lon !== "number") continue;
      const latLng = [point.lat, point.lon];
      latLngs.push(latLng);

      const marker = leaflet.marker(latLng, {
        icon: createDotIcon(leaflet, point.id === selectedId),
      });

      marker.bindPopup(`<strong>${point.name}</strong><br/>Score: ${point.score}`);
      marker.on("click", () => onSelect(point.id));
      marker.addTo(markersLayer);
    }

    if (!latLngs.length) {
      map.setView([20, 78], 4);
      return;
    }

    if (latLngs.length === 1) {
      map.setView(latLngs[0], 12);
      return;
    }

    const bounds = leaflet.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [points, selectedId, onSelect]);

  return <div ref={mapContainerRef} style={{ minHeight: 330, borderRadius: 12, border: "0.5px solid #e0ddd6" }} />;
}
