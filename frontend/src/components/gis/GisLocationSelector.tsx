import { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Select, Table, InputNumber, Button, Space, Card, Row, Col, Typography, Modal, Radio, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, CompassOutlined, EnvironmentOutlined, HolderOutlined } from '@ant-design/icons';
import { colors } from '../../theme';

interface GisLocationSelectorValue {
  geometryType: string;
  coordinates: string;
  symbolId?: string;
}

interface GisLocationSelectorProps {
  value?: GisLocationSelectorValue;
  onChange?: (value: GisLocationSelectorValue) => void;
  defaultGeometryType?: 'POINT' | 'LINE' | 'POLYGON';
  height?: number;
  disabled?: boolean;
  inline?: boolean;
}

// Global script loading helper to avoid duplicates
const loadStyle = (url: string) => {
  if (document.querySelector(`link[href="${url}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
};

const loadScript = (url: string, checkLoaded: () => boolean): Promise<void> => {
  return new Promise((resolve) => {
    if (checkLoaded()) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      const interval = setInterval(() => {
        if (checkLoaded()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      const interval = setInterval(() => {
        if (checkLoaded()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    };
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
};

const DDToDMS = (dd: number) => {
  const absDD = Math.abs(dd);
  const d = Math.floor(absDD);
  const m = Math.floor((absDD - d) * 60);
  const s = parseFloat(((absDD - d - m / 60) * 3600).toFixed(4));
  return { d, m, s };
};

const DMSToDD = (d: number, m: number, s: number) => {
  return d + m / 60 + s / 3600;
};

interface DmsInputProps {
  value: number;
  onChange: (val: number) => void;
  placeholderPrefix: string;
  disabled?: boolean;
}

function DmsInput({ value, onChange, disabled }: DmsInputProps) {
  const { d, m, s } = DDToDMS(value);

  const handleDChange = (newD: number | null) => {
    onChange(DMSToDD(newD || 0, m || 0, s || 0));
  };
  const handleMChange = (newM: number | null) => {
    onChange(DMSToDD(d || 0, newM || 0, s || 0));
  };
  const handleSChange = (newS: number | null) => {
    onChange(DMSToDD(d || 0, m || 0, newS || 0));
  };

  return (
    <div style={{ display: 'flex', gap: '4px', width: '100%', alignItems: 'center' }}>
      <Space.Compact size="small" style={{ flex: 1, minWidth: 46 }}>
        <InputNumber
          value={d}
          onChange={handleDChange}
          placeholder="Độ"
          style={{ width: '100%' }}
          controls={false}
          disabled={disabled}
        />
        <div style={{
          padding: '0 4px',
          background: '#f8fafc',
          border: '1px solid #d9d9d9',
          borderLeft: 'none',
          display: 'flex',
          alignItems: 'center',
          color: '#64748b',
          fontWeight: 600,
          fontSize: 11,
        }}>°</div>
      </Space.Compact>
      <Space.Compact size="small" style={{ flex: 1, minWidth: 46 }}>
        <InputNumber
          value={m}
          onChange={handleMChange}
          min={0}
          max={59}
          placeholder="Phút"
          style={{ width: '100%' }}
          controls={false}
          disabled={disabled}
        />
        <div style={{
          padding: '0 4px',
          background: '#f8fafc',
          border: '1px solid #d9d9d9',
          borderLeft: 'none',
          display: 'flex',
          alignItems: 'center',
          color: '#64748b',
          fontWeight: 600,
          fontSize: 11,
        }}>'</div>
      </Space.Compact>
      <Space.Compact size="small" style={{ flex: 1.3, minWidth: 60 }}>
        <InputNumber
          value={s}
          onChange={handleSChange}
          min={0}
          max={59.9999}
          step={0.01}
          placeholder="Giây"
          style={{ width: '100%' }}
          controls={false}
          disabled={disabled}
        />
        <div style={{
          padding: '0 4px',
          background: '#f8fafc',
          border: '1px solid #d9d9d9',
          borderLeft: 'none',
          display: 'flex',
          alignItems: 'center',
          color: '#64748b',
          fontWeight: 600,
          fontSize: 11,
        }}>"</div>
      </Space.Compact>
    </div>
  );
}

export default function GisLocationSelector({
  value = { geometryType: undefined, coordinates: '' },
  onChange,
  defaultGeometryType,
  height = 550,
  disabled,
  inline = false,
}: GisLocationSelectorProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [vertices, setVertices] = useState<{ lng: number; lat: number }[]>([]);
  const [internalGeom, setInternalGeom] = useState<string>('POINT');
  const [internalToaDo, setInternalToaDo] = useState<string>('');
  const [internalBieuTuong, setInternalBieuTuong] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<any>(null);
  const drawnLayerRef = useRef<any>(null);
  const isUpdatingFromMap = useRef(false);

  const internalGeomRef = useRef(internalGeom);
  const internalBieuTuongRef = useRef(internalBieuTuong);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    internalGeomRef.current = internalGeom;
    internalBieuTuongRef.current = internalBieuTuong;
  }, [internalGeom, internalBieuTuong]);

  useEffect(() => {
    disabledRef.current = disabled;
    if (mapRef.current?.pm) {
      if (disabled) {
        try {
          mapRef.current.pm.disableDraw();
          mapRef.current.pm.disableGlobalEditMode();
          mapRef.current.pm.removeControls();
        } catch {}
      }
    }
  }, [disabled]);

  // Auto trigger map resize when modal opens or inline mounted to prevent grey area issues
  useEffect(() => {
    if ((modalOpen || inline) && mapRef.current) {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 300);
    }
  }, [modalOpen, inline]);

  // Sync internal state with incoming props value
  useEffect(() => {
    const geometryType = value.geometryType || defaultGeometryType || 'POINT';
    const toaDo = value.coordinates || '';
    const bieuTuongId = value.symbolId;

    setInternalGeom(geometryType || '');
    setInternalToaDo(toaDo);
    setInternalBieuTuong(bieuTuongId);

    // Parse WKT to vertices
    if (geometryType) {
      const parsed = parseWktToVertices(toaDo, geometryType);
      setVertices(parsed);
    } else {
      setVertices([]);
    }
  }, [value.geometryType, value.coordinates, value.symbolId, defaultGeometryType]);

  // Load Leaflet and Geoman CDN scripts
  useEffect(() => {
    let active = true;
    (async () => {
      loadStyle('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
      loadStyle('https://unpkg.com/@geoman-io/leaflet-geoman-free@2.17.0/dist/leaflet-geoman.css');

      await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', () => !!(window as any).L);
      await loadScript(
        'https://unpkg.com/@geoman-io/leaflet-geoman-free@2.17.0/dist/leaflet-geoman.min.js',
        () => !!((window as any).L && (window as any).L.PM)
      );

      if (active) {
        setLeafletLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Parse WKT string into vertices list with smart cross-geometry conversion
  const parseWktToVertices = (wkt: string, geomType: string): { lng: number; lat: number }[] => {
    if (!wkt) return [];
    try {
      const trimmed = wkt.trim();
      const upper = trimmed.toUpperCase();
      const type = (geomType || 'POINT').toUpperCase();

      // Universal coordinate extractor across any WKT geometry format
      let rawPoints: { lng: number; lat: number }[] = [];

      if (upper.startsWith('POINT')) {
        const match = trimmed.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
          rawPoints = [{ lng: parseFloat(match[1]), lat: parseFloat(match[2]) }];
        }
      } else if (upper.startsWith('MULTIPOINT')) {
        const match = trimmed.match(/MULTIPOINT\s*\(([^)]+)\)/i);
        if (match) {
          rawPoints = match[1].split('),(').map((pt) => {
            const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
            return { lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
          });
        }
      } else if (upper.startsWith('LINESTRING') || upper.startsWith('LINE')) {
        const match = trimmed.match(/LINESTRING\s*\(([^)]+)\)/i);
        if (match) {
          rawPoints = match[1].split(',').map((pt) => {
            const parts = pt.trim().split(/\s+/);
            return { lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
          });
        }
      } else if (upper.startsWith('POLYGON')) {
        const match = trimmed.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
        if (match) {
          rawPoints = match[1].split(',').map((pt) => {
            const parts = pt.trim().split(/\s+/);
            return { lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
          });
          // Remove closing duplicate point for simplified vertices display
          if (
            rawPoints.length > 1 &&
            rawPoints[0].lng === rawPoints[rawPoints.length - 1].lng &&
            rawPoints[0].lat === rawPoints[rawPoints.length - 1].lat
          ) {
            rawPoints.pop();
          }
        }
      }

      // If converting to POINT from LINE/POLYGON, keep the first vertex (Đỉnh 1)
      if (type === 'POINT' && rawPoints.length > 1) {
        return [rawPoints[0]];
      }

      return rawPoints;
    } catch (e) {
      console.warn('Sai định dạng WKT:', wkt, e);
    }
    return [];
  };

  // Convert vertices list into WKT string
  const serializeVerticesToWkt = (pts: { lng: number; lat: number }[], geomType: string): string => {
    // Only serialize points that have both coordinates as valid numbers
    const validPts = pts.filter((p) => p && typeof p.lng === 'number' && typeof p.lat === 'number' && !isNaN(p.lng) && !isNaN(p.lat));
    if (validPts.length === 0) return '';
    const type = (geomType || 'POINT').toUpperCase();
    if (type === 'POINT' || validPts.length === 1) {
      return `POINT (${validPts[0].lng.toFixed(6)} ${validPts[0].lat.toFixed(6)})`;
    } else if (type === 'LINE') {
      const coords = validPts.map((p) => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(', ');
      return `LINESTRING (${coords})`;
    } else if (type === 'POLYGON') {
      if (validPts.length < 3) {
        const coords = validPts.map((p) => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(', ');
        return `LINESTRING (${coords})`;
      }
      const list = [...validPts];
      // Close the polygon by repeating the first vertex at the end
      if (list[0].lng !== list[list.length - 1].lng || list[0].lat !== list[list.length - 1].lat) {
        list.push(list[0]);
      }
      const coords = list.map((p) => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(', ');
      return `POLYGON ((${coords}))`;
    }
    return `POINT (${validPts[0].lng.toFixed(6)} ${validPts[0].lat.toFixed(6)})`;
  };

  // Trigger changes to form parent
  const triggerChange = useCallback(
    (newGeom: string, newWkt: string, newSym?: string) => {
      if (onChange) {
        onChange({
          geometryType: newGeom,
          coordinates: newWkt,
          symbolId: newSym,
        });
      }
    },
    [onChange]
  );

  // Synchronize WKT coordinates back to Leaflet Map layer
  const drawExistingShape = useCallback(() => {
    if (!leafletLoaded || !mapRef.current || !mapReady || isUpdatingFromMap.current) return;

    const L = (window as any).L;

    // Clear old layer
    if (drawnLayerRef.current) {
      mapRef.current.removeLayer(drawnLayerRef.current);
      drawnLayerRef.current = null;
    }

    // Only use coordinates that are valid numbers
    const validVertices = vertices.filter((v) => v && typeof v.lat === 'number' && typeof v.lng === 'number' && !isNaN(v.lat) && !isNaN(v.lng));
    if (validVertices.length === 0) return;

    try {
      let layer: any;

      if (internalGeom === 'POINT') {
        const coords = validVertices.map((v) => [v.lat, v.lng]);
        if (coords.length === 1) {
          layer = L.marker(coords[0], { draggable: !disabled });
          if (!disabled) {
            layer.on('dragend', () => {
              const pos = layer.getLatLng();
              const draggedPts = [{ lat: pos.lat, lng: pos.lng }];
              setVertices(draggedPts);
              const draggedWkt = serializeVerticesToWkt(draggedPts, 'POINT');
              setInternalToaDo(draggedWkt);
              triggerChange('POINT', draggedWkt, internalBieuTuongRef.current);
            });
          }
        } else {
          layer = L.layerGroup(coords.map((c: [number, number]) => L.marker(c, { draggable: !disabled })));
        }
      } else if (internalGeom === 'LINE') {
        const coords = validVertices.map((v) => [v.lat, v.lng]);
        if (validVertices.length === 1) {
          // Khi chỉ có 1 đỉnh (chuyển từ Point sang Line): vẫn vẽ Marker điểm xuất phát để người dùng thấy rõ vị trí
          layer = L.marker(coords[0], { draggable: !disabled });
          if (!disabled) {
            layer.on('dragend', () => {
              const pos = layer.getLatLng();
              const draggedPts = [{ lat: pos.lat, lng: pos.lng }];
              setVertices(draggedPts);
              const draggedWkt = serializeVerticesToWkt(draggedPts, 'LINE');
              setInternalToaDo(draggedWkt);
              triggerChange('LINE', draggedWkt, internalBieuTuongRef.current);
            });
          }
        } else {
          layer = L.polyline(coords, { color: colors.primary });
        }
      } else if (internalGeom === 'POLYGON') {
        const coords = validVertices.map((v) => [v.lat, v.lng]);
        if (validVertices.length === 1) {
          // Khi chỉ có 1 đỉnh: vẽ Marker điểm xuất phát
          layer = L.marker(coords[0], { draggable: !disabled });
          if (!disabled) {
            layer.on('dragend', () => {
              const pos = layer.getLatLng();
              const draggedPts = [{ lat: pos.lat, lng: pos.lng }];
              setVertices(draggedPts);
              const draggedWkt = serializeVerticesToWkt(draggedPts, 'POLYGON');
              setInternalToaDo(draggedWkt);
              triggerChange('POLYGON', draggedWkt, internalBieuTuongRef.current);
            });
          }
        } else if (validVertices.length === 2) {
          // Khi có 2 đỉnh: vẽ đường nối nét đứt thể hiện 2 đỉnh đã chọn
          layer = L.polyline(coords, { color: colors.primary, dashArray: '6, 6' });
        } else {
          layer = L.polygon(coords, { color: colors.primary, fillColor: colors.primary, fillOpacity: 0.2 });
        }
      }

      if (layer) {
        layer.addTo(mapRef.current);
        drawnLayerRef.current = layer;

        // Giữ nguyên mức zoom hiện tại của người dùng, không tự ý zoom in làm mất ngữ cảnh
        if (validVertices.length === 1) {
          mapRef.current.panTo([validVertices[0].lat, validVertices[0].lng]);
        } else if (layer.getBounds) {
          const bounds = layer.getBounds();
          if (bounds && bounds.isValid && bounds.isValid()) {
            mapRef.current.panTo(bounds.getCenter());
          }
        }

        // Bind update listeners only if not disabled
        if (!disabled) {
          if (typeof layer.pm?.enable === 'function') {
            try {
              layer.pm.enable({ allowSelfIntersection: false, hideMiddleMarkers: true });
            } catch {}
          }
          layer.on('pm:edit', () => syncLayerToWkt(layer));
          layer.on('pm:dragend', () => syncLayerToWkt(layer));
          layer.on('pm:markerdragend', () => syncLayerToWkt(layer));
          layer.on('pm:vertexadded', () => syncLayerToWkt(layer));
          layer.on('pm:vertexremoved', () => syncLayerToWkt(layer));
        }
      }
    } catch (err) {
      console.warn('Lỗi vẽ đè hình học lên bản đồ:', err);
    }
  }, [leafletLoaded, mapReady, vertices, internalGeom, disabled]);

  const initMap = useCallback((container: HTMLDivElement) => {
    if (!leafletLoaded || mapRef.current) return;

    const L = (window as any).L;
    const initialCenter = [16.0, 108.0]; // Centered on Vietnam
    
    mapRef.current = L.map(container, {
      zoomControl: true,
      attributionControl: false,
    }).setView(initialCenter, 6);

    // Add Base Map Tile Layer (Google Maps) with parallel subdomains and buffering optimizations
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=vi&gl=vn&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: '0123',
      attribution: '© Google Maps',
      keepBuffer: 4,
      updateWhenZooming: false,
      updateWhenIdle: true,
    }).addTo(mapRef.current);

    // Click on map to place or update point
    mapRef.current.on('click', (e: any) => {
      if (disabledRef.current) return;
      const { lat, lng } = e.latlng;
      const curGeom = (internalGeomRef.current || 'POINT').toUpperCase();

      if (curGeom === 'POINT') {
        const newPts = [{ lat, lng }];
        setVertices(newPts);
        const newWkt = serializeVerticesToWkt(newPts, 'POINT');
        setInternalToaDo(newWkt);
        triggerChange('POINT', newWkt, internalBieuTuongRef.current);

        if (drawnLayerRef.current) {
          mapRef.current.removeLayer(drawnLayerRef.current);
        }
        const newMarker = L.marker([lat, lng], { draggable: !disabledRef.current });
        newMarker.addTo(mapRef.current);
        drawnLayerRef.current = newMarker;

        newMarker.on('dragend', () => {
          if (disabledRef.current) return;
          const pos = newMarker.getLatLng();
          const draggedPts = [{ lat: pos.lat, lng: pos.lng }];
          setVertices(draggedPts);
          const draggedWkt = serializeVerticesToWkt(draggedPts, 'POINT');
          setInternalToaDo(draggedWkt);
          triggerChange('POINT', draggedWkt, internalBieuTuongRef.current);
        });
      } else if (curGeom === 'LINE' || curGeom === 'POLYGON') {
        if (disabledRef.current) return;
        setVertices((prev: { lng: number; lat: number }[]) => {
          const validNonZero = prev.filter(
            (p) => p && typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng) && (p.lat !== 0 || p.lng !== 0)
          );
          const next = [...validNonZero, { lat, lng }];
          const newWkt = serializeVerticesToWkt(next, curGeom);
          setInternalToaDo(newWkt);
          triggerChange(curGeom, newWkt, internalBieuTuongRef.current);
          return next;
        });
      }
    });

    // Handle drawing lifecycle events
    mapRef.current.on('pm:create', (e: any) => {
      if (disabledRef.current) return;
      const layer = e.layer;

      // Remove old drawn layer
      if (drawnLayerRef.current && drawnLayerRef.current !== layer) {
        mapRef.current.removeLayer(drawnLayerRef.current);
      }

      drawnLayerRef.current = layer;
      syncLayerToWkt(layer);

      // Disable draw mode after placing marker in POINT mode
      if (internalGeomRef.current === 'POINT' && mapRef.current?.pm) {
        try {
          mapRef.current.pm.disableDraw();
        } catch {}
      }

      // Bind update listeners on the new shape
      layer.on('pm:edit', () => syncLayerToWkt(layer));
      layer.on('pm:dragend', () => syncLayerToWkt(layer));
      layer.on('dragend', () => syncLayerToWkt(layer));
    });

    if (mapRef.current.pm) {
      if (typeof mapRef.current.pm.setGlobalOptions === 'function') {
        mapRef.current.pm.setGlobalOptions({ hideMiddleMarkers: true });
      }
      mapRef.current.pm.reenableMode = false;
    }
    mapRef.current.on('pm:remove', () => {
      if (disabledRef.current) return;
      drawnLayerRef.current = null;
      setVertices([]);
      setInternalToaDo('');
      triggerChange(internalGeomRef.current, '', internalBieuTuongRef.current);
    });

    // Trigger invalidateSize to ensure correct tile rendering in popup
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);

    setMapReady(true);
  }, [leafletLoaded]);

  // Callback ref to manage Leaflet container mounting
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      initMap(node);
    }
  }, [initMap]);

  // Cleanup map when component unmounts or non-inline modal is closed
  useEffect(() => {
    if (!modalOpen && !inline) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        drawnLayerRef.current = null;
      }
      setMapReady(false);
    }
  }, [modalOpen, inline]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        drawnLayerRef.current = null;
      }
    };
  }, []);

  // Synchronize Leaflet Map drawn shapes with WKT coordinates
  const syncLayerToWkt = (layer: any) => {
    if (isUpdatingFromMap.current) return;
    isUpdatingFromMap.current = true;

    let newWkt = '';
    let parsedPts: { lng: number; lat: number }[] = [];
    let detectedGeom = internalGeomRef.current || 'POINT';

    try {
      if (layer && typeof layer.getLatLng === 'function') {
        const latlng = layer.getLatLng();
        parsedPts = [{ lng: latlng.lng, lat: latlng.lat }];
        detectedGeom = 'POINT';
      } else if (layer && typeof layer.getLatLngs === 'function') {
        const latlngs = layer.getLatLngs();
        if (Array.isArray(latlngs) && Array.isArray(latlngs[0])) {
          // Polygon (or nested polygon rings)
          const ring = Array.isArray(latlngs[0][0]) ? latlngs[0][0] : latlngs[0];
          parsedPts = ring.map((l: any) => ({ lng: l.lng, lat: l.lat }));
          if (
            parsedPts.length > 1 &&
            parsedPts[0].lng === parsedPts[parsedPts.length - 1].lng &&
            parsedPts[0].lat === parsedPts[parsedPts.length - 1].lat
          ) {
            parsedPts.pop();
          }
          detectedGeom = 'POLYGON';
        } else if (Array.isArray(latlngs)) {
          // Polyline
          parsedPts = latlngs.map((l: any) => ({ lng: l.lng, lat: l.lat }));
          detectedGeom = 'LINE';
        }
      }
    } catch (e) {
      console.error('Lỗi phân tích đối tượng vẽ:', e);
    }

    newWkt = serializeVerticesToWkt(parsedPts, detectedGeom);
    setInternalGeom(detectedGeom);
    internalGeomRef.current = detectedGeom;
    setVertices(parsedPts);
    setInternalToaDo(newWkt);
    triggerChange(
      detectedGeom,
      newWkt,
      internalBieuTuongRef.current
    );

    isUpdatingFromMap.current = false;
  };

  // Synchronize WKT coordinates back to Leaflet Map layer
  useEffect(() => {
    drawExistingShape();
  }, [drawExistingShape, mapReady, modalOpen]);

  // Remove external drawing toolbar controls so clicking on the map directly continues and connects vertices seamlessly
  useEffect(() => {
    if (!leafletLoaded || !mapReady || !mapRef.current) return;

    const pm = mapRef.current.pm;
    if (pm && typeof pm.removeControls === 'function') {
      try {
        pm.removeControls();
      } catch (e) {
        console.error(e);
      }
    }
  }, [leafletLoaded, mapReady, disabled, modalOpen]);

  // Handle manual additions and updates to the vertices grid
  const handleVertexChange = (index: number, field: 'lng' | 'lat', val: number | null) => {
    if (val === null) return;
    const newPts = [...vertices];
    newPts[index] = { ...newPts[index], [field]: val };
    setVertices(newPts);

    const newWkt = serializeVerticesToWkt(newPts, internalGeom);
    setInternalToaDo(newWkt);
    triggerChange(internalGeom, newWkt, internalBieuTuongRef.current);
  };

  const addVertex = () => {
    const newPt = { lng: undefined as any, lat: undefined as any };
    const newPts = [...vertices, newPt];
    setVertices(newPts);

    const newWkt = serializeVerticesToWkt(newPts, internalGeom);
    setInternalToaDo(newWkt);
    triggerChange(internalGeom, newWkt, internalBieuTuongRef.current);
  };

  const removeVertex = (index: number) => {
    const newPts = vertices.filter((_, i) => i !== index);
    setVertices(newPts);

    const newWkt = serializeVerticesToWkt(newPts, internalGeom);
    setInternalToaDo(newWkt);
    triggerChange(internalGeom, newWkt, internalBieuTuongRef.current);
  };

  // Handle configuration changes
  const handleGeomTypeChange = (newGeom: string) => {
    setInternalGeom(newGeom);
    internalGeomRef.current = newGeom;

    let newPts = [...vertices];
    if (newGeom === 'POINT' && newPts.length > 1) {
      newPts = [newPts[0]];
    }

    setVertices(newPts);
    const newWkt = serializeVerticesToWkt(newPts, newGeom);
    setInternalToaDo(newWkt);
    triggerChange(newGeom, newWkt, internalBieuTuongRef.current);
  };

  const handleSymbolChange = (newSym: string) => {
    setInternalBieuTuong(newSym);
    triggerChange(internalGeom, internalToaDo, newSym);
  };

  const GEOM_TYPE_OPTIONS = [
    { value: 'POINT', label: 'Đối tượng điểm (Point)' },
    { value: 'LINE', label: 'Đối tượng đường (Line)' },
    { value: 'POLYGON', label: 'Đối tượng vùng (Polygon)' },
  ];

  const pointsCount = vertices.length;

  const mapContent = (
    <div style={{ padding: inline ? 0 : '12px 0 0 0' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={13}>
          <div style={{ position: 'relative' }}>
            <div
              ref={mapContainerRef}
              style={{
                height,
                width: '100%',
                borderRadius: 8,
                border: `1px solid ${colors.borderBase}`,
                overflow: 'hidden',
                zIndex: 1,
              }}
            />
            {!leafletLoaded && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  borderRadius: 8,
                }}
              >
                <Space>
                  <CompassOutlined spin style={{ fontSize: 24, color: colors.primary }} />
                  <Typography.Text type="secondary">Đang tải bản đồ không gian...</Typography.Text>
                </Space>
              </div>
            )}
          </div>
        </Col>

        <Col xs={24} md={11}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Typography.Text strong style={{ fontSize: 13 }}>
                  TỌA ĐỘ CÁC ĐIỂM ĐỈNH ({vertices.length})
                </Typography.Text>
                {!disabled && internalGeom !== 'POINT' && (
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addVertex}
                  >
                    Thêm điểm
                  </Button>
                )}
              </div>

              {vertices.length === 0 ? (
                <div
                  style={{
                    padding: '24px 0',
                    textAlign: 'center',
                    border: `1px dashed ${colors.borderBase}`,
                    borderRadius: 8,
                  }}
                >
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    Chưa có tọa độ nào. Nhấp vào bản đồ hoặc nút "Thêm điểm" để bắt đầu.
                  </Typography.Text>
                </div>
              ) : (
                <Table
                  dataSource={vertices.map((v, i) => ({ key: i, ...v }))}
                  pagination={false}
                  size="small"
                  bordered
                  tableLayout="fixed"
                  scroll={{ y: height - 80 }}
                  onRow={(_, index) => ({
                    draggable: !disabled && internalGeom !== 'POINT',
                    style: { cursor: !disabled && internalGeom !== 'POINT' ? 'grab' : 'default' },
                    onDragStart: (e) => {
                      if (disabled) return;
                      e.dataTransfer.setData('text/plain', index!.toString());
                    },
                    onDragOver: (e) => {
                      if (disabled) return;
                      e.preventDefault();
                    },
                    onDrop: (e) => {
                      if (disabled) return;
                      e.preventDefault();
                      const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                      const hoverIndex = index!;
                      if (isNaN(dragIndex) || dragIndex === hoverIndex) return;

                      const newPts = [...vertices];
                      const temp = newPts[dragIndex];
                      newPts[dragIndex] = newPts[hoverIndex];
                      newPts[hoverIndex] = temp;
                      setVertices(newPts);

                      const newWkt = serializeVerticesToWkt(newPts, internalGeom);
                      setInternalToaDo(newWkt);
                      triggerChange(internalGeom, newWkt, internalBieuTuong);
                    }
                  })}
                  columns={[
                    {
                      title: 'STT',
                      key: 'index',
                      width: 46,
                      align: 'center',
                      render: (_, __, i) => (
                        <Space size={2}>
                          {!disabled && internalGeom !== 'POINT' && (
                            <HolderOutlined style={{ cursor: 'grab', color: '#bfbfbf' }} />
                          )}
                          <span>{i + 1}</span>
                        </Space>
                      ),
                    },
                    {
                      title: 'Vĩ độ (N) *',
                      dataIndex: 'lat',
                      key: 'lat',
                      render: (val, _, i) => (
                        <DmsInput
                          value={val}
                          disabled={disabled}
                          onChange={(v) => handleVertexChange(i, 'lat', v)}
                          placeholderPrefix="Vĩ độ"
                        />
                      ),
                    },
                    {
                      title: 'Kinh độ (E) *',
                      dataIndex: 'lng',
                      key: 'lng',
                      render: (val, _, i) => (
                        <DmsInput
                          value={val}
                          disabled={disabled}
                          onChange={(v) => handleVertexChange(i, 'lng', v)}
                          placeholderPrefix="Kinh độ"
                        />
                      ),
                    },
                    ...((!disabled && internalGeom !== 'POINT')
                      ? [
                          {
                            title: '',
                            key: 'actions',
                            width: 40,
                            align: 'center' as const,
                            render: (_: any, __: any, i: number) => (
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => removeVertex(i)}
                              />
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  if (inline) {
    return mapContent;
  }

  return (
    <>
      <Card styles={{ body: { padding: 12 } }} style={{ border: `1px solid ${colors.borderBase}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Space size="middle" align="center" wrap>
            <Typography.Text strong>Loại đối tượng GIS:</Typography.Text>
            <Select
              value={internalGeom || 'POINT'}
              onChange={handleGeomTypeChange}
              disabled={disabled}
              options={GEOM_TYPE_OPTIONS}
              style={{ width: 200 }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {`Đã xác định ${pointsCount} điểm tọa độ.`}
            </Typography.Text>
          </Space>
          <Button
            type="primary"
            ghost
            icon={<EnvironmentOutlined />}
            disabled={disabled}
            onClick={() => setModalOpen(true)}
          >
            Chọn vị trí trên bản đồ
          </Button>
        </div>
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: colors.primary }} />
            <span>Thiết lập Vị trí & Tọa độ trên Bản đồ chuyên dụng</span>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        width="96vw"
        style={{ top: 12, maxWidth: '1600px' }}
        footer={[
          <Button key="close" type="primary" onClick={() => setModalOpen(false)}>
            Xác nhận & Đóng
          </Button>
        ]}
      >
        {mapContent}
      </Modal>
    </>
  );
}
