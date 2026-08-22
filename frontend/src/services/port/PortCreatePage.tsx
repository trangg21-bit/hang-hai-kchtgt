import { useEffect, useState } from 'react';
import {
  Alert, Card, Button, Space, Typography, Row, Col, InputNumber,
  Select, Input, Form, Upload, Divider,
} from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from '../../components/ToastNotification';
import { organizationService } from '../../services/organizationService';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import {
  actionPrimary, spaceFormField, radiusPill, radiusLg, surfaceCard,
  borderDefault, textSecondary, textTertiary, spaceMd, spaceSm, spaceLg,
  fontSans, fontWeightBold, fontSizeMd, fontSizeLg, fontWeightMedium,
  radiusSm, spaceXs,
} from '../../tokens';

/* ───────────────────────────────────────────────
   Constant option lists
   ─────────────────────────────────────────────── */
const PORT_GROUP_OPTIONS = [
  { value: 1, label: 'Nhóm 1 — Cảng biển loại I' },
  { value: 2, label: 'Nhóm 2 — Cảng biển loại II' },
  { value: 3, label: 'Nhóm 3 — Cảng biển loại III' },
];

const PORT_CLASS_OPTIONS = [
  { value: 5, label: 'Cấp đặc biệt' },
  { value: 1, label: 'Cấp 1' },
  { value: 2, label: 'Cấp 2' },
  { value: 3, label: 'Cấp 3' },
  { value: 4, label: 'Cấp 4' },
];

const OBJECT_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

const SYMBOL_OPTIONS = [
  { value: 'anchorage', label: 'Khu neo đậu' },
  { value: 'berth', label: 'Bến cảng' },
  { value: 'lighthouse', label: 'Đèn biển' },
  { value: 'port', label: 'Cảng biển' },
  { value: 'buoy', label: 'Phao tiêu' },
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILE_COUNT = 10;

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */
const sectionHeader: React.CSSProperties = {
  fontSize: fontSizeLg,
  fontWeight: fontWeightBold,
  color: textSecondary,
  marginBottom: spaceMd,
  marginTop: spaceLg,
  fontFamily: fontSans,
};

const pillStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

/* ───────────────────────────────────────────────
   Component
   ─────────────────────────────────────────────── */
export default function PortCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [portCodeLoading, setPortCodeLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.user);
  const hasPermission = usePermissionStore((s) => s.hasPermission);
  const isSystemAdmin = hasPermission('admin:all') || hasPermission('*') || currentUser?.role === 'ROLE_SYSTEM_ADMIN' || currentUser?.role === 'ROLE_SUPER_ADMIN';
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // ── GPS sub-table state ──
  const [coordinateList, setCoordinateList] = useState<Array<{ latitude: number | null; longitude: number | null }>>([
    { latitude: null, longitude: null },
  ]);

  // ── Infrastructure sub-table state ──
  const [infrastructureList, setInfrastructureList] = useState<Array<{ stt: number; infraName: string; quantity: number | null }>>(
    [],
  );

  // ── File upload state ──
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);

  // ── Auto-generate port code on mount ──
  useEffect(() => {
    (async () => {
      setPortCodeLoading(true);
      try {
        const res = await api.get('/v1/ports/generate-code');
        // API envelope: { success, message, data: { portCode: "CB-XXXXXX" } }
        const code: string | undefined = res.data?.data?.portCode;
        if (code) {
          form.setFieldsValue({ portCode: code });
        }
        // If API returns no code, backend will auto-gen on submit anyway
      } catch {
        // Silent — backend auto-generates portCode if empty on submit
        console.warn('Không thể lấy mã cảng từ API, backend sẽ tự sinh khi lưu');
      } finally {
        setPortCodeLoading(false);
      }
    })();
  }, [form]);

  // ── Load organization units from API (BR-008-07) ──
  useEffect(() => {
    (async () => {
      setLoadingOrgs(true);
      try {
        const resp = await organizationService.list({ pageSize: 1000 });
        const orgs = (resp.data || []).map((org: any) => ({
          value: org.id,
          label: org.name,
        }));
        setOrgUnitOptions(orgs);
      } catch {
        console.error('Failed to load organizations');
      } finally {
        setLoadingOrgs(false);
      }
    })();
  }, []);

  // ── Admin auto-fill orgUnit (AC-008-14) ──
  useEffect(() => {
    if (!isSystemAdmin) {
      (async () => {
        try {
          const res = await api.get('/users/me');
          const profile = res.data?.data ?? res.data;
          if (profile?.orgUnitId) {
            form.setFieldsValue({ orgUnitId: profile.orgUnitId });
          }
        } catch {
          console.error('Failed to load user profile for orgUnit auto-fill');
        }
      })();
    }
  }, [form, isSystemAdmin]);

  /* ── File upload handlers ── */
  const handleBeforeUpload = (file: RcFile): false => {
    // Size check
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" vượt quá 20MB`);
      return false;
    }

    // Extension check
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Định dạng .${ext} không được hỗ trợ`);
      return false;
    }

    // Count check
    if (uploadedFiles.length >= MAX_FILE_COUNT) {
      toast.error('Chỉ được upload tối đa 10 file');
      return false;
    }

    // Add to list
    const uploadFile: UploadFile = {
      uid: `-${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'done',
      originFileObj: file,
    };
    setUploadedFiles((prev) => [...prev, uploadFile]);
    return false; // prevent auto upload
  };

  const handleRemoveFile = (file: UploadFile) => {
    setUploadedFiles((prev) => prev.filter((f) => f.uid !== file.uid));
  };

  /* ── GPS handlers ── */
  const updateCoordinate = (index: number, field: 'latitude' | 'longitude', value: number | null) => {
    setCoordinateList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addCoordinate = () => {
    setCoordinateList((prev) => [...prev, { latitude: null, longitude: null }]);
  };

  const removeCoordinate = (index: number) => {
    if (coordinateList.length <= 1) return;
    setCoordinateList((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Infrastructure handlers ── */
  const updateInfrastructure = (index: number, field: 'infraName' | 'quantity', value: string | number | null) => {
    setInfrastructureList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value as never };
      return next;
    });
  };

  const addInfrastructure = () => {
    setInfrastructureList((prev) => [
      ...prev,
      { stt: prev.length + 1, infraName: '', quantity: null },
    ]);
  };

  const removeInfrastructure = (index: number) => {
    setInfrastructureList((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((item, i) => ({ ...item, stt: i + 1 }));
    });
  };

  /* ── Submit handler ── */
  const handleSave = async (actionType: 'draft' | 'submit') => {
    const values = form.getFieldsValue();
    const portName = String(values.portName ?? '').trim();

    // ── Basic validation (always required) ──
    if (!portName) {
      toast.error('Tên cảng biển là bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      // ── Duplicate name check (AC-008-09) ──
      if (portName && values.province) {
        try {
          const dupRes = await api.get('/v1/ports', {
            params: { portName, province: values.province, page: 1, size: 1 },
          });
          const dupData = dupRes.data?.data?.content ?? dupRes.data?.content ?? [];
          if (Array.isArray(dupData) && dupData.length > 0) {
            toast.warning('Tên cảng này đã tồn tại trong tỉnh/thành phố đã chọn. Vui lòng kiểm tra lại trước khi lưu.');
          }
        } catch {
          // silent — non-blocking check
        }
      }

      // ── Build payload ──
      // Only include non-null indicators (submitted as 0 if unchanged default)
      const indicators: Record<string, number | string | undefined> = {};
      const indicatorFields = [
        'totalBerths', 'totalAnchoragesTransshipment', 'totalPublicChannels',
        'totalDedicatedChannels', 'totalBuoysBeacons', 'totalDikes',
        'totalLighthouses', 'buoyBerthCount', 'anchorageCount', 'transshipmentCount',
      ];
      for (const f of indicatorFields) {
        const v = values[f];
        if (v !== undefined && v !== null && !Number.isNaN(Number(v))) {
          indicators[f] = Number(v);
        }
      }

      const decimalIndicators = [
        'totalPublicChannelLength', 'totalDedicatedChannelLength', 'totalDikeLength',
      ];
      for (const f of decimalIndicators) {
        const v = values[f];
        if (v !== undefined && v !== null && !Number.isNaN(Number(v))) {
          indicators[f] = Number(v);
        }
      }

      const payload: Record<string, unknown> = {
        action: actionType,
        portCode: String(values.portCode || '').trim(),
        portName,
        province: values.province || undefined,
        orgUnitId: values.orgUnitId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.orgUnitId) ? values.orgUnitId : undefined,
        portGroup: values.portGroup !== undefined && values.portGroup !== null ? Number(values.portGroup) : undefined,
        detailedLocation: values.detailedLocation || undefined,
        portClass: values.portClass !== undefined && values.portClass !== null ? Number(values.portClass) : undefined,
        area: values.area !== undefined && values.area !== null && Number(values.area) > 0 ? Number(values.area) : undefined,
        maxVesselCapacity: values.maxVesselCapacity !== undefined && values.maxVesselCapacity !== null ? Number(values.maxVesselCapacity) : undefined,
        waterAreaScope: values.waterAreaScope || undefined,
        ...indicators,
        otherWaterAreas: values.otherWaterAreas || undefined,
        geometryType: values.geometryType || undefined,
        mapSymbolId: values.mapSymbolId || undefined,
        spatialId: values.spatialId || undefined,
        coordinateSystem: values.coordinateSystem !== undefined && values.coordinateSystem !== null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule || undefined,
        remarks: values.remarks || undefined,
        coordinateList: coordinateList
          .filter((c) => c.latitude !== null && c.longitude !== null)
          .map((c) => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) })),
        infrastructureList: infrastructureList
          .filter((inf) => inf.infraName?.trim())
          .map((inf) => ({ stt: inf.stt, infraName: inf.infraName.trim(), quantity: Number(inf.quantity) })),
      };

      // Add top-level lat/lng for spatial sync
      const firstCoord = coordinateList.find((c) => c.latitude !== null && c.longitude !== null);
      if (firstCoord) {
        payload.latitude = Number(firstCoord.latitude);
        payload.longitude = Number(firstCoord.longitude);
      }

      // POST create port
      const res = await api.post('/v1/ports', payload);
      const createdPortId: string | undefined = res.data?.data?.id ?? res.data?.id;

      // Upload files after port is created
      if (createdPortId && uploadedFiles.length > 0) {
        for (const fileItem of uploadedFiles) {
          const originFile = fileItem.originFileObj as File;
          if (!originFile) continue;
          const formData = new FormData();
          formData.append('files', originFile);
          await api.post(`/v1/ports/${createdPortId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      const successMsg =
        actionType === 'draft' ? 'Lưu tạm thành công' : 'Gửi phê duyệt thành công';
      toast.success(successMsg);
      navigate('/Port');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra khi tạo mới cảng biển';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── UI ── */
  const btnStyle: React.CSSProperties = {
    ...pillStyle,
    fontFamily: fontSans,
    fontWeight: fontWeightMedium,
  };

  return (
    <>
      {/* ── Header card ── */}
      <Card
        style={{
          marginBottom: spaceMd,
          borderRadius: radiusLg,
          border: `0.5px solid ${borderDefault}`,
          boxShadow: '0 1px 2px rgba(11,46,79,0.04)',
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/Port')}
            style={btnStyle}
          >
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0, fontFamily: fontSans }}>
            Tạo mới Cảng biển
          </Typography.Title>
        </Space>
      </Card>

      {/* ── Form card ── */}
      <Card
        style={{
          maxWidth: 900,
          margin: '0 auto',
          borderRadius: radiusLg,
          border: `0.5px solid ${borderDefault}`,
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            coordinateSystem: 1,
          }}
          scrollToFirstError
        >
          {/* ════════════════════════════════════
              SECTION 1 — Thông tin chung
              ════════════════════════════════════ */}
          <Typography.Text style={sectionHeader}>1. Thông tin chung</Typography.Text>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mã cảng biển"
                name="portCode"
                style={{ marginBottom: spaceFormField }}
                tooltip="Mã cảng được sinh tự động, không thể chỉnh sửa"
              >
                <Input
                  disabled
                  placeholder={portCodeLoading ? 'Đang sinh mã...' : 'Mã tự động'}
                  style={{
                    ...pillStyle,
                    fontFamily: fontSans,
                    color: textTertiary,
                    cursor: 'not-allowed',
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tên cảng biển"
                name="portName"
                rules={[
                  { required: true, message: 'Tên cảng không được để trống' },
                  { max: 255, message: 'Tên cảng tối đa 255 ký tự' },
                ]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: Cảng biển Hải Phòng"
                  maxLength={255}
                  style={{ ...pillStyle, fontFamily: fontSans }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Tỉnh/Thành phố"
                name="province"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  showSearch
                  placeholder="Chọn tỉnh/thành phố..."
                  style={{ fontFamily: fontSans }}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Đơn vị quản lý"
                name="orgUnitId"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn đơn vị quản lý..."
                  style={{ fontFamily: fontSans }}
                  loading={loadingOrgs}
                  disabled={!isSystemAdmin}
                  options={orgUnitOptions}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Nhóm cảng biển"
                name="portGroup"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn nhóm cảng..."
                  style={{ fontFamily: fontSans }}
                  options={PORT_GROUP_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Phân cấp cảng biển"
                name="portClass"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn cấp..."
                  style={{ fontFamily: fontSans }}
                  options={PORT_CLASS_OPTIONS}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Địa điểm chi tiết"
                name="detailedLocation"
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: Khu bến cảng Lạch Huyện"
                  maxLength={500}
                  style={{ ...pillStyle, fontFamily: fontSans }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Phạm vi vùng nước"
                name="waterAreaScope"
                style={{ marginBottom: spaceFormField }}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Mô tả phạm vi vùng nước..."
                  maxLength={2000}
                  style={{ borderRadius: radiusSm, fontFamily: fontSans }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Diện tích (km²)"
                name="area"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0.01}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Khả năng tiếp nhận (tấn/năm)"
                name="maxVesselCapacity"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ════════════════════════════════════
              SECTION 2 — Chỉ số tổng hợp (14 fields)
              ════════════════════════════════════ */}
          <Divider style={{ borderColor: borderDefault, margin: `${spaceLg}px 0` }} />
          <Typography.Text style={sectionHeader}>2. Chỉ số tổng hợp</Typography.Text>

          <Row gutter={[16, 0]}>
            {/* Row 1 */}
            <Col xs={24} sm={8}>
              <Form.Item
                label="Tổng số bến cảng"
                name="totalBerths"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Tổng số khu neo đậu, chuyển tải"
                name="totalAnchoragesTransshipment"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Tổng số tuyến luồng HH công cộng"
                name="totalPublicChannels"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Tổng số tuyến luồng HH chuyên dùng"
                name="totalDedicatedChannels"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Chiều dài luồng HH công cộng (km)"
                name="totalPublicChannelLength"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Chiều dài luồng HH chuyên dùng (km)"
                name="totalDedicatedChannelLength"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Tổng số phao tiêu, báo hiệu HH trên luồng"
                name="totalBuoysBeacons"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Tổng số đê, kè"
                name="totalDikes"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Chiều dài hệ thống đê, kè (km)"
                name="totalDikeLength"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Tổng số đèn biển, đăng, tiêu độc lập"
                name="totalLighthouses"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Số lượng bến phao"
                name="buoyBerthCount"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Số lượng khu neo đậu"
                name="anchorageCount"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Số lượng khu chuyển tải"
                name="transshipmentCount"
                style={{ marginBottom: spaceFormField }}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={16}>
              <Form.Item
                label="Các khu nước, vùng nước khác"
                name="otherWaterAreas"
                style={{ marginBottom: spaceFormField }}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Mô tả..."
                  maxLength={2000}
                  style={{ borderRadius: radiusSm, fontFamily: fontSans }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ════════════════════════════════════
              SECTION 3 — GIS
              ════════════════════════════════════ */}
          <Divider style={{ borderColor: borderDefault, margin: `${spaceLg}px 0` }} />
          <Typography.Text style={sectionHeader}>3. Thông tin GIS</Typography.Text>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Loại đối tượng"
                name="geometryType"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  style={{ fontFamily: fontSans }}
                  options={OBJECT_TYPE_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Biểu tượng"
                name="mapSymbolId"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  placeholder="Chọn biểu tượng..."
                  style={{ fontFamily: fontSans }}
                  options={SYMBOL_OPTIONS}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Hệ quy chiếu"
                name="coordinateSystem"
                style={{ marginBottom: spaceFormField }}
              >
                <Select
                  style={{ fontFamily: fontSans }}
                  options={COORD_SYS_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Quy tắc hiển thị"
                name="displayRule"
                style={{ marginBottom: spaceFormField }}
              >
                <Input
                  placeholder="VD: display_rule_1"
                  style={{ ...pillStyle, fontFamily: fontSans }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Liên kết đối tượng GIS (spatial_id)"
                name="spatialId"
                style={{ marginBottom: spaceFormField }}
                tooltip="UUID của đối tượng GIS đã tạo trên bản đồ. Để trống nếu nhập tọa độ thủ công."
              >
                <Input
                  placeholder="VD: 550e8400-e29b-41d4-a716-446655440000"
                  style={{ ...pillStyle, fontFamily: fontSans }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} />
          </Row>

          {/* ════════════════════════════════════
              SECTION 4 — Tọa độ GPS (sub-table)
              ════════════════════════════════════ */}
          <Divider style={{ borderColor: borderDefault, margin: `${spaceLg}px 0` }} />
          <Typography.Text style={{ ...sectionHeader, color: actionPrimary }}>📍 4. Tọa độ GPS</Typography.Text>

          <Alert
            type="info"
            showIcon
            message="Tọa độ GPS là tùy chọn. Nhập Vĩ độ và Kinh độ nếu có."
            style={{ marginBottom: spaceMd, fontFamily: fontSans }}
          />

          <div
            style={{
              border: `0.5px solid ${borderDefault}`,
              borderRadius: radiusLg,
              padding: spaceMd,
              background: surfaceCard,
              marginBottom: spaceMd,
            }}
          >
            {coordinateList.map((coord, idx) => (
              <Row key={idx} gutter={12} align="middle" style={{ marginBottom: spaceSm }}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={idx === 0 ? 'Vĩ độ (Y)' : undefined}
                    style={{ marginBottom: 0 }}
                    validateStatus={
                      coord.latitude !== null &&
                      (Number(coord.latitude) < -90 || Number(coord.latitude) > 90)
                        ? 'error'
                        : undefined
                    }
                    help={
                      coord.latitude !== null &&
                      (Number(coord.latitude) < -90 || Number(coord.latitude) > 90)
                        ? 'Vĩ độ từ -90 đến 90'
                        : undefined
                    }
                  >
                    <InputNumber
                      value={coord.latitude}
                      onChange={(v) => updateCoordinate(idx, 'latitude', v ?? null)}
                      placeholder="VD: 20.951623"
                      min={-90}
                      max={90}
                      step={0.000001}
                      style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={idx === 0 ? 'Kinh độ (X)' : undefined}
                    style={{ marginBottom: 0 }}
                    validateStatus={
                      coord.longitude !== null &&
                      (Number(coord.longitude) < -180 || Number(coord.longitude) > 180)
                        ? 'error'
                        : undefined
                    }
                    help={
                      coord.longitude !== null &&
                      (Number(coord.longitude) < -180 || Number(coord.longitude) > 180)
                        ? 'Kinh độ từ -180 đến 180'
                        : undefined
                    }
                  >
                    <InputNumber
                      value={coord.longitude}
                      onChange={(v) => updateCoordinate(idx, 'longitude', v ?? null)}
                      placeholder="VD: 106.123456"
                      min={-180}
                      max={180}
                      step={0.000001}
                      style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                    />
                  </Form.Item>
                </Col>
                <Col
                  xs={24}
                  sm={8}
                  style={{
                    display: 'flex',
                    alignItems: idx === 0 ? 'flex-end' : 'center',
                    paddingBottom: idx === 0 ? 2 : 0,
                    gap: spaceSm,
                    marginTop: idx !== 0 ? spaceXs : spaceSm,
                  }}
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeCoordinate(idx)}
                    disabled={coordinateList.length <= 1}
                    style={{ fontFamily: fontSans }}
                  >
                    Xóa
                  </Button>
                  {idx === coordinateList.length - 1 && (
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={addCoordinate}
                      style={{ color: actionPrimary, fontFamily: fontSans }}
                    >
                      Thêm
                    </Button>
                  )}
                </Col>
              </Row>
            ))}
            {coordinateList.length >= 10 && (
              <Typography.Text
                style={{ fontSize: fontSizeMd, color: textTertiary, fontFamily: fontSans }}
              >
                Tối đa 10 tọa độ
              </Typography.Text>
            )}
          </div>

          {/* ════════════════════════════════════
              SECTION 5 — Công trình KCHT (sub-table)
              ════════════════════════════════════ */}
          <Divider style={{ borderColor: borderDefault, margin: `${spaceLg}px 0` }} />
          <Typography.Text style={sectionHeader}>5. Công trình KCHT</Typography.Text>

          <div
            style={{
              border: `0.5px solid ${borderDefault}`,
              borderRadius: radiusLg,
              padding: spaceMd,
              background: surfaceCard,
              marginBottom: spaceMd,
            }}
          >
            {infrastructureList.length === 0 && (
              <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={addInfrastructure}
                style={{ color: actionPrimary, fontFamily: fontSans, marginBottom: spaceSm }}
              >
                Thêm công trình
              </Button>
            )}

            {infrastructureList.map((inf, idx) => (
              <Row key={idx} gutter={12} align="middle" style={{ marginBottom: spaceSm }}>
                <Col xs={24} sm={3}>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Input
                      value={inf.stt}
                      disabled
                      style={{
                        borderRadius: radiusPill,
                        textAlign: 'center',
                        fontFamily: fontSans,
                        background: 'transparent',
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={9}>
                  <Form.Item
                    label={idx === 0 ? 'Tên công trình' : undefined}
                    style={{ marginBottom: 0 }}
                    validateStatus={inf.infraName?.trim() ? undefined : 'error'}
                    help={
                      !inf.infraName?.trim() && inf.infraName !== ''
                        ? undefined
                        : undefined
                    }
                  >
                    <Input
                      value={inf.infraName}
                      onChange={(e) => updateInfrastructure(idx, 'infraName', e.target.value)}
                      placeholder="Tên công trình"
                      style={{ borderRadius: radiusPill, fontFamily: fontSans }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={5}>
                  <Form.Item
                    label={idx === 0 ? 'Số lượng' : undefined}
                    style={{ marginBottom: 0 }}
                    validateStatus={
                      inf.quantity !== null && Number(inf.quantity) <= 0 ? 'error' : undefined
                    }
                    help={
                      inf.quantity !== null && Number(inf.quantity) <= 0
                        ? 'Số lượng > 0'
                        : undefined
                    }
                  >
                    <InputNumber
                      value={inf.quantity}
                      onChange={(v) => updateInfrastructure(idx, 'quantity', v ?? null)}
                      placeholder="SL"
                      min={1}
                      style={{ width: '100%', borderRadius: radiusPill, fontFamily: fontSans }}
                    />
                  </Form.Item>
                </Col>
                <Col
                  xs={24}
                  sm={7}
                  style={{
                    display: 'flex',
                    alignItems: idx === 0 ? 'flex-end' : 'center',
                    paddingBottom: idx === 0 ? 2 : 0,
                    gap: spaceSm,
                    marginTop: idx !== 0 ? spaceXs : spaceSm,
                  }}
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeInfrastructure(idx)}
                    style={{ fontFamily: fontSans }}
                  >
                    Xóa
                  </Button>
                  <Button
                    type="link"
                    icon={<PlusOutlined />}
                    onClick={addInfrastructure}
                    style={{ color: actionPrimary, fontFamily: fontSans }}
                  >
                    Thêm
                  </Button>
                </Col>
              </Row>
            ))}
          </div>

          {/* ════════════════════════════════════
              SECTION 6 — File đính kèm
              ════════════════════════════════════ */}
          <Divider style={{ borderColor: borderDefault, margin: `${spaceLg}px 0` }} />
          <Typography.Text style={sectionHeader}>6. File đính kèm</Typography.Text>

          <div
            style={{
              border: `0.5px solid ${borderDefault}`,
              borderRadius: radiusLg,
              padding: spaceMd,
              background: surfaceCard,
              marginBottom: spaceMd,
            }}
          >
            <Upload
              beforeUpload={handleBeforeUpload}
              onRemove={handleRemoveFile}
              fileList={uploadedFiles}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
            >
              <Button
                icon={<UploadOutlined />}
                style={{
                  borderRadius: radiusPill,
                  fontFamily: fontSans,
                  height: 40,
                }}
              >
                Chọn file
              </Button>
            </Upload>
            <Typography.Text
              style={{
                display: 'block',
                marginTop: spaceXs,
                fontSize: fontSizeMd,
                color: textTertiary,
                fontFamily: fontSans,
              }}
            >
              Định dạng hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file,
              20MB/file.
            </Typography.Text>
          </div>

          {/* ════════════════════════════════════
              SECTION 7 — Ghi chú
              ════════════════════════════════════ */}
          <Divider style={{ borderColor: borderDefault, margin: `${spaceLg}px 0` }} />
          <Typography.Text style={sectionHeader}>7. Ghi chú</Typography.Text>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="remarks"
                style={{ marginBottom: spaceFormField }}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Nhập ghi chú (nếu có)..."
                  maxLength={2000}
                  style={{ borderRadius: radiusSm, fontFamily: fontSans }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ════════════════════════════════════
              FOOTER — Actions
              ════════════════════════════════════ */}
          <Divider style={{ borderColor: borderDefault, margin: `${spaceLg}px 0` }} />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space wrap>
              <Button
                style={{
                  ...btnStyle,
                  borderColor: borderDefault,
                  minWidth: 140,
                }}
                loading={submitting}
                onClick={() => handleSave('draft')}
              >
                Lưu tạm
              </Button>
              <Button
                type="primary"
                style={{
                  ...btnStyle,
                  minWidth: 140,
                }}
                loading={submitting}
                onClick={() => handleSave('submit')}
              >
                Gửi phê duyệt
              </Button>
              <Button
                style={{
                  ...btnStyle,
                  borderColor: borderDefault,
                  minWidth: 100,
                }}
                onClick={() => navigate('/Port')}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
