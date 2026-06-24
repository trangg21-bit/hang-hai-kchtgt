import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Space,
  Typography,
  Button,
  Select,
  Form,
  Input,
  InputNumber,
  Tag,
  Radio,
  Tabs,
  Upload,
  Divider,
  List,
  Collapse,
} from 'antd';
import {
  CompassOutlined,
  UploadOutlined,
  ReloadOutlined,
  FilterOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { chartService } from '../../services/chartService';
import type { ChartCell, ChartFeature } from '../../services/chartService';
import toast from '../../components/ToastNotification';
import EmptyState from '../../components/EmptyState';

declare global {
  interface Window {
    L: any;
  }
}

export default function GISChartView() {
  const [loading, setLoading] = useState(false);
  const [cells, setCells] = useState<ChartCell[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<string | undefined>();
  const [palette, setPalette] = useState<string>('DAY');
  const [features, setFeatures] = useState<ChartFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<ChartFeature | null>(null);

  // Coordinate Calibrator State
  const [calibrationForm] = Form.useForm();
  const [calibrating, setCalibrating] = useState(false);
  const [calibratedPoint, setCalibratedPoint] = useState<{ lon: number; lat: number } | null>(null);

  // Map elements refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geoJsonGroupRef = useRef<any>(null);
  const calibratorMarkerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // 1. Dynamic Leaflet Loader
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // Clean up script tags if needed
    };
  }, []);

  // 2. Fetch Chart Cells
  const fetchCells = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chartService.getAllCells();
      setCells(data);
      if (data.length > 0 && !selectedCellId) {
        setSelectedCellId(data[0].id);
      }
    } catch {
      toast.error('Không thể tải danh sách cell hải đồ');
    } finally {
      setLoading(false);
    }
  }, [selectedCellId]);

  useEffect(() => {
    void fetchCells();
  }, [fetchCells]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return;

    const L = window.L;
    // Create map centered on Hai Phong / East Sea area
    const map = L.map(mapContainerRef.current).setView([20.6669, 106.8123], 11);
    mapRef.current = map;

    // Standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Feature group for vector charts
    geoJsonGroupRef.current = L.featureGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // 4. Render S-57 Features onto Leaflet using S-52 Styling
  const renderChartFeatures = useCallback(() => {
    const L = window.L;
    if (!L || !mapRef.current || !geoJsonGroupRef.current) return;

    // Clear previous vector layers
    geoJsonGroupRef.current.clearLayers();

    if (features.length === 0) return;

    features.forEach((feature) => {
      const { geometryType, coordinates, s52Style, featureName, featureCode } = feature;
      const { fillColor, strokeColor, strokeWidth, strokeDashArray, iconSymbol, fillOpacity } = s52Style;

      // Basic S-52 SVG icons for specific symbols
      let iconMarkup = '';
      if (iconSymbol === 'special-buoy') {
        iconMarkup = `<svg viewBox="0 0 24 24" width="24" height="24"><polygon points="12,2 22,20 2,20" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/><circle cx="12" cy="14" r="3" fill="#000"/></svg>`;
      } else if (iconSymbol === 'lighthouse-beacon') {
        iconMarkup = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2 L8 22 L16 22 Z" fill="#999" stroke="${strokeColor}" stroke-width="2"/><circle cx="12" cy="7" r="5" fill="${fillColor}"/><path d="M12 7 L24 7 M12 7 L0 7" stroke="${fillColor}" stroke-width="1.5" stroke-dasharray="2,2"/></svg>`;
      } else {
        iconMarkup = `<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="6" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
      }

      const customIcon = L.divIcon({
        html: iconMarkup,
        className: 's52-custom-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Parse WKT (Well-Known Text) representation to Leaflet layer
      try {
        let layer: any = null;

        if (geometryType === 'POINT') {
          // Extract POINT(lon lat)
          const match = coordinates.match(/POINT\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)/i);
          if (match) {
            const lon = parseFloat(match[1]);
            const lat = parseFloat(match[2]);
            layer = L.marker([lat, lon], { icon: customIcon });
          }
        } else if (geometryType === 'LINE') {
          // Extract LINESTRING(lon lat, lon lat, ...)
          const coordsStr = coordinates.replace(/LINESTRING\s*\(/i, '').replace(/\)/, '');
          const points = coordsStr.split(',').map((pStr: string) => {
            const parts = pStr.trim().split(/\s+/);
            return [parseFloat(parts[1]), parseFloat(parts[0])]; // lat, lon
          });
          layer = L.polyline(points, {
            color: strokeColor,
            weight: strokeWidth,
            dashArray: strokeDashArray,
          });
        } else if (geometryType === 'POLYGON') {
          // Extract POLYGON((lon lat, lon lat, ...))
          const coordsStr = coordinates.replace(/POLYGON\s*\(\s*\(/i, '').replace(/\)\s*\)/, '');
          const points = coordsStr.split(',').map((pStr: string) => {
            const parts = pStr.trim().split(/\s+/);
            return [parseFloat(parts[1]), parseFloat(parts[0])]; // lat, lon
          });
          layer = L.polygon(points, {
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            color: strokeColor,
            weight: strokeWidth,
            dashArray: strokeDashArray,
          });
        }

        if (layer) {
          // Popups with S-57 tags
          layer.bindPopup(`
            <strong>${featureName || featureCode}</strong><br/>
            Mã S-57: <code>${featureCode}</code><br/>
            Hình học: <code>${geometryType}</code>
          `);
          layer.on('click', () => setSelectedFeature(feature));
          geoJsonGroupRef.current.addLayer(layer);
        }
      } catch (err) {
        // silently skip geometries that fail to parse
      }
    });

    // Zoom map to fit cell features bounds
    try {
      const bounds = geoJsonGroupRef.current.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch {
      // skip zooming
    }
  }, [features]);

  // 5. Load features when cell or palette changes
  useEffect(() => {
    if (!selectedCellId) return;

    (async () => {
      try {
        const data = await chartService.getS52StyledFeatures(selectedCellId, palette);
        setFeatures(data);
      } catch {
        toast.error('Không thể tải các đối tượng của hải đồ');
      }
    })();
  }, [selectedCellId, palette]);

  useEffect(() => {
    if (leafletLoaded && features.length > 0) {
      renderChartFeatures();
    }
  }, [leafletLoaded, features, renderChartFeatures]);

  // 6. Coordinate Calibration Form Submission
  const handleCalibrate = useCallback(async () => {
    try {
      const values = await calibrationForm.validateFields();
      setCalibrating(true);
      
      const payload = {
        systemType: values.systemType,
        coord1: values.coord1,
        coord2: values.coord2,
        zoneOrCm: values.zoneOrCm,
        dx: values.dx || 0.0,
        dy: values.dy || 0.0,
      };

      const result = await chartService.calibrate(payload);
      if (result.valid) {
        setCalibratedPoint({ lon: result.longitude, lat: result.latitude });
        toast.success('Đã hiệu chỉnh tọa độ thành công sang WGS84');
        
        // Render Marker on Map
        const L = window.L;
        if (L && mapRef.current) {
          if (calibratorMarkerRef.current) {
            mapRef.current.removeLayer(calibratorMarkerRef.current);
          }
          
          calibratorMarkerRef.current = L.marker([result.latitude, result.longitude], {
            icon: L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              shadowSize: [41, 41],
            })
          })
            .addTo(mapRef.current)
            .bindPopup(`
              <strong>Tọa độ hiệu chỉnh (WGS84)</strong><br/>
              Kinh độ: ${result.longitude.toFixed(6)}°<br/>
              Vĩ độ: ${result.latitude.toFixed(6)}°<br/>
              Gốc: ${values.systemType} [X: ${values.coord1}, Y: ${values.coord2}]
            `)
            .openPopup();

          mapRef.current.setView([result.latitude, result.longitude], 13);
        }
      } else {
        toast.error(result.errorMessage || 'Tọa độ không hợp lệ');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Hiệu chỉnh thất bại');
    } finally {
      setCalibrating(false);
    }
  }, [calibrationForm]);

  // 7. File uploads for importing
  const handleUploadS57 = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      await chartService.importS57(file);
      toast.success(`Đã nhập hải đồ S-57 "${file.name}" thành công`);
      onSuccess(null, file);
      void fetchCells();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Nhập hải đồ S-57 thất bại');
      onError(err);
    }
  };

  const handleUploadS63 = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      await chartService.importS63(file);
      toast.success(`Đã nhập hải đồ bảo mật S-63 "${file.name}" thành công`);
      onSuccess(null, file);
      void fetchCells();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Giải mã hoặc nhập hải đồ S-63 thất bại');
      onError(err);
    }
  };

  return (
    <div style={{ padding: '0px' }}>
      <Row gutter={[16, 16]}>
        {/* Main Map Viewer */}
        <Col xs={24} lg={17}>
          <Card
            title={
              <Space>
                <CompassOutlined style={{ color: '#1890ff' }} />
                <span>Bản đồ tích hợp hải đồ S-57/S-63 (S-52 display)</span>
              </Space>
            }
            extra={
              <Space>
                <Radio.Group value={palette} onChange={(e) => setPalette(e.target.value)} size="small">
                  <Radio.Button value="DAY">DAY (Ngày)</Radio.Button>
                  <Radio.Button value="DUSK">DUSK (Hoàng hôn)</Radio.Button>
                  <Radio.Button value="NIGHT">NIGHT (Đêm)</Radio.Button>
                </Radio.Group>
                <Button size="small" icon={<ReloadOutlined />} onClick={fetchCells} />
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            {/* The Map Div */}
            <div
              ref={mapContainerRef}
              id="leaflet-map-container"
              style={{
                height: '620px',
                width: '100%',
                backgroundColor: palette === 'NIGHT' ? '#110000' : '#f0f2f5',
                filter: palette === 'NIGHT' ? 'brightness(0.85) contrast(1.1)' : 'none',
              }}
            />
          </Card>
        </Col>

        {/* Sidebar panels */}
        <Col xs={24} lg={7}>
          <Tabs
            defaultActiveKey="1"
            type="card"
            items={[
              {
                key: '1',
                label: 'Hải đồ & Lớp',
                children: (
                  <Card bordered={false}>
                    <Form layout="vertical">
                      <Form.Item label="Chọn Hải đồ hoạt động">
                        <Select
                          placeholder="Chọn cell hải đồ..."
                          value={selectedCellId}
                          onChange={(val) => { setSelectedCellId(val); setSelectedFeature(null); }}
                          loading={loading}
                          options={cells.map((c) => ({
                            value: c.id,
                            label: `${c.cellName} (${c.isEncrypted ? 'S-63' : 'S-57'}) - Quy mô: 1:${c.scale}`,
                          }))}
                        />
                      </Form.Item>
                    </Form>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* Selected Feature Inspector */}
                    {selectedFeature ? (
                      <div>
                        <Typography.Title level={5} style={{ marginBottom: 8 }}>
                          <InfoCircleOutlined /> Chi tiết đối tượng
                        </Typography.Title>
                        <DescriptionsPanel feature={selectedFeature} />
                      </div>
                    ) : (
                      <EmptyState description="Click vào một đối tượng trên bản đồ để xem thông tin thuộc tính S-57." />
                    )}
                  </Card>
                ),
              },
              {
                key: '2',
                label: 'Hiệu chỉnh tọa độ',
                children: (
                  <Card bordered={false}>
                    <Form form={calibrationForm} layout="vertical" onFinish={handleCalibrate} initialValues={{ systemType: 'VN2000', dx: 0, dy: 0 }}>
                      <Form.Item name="systemType" label="Hệ tọa độ nguồn" rules={[{ required: true }]}>
                        <Radio.Group style={{ width: '100%' }}>
                          <Radio.Button value="VN2000" style={{ width: '33.3%' }}>VN-2000</Radio.Button>
                          <Radio.Button value="UTM" style={{ width: '33.3%' }}>UTM</Radio.Button>
                          <Radio.Button value="WGS84" style={{ width: '33.4%' }}>WGS84</Radio.Button>
                        </Radio.Group>
                      </Form.Item>

                      <Form.Item noStyle shouldUpdate={(prev, curr) => prev.systemType !== curr.systemType}>
                        {({ getFieldValue }) => {
                          const type = getFieldValue('systemType');
                          return (
                            <>
                              <Form.Item
                                name="coord1"
                                label={type === 'WGS84' ? 'Kinh độ (Decimal / DMS / DDM)' : 'Tọa độ X (Easting)'}
                                rules={[{ required: true, message: 'Vui lòng điền tọa độ 1' }]}
                              >
                                <Input placeholder={type === 'WGS84' ? 'Ví dụ: 106°37\'46" E' : 'Ví dụ: 568390.0'} />
                              </Form.Item>

                              <Form.Item
                                name="coord2"
                                label={type === 'WGS84' ? 'Vĩ độ (Decimal / DMS / DDM)' : 'Tọa độ Y (Northing)'}
                                rules={[{ required: true, message: 'Vui lòng điền tọa độ 2' }]}
                              >
                                <Input placeholder={type === 'WGS84' ? 'Ví dụ: 20°40\'0" N' : 'Ví dụ: 2322890.0'} />
                              </Form.Item>

                              {type !== 'WGS84' && (
                                <Form.Item
                                  name="zoneOrCm"
                                  label={type === 'VN2000' ? 'Kinh tuyến trục (Central Meridian)' : 'Múi chiếu (UTM Zone)'}
                                  rules={[{ required: true, message: 'Vui lòng chọn múi/kinh tuyến trục' }]}
                                >
                                  <Input placeholder={type === 'VN2000' ? 'Ví dụ: 105.0 hoặc 108.5' : 'Ví dụ: 48N'} />
                                </Form.Item>
                              )}
                            </>
                          );
                        }}
                      </Form.Item>

                      <Collapse size="small" bordered={false} style={{ marginBottom: 16 }}>
                        <Collapse.Panel header="Sai số hiệu chuẩn (Calibration offset)" key="1">
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item name="dx" label="Độ lệch dX (m / deg)">
                                <InputNumber style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="dy" label="Độ lệch dY (m / deg)">
                                <InputNumber style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Collapse.Panel>
                      </Collapse>

                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<GlobalOutlined />}
                          loading={calibrating}
                          style={{ width: '100%' }}
                        >
                          Hiệu chuẩn & Chuyển WGS84
                        </Button>
                      </Form.Item>
                    </Form>

                    {calibratedPoint && (
                      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                        <Typography.Text strong>Kết quả hiệu chuẩn (EPSG:4326):</Typography.Text><br/>
                        <Typography.Text>Kinh độ: <code>{calibratedPoint.lon.toFixed(7)}°</code></Typography.Text><br/>
                        <Typography.Text>Vĩ độ: <code>{calibratedPoint.lat.toFixed(7)}°</code></Typography.Text>
                      </div>
                    )}
                  </Card>
                ),
              },
              {
                key: '3',
                label: 'Nhập hải đồ',
                children: (
                  <Card bordered={false}>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Card size="small" title="Nhập hải đồ thường (S-57)" style={{ width: '100%' }}>
                        <Typography.Paragraph type="secondary" style={{ fontSize: '13px' }}>
                          Tải lên file hải đồ định dạng tiêu chuẩn S-57 (`.000`). Hệ thống sẽ tự động phân tích và trích xuất các đối tượng.
                        </Typography.Paragraph>
                        <Upload customRequest={handleUploadS57} showUploadList={false}>
                          <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
                            Chọn file S-57 (.000)
                          </Button>
                        </Upload>
                      </Card>

                      <Card size="small" title="Nhập hải đồ bảo mật (S-63)" style={{ width: '100%' }}>
                        <Typography.Paragraph type="secondary" style={{ fontSize: '13px' }}>
                          Nhập file hải đồ mã hóa S-63 (`.000`). File yêu cầu phải có giấy phép Cell Permit tương ứng đã được đăng ký trước.
                        </Typography.Paragraph>
                        <Upload customRequest={handleUploadS63} showUploadList={false}>
                          <Button icon={<UploadOutlined />} style={{ width: '100%' }} type="dashed">
                            Chọn file S-63 (.000)
                          </Button>
                        </Upload>
                      </Card>
                    </Space>
                  </Card>
                ),
              },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
}

function DescriptionsPanel({ feature }: { feature: ChartFeature }) {
  const { featureName, featureCode, geometryType, coordinates, attributes } = feature;
  return (
    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
      <Typography.Paragraph style={{ marginBottom: 4 }}>
        <strong>Tên:</strong> {featureName || 'Không tên'}
      </Typography.Paragraph>
      <Typography.Paragraph style={{ marginBottom: 4 }}>
        <strong>Mã đối tượng:</strong> <Tag color="orange">{featureCode}</Tag>
      </Typography.Paragraph>
      <Typography.Paragraph style={{ marginBottom: 4 }}>
        <strong>Kiểu hình học:</strong> <code>{geometryType}</code>
      </Typography.Paragraph>
      <Typography.Paragraph style={{ marginBottom: 12, fontSize: '11px', color: '#888' }}>
        <strong>Tọa độ:</strong> <code>{coordinates.length > 50 ? `${coordinates.substring(0, 50)}...` : coordinates}</code>
      </Typography.Paragraph>

      <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Thuộc tính S-57:</Typography.Text>
      {attributes && Object.keys(attributes).length > 0 ? (
        <List
          size="small"
          bordered
          dataSource={Object.entries(attributes)}
          renderItem={([key, val]) => (
            <List.Item style={{ padding: '4px 8px', fontSize: '12px' }}>
              <strong style={{ color: '#555' }}>{key}:</strong> <span>{String(val)}</span>
            </List.Item>
          )}
        />
      ) : (
        <Typography.Text type="secondary" italic style={{ fontSize: '12px' }}>Không có thuộc tính</Typography.Text>
      )}
    </div>
  );
}
