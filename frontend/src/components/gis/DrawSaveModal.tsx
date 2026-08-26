import { Button, Col, Form, Input, Modal, Row, Select, Tag } from 'antd';
import { useEffect, useState } from 'react';
import {
  actionPrimary, actionHover, textPrimary, textSecondary, textTertiary,
  statusCritical, surfaceCard, borderDefault,
  fontSizeSm, fontSizeMd, fontSizeLg,
  fontWeightNormal, fontWeightMedium, fontWeightBold,
  radiusSm, radiusMd, radiusLg, radiusPill,
  spaceXs, spaceSm, spaceFormField, spaceMd, spaceLg,
} from '../../tokens';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { portCRUD } from '../../services/portService';
import { pointObjectService } from '../../services/pointObjectService';
import { lineObjectService } from '../../services/lineObjectService';
import { polygonObjectService } from '../../services/polygonObjectService';
import { VIETNAM_PROVINCES } from '../../types/common';
import {
  getKchtGisCategoryId,
  KCHT_GIS_TYPE_OPTIONS,
  normalizeKchtGisType,
} from '../../types/gisSearch';
import toast from '../../components/ToastNotification';
import {
  coordinateRowsToWkt,
  geometryCoordinatesToRows,
  type EditableCoordinateRow,
  type EditableGeometryType,
} from '../../utils/gisGeometry';

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
    Port?: string;
    location?: string;
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

const mapToPointObjectType = (val: string): string => {
  if (val === 'SEAPORT') return 'PORT';
  if (val === 'LIGHTHOUSE') return 'LIGHTHOUSE';
  if (val === 'BUOY') return 'BUOY';
  return 'OTHER';
};

const mapToLineObjectType = (val: string): string => {
  if (val === 'NAVIGATION_CHANNEL') return 'SHIPPING_ROUTE';
  if (val === 'DIKE_REVETMENT') return 'COASTLINE';
  return 'OTHER';
};

const mapToPolygonObjectType = (val: string): string => {
  if (val === 'WATER_AREA') return 'WATER_ZONE';
  if (['ANCHORAGE_AREA', 'TRANSSHIPMENT_AREA'].includes(val)) return 'ANCHORAGE';
  if (val === 'STORM_SHELTER_AREA') return 'STORM_SHELTER';
  return 'OTHER';
};

const TRANG_THAI_OPTIONS = [
  { label: 'Bản nháp', value: 'DRAFT' },
  { label: 'Sử dụng', value: 'PUBLISHED' },
];

const coordinateRule = (label: string, min: number, max: number) => ({
  validator: (_rule: unknown, value: unknown) => {
    if (value === undefined || value === null || value === '') {
      return Promise.reject(new Error(`Vui lòng nhập ${label.toLowerCase()}`));
    }
    const coordinate = Number(value);
    if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
      return Promise.reject(new Error(`${label} phải trong khoảng ${min} đến ${max}`));
    }
    return Promise.resolve();
  },
});

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
  const isCangBien = loaiKcht === 'SEAPORT';
  const geometryType: EditableGeometryType = editRecord?.type
    || (drawResult?.type === 'draw-line' ? 'LineString' : drawResult?.type === 'draw-polygon' ? 'Polygon' : 'Point');

  // Automatically clear seaport field if current category is Seaport
  useEffect(() => {
    if (isCangBien) {
      form.setFieldValue('Port', undefined);
    }
  }, [isCangBien, form]);

  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [seaPortList, setSeaPortList] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [portsPage, setPortsPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  // Fetch organizations tree on mount when opened
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setLoadingOrganizations(true);
      try {
        const response = await organizationService.list({ pageSize: 1000 });
        setOrganizations(response.data || []);
      } catch (err) {
        setOrganizations([]);
        console.error('Không thể tải danh sách đơn vị quản lý:', err);
        toast.error('Không thể tải danh sách đơn vị quản lý');
      } finally {
        setLoadingOrganizations(false);
      }
    };

    void loadData();
    setSeaPortList([]);
    setSelectedOrgId(editRecord?.unitId || null);
    setPortsPage(1);
    setHasMore(true);
  }, [open, editRecord?.unitId]);

  // Load seaports page by page
  const loadPorts = async (orgId: string, pageNum: number, append: boolean) => {
    try {
      setFetchingMore(true);
      const size = 20;
      const res = await portCRUD.findAll({ orgUnitId: orgId, page: pageNum, size });
      
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
  const handleOrgChange = async (value?: string) => {
    form.setFieldValue('Port', undefined);
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
          name: editRecord.name,
          code: editRecord.code,
          loaiKcht: normalizeKchtGisType(editRecord.loaiKcht),
          donViQuanLy: editRecord.unitId,
          Port: editRecord.Port,
          location: editRecord.location,
          diaDiemChiTiet: editRecord.diaDiemChiTiet,
          moTa: editRecord.moTa,
          trangThai: editRecord.status,
          _coords: geometryCoordinatesToRows(editRecord.type, editRecord.coordinates),
        });

        if (editRecord.unitId) {
          setSelectedOrgId(editRecord.unitId);
          void loadPorts(editRecord.unitId, 1, false);
        }
      } else if (drawResult) {
        const geom = drawResult.geojson?.geometry;
        form.setFieldsValue({
          _coords: geometryCoordinatesToRows(geometryType, geom?.coordinates),
        });
      }
    } else {
      form.resetFields();
    }
  }, [open, drawResult, editRecord, form]);

  const handleSave = async () => {
    if (!drawResult && !editRecord) return;
    try {
      const values = await form.validateFields();
      setLoading(true);

      const coordinateRows = (values._coords || []).map((row: EditableCoordinateRow) => ({
        lng: Number(row.lng),
        lat: Number(row.lat),
      }));
      const wkt = coordinateRowsToWkt(geometryType, coordinateRows);
      if (!wkt) {
        throw new Error(
          geometryType === 'Point'
            ? 'Điểm phải có đầy đủ kinh độ và vĩ độ hợp lệ'
            : geometryType === 'LineString'
              ? 'Đường phải có ít nhất 2 điểm tọa độ hợp lệ'
              : 'Vùng đa giác phải có ít nhất 3 đỉnh tọa độ hợp lệ',
        );
      }

      const isPoint = editRecord ? (editRecord.type === 'Point') : (drawResult?.type === 'draw-point');
      const isLine = editRecord ? (editRecord.type === 'LineString') : (drawResult?.type === 'draw-line');
      const isPolygon = editRecord ? (editRecord.type === 'Polygon') : (drawResult?.type === 'draw-polygon');

      if (isPoint) {
        const pointCoordinate = coordinateRows[0];
        const payload = {
          name: values.name,
          code: values.code,
          objectType: mapToPointObjectType(values.loaiKcht),
          categoryId: getKchtGisCategoryId(values.loaiKcht),
          longitude: pointCoordinate.lng,
          latitude: pointCoordinate.lat,
          description: values.moTa,
          unitId: values.donViQuanLy,
          status: values.trangThai,
          refId: values.Port || null,
          refType: values.Port ? 0 : null,
          purpose: values.location || null,
          restrictionLevel: values.diaDiemChiTiet || null,
        };
        if (editRecord) {
          await pointObjectService.update(editRecord.id, payload as any);
        } else {
          await pointObjectService.create(payload as any);
        }
      } else if (isLine) {
        const payload = {
          name: values.name,
          code: values.code,
          objectType: mapToLineObjectType(values.loaiKcht),
          categoryId: getKchtGisCategoryId(values.loaiKcht),
          coordinates: wkt,
          description: values.moTa,
          unitId: values.donViQuanLy,
          status: values.trangThai,
          refId: values.Port || null,
          refType: values.Port ? 0 : null,
          purpose: values.location || null,
          restrictionLevel: values.diaDiemChiTiet || null,
        };
        if (editRecord) {
          await lineObjectService.update(editRecord.id, payload as any);
        } else {
          await lineObjectService.create(payload as any);
        }
      } else if (isPolygon) {
        const payload = {
          name: values.name,
          code: values.code,
          objectType: mapToPolygonObjectType(values.loaiKcht),
          categoryId: getKchtGisCategoryId(values.loaiKcht),
          coordinates: wkt,
          description: values.moTa,
          unitId: values.donViQuanLy,
          status: values.trangThai,
          refId: values.Port || null,
          refType: values.Port ? 0 : null,
          purpose: values.location || null,
          restrictionLevel: values.diaDiemChiTiet || null,
        };
        if (editRecord) {
          await polygonObjectService.update(editRecord.id, payload as any);
        } else {
          await polygonObjectService.create(payload as any);
        }
      }

      toast.success(editRecord ? `Đã cập nhật thành công đối tượng KCHT "${values.name}"` : `Đã lưu thành công đối tượng KCHT "${values.name}"`);
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
      centered
      rootClassName="gis-edit-modal-root"
      classNames={{
        wrapper: 'gis-edit-modal__wrapper',
        container: 'gis-edit-modal__container',
        header: 'gis-edit-modal__header',
        body: 'gis-edit-modal__body',
        footer: 'gis-edit-modal__footer',
      }}
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
      <div className="gis-edit-modal__scroll-body">
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

          <div style={{ marginTop: spaceSm }}>
            <div style={{ color: textPrimary, fontWeight: fontWeightMedium, marginBottom: spaceSm }}>
              Danh sách tọa độ
            </div>
            <Form.List name="_coords">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                  <div style={{ maxHeight: 240, overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: spaceXs }}>
                    {fields.map((field, index) => (
                      <div
                        key={field.key}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: geometryType === 'Point'
                            ? '52px minmax(0, 1fr) minmax(0, 1fr)'
                            : '52px minmax(0, 1fr) minmax(0, 1fr) auto',
                          gap: spaceSm,
                          alignItems: 'start',
                          marginBottom: spaceSm,
                        }}
                      >
                        <span style={{ color: textSecondary, paddingTop: spaceFormField }}>
                          Điểm {index + 1}
                        </span>
                        <Form.Item
                          {...field}
                          name={[field.name, 'lat']}
                          style={{ marginBottom: 0 }}
                          rules={[coordinateRule('Vĩ độ', -90, 90)]}
                        >
                          <Input type="number" step="any" placeholder="Vĩ độ" style={INPUT_STYLE} />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'lng']}
                          style={{ marginBottom: 0 }}
                          rules={[coordinateRule('Kinh độ', -180, 180)]}
                        >
                          <Input type="number" step="any" placeholder="Kinh độ" style={INPUT_STYLE} />
                        </Form.Item>
                        {geometryType !== 'Point' && (
                          <Button danger type="text" onClick={() => remove(field.name)} style={BTN_STYLE}>
                            Xóa
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {geometryType !== 'Point' && (
                    <Button type="dashed" onClick={() => add({ lng: '', lat: '' })} style={BTN_STYLE}>
                      Thêm điểm
                    </Button>
                  )}
                </div>
              )}
            </Form.List>
          </div>
        </div>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label="Mã đối tượng"
              name="code"
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
              name="name"
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
          rules={[{ required: true, message: 'Vui lòng chọn loại kết cấu hạ tầng' }]}
        >
          <Select
            placeholder="Chọn loại KCHT"
            options={KCHT_GIS_TYPE_OPTIONS}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            style={SELECT_STYLE}
          />
        </Form.Item>

        <Form.Item
          label="Đơn vị quản lý"
          name="donViQuanLy"
          style={{ marginBottom: spaceFormField }}
          rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
        >
          <OrgUnitTreeSelect
            placeholder="Chọn đơn vị quản lý"
            organizations={organizations}
            loading={loadingOrganizations}
            style={SELECT_STYLE}
            showSearch
            showPath
            treeDefaultExpandAll={false}
            allowClear
            notFoundContent={loadingOrganizations ? 'Đang tải...' : 'Không tìm thấy đơn vị quản lý'}
            onChange={handleOrgChange}
          />
        </Form.Item>

        <Form.Item
          label="Thuộc cảng biển"
          name="Port"
          style={{ marginBottom: spaceFormField }}
        >
          <Select
            placeholder={isCangBien ? "Không áp dụng cho Cảng biển" : "Chọn cảng biển"}
            options={seaPortList.map((item) => ({ label: item.portName, value: item.id }))}
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
          <Select
            options={TRANG_THAI_OPTIONS}
            style={SELECT_STYLE}
          />
        </Form.Item>

        <Form.Item
          label="Tỉnh/Thành phố"
          name="location"
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
      </div>
    </Modal>
  );
}
