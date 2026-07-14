'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property } from '@/types/property';

/* ── Tile URLs ─────────────────────────────────── */
const DARK_TILES  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR   = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

/* ── Marker color helpers ──────────────────────── */
function scoreColor(score: number) {
  if (score >= 90) return '#4ADE80';
  if (score >= 80) return '#8B7355';
  if (score >= 70) return '#F59E0B';
  return '#EF4444';
}

function riskColor(risk: string) {
  if (risk === 'low') return '#4ADE80';
  if (risk === 'medium') return '#F59E0B';
  return '#EF4444';
}

function formatPrice(price: { amount: number; currency: string }) {
  const n = price.amount;
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/* ── Build custom DivIcon marker ───────────────── */
function createMarkerIcon(prop: Property, isSelected: boolean) {
  const color = scoreColor(prop.aiScore);
  const border = isSelected
    ? `border: 2px solid ${color}; box-shadow: 0 0 18px ${color}50, 0 4px 14px rgba(0,0,0,0.30);`
    : `border: 1.5px solid var(--border); box-shadow: 0 3px 10px rgba(0,0,0,0.15);`;

  const pulseRing = isSelected
    ? `<div class="map-marker-pulse" style="border-color:${color};"></div>`
    : '';

  const html = `
    <div style="position:relative;display:inline-block;">
      ${pulseRing}
      <div class="map-marker-pill" style="
        display:flex;align-items:center;gap:6px;
        padding:5px 10px 5px 8px;
        background:var(--bg);
        backdrop-filter:blur(12px);
        border-radius:20px;
        ${border}
        cursor:pointer;
        white-space:nowrap;
        transform:${isSelected ? 'scale(1.12)' : 'scale(1)'};
        transform-origin:bottom center;
        transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.2s ease;
      ">
        <span style="
          width:8px;height:8px;border-radius:50%;
          background:${color};
          box-shadow:0 0 6px ${color}60;
          flex-shrink:0;
        "></span>
        <span style="
          font-size:11px;font-weight:600;
          color:var(--fg);
          font-family:Inter,system-ui,sans-serif;
        ">${formatPrice(prop.price)}</span>
      </div>
      <div style="
        width:2px;height:8px;
        background:linear-gradient(to bottom,var(--border),transparent);
        margin:0 auto;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'map-marker-custom',
    iconSize: [0, 0],
    iconAnchor: [44, 58],
  });
}

/* ── Hover popup HTML ──────────────────────────── */
function popupHtml(prop: Property) {
  const color  = scoreColor(prop.aiScore);
  const rColor = riskColor(prop.riskScore);
  return `
    <div style="
      width:264px;padding:14px;
      background:var(--card-bg,var(--bg));
      backdrop-filter:blur(24px);
      border:1px solid var(--border);
      border-radius:14px;
      box-shadow:0 16px 40px rgba(0,0,0,0.18);
      font-family:Inter,system-ui,sans-serif;
    ">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
        <div style="flex:1;min-width:0;">
          <p style="font-size:13px;font-weight:600;color:var(--fg);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${prop.title}
          </p>
          <p style="font-size:11px;color:var(--fg-muted);margin:3px 0 0;">
            ${prop.location.neighborhood ? prop.location.neighborhood + ', ' : ''}${prop.location.city}
          </p>
        </div>
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:${color}15;border:2px solid ${color}40;
          display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:700;color:${color};
          flex-shrink:0;margin-left:8px;
        ">${prop.aiScore}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
        <div style="background:var(--bg-secondary);border-radius:8px;padding:6px 8px;text-align:center;">
          <p style="font-size:10px;color:var(--fg-muted);margin:0;text-transform:uppercase;letter-spacing:0.05em;">Yield</p>
          <p style="font-size:13px;font-weight:600;color:#4ADE80;margin:2px 0 0;">${prop.rentalYield}%</p>
        </div>
        <div style="background:var(--bg-secondary);border-radius:8px;padding:6px 8px;text-align:center;">
          <p style="font-size:10px;color:var(--fg-muted);margin:0;text-transform:uppercase;letter-spacing:0.05em;">Growth</p>
          <p style="font-size:13px;font-weight:600;color:#8B7355;margin:2px 0 0;">+${prop.capitalAppreciation}%</p>
        </div>
        <div style="background:var(--bg-secondary);border-radius:8px;padding:6px 8px;text-align:center;">
          <p style="font-size:10px;color:var(--fg-muted);margin:0;text-transform:uppercase;letter-spacing:0.05em;">Risk</p>
          <p style="font-size:13px;font-weight:600;color:${rColor};margin:2px 0 0;text-transform:capitalize;">${prop.riskScore}</p>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--border);">
        <p style="font-size:16px;font-weight:700;color:var(--fg);margin:0;">${formatPrice(prop.price)}</p>
        <span style="
          font-size:10px;font-weight:600;padding:3px 8px;
          border-radius:12px;text-transform:uppercase;
          background:rgba(139,115,85,0.10);color:#8B7355;
          border:1px solid rgba(139,115,85,0.20);
        ">${prop.type}</span>
      </div>
    </div>
  `;
}

/* ── Heatmap overlay (circle-based) ─────────────── */
function addHeatCircles(map: L.Map, properties: Property[], mode: string) {
  const group = L.layerGroup();
  properties.forEach((prop) => {
    const { lat, lng } = prop.location.coordinates;
    let radius: number;
    let color: string;
    let fillOpacity: number;

    if (mode === 'risk') {
      radius = prop.riskScore === 'high' ? 80000 : prop.riskScore === 'medium' ? 60000 : 40000;
      color = riskColor(prop.riskScore);
      fillOpacity = 0.12;
    } else if (mode === 'demand') {
      const demand = prop.rentalYield > 5 ? 'high' : prop.rentalYield > 3 ? 'medium' : 'low';
      radius = demand === 'high' ? 80000 : demand === 'medium' ? 60000 : 40000;
      color = demand === 'high' ? '#4ADE80' : demand === 'medium' ? '#F59E0B' : '#6B7280';
      fillOpacity = 0.10;
    } else {
      radius = 50000;
      color = '#8B7355';
      fillOpacity = 0.08;
    }

    L.circle([lat, lng], {
      radius,
      color: 'transparent',
      fillColor: color,
      fillOpacity,
    }).addTo(group);
  });

  group.addTo(map);
  return group;
}

/* ── Main Component ────────────────────────────── */
interface PropertyMapProps {
  properties: Property[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeLayer: string;
  onHover?: (id: string | null) => void;
  isDark?: boolean;
}

export default function PropertyMap({
  properties,
  selectedId,
  onSelect,
  activeLayer,
  onHover,
  isDark = false,
}: PropertyMapProps) {
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<L.LayerGroup | null>(null);
  const overlayRef   = useRef<L.LayerGroup | null>(null);
  const tileRef      = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── 1. Initialize map once (no tile — added by effect below) ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [25, 45],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 18,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

    mapRef.current     = map;
    markersRef.current = L.layerGroup().addTo(map);

    if (properties.length > 0) {
      const bounds = L.latLngBounds(
        properties.map((p) => [p.location.coordinates.lat, p.location.coordinates.lng])
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 5 });
    }

    return () => {
      map.remove();
      mapRef.current  = null;
      tileRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 2. Swap tile layer when theme changes ── */
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileRef.current) tileRef.current.remove();
    const url = isDark ? DARK_TILES : LIGHT_TILES;
    tileRef.current = L.tileLayer(url, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(mapRef.current);
    tileRef.current.bringToBack();
  }, [isDark]);

  /* ── 3. Update markers ── */
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;
    markersRef.current.clearLayers();

    properties.forEach((prop) => {
      const { lat, lng } = prop.location.coordinates;
      const isSelected = prop.id === selectedId;
      const icon = createMarkerIcon(prop, isSelected);
      const marker = L.marker([lat, lng], { icon, zIndexOffset: isSelected ? 1000 : 0 });

      marker.bindPopup(popupHtml(prop), {
        className: 'map-popup-custom',
        closeButton: false,
        offset: [0, -62],
        maxWidth: 280,
      });

      marker.on('mouseover', () => { marker.openPopup(); onHover?.(prop.id); });
      marker.on('mouseout',  () => { marker.closePopup(); onHover?.(null); });
      marker.on('click', () => { onSelect(prop.id); });

      marker.addTo(markersRef.current!);
    });
  }, [properties, selectedId, onSelect, onHover]);

  /* ── 4. Heatmap overlay ── */
  useEffect(() => {
    if (!mapRef.current) return;
    if (overlayRef.current) { overlayRef.current.remove(); overlayRef.current = null; }

    if (activeLayer === 'Risk Heatmap') {
      overlayRef.current = addHeatCircles(mapRef.current, properties, 'risk');
    } else if (activeLayer === 'Demand') {
      overlayRef.current = addHeatCircles(mapRef.current, properties, 'demand');
    } else if (activeLayer === 'Infrastructure') {
      overlayRef.current = addHeatCircles(mapRef.current, properties, 'infra');
    }
  }, [activeLayer, properties]);

  /* ── 5. Fly to selected property ── */
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const prop = properties.find((p) => p.id === selectedId);
    if (prop) {
      mapRef.current.flyTo(
        [prop.location.coordinates.lat, prop.location.coordinates.lng],
        8,
        { duration: 1.2 }
      );
    }
  }, [selectedId, properties]);

  return <div ref={containerRef} className="h-full w-full" />;
}
