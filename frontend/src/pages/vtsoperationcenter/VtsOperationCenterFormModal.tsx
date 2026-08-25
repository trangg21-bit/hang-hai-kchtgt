import React, { useEffect, useState, useMemo } from 'react';
import { Form, Input, Select, Row, Col, Upload, Button, Tabs, Table, Space, InputNumber, Modal } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined, FileOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { OrgUnitTreeSelect, normalizeSearchText } from '../../components/org-unit';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { CONDITION_STATUS_OPTIONS, ConditionStatus } from '../../types/vtsSystem';
import type { VtsOperationCenterResponse, CreateVtsOperationCenterRequest } from '../../types/vtsOperationCenter';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as GisSymbol } from '../../services/symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import toast from '../../components/ToastNotification';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { colors } from '../../theme';
import {
  spaceFormField,
  spaceSm,
  radiusPill,
  radiusMd,
  inputStyle,
  selectStyle,
  borderDefault,
  surfaceCard,
  textTertiary,
  textSecondary,
  textPrimary,
  fontSizeMd,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
} from '../../tokens';

interface CoordinateItem {
  latitude: number | null;
  longitude: number | null;
}

const ddToDms = (dd: number | null | undefined) => {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(4));
  return { d, m, s };
};

const parseWktToCoordinates = (wkt?: string): CoordinateItem[] => {
  if (!wkt) return [];
  try {
    const upper = wkt.toUpperCase().trim();
    if (upper.startsWith('POINT')) {
      const match = upper.match(/POINT\s*\(\s*([^\s)]+)\s+([^)]+)\s*\)/i);
      if (match) {
        return [{ longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) }];
      }
    } else if (upper.startsWith('LINESTRING')) {
      const match = upper.match(/LINESTRING\s*\(([^)]+)\)/i);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { longitude: parseFloat(parts[0]), latitude: parseFloat(parts[1]) };
        });
      }
    } else if (upper.startsWith('POLYGON')) {
      const match = upper.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { longitude: parseFloat(parts[0]), latitude: parseFloat(parts[1]) };
        });
      }
    }
  } catch (e) {}
  return [];
};

const serializeCoordinatesToWkt = (coords: CoordinateItem[], geomType: string): string => {
  const valid = coords.filter((c) => c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude));
  if (valid.length === 0) return '';
  if (geomType === 'POINT') {
    return `POINT(${valid[0].longitude} ${valid[0].latitude})`;
  } else if (geomType === 'LINE') {
    return `LINESTRING(${valid.map((c) => `${c.longitude} ${c.latitude}`).join(', ')})`;
  } else if (geomType === 'POLYGON') {
    const pts = [...valid];
    if (pts.length >= 3) {
      if (pts[0].latitude !== pts[pts.length - 1].latitude || pts[0].longitude !== pts[pts.length - 1].longitude) {
        pts.push(pts[0]);
      }
    }
    return `POLYGON((${pts.map((c) => `${c.longitude} ${c.latitude}`).join(', ')}))`;
  }
  return `POINT(${valid[0].longitude} ${valid[0].latitude})`;
};

interface VtsOperationCenterFormModalProps {
  visible: boolean;
  item?: VtsOperationCenterResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
  orgUnits?: any[];
  vtsSystems?: { id: string; name: string; orgUnitId?: string }[];
  portOptions?: { id: string; name: string; orgUnitId?: string }[];
}

export const VtsOperationCenterFormModal: React.FC<VtsOperationCenterFormModalProps> = ({
  visible,
  item,
  onCancel,
  onSuccess,
  orgUnits: propOrgUnits,
  vtsSystems: propVtsSystems,
  portOptions: propPortOptions,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [submitting, setSubmitting] = useState(false);
  const [orgUnits, setOrgUnits] = useState<any[]>(propOrgUnits || []);
  const [vtsSystems, setVtsSystems] = useState<{ id: string; name: string; orgUnitId?: string }[]>(propVtsSystems || []);
  const [portOptions, setPortOptions] = useState<{ id: string; name: string; orgUnitId?: string }[]>(propPortOptions || []);
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<CoordinateItem[]>([{ latitude: null, longitude: null }]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const isEdit = !!item;
  const formOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedGeom = Form.useWatch('geometryType', form) || 'POINT';

  useEffect(() => {
    if (propOrgUnits && propOrgUnits.length > 0) setOrgUnits(propOrgUnits);
    if (propVtsSystems && propVtsSystems.length > 0) setVtsSystems(propVtsSystems);
    if (propPortOptions && propPortOptions.length > 0) setPortOptions(propPortOptions);
  }, [propOrgUnits, propVtsSystems, propPortOptions]);

  const filteredVtsSystems = useMemo(() => {
    if (!formOrgUnitId) return vtsSystems;
    return vtsSystems.filter((s) => s.orgUnitId === formOrgUnitId);
  }, [vtsSystems, formOrgUnitId]);

  const filteredPortOptions = useMemo(() => {
    if (!formOrgUnitId) return portOptions;
    return portOptions.filter((p) => p.orgUnitId === formOrgUnitId);
  }, [portOptions, formOrgUnitId]);

  useEffect(() => {
    if (visible) {
      setActiveTab('basic');

      // 1. Load Orgs for dropdown if not provided
      if (!propOrgUnits || propOrgUnits.length === 0) {
        organizationService.list({ pageSize: 1000 }).then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setOrgUnits(res.data);
          }
        }).catch(() => {});
      }

      // 2. Load VTS Systems for dropdown if not provided
      if (!propVtsSystems || propVtsSystems.length === 0) {
        vtsSystemCRUD.getOptions().then((res) => {
          if (Array.isArray(res)) {
            setVtsSystems(res.map((s: any) => ({ id: s.id, name: s.name || s.systemName, orgUnitId: s.orgUnitId })));
          }
        }).catch(() => {});
      }

      // 3. Load Seaports for dropdown if not provided
      if (!propPortOptions || propPortOptions.length === 0) {
        portCRUD.getOptions().then((ports) => {
          if (Array.isArray(ports)) {
            setPortOptions(ports.map((p: any) => ({ id: p.id, name: p.portName || p.portCode || p.id, orgUnitId: p.orgUnitId })));
          }
        }).catch(() => {});
      }

      // 4. Load Symbols for GIS tab
      symbolService.getOptions().then((res) => {
        if (Array.isArray(res)) {
          setSymbols(res as any);
        }
      }).catch(() => {});

      if (item) {
        const parsedCoords = parseWktToCoordinates(item.coordinates);
        setCoordinateList(parsedCoords.length > 0 ? parsedCoords : [{ latitude: null, longitude: null }]);

        form.setFieldsValue({
          code: item.code,
          name: item.name,
          portId: item.portId,
          vtsSystemId: item.vtsSystemId,
          orgUnitId: item.orgUnitId,
          provinceId: item.provinceId,
          detailedLocation: item.detailedLocation,
          coverage: item.coverage,
          conditionStatus: item.conditionStatus ?? ConditionStatus.OPERATIONAL,
          note: item.note,
          geometryType: item.geometryType || 'POINT',
          symbolId: item.symbolId,
        });
      } else {
        form.resetFields();
        setCoordinateList([{ latitude: null, longitude: null }]);

        vtsOperationCenterService.generateCode().then((res) => {
          form.setFieldsValue({
            code: res.code,
            conditionStatus: ConditionStatus.OPERATIONAL,
            geometryType: 'POINT',
          });
        }).catch(() => {
          form.setFieldsValue({
            conditionStatus: ConditionStatus.OPERATIONAL,
            geometryType: 'POINT',
          });
        });
      }
      setFileList([]);
    }
  }, [visible, item, form]);

  const updateGpsPoint = (i: number, field: 'lat' | 'lng', dVal: number, mVal: number, sVal: number) => {
    const dMax = field === 'lat' ? 90 : 180;
    const dClamped = Math.min(dMax, Math.max(0, dVal));
    const mClamped = Math.min(59, Math.max(0, mVal));
    const sClamped = Math.min(59.9999, Math.max(0, sVal));
    const decimal = dClamped + mClamped / 60 + sClamped / 3600;
    setCoordinateList((p) => {
      const n = [...p];
      n[i] = { ...n[i], [field === 'lat' ? 'latitude' : 'longitude']: decimal };
      return n;
    });
  };

  const renderDms = (i: number, field: 'lat' | 'lng', record: CoordinateItem) => {
    const v = field === 'lat' ? (record.latitude ?? 0) : (record.longitude ?? 0);
    const dms = ddToDms(v);
    const maxD = field === 'lat' ? 90 : 180;
    return (
      <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
        <InputNumber
          value={dms.d}
          min={0}
          max={maxD}
          precision={0}
          placeholder="Độ"
          controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGpsPoint(i, field, x ?? 0, dms.m, dms.s)}
          style={{ flex: 1 }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span>
        <InputNumber
          value={dms.m}
          min={0}
          max={59}
          precision={0}
          placeholder="Phút"
          controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGpsPoint(i, field, dms.d, x ?? 0, dms.s)}
          style={{ flex: 1 }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span>
        <InputNumber
          value={dms.s}
          min={0}
          max={59.9999}
          step={0.01}
          placeholder="Giây"
          controls={false}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(x) => updateGpsPoint(i, field, dms.d, dms.m, x ?? 0)}
          style={{ flex: 1.2 }}
        />
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span>
      </Space.Compact>
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const currentGeom = values.geometryType || 'POINT';
      const coordsWkt = serializeCoordinatesToWkt(coordinateList, currentGeom);

      const payload: CreateVtsOperationCenterRequest = {
        code: values.code?.trim(),
        name: values.name?.trim(),
        portId: values.portId,
        vtsSystemId: values.vtsSystemId,
        orgUnitId: values.orgUnitId,
        provinceId: values.provinceId,
        detailedLocation: values.detailedLocation?.trim(),
        coverage: values.coverage?.trim(),
        conditionStatus: values.conditionStatus,
        note: values.note?.trim(),
        geometryType: currentGeom,
        symbolId: values.symbolId,
        coordinateSystem: values.coordinateSystem?.trim() || 'WGS 84 / VN-2000',
        displayRule: values.displayRule?.trim() || 'Độ, phút, giây (DMS)',
        coordinates: coordsWkt || undefined,
      };

      let savedId = item?.id;
      if (isEdit && item) {
        await vtsOperationCenterService.update(item.id, payload);
        toast.success('Cập nhật trung tâm điều hành VTS thành công');
      } else {
        const created = await vtsOperationCenterService.create(payload);
        savedId = created.id;
        toast.success('Tạo mới trung tâm điều hành VTS thành công');
      }

      // Upload files if any
      if (savedId && fileList.length > 0) {
        const rawFiles = fileList.map((f) => f.originFileObj as File).filter(Boolean);
        if (rawFiles.length > 0) {
          try {
            await vtsOperationCenterService.uploadAttachments(savedId, rawFiles);
          } catch (e) {
            toast.warning('Đã lưu thông tin nhưng tải tệp đính kèm thất bại');
          }
        }
      }

      onSuccess();
    } catch (err: any) {
      if (err?.errorFields) {
        // Switch tab to first field with error
        const firstField = err.errorFields[0]?.name?.[0];
        if (['code', 'name', 'orgUnitId', 'portId', 'vtsSystemId', 'provinceId', 'conditionStatus', 'detailedLocation'].includes(firstField)) {
          setActiveTab('basic');
        } else if (['coverage', 'note'].includes(firstField)) {
          setActiveTab('other');
        } else if (['geometryType', 'symbolId', 'coordinateSystem', 'displayRule'].includes(firstField)) {
          setActiveTab('gis');
        }
        return;
      }
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const tabItems = [
    {
      key: 'basic',
      label: 'Thông tin cơ bản',
      children: (
        <div style={{ paddingTop: 8 }}>
          {/* Row 1: 1. Đơn vị quản lý & 2. Thuộc cảng biển */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orgUnitId"
                label="Đơn vị quản lý"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <OrgUnitTreeSelect
                  organizations={orgUnits}
                  placeholder="Chọn đơn vị quản lý"
                  style={{ width: '100%', height: 40 }}
                  onChange={(val) => {
                    form.setFieldValue('orgUnitId', val);
                    const curPort = form.getFieldValue('portId');
                    if (curPort && !portOptions.some((p) => p.id === curPort && p.orgUnitId === val)) {
                      form.setFieldValue('portId', undefined);
                    }
                    const curVts = form.getFieldValue('vtsSystemId');
                    if (curVts && !vtsSystems.some((s) => s.id === curVts && s.orgUnitId === val)) {
                      form.setFieldValue('vtsSystemId', undefined);
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="portId"
                label="Thuộc cảng biển"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn cảng biển"
                  options={filteredPortOptions.map((p) => ({ value: p.id, label: p.name }))}
                  style={{ ...selectStyle, borderRadius: radiusPill, height: 40 }}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 2: 3. Thuộc hệ thống VTS & 4. Mã trung tâm điều hành VTS */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vtsSystemId"
                label="Thuộc hệ thống VTS"
                rules={[{ required: true, message: 'Vui lòng chọn hệ thống VTS' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn hệ thống VTS"
                  options={filteredVtsSystems.map((s) => ({ value: s.id, label: s.name }))}
                  style={{ ...selectStyle, borderRadius: radiusPill, height: 40 }}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã trung tâm điều hành VTS"
                rules={[{ required: true, message: 'Vui lòng nhập mã trung tâm' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  disabled
                  placeholder="Mã tự sinh (TTDH-xxxxxx)"
                  style={{ ...inputStyle, borderRadius: radiusPill, height: 40, backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 3: 5. Tên trung tâm điều hành VTS & 6. Địa điểm (Tỉnh/TP) */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên trung tâm điều hành VTS"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên trung tâm' },
                  { max: 255, message: 'Tên trung tâm tối đa 255 ký tự' },
                ]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="Nhập tên trung tâm điều hành VTS"
                  maxLength={255}
                  showCount
                  style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="provinceId"
                label="Địa điểm (Tỉnh/TP)"
                rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành phố' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn Tỉnh/Thành phố"
                  options={VIETNAM_PROVINCE_OPTIONS}
                  style={{ ...selectStyle, borderRadius: radiusPill, height: 40 }}
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 4: 7. Địa điểm chi tiết & 8. Tình trạng */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="detailedLocation"
                label="Địa điểm chi tiết"
                rules={[{ max: 500, message: 'Địa điểm chi tiết tối đa 500 ký tự' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="Nhập địa điểm chi tiết (số nhà, đường, xã/phường...)"
                  maxLength={500}
                  showCount
                  style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="conditionStatus"
                label="Tình trạng"
                rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn tình trạng"
                  options={CONDITION_STATUS_OPTIONS}
                  style={{ ...selectStyle, borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'other',
      label: 'Thông tin khác',
      children: (
        <div style={{ paddingTop: 8 }}>
          <Form.Item
            name="coverage"
            label="Vùng phủ sóng"
            rules={[{ max: 255, message: 'Vùng phủ sóng tối đa 255 ký tự' }]}
            style={{ marginBottom: spaceFormField }}
          >
            <Input.TextArea
              rows={3}
              placeholder="Mô tả phạm vi hoặc vùng phủ sóng của trung tâm điều hành VTS"
              maxLength={255}
              showCount
              style={{ borderRadius: radiusMd }}
            />
          </Form.Item>

          <Form.Item
            name="note"
            label="Ghi chú"
            rules={[{ max: 2000, message: 'Ghi chú tối đa 2000 ký tự' }]}
            style={{ marginBottom: spaceFormField }}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập ghi chú thêm nếu có"
              maxLength={2000}
              showCount
              style={{ borderRadius: radiusMd }}
            />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'gis',
      label: 'Vị trí (GIS)',
      children: (
        <div style={{ paddingTop: 8 }}>
          {/* Row 1: 11. Loại đối tượng & 12. Biểu tượng */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="geometryType"
                label="Loại đối tượng"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  options={[
                    { value: 'POINT', label: 'Đối tượng điểm' },
                    { value: 'LINE', label: 'Đối tượng đường' },
                    { value: 'POLYGON', label: 'Đối tượng vùng' },
                  ]}
                  style={{ ...selectStyle, borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="symbolId"
                label="Biểu tượng"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn biểu tượng bản đồ"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  style={{ ...selectStyle, borderRadius: radiusPill, height: 40 }}
                >
                  {symbols.map((sym) => (
                    <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                      <Space>
                        {sym.image && (
                          <img
                            src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                            alt={sym.name}
                            style={{ width: 18, height: 18, objectFit: 'contain' }}
                          />
                        )}
                        <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Row 2: 13. Hệ quy chiếu & 14. Quy tắc hiển thị */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="coordinateSystem"
                label="Hệ quy chiếu"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  disabled
                  defaultValue="WGS 84 / VN-2000"
                  options={[
                    { value: 'WGS 84 / VN-2000', label: 'WGS 84 / VN-2000' },
                    { value: 'WGS-84', label: 'WGS-84' },
                    { value: 'VN-2000', label: 'VN-2000' },
                  ]}
                  style={{ ...selectStyle, borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="displayRule"
                label="Quy tắc hiển thị"
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  disabled
                  defaultValue="Độ, phút, giây (DMS)"
                  style={{ ...inputStyle, borderRadius: radiusPill, height: 40, color: '#8c8c8c', cursor: 'not-allowed', backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Row 3: Tọa độ (LongLatTable / Bảng tọa độ kinh vĩ) */}
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
              Tọa độ
            </span>
            <Space>
              <Button
                type="dashed"
                size="small"
                icon={<EnvironmentOutlined />}
                onClick={() => setMapModalOpen(true)}
                style={{ borderRadius: radiusPill }}
              >
                Chọn vị trí trên bản đồ
              </Button>
              {watchedGeom !== 'POINT' && (
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setCoordinateList((p) => [...p, { latitude: null, longitude: null }])}
                  style={{ borderRadius: radiusPill }}
                >
                  Thêm tọa độ
                </Button>
              )}
            </Space>
          </div>

          {coordinateList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
              <Space>
                <Button
                  type="dashed"
                  icon={<EnvironmentOutlined />}
                  onClick={() => setMapModalOpen(true)}
                  style={{ borderRadius: radiusPill }}
                >
                  Chọn vị trí trên bản đồ
                </Button>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => setCoordinateList([{ latitude: null, longitude: null }])}
                  style={{ borderRadius: radiusPill }}
                >
                  Thêm tọa độ
                </Button>
              </Space>
            </div>
          ) : (
            <Table
              className="list-view-table"
              rowKey="_idx"
              size="small"
              bordered
              pagination={false}
              dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
              scroll={{ x: 600 }}
              columns={[
                {
                  title: 'STT',
                  key: 'stt',
                  width: 60,
                  align: 'center',
                  render: (_: any, __: any, i: number) => (
                    <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>
                  ),
                  onHeaderCell: () => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '10px 8px' } }),
                },
                {
                  title: 'Vĩ độ (N)',
                  key: 'lat',
                  render: (_: any, r: any) => renderDms(r._idx, 'lat', r),
                  onHeaderCell: () => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '10px 8px' } }),
                },
                {
                  title: 'Kinh độ (E)',
                  key: 'lng',
                  render: (_: any, r: any) => renderDms(r._idx, 'lng', r),
                  onHeaderCell: () => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '10px 8px' } }),
                },
                {
                  title: 'Thao tác',
                  key: 'actions',
                  width: 70,
                  align: 'center',
                  render: (_: any, r: any) =>
                    watchedGeom !== 'POINT' || coordinateList.length > 1 ? (
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => setCoordinateList((p) => p.filter((_, idx) => idx !== r._idx))}
                      />
                    ) : null,
                  onHeaderCell: () => ({ style: { background: colors.bodyBg, padding: '10px 6px' } }),
                },
              ]}
            />
          )}

          {/* Modal Bản đồ GIS tương tác */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <EnvironmentOutlined style={{ color: colors.primary }} />
                <span>Chọn vị trí & Tọa độ trên Bản đồ</span>
              </div>
            }
            open={mapModalOpen}
            onCancel={() => setMapModalOpen(false)}
            destroyOnHidden
            centered
            width="90vw"
            style={{ maxWidth: '1400px' }}
            footer={[
              <Button key="close" type="primary" onClick={() => setMapModalOpen(false)} style={{ borderRadius: radiusPill }}>
                Xác nhận & Đóng
              </Button>,
            ]}
          >
            <GisLocationSelector
              inline={true}
              value={{
                geometryType: watchedGeom,
                coordinates: serializeCoordinatesToWkt(coordinateList, watchedGeom),
                symbolId: form.getFieldValue('symbolId'),
              }}
              defaultGeometryType={watchedGeom as any}
              onChange={(val) => {
                if (val?.coordinates) {
                  const pts = parseWktToCoordinates(val.coordinates);
                  if (pts.length > 0) setCoordinateList(pts);
                }
                if (val?.geometryType) {
                  form.setFieldValue('geometryType', val.geometryType);
                }
                if (val?.symbolId) {
                  form.setFieldValue('symbolId', val.symbolId);
                }
              }}
            />
          </Modal>
        </div>
      ),
    },
    {
      key: 'files',
      label: 'File đính kèm',
      children: (
        <div style={{ paddingTop: 8 }}>
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>File đính kèm</span>
            {fileList.length > 0 && (
              <Upload
                beforeUpload={(file) => {
                  if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
                  const ext = file.name.split('.').pop()?.toLowerCase();
                  if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
                    toast.error('Định dạng không hỗ trợ');
                    return false;
                  }
                  setFileList((prev) => [...prev, { uid: `${Date.now()}-${Math.random()}`, name: file.name, originFileObj: file as any }]);
                  return false;
                }}
                showUploadList={false}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                multiple
              >
                <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ borderRadius: radiusPill }}>Thêm file</Button>
              </Upload>
            )}
          </div>

          {fileList.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard, marginBottom: spaceSm }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có file đính kèm.</span>
              <Upload
                beforeUpload={(file) => {
                  if (file.size > 20 * 1024 * 1024) { toast.error('File vượt quá 20MB'); return false; }
                  const ext = file.name.split('.').pop()?.toLowerCase();
                  if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
                    toast.error('Định dạng không hỗ trợ');
                    return false;
                  }
                  setFileList((prev) => [...prev, { uid: `${Date.now()}-${Math.random()}`, name: file.name, originFileObj: file as any }]);
                  return false;
                }}
                showUploadList={false}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                multiple
              >
                <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn file</Button>
              </Upload>
            </div>
          ) : (
            <Table
              className="list-view-table"
              dataSource={fileList.map((f, i) => ({ ...f, _idx: i, key: f.uid || i }))}
              pagination={false}
              size="middle"
              bordered
              scroll={{ x: 400 }}
              style={{ marginBottom: spaceSm }}
            >
              <Table.Column
                title="STT"
                key="stt"
                width={60}
                align="center"
                render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })}
              />
              <Table.Column
                title="Tên file"
                key="fileName"
                dataIndex="name"
                render={(name: string) => (
                  <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
                    <FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />
                    {name}
                  </span>
                )}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })}
              />
              <Table.Column
                title=""
                key="actions"
                width={44}
                align="center"
                render={(_: any, __: any, i: number) => (
                  <Button
                    type="link"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => setFileList((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                )}
                onHeaderCell={() => ({ style: { background: colors.bodyBg, padding: '12px 6px' } })}
              />
            </Table>
          )}

          <div style={{ fontSize: fontSizeSm, color: textTertiary }}>
            Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.
          </div>
        </div>
      ),
    },
  ];

  return (
    <AppDrawer
      title={isEdit ? 'Chỉnh sửa trung tâm điều hành VTS' : 'Thêm mới trung tâm điều hành VTS'}
      open={visible}
      onClose={onCancel}
      onOk={handleSubmit}
      okText={isEdit ? 'Cập nhật' : 'Tạo mới'}
      okLoading={submitting}
    >
      <Form form={form} layout="vertical">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginTop: -8 }}
        />
      </Form>
    </AppDrawer>
  );
};

export default VtsOperationCenterFormModal;
