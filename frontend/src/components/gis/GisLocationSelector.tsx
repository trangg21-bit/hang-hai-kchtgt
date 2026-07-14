import { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Select, Table, InputNumber, Button, Space, Card, Row, Col, Typography, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, CompassOutlined, EnvironmentOutlined, HolderOutlined } from '@ant-design/icons';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import { colors } from '../../theme';

interface GisLocationSelectorValue {
  loaiHinhHoc: string;
  toaDo: string;
  bieuTuongId?: string;
}

interface GisLocationSelectorProps {
  value?: GisLocationSelectorValue;
  onChange?: (value: GisLocationSelectorValue) => void;
  defaultGeometryType?: 'POINT' | 'LINE' | 'POLYGON';
  height?: number;
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
}

function DmsInput({ value, onChange, placeholderPrefix }: DmsInputProps) {
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
    <div style={{ display: 'flex', gap: '2px', width: '255px', minWidth: '255px', alignItems: 'center' }}>
      <Space.Compact size="small" style={{ width: '75px' }}>
        <InputNumber
          value={d}
          onChange={handleDChange}
          placeholder="Độ"
          style={{ width: '100%' }}
          controls={false}
        />
        <div style={{
          padding: '0 6px',
          background: '#f5f5f5',
          border: '1px solid #d9d9d9',
          borderLeft: 'none',
          display: 'flex',
          alignItems: 'center',
          color: 'rgba(0, 0, 0, 0.45)'
        }}>°</div>
      </Space.Compact>
      <Space.Compact size="small" style={{ width: '75px' }}>
        <InputNumber
          value={m}
          onChange={handleMChange}
          min={0}
          max={59}
          placeholder="Phút"
          style={{ width: '100%' }}
          controls={false}
        />
        <div style={{
          padding: '0 6px',
          background: '#f5f5f5',
          border: '1px solid #d9d9d9',
          borderLeft: 'none',
          display: 'flex',
          alignItems: 'center',
          color: 'rgba(0, 0, 0, 0.45)'
        }}>'</div>
      </Space.Compact>
      <Space.Compact size="small" style={{ width: '90px' }}>
        <InputNumber
          value={s}
          onChange={handleSChange}
          min={0}
          max={59.9999}
          step={0.01}
          placeholder="Giây"
          style={{ width: '100%' }}
          controls={false}
        />
        <div style={{
          padding: '0 6px',
          background: '#f5f5f5',
          border: '1px solid #d9d9d9',
          borderLeft: 'none',
          display: 'flex',
          alignItems: 'center',
          color: 'rgba(0, 0, 0, 0.45)'
        }}>"</div>
      </Space.Compact>
    </div>
  );
}

export default function GisLocationSelector({
  value = { loaiHinhHoc: undefined, toaDo: '' },
  onChange,
  defaultGeometryType,
  height = 550,
}: GisLocationSelectorProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
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

  useEffect(() => {
    internalGeomRef.current = internalGeom;
    internalBieuTuongRef.current = internalBieuTuong;
  }, [internalGeom, internalBieuTuong]);

  // Auto trigger map resize when modal opens to prevent grey area issues
  useEffect(() => {
    if (modalOpen && mapRef.current) {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 300);
    }
  }, [modalOpen]);

  // Sync internal state with incoming props value
  useEffect(() => {
    const geometryType = defaultGeometryType || value.loaiHinhHoc;
    const toaDo = value.toaDo || '';
    const bieuTuongId = value.bieuTuongId;

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
  }, [value.loaiHinhHoc, value.toaDo, value.bieuTuongId, defaultGeometryType]);

  // Load symbols list
  useEffect(() => {
    (async () => {
      try {
        const res = await symbolService.list({ pageSize: 100 });
        setSymbols(res.data || []);
      } catch (err) {
        console.error('Không thể tải danh sách biểu tượng bản đồ', err);
      }
    })();
  }, []);

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

  // Parse WKT string into vertices list
  const parseWktToVertices = (wkt: string, geomType: string): { lng: number; lat: number }[] => {
    if (!wkt) return [];
    try {
      const type = geomType.toUpperCase();
      if (type === 'POINT' && wkt.startsWith('POINT(')) {
        const match = wkt.match(/POINT\(([^)]+)\)/);
        if (match) {
          const parts = match[1].split(' ');
          return [{ lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) }];
        }
      } else if (type === 'LINE' && wkt.startsWith('LINESTRING(')) {
        const match = wkt.match(/LINESTRING\(([^)]+)\)/);
        if (match) {
          return match[1].split(',').map((pt) => {
            const parts = pt.trim().split(' ');
            return { lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
          });
        }
      } else if (type === 'POLYGON' && wkt.startsWith('POLYGON((')) {
        const match = wkt.match(/POLYGON\(\(([^)]+)\)\)/);
        if (match) {
          const pts = match[1].split(',').map((pt) => {
            const parts = pt.trim().split(' ');
            return { lng: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
          });
          // Remove closing duplicate point for simplified vertices display
          if (
            pts.length > 1 &&
            pts[0].lng === pts[pts.length - 1].lng &&
            pts[0].lat === pts[pts.length - 1].lat
          ) {
            pts.pop();
          }
          return pts;
        }
      }
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
    const type = geomType.toUpperCase();
    if (type === 'POINT') {
      return `POINT(${validPts[0].lng.toFixed(6)} ${validPts[0].lat.toFixed(6)})`;
    } else if (type === 'LINE') {
      const coords = validPts.map((p) => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(', ');
      return `LINESTRING(${coords})`;
    } else if (type === 'POLYGON') {
      if (validPts.length < 3) return '';
      const list = [...validPts];
      // Close the polygon by repeating the first vertex at the end
      list.push(validPts[0]);
      const coords = list.map((p) => `${p.lng.toFixed(6)} ${p.lat.toFixed(6)}`).join(', ');
      return `POLYGON((${coords}))`;
    }
    return '';
  };

  // Trigger changes to form parent
  const triggerChange = useCallback(
    (newGeom: string, newWkt: string, newSym?: string) => {
      if (onChange) {
        onChange({
          loaiHinhHoc: newGeom,
          toaDo: newWkt,
          bieuTuongId: newSym,
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
        layer = L.marker([validVertices[0].lat, validVertices[0].lng]);
      } else if (internalGeom === 'LINE') {
        if (validVertices.length < 2) return; // Polyline needs at least 2 points to draw
        const coords = validVertices.map((v) => [v.lat, v.lng]);
        layer = L.polyline(coords, { color: colors.primary });
      } else if (internalGeom === 'POLYGON') {
        if (validVertices.length < 3) return; // Polygon needs at least 3 points to draw
        const coords = validVertices.map((v) => [v.lat, v.lng]);
        layer = L.polygon(coords, { color: colors.primary, fillColor: colors.primary, fillOpacity: 0.2 });
      }

      if (layer) {
        layer.addTo(mapRef.current);
        drawnLayerRef.current = layer;

        // Auto center map on the shape
        if (internalGeom === 'POINT') {
          mapRef.current.setView([validVertices[0].lat, validVertices[0].lng], 15);
        } else {
          mapRef.current.fitBounds(layer.getBounds(), { padding: [20, 20] });
        }

        // Bind update listeners
        layer.on('pm:edit', () => syncLayerToWkt(layer));
        layer.on('pm:dragend', () => syncLayerToWkt(layer));
      }
    } catch (err) {
      console.warn('Lỗi vẽ đè hình học lên bản đồ:', err);
    }
  }, [leafletLoaded, mapReady, vertices, internalGeom]);

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

    // Handle drawing lifecycle events
    mapRef.current.on('pm:create', (e: any) => {
      const layer = e.layer;

      // Remove old drawn layer
      if (drawnLayerRef.current) {
        mapRef.current.removeLayer(drawnLayerRef.current);
      }

      drawnLayerRef.current = layer;
      syncLayerToWkt(layer);

      // Bind update listeners on the new shape
      layer.on('pm:edit', () => syncLayerToWkt(layer));
      layer.on('pm:dragend', () => syncLayerToWkt(layer));
    });

    mapRef.current.pm.reenableMode = false;
    mapRef.current.on('pm:remove', () => {
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

  // Cleanup map when modal is closed
  useEffect(() => {
    if (!modalOpen) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        drawnLayerRef.current = null;
      }
      setMapReady(false);
    }
  }, [modalOpen]);

  // Synchronize Leaflet Map drawn shapes with WKT coordinates
  const syncLayerToWkt = (layer: any) => {
    if (isUpdatingFromMap.current) return;
    isUpdatingFromMap.current = true;

    const L = (window as any).L;
    let newWkt = '';
    let parsedPts: { lng: number; lat: number }[] = [];

    try {
      if (layer instanceof L.Marker) {
        const latlng = layer.getLatLng();
        parsedPts = [{ lng: latlng.lng, lat: latlng.lat }];
        newWkt = serializeVerticesToWkt(parsedPts, 'POINT');
        setInternalGeom('POINT');
      } else if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0];
        parsedPts = latlngs.map((l: any) => ({ lng: l.lng, lat: l.lat }));
        newWkt = serializeVerticesToWkt(parsedPts, 'POLYGON');
        setInternalGeom('POLYGON');
      } else if (layer instanceof L.Polyline) {
        const latlngs = layer.getLatLngs();
        parsedPts = latlngs.map((l: any) => ({ lng: l.lng, lat: l.lat }));
        newWkt = serializeVerticesToWkt(parsedPts, 'LINE');
        setInternalGeom('LINE');
      }
    } catch (e) {
      console.error('Lỗi phân tích đối tượng vẽ:', e);
    }

    setVertices(parsedPts);
    setInternalToaDo(newWkt);
    triggerChange(
      layer instanceof L.Marker ? 'POINT' : (layer instanceof L.Polygon ? 'POLYGON' : 'LINE'),
      newWkt,
      internalBieuTuongRef.current
    );

    isUpdatingFromMap.current = false;
  };

  // Synchronize WKT coordinates back to Leaflet Map layer
  useEffect(() => {
    drawExistingShape();
  }, [drawExistingShape, mapReady, modalOpen]);

  // Dynamically configure drawing toolbar based on active geometry type selected outside
  useEffect(() => {
    if (!leafletLoaded || !mapReady || !mapRef.current) return;

    mapRef.current.pm.addControls({
      position: 'topleft',
      drawMarker: internalGeom === 'POINT',
      drawPolyline: internalGeom === 'LINE',
      drawPolygon: internalGeom === 'POLYGON',
      drawCircle: false,
      drawRectangle: false,
      drawCircleMarker: false,
      drawText: false,
      editMode: false,
      dragMode: false,
      cutPolygon: false,
      removalMode: false,
      rotateMode: false,
    });
  }, [leafletLoaded, mapReady, internalGeom, modalOpen]);

  // Handle manual additions and updates to the vertices grid
  const handleVertexChange = (index: number, field: 'lng' | 'lat', val: number | null) => {
    if (val === null) return;
    const newPts = [...vertices];
    newPts[index] = { ...newPts[index], [field]: val };
    setVertices(newPts);

    const newWkt = serializeVerticesToWkt(newPts, internalGeom);
    setInternalToaDo(newWkt);
    triggerChange(internalGeom, newWkt, internalBieuTuong);
  };

  const addVertex = () => {
    const newPt = { lng: undefined as any, lat: undefined as any };
    const newPts = [...vertices, newPt];
    setVertices(newPts);

    const newWkt = serializeVerticesToWkt(newPts, internalGeom);
    setInternalToaDo(newWkt);
    triggerChange(internalGeom, newWkt, internalBieuTuong);
  };

  const removeVertex = (index: number) => {
    const newPts = vertices.filter((_, i) => i !== index);
    setVertices(newPts);

    const newWkt = serializeVerticesToWkt(newPts, internalGeom);
    setInternalToaDo(newWkt);
    triggerChange(internalGeom, newWkt, internalBieuTuong);
  };



  // Handle configuration changes
  const handleGeomTypeChange = (newGeom: string) => {
    setInternalGeom(newGeom);
    setVertices([]);
    setInternalToaDo('');
    triggerChange(newGeom, '', internalBieuTuong);
  };

  const handleSymbolChange = (newSym: string) => {
    setInternalBieuTuong(newSym);
    triggerChange(internalGeom, internalToaDo, newSym);
  };

  const geomText = !internalGeom
    ? 'Chưa xác định'
    : internalGeom === 'POINT'
      ? 'Đối tượng điểm'
      : internalGeom === 'LINE'
        ? 'Đối tượng đường'
        : 'Đối tượng vùng';
  const pointsCount = vertices.length;

  return (
    <>
      <Card styles={{ body: { padding: 12 } }} style={{ border: `1px solid ${colors.borderBase}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Space orientation="vertical" size={2}>
            <Typography.Text strong>Vị trí địa lý (GIS): {geomText}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {!internalGeom
                ? 'Vui lòng chọn Loại đối tượng ở trên để bắt đầu định vị.'
                : `Đã xác định ${pointsCount} điểm tọa độ định vị.`
              }
            </Typography.Text>
          </Space>
          <Button
            type="primary"
            ghost
            icon={<EnvironmentOutlined />}
            disabled={!internalGeom}
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
        <div style={{ padding: '12px 0 0 0' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
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

            <Col xs={24} md={10}>
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>


                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Typography.Text strong style={{ fontSize: 13 }}>
                      TỌA ĐỘ CÁC ĐIỂM ĐỈNH
                    </Typography.Text>
                    {internalGeom !== 'POINT' && (
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
                      scroll={{ x: 680, y: 220 }}
                      onRow={(_, index) => ({
                        draggable: internalGeom !== 'POINT',
                        style: { cursor: internalGeom !== 'POINT' ? 'grab' : 'default' },
                        onDragStart: (e) => {
                          e.dataTransfer.setData('text/plain', index!.toString());
                        },
                        onDragOver: (e) => {
                          e.preventDefault();
                        },
                        onDrop: (e) => {
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
                          width: 70,
                          align: 'center',
                          render: (_, __, i) => (
                            <Space size={4}>
                              {internalGeom !== 'POINT' && (
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
                          width: 280,
                          render: (val, _, i) => (
                            <DmsInput
                              value={val}
                              onChange={(v) => handleVertexChange(i, 'lat', v)}
                              placeholderPrefix="Vĩ độ"
                            />
                          ),
                        },
                        {
                          title: 'Kinh độ (E) *',
                          dataIndex: 'lng',
                          key: 'lng',
                          width: 280,
                          render: (val, _, i) => (
                            <DmsInput
                              value={val}
                              onChange={(v) => handleVertexChange(i, 'lng', v)}
                              placeholderPrefix="Kinh độ"
                            />
                          ),
                        },
                        {
                          title: '',
                          key: 'actions',
                          width: 50,
                          align: 'center',
                          render: (_, __, i) =>
                            internalGeom !== 'POINT' ? (
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => removeVertex(i)}
                              />
                            ) : null,
                        },
                      ]}
                    />
                  )}
                </div>
              </Space>
            </Col>
          </Row>
        </div>
      </Modal>
    </>
  );
}
