import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert, Modal, Tabs, Space, Form, Button, Typography, Row, Col, InputNumber,
  Select, Input, Upload, DatePicker,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  PlusOutlined, DeleteOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from '../../components/ToastNotification';
import { organizationService } from '../../services/organizationService';
import { berthCRUD, portCRUD } from '../../services/portService';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import { BERTH_ACTIVITY_STATUS_MAP } from '../../types/port';
import type { Berth, SaveAction } from '../../types/port';
import {
  actionPrimary, statusOperational, spaceFormField, radiusPill,
  surfaceCard, borderDefault, textPrimary, textSecondary, textTertiary,
  spaceMd, spaceSm, spaceXs,
  fontSans, fontWeightBold, fontWeightMedium,
  fontSizeMd, fontSizeSm,
} from '../../tokens';
import { colors } from '../../theme';

/* ───────────────────────────────────────────────
   Constant option lists
   ─────────────────────────────────────────────── */
const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Bến nước' },
  { value: 2, label: 'Bến bờ' },
  { value: 3, label: 'Bến phao' },
  { value: 4, label: 'Bến chuyên dùng' },
];

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_FILE_COUNT = 10;

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */
// ── Styles — đồng bộ với PortListPage create modal ──
const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

const selectStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

const numberInputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: radiusPill,
  height: 40,
};

/* ── Parse WKT coordinates from GisLocationSelector value ── */
const parseGisCoordinates = (
  gisLocation: { geometryType?: string; coordinates?: string } | undefined | null,
): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    // LINESTRING(lng1 lat1, lng2 lat2, ...)
    if (wkt.startsWith('LINESTRING(')) {
      const match = wkt.match(/LINESTRING\s*\(([^)]+)\)/);
      if (match) {
        return match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
        }).filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
      }
    }
    // POLYGON((lng1 lat1, lng2 lat2, ...))
    if (wkt.startsWith('POLYGON((')) {
      const match = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/);
      if (match) {
        const pts = match[1].split(',').map((pt) => {
          const parts = pt.trim().split(/\s+/);
          return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
        }).filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
        if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude && pts[0].latitude === pts[pts.length - 1].latitude) {
          pts.pop();
        }
        return pts;
      }
    }
    // MULTIPOINT((lng1 lat1),(lng2 lat2),...)
    const multiMatch = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)/);
    if (multiMatch) {
      return multiMatch[1]
        .split('),(')
        .map((pt) => {
          const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
          return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
        })
        .filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
    }
    // POINT(lng lat)
    const match = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/);
    if (match) {
      return [{ latitude: parseFloat(match[2]), longitude: parseFloat(match[1]) }];
    }
  } catch {
    /* invalid WKT */
  }
  return [];
};

/* ───────────────────────────────────────────────
   Component
   ─────────────────────────────────────────────── */
export default function BerthForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const watchedGeometryType = Form.useWatch('geometryType', form);
  const watchedOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedPortId = Form.useWatch('portId', form);
  const [submitting, setSubmitting] = useState(false);
  const [berthCodeLoading, setBerthCodeLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];
  const isSystemAdmin = userPermissions.includes('admin:manage');

  // Remembers the portId loaded in edit mode so the auto-berthCode cascade
  // does not overwrite the berth's original code unless the port actually changes
  const editPortIdRef = useRef<string | undefined>(undefined);

  // ── Org unit options ──
  const [orgUnitOptions, setOrgUnitOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // ── Port options (filtered by orgUnitId) ──
  const [portOptions, setPortOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);

  // ── GPS sub-table state ──
  const [coordinateList, setCoordinateList] = useState<Array<{ latitude: number | null; longitude: number | null }>>([
    { latitude: null, longitude: null },
  ]);

  // ── Symbol state ──
  const [symbols, setSymbols] = useState<Symbol[]>([]);

  // ── File upload state ──
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  // ── Load symbols ──
  useEffect(() => {
    (async () => {
      try {
        const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        setSymbols(res.data || []);
      } catch { console.error('Failed to load symbols'); }
    })();
  }, []);

  // ── Load organization units from API ──
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

  // ── Non-admin auto-fill orgUnit from user profile ──
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

  // ── Load port options when orgUnitId changes ──
  const loadPortOptions = async (orgUnitId: string) => {
    setLoadingPorts(true);
    try {
      const params: any = { page: 1, size: 1000 };
      if (orgUnitId) params.orgUnitId = orgUnitId;
      const res = await portCRUD.findAll(params);
      const ports = (res.data || []).map((p: any) => ({
        value: p.id,
        label: p.portName || p.name || p.id,
      }));
      setPortOptions(ports);
    } catch {
      console.error('Failed to load ports for orgUnit');
      setPortOptions([]);
    } finally {
      setLoadingPorts(false);
    }
  };

  // ── When orgUnitId changes (manual select or auto-fill) → reload ports ──
  useEffect(() => {
    if (watchedOrgUnitId && (!isEdit || !form.getFieldValue('portId'))) {
      form.setFieldsValue({ portId: undefined, berthCode: undefined });
    }
    loadPortOptions(watchedOrgUnitId || '');
  }, [watchedOrgUnitId, isEdit, form]);

  // ── When orgUnitId changes → clear portId/berthCode + reset GPS rows ──
  const handleOrgUnitChange = () => {
    form.setFieldsValue({ portId: undefined, berthCode: undefined });
    setCoordinateList([{ latitude: null, longitude: null }]);
  };

  // ── When portId changes → auto-generate berthCode ──
  useEffect(() => {
    if (!watchedPortId) return;
    // In edit mode, keep the berth's original code unless the port actually changed
    if (isEdit && editPortIdRef.current === watchedPortId) return;

    setBerthCodeLoading(true);
    (async () => {
      try {
        const res = await api.get('/v1/berths/generate-code', { params: { portId: watchedPortId } });
        const code: string | undefined = res.data?.data?.berthCode ?? res.data?.data?.portCode ?? res.data?.data;
        if (code) form.setFieldsValue({ berthCode: code });
        else form.setFieldsValue({ berthCode: undefined });
      } catch {
        console.warn('Không thể lấy mã bến từ API, backend sẽ tự sinh khi lưu');
      } finally {
        setBerthCodeLoading(false);
      }
    })();
  }, [watchedPortId, isEdit, form]);

  // ── Edit mode: load existing berth ──
  useEffect(() => {
    if (isEdit && id) {
      (async () => {
        try {
          const data: Berth = await berthCRUD.findById(id);
          // Parse coordinates from WKT or JSON
          const effectiveCoords = data.coordinates
            ? parseGisCoordinates({ geometryType: data.geometryType, coordinates: data.coordinates })
            : [];
          setCoordinateList(
            effectiveCoords.length > 0
              ? effectiveCoords.map((c) => ({ latitude: c.latitude, longitude: c.longitude }))
              : data.latitude != null && data.longitude != null
                ? [{ latitude: data.latitude, longitude: data.longitude }]
                : [{ latitude: null, longitude: null }]
          );

          // Load port options for the berth's orgUnitId
          if (data.orgUnitId) {
            await loadPortOptions(data.orgUnitId);
          }

          // Load existing attachments
          try {
            const fileRes = await api.get(`/v1/documents/entity/berth/${id}`, { params: { page: 0, size: 50 } });
            setExistingFiles(fileRes.data?.data?.content || fileRes.data?.data || []);
          } catch { setExistingFiles([]); }

          // Remember the loaded portId BEFORE filling the form so the portId watch
          // cascade skips regenerating berthCode for the unchanged port
          editPortIdRef.current = data.portId;

          form.setFieldsValue({
            orgUnitId: data.orgUnitId,
            portId: data.portId,
            berthCode: data.berthCode,
            berthName: data.berthName,
            waterway: data.waterway,
            operator: data.operator,
            provinceId: data.provinceId !== undefined && data.provinceId !== null
              ? VIETNAM_PROVINCES[data.provinceId - 1] ?? undefined
              : undefined,
            detailedLocation: data.detailedLocation,
            structureType: data.structureType,
            operationalFunction: data.operationalFunction,
            totalArea: data.totalArea,
            designThroughput: data.designThroughput,
            currentThroughput: data.currentThroughput,
            maxVesselSize: data.maxVesselSize,
            plannedThroughput: data.plannedThroughput,
            latestCargoVolume: data.latestCargoVolume,
            operationalStatus: data.operationalStatus === 'OPERATIONAL' ? 'DANG_KHAI_THAC'
              : data.operationalStatus === 'SUSPENDED' ? 'DUNG_KHAI_THAC'
              : data.operationalStatus || undefined,
            openingAnnouncementDate: data.openingAnnouncementDate ? dayjs(data.openingAnnouncementDate) : undefined,
            openingDecision: data.openingDecision,
            investmentAgreement: data.investmentAgreement,
            geometryType: data.geometryType || 'POINT',
            mapSymbolId: data.mapSymbolId,
            spatialId: data.spatialId,
            coordinateSystem: data.coordinateSystem,
            displayRule: data.displayRule,
            gisLocation: data.coordinates ? { geometryType: data.geometryType, coordinates: data.coordinates } : undefined,
          });
        } catch {
          toast.error('Không thể tải thông tin bến cảng');
          navigate('/berth');
        }
      })();
    }
  }, [isEdit, id, form, navigate]);

  /* ── File upload handlers ── */
  const handleBeforeUpload = (file: File): false => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" vượt quá 20MB`);
      return false;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Định dạng .${ext} không được hỗ trợ`);
      return false;
    }

    if (uploadedFiles.length >= MAX_FILE_COUNT) {
      toast.error('Chỉ được upload tối đa 10 file');
      return false;
    }

    const uploadFile: UploadFile = {
      uid: `-${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'done',
      originFileObj: file,
    };
    setUploadedFiles((prev) => [...prev, uploadFile]);
    return false;
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

  /* ── Submit handler ── */
  const handleSave = async (saveAction: SaveAction) => {
    const values = form.getFieldsValue();
    const berthName = String(values.berthName ?? '').trim();
    const orgUnitId = values.orgUnitId || undefined;
    const portId = values.portId || undefined;
    const provinceName: string | undefined = values.provinceId;

    // ── Basic validation (always required) ──
    if (!orgUnitId) {
      toast.error('Đơn vị quản lý là bắt buộc');
      return;
    }
    if (!portId) {
      toast.error('Cảng biển là bắt buộc');
      return;
    }
    if (!berthName) {
      toast.error('Tên bến cảng là bắt buộc');
      return;
    }

    // ── Resolve coordinates: GisLocationSelector (primary) vs GPS sub-table (fallback) ──
    const gisCoords = parseGisCoordinates(values.gisLocation);
    const manualCoords = coordinateList
      .filter(
        (c) =>
          c.latitude !== null &&
          c.longitude !== null &&
          !Number.isNaN(Number(c.latitude)) &&
          !Number.isNaN(Number(c.longitude)),
      )
      .map((c) => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) }));

    // GisLocationSelector is the primary source; the manual GPS sub-table is the fallback
    const effectiveCoords = gisCoords.length > 0 ? gisCoords : manualCoords;

    // ── Submit/Approve validation ──
    if (saveAction !== 'DRAFT' && effectiveCoords.length === 0) {
      toast.error('Vui lòng thêm ít nhất một tọa độ GPS để gửi phê duyệt');
      return;
    }

    setSubmitting(true);
    try {
      // Build base payload
      const payload: Record<string, unknown> = {
        saveAction,
        berthCode: String(values.berthCode || '').trim() || undefined,
        berthName,
        portId,
        orgUnitId,
        waterway: values.waterway || undefined,
        latitude: effectiveCoords.length > 0 ? effectiveCoords[0].latitude : undefined,
        longitude: effectiveCoords.length > 0 ? effectiveCoords[0].longitude : undefined,
        operator: values.operator || undefined,
        provinceId: provinceName ? VIETNAM_PROVINCES.indexOf(provinceName) + 1 : undefined,
        detailedLocation: values.detailedLocation || undefined,
        structureType: values.structureType !== undefined && values.structureType !== null ? Number(values.structureType) : undefined,
        operationalFunction: values.operationalFunction || undefined,
        totalArea: values.totalArea !== undefined && values.totalArea !== null && !Number.isNaN(Number(values.totalArea)) ? Number(values.totalArea) : undefined,
        designThroughput: values.designThroughput !== undefined && values.designThroughput !== null && !Number.isNaN(Number(values.designThroughput)) ? Number(values.designThroughput) : undefined,
        currentThroughput: values.currentThroughput !== undefined && values.currentThroughput !== null && !Number.isNaN(Number(values.currentThroughput)) ? Number(values.currentThroughput) : undefined,
        maxVesselSize: values.maxVesselSize !== undefined && values.maxVesselSize !== null && !Number.isNaN(Number(values.maxVesselSize)) ? Number(values.maxVesselSize) : undefined,
        plannedThroughput: values.plannedThroughput !== undefined && values.plannedThroughput !== null && !Number.isNaN(Number(values.plannedThroughput)) ? Number(values.plannedThroughput) : undefined,
        latestCargoVolume: values.latestCargoVolume !== undefined && values.latestCargoVolume !== null && !Number.isNaN(Number(values.latestCargoVolume)) ? Number(values.latestCargoVolume) : undefined,
        operationalStatus: values.operationalStatus === 'DANG_KHAI_THAC' ? 'OPERATIONAL' : 'SUSPENDED',
        openingAnnouncementDate: values.openingAnnouncementDate
          ? (typeof values.openingAnnouncementDate === 'string' ? values.openingAnnouncementDate : values.openingAnnouncementDate.format('YYYY-MM-DD') + 'T00:00:00')
          : undefined,
        openingDecision: values.openingDecision || undefined,
        investmentAgreement: values.investmentAgreement || undefined,
        mapSymbolId: values.mapSymbolId || undefined,
        coordinateSystem: values.coordinateSystem !== undefined && values.coordinateSystem !== null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule !== undefined && values.displayRule !== null ? Number(values.displayRule) : undefined,
      };

      // Remove undefined fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key];
      });

      let createdBerthId: string | undefined;

      if (isEdit && id) {
        // Update
        await api.put('/v1/berths', { ...payload, id });
        createdBerthId = id;
      } else {
        // Create
        const res = await api.post('/v1/berths', payload);
        createdBerthId = res.data?.data?.id ?? res.data?.id;
      }

      const successMsg =
        saveAction === 'DRAFT'
          ? 'Lưu tạm thành công'
            : saveAction === 'SAVE_AND_APPROVE'
            ? 'Phê duyệt thành công'
            : 'Gửi phê duyệt thành công';
      toast.success(successMsg);

      // Upload files after berth is saved (non-blocking on error)
      if (createdBerthId && uploadedFiles.length > 0) {
        let uploaded = 0;
        for (const fileItem of uploadedFiles) {
          const originFile = fileItem.originFileObj as File;
          if (!originFile) continue;
          try {
            const formData = new FormData();
            formData.append('file', originFile);
            await api.post(`/v1/documents/upload/berth/${createdBerthId}`, formData, {
              headers: { 'Content-Type': undefined as any },
            });
            uploaded++;
          } catch {
            toast.error(`Tải lên tệp "${fileItem.name}" thất bại`);
          }
        }
        if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
      }

      navigate('/berth');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── UI ── */
  return (
    <Modal
      title={
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
          {isEdit ? 'Chỉnh sửa Bến cảng' : 'Tạo mới Bến cảng'}
        </span>
      }
      open
      onCancel={() => navigate('/berth')}
      footer={null}
      width={900}
      forceRender
      styles={{ body: { maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          geometryType: 'POINT',
          coordinateSystem: 1,
        }}
        scrollToFirstError
      >
        <Tabs
          defaultActiveKey="general"
          items={[
            {
              key: 'general',
              label: 'Thông tin chung',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="orgUnitId" {...labelProps('Đơn vị quản lý')} required style={{ marginBottom: spaceFormField }}>
                        <Select placeholder="Chọn đơn vị quản lý..." loading={loadingOrgs} disabled={isEdit || !isSystemAdmin} options={orgUnitOptions} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} onChange={handleOrgUnitChange} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="portId" {...labelProps('Cảng biển')} required style={{ marginBottom: spaceFormField }}>
                        <Select placeholder={watchedOrgUnitId ? 'Chọn cảng biển...' : 'Vui lòng chọn Đơn vị quản lý trước'} loading={loadingPorts} disabled={!watchedOrgUnitId} options={portOptions} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} style={selectStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="berthCode" {...labelProps('Mã bến')} required style={{ marginBottom: spaceFormField }} tooltip="Mã bến cảng được sinh tự động, không thể chỉnh sửa">
                        <Input disabled placeholder={berthCodeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'} style={{ ...inputStyle, color: textTertiary, cursor: 'not-allowed' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="structureType" {...labelProps('Loại bến')} style={{ marginBottom: spaceFormField }}>
                        <Select placeholder="Chọn loại bến..." options={STRUCTURE_TYPE_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="berthName" {...labelProps('Tên bến cảng')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Tên bến cảng không được để trống' }, { max: 255, message: 'Tên bến cảng tối đa 255 ký tự' }]}>
                        <Input placeholder="VD: Bến cảng Hải Phòng" maxLength={255} style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="waterway" {...labelProps('Tuyến đường thủy')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Tuyến sông Bạch Đằng" maxLength={255} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="provinceId" {...labelProps('Tỉnh/Thành phố')} style={{ marginBottom: spaceFormField }}>
                        <Select showSearch placeholder="Chọn tỉnh/thành phố..." filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Khu bến cảng Lạch Huyện" maxLength={500} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="operator" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Công ty CP Cảng Hải Phòng" maxLength={255} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'capacity',
              label: 'Năng lực',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="operationalFunction" {...labelProps('Chức năng khai thác')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Bốc xếp hàng container" maxLength={500} style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="totalArea" {...labelProps('Diện tích (km²)')} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="designThroughput" {...labelProps('Năng lực thiết kế (tấn/năm)')} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="currentThroughput" {...labelProps('Năng lực hiện tại (tấn/năm)')} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="plannedThroughput" {...labelProps('Năng lực quy hoạch (tấn/năm)')} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="latestCargoVolume" {...labelProps('Sản lượng mới nhất (tấn/năm)')} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="maxVesselSize" {...labelProps('Cỡ tàu lớn nhất (DWT)')} style={{ marginBottom: spaceFormField }}>
                        <InputNumber min={0} step={0.01} precision={2} placeholder="0" style={numberInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="operationalStatus" {...labelProps('Tình trạng')} style={{ marginBottom: spaceFormField }}>
                        <Select placeholder="Chọn trạng thái..." options={Object.entries(BERTH_ACTIVITY_STATUS_MAP).map(([value, { label }]) => ({ value, label }))} style={selectStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'announcement',
              label: 'Thông tin công bố',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="openingAnnouncementDate" {...labelProps('Ngày công bố mở cảng')} style={{ marginBottom: spaceFormField }}>
                        <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="openingDecision" {...labelProps('Quyết định mở cảng')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Số 123/QĐ-BGTVT" maxLength={500} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="investmentAgreement" {...labelProps('Thỏa thuận đầu tư')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Số 456/HĐ-ĐT" maxLength={500} style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'location',
              label: 'Vị trí',
              children: (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                        <Select options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng bản đồ')} style={{ marginBottom: spaceFormField }}>
                        <Select placeholder="Chọn biểu tượng hiển thị" allowClear showSearch optionFilterProp="label" style={selectStyle}>
                          {symbols.map((sym) => (
                            <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                              <Space>
                                {sym.image && (
                                  <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                )}
                                <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
                              </Space>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                        <Select options={COORD_SYS_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                        <Input placeholder="VD: Hiển thị mặc định" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="gisLocation" {...labelProps('Tọa độ GPS')} required style={{ marginBottom: spaceFormField }}>
                        <GisLocationSelector defaultGeometryType={watchedGeometryType || 'POINT'} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'files',
              label: 'File đính kèm',
              children: (
                <>
                  {existingFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceSm }}>
                      {existingFiles.map((f: any) => {
                        const isImage = (f.mimeType || f.contentType || '').startsWith('image/');
                        return (
                          <div key={f.id} style={{
                            border: `0.5px solid ${borderDefault}`,
                            borderRadius: radiusPill,
                            padding: spaceSm,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spaceSm,
                          }}>
                            {isImage ? (
                              <img src={`/api/v1/documents/${f.id}/file`} alt={f.fileName || f.name}
                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                                onClick={() => window.open(`/api/v1/documents/${f.id}/file`, '_blank')} />
                            ) : (
                              <UploadOutlined style={{ fontSize: 24, color: actionPrimary }} />
                            )}
                            <div>
                              <div style={{ fontSize: fontSizeMd, color: textPrimary }}>{f.fileName || f.name}</div>
                              <div style={{ fontSize: fontSizeSm, color: textTertiary }}>{(f.fileSize / 1024).toFixed(1)} KB</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Upload beforeUpload={handleBeforeUpload} onRemove={handleRemoveFile} fileList={uploadedFiles} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif">
                    <Button icon={<UploadOutlined />}>Chọn file (≤10 files, ≤20MB)</Button>
                  </Upload>
                </>
              ),
            },
          ]}
        />

        <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/berth')} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>
            <Button onClick={() => handleSave('DRAFT')} loading={submitting} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Lưu tạm</Button>
            {isSystemAdmin && (
              <Button type="primary" onClick={() => handleSave('SAVE_AND_APPROVE')} loading={submitting} disabled={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Lưu và phê duyệt</Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
