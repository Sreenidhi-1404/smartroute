import React, { useState, useMemo } from 'react';
import { Route, PickupPoint } from '../../types';
import { useData } from '../../context/DataContext';
import {
  MapPin,
  Navigation,
  Clock,
  Users,
  Bus as BusIcon,
  Info,
  ExternalLink,
  Compass,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LayoutGrid,
  Map as MapIcon,
  ListOrdered,
  Eye,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface RouteVisualizerProps {
  route: Route;
  activeStopIndex?: number;
}

export const RouteVisualizer: React.FC<RouteVisualizerProps> = ({
  route,
  activeStopIndex = 1,
}) => {
  const { students, buses, drivers } = useData();
  const [selectedStop, setSelectedStop] = useState<PickupPoint | null>(
    route.pickupPoints[0] || null
  );
  const [viewMode, setViewMode] = useState<'map' | 'grid' | 'sequence'>('map');
  const [mapTheme, setMapTheme] = useState<'street' | 'dark'>('street');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const bus = buses.find(b => b.id === route.assignedBusId);
  const driver = drivers.find(d => d.id === route.assignedDriverId);
  const routeStudents = students.filter(
    s => s.assignedRouteId === route.id && s.transportStatus === 'Active'
  );

  // Keep selected stop valid when route changes
  React.useEffect(() => {
    setSelectedStop(route.pickupPoints[0] || null);
  }, [route.id]);

  // Geographical bounding box & 2D canvas coordinates projection
  const { minLat, maxLat, minLng, maxLng, projectedPoints } = useMemo(() => {
    const defaultCoords = [
      { lat: 11.0185, lng: 76.955 },
      { lat: 11.022, lng: 76.972 },
      { lat: 11.025, lng: 76.985 },
      { lat: 11.026, lng: 77.002 },
      { lat: 11.0285, lng: 77.0189 },
    ];

    const coords = route.pickupPoints.map((p, idx) => {
      const lat =
        typeof p.latitude === 'number' && !isNaN(p.latitude)
          ? p.latitude
          : defaultCoords[idx % defaultCoords.length].lat;
      const lng =
        typeof p.longitude === 'number' && !isNaN(p.longitude)
          ? p.longitude
          : defaultCoords[idx % defaultCoords.length].lng;
      return { id: p.id, lat, lng, stop: p };
    });

    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    const minL = Math.min(...lats);
    const maxL = Math.max(...lats);
    const minG = Math.min(...lngs);
    const maxG = Math.max(...lngs);

    const latSpan = Math.max(maxL - minL, 0.012);
    const lngSpan = Math.max(maxG - minG, 0.015);

    const padLat = latSpan * 0.18;
    const padLng = lngSpan * 0.18;

    const minLatVal = minL - padLat;
    const maxLatVal = maxL + padLat;
    const minLngVal = minG - padLng;
    const maxLngVal = maxG + padLng;

    const projected = coords.map((c, idx) => {
      const latSpanVal = maxLatVal - minLatVal || 0.01;
      const lngSpanVal = maxLngVal - minLngVal || 0.01;

      // x: 8% to 92%
      const x = ((c.lng - minLngVal) / lngSpanVal) * 82 + 9;
      // y: North (maxLat) at top -> 10% to 90%
      const y = ((maxLatVal - c.lat) / latSpanVal) * 78 + 11;

      return {
        ...c,
        order: idx + 1,
        x: Math.min(Math.max(x, 6), 94),
        y: Math.min(Math.max(y, 8), 92),
      };
    });

    return {
      minLat: minLatVal,
      maxLat: maxLatVal,
      minLng: minLngVal,
      maxLng: maxLngVal,
      projectedPoints: projected,
    };
  }, [route.pickupPoints]);

  // Google Maps Directions link for the entire route
  const googleMapsDirectionsUrl = useMemo(() => {
    if (route.pickupPoints.length < 2) return '';
    const origin = encodeURIComponent(
      `${route.pickupPoints[0].latitude || 11.0185},${route.pickupPoints[0].longitude || 76.955}`
    );
    const dest = encodeURIComponent(
      `${route.pickupPoints[route.pickupPoints.length - 1].latitude || 11.0285},${
        route.pickupPoints[route.pickupPoints.length - 1].longitude || 77.0189
      }`
    );
    const waypoints = route.pickupPoints
      .slice(1, -1)
      .map(p => `${p.latitude || 11.02},${p.longitude || 76.98}`)
      .join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${
      waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''
    }&travelmode=driving`;
  }, [route.pickupPoints]);

  // SVG Path generator connecting stops sequentially
  const svgPathD = useMemo(() => {
    if (projectedPoints.length < 2) return '';
    return projectedPoints.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      // Smooth curve or straight polyline segment
      const prev = projectedPoints[i - 1];
      const cx = (prev.x + pt.x) / 2;
      const cy = (prev.y + pt.y) / 2;
      return `${acc} Q ${prev.x} ${cy}, ${cx} ${cy} T ${pt.x} ${pt.y}`;
    }, '');
  }, [projectedPoints]);

  // Moving Bus indicator position along path
  const busPosition = useMemo(() => {
    const idx = Math.min(activeStopIndex, projectedPoints.length - 1);
    const curr = projectedPoints[idx];
    const next = projectedPoints[Math.min(idx + 1, projectedPoints.length - 1)];
    if (!curr) return { x: 50, y: 50 };
    return {
      x: (curr.x + next.x) / 2,
      y: (curr.y + next.y) / 2,
    };
  }, [projectedPoints, activeStopIndex]);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl flex flex-col' : ''
      }`}
    >
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900">{route.name}</span>
            <Badge variant="info">{route.routeCode}</Badge>
            <Badge variant={route.status === 'Active' ? 'success' : 'neutral'}>
              {route.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{route.startLocation}</span>
            <span className="text-slate-400">➔</span>
            <span>{route.destination}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs shadow-2xs">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Interactive 2D Static Map Placeholder"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map Visualization</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Basic Grid Layout of Stops"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Stops Grid ({route.pickupPoints.length})</span>
            </button>
            <button
              onClick={() => setViewMode('sequence')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'sequence'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sequential Stop Manifest"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Stop Sequence</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600 border-l border-slate-200 pl-3">
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              {route.estimatedDistanceKm} km
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              {route.estimatedDurationMin} min
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              {routeStudents.length} students
            </span>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* VIEW 1: MAP VISUALIZATION (STATIC MAP PLACEHOLDER & 2D COORDINATE GRID) */}
      {viewMode === 'map' && (
        <div className={`p-4 sm:p-5 flex-1 flex flex-col space-y-4 ${isFullscreen ? 'overflow-y-auto' : ''}`}>
          {/* Map Canvas HUD & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-600" />
                Coimbatore Transit Sector Map:
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                [{minLat.toFixed(4)}°N, {minLng.toFixed(4)}°E] ➔ [{maxLat.toFixed(4)}°N, {maxLng.toFixed(4)}°E]
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Map Theme Toggle */}
              <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMapTheme('street')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    mapTheme === 'street'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Street Grid
                </button>
                <button
                  type="button"
                  onClick={() => setMapTheme('dark')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    mapTheme === 'dark'
                      ? 'bg-slate-800 text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Blueprint Night
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-white text-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.max(0.8, +(z - 0.15).toFixed(2)))}
                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-[10px] font-mono font-medium text-slate-600">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.min(1.5, +(z + 0.15).toFixed(2)))}
                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded ml-0.5"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Google Maps External Directions */}
              {googleMapsDirectionsUrl && (
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition-colors shadow-2xs"
                  title="Open driving directions in Google Maps"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Google Maps</span>
                </a>
              )}
            </div>
          </div>

          {/* Interactive 2D Static Map Placeholder Canvas */}
          <div
            className={`relative w-full rounded-2xl overflow-hidden border shadow-inner transition-all select-none ${
              isFullscreen ? 'h-[540px]' : 'h-96'
            } ${
              mapTheme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-200'
                : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}
          >
            {/* Grid Lines & Coimbatore Map Blueprint Background */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity ${
                mapTheme === 'dark' ? 'opacity-25' : 'opacity-40'
              }`}
              style={{
                backgroundImage:
                  mapTheme === 'dark'
                    ? 'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px), radial-gradient(#0284c7 1px, transparent 1px)'
                    : 'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px), radial-gradient(#64748b 1px, transparent 1px)',
                backgroundSize: '40px 40px, 40px 40px, 20px 20px',
              }}
            />

            {/* Simulated Coimbatore Arterial Road Network & Land Features */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Avinashi Road Arterial Corridor */}
              <div
                className={`absolute left-0 right-0 top-[48%] h-3.5 -rotate-3 border-y ${
                  mapTheme === 'dark'
                    ? 'bg-slate-800/90 border-slate-700/80'
                    : 'bg-amber-100/90 border-amber-300/80'
                }`}
              >
                <span
                  className={`absolute left-8 top-0 text-[9px] font-bold tracking-wider uppercase ${
                    mapTheme === 'dark' ? 'text-slate-400' : 'text-amber-800'
                  }`}
                >
                  Avinashi Road (NH-544)
                </span>
              </div>

              {/* Sathy Road Arterial Cross */}
              <div
                className={`absolute top-0 bottom-0 left-[35%] w-3 rotate-6 border-x ${
                  mapTheme === 'dark'
                    ? 'bg-slate-800/80 border-slate-700/60'
                    : 'bg-amber-50/90 border-amber-200/80'
                }`}
              >
                <span
                  className={`absolute top-6 left-4 text-[9px] font-bold tracking-wider uppercase whitespace-nowrap ${
                    mapTheme === 'dark' ? 'text-slate-400' : 'text-amber-800'
                  }`}
                >
                  Sathy Main Road
                </span>
              </div>

              {/* Trichy Road Corridor */}
              <div
                className={`absolute left-0 right-0 bottom-[18%] h-3 rotate-2 border-y ${
                  mapTheme === 'dark'
                    ? 'bg-slate-800/80 border-slate-700/60'
                    : 'bg-amber-50/90 border-amber-200/80'
                }`}
              >
                <span
                  className={`absolute right-12 top-0 text-[9px] font-bold tracking-wider uppercase ${
                    mapTheme === 'dark' ? 'text-slate-400' : 'text-amber-800'
                  }`}
                >
                  Trichy Road (SH-17)
                </span>
              </div>

              {/* Coimbatore Locality Watermark Badges */}
              <div className="absolute inset-0 flex flex-wrap justify-between p-8 pointer-events-none opacity-40 text-[10px] font-bold tracking-widest uppercase">
                <span className="p-1 rounded bg-black/5">Saravanampatti</span>
                <span className="p-1 rounded bg-black/5">Peelamedu Tech Hub</span>
                <span className="p-1 rounded bg-black/5">Hope College Campus Loop</span>
                <span className="p-1 rounded bg-black/5">Singanallur</span>
                <span className="p-1 rounded bg-black/5">Gandhipuram Cross</span>
              </div>
            </div>

            {/* Transform Container with Zoom */}
            <div
              className="absolute inset-0 transition-transform duration-300 origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* SVG Vector Route Polyline connecting all stops */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Outer Glow Path */}
                {svgPathD && (
                  <path
                    d={svgPathD}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeOpacity="0.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                  />
                )}

                {/* Core Path Line */}
                {svgPathD && (
                  <path
                    d={svgPathD}
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Direction Flow Dashed Animation */}
                {svgPathD && (
                  <path
                    d={svgPathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    strokeDasharray="2 4"
                    strokeLinecap="round"
                    className="animate-pulse"
                    opacity="0.85"
                  />
                )}
              </svg>

              {/* Moving Bus Location Marker */}
              <div
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 pointer-events-none"
                style={{ left: `${busPosition.x}%`, top: `${busPosition.y}%` }}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-4 ring-blue-300/60 animate-bounce">
                    <BusIcon className="w-4 h-4" />
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded shadow-md whitespace-nowrap">
                    {bus?.busNumber || 'Fleet Bus'}
                  </div>
                </div>
              </div>

              {/* Interactive Stop Pins (Markers) */}
              {projectedPoints.map((pt, idx) => {
                const isSelected = selectedStop?.id === pt.id;
                const isOrigin = idx === 0;
                const isDestination = idx === projectedPoints.length - 1;
                const stopStudents = routeStudents.filter(s => s.pickupPointId === pt.id);

                return (
                  <div
                    key={pt.id}
                    onClick={() => setSelectedStop(pt.stop)}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                  >
                    {/* Pulsing ring for selected stop */}
                    {isSelected && (
                      <div className="absolute inset-0 -m-2 rounded-full bg-blue-400/40 animate-ping pointer-events-none" />
                    )}

                    {/* Marker Badge */}
                    <div
                      className={`relative flex items-center justify-center font-bold text-xs rounded-full shadow-lg transition-transform ${
                        isSelected
                          ? 'scale-125 ring-4 ring-blue-400 z-30'
                          : 'hover:scale-115 hover:z-25'
                      } ${
                        isDestination
                          ? 'w-9 h-9 bg-emerald-600 text-white ring-2 ring-emerald-300'
                          : isOrigin
                          ? 'w-8 h-8 bg-blue-600 text-white ring-2 ring-blue-300'
                          : 'w-7 h-7 bg-white text-slate-800 border-2 border-blue-500'
                      }`}
                    >
                      {isDestination ? '🏫' : isOrigin ? '🚩' : pt.order}
                    </div>

                    {/* Stop Label Tooltip */}
                    <div
                      className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap shadow-md pointer-events-none transition-all ${
                        isSelected
                          ? 'bg-blue-900 text-white scale-105 z-30 ring-1 ring-white/20'
                          : 'bg-white/95 text-slate-800 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white'
                      }`}
                    >
                      <div className="leading-tight">{pt.stop.name}</div>
                      <div className="text-[9px] opacity-80 font-normal">
                        {pt.stop.morningTime} • {stopStudents.length} {stopStudents.length === 1 ? 'student' : 'students'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Map Canvas HUD: Compass Rose & Scale */}
            <div className="absolute top-3 left-3 z-30 flex flex-col gap-1 pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 shadow-2xs text-[11px] font-bold text-slate-700 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{route.name}</span>
                <span className="text-slate-400">({route.pickupPoints.length} Stops)</span>
              </div>
            </div>

            {/* Compass North Arrow */}
            <div className="absolute top-3 right-3 z-30 pointer-events-none flex flex-col items-center p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 shadow-2xs text-[10px] font-bold text-slate-700 dark:text-slate-200">
              <span className="text-blue-600 leading-none">▲</span>
              <span className="leading-none mt-0.5">N</span>
            </div>

            {/* Map Bottom Legend */}
            <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Start Origin</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-blue-500" />
                  <span>Intermediate Stop</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>School Campus Gate</span>
                </span>
                <span className="flex items-center gap-1">
                  <BusIcon className="w-3 h-3 text-blue-600" />
                  <span>Bus Tracker ({bus?.busNumber || 'Fleet'})</span>
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                Click any stop marker to inspect student manifest
              </div>
            </div>
          </div>

          {/* Selected Stop Inspector Card */}
          {selectedStop && (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    Stop #{selectedStop.order}: {selectedStop.name}
                  </span>
                  <Badge variant="info">{selectedStop.address}</Badge>
                  {selectedStop.order === route.pickupPoints.length && (
                    <Badge variant="success">Final School Campus Drop</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span>
                    <strong>Morning Pickup ETA:</strong> {selectedStop.morningTime}
                  </span>
                  <span>
                    <strong>Afternoon Drop ETA:</strong> {selectedStop.afternoonTime}
                  </span>
                  {selectedStop.latitude && selectedStop.longitude && (
                    <span className="font-mono text-slate-500 text-[11px]">
                      GPS: {selectedStop.latitude.toFixed(4)}°N, {selectedStop.longitude.toFixed(4)}°E
                    </span>
                  )}
                  {selectedStop.landmark && (
                    <span className="text-slate-500 italic">
                      Landmark: {selectedStop.landmark}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-800">Assigned Students</div>
                  <div className="text-xs text-blue-700 font-bold">
                    {routeStudents.filter(s => s.pickupPointId === selectedStop.id).length} boarding here
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>View in Grid</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: BASIC GRID LAYOUT SHOWING STOPS FOR SELECTED ROUTE */}
      {viewMode === 'grid' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-600" />
                Stops Grid Layout for {route.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of all {route.pickupPoints.length} scheduled stops, arrival timetables, GPS coordinates, and student allocations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Back to Map Canvas</span>
            </button>
          </div>

          {/* Grid Layout of Stop Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {route.pickupPoints.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === route.pickupPoints.length - 1;
              const stopStudents = routeStudents.filter(s => s.pickupPointId === stop.id);
              const isSelected = selectedStop?.id === stop.id;

              return (
                <div
                  key={stop.id}
                  onClick={() => setSelectedStop(stop)}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-2 ring-blue-400/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Card Top: Order Pill & Times */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFirst
                            ? 'bg-blue-600 text-white'
                            : isLast
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isFirst ? 'Stop #1 • Origin' : isLast ? `Stop #${idx + 1} • Campus` : `Stop #${idx + 1}`}
                      </span>

                      <span className="text-[11px] font-mono font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        AM: {stop.morningTime}
                      </span>
                    </div>

                    {/* Stop Name & Address */}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                        {stop.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{stop.address}</span>
                      </p>
                    </div>

                    {/* Landmark Note */}
                    {stop.landmark && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                        <strong>Landmark:</strong> {stop.landmark}
                      </div>
                    )}

                    {/* Coordinates */}
                    {stop.latitude && stop.longitude && (
                      <div className="text-[10px] font-mono text-slate-400">
                        GPS: {stop.latitude.toFixed(4)}° N, {stop.longitude.toFixed(4)}° E
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Student Count & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {stopStudents.length} {stopStudents.length === 1 ? 'Student' : 'Students'}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        PM Drop: {stop.afternoonTime}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedStop(stop);
                        setViewMode('map');
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Locate</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: DETAILED SEQUENCE LIST */}
      {viewMode === 'sequence' && (
        <div className="p-5">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {route.pickupPoints.map((stop, i) => {
              const stopStudents = routeStudents.filter(s => s.pickupPointId === stop.id);
              const isSchool = i === route.pickupPoints.length - 1;

              return (
                <div key={stop.id} className="relative group">
                  {/* Pin */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isSchool ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {i + 1}
                  </div>

                  <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-4 rounded-xl border border-slate-200/80">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                          {stop.name}
                          {isSchool && <Badge variant="success">Final Destination</Badge>}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {stop.address}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-medium">
                        <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
                          AM: {stop.morningTime}
                        </span>
                        <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
                          PM: {stop.afternoonTime}
                        </span>
                      </div>
                    </div>

                    {stop.landmark && (
                      <p className="text-xs text-slate-500 mt-2 bg-white/60 p-2 rounded-lg border border-slate-100">
                        <strong>Landmark Reference:</strong> {stop.landmark}
                      </p>
                    )}

                    {!isSchool && stopStudents.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                        <span className="text-xs font-medium text-slate-600 block mb-1.5">
                          Assigned Students ({stopStudents.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {stopStudents.map(s => (
                            <span
                              key={s.id}
                              className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700"
                            >
                              {s.name} (Gr {s.classGrade}{s.section})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
