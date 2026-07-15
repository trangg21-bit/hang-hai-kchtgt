import { Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

type ToolMode =
  | 'identify'
  | 'draw-point'
  | 'draw-line'
  | 'draw-polygon'
  | 'measure-distance'
  | 'measure-area'
  | 'zoom-box'
  | 'delete-point'
  | null;

interface MapToolbarProps {
  map: any;
  onClearAll?: () => void;
}

// Helper to get global Leaflet instance dynamically
const getL = () => (window as any).L;

// ─── Icons (inline SVGs matching original project) ───────────────────────────
const IconIdentify = () => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" x2="16.65" y1="21" y2="16.65" />
    <line x1="11" x2="11" y1="8" y2="14" />
    <line x1="8" x2="14" y1="11" y2="11" />
  </svg>
);

const IconPoint = () => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <circle cx="12" cy="12" fill="currentColor" r="4" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const IconLine = () => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <line x1="4" x2="20" y1="20" y2="4" />
    <circle cx="4" cy="20" fill="currentColor" r="2" />
    <circle cx="20" cy="4" fill="currentColor" r="2" />
  </svg>
);

const IconPolygon = () => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <polygon points="12,3 21,21 3,21" />
  </svg>
);

const IconMeasureDist = () => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <line x1="3" x2="21" y1="21" y2="3" />
    <line strokeDasharray="3 2" x1="3" x2="3" y1="3" y2="21" />
    <line strokeDasharray="3 2" x1="21" x2="21" y1="3" y2="21" />
    <text fill="currentColor" fontSize="6" stroke="none" x="6" y="14">km</text>
  </svg>
);

const IconMeasureArea = () => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <rect height="18" width="18" x="3" y="3" />
    <text fill="currentColor" fontSize="6" stroke="none" x="7" y="15">m²</text>
  </svg>
);

const IconZoomBox = () => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <rect height="18" strokeDasharray="4 2" width="18" x="3" y="3" />
    <path d="M9 12h6M12 9v6" />
  </svg>
);

const IconClear = () => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const IconEraser = () => (
  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
    <path d="M20 20H7L3 16l10-10 7 7-3.5 3.5" />
    <path d="M6.5 17.5l4-4" />
  </svg>
);

// ─── Haversine distance in meters ─────────────────────────────────────────────
function haversineDistance(latlng1: any, latlng2: any): number {
  const R = 6371000;
  const φ1 = (latlng1.lat * Math.PI) / 180;
  const φ2 = (latlng2.lat * Math.PI) / 180;
  const Δφ = ((latlng2.lat - latlng1.lat) * Math.PI) / 180;
  const Δλ = ((latlng2.lng - latlng1.lng) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function totalDistance(points: any[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += haversineDistance(points[i - 1], points[i]);
  return total;
}

function polygonArea(points: any[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const xi = points[i].lng * 111320 * Math.cos((points[i].lat * Math.PI) / 180);
    const yi = points[i].lat * 110540;
    const xj = points[j].lng * 111320 * Math.cos((points[j].lat * Math.PI) / 180);
    const yj = points[j].lat * 110540;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area / 2);
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(0)} m`;
}

function formatArea(m2: number): string {
  return m2 >= 1000000 ? `${(m2 / 1000000).toFixed(3)} km²` : `${m2.toFixed(0)} m²`;
}

export default function MapToolbar({ map, onClearAll }: MapToolbarProps) {
  const [activeTool, setActiveTool] = useState<ToolMode>(null);
  const [measurePoints, setMeasurePoints] = useState<any[]>([]);
  const [zoomBoxStart, setZoomBoxStart] = useState<any | null>(null);

  const activeToolRef = useRef<ToolMode>(null);
  const measurePointsRef = useRef<any[]>([]);
  const zoomBoxStartRef = useRef<any | null>(null);
  const zoomRectRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const measurePolylineRef = useRef<any>(null);
  const measureShadowPolylineRef = useRef<any>(null);
  const measureMarkersRef = useRef<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    measurePointsRef.current = measurePoints;
  }, [measurePoints]);

  useEffect(() => {
    zoomBoxStartRef.current = zoomBoxStart;
  }, [zoomBoxStart]);

  // Add measurement layer group to map dynamically
  useEffect(() => {
    if (!map) return;
    const L = getL();
    if (!L) return;

    if (!layerGroupRef.current) {
      layerGroupRef.current = new L.FeatureGroup();
    }

    layerGroupRef.current.addTo(map);
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.removeFrom(map);
      }
    };
  }, [map]);

  // Disable event propagation for toolbar container so clicks don't hit the map
  useEffect(() => {
    const L = getL();
    if (containerRef.current && L) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  // Reset cursors and stop Geoman/draw modes
  const disableAllModes = useCallback(() => {
    if (!map) return;
    const pm = (map as any).pm;
    if (pm) {
      pm.disableDraw();
      pm.disableGlobalEditMode();
      pm.disableGlobalRemovalMode();
      pm.disableGlobalDragMode();
    }
    const container = map.getContainer();
    if (container) {
      container.style.cursor = '';
    }
  }, [map]);

  const clearAll = useCallback(() => {
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    }
    setMeasurePoints([]);
    measurePointsRef.current = [];
    measureMarkersRef.current = [];
    measurePolylineRef.current = null;
    measureShadowPolylineRef.current = null;
    setZoomBoxStart(null);
    zoomBoxStartRef.current = null;
    if (zoomRectRef.current && map) {
      map.removeLayer(zoomRectRef.current);
      zoomRectRef.current = null;
    }
    disableAllModes();
  }, [map, disableAllModes]);

  const selectTool = useCallback((tool: ToolMode) => {
    if (!map) return;
    
    // Deactivate previous modes
    disableAllModes();

    if (activeTool === tool) {
      setActiveTool(null);
      return;
    }

    clearAll();
    setActiveTool(tool);

    const pm = (map as any).pm;
    const container = map.getContainer();
    
    // Set map cursor style
    const cursorMap: Record<string, string> = {
      'draw-point': 'crosshair',
      'draw-line': 'crosshair',
      'draw-polygon': 'crosshair',
      identify: 'help',
      'measure-area': 'crosshair',
      'measure-distance': 'crosshair',
      'zoom-box': 'zoom-in'
    };
    if (container) {
      container.style.cursor = cursorMap[tool] || '';
    }

    // Toggle Geoman drawing based on tool selection
    if (pm) {
      if (tool === 'draw-point') {
        pm.enableDraw('Marker');
      } else if (tool === 'draw-line') {
        pm.enableDraw('Line');
      } else if (tool === 'draw-polygon') {
        pm.enableDraw('Polygon');
      } else if (tool === 'delete-point') {
        pm.enableGlobalRemovalMode();
      }
    }
  }, [map, activeTool, clearAll, disableAllModes]);

  // Handle custom map click listeners for Measure Distance, Measure Area, and Zoom Box
  useEffect(() => {
    if (!map) return;

    const onClick = (e: any) => {
      const L = getL();
      if (!L) return;
      const tool = activeToolRef.current;
      if (!tool) return;

      if (tool === 'identify') {
        setActiveTool(null);
        return;
      }

      if (tool === 'measure-distance' || tool === 'measure-area') {
        const pts = [...measurePointsRef.current, e.latlng];
        setMeasurePoints(pts);
        measurePointsRef.current = pts;

        // Draw a visual marker at this vertex
        const marker = L.circleMarker(e.latlng, {
          color: '#e03131',
          fillColor: '#e03131',
          fillOpacity: 1,
          interactive: true,
          radius: 5
        });
        if (layerGroupRef.current) {
          marker.addTo(layerGroupRef.current);
        }
        measureMarkersRef.current.push(marker);

        if (pts.length >= 2) {
          if (tool === 'measure-distance') {
            if (!measurePolylineRef.current) {
              measurePolylineRef.current = L.polyline(pts, {
                color: '#e03131',
                dashArray: '5 4',
                interactive: true,
                weight: 2
              });
              if (layerGroupRef.current) {
                measurePolylineRef.current.addTo(layerGroupRef.current);
              }

              measureShadowPolylineRef.current = L.polyline(pts, {
                color: 'transparent',
                interactive: true,
                weight: 16
              });
              if (layerGroupRef.current) {
                measureShadowPolylineRef.current.addTo(layerGroupRef.current);
              }
            } else {
              measurePolylineRef.current.setLatLngs(pts);
              measureShadowPolylineRef.current.setLatLngs(pts);
            }
            
            // Show running total in a transient tooltip/popup
            const dist = totalDistance(pts);
            L.popup()
              .setLatLng(e.latlng)
              .setContent(`<div style="font-family:sans-serif;font-weight:600;font-size:12px;color:#333;">📏 Tổng: ${formatDistance(dist)}</div>`)
              .openOn(map);
          } else {
            // For measure-area, draw a visual line boundary
            if (!measurePolylineRef.current) {
              measurePolylineRef.current = L.polyline(pts, {
                color: '#e03131',
                dashArray: '5 4',
                interactive: true,
                weight: 2
              });
              if (layerGroupRef.current) {
                measurePolylineRef.current.addTo(layerGroupRef.current);
              }
            } else {
              measurePolylineRef.current.setLatLngs(pts);
            }
          }
        }
      }

      if (tool === 'zoom-box') {
        if (!zoomBoxStartRef.current) {
          setZoomBoxStart(e.latlng);
          zoomBoxStartRef.current = e.latlng;
        } else {
          const bounds = L.latLngBounds(zoomBoxStartRef.current, e.latlng);
          map.fitBounds(bounds);
          if (zoomRectRef.current) {
            map.removeLayer(zoomRectRef.current);
          }
          zoomRectRef.current = null;
          setZoomBoxStart(null);
          zoomBoxStartRef.current = null;
          setActiveTool(null);
        }
      }
    };

    const onDblClick = (e: any) => {
      const L = getL();
      if (!L) return;
      const tool = activeToolRef.current;
      if (tool !== 'measure-distance' && tool !== 'measure-area') return;

      e.originalEvent.preventDefault();
      const pts = measurePointsRef.current;
      if (pts.length < 2) {
        setActiveTool(null);
        return;
      }

      if (tool === 'measure-distance') {
        const dist = totalDistance(pts);
        const popupContent = `
          <div style="font-family:sans-serif;font-weight:600;font-size:12px;color:#333;padding:2px;">
            <div>📏 Khoảng cách: ${formatDistance(dist)}</div>
            <button class="measure-del-btn" style="margin-top:6px;width:100%;cursor:pointer;border:1px solid #d9d9d9;background:#fff;border-radius:4px;padding:2px 8px;font-size:11px;">Xóa</button>
          </div>
        `;
        L.popup()
          .setLatLng(pts[pts.length - 1])
          .setContent(popupContent)
          .openOn(map);

        setTimeout(() => {
          const btn = document.querySelector('.measure-del-btn');
          if (btn) {
            btn.addEventListener('click', () => {
              clearAll();
              map.closePopup();
            });
          }
        }, 100);
      } else if (tool === 'measure-area' && pts.length >= 3) {
        const area = polygonArea(pts);

        if (measurePolylineRef.current && layerGroupRef.current) {
          layerGroupRef.current.removeLayer(measurePolylineRef.current);
          measurePolylineRef.current = null;
        }

        // Close visual polygon
        const poly = L.polygon(pts, {
          color: '#e03131',
          fillColor: '#e03131',
          fillOpacity: 0.15,
          interactive: true,
          weight: 2
        });
        if (layerGroupRef.current) {
          poly.addTo(layerGroupRef.current);
        }

        const popupContent = `
          <div style="font-family:sans-serif;font-weight:600;font-size:12px;color:#333;padding:2px;">
            <div>📐 Diện tích: ${formatArea(area)}</div>
            <button class="measure-del-btn" style="margin-top:6px;width:100%;cursor:pointer;border:1px solid #d9d9d9;background:#fff;border-radius:4px;padding:2px 8px;font-size:11px;">Xóa</button>
          </div>
        `;
        L.popup()
          .setLatLng(pts[pts.length - 1])
          .setContent(popupContent)
          .openOn(map);

        setTimeout(() => {
          const btn = document.querySelector('.measure-del-btn');
          if (btn) {
            btn.addEventListener('click', () => {
              clearAll();
              map.closePopup();
            });
          }
        }, 100);
      }

      measurePolylineRef.current = null;
      measureShadowPolylineRef.current = null;
      measureMarkersRef.current = [];
      setActiveTool(null);
    };

    const onMouseMove = (e: any) => {
      const L = getL();
      if (!L) return;
      const tool = activeToolRef.current;
      if (tool === 'zoom-box' && zoomBoxStartRef.current) {
        if (zoomRectRef.current) {
          map.removeLayer(zoomRectRef.current);
        }
        zoomRectRef.current = L.rectangle(L.latLngBounds(zoomBoxStartRef.current, e.latlng), {
          color: '#1971c2',
          fillOpacity: 0.1,
          weight: 2
        }).addTo(map);
      }
    };

    map.on('click', onClick);
    map.on('dblclick', onDblClick);
    map.on('mousemove', onMouseMove);

    return () => {
      map.off('click', onClick);
      map.off('dblclick', onDblClick);
      map.off('mousemove', onMouseMove);
    };
  }, [map, clearAll]);

  // Toolbar button style
  const btnStyle = (tool: ToolMode): React.CSSProperties => ({
    alignItems: 'center',
    background: activeTool === tool ? '#1b84ff' : '#fff',
    border: activeTool === tool ? '2px solid #0066cc' : '1px solid #d9d9d9',
    borderRadius: 6,
    boxShadow: activeTool === tool ? '0 2px 6px rgba(27,132,255,0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
    boxSizing: 'border-box',
    color: activeTool === tool ? '#fff' : '#444',
    cursor: 'pointer',
    display: 'flex',
    height: 36,
    justifyContent: 'center',
    padding: 0,
    transition: 'all 0.15s',
    width: 36
  });

  const tools: { icon: React.ReactNode; key: ToolMode; title: string }[] = [
    { icon: <IconIdentify />, key: 'identify', title: 'Chọn / Điều hướng bản đồ' },
    { icon: <IconPoint />, key: 'draw-point', title: 'Vẽ điểm' },
    { icon: <IconLine />, key: 'draw-line', title: 'Vẽ đường' },
    { icon: <IconPolygon />, key: 'draw-polygon', title: 'Vẽ vùng đa giác' },
    {
      icon: <IconMeasureDist />,
      key: 'measure-distance',
      title: 'Đo khoảng cách (click các điểm, click đúp để hoàn thành)'
    },
    {
      icon: <IconMeasureArea />,
      key: 'measure-area',
      title: 'Đo diện tích (click các điểm, click đúp để hoàn thành)'
    },
    { icon: <IconZoomBox />, key: 'zoom-box', title: 'Zoom theo vùng (click 2 điểm trên bản đồ)' },
    { icon: <IconEraser />, key: 'delete-point', title: 'Xóa đối tượng vừa vẽ (click vào đối tượng muốn xóa)' }
  ];

  return (
    <>
      <div
        ref={containerRef}
        style={{
          alignItems: 'center',
          backdropFilter: 'blur(4px)',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 8,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'row',
          gap: 4,
          left: '50%',
          padding: '5px 8px',
          position: 'absolute',
          top: 10,
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {tools.map(t => (
          <Tooltip key={t.key} placement="bottom" title={t.title}>
            <button
              style={btnStyle(t.key)}
              type="button"
              onClick={() => selectTool(t.key)}
              onMouseDown={e => e.preventDefault()}
            >
              {t.icon}
            </button>
          </Tooltip>
        ))}

        <div style={{ background: '#e0e0e0', height: 28, margin: '0 2px', width: 1 }} />
        
        <Tooltip placement="bottom" title="Xóa tất cả bản vẽ">
          <button
            style={{ ...btnStyle(null), color: '#c92a2a' }}
            type="button"
            onClick={() => {
              clearAll();
              if (onClearAll) onClearAll();
            }}
            onMouseDown={e => e.preventDefault()}
          >
            <IconClear />
          </button>
        </Tooltip>

        {activeTool && (
          <div style={{ color: '#1b84ff', fontSize: 11, marginLeft: 6, whiteSpace: 'nowrap', fontWeight: 500, fontFamily: 'sans-serif' }}>
            {activeTool === 'zoom-box'
              ? zoomBoxStart
                ? '— Click điểm thứ 2'
                : '— Click điểm thứ 1'
              : activeTool.startsWith('measure')
                ? `— ${measurePoints.length} điểm (dbl-click hoàn thành)`
                : activeTool === 'draw-point'
                  ? '— Click bản đồ để vẽ điểm'
                  : activeTool === 'draw-line'
                    ? '— Click các điểm, dbl-click để đóng'
                    : activeTool === 'draw-polygon'
                      ? '— Click các điểm, click điểm đầu để đóng'
                      : activeTool === 'delete-point'
                        ? '— Click vào điểm/đường/vùng để xóa'
                        : '...'}
          </div>
        )}
      </div>
    </>
  );
}
