import { Button, Col, Form, Input, Modal, Row, Select, Tag, TreeSelect } from 'antd';
import { useEffect, useState } from 'react';
import {
  actionPrimary, actionHover, textPrimary, textSecondary, textTertiary,
  statusCritical, surfaceCard, borderDefault,
  fontSizeSm, fontSizeMd, fontSizeLg,
  fontWeightNormal, fontWeightMedium, fontWeightBold,
  radiusSm, radiusMd, radiusLg, radiusPill,
  spaceXs, spaceSm, spaceFormField, spaceMd, spaceLg, spaceXl,
} from '../../tokens';
import { organizationService } from '../../services/organizationService';
import { cangBienCRUD } from '../../services/cangbenService';
import { pointObjectService } from '../../services/pointObjectService';
import { lineObjectService } from '../../services/lineObjectService';
import { polygonObjectService } from '../../services/polygonObjectService';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';

const { TextArea } = Input;

// Types of coordinates and features
export interface DrawResult {
  geojson: any;
  type: 'draw-point' | 'draw-line' | 'draw-polygon';
}

interface DrawSaveModalProps {
  open: boolean;
  drawResult: DrawResult | null;
  editRecord?: {
    id: string;
    type: 'Point' | 'LineString' | 'Polygon';
    name: string;
    code: string;
    loaiKcht: string;
    unitId?: string;
    cangBien?: string;
    diaDiem?: string;
    diaDiemChiTiet?: string;
    moTa?: string;
    status: string;
    coordinates?: any;
  } | null;
  onClose: () => void;
  onSaved?: () => void;
  onRedraw?: (type: string) => void;
}

const GEOM_TYPE_LABELS: Record<string, string> = {
  'draw-point': '📍 Điểm',
  'draw-line': '╱ Đường',
  'draw-polygon': '△ Vùng đa giác',
};

const INPUT_STYLE: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const SELECT_STYLE: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const BTN_STYLE: React.CSSProperties = { borderRadius: radiusPill, height: 40, fontWeight: fontWeightMedium, fontSize: fontSizeMd };

// Danh sách 16 loại KCHT khớp với dropdown filter bên ngoài
const LOAI_KCHT_OPTIONS = [
  { value: 'BENCANG', label: 'Bến cảng' },
  { value: 'BENPHAO', label: 'Bến phao' },
  { value: 'CANGBIEN', label: 'Cảng biển' },
  { value: 'CAUCANG', label: 'Cầu cảng' },
  { value: 'CANGCAN', label: 'Cảng cạn' },
  { value: 'COSO_SUACHUA', label: 'Cơ sở sửa chữa, đóng tàu' },
  { value: 'KHUCHUYEN_TAI', label: 'Khu chuyển tải' },
  { value: 'DENBIEN', label: 'Đèn biển và nhà trạm gắn liền với đèn biển' },
  { value: 'DIKE_REVETMENT', label: 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ' },
  { value: 'DAI_TTDH', label: 'Đài TTDH' },
  { value: 'DAI_INMARSAT', label: 'Đài Thông tin Vệ tinh mặt đất Inmarsat Hải Phòng' },
  { value: 'NAVIGATION_CHANNEL', label: 'Luồng hàng hải' },
  { value: 'DAI_LRIT', label: 'Đài Thông tin nhận dạng và truy theo tầm xa (LRIT)' },
  { value: 'KHUNEO_DAU', label: 'Khu neo đậu' },
  { value: 'NHATRAM_PHAO', label: 'Nhà trạm quản lý vận hành phao tiêu' },
  { value: 'PHAOTIEU', label: 'Phao, tiêu' },
  { value: 'DAI_COSPAS_SARSAT', label: 'Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam' },
  { value: 'KHUTRANH_TRU_BAO', label: 'Khu tránh, trú bão' },
  { value: 'DAI_HANOI', label: 'Đài Trung tâm xử lý thông tin hàng hải Hà Nội' },
  { value: 'HE_THONG_VTS', label: 'Hệ thống VTS' },
];

const mapToPointObjectType = (val: string): string => {
  if (val === 'CANGBIEN') return 'PORT';
  if (val === 'DENBIEN') return 'LIGHTHOUSE';
  if (val === 'PHAOTIEU') return 'BUOY';
  return 'OTHER';
};

const mapToLineObjectType = (val: string): string => {
  if (val === 'NAVIGATION_CHANNEL') return 'SHIPPING_ROUTE';
  if (val === 'DIKE_REVETMENT') return 'COASTLINE';
  return 'OTHER';
};

const mapToPolygonObjectType = (val: string): string => {
  if (val === 'VUNGNUOC') return 'WATER_ZONE';
  if (['KHUNEO_DAU', 'KHUCHUYEN_TAI'].includes(val)) return 'ANCHORAGE';
  if (val === 'KHUTRANH_TRU_BAO') return 'STORM_SHELTER';
  return 'OTHER';
};

const mapToCategoryId = (val: string): number => {
  if (val === 'CANGBIEN') return 1;
  if (val === 'COSO_SUACHUA') return 2;
  if (val === 'DIKE_REVETMENT') return 3;
  if (val === 'DENBIEN') return 4;
  if (val === 'HE_THONG_VTS') return 5;
  if (val === 'KHUCHUYEN_TAI') return 6;
  if (val === 'KHUNEO_DAU') return 7;
  if (val === 'KHUTRANH_TRU_BAO') return 8;
  if (val === 'NAVIGATION_CHANNEL') return 9;
  if (val === 'PHAOTIEU') return 10;
  if (val === 'TRAM_RADAR') return 11;
  if (val === 'VUNGNUOC') return 12;
  if (val === 'CANGCAN') return 13;
  return 99; // Khác
};

const TRANG_THAI_OPTIONS = [
  { label: 'Bản nháp', value: 'DRAFT' },
  { label: 'Sử dụng', value: 'PUBLISHED' },
];

export default function DrawSaveModal({
  open,
  drawResult,
  editRecord,
  onClose,
  onSaved,
  onRedraw,
}: DrawSaveModalProps) {
  const [form] = Form.useForm();
  const loaiKcht = Form.useWatch('loaiKcht', form);
  const isCangBien = loaiKcht === 'CANGBIEN';

  // Automatically clear seaport field if current category is Seaport
  useEffect(() => {
    if (isCangBien) {
      form.setFieldValue('cangBien', undefined);
    }
  }, [isCangBien, form]);

  const [loading, setLoading] = useState(false);
  const [orgTree, setOrgTree] = useState<any[]>([]);
  const [seaPortList, setSeaPortList] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [portsPage, setPortsPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  // Fetch organizations tree on mount when opened
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      try {
        // Load organization tree
        const orgs = await organizationService.getTree();
        const buildOrgTree = (nodes: any[]): any[] => {
          const map = new Map<string, any>();
          const roots: any[] = [];

          nodes.forEach((org) => {
            map.set(org.id, {
              title: org.name,
              value: org.id,
              parentId: org.parentId,
              children: [],
            });
          });

          nodes.forEach((org) => {
            const node = map.get(org.id);
            if (org.parentId && map.has(org.parentId)) {
              map.get(org.parentId).children.push(node);
            } else {
              roots.push(node);
            }
          });

          const clean = (itemNodes: any[]) => {
            itemNodes.forEach((n) => {
              if (n.children.length === 0) {
                delete n.children;
              } else {
                clean(n.children);
              }
            });
          };
          clean(roots);
          return roots;
        };
        setOrgTree(buildOrgTree(orgs || []));
      } catch (err) {
        console.error('Failed to load org tree:', err);
      }
    };

    void loadData();
    setSeaPortList([]);
    setSelectedOrgId(null);
    setPortsPage(1);
    setHasMore(true);
  }, [open]);

  // Load seaports page by page
  const loadPorts = async (orgId: string, pageNum: number, append: boolean) => {
    try {
      setFetchingMore(true);
      const size = 20;
      const res = await cangBienCRUD.findAll({ orgUnitId: orgId, page: pageNum, size });
      
      const newPorts = res.data || [];
      if (append) {
        setSeaPortList((prev) => [...prev, ...newPorts]);
      } else {
        setSeaPortList(newPorts);
      }
      
      const total = res.total ?? 0;
      const loadedCount = append ? seaPortList.length + newPorts.length : newPorts.length;
      setHasMore(loadedCount < total);
      setPortsPage(pageNum);
    } catch (err) {
      console.error('Failed to load seaports page:', err);
    } finally {
      setFetchingMore(false);
    }
  };

  // Load seaports dynamically based on selected managing unit (matching the original project)
  const handleOrgChange = async (value: string) => {
    form.setFieldValue('cangBien', undefined);
    setSelectedOrgId(value || null);
    setSeaPortList([]);
    setPortsPage(1);
    setHasMore(true);
    if (!value) return;
    
    await loadPorts(value, 1, false);
  };

  const loadMorePorts = async () => {
    if (!selectedOrgId || fetchingMore || !hasMore) return;
    await loadPorts(selectedOrgId, portsPage + 1, true);
  };

  const handlePopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
      void loadMorePorts();
    }
  };

  // Set default/editing values when opened
  useEffect(() => {
    if (open) {
      if (editRecord) {
        form.setFieldsValue({
          ten: editRecord.name,
          ma: editRecord.code,
          loaiKcht: editRecord.loaiKcht,
          donViQuanLy: editRecord.unitId,
          cangBien: editRecord.cangBien,
          diaDiem: editRecord.diaDiem,
          diaDiemChiTiet: editRecord.diaDiemChiTiet,
          moTa: editRecord.moTa,
          trangThai: editRecord.status,
        });

        if (editRecord.type === 'Point' && editRecord.coordinates) {
          form.setFieldsValue({
            _lat: editRecord.coordinates[1]?.toFixed(6),
            _lng: editRecord.coordinates[0]?.toFixed(6),
          });
        } else {
          form.setFieldsValue({
            _lat: undefined,
            _lng: undefined,
          });
        }

        if (editRecord.unitId) {
          void loadPorts(editRecord.unitId, 1, false);
        }
      } else if (drawResult) {
        const geom = drawResult.geojson?.geometry;
        if (drawResult.type === 'draw-point' && geom?.coordinates) {
          form.setFieldsValue({
            _lat: geom.coordinates[1].toFixed(6),
            _lng: geom.coordinates[0].toFixed(6),
          });
        } else {
          form.setFieldsValue({
            _lat: undefined,
            _lng: undefined,
          });
        }
      }
    } else {
      form.resetFields();
    }
  }, [open, drawResult, editRecord, form]);

  // Convert Drawn GeoJSON to WKT format
  const getWktString = (result: DrawResult | null, formLat?: number, formLng?: number): string => {
    if (!result || !result.geojson?.geometry) return '';
    const geom = result.geojson.geometry;

    if (result.type === 'draw-point') {
      const lat = formLat !== undefined ? formLat : geom.coordinates[1];
      const lng = formLng !== undefined ? formLng : geom.coordinates[0];
      return `POINT(${Number(lng).toFixed(6)} ${Number(lat).toFixed(6)})`;
    }

    if (result.type === 'draw-line') {
      const coords = geom.coordinates.map((c: any) => `${c[0].toFixed(6)} ${c[1].toFixed(6)}`).join(', ');
      return `LINESTRING(${coords})`;
    }

    if (result.type === 'draw-polygon') {
      const rawCoords = geom.coordinates;
      const ring = Array.isArray(rawCoords[0]) ? rawCoords[0] : rawCoords;
      const coordsList = ring.map((c: any) => ({ lng: c[0], lat: c[1] }));
      
      // Ensure closed loop
      if (coordsList.length > 0) {
        const first = coordsList[0];
        const last = coordsList[coordsList.length - 1];
        if (first.lat !== last.lat || first.lng !== last.lng) {
          coordsList.push({ ...first });
        }
      }
      const coordsStr = coordsList.map((c: any) => `${c.lng.toFixed(6)} ${c.lat.toFixed(6)}`).join(', ');
      return `POLYGON((${coordsStr}))`;
    }

    return '';
  };

  const handleSave = async () => {
    if (!drawResult && !editRecord) return;
    try {
      const values = await form.validateFields();
      setLoading(true);

      const lat = values._lat ? parseFloat(values._lat) : undefined;
      const lng = values._lng ? parseFloat(values._lng) : undefined;
      const wkt = drawResult ? getWktString(drawResult, lat, lng) : undefined;

      const isPoint = editRecord ? (editRecord.type === 'Point') : (drawResult?.type === 'draw-point');
      const isLine = editRecord ? (editRecord.type === 'LineString') : (drawResult?.type === 'draw-line');
      const isPolygon = editRecord ? (editRecord.type === 'Polygon') : (drawResult?.type === 'draw-polygon');

      if (isPoint) {
        const payload = {
          name: values.ten,
          code: values.ma,
          objectType: mapToPointObjectType(values.loaiKcht),
          categoryId: mapToCategoryId(values.loaiKcht),
          longitude: lng ?? (drawResult?.geojson?.geometry?.coordinates?.[0] || editRecord?.coordinates?.[0]),
          latitude: lat ?? (drawResult?.geojson?.geometry?.coordinates?.[1] || editRecord?.coordinates?.[1]),
          description: values.moTa,
          unitId: values.donViQuanLy,
          status: values.trangThai,
          refId: values.cangBien || null,
          refType: values.cangBien ? 0 : null,
          purpose: values.diaDiem || null,
          restrictionLevel: values.diaDiemChiTiet || null,
        };
        if (editRecord) {
          await pointObjectService.update(editRecord.id, payload as any);
        } else {
          await pointObjectService.create(payload as any);
        }
      } else if (isLine) {
        const payload = {
          name: values.ten,
          code: values.ma,
          objectType: mapToLineObjectType(values.loaiKcht),
          categoryId: mapToCategoryId(values.loaiKcht),
          coordinates: wkt || (editRecord?.coordinates ? (typeof editRecord.coordinates === 'string' ? editRecord.coordinates : undefined) : undefined),
          description: values.moTa,
          unitId: values.donViQuanLy,
          status: values.trangThai,
          refId: values.cangBien || null,
          refType: values.cangBien ? 0 : null,
          purpose: values.diaDiem || null,
          restrictionLevel: values.diaDiemChiTiet || null,
        };
        if (editRecord) {
          await lineObjectService.update(editRecord.id, payload as any);
        } else {
          await lineObjectService.create(payload as any);
        }
      } else if (isPolygon) {
        const payload = {
          name: values.ten,
          code: values.ma,
          objectType: mapToPolygonObjectType(values.loaiKcht),
          categoryId: mapToCategoryId(values.loaiKcht),
          coordinates: wkt || (editRecord?.coordinates ? (typeof editRecord.coordinates === 'string' ? editRecord.coordinates : undefined) : undefined),
          description: values.moTa,
          unitId: values.donViQuanLy,
          status: values.trangThai,
          refId: values.cangBien || null,
          refType: values.cangBien ? 0 : null,
          purpose: values.diaDiem || null,
          restrictionLevel: values.diaDiemChiTiet || null,
        };
        if (editRecord) {
          await polygonObjectService.update(editRecord.id, payload as any);
        } else {
          await polygonObjectService.create(payload as any);
        }
      }

      toast.success(editRecord ? `Đã cập nhật thành công đối tượng KCHT "${values.ten}"` : `Đã lưu thành công đối tượng KCHT "${values.ten}"`);
      form.resetFields();
      onClose();
      if (onSaved) onSaved();
    } catch (err: any) {
      if (err?.errorFields) return; // validation error
      const errorMsg = err?.response?.data?.message || err?.message || 'Không thể lưu đối tượng';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const geomSummary = () => {
    if (editRecord) {
      if (editRecord.type === 'Point' && editRecord.coordinates) {
        return `📍 Điểm — ${Number(editRecord.coordinates[1]).toFixed(5)}°N, ${Number(editRecord.coordinates[0]).toFixed(5)}°E`;
      }
      if (editRecord.type === 'LineString') {
        return `╱ Đường`;
      }
      if (editRecord.type === 'Polygon') {
        return `△ Vùng đa giác`;
      }
    }
    if (!drawResult) return '—';
    const type = GEOM_TYPE_LABELS[drawResult.type] || drawResult.type;
    const geom = drawResult.geojson?.geometry;
    if (!geom) return type;
    if (geom.type === 'Point' || geom.type === 'Marker') {
      const [lng, lat] = geom.coordinates;
      return `${type} — ${Number(lat).toFixed(5)}°N, ${Number(lng).toFixed(5)}°E`;
    }
    if (geom.type === 'LineString' || geom.type === 'Polyline') {
      return `${type} — ${geom.coordinates.length} điểm`;
    }
    if (geom.type === 'Polygon') {
      const ring = Array.isArray(geom.coordinates[0]) ? geom.coordinates[0] : geom.coordinates;
      return `${type} — ${ring.length - 1} đỉnh`;
    }
    return type;
  };

  return (
    <Modal
      open={open}
      width={560}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{editRecord ? '📝 Chỉnh sửa đối tượng KCHT' : '💾 Lưu đối tượng KCHT'}</span>
          <Tag color="blue" style={{ fontSize: fontSizeSm, fontWeight: fontWeightMedium }}>
            {editRecord
              ? (editRecord.type === 'Point' ? '📍 Điểm' : editRecord.type === 'LineString' ? '╱ Đường' : '△ Vùng đa giác')
              : (GEOM_TYPE_LABELS[drawResult?.type ?? ''] || drawResult?.type || '—')
            }
          </Tag>
        </div>
      }
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} style={BTN_STYLE}>
          Hủy
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave} style={BTN_STYLE}>
          Lưu
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ trangThai: 'PUBLISHED' }}
        requiredMark="optional"
      >
        <div
          style={{
            background: surfaceCard,
            border: `1px solid ${borderDefault}`,
            borderRadius: radiusMd,
            color: textSecondary,
            fontSize: fontSizeMd,
            marginBottom: spaceMd,
            padding: spaceFormField,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spaceSm }}>
            <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
              <strong>Hình học:</strong> {geomSummary()}
            </span>
            {!editRecord && onRedraw && drawResult && (
              <Button
                size="small"
                icon={<span>🔄</span>}
                onClick={() => {
                  onClose();
                  if (onRedraw) onRedraw(drawResult.type);
                }}
              >
                Vẽ lại
              </Button>
            )}
          </div>

          {drawResult?.type === 'draw-point' && drawResult.geojson?.geometry?.coordinates && (
            <div style={{ display: 'grid', gap: spaceSm, gridTemplateColumns: '1fr 1fr', marginTop: spaceSm }}>
              <Form.Item
                label="Vĩ độ (Lat)"
                name="_lat"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: 'Vui lòng nhập vĩ độ' }]}
              >
                <Input size="small" style={INPUT_STYLE} />
              </Form.Item>
              <Form.Item
                label="Kinh độ (Lng)"
                name="_lng"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: 'Vui lòng nhập kinh độ' }]}
              >
                <Input size="small" style={INPUT_STYLE} />
              </Form.Item>
            </div>
          )}
        </div>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label="Mã đối tượng"
              name="ma"
              style={{ marginBottom: spaceFormField }}
              rules={[
                { required: true, message: 'Vui lòng nhập mã đối tượng' },
                { pattern: /^[A-Za-z0-9_-]+$/, message: 'Mã chỉ gồm chữ, số, - và _' },
              ]}
            >
              <Input placeholder="Mã VD: P5_LSG" style={INPUT_STYLE} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tên đối tượng"
              name="ten"
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng nhập tên đối tượng' }]}
            >
              <Input placeholder="Ví dụ: Phao số 5 - Luồng Sài Gòn" style={INPUT_STYLE} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Loại kết cấu hạ tầng"
          name="loaiKcht"
          style={{ marginBottom: spaceFormField }}
        >
          <Select placeholder="Chọn loại KCHT" options={LOAI_KCHT_OPTIONS} style={SELECT_STYLE} />
        </Form.Item>

        <Form.Item
          label="Đơn vị quản lý"
          name="donViQuanLy"
          style={{ marginBottom: spaceFormField }}
        >
          <TreeSelect
            placeholder="Chọn đơn vị quản lý"
            treeData={orgTree}
            style={SELECT_STYLE}
            showSearch
            treeDefaultExpandAll
            filterTreeNode={(input, node) =>
              (node?.title as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            allowClear
            onChange={handleOrgChange}
          />
        </Form.Item>

        <Form.Item
          label="Thuộc cảng biển"
          name="cangBien"
          style={{ marginBottom: spaceFormField }}
        >
          <Select
            placeholder={isCangBien ? "Không áp dụng cho Cảng biển" : "Chọn cảng biển"}
            options={seaPortList.map((item) => ({ label: item.tenCang, value: item.id }))}
            showSearch
            filterOption={(input, opt) =>
              (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onPopupScroll={handlePopupScroll}
            loading={fetchingMore && seaPortList.length === 0}
            notFoundContent={fetchingMore ? 'Đang tải...' : 'Không tìm thấy cảng biển'}
            disabled={isCangBien}
            style={SELECT_STYLE}
          />
        </Form.Item>

        <Form.Item label="Trạng thái" name="trangThai" style={{ marginBottom: spaceFormField }}>
          <Select options={TRANG_THAI_OPTIONS} style={SELECT_STYLE} />
        </Form.Item>

        <Form.Item
          label="Tỉnh/Thành phố"
          name="diaDiem"
          style={{ marginBottom: spaceFormField }}
        >
          <Select
            placeholder="Chọn tỉnh/thành phố"
            options={VIETNAM_PROVINCES.map((item) => ({ label: item, value: item }))}
            showSearch
            filterOption={(input, opt) =>
              (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            style={SELECT_STYLE}
          />
        </Form.Item>

        <Form.Item label="Địa điểm chi tiết" name="diaDiemChiTiet" style={{ marginBottom: spaceFormField }}>
          <Input placeholder="Ví dụ: Quận 4, TP. HCM" style={INPUT_STYLE} />
        </Form.Item>

        <Form.Item label="Mô tả" name="moTa" style={{ marginBottom: spaceFormField }}>
          <TextArea placeholder="Ghi chú thêm về đối tượng..." rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
