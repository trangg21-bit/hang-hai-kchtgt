import { useEffect, useRef, useState } from 'react';
import {
  Alert, Modal, Tabs, Form, Button, Typography, Row, Col, InputNumber,
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
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import { BERTH_ACTIVITY_STATUS_MAP } from '../../types/port';
import type { Berth, SaveAction } from '../../types/port';
import {
  actionPrimary, statusOperational, spaceFormField, radiusPill, radiusLg,
  surfaceCard, borderDefault, textSecondary, textTertiary, spaceMd, spaceSm,
  spaceLg, spaceXs, fontSans, fontWeightBold, fontSizeMd, fontSizeLg,
  fontWeightMedium,
} from '../../tokens';

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

// Card-style wrapper for every tab — background surfaceCard, radiusLg, hairline border, spaceMd padding
const tabContentStyle: React.CSSProperties = {
  background: surfaceCard,
  borderRadius: radiusLg,
  border: `0.5px solid ${borderDefault}`,
  padding: spaceMd,
};

const pillStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

/* ── Parse WKT coordinates from GisLocationSelector value into lat/lng pairs ── */
const parseGisCoordinates = (
  gisLocation: { geometryType?: string; coordinates?: string } | undefined | null,
): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  const geomType = (gisLocation?.geometryType || 'POINT').toUpperCase();
  try {
    if (geomType === 'POINT') {
      if (wkt.startsWith('MULTIPOINT(')) {
        const match = wkt.match(/MULTIPOINT\(([^)]+)\)/);
        if (match) {
          return match[1]
            .split('),(')
            .map((pt) => {
              const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
              return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
            })
            .filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
        }
      } else if (wkt.startsWith('POINT(')) {
        const match = wkt.match(/POINT\(([^)]+)\)/);
        if (match) {
          const parts = match[1].split(' ');
          const latitude = parseFloat(parts[1]);
          const longitude = parseFloat(parts[0]);
          if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
            return [{ latitude, longitude }];
          }
        }
      }
    } else if (geomType === 'LINE' && wkt.startsWith('LINESTRING(')) {
      const match = wkt.match(/LINESTRING\(([^)]+)\)/);
      if (match) {
        return match[1]
          .split(',')
          .map((pt) => {
            const parts = pt.trim().split(/\s+/);
            return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
          })
          .filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
      }
    } else if (geomType === 'POLYGON' && wkt.startsWith('POLYGON((')) {
      const match = wkt.match(/POLYGON\(\(([^)]+)\)\)/);
      if (match) {
        const pts = match[1]
          .split(',')
          .map((pt) => {
            const parts = pt.trim().split(/\s+/);
            return { latitude: parseFloat(parts[1]), longitude: parseFloat(parts[0]) };
          })
          .filter((c) => !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude));
        // Remove the closing duplicate vertex added by WKT polygon serialization
        if (
          pts.length > 1 &&
          pts[0].longitude === pts[pts.length - 1].longitude &&
          pts[0].latitude === pts[pts.length - 1].latitude
        ) {
          pts.pop();
        }
        return pts;
      }
    }
  } catch {
    /* invalid WKT — fall back to manual GPS sub-table */
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

  // ── File upload state ──
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);

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
    if (!orgUnitId) {
      setPortOptions([]);
      return;
    }
    setLoadingPorts(true);
    try {
      const res = await portCRUD.findAll({ page: 1, size: 1000, orgUnitId });
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
    if (watchedOrgUnitId) {
      // During edit-mode data load, portId + berthCode are set together with orgUnitId
      // in the same setFieldsValue call — keep them. A manual orgUnit change always
      // clears portId/berthCode first via handleOrgUnitChange.
      if (!isEdit || !form.getFieldValue('portId')) {
        form.setFieldsValue({ portId: undefined, berthCode: undefined });
      }
      loadPortOptions(watchedOrgUnitId);
    } else {
      setPortOptions([]);
    }
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
          // Parse coordinates JSON string if present
          let parsedCoords: Array<{ latitude: number | null; longitude: number | null }> = [{ latitude: null, longitude: null }];
          if (data.coordinates) {
            try {
              const arr = typeof data.coordinates === 'string' ? JSON.parse(data.coordinates) : data.coordinates;
              if (Array.isArray(arr) && arr.length > 0) {
                parsedCoords = arr.map((c: any) => ({
                  latitude: c.latitude ?? c.lat ?? null,
                  longitude: c.longitude ?? c.lng ?? null,
                }));
              }
            } catch { /* keep default */ }
          }

          setCoordinateList(parsedCoords);

          // Load port options for the berth's orgUnitId
          if (data.orgUnitId) {
            await loadPortOptions(data.orgUnitId);
          }

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
            operationalStatus: data.operationalStatus,
            openingAnnouncementDate: data.openingAnnouncementDate ? data.openingAnnouncementDate : undefined,
            openingDecision: data.openingDecision,
            investmentAgreement: data.investmentAgreement,
            geometryType: data.geometryType || 'POINT',
            mapSymbolId: data.mapSymbolId,
            spatialId: data.spatialId,
            coordinateSystem: data.coordinateSystem,
            displayRule: data.displayRule,
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
      // Resolve provinceId from selected province name
      const provinceIdx = provinceName ? VIETNAM_PROVINCES.indexOf(provinceName) : -1;
      const provinceId = provinceIdx >= 0 ? provinceIdx + 1 : undefined;

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
        provinceId,
        detailedLocation: values.detailedLocation || undefined,
        structureType: values.structureType !== undefined && values.structureType !== null ? Number(values.structureType) : undefined,
        operationalFunction: values.operationalFunction || undefined,
        totalArea: values.totalArea !== undefined && values.totalArea !== null && !Number.isNaN(Number(values.totalArea)) ? Number(values.totalArea) : undefined,
        designThroughput: values.designThroughput !== undefined && values.designThroughput !== null && !Number.isNaN(Number(values.designThroughput)) ? Number(values.designThroughput) : undefined,
        currentThroughput: values.currentThroughput !== undefined && values.currentThroughput !== null && !Number.isNaN(Number(values.currentThroughput)) ? Number(values.currentThroughput) : undefined,
        maxVesselSize: values.maxVesselSize !== undefined && values.maxVesselSize !== null && !Number.isNaN(Number(values.maxVesselSize)) ? Number(values.maxVesselSize) : undefined,
        plannedThroughput: values.plannedThroughput !== undefined && values.plannedThroughput !== null && !Number.isNaN(Number(values.plannedThroughput)) ? Number(values.plannedThroughput) : undefined,
        latestCargoVolume: values.latestCargoVolume !== undefined && values.latestCargoVolume !== null && !Number.isNaN(Number(values.latestCargoVolume)) ? Number(values.latestCargoVolume) : undefined,
        operationalStatus: values.operationalStatus || undefined,
        openingAnnouncementDate: values.openingAnnouncementDate
          ? (typeof values.openingAnnouncementDate === 'string' ? values.openingAnnouncementDate : values.openingAnnouncementDate.format('YYYY-MM-DD'))
          : undefined,
        openingDecision: values.openingDecision || undefined,
        investmentAgreement: values.investmentAgreement || undefined,
        geometryType: values.geometryType || 'POINT',
        mapSymbolId: values.mapSymbolId || undefined,
        spatialId: values.spatialId || undefined,
        coordinateSystem: values.coordinateSystem !== undefined && values.coordinateSystem !== null ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule || undefined,
        coordinateList: effectiveCoords,
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

      // Upload files after berth is saved
      if (createdBerthId && uploadedFiles.length > 0) {
        for (const fileItem of uploadedFiles) {
          const originFile = fileItem.originFileObj as File;
          if (!originFile) continue;
          const formData = new FormData();
          formData.append('files', originFile);
          await api.post(`/v1/berths/${createdBerthId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      const successMsg =
        saveAction === 'DRAFT'
          ? 'Lưu tạm thành công'
            : saveAction === 'SAVE_AND_APPROVE'
            ? 'Phê duyệt thành công'
            : 'Gửi phê duyệt thành công';
      toast.success(successMsg);
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
  const btnStyle: React.CSSProperties = {
    ...pillStyle,
    fontFamily: fontSans,
    fontWeight: fontWeightMedium,
  };

  return (
    <Modal
      open
      title={isEdit ? 'Chỉnh sửa Bến cảng' : 'Tạo mới Bến cảng'}
      width={900}
      onCancel={() => navigate('/berth')}
      maskClosable={false}
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingTop: 8 } }}
      footer={[
        <Button
          key="cancel"
          style={{
            ...btnStyle,
            borderColor: borderDefault,
            minWidth: 100,
          }}
          onClick={() => navigate('/berth')}
        >
          Hủy
        </Button>,
        <Button
          key="draft"
          style={{
            ...btnStyle,
            borderColor: borderDefault,
            minWidth: 140,
          }}
          loading={submitting}
          onClick={() => handleSave('DRAFT')}
        >
          Lưu tạm
        </Button>,
        isSystemAdmin && (
          <Button
            key="submit"
            type="primary"
            style={{
              ...btnStyle,
              minWidth: 140,
            }}
            loading={submitting}
            onClick={() => handleSave('SUBMIT')}
          >
            Gửi phê duyệt
          </Button>
        ),
        isSystemAdmin && (
          <Button
            key="approve"
            style={{
              ...btnStyle,
              background: statusOperational,
              borderColor: statusOperational,
              color: surfaceCard,
              minWidth: 140,
            }}
            loading={submitting}
            onClick={() => handleSave('SAVE_AND_APPROVE')}
          >
            Phê duyệt
          </Button>
        ),
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ fontFamily: fontSans }}
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
                <div style={tabContentStyle}>
                  <Row gutter={24}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Đơn vị quản lý"
                        name="orgUnitId"
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ required: true, message: 'Đơn vị quản lý không được để trống' }]}
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
                          onChange={handleOrgUnitChange}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Cảng biển"
                        name="portId"
                        style={{ marginBottom: spaceFormField }}
                        rules={[{ required: true, message: 'Cảng biển không được để trống' }]}
                      >
                        <Select
                          placeholder={watchedOrgUnitId ? 'Chọn cảng biển...' : 'Vui lòng chọn Đơn vị quản lý trước'}
                          style={{ fontFamily: fontSans }}
                          loading={loadingPorts}
                          disabled={!watchedOrgUnitId}
                          options={portOptions}
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
                        label="Mã bến"
                        name="berthCode"
                        style={{ marginBottom: spaceFormField }}
                        tooltip="Mã bến được sinh tự động, không thể chỉnh sửa"
                      >
                        <Input
                          disabled
                          placeholder={berthCodeLoading ? 'Đang sinh mã...' : watchedPortId ? 'Mã tự động' : 'Chọn Cảng biển để sinh mã'}
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
                        label="Tên bến cảng"
                        name="berthName"
                        rules={[
                          { required: true, message: 'Tên bến cảng không được để trống' },
                          { max: 255, message: 'Tên bến cảng tối đa 255 ký tự' },
                        ]}
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input
                          placeholder="VD: Bến cảng Hải Phòng"
                          maxLength={255}
                          style={{ ...pillStyle, fontFamily: fontSans }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Tuyến đường thủy"
                        name="waterway"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input
                          placeholder="VD: Tuyến sông Bạch Đằng"
                          maxLength={255}
                          style={{ ...pillStyle, fontFamily: fontSans }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Đơn vị khai thác"
                        name="operator"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input
                          placeholder="VD: Công ty CP Cảng Hải Phòng"
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
                        name="provinceId"
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
                  </Row>

                  <Row gutter={24}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Loại bến"
                        name="structureType"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn loại bến..."
                          style={{ fontFamily: fontSans }}
                          options={STRUCTURE_TYPE_OPTIONS}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Chức năng khai thác"
                        name="operationalFunction"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input
                          placeholder="VD: Bốc xếp hàng container"
                          maxLength={500}
                          style={{ ...pillStyle, fontFamily: fontSans }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Diện tích (km²)"
                        name="totalArea"
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
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Năng lực thiết kế (tấn/năm)"
                        name="designThroughput"
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

                  <Row gutter={24}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Năng lực hiện tại (tấn/năm)"
                        name="currentThroughput"
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
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Cỡ tàu lớn nhất (DWT)"
                        name="maxVesselSize"
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

                  <Row gutter={24}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Năng lực quy hoạch (tấn/năm)"
                        name="plannedThroughput"
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
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Sản lượng mới nhất (tấn/năm)"
                        name="latestCargoVolume"
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

                  <Row gutter={24}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Trạng thái hoạt động"
                        name="operationalStatus"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          placeholder="Chọn trạng thái..."
                          style={{ fontFamily: fontSans }}
                          options={Object.entries(BERTH_ACTIVITY_STATUS_MAP).map(([value, { label }]) => ({
                            value,
                            label,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'announcement',
              label: 'Thông tin công bố',
              children: (
                <div style={tabContentStyle}>
                  <Row gutter={24}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Ngày công bố mở cảng"
                        name="openingAnnouncementDate"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <DatePicker
                          placeholder="Chọn ngày..."
                          format="DD/MM/YYYY"
                          style={{ width: '100%', ...pillStyle, fontFamily: fontSans }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Quyết định mở cảng"
                        name="openingDecision"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input
                          placeholder="VD: Số 123/QĐ-BGTVT"
                          maxLength={500}
                          style={{ ...pillStyle, fontFamily: fontSans }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Thỏa thuận đầu tư"
                        name="investmentAgreement"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Input
                          placeholder="VD: Số 456/HĐ-ĐT"
                          maxLength={500}
                          style={{ ...pillStyle, fontFamily: fontSans }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'location',
              label: 'Vị trí',
              children: (
                <div style={tabContentStyle}>
                  <Row gutter={24}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Loại đối tượng"
                        name="geometryType"
                        style={{ marginBottom: spaceFormField }}
                      >
                        <Select
                          style={{ fontFamily: fontSans }}
                          options={GEOMETRY_TYPE_OPTIONS}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label="Biểu tượng bản đồ"
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

                  {/* ── GisLocationSelector — map-based coordinate picker ── */}
                  <Row gutter={24}>
                    <Col xs={24}>
                      <Form.Item
                        name="gisLocation"
                        label={<span style={{ color: actionPrimary, fontFamily: fontSans }}>Tọa độ GPS</span>}
                        required
                        style={{ marginBottom: spaceFormField }}
                      >
                        <GisLocationSelector defaultGeometryType={watchedGeometryType || 'POINT'} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'files',
              label: 'File đính kèm',
              children: (
                <div style={tabContentStyle}>
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
                </div>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
}
