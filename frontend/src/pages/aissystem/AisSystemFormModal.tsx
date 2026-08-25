import React, { useEffect, useState, useMemo } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Upload,
  Button,
  Tabs,
  Table,
  Space,
  Modal,
  DatePicker,
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import { OrgUnitTreeSelect, normalizeSearchText } from '../../components/org-unit';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { CONDITION_STATUS_OPTIONS, ConditionStatus } from '../../types/vtsSystem';
import { UNIT_OF_MEASURE_OPTIONS, UnitOfMeasure } from '../../types/aisSystem';
import type {
  AisSystemResponse,
  CreateAisSystemRequest,
  AisSystemAttachment,
} from '../../types/aisSystem';
import { aisSystemService } from '../../services/aisSystemService';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { organizationService } from '../../services/organizationService';
import { symbolService, type Symbol as GisSymbol } from '../../services/symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import toast from '../../components/ToastNotification';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { colors } from '../../theme';
import {
  spaceFormField,
  spaceSm,
  spaceMd,
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

interface AisSystemFormModalProps {
  visible: boolean;
  item?: AisSystemResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
  orgUnits?: any[];
  opCenters?: { id: string; name: string; orgUnitId?: string }[];
}

export const AisSystemFormModal: React.FC<AisSystemFormModalProps> = ({
  visible,
  item,
  onCancel,
  onSuccess,
  orgUnits: propOrgUnits,
  opCenters: propOpCenters,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [submitting, setSubmitting] = useState(false);
  const [orgUnits, setOrgUnits] = useState<any[]>(propOrgUnits || []);
  const [opCenters, setOpCenters] = useState<{ id: string; name: string; orgUnitId?: string }[]>(propOpCenters || []);
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<CoordinateItem[]>([{ latitude: null, longitude: null }]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<AisSystemAttachment[]>([]);

  const isEdit = !!item;
  const formOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedGeom = Form.useWatch('geometryType', form) || 'POINT';

  useEffect(() => {
    if (propOrgUnits && propOrgUnits.length > 0) setOrgUnits(propOrgUnits);
    if (propOpCenters && propOpCenters.length > 0) setOpCenters(propOpCenters);
  }, [propOrgUnits, propOpCenters]);

  const filteredOpCenters = useMemo(() => {
    if (!formOrgUnitId) return opCenters;
    return opCenters.filter((c) => c.orgUnitId === formOrgUnitId);
  }, [opCenters, formOrgUnitId]);

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

      // 2. Load Operation Centers for dropdown if not provided
      if (!propOpCenters || propOpCenters.length === 0) {
        vtsOperationCenterService.getOptions().then((res) => {
          if (Array.isArray(res)) {
            setOpCenters(res.map((c) => ({ id: c.id, name: c.name, orgUnitId: c.orgUnitId })));
          }
        }).catch(() => {});
      }

      // 3. Load Symbols
      symbolService.list().then((syms) => {
        if (Array.isArray(syms)) setSymbols(syms);
      }).catch(() => {});

      if (item) {
        form.setFieldsValue({
          code: item.code,
          name: item.name,
          vtsOperationCenterId: item.vtsOperationCenterId,
          operatingOrgId: item.operatingOrgId,
          orgUnitId: item.orgUnitId,
          provinceId: item.provinceId,
          unitOfMeasure: item.unitOfMeasure ?? UnitOfMeasure.SET,
          quantity: item.quantity ?? 1,
          model: item.model,
          manufacturer: item.manufacturer,
          commissioningYear: item.commissioningYear ? dayjs(String(item.commissioningYear), 'YYYY') : null,
          conditionStatus: item.conditionStatus ?? ConditionStatus.OPERATIONAL,
          detailedLocation: item.detailedLocation,
          specifications: item.specifications,
          maintenanceInfo: item.maintenanceInfo,
          note: item.note,
          geometryType: item.geometryType || 'POINT',
          symbolId: item.symbolId || undefined,
        });

        const parsedCoords = parseWktToCoordinates(item.coordinates);
        setCoordinateList(parsedCoords.length > 0 ? parsedCoords : [{ latitude: null, longitude: null }]);

        aisSystemService.listAttachments(item.id).then((atts) => {
          setExistingAttachments(atts || []);
        }).catch(() => {});
      } else {
        form.resetFields();
        setExistingAttachments([]);
        setCoordinateList([{ latitude: null, longitude: null }]);
        aisSystemService.generateCode().then((res) => {
          form.setFieldsValue({
            code: res.code,
            conditionStatus: ConditionStatus.OPERATIONAL,
            unitOfMeasure: UnitOfMeasure.SET,
            quantity: 1,
            geometryType: 'POINT',
          });
        }).catch(() => {
          form.setFieldsValue({
            conditionStatus: ConditionStatus.OPERATIONAL,
            unitOfMeasure: UnitOfMeasure.SET,
            quantity: 1,
            geometryType: 'POINT',
          });
        });
      }
      setFileList([]);
    }
  }, [visible, item, form]);

  const handleAddCoordinateRow = () => {
    setCoordinateList([...coordinateList, { latitude: null, longitude: null }]);
  };

  const handleRemoveCoordinateRow = (index: number) => {
    if (coordinateList.length <= 1) {
      setCoordinateList([{ latitude: null, longitude: null }]);
      return;
    }
    setCoordinateList(coordinateList.filter((_, i) => i !== index));
  };

  const handleCoordinateChange = (index: number, field: 'latitude' | 'longitude', value: number | null) => {
    const next = [...coordinateList];
    next[index] = { ...next[index], [field]: value };
    setCoordinateList(next);
  };

  const handleDmsChange = (
    index: number,
    field: 'latitude' | 'longitude',
    part: 'd' | 'm' | 's',
    val: number | null
  ) => {
    const cur = ddToDms(coordinateList[index]?.[field]);
    const nextDms = { ...cur, [part]: val || 0 };
    const dd = nextDms.d + nextDms.m / 60 + nextDms.s / 3600;
    handleCoordinateChange(index, field, parseFloat(dd.toFixed(6)));
  };

  const handleDeleteExistingAttachment = async (attId: string) => {
    if (!item?.id) return;
    try {
      await aisSystemService.deleteAttachment(item.id, attId);
      setExistingAttachments((prev) => prev.filter((a) => a.id !== attId));
      toast.success('Đã xóa tệp đính kèm');
    } catch {
      toast.error('Xóa tệp thất bại');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const geomType = values.geometryType || 'POINT';
      const wkt = serializeCoordinatesToWkt(coordinateList, geomType);

      const commYear = values.commissioningYear
        ? typeof values.commissioningYear === 'number'
          ? values.commissioningYear
          : values.commissioningYear.year()
        : undefined;

      const payload: CreateAisSystemRequest = {
        code: values.code?.trim(),
        name: values.name?.trim(),
        vtsOperationCenterId: values.vtsOperationCenterId,
        operatingOrgId: values.operatingOrgId,
        orgUnitId: values.orgUnitId,
        provinceId: values.provinceId,
        detailedLocation: values.detailedLocation?.trim(),
        unitOfMeasure: values.unitOfMeasure,
        quantity: values.quantity,
        model: values.model?.trim(),
        specifications: values.specifications?.trim(),
        manufacturer: values.manufacturer?.trim(),
        commissioningYear: commYear,
        conditionStatus: values.conditionStatus,
        maintenanceInfo: values.maintenanceInfo?.trim(),
        note: values.note?.trim(),
        geometryType: geomType,
        symbolId: values.symbolId,
        coordinates: wkt || undefined,
      };

      let savedId = item?.id;
      if (isEdit && item) {
        await aisSystemService.update(item.id, payload);
        toast.success('Cập nhật hệ thống AIS thành công');
      } else {
        const created = await aisSystemService.create(payload);
        savedId = created.id;
        toast.success('Tạo mới hệ thống AIS thành công');
      }

      // Upload files if any
      if (savedId && fileList.length > 0) {
        const rawFiles = fileList.map((f) => f.originFileObj as File).filter(Boolean);
        if (rawFiles.length > 0) {
          try {
            await aisSystemService.uploadAttachments(savedId, rawFiles);
          } catch (e) {
            toast.warning('Đã lưu thông tin nhưng tải tệp đính kèm thất bại');
          }
        }
      }

      onSuccess();
    } catch (err: any) {
      if (err?.errorFields) {
        toast.warning('Vui lòng kiểm tra lại các trường bắt buộc');
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
        <div style={{ marginTop: 12 }}>
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
                    const curOp = form.getFieldValue('vtsOperationCenterId');
                    if (curOp && !opCenters.some((c) => c.id === curOp && c.orgUnitId === val)) {
                      form.setFieldValue('vtsOperationCenterId', undefined);
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vtsOperationCenterId"
                label="Thuộc TTDH VTS / Trạm Radar"
                rules={[{ required: true, message: 'Vui lòng chọn TTDH VTS / Trạm Radar' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn TTDH VTS / Trạm Radar"
                  options={filteredOpCenters.map((c) => ({ value: c.id, label: c.name }))}
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="operatingOrgId"
                label="Đơn vị khai thác"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị khai thác' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <OrgUnitTreeSelect
                  organizations={orgUnits}
                  placeholder="Chọn đơn vị khai thác"
                  style={{ width: '100%', height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã thiết bị"
                rules={[{ required: true, message: 'Vui lòng nhập mã thiết bị' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="Mã thiết bị tự sinh"
                  disabled={!isEdit}
                  style={{ ...inputStyle, borderRadius: radiusPill, height: 40, background: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên thiết bị"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên thiết bị' },
                  { max: 255, message: 'Tên thiết bị tối đa 255 ký tự' },
                ]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input placeholder="Nhập tên thiết bị AIS" maxLength={255} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="provinceId"
                label="Địa điểm (Tỉnh/TP)"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn Tỉnh/TP"
                  options={VIETNAM_PROVINCE_OPTIONS}
                  style={{ ...selectStyle, borderRadius: radiusPill, height: 40 }}
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                  }
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="detailedLocation"
                label="Địa điểm chi tiết"
                rules={[{ max: 500, message: 'Địa điểm chi tiết tối đa 500 ký tự' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="unitOfMeasure"
                label="Đơn vị tính"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị tính' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn ĐVT"
                  options={UNIT_OF_MEASURE_OPTIONS}
                  style={{ ...selectStyle, borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="quantity"
                label="Số lượng"
                rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={1}
                  placeholder="Số lượng"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="commissioningYear" label="Năm đưa vào sử dụng" style={{ marginBottom: spaceFormField }}>
                <DatePicker
                  picker="year"
                  placeholder="Chọn năm sử dụng"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
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
      key: 'device',
      label: 'Thông tin thiết bị',
      children: (
        <div style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="model"
                label="Model"
                rules={[{ max: 100, message: 'Model tối đa 100 ký tự' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input placeholder="Nhập model" maxLength={100} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="manufacturer"
                label="Hãng sản xuất"
                rules={[{ max: 255, message: 'Hãng sản xuất tối đa 255 ký tự' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input placeholder="Nhập hãng sản xuất" maxLength={255} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="specifications"
                label="Thông số kỹ thuật"
                rules={[{ max: 1000, message: 'Thông số kỹ thuật tối đa 1000 ký tự' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input.TextArea rows={3} placeholder="Nhập thông số kỹ thuật" maxLength={1000} showCount style={{ borderRadius: radiusMd }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maintenanceInfo"
                label="Thông tin bảo trì"
                rules={[{ max: 2000, message: 'Thông tin bảo trì tối đa 2000 ký tự' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input.TextArea rows={3} placeholder="Nhập thông tin bảo trì" maxLength={2000} showCount style={{ borderRadius: radiusMd }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="note"
            label="Ghi chú"
            rules={[{ max: 2000, message: 'Ghi chú tối đa 2000 ký tự' }]}
            style={{ marginBottom: spaceFormField }}
          >
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" maxLength={2000} showCount style={{ borderRadius: radiusMd }} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'gis',
      label: 'Vị trí (GIS)',
      children: (
        <div style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="geometryType"
                label="Loại đối tượng"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  options={[
                    { value: 'POINT', label: 'Điểm (Point)' },
                    { value: 'LINE', label: 'Đường (LineString)' },
                    { value: 'POLYGON', label: 'Vùng (Polygon)' },
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
                  placeholder="Chọn biểu tượng"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                  }
                  options={symbols.map((s) => ({ value: s.id, label: s.name }))}
                  style={{ ...selectStyle, borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Hệ quy chiếu" style={{ marginBottom: spaceFormField }}>
                <Input value="WGS 84 (EPSG:4326) / VN-2000" disabled style={{ ...inputStyle, borderRadius: radiusPill, height: 40, background: '#f5f5f5' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Quy tắc hiển thị" style={{ marginBottom: spaceFormField }}>
                <Input value="Độ, phút, giây (DMS)" disabled style={{ ...inputStyle, borderRadius: radiusPill, height: 40, background: '#f5f5f5' }} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spaceSm, marginTop: spaceSm }}>
            <span style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd }}>
              Danh sách tọa độ
            </span>
            <Space>
              <Button
                type="primary"
                ghost
                icon={<EnvironmentOutlined />}
                onClick={() => setMapModalOpen(true)}
                style={{ borderRadius: radiusPill }}
              >
                Chọn từ bản đồ
              </Button>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddCoordinateRow}
                style={{ borderRadius: radiusPill }}
              >
                Thêm điểm
              </Button>
            </Space>
          </div>

          <Table
            dataSource={coordinateList}
            rowKey={(_, idx) => String(idx)}
            pagination={false}
            size="small"
            bordered
            columns={[
              {
                title: 'STT',
                width: 50,
                align: 'center' as const,
                render: (_: any, __: any, index: number) => index + 1,
              },
              {
                title: 'Vĩ độ (Latitude - N)',
                render: (_: any, row: CoordinateItem, index: number) => {
                  const dms = ddToDms(row.latitude);
                  return (
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <InputNumber
                        value={row.latitude}
                        onChange={(val) => handleCoordinateChange(index, 'latitude', val)}
                        placeholder="Vĩ độ (DD.dddddd)"
                        style={{ width: '100%', borderRadius: radiusPill }}
                        step={0.000001}
                      />
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: fontSizeSm, color: textSecondary }}>
                        <span>DMS:</span>
                        <InputNumber
                          value={dms.d}
                          onChange={(v) => handleDmsChange(index, 'latitude', 'd', v)}
                          style={{ width: 45 }}
                          size="small"
                        />
                        <span>°</span>
                        <InputNumber
                          value={dms.m}
                          onChange={(v) => handleDmsChange(index, 'latitude', 'm', v)}
                          style={{ width: 45 }}
                          size="small"
                        />
                        <span>'</span>
                        <InputNumber
                          value={dms.s}
                          onChange={(v) => handleDmsChange(index, 'latitude', 's', v)}
                          style={{ width: 60 }}
                          size="small"
                        />
                        <span>" N</span>
                      </div>
                    </Space>
                  );
                },
              },
              {
                title: 'Kinh độ (Longitude - E)',
                render: (_: any, row: CoordinateItem, index: number) => {
                  const dms = ddToDms(row.longitude);
                  return (
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <InputNumber
                        value={row.longitude}
                        onChange={(val) => handleCoordinateChange(index, 'longitude', val)}
                        placeholder="Kinh độ (DD.dddddd)"
                        style={{ width: '100%', borderRadius: radiusPill }}
                        step={0.000001}
                      />
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: fontSizeSm, color: textSecondary }}>
                        <span>DMS:</span>
                        <InputNumber
                          value={dms.d}
                          onChange={(v) => handleDmsChange(index, 'longitude', 'd', v)}
                          style={{ width: 45 }}
                          size="small"
                        />
                        <span>°</span>
                        <InputNumber
                          value={dms.m}
                          onChange={(v) => handleDmsChange(index, 'longitude', 'm', v)}
                          style={{ width: 45 }}
                          size="small"
                        />
                        <span>'</span>
                        <InputNumber
                          value={dms.s}
                          onChange={(v) => handleDmsChange(index, 'longitude', 's', v)}
                          style={{ width: 60 }}
                          size="small"
                        />
                        <span>" E</span>
                      </div>
                    </Space>
                  );
                },
              },
              {
                title: '',
                width: 50,
                align: 'center' as const,
                render: (_: any, __: any, index: number) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveCoordinateRow(index)}
                  />
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'attachment',
      label: 'File đính kèm',
      children: (
        <div style={{ marginTop: 12 }}>
          {existingAttachments.length > 0 && (
            <div style={{ marginBottom: spaceMd }}>
              <div style={{ fontWeight: fontWeightBold, color: textPrimary, marginBottom: spaceSm }}>
                Tệp đính kèm hiện có ({existingAttachments.length})
              </div>
              <Table
                dataSource={existingAttachments}
                rowKey="id"
                pagination={false}
                size="small"
                bordered
                columns={[
                  {
                    title: 'STT',
                    width: 50,
                    align: 'center' as const,
                    render: (_: any, __: any, idx: number) => idx + 1,
                  },
                  {
                    title: 'Tên tệp',
                    dataIndex: 'fileName',
                    render: (t: string) => (
                      <Space>
                        <FileOutlined style={{ color: colors.sidebarBg }} />
                        <span>{t}</span>
                      </Space>
                    ),
                  },
                  {
                    title: 'Dung lượng',
                    dataIndex: 'fileSize',
                    width: 120,
                    render: (bytes: number) => {
                      if (!bytes) return '—';
                      if (bytes < 1024) return `${bytes} B`;
                      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                    },
                  },
                  {
                    title: 'Thao tác',
                    width: 80,
                    align: 'center' as const,
                    render: (_: any, row: AisSystemAttachment) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteExistingAttachment(row.id)}
                      />
                    ),
                  },
                ]}
              />
            </div>
          )}

          <Form.Item label="Thêm tệp đính kèm mới" style={{ marginBottom: spaceFormField }}>
            <Upload
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setFileList(fileList)}
              multiple
            >
              <Button icon={<UploadOutlined />} style={{ borderRadius: radiusPill, height: 40 }}>
                Chọn tệp đính kèm
              </Button>
            </Upload>
            <div style={{ fontSize: fontSizeSm, color: textTertiary, marginTop: 4 }}>
              Hỗ trợ PDF, DOCX, XLSX, PNG, JPG tối đa 50MB
            </div>
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <>
      <AppDrawer
        title={isEdit ? 'Chỉnh sửa hệ thống AIS' : 'Thêm mới hệ thống AIS'}
        open={visible}
        onClose={onCancel}
        onOk={handleSubmit}
        okText={isEdit ? 'Cập nhật' : 'Tạo mới'}
        okLoading={submitting}
        size="50%"
      >
        <Form form={form} layout="vertical">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            type="card"
          />
        </Form>
      </AppDrawer>

      {/* Modal Chọn từ bản đồ */}
      <Modal
        title="Chọn vị trí tọa độ trên bản đồ"
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
    </>
  );
};

export default AisSystemFormModal;
