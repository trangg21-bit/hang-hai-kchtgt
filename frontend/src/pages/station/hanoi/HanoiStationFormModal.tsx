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
  InboxOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../../components/org-unit';
import { VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import { CONDITION_STATUS_OPTIONS } from '../../../types/vtsSystem';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import { organizationService } from '../../../services/organizationService';
import { symbolService, type Symbol as GisSymbol } from '../../../services/symbolService';
import GisLocationSelector from '../../../components/gis/GisLocationSelector';
import toast from '../../../components/ToastNotification';
import { useAuthStore } from '../../../store/authStore';
import { AppDrawer } from '../../../components/shared/AppDrawer';
import { hanoiStationService } from '../../../services/hanoiStationService';
import type { HanoiStationItem, CreateHanoiStationRequest } from '../../../types/hanoiStation';
import { colors } from '../../../theme';
import {
  spaceFormField,
  formFieldStyle,
  formRowGutter,
  spaceSm,
  spaceMd,
  radiusPill,
  radiusMd,
  inputStyle,
  selectStyle,
  textAreaStyle,
  readonlyInputStyle,
  formTreeSelectStyle,
  drawerTabsStyle,
  drawerTabBarStyle,
  drawerTabContentStyle,
  ATTACHMENT_HELPER_TEXT,
  uploadHintStyle,
  borderDefault,
  surfaceCard,
  textTertiary,
  textSecondary,
  textPrimary,
  fontSizeMd,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  statusOperational,
  outlineButtonStyle,
  primaryButtonStyle,
  actionPrimary,
} from '../../../tokens';

interface CoordinateItem {
  latitude: number | null;
  longitude: number | null;
}

export const GEOMETRY_POINT_COUNT: Record<string, number> = {
  POINT: 1,
  LINE: 2,
  POLYGON: 3,
};

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

interface AttachmentItem {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  type: string;
}

export interface HanoiStationFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: HanoiStationItem | null;
  onCancel: () => void;
  onSuccess: (savedItem: HanoiStationItem) => void;
}

export const HanoiStationFormModal: React.FC<HanoiStationFormModalProps> = ({
  open,
  mode,
  initialData,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Form states
  const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string | undefined>();
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [geometryType, setGeometryType] = useState<string>('POINT');
  const [coordinates, setCoordinates] = useState<CoordinateItem[]>([{ latitude: null, longitude: null }]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    symbolService.getAll().then((data) => {
      if (Array.isArray(data)) setSymbols(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setSelectedOrgUnitId(initialData.orgUnitId);
        setGeometryType(initialData.geometryType || 'POINT');
        const parsedCoords = parseWktToCoordinates(initialData.coordinates);
        if (parsedCoords.length > 0) {
          setCoordinates(parsedCoords);
        } else if (initialData.latitude != null && initialData.longitude != null) {
          setCoordinates([{ latitude: initialData.latitude, longitude: initialData.longitude }]);
        } else {
          setCoordinates([{ latitude: null, longitude: null }]);
        }

        form.setFieldsValue({
          orgUnitId: initialData.orgUnitId,
          operatingOrgId: initialData.operatingOrgId,
          provinceId: initialData.provinceId,
          code: initialData.code,
          name: initialData.name,
          locationAddress: initialData.locationAddress,
          conditionStatus: initialData.conditionStatus || 'OPERATIONAL',
          portName: initialData.portName,
          district: initialData.district,
          ward: initialData.ward,
          operationalLicense: initialData.operationalLicense,
          licenseExpiry: initialData.licenseExpiry,
          inspectorName: initialData.inspectorName,
          inspectorPhone: initialData.inspectorPhone,
          lastInspectionDate: initialData.lastInspectionDate ? dayjs(initialData.lastInspectionDate) : undefined,
          nextInspectionDate: initialData.nextInspectionDate ? dayjs(initialData.nextInspectionDate) : undefined,
          coverageArea: initialData.coverageArea,
          equipmentType: initialData.equipmentType,
          communicationFrequency: initialData.communicationFrequency,
          servicesProvided: initialData.servicesProvided,
          description: initialData.description,
          contactPerson: initialData.contactPerson,
          contactPhone: initialData.contactPhone,
          geometryType: initialData.geometryType || 'POINT',
          symbol: initialData.symbol,
          coordinateSystem: initialData.coordinateSystem || 'WGS84',
          displayRule: initialData.displayRule,
        });
      } else {
        const defaultOrg = user?.orgUnitId || undefined;
        setSelectedOrgUnitId(defaultOrg);
        setGeometryType('POINT');
        setCoordinates([{ latitude: null, longitude: null }]);
        setAttachments([]);

        hanoiStationService.search({ size: 1 }).then(() => {
          form.setFieldsValue({
            orgUnitId: defaultOrg,
            conditionStatus: 'OPERATIONAL',
            geometryType: 'POINT',
            coordinateSystem: 'WGS84',
            provinceId: 1, // Default Hà Nội
          });
        }).catch(() => {});
      }
    }
  }, [open, mode, initialData, form, user]);

  // Load operating orgs
  useEffect(() => {
    organizationService.getAll().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setOperatingOrgs(data.map((o) => ({ id: o.id, name: o.name })));
      } else {
        setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS);
      }
    }).catch(() => {
      setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS);
    });
  }, []);

  const handleOrgUnitChange = (val?: string) => {
    setSelectedOrgUnitId(val);
    form.setFieldsValue({ orgUnitId: val });
  };

  const handleCoordinateChange = (index: number, field: 'latitude' | 'longitude', val: number | null) => {
    const updated = [...coordinates];
    updated[index] = { ...updated[index], [field]: val };
    setCoordinates(updated);
  };

  const handleAddCoordinate = () => {
    setCoordinates([...coordinates, { latitude: null, longitude: null }]);
  };

  const handleRemoveCoordinate = (index: number) => {
    if (coordinates.length <= 1) return;
    const updated = coordinates.filter((_, idx) => idx !== index);
    setCoordinates(updated);
  };

  const handleFileUpload = (file: File) => {
    const newAtt: AttachmentItem = {
      id: String(Date.now()),
      name: file.name,
      size: file.size,
      uploadDate: dayjs().format('DD/MM/YYYY HH:mm'),
      type: file.type || 'unknown',
    };
    setAttachments((prev) => [newAtt, ...prev]);
    toast.success('Đã đính kèm tệp: ' + file.name);
    return false;
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    toast.info('Đã xóa tệp đính kèm');
  };

  const handleSave = async (submitAction: 'DRAFT' | 'SUBMIT') => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const wkt = serializeCoordinatesToWkt(coordinates, geometryType);
      const firstCoord = coordinates[0];

      const payload: CreateHanoiStationRequest = {
        orgUnitId: values.orgUnitId,
        operatingOrgId: values.operatingOrgId,
        provinceId: values.provinceId,
        code: values.code,
        name: values.name?.trim(),
        locationAddress: values.locationAddress?.trim(),
        conditionStatus: values.conditionStatus,
        portName: values.portName?.trim(),
        district: values.district?.trim(),
        ward: values.ward?.trim(),
        operationalLicense: values.operationalLicense?.trim(),
        licenseExpiry: values.licenseExpiry?.trim(),
        inspectorName: values.inspectorName?.trim(),
        inspectorPhone: values.inspectorPhone?.trim(),
        lastInspectionDate: values.lastInspectionDate ? dayjs(values.lastInspectionDate).format('YYYY-MM-DD') : undefined,
        nextInspectionDate: values.nextInspectionDate ? dayjs(values.nextInspectionDate).format('YYYY-MM-DD') : undefined,
        coverageArea: values.coverageArea?.trim(),
        equipmentType: values.equipmentType?.trim(),
        communicationFrequency: values.communicationFrequency?.trim(),
        servicesProvided: values.servicesProvided?.trim(),
        description: values.description?.trim(),
        contactPerson: values.contactPerson?.trim(),
        contactPhone: values.contactPhone?.trim(),
        geometryType: values.geometryType || 'POINT',
        symbol: values.symbol,
        coordinateSystem: values.coordinateSystem || 'WGS84',
        displayRule: values.displayRule,
        latitude: firstCoord?.latitude ?? undefined,
        longitude: firstCoord?.longitude ?? undefined,
        coordinates: wkt,
      };

      let result: HanoiStationItem;
      if (mode === 'edit' && initialData) {
        result = await hanoiStationService.update(initialData.id, payload);
        if (submitAction === 'SUBMIT') {
          result = await hanoiStationService.submit(initialData.id);
        }
        toast.success(submitAction === 'SUBMIT' ? 'Đã lưu và gửi phê duyệt Đài TTXLTT thành công!' : 'Đã cập nhật Đài TTXLTT thành công!');
      } else {
        result = await hanoiStationService.create(payload, submitAction);
        toast.success(submitAction === 'SUBMIT' ? 'Đã tạo và gửi phê duyệt Đài TTXLTT thành công!' : 'Đã lưu tạm Đài TTXLTT thành công!');
      }

      onSuccess(result);
    } catch (err: any) {
      if (err.errorFields) {
        toast.error('Vui lòng kiểm tra lại các trường bắt buộc');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Lỗi khi lưu dữ liệu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const attachmentColumns = [
    {
      title: 'Tên file',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <FileOutlined style={{ color: actionPrimary }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Kích thước',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (bytes: number) => (bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : '—'),
    },
    {
      title: 'Ngày tải lên',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      width: 160,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: AttachmentItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteAttachment(record.id)}
        />
      ),
    },
  ];

  return (
    <AppDrawer
      open={open}
      title={mode === 'create' ? 'Thêm mới Đài TTXLTT Hà Nội' : `Chỉnh sửa: ${initialData?.name || 'Đài TTXLTT'}`}
      onClose={onCancel}
      size="50%"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spaceSm }}>
          <Button style={outlineButtonStyle} onClick={onCancel}>
            Hủy
          </Button>
          <Button
            style={outlineButtonStyle}
            loading={submitting}
            onClick={() => handleSave('DRAFT')}
          >
            Lưu tạm
          </Button>
          <Button
            type="primary"
            style={primaryButtonStyle}
            loading={submitting}
            onClick={() => handleSave('SUBMIT')}
          >
            Lưu và gửi duyệt
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ conditionStatus: 'OPERATIONAL', geometryType: 'POINT', coordinateSystem: 'WGS84', provinceId: 1 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={drawerTabsStyle}
          items={[
            {
              key: 'general',
              label: 'Thông tin chung',
              children: (
                <div style={drawerTabContentStyle}>
                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="orgUnitId"
                        label="Đơn vị quản lý"
                        rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <OrgUnitTreeSelect
                          placeholder="Chọn đơn vị quản lý"
                          value={selectedOrgUnitId}
                          onChange={handleOrgUnitChange}
                          allowClear={false}
                          style={formTreeSelectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="operatingOrgId"
                        label="Đơn vị khai thác"
                        rules={[{ required: true, message: 'Vui lòng chọn đơn vị khai thác' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          showSearch
                          placeholder="Chọn đơn vị khai thác"
                          filterOption={(input, option) =>
                            normalizeSearchText(option?.label as string).includes(normalizeSearchText(input))
                          }
                          options={operatingOrgs.map((o) => ({ value: o.id, label: o.name }))}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="code"
                        label="Mã đài TTXLTT"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input
                          placeholder="Hệ thống tự sinh (TTXLTT-xxxx)"
                          disabled
                          style={readonlyInputStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="name"
                        label="Tên đài TTXLTT"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đài TTXLTT' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Nhập tên đài / trung tâm thông tin" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="provinceId"
                        label="Địa điểm (Tỉnh/Thành phố)"
                        rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành phố' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          showSearch
                          placeholder="Chọn Tỉnh/Thành phố"
                          filterOption={(input, option) =>
                            normalizeSearchText(option?.label as string).includes(normalizeSearchText(input))
                          }
                          options={VIETNAM_PROVINCE_OPTIONS}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="conditionStatus"
                        label="Tình trạng hoạt động"
                        rules={[{ required: true, message: 'Vui lòng chọn tình trạng hoạt động' }]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn tình trạng"
                          options={CONDITION_STATUS_OPTIONS}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={24}>
                      <Form.Item
                        name="locationAddress"
                        label="Địa chỉ chi tiết"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Nhập số nhà, tên đường, địa điểm đặt đài" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="coverageArea"
                        label="Vùng phủ sóng"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Ví dụ: Toàn bộ vùng biển và luồng hàng hải Việt Nam" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="servicesProvided"
                        label="Dịch vụ cung cấp"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Ví dụ: DSC, RTP, MSI NAVTEX, LRIT, Kết nối TT" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={24}>
                      <Form.Item
                        name="description"
                        label="Ghi chú / Mô tả chức năng"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Nhập thông tin mô tả chi tiết"
                          style={textAreaStyle}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'equipment',
              label: 'Thông tin thiết bị & Kiểm định',
              children: (
                <div style={drawerTabContentStyle}>
                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="portName"
                        label="Khu vực / Cảng biển phục vụ"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Ví dụ: Khu vực Hà Nội / Hải Phòng / Toàn quốc" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="equipmentType"
                        label="Loại trang thiết bị xử lý thông tin"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Ví dụ: Hệ thống máy chủ xử lý dữ liệu tập trung" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="communicationFrequency"
                        label="Tần số liên lạc"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Ví dụ: VHF CH16, 70 DSC, MF/HF" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="operationalLicense"
                        label="Số giấy phép hoạt động"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Ví dụ: GP-TTXLTT-HN-2024/01" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="licenseExpiry"
                        label="Hạn giấy phép"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Ví dụ: 31/12/2029" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="inspectorName"
                        label="Cán bộ kiểm tra / kiểm định"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Họ và tên cán bộ kiểm tra" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="inspectorPhone"
                        label="SĐT cán bộ kiểm tra"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Số điện thoại" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="lastInspectionDate"
                        label="Ngày kiểm định gần nhất"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <DatePicker
                          format="DD/MM/YYYY"
                          style={{ ...inputStyle, width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="nextInspectionDate"
                        label="Ngày kiểm định tiếp theo"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <DatePicker
                          format="DD/MM/YYYY"
                          style={{ ...inputStyle, width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="contactPerson"
                        label="Người liên hệ"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Họ tên người liên hệ" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="contactPhone"
                        label="Số điện thoại liên hệ"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Số điện thoại" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'location',
              label: 'Thông tin vị trí',
              children: (
                <div style={drawerTabContentStyle}>
                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="geometryType"
                        label="Loại đối tượng hình học"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          options={[
                            { value: 'POINT', label: 'Đối tượng điểm (Point)' },
                            { value: 'LINE', label: 'Đối tượng đường (Line)' },
                            { value: 'POLYGON', label: 'Đối tượng vùng (Polygon)' },
                          ]}
                          onChange={(val) => {
                            setGeometryType(val);
                            const minCount = GEOMETRY_POINT_COUNT[val] || 1;
                            if (coordinates.length < minCount) {
                              const extra = Array.from({ length: minCount - coordinates.length }, () => ({
                                latitude: null,
                                longitude: null,
                              }));
                              setCoordinates([...coordinates, ...extra]);
                            }
                          }}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="symbol"
                        label="Ký hiệu GIS"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          showSearch
                          placeholder="Chọn ký hiệu bản đồ"
                          allowClear
                          filterOption={(input, option) =>
                            normalizeSearchText(option?.label as string).includes(normalizeSearchText(input))
                          }
                          options={symbols.map((s) => ({ value: s.id, label: s.name }))}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={formRowGutter}>
                    <Col span={12}>
                      <Form.Item
                        name="coordinateSystem"
                        label="Hệ tọa độ"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          options={[
                            { value: 'WGS84', label: 'WGS84 (Độ thập phân)' },
                            { value: 'VN2000', label: 'VN2000' },
                          ]}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="displayRule"
                        label="Quy tắc hiển thị"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input placeholder="Mặc định" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div style={{ marginBottom: spaceMd }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spaceSm }}>
                      <span style={{ fontWeight: fontWeightMedium, color: textPrimary }}>Danh sách tọa độ (WGS84):</span>
                      <Space>
                        <Button
                          icon={<EnvironmentOutlined />}
                          style={outlineButtonStyle}
                          onClick={() => setIsMapModalOpen(true)}
                        >
                          Chọn trên bản đồ
                        </Button>
                        {geometryType !== 'POINT' && (
                          <Button
                            icon={<PlusOutlined />}
                            style={outlineButtonStyle}
                            onClick={handleAddCoordinate}
                          >
                            Thêm điểm
                          </Button>
                        )}
                      </Space>
                    </div>

                    {coordinates.map((coord, idx) => {
                      const latDms = ddToDms(coord.latitude);
                      const lngDms = ddToDms(coord.longitude);
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: spaceSm,
                            background: colors.neutralLight,
                            borderRadius: radiusMd,
                            marginBottom: spaceSm,
                            border: `1px solid ${borderDefault}`,
                          }}
                        >
                          <Row gutter={12} align="middle">
                            <Col span={10}>
                              <div style={{ fontSize: fontSizeSm, color: textSecondary, marginBottom: 4 }}>
                                Vĩ độ (Lat {idx + 1}):
                              </div>
                              <InputNumber
                                style={{ ...inputStyle, width: '100%' }}
                                placeholder="Ví dụ: 21.0285"
                                step={0.000001}
                                value={coord.latitude}
                                onChange={(val) => handleCoordinateChange(idx, 'latitude', val)}
                              />
                              {coord.latitude != null && !isNaN(coord.latitude) && (
                                <div style={{ fontSize: 11, color: textTertiary, marginTop: 2 }}>
                                  {latDms.d}° {latDms.m}' {latDms.s}" N
                                </div>
                              )}
                            </Col>
                            <Col span={10}>
                              <div style={{ fontSize: fontSizeSm, color: textSecondary, marginBottom: 4 }}>
                                Kinh độ (Lng {idx + 1}):
                              </div>
                              <InputNumber
                                style={{ ...inputStyle, width: '100%' }}
                                placeholder="Ví dụ: 105.8542"
                                step={0.000001}
                                value={coord.longitude}
                                onChange={(val) => handleCoordinateChange(idx, 'longitude', val)}
                              />
                              {coord.longitude != null && !isNaN(coord.longitude) && (
                                <div style={{ fontSize: 11, color: textTertiary, marginTop: 2 }}>
                                  {lngDms.d}° {lngDms.m}' {lngDms.s}" E
                                </div>
                              )}
                            </Col>
                            <Col span={4} style={{ textAlign: 'center' }}>
                              {coordinates.length > 1 && (
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleRemoveCoordinate(idx)}
                                />
                              )}
                            </Col>
                          </Row>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            },
            {
              key: 'attachments',
              label: `File đính kèm (${attachments.length})`,
              children: (
                <div style={drawerTabContentStyle}>
                  <Upload.Dragger
                    multiple
                    beforeUpload={handleFileUpload}
                    showUploadList={false}
                    style={{
                      background: surfaceCard,
                      border: `1px dashed ${colors.primary}`,
                      borderRadius: radiusMd,
                      padding: spaceLg,
                      marginBottom: spaceMd,
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: actionPrimary, fontSize: 36 }} />
                    </p>
                    <p style={{ color: textPrimary, fontWeight: 500, fontSize: fontSizeMd, marginBottom: 4 }}>
                      Nhấp hoặc kéo thả file vào khu vực này để tải lên
                    </p>
                    <p style={uploadHintStyle}>
                      {ATTACHMENT_HELPER_TEXT}
                    </p>
                  </Upload.Dragger>

                  <Table
                    columns={attachmentColumns}
                    dataSource={attachments}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    style={{ border: `1px solid ${borderDefault}`, borderRadius: radiusMd }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Form>

      {/* Map selector modal */}
      {isMapModalOpen && (
        <Modal
          title="Chọn vị trí trạm trên bản đồ GIS"
          open={isMapModalOpen}
          width={800}
          onCancel={() => setIsMapModalOpen(false)}
          footer={null}
        >
          <GisLocationSelector
            geometryType={geometryType}
            initialCoordinates={coordinates}
            onSelect={(coords) => {
              if (coords && coords.length > 0) {
                setCoordinates(coords);
              }
              setIsMapModalOpen(false);
            }}
            onCancel={() => setIsMapModalOpen(false)}
          />
        </Modal>
      )}
    </AppDrawer>
  );
};
