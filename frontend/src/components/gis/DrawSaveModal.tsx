import { Button, Col, Form, Input, Modal, Row, Select, Tag, TreeSelect } from 'antd';
import { useEffect, useState } from 'react';
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
  onClose: () => void;
  onSaved?: () => void;
  onRedraw?: (type: string) => void;
}

const GEOM_TYPE_LABELS: Record<string, string> = {
  'draw-point': '📍 Điểm',
  'draw-line': '╱ Đường',
  'draw-polygon': '△ Vùng đa giác',
};

// Danh sách 16 loại KCHT khớp với dropdown filter bên ngoài
const LOAI_KCHT_OPTIONS = [
  { value: 'BENCANG', label: 'Bến cảng' },
  { value: 'BENPHAO', label: 'Bến phao' },
  { value: 'CANGBIEN', label: 'Cảng biển' },
  { value: 'CANGCAN', label: 'Cảng cạn' },
  { value: 'CAUCANG', label: 'Cầu cảng' },
  { value: 'COSO_SUACHUA', label: 'Cơ sở sửa chữa' },
  { value: 'DEKE', label: 'Đê kè' },
  { value: 'DENBIEN', label: 'Đèn biển' },
  { value: 'HE_THONG_VTS', label: 'Hệ thống VTS' },
  { value: 'KHUCHUYEN_TAI', label: 'Khu chuyển tải' },
  { value: 'KHUNEO_DAU', label: 'Khu neo đậu' },
  { value: 'KHUTRANH_TRU_BAO', label: 'Khu tránh trú bão' },
  { value: 'LUONGHANGHAI', label: 'Luồng hàng hải' },
  { value: 'PHAOTIEU', label: 'Phao tiêu' },
  { value: 'TRAM_RADAR', label: 'Trạm radar' },
  { value: 'VUNGNUOC', label: 'Vùng nước' },
];

const mapToPointObjectType = (val: string): string => {
  if (val === 'CANGBIEN') return 'PORT';
  if (val === 'DENBIEN') return 'LIGHTHOUSE';
  if (val === 'PHAOTIEU') return 'BUOY';
  return 'OTHER';
};

const mapToPointCategoryId = (val: string): number => {
  if (val === 'CANGBIEN') return 1; // Cảng biển
  if (val === 'DENBIEN') return 2;   // Đèn biển
  if (val === 'PHAOTIEU') return 3;  // Phao tiêu
  return 5; // Khác
};

const mapToLineObjectType = (val: string): string => {
  if (val === 'LUONGHANGHAI') return 'SHIPPING_ROUTE';
  if (val === 'DEKE') return 'COASTLINE';
  return 'OTHER';
};

const mapToLineCategoryId = (val: string): number => {
  if (val === 'DEKE') return 1; // Đường bờ biển
  if (val === 'LUONGHANGHAI') return 2; // Tuyến hàng hải
  return 4; // Khác
};

const mapToPolygonObjectType = (val: string): string => {
  if (val === 'VUNGNUOC') return 'WATER_ZONE';
  if (['KHUNEO_DAU', 'KHUCHUYEN_TAI'].includes(val)) return 'ANCHORAGE';
  if (val === 'KHUTRANH_TRU_BAO') return 'STORM_SHELTER';
  return 'OTHER';
};

const mapToPolygonCategoryId = (val: string): number => {
  if (val === 'VUNGNUOC') return 1; // Vùng nước
  if (val === 'KHUNEO_DAU' || val === 'KHUCHUYEN_TAI') return 2; // Khu neo đậu
  if (val === 'KHUTRANH_TRU_BAO') return 3; // Tránh trú bão
  return 6; // Khác
};

const TRANG_THAI_OPTIONS = [
  { label: 'Bản nháp', value: 'DRAFT' },
  { label: 'Sử dụng', value: 'PUBLISHED' },
];

export default function DrawSaveModal({
  open,
  drawResult,
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

  // Set default values when geometry is drawn
  useEffect(() => {
    if (open && drawResult) {
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
    } else {
      form.resetFields();
    }
  }, [open, drawResult, form]);

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
    if (!drawResult) return;
    try {
      const values = await form.validateFields();
      setLoading(true);

      const lat = values._lat ? parseFloat(values._lat) : undefined;
      const lng = values._lng ? parseFloat(values._lng) : undefined;
      const wkt = getWktString(drawResult, lat, lng);

      if (drawResult.type === 'draw-point') {
        const payload = {
          name: values.ten,
          code: values.ma,
          objectType: mapToPointObjectType(values.loaiKcht),
          categoryId: mapToPointCategoryId(values.loaiKcht),
          longitude: lng ?? drawResult.geojson.geometry.coordinates[0],
          latitude: lat ?? drawResult.geojson.geometry.coordinates[1],
          description: values.moTa,
          unitId: values.donViQuanLy,
        };
        await pointObjectService.create(payload as any);
      } else if (drawResult.type === 'draw-line') {
        const payload = {
          name: values.ten,
          code: values.ma,
          objectType: mapToLineObjectType(values.loaiKcht),
          categoryId: mapToLineCategoryId(values.loaiKcht),
          coordinates: wkt,
          description: values.moTa,
          unitId: values.donViQuanLy,
        };
        await lineObjectService.create(payload as any);
      } else if (drawResult.type === 'draw-polygon') {
        const payload = {
          name: values.ten,
          code: values.ma,
          objectType: mapToPolygonObjectType(values.loaiKcht),
          categoryId: mapToPolygonCategoryId(values.loaiKcht),
          coordinates: wkt,
          description: values.moTa,
          unitId: values.donViQuanLy,
        };
        await polygonObjectService.create(payload as any);
      }

      toast.success(`Đã lưu thành công đối tượng KCHT "${values.ten}"`);
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
          <span>💾 Lưu đối tượng KCHT</span>
          <Tag color="blue" style={{ fontSize: 11, fontWeight: 500 }}>
            {GEOM_TYPE_LABELS[drawResult?.type ?? ''] || drawResult?.type || '—'}
          </Tag>
        </div>
      }
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          Lưu vào CSDL
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
            background: '#f6f8fa',
            border: '1px solid #e8e8e8',
            borderRadius: 6,
            color: '#444',
            fontSize: 13,
            marginBottom: 16,
            padding: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#333' }}>
              <strong>Hình học:</strong> {geomSummary()}
            </span>
            <Button
              size="small"
              icon={<span>🔄</span>}
              onClick={() => {
                onClose();
                if (onRedraw && drawResult) onRedraw(drawResult.type);
              }}
            >
              Vẽ lại
            </Button>
          </div>

          {drawResult?.type === 'draw-point' && drawResult.geojson?.geometry?.coordinates && (
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
              <Form.Item
                label="Vĩ độ (Lat)"
                name="_lat"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: 'Vui lòng nhập vĩ độ' }]}
              >
                <Input size="small" />
              </Form.Item>
              <Form.Item
                label="Kinh độ (Lng)"
                name="_lng"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: 'Vui lòng nhập kinh độ' }]}
              >
                <Input size="small" />
              </Form.Item>
            </div>
          )}
        </div>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label="Mã đối tượng"
              name="ma"
              rules={[
                { required: true, message: 'Vui lòng nhập mã đối tượng' },
                { pattern: /^[A-Za-z0-9_-]+$/, message: 'Mã chỉ gồm chữ, số, - và _' },
              ]}
            >
              <Input placeholder="Mã VD: P5_LSG" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tên đối tượng"
              name="ten"
              rules={[{ required: true, message: 'Vui lòng nhập tên đối tượng' }]}
            >
              <Input placeholder="Ví dụ: Phao số 5 - Luồng Sài Gòn" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Loại kết cấu hạ tầng"
          name="loaiKcht"
          rules={[{ required: true, message: 'Vui lòng chọn loại KCHT' }]}
        >
          <Select placeholder="Chọn loại KCHT" options={LOAI_KCHT_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="Đơn vị quản lý"
          name="donViQuanLy"
          rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
        >
          <TreeSelect
            placeholder="Chọn đơn vị quản lý"
            treeData={orgTree}
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
          rules={[{ required: !isCangBien, message: 'Vui lòng chọn cảng biển' }]}
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
          />
        </Form.Item>

        <Form.Item label="Trạng thái" name="trangThai">
          <Select options={TRANG_THAI_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="Tỉnh/Thành phố"
          name="diaDiem"
          rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
        >
          <Select
            placeholder="Chọn tỉnh/thành phố"
            options={VIETNAM_PROVINCES.map((item) => ({ label: item, value: item }))}
            showSearch
            filterOption={(input, opt) =>
              (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item label="Địa điểm chi tiết" name="diaDiemChiTiet">
          <Input placeholder="Ví dụ: Quận 4, TP. HCM" />
        </Form.Item>

        <Form.Item label="Mô tả" name="moTa">
          <TextArea placeholder="Ghi chú thêm về đối tượng..." rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
