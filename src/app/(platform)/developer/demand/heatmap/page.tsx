// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { Badge } from '@/components/ui/badge';
import { Flame, Layers, MapPin, TrendingUp } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Dubai zone demand data ──────────────────────── */
const DUBAI_CENTER: [number, number] = [25.2048, 55.2708];

interface DemandZone {
  name: string;
  lat: number;
  lng: number;
  demandScore: number;
  avgPrice: string;
  absorption: number;
  trend: 'Rising' | 'Stable' | 'Declining';
  radius: number;
}

const demandZones: DemandZone[] = [
  { name: 'Palm Jumeirah', lat: 25.1124, lng: 55.1390, demandScore: 95, avgPrice: 'AED 4.2M', absorption: 92, trend: 'Rising', radius: 1800 },
  { name: 'Dubai Marina', lat: 25.0805, lng: 55.1403, demandScore: 92, avgPrice: 'AED 2.8M', absorption: 88, trend: 'Rising', radius: 1500 },
  { name: 'Downtown Dubai', lat: 25.1972, lng: 55.2744, demandScore: 88, avgPrice: 'AED 3.5M', absorption: 85, trend: 'Stable', radius: 1600 },
  { name: 'Business Bay', lat: 25.1865, lng: 55.2622, demandScore: 75, avgPrice: 'AED 1.9M', absorption: 72, trend: 'Stable', radius: 1400 },
  { name: 'DIFC', lat: 25.2100, lng: 55.2790, demandScore: 71, avgPrice: 'AED 3.1M', absorption: 68, trend: 'Stable', radius: 1000 },
  { name: 'JVC', lat: 25.0657, lng: 55.2094, demandScore: 68, avgPrice: 'AED 950K', absorption: 74, trend: 'Rising', radius: 2000 },
  { name: 'Dubai Hills', lat: 25.1350, lng: 55.2400, demandScore: 82, avgPrice: 'AED 2.1M', absorption: 80, trend: 'Rising', radius: 2200 },
  { name: 'Creek Harbour', lat: 25.1900, lng: 55.3400, demandScore: 79, avgPrice: 'AED 1.8M', absorption: 76, trend: 'Rising', radius: 1600 },
  { name: 'JBR', lat: 25.0780, lng: 55.1340, demandScore: 85, avgPrice: 'AED 2.5M', absorption: 82, trend: 'Stable', radius: 1200 },
  { name: 'MBR City', lat: 25.1550, lng: 55.3100, demandScore: 73, avgPrice: 'AED 1.5M', absorption: 65, trend: 'Rising', radius: 2500 },
];

/* ── Color helpers ────────────────────────────────── */
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

function heatColor(score: number) {
  if (score >= 90) return '#22C55E';
  if (score >= 80) return '#4ADE80';
  if (score >= 70) return '#F59E0B';
  return '#6B7280';
}

function heatOpacity(score: number) {
  if (score >= 90) return 0.35;
  if (score >= 80) return 0.25;
  if (score >= 70) return 0.18;
  return 0.12;
}

const trendBadge: Record<string, 'success' | 'danger' | 'secondary'> = {
  Rising: 'success',
  Declining: 'danger',
  Stable: 'secondary',
};

/* ── Component ────────────────────────────────────── */
export default function DemandHeatmapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [selectedZone, setSelectedZone] = useState<DemandZone | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DUBAI_CENTER,
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(DARK_TILES, { attribution: DARK_ATTR, maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

    // Add heat circles and labels for each zone
    demandZones.forEach((zone) => {
      const color = heatColor(zone.demandScore);
      const opacity = heatOpacity(zone.demandScore);

      // Gradient-like concentric circles
      L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        color: 'transparent',
        fillColor: color,
        fillOpacity: opacity * 0.4,
      }).addTo(map);

      L.circle([zone.lat, zone.lng], {
        radius: zone.radius * 0.65,
        color: 'transparent',
        fillColor: color,
        fillOpacity: opacity * 0.7,
      }).addTo(map);

      L.circle([zone.lat, zone.lng], {
        radius: zone.radius * 0.3,
        color: 'transparent',
        fillColor: color,
        fillOpacity: opacity,
      }).addTo(map);

      // Label marker
      const labelIcon = L.divIcon({
        html: `
          <div style="
            display:flex; flex-direction:column; align-items:center; gap:2px;
            pointer-events: auto; cursor: pointer;
          ">
            <span style="
              font-size:11px; font-weight:700; color:${color};
              text-shadow: 0 1px 4px rgba(0,0,0,0.8);
              font-family: Inter, system-ui, sans-serif;
            ">${zone.demandScore}</span>
            <span style="
              font-size:9px; font-weight:500; color:#fff;
              text-shadow: 0 1px 4px rgba(0,0,0,0.8);
              font-family: Inter, system-ui, sans-serif;
              white-space: nowrap;
            ">${zone.name}</span>
          </div>
        `,
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon: labelIcon }).addTo(map);

      // Popup
      marker.bindPopup(
        `<div style="
          width:220px; padding:12px;
          background:var(--bg); border:1px solid var(--border);
          border-radius:12px; font-family:Inter,system-ui,sans-serif;
          box-shadow:0 12px 40px rgba(0,0,0,0.5);
        ">
          <p style="font-size:13px; font-weight:700; color:var(--fg); margin:0 0 8px;">${zone.name}</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <div style="background:var(--bg-secondary); border-radius:8px; padding:6px; text-align:center;">
              <p style="font-size:9px; color:var(--fg-muted); margin:0; text-transform:uppercase;">Demand</p>
              <p style="font-size:14px; font-weight:700; color:${color}; margin:2px 0 0;">${zone.demandScore}</p>
            </div>
            <div style="background:var(--bg-secondary); border-radius:8px; padding:6px; text-align:center;">
              <p style="font-size:9px; color:var(--fg-muted); margin:0; text-transform:uppercase;">Absorption</p>
              <p style="font-size:14px; font-weight:700; color:#8B7355; margin:2px 0 0;">${zone.absorption}%</p>
            </div>
          </div>
          <div style="margin-top:8px; padding-top:8px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px; font-weight:600; color:var(--fg);">${zone.avgPrice}</span>
            <span style="font-size:10px; font-weight:600; padding:2px 8px; border-radius:10px;
              background:${zone.trend === 'Rising' ? 'rgba(74,222,128,0.1)' : zone.trend === 'Declining' ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)'};
              color:${zone.trend === 'Rising' ? '#4ADE80' : zone.trend === 'Declining' ? '#EF4444' : '#9CA3AF'};
            ">${zone.trend}</span>
          </div>
        </div>`,
        { className: 'map-popup-custom', closeButton: false, offset: [0, -10], maxWidth: 240 }
      );

      marker.on('click', () => setSelectedZone(zone));
    });

    // Legend
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    // @ts-expect-error -- leaflet Control namespace vs callable type conflict
    const legend = L.control({ position: 'topright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.innerHTML = `
        <div style="
          background:var(--bg); border:1px solid var(--border);
          border-radius:12px; padding:12px 14px;
          font-family:Inter,system-ui,sans-serif;
          box-shadow:0 4px 16px rgba(0,0,0,0.3);
        ">
          <p style="font-size:10px; font-weight:700; color:var(--fg-muted); margin:0 0 8px; text-transform:uppercase; letter-spacing:0.05em;">Demand Score</p>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="width:10px; height:10px; border-radius:50%; background:#22C55E;"></span>
              <span style="font-size:11px; color:var(--fg);">90+ Very High</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="width:10px; height:10px; border-radius:50%; background:#4ADE80;"></span>
              <span style="font-size:11px; color:var(--fg);">80–89 High</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="width:10px; height:10px; border-radius:50%; background:#F59E0B;"></span>
              <span style="font-size:11px; color:var(--fg);">70–79 Moderate</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="width:10px; height:10px; border-radius:50%; background:#6B7280;"></span>
              <span style="font-size:11px; color:var(--fg);">Below 70</span>
            </div>
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const hotZones = demandZones.filter((z) => z.demandScore >= 85).length;
  const avgScore = Math.round(demandZones.reduce((s, z) => s + z.demandScore, 0) / demandZones.length);
  const risingCount = demandZones.filter((z) => z.trend === 'Rising').length;

  return (
    <PageContainer>
      <PageHeader
        title="Developer Demand Heatmap"
        description="Geospatial demand intelligence across Dubai zones"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Avg Demand Score" value={`${avgScore} / 100`} icon={Flame} iconColor="text-warning" />
        <StatCard title="Hot Zones (85+)" value={String(hotZones)} icon={MapPin} iconColor="text-danger" />
        <StatCard title="Rising Markets" value={String(risingCount)} icon={TrendingUp} iconColor="text-success" change={risingCount} changeLabel="zones" />
        <StatCard title="Zones Tracked" value={String(demandZones.length)} icon={Layers} iconColor="text-primary-500" />
      </div>

      {/* Map */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
        <div ref={mapContainerRef} className="h-[500px] w-full" />
      </div>

      {/* Zone table */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-[var(--fg)]">Zone Breakdown</h2>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Demand Score</th>
                <th className="px-4 py-3">Avg Price</th>
                <th className="px-4 py-3">Absorption</th>
                <th className="px-4 py-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {[...demandZones]
                .sort((a, b) => b.demandScore - a.demandScore)
                .map((zone) => (
                  <tr
                    key={zone.name}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedZone(zone);
                      mapRef.current?.flyTo([zone.lat, zone.lng], 14, { duration: 1 });
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--fg)]">{zone.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-[var(--bg-tertiary)]">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${zone.demandScore}%`, background: heatColor(zone.demandScore) }}
                          />
                        </div>
                        <span className="font-semibold" style={{ color: heatColor(zone.demandScore) }}>
                          {zone.demandScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--fg-secondary)]">{zone.avgPrice}</td>
                    <td className="px-4 py-3 text-[var(--fg-secondary)]">{zone.absorption}%</td>
                    <td className="px-4 py-3">
                      <Badge variant={trendBadge[zone.trend] ?? 'default'}>{zone.trend}</Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
