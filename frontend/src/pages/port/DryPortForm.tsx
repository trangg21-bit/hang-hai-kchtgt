import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Row,
  Col,
  Form,
  Input,
  Select,
  InputNumber,
  type InputNumberProps,
  Tabs,
  Button,
  Space,
  DatePicker,
  Modal,
  Table,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SlidersOutlined,
  FileTextOutlined,
  DownOutlined,
  RightOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FileOutlined,
} from '@ant-design/icons';
import {
  colors,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  actionPrimary,
  statusCritical,
  statusOperational,
  statusAttention,
  fontSizeSm,
  fontSizeLg,
  fontWeightBold,
  fontWeightMedium,
  radiusPill,
  radiusMd,
  spaceXs,
  spaceSm,
  spaceFormField,
  surfaceCard,
  readonlyInputStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  drawerTabBarStyle,
  drawerFormScrollStyle,
  DRAWER_TABLE_SCROLL_Y,
  sidebarBg,
  textAreaStyle,
} from '../../themetokenchk';
import { VIETNAM_PROVINCES } from '../../types/common';
import { fmtInputNumber, normalizeSafeNumber } from '../../utils/numFmt';
import { organizationService, type Organization } from '../../services/organizationService';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { symbolService, type Symbol } from '../../services/symbolService';
import { userService } from '../../services/userService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import DetailTable from '../../components/shared/DetailTable';
import { useAuthStore } from '../../store/authStore';
import { GEOMETRY_POINT_COUNT, parseWktToCoordinates } from '../../utils/gisGeometry';
import toast from '../../components/ToastNotification';
import {
  REGION_OPTIONS,
  PORT_STATUS_OPTIONS,
  GEOMETRY_TYPE_OPTIONS,
  COORD_SYS_OPTIONS,
  ddToDms,
  buildCoordinatesWkt,
} from './dry-port/schema';
import type { DryPort, SaveAction, DryPortAttachment } from './dry-port/types';
import {
  createDryPort,
  updateDryPort,
  fetchDryPortById,
  generateDryPortCode,
  fetchDryPortAttachmentList,
  uploadDryPortAttachments,
  deleteDryPortAttachment,
  downloadDryPortAttachment,
} from './dry-port/api';

const fontSizeMd = 13.5;

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };

type NumberInputWithCountProps = InputNumberProps<any> & { maxLength: number };

function NumberInputWithCount({ maxLength, value, ...inputProps }: NumberInputWithCountProps) {
  const count = String(value ?? '').length;

  return (
    <InputNumber
      stringMode
      {...inputProps}
      value={value}
      maxLength={maxLength}
      suffix={<span style={{ color: textSecondary, fontSize: fontSizeMd }}>{count}/{maxLength}</span>}
    />
  );
}

const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const dmsUnitStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 3px',
  background: '#f5f5f5',
  border: `1px solid ${borderDefault}`,
  borderLeft: 0,
  borderRight: 0,
  height: 32,
  fontSize: fontSizeSm,
  color: textTertiary,
};

const dmsUnitEndStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 3px',
  background: '#f5f5f5',
  border: `1px solid ${borderDefault}`,
  borderLeft: 0,
  height: 32,
  borderRadius: '0 999px 999px 0',
  fontSize: fontSizeSm,
  color: textTertiary,
};

/**
 * Bảng tọa độ DMS 3 ô Độ, Phút, Giây bo tròn chuẩn PortForm / BerthForm.
 */
const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  const started = dVal != null || mVal != null || sVal != null;
  const inputs = [
    {
      key: 'd',
      base: 'Độ',
      value: dVal,
      max: maxDeg,
      radius: '999px 0 0 999px',
      unit: '°',
      unitStyle: dmsUnitStyle,
      basis: '1 0 108px',
      width: 108,
      step: 1,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm',
      base: 'Phút',
      value: mVal,
      max: 59,
      radius: '0',
      unit: "'",
      unitStyle: dmsUnitStyle,
      basis: '1 0 108px',
      width: 108,
      step: 1,
      msg: started && mVal == null ? 'Phút bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, v, sVal ?? null),
    },
    {
      key: 's',
      base: 'Giây',
      value: sVal,
      max: 59.99,
      radius: '0',
      unit: '"',
      unitStyle: dmsUnitEndStyle,
      basis: '1.2 0 130px',
      width: 130,
      step: 0.01,
      formatter: fmtInputNumber,
      msg: started && sVal == null ? 'Giây bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, mVal ?? null, v),
    },
  ] as const;

  const inputRow = (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ display: 'flex', alignItems: 'center', flex: inp.basis, width: inp.width, minWidth: 0 }}>
          <InputNumber
            min={0}
            max={inp.max}
            step={inp.step}
            value={inp.value}
            onChange={inp.onEdit}
            placeholder={inp.base}
            formatter={inp.formatter}
            style={{
              width: '100%',
              borderRadius: inp.radius,
              height: 32,
              fontSize: fontSizeMd,
              borderColor: inp.msg ? statusCritical : undefined,
            }}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  const hasAnyMsg = inputs.some((inp) => !!inp.msg);
  const messageRow = hasAnyMsg ? (
    <div style={{ display: 'flex', width: '100%', minWidth: 0, marginTop: 2 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, width: inp.width, minWidth: 0 }}>
          {inp.msg ? (
            <span style={{ color: statusCritical, fontSize: 11, lineHeight: '13px', display: 'block' }}>
              {inp.msg}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
      {inputRow}
      {messageRow}
    </div>
  );
};

export interface DryPortFormHandle {
  submit: (saveAction: SaveAction) => void;
}

export interface DryPortFormProps {
  form: any;
  id?: string;
  onFinish: (saved: boolean) => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export default forwardRef<DryPortFormHandle, DryPortFormProps>(function DryPortForm(
  { form, id, onFinish, onSubmittingChange }: DryPortFormProps,
  ref,
) {
  const isEdit = !!id;
  const [activeTabKey, setActiveTabKey] = useState('general');
  const [codeLoading, setCodeLoading] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const currentUser = useAuthStore((s) => s.user);

  const watchedGeometryType = Form.useWatch('geometryType', form);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<
    Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>
  >([]);
  const hasCoordinates = coordinateList.some((c) => (c.latD ?? c.latM ?? c.latS) != null && (c.lngD ?? c.lngM ?? c.lngS) != null);
  const hasLocation = Boolean(watchedGeometryType || hasCoordinates);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsPage, setGpsPage] = useState(1);
  const [gisModalOpen, setGisModalOpen] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<DryPortAttachment[]>([]);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const [pendingDeletedAttIds, setPendingDeletedAttIds] = useState<string[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewImageName, setPreviewImageName] = useState<string>('');
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then((r) => setSymbols(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingOrgs(true);
    organizationService
      .list({ pageSize: 1000 })
      .then((r) => setOrganizations(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingOrgs(false));
  }, []);

  // Tự sinh mã khi thêm mới
  useEffect(() => {
    if (!isEdit) {
      setCodeLoading(true);
      generateDryPortCode()
        .then((code) => {
          if (code) form.setFieldsValue({ dryPortCode: code });
        })
        .catch(() => {})
        .finally(() => setCodeLoading(false));
    }
  }, [isEdit, form]);

  // Tự động set số dòng GPS khi thay đổi loại đối tượng
  useEffect(() => {
    if (!watchedGeometryType) {
      form.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined });
      return;
    }
    form.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
    setCoordinateList((prev) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      }
      if (watchedGeometryType === 'POINT' && prev.length > 1) {
        return [prev[0]];
      }
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      }
      return prev;
    });
  }, [watchedGeometryType, form]);

  // Load dữ liệu khi chỉnh sửa
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const data: DryPort = await fetchDryPortById(id);
        const pts = parseWktToCoordinates(data.coordinates);
        if (pts.length > 0) {
          setCoordinateList(
            pts.map((p) => {
              const la = ddToDms(p.latitude);
              const lo = ddToDms(p.longitude);
              return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
            }),
          );
        } else if (data.latitude != null && data.longitude != null) {
          const la = ddToDms(data.latitude);
          const lo = ddToDms(data.longitude);
          setCoordinateList([{ latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s }]);
        }

        form.setFieldsValue({
          dryPortCode: data.dryPortCode,
          dryPortName: data.dryPortName,
          orgUnitId: data.orgUnitId || undefined,
          operatingUnit: data.operatingUnit,
          region: data.region,
          provinceId: data.provinceId != null ? (VIETNAM_PROVINCES[data.provinceId - 1] || undefined) : undefined,
          detailedLocation: data.detailedLocation,
          transportCorridor: data.transportCorridor,
          area: normalizeSafeNumber(data.area),
          teuCapacity: normalizeSafeNumber(data.teuCapacity),
          warehouseArea: normalizeSafeNumber(data.warehouseArea),
          yardArea: normalizeSafeNumber(data.yardArea),
          connectionMode: data.connectionMode,
          portStatus: data.portStatus !== undefined && data.portStatus !== null ? data.portStatus : 1,
          remarks: data.remarks,
          announcementTime: data.announcementTime ? dayjs(data.announcementTime) : undefined,
          announcementDecisionNumber: data.announcementDecisionNumber,
          announcementDecisionDate: data.announcementDecisionDate ? dayjs(data.announcementDecisionDate) : undefined,
          announcementOrg: data.announcementOrg,
          geometryType: data.geometryType || undefined,
          mapSymbolId: data.mapSymbolId,
          coordinateSystem: data.coordinateSystem,
          displayRule: data.geometryType || data.coordinates ? 'Độ, phút, giây (DMS)' : undefined,
        });

        // Load attachments
        const atts = await fetchDryPortAttachmentList(id);
        setAttachments(atts);
      } catch {
        toast.error('Không thể tải thông tin cảng cạn');
      }
    })();
  }, [isEdit, id, form]);

  const addGpsPoint = () => {
    setCoordinateList((prev) => [...(prev || []), { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]);
  };

  const removeCoordinate = (index: number) => {
    setCoordinateList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGpsPoint = (index: number, type: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    setCoordinateList((prev) => {
      const next = [...prev];
      if (!next[index]) next[index] = { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null };
      if (type === 'lat') {
        next[index] = { ...next[index], latD: d, latM: m, latS: s };
      } else {
        next[index] = { ...next[index], lngD: d, lngM: m, lngS: s };
      }
      return next;
    });
  };

  // Attachments handling
  const handleBeforeUpload = (file: File): false => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File vượt quá 20MB');
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) {
      toast.error('Định dạng không hỗ trợ (chỉ chấp nhận PDF, DOC/DOCX, XLS/XLSX, JPG, PNG, TIFF)');
      return false;
    }
    if (attachments.length + pendingUploadFiles.length >= 20) {
      toast.error('Tối đa 20 file đính kèm');
      return false;
    }
    setPendingUploadFiles((prev) => [...prev, file]);
    return false;
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
    setPendingDeletedAttIds((prev) => [...prev, attId]);
  };

  const handleRemovePendingFile = (idx: number) => {
    setPendingUploadFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const openPreview = (att: DryPortAttachment | File) => {
    if (att instanceof File) {
      const url = URL.createObjectURL(att);
      setPreviewImageUrl(url);
      setPreviewImageName(att.name);
      setPreviewModalOpen(true);
    } else {
      if (!id || !att.id) return;
      setPreviewImageName(att.fileName);
      setPreviewModalOpen(true);
      setPreviewImageUrl('');
      // Download blob preview
      import('../../services/api').then(({ default: api }) => {
        api
          .get(`/v1/dry-ports/${id}/attachments/${att.id}/download`, { responseType: 'blob' })
          .then((res) => {
            const url = URL.createObjectURL(new Blob([res.data]));
            setPreviewImageUrl(url);
          })
          .catch(() => {
            toast.error('Không thể tải hình ảnh để xem trước');
          });
      });
    }
  };

  const handleSave = useCallback(
    async (saveAction: SaveAction) => {
      onSubmittingChange?.(true);
      try {
        const values = await form.validateFields();
        const dryPortName = String(values.dryPortName ?? '').trim();
        const orgUnitId = values.orgUnitId || undefined;
        const provinceName: string | undefined = values.provinceId;

        if (!dryPortName) {
          toast.error('Tên cảng cạn là bắt buộc');
          onSubmittingChange?.(false);
          return;
        }

        const toPayloadNumber = (v: unknown): number | undefined => {
          if (v == null) return undefined;
          const s = String(v).trim();
          if (s === '') return undefined;
          const num = Number(s);
          return isNaN(num) ? undefined : num;
        };

        if (saveAction === 'SUBMIT' || saveAction === 'SAVE_AND_APPROVE') {
          const missing: string[] = [];
          if (!orgUnitId) missing.push('Đơn vị quản lý');
          if (!provinceName) missing.push('Địa điểm (Tỉnh/Thành Phố)');
          if (!values.detailedLocation?.trim()) missing.push('Địa điểm chi tiết');
          if (toPayloadNumber(values.teuCapacity) == null) missing.push('Công suất khai thác');
          if (values.portStatus == null) missing.push('Tình trạng');
          if (missing.length > 0) {
            toast.error(`Vui lòng hoàn thiện thông tin trước khi lưu. Thiếu: ${missing.join(', ')}`);
            onSubmittingChange?.(false);
            return;
          }
        }

        const manualCoords = coordinateList
          .filter((c) => (c.latD ?? c.latM ?? c.latS) != null && (c.lngD ?? c.lngM ?? c.lngS) != null)
          .map((c) => ({
            latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
            longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
          }));

        if (values.geometryType) {
          const minCount = GEOMETRY_POINT_COUNT[values.geometryType] ?? 1;
          if (manualCoords.length < minCount) {
            toast.error(
              values.geometryType === 'POLYGON'
                ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ'
                : values.geometryType === 'LINE'
                  ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ'
                  : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ',
            );
            setActiveTabKey('gis');
            onSubmittingChange?.(false);
            return;
          }
        }

        if (hasLocation && !values.mapSymbolId) {
          toast.error('Vui lòng chọn biểu tượng bản đồ');
          setActiveTabKey('gis');
          onSubmittingChange?.(false);
          return;
        }

        if (manualCoords.length > 0 && !values.geometryType) {
          toast.error('Loại đối tượng là bắt buộc khi có tọa độ');
          setActiveTabKey('gis');
          onSubmittingChange?.(false);
          return;
        }

        const actionMap: Partial<Record<SaveAction, string>> = {
          DRAFT: 'draft',
          SUBMIT: 'submit',
          SAVE_AND_APPROVE: 'approve',
          APPROVE: 'approve',
        };

        const payload: any = {
          saveAction: actionMap[saveAction],
          dryPortCode: String(values.dryPortCode || '').trim() || undefined,
          dryPortName,
          orgUnitId,
          geometryType: values.geometryType || undefined,
          latitude: manualCoords.length > 0 ? manualCoords[0].latitude : undefined,
          longitude: manualCoords.length > 0 ? manualCoords[0].longitude : undefined,
          coordinates: buildCoordinatesWkt(values.geometryType, manualCoords),
          operatingUnit: values.operatingUnit || undefined,
          region: values.region || undefined,
          provinceId: provinceName ? VIETNAM_PROVINCES.indexOf(provinceName) + 1 : undefined,
          detailedLocation: values.detailedLocation || undefined,
          transportCorridor: values.transportCorridor || undefined,
          area: toPayloadNumber(values.area),
          teuCapacity: toPayloadNumber(values.teuCapacity),
          warehouseArea: toPayloadNumber(values.warehouseArea),
          yardArea: toPayloadNumber(values.yardArea),
          connectionMode: values.connectionMode || undefined,
          portStatus: values.portStatus !== undefined && values.portStatus !== null ? Number(values.portStatus) : undefined,
          remarks: values.remarks || undefined,
          mapSymbolId: values.mapSymbolId || undefined,
          coordinateSystem:
            values.coordinateSystem !== undefined && values.coordinateSystem !== null ? Number(values.coordinateSystem) : undefined,
          displayRule: values.displayRule != null && !Number.isNaN(Number(values.displayRule)) ? Number(values.displayRule) : undefined,
          announcementTime: values.announcementTime
            ? typeof values.announcementTime === 'string'
              ? values.announcementTime
              : values.announcementTime.toISOString()
            : undefined,
          announcementDecisionNumber: values.announcementDecisionNumber || undefined,
          announcementDecisionDate: values.announcementDecisionDate
            ? typeof values.announcementDecisionDate === 'string'
              ? values.announcementDecisionDate
              : values.announcementDecisionDate.format('YYYY-MM-DD')
            : undefined,
          announcementOrg: values.announcementOrg || undefined,
        };

        Object.keys(payload).forEach((key) => {
          if (payload[key] === undefined) delete payload[key];
        });

        let savedId: string | undefined;
        if (isEdit && id) {
          await updateDryPort({ ...payload, id });
          savedId = id;
        } else {
          const res = await createDryPort(payload);
          savedId = res?.id;
        }

        // Xóa các file đính kèm được đánh dấu xóa
        if (savedId && pendingDeletedAttIds.length > 0) {
          for (const attId of pendingDeletedAttIds) {
            await deleteDryPortAttachment(savedId, attId);
          }
        }

        // Upload các file đính kèm mới
        if (savedId && pendingUploadFiles.length > 0) {
          const uploadedCount = await uploadDryPortAttachments(savedId, pendingUploadFiles);
          if (uploadedCount > 0) toast.success(`Đã tải lên ${uploadedCount} tệp đính kèm`);
        }

        const successMsg =
          saveAction === 'DRAFT'
            ? 'Lưu tạm thành công'
            : saveAction === 'SUBMIT'
              ? 'Lưu và gửi phê duyệt thành công'
              : saveAction === 'SAVE_AND_APPROVE'
                ? 'Lưu và phê duyệt thành công'
                : 'Cập nhật thành công';
        toast.success(successMsg);

        onFinish(true);
      } catch (err: unknown) {
        if ((err as any)?.errorFields) {
          const errFields: Array<{ name: Array<string | number>; errors?: string[] }> = (err as any)?.errorFields ?? [];
          const firstError = errFields[0]?.errors?.[0] || 'Vui lòng kiểm tra lại các trường bắt buộc';
          toast.error(firstError);
          if (errFields.some((f) => ['mapSymbolId', 'coordinateSystem', 'displayRule', 'geometryType'].includes(String(f.name[0])))) {
            setActiveTabKey('gis');
          } else {
            setActiveTabKey('general');
          }
        } else {
          const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại';
          toast.error(msg);
        }
      } finally {
        onSubmittingChange?.(false);
      }
    },
    [form, coordinateList, isEdit, id, onFinish, onSubmittingChange, hasLocation, pendingDeletedAttIds, pendingUploadFiles],
  );

  useImperativeHandle(
    ref,
    () => ({
      submit: (saveAction: SaveAction) => {
        void handleSave(saveAction);
      },
    }),
    [handleSave],
  );

  const totalAttachmentsCount = attachments.length + pendingUploadFiles.length;

  const formTabs = [
    // ── Tab 1: Thông tin chung ──
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
          {/* Section 1: Thông tin cơ bản & Quản lý vận hành */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <BankOutlined style={{ color: actionPrimary }} />
                <span>Thông tin cơ bản & Quản lý vận hành</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="orgUnitId"
                  {...labelProps('Đơn vị quản lý')}
                  required
                  rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <OrgUnitTreeSelect
                    organizations={organizations}
                    placeholder="Chọn đơn vị quản lý..."
                    loading={loadingOrgs}
                    disabled={isEdit}
                    showPath
                    treeDefaultExpandAll={false}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dryPortCode"
                  {...labelProps('Mã cảng cạn')}
                  style={{ marginBottom: spaceFormField }}
                  tooltip="Mã cảng cạn được sinh tự động, không thể chỉnh sửa"
                >
                  <Input disabled placeholder={codeLoading ? 'Đang sinh mã...' : 'Mã tự động'} style={readonlyInputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="dryPortName"
                  {...labelProps('Tên cảng cạn')}
                  required
                  rules={[
                    { required: true, message: 'Tên cảng cạn không được để trống' },
                    { max: 255, message: 'Tên cảng cạn tối đa 255 ký tự' },
                  ]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input placeholder="Nhập tên cảng cạn" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="operatingUnit" {...labelProps('Đơn vị khai thác')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập đơn vị khai thác" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="region" {...labelProps('Khu vực')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn khu vực..." allowClear options={REGION_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="provinceId"
                  {...labelProps('Địa điểm (Tỉnh/Thành Phố)')}
                  required
                  rules={[{ required: true, message: 'Địa điểm (Tỉnh/Thành phố) là bắt buộc' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    showSearch
                    placeholder="Chọn tỉnh/thành phố..."
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="portStatus"
                  {...labelProps('Tình trạng')}
                  required
                  rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}
                  style={{ marginBottom: spaceFormField }}
                  initialValue={1}
                >
                  <Select options={PORT_STATUS_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="transportCorridor" {...labelProps('Hành lang vận tải')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập hành lang vận tải" maxLength={100} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="connectionMode"
                  {...labelProps('Phương thức kết nối giao thông với cảng')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập phương thức kết nối giao thông với cảng"
                    maxLength={2000}
                    showCount
                    style={textAreaStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  name="detailedLocation"
                  {...labelProps('Địa điểm chi tiết')}
                  required
                  rules={[{ required: true, message: 'Địa điểm chi tiết là bắt buộc' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input placeholder="Nhập địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="remarks" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={3} placeholder="Nhập ghi chú" maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 2: Quy mô & Năng lực khai thác */}
          <div style={sectionBoxStyle}>
            <div
              onClick={() => setScaleOpen(!scaleOpen)}
              style={{
                ...sectionHeaderStyle,
                marginBottom: scaleOpen ? 12 : 0,
                paddingBottom: scaleOpen ? 8 : 0,
                borderBottom: scaleOpen ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <SlidersOutlined style={{ color: actionPrimary }} />
                <span>Quy mô & Năng lực khai thác</span>
              </div>
              <span style={{ color: actionPrimary, fontSize: 12 }}>{scaleOpen ? <DownOutlined /> : <RightOutlined />}</span>
            </div>
            {scaleOpen && (
              <>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="teuCapacity"
                      {...labelProps('Công suất khai thác (TEU/năm)')}
                      required
                      rules={[{ required: true, message: 'Công suất khai thác là bắt buộc' }]}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <NumberInputWithCount
                        min={0}
                        step={0.01}
                        maxLength={20}
                        placeholder="0"
                        style={numberInputStyle}
                        formatter={fmtInputNumber}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="area" {...labelProps('Tổng diện tích cảng (m²)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item name="warehouseArea" {...labelProps('Diện tích kho (m²)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="yardArea" {...labelProps('Diện tích bãi (m²)')} style={{ marginBottom: spaceFormField }}>
                      <NumberInputWithCount min={0} step={0.01} maxLength={20} placeholder="0" style={numberInputStyle} formatter={fmtInputNumber} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </div>

          {/* Section 3: Thông tin công bố mở, đưa vào sử dụng */}
          <div style={{ ...sectionBoxStyle, padding: announcementOpen ? '14px 18px 10px 18px' : '10px 18px' }}>
            <div
              onClick={() => setAnnouncementOpen(!announcementOpen)}
              style={{
                ...sectionHeaderStyle,
                marginBottom: announcementOpen ? 12 : 0,
                paddingBottom: announcementOpen ? 8 : 0,
                borderBottom: announcementOpen ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={sectionTitleStyle}>
                <FileTextOutlined style={{ color: actionPrimary }} />
                <span>Thông tin công bố mở, đưa vào sử dụng</span>
              </div>
              <span style={{ color: actionPrimary, fontSize: 12 }}>{announcementOpen ? <DownOutlined /> : <RightOutlined />}</span>
            </div>
            {announcementOpen && (
              <>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="announcementDecisionNumber"
                      {...labelProps('Quyết định công bố số')}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <Input placeholder="Nhập quyết định công bố số" maxLength={20} showCount style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="announcementDecisionDate"
                      {...labelProps('Ngày ra quyết định công bố')}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <DatePicker
                        placeholder="Chọn ngày ra quyết định"
                        format="DD/MM/YYYY"
                        style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={[24, 0]}>
                  <Col span={12}>
                    <Form.Item
                      name="announcementOrg"
                      {...labelProps('Đơn vị ra quyết định công bố')}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <Input placeholder="Nhập đơn vị ra quyết định" maxLength={255} showCount style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="announcementTime" {...labelProps('Thời điểm công bố mở')} style={{ marginBottom: spaceFormField }}>
                      <DatePicker
                        placeholder="Chọn thời điểm công bố mở"
                        format="DD/MM/YYYY"
                        style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </div>
        </div>
      ),
    },

    // ── Tab 2: Thông tin vị trí ──
    {
      key: 'gis',
      label: `Thông tin vị trí (${coordinateList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <EnvironmentOutlined style={{ color: actionPrimary }} />
                <span>Thông số đối tượng bản đồ</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="geometryType"
                  {...labelProps('Loại đối tượng')}
                  required={hasCoordinates}
                  rules={hasCoordinates ? [{ required: true, message: 'Loại đối tượng là bắt buộc khi có tọa độ' }] : []}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder="Chọn loại đối tượng"
                    allowClear
                    options={GEOMETRY_TYPE_OPTIONS}
                    style={selectStyle}
                    onChange={(val) => {
                      if (!val) {
                        form.setFieldsValue({
                          mapSymbolId: undefined,
                          coordinateSystem: undefined,
                          displayRule: undefined,
                        });
                        setCoordinateList([]);
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="mapSymbolId"
                  {...labelProps('Biểu tượng')}
                  required={hasLocation}
                  rules={hasLocation ? [{ required: true, message: 'Vui lòng chọn biểu tượng bản đồ' }] : []}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder="Chọn biểu tượng bản đồ"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    disabled={!watchedGeometryType}
                    style={selectStyle}
                  >
                    {symbols.map((sym) => (
                      <Select.Option
                        key={sym.id}
                        value={sym.id}
                        label={(sym as any).code ? `${sym.name} (${(sym as any).code})` : sym.name}
                      >
                        <Space>
                          {sym.image && (
                            <img
                              src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                              alt={sym.name}
                              style={{ width: 20, height: 20, objectFit: 'contain' }}
                            />
                          )}
                          <span>{(sym as any).code ? `${sym.name} (${(sym as any).code})` : sym.name}</span>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Chọn quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div style={sectionBoxStyle}>
            <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
              <span
                style={{
                  color: colors.sidebarBg,
                  fontWeight: fontWeightBold,
                  fontSize: fontSizeMd,
                  lineHeight: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 32,
                }}
              >
                Tọa độ GPS ({coordinateList.length})
              </span>
              <Space size={8}>
                <Button
                  icon={<EnvironmentOutlined style={{ color: !watchedGeometryType ? undefined : actionPrimary }} />}
                  onClick={() => setGisModalOpen(true)}
                  disabled={!watchedGeometryType}
                  style={
                    !watchedGeometryType
                      ? {
                          height: 32,
                          fontSize: fontSizeMd,
                          padding: '0 14px',
                          borderRadius: radiusPill,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          opacity: 0.6,
                          cursor: 'not-allowed',
                        }
                      : {
                          ...outlineButtonStyle,
                          height: 32,
                          fontSize: fontSizeMd,
                          padding: '0 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }
                  }
                >
                  Chọn tọa độ trên bản đồ
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addGpsPoint}
                  disabled={!watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)}
                  style={
                    !watchedGeometryType || (watchedGeometryType === 'POINT' && coordinateList.length >= 1)
                      ? {
                          height: 32,
                          fontSize: fontSizeMd,
                          padding: '0 14px',
                          borderRadius: radiusPill,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#f5f5f5',
                          borderColor: '#d9d9d9',
                          color: 'rgba(0, 0, 0, 0.25)',
                          cursor: 'not-allowed',
                        }
                      : {
                          ...primaryButtonStyle,
                          height: 32,
                          fontSize: fontSizeMd,
                          padding: '0 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }
                  }
                  title={watchedGeometryType === 'POINT' && coordinateList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined}
                >
                  Thêm tọa độ
                </Button>
              </Space>
            </div>
            {gpsError && (
              <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
              </div>
            )}
            {coordinateList.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block' }}>Chưa có tọa độ nào.</span>
              </div>
            ) : (
              <Table
                size="small"
                tableLayout="fixed"
                rowKey={(r: any, idx?: number) => r?._idx ?? String(idx)}
                pagination={
                  coordinateList.length > 10
                    ? {
                        current: gpsPage,
                        pageSize: 10,
                        total: coordinateList.length,
                        onChange: (p) => setGpsPage(p),
                        showSizeChanger: false,
                        size: 'small',
                      }
                    : false
                }
                dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
                locale={{ emptyText: 'Chưa có tọa độ GPS nào' }}
                columns={[
                  {
                    title: 'STT',
                    width: 60,
                    align: 'center' as const,
                    render: (_v: any, _r: any, idx?: number) => (gpsPage - 1) * 10 + (idx ?? 0) + 1,
                  },
                  {
                    title: 'Vĩ độ (Latitude - N)',
                    key: 'lat',
                    render: (_v: any, record: any) =>
                      renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                  },
                  {
                    title: 'Kinh độ (Longitude - E)',
                    key: 'lng',
                    render: (_v: any, record: any) =>
                      renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
                  },
                  {
                    title: '',
                    width: 50,
                    align: 'center' as const,
                    render: (_v: any, record: any) => (
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeCoordinate(record._idx)} />
                    ),
                  },
                ]}
              />
            )}
          </div>
        </div>
      ),
    },

    // ── Tab 3: File đính kèm ──
    {
      key: 'files',
      label: `File đính kèm (${totalAttachmentsCount})`,
      children: (
        <div style={drawerFormScrollStyle}>
          <div style={sectionBoxStyle}>
            <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
              <span
                style={{
                  color: colors.sidebarBg,
                  fontWeight: fontWeightBold,
                  fontSize: fontSizeMd,
                  lineHeight: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 32,
                }}
              >
                Danh sách tệp đính kèm ({totalAttachmentsCount})
              </span>
              <label
                style={{
                  ...primaryButtonStyle,
                  height: 32,
                  fontSize: fontSizeMd,
                  padding: '0 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  borderRadius: radiusPill,
                }}
              >
                <PlusOutlined /> Chọn tệp tải lên
                <input
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const fl = e.target.files;
                    if (fl) {
                      Array.from(fl).forEach((file) => handleBeforeUpload(file));
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {totalAttachmentsCount === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block' }}>Chưa có tệp đính kèm nào.</span>
              </div>
            ) : (
              <DetailTable
                scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
                dataSource={[
                  ...attachments.map((a) => ({ ...a, _isExisting: true })),
                  ...pendingUploadFiles.map((f, i) => ({
                    id: `new-${i}`,
                    fileName: f.name,
                    fileSize: f.size,
                    uploadedByName: currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
                    uploadedAt: dayjs().toISOString(),
                    _isExisting: false,
                    _rawFile: f,
                    _idx: i,
                  })),
                ]}
                emptyText="Chưa có tệp đính kèm nào"
                columns={[
                  { title: 'STT', width: 50, align: 'center' as const, render: (_v, _r, index) => index + 1 },
                  {
                    title: 'Tên tài liệu',
                    dataIndex: 'fileName',
                    key: 'fileName',
                    render: (v: string, rec: any) => {
                      const isImg = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(v || '');
                      return (
                        <span
                          title={isImg ? `${v} (Nhấp để xem trước ảnh)` : `${v} (Tệp tài liệu)`}
                          onClick={() => {
                            if (isImg) openPreview(rec._isExisting ? rec : rec._rawFile);
                            else if (rec._isExisting && id) void downloadDryPortAttachment(id, rec.id, v);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: rec._isExisting || isImg ? 'pointer' : 'default',
                            color: isImg || rec._isExisting ? actionPrimary : textPrimary,
                            fontWeight: fontWeightMedium,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {isImg ? (
                            <FileImageOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
                          ) : (
                            <FileOutlined style={{ color: textTertiary, flexShrink: 0 }} />
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || ''}</span>
                        </span>
                      );
                    },
                  },
                  {
                    title: 'Dung lượng',
                    dataIndex: 'fileSize',
                    key: 'fileSize',
                    width: 120,
                    align: 'left' as const,
                    render: (v: number) =>
                      v ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : '',
                  },
                  {
                    title: 'Người tải lên',
                    dataIndex: 'uploadedByName',
                    key: 'uploadedByName',
                    width: 180,
                    render: (v: string, rec: any) => v || (rec.uploadedBy ? userMap.get(rec.uploadedBy) || rec.uploadedBy : ''),
                  },
                  {
                    title: 'Ngày tải lên',
                    dataIndex: 'uploadedAt',
                    key: 'uploadedAt',
                    width: 150,
                    align: 'left' as const,
                    render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : ''),
                  },
                  {
                    title: 'Thao tác',
                    key: 'actions',
                    width: 90,
                    align: 'center' as const,
                    render: (_: any, rec: any) => {
                      const fname: string = rec?.fileName || '';
                      const isImg = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fname);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {isImg && (
                            <Tooltip title="Xem chi tiết ảnh">
                              <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined style={{ color: actionPrimary, fontSize: 16 }} />}
                                onClick={() => openPreview(rec._isExisting ? rec : rec._rawFile)}
                              />
                            </Tooltip>
                          )}
                          {rec._isExisting && id && (
                            <Tooltip title="Tải xuống tệp">
                              <Button
                                type="text"
                                size="small"
                                icon={<DownloadOutlined style={{ color: actionPrimary, fontSize: 16 }} />}
                                onClick={() => void downloadDryPortAttachment(id, rec.id, rec.fileName)}
                              />
                            </Tooltip>
                          )}
                          <Tooltip title="Xóa tệp">
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                              onClick={() => {
                                if (rec._isExisting) handleRemoveAttachment(rec.id);
                                else handleRemovePendingFile(rec._idx);
                              }}
                            />
                          </Tooltip>
                        </div>
                      );
                    },
                  },
                ]}
              />
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} tabBarStyle={drawerTabBarStyle} items={formTabs} />

      {/* GIS Location Selector Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              Chọn vị trí & tọa độ trên bản đồ chuyên dụng
            </span>
          </div>
        }
        open={gisModalOpen}
        onCancel={() => setGisModalOpen(false)}
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="cancel" onClick={() => setGisModalOpen(false)} style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}>
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={() => setGisModalOpen(false)} style={{ ...primaryButtonStyle, height: 36 }}>
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType={watchedGeometryType || 'POINT'}
            height={520}
            onChange={(val) => {
              if (val?.coordinates) {
                const points = parseWktToCoordinates(val.coordinates);
                if (points.length > 0) {
                  setCoordinateList((prev) => {
                    const existing = prev || [];
                    const key = (p: { latitude: number; longitude: number }) =>
                      `${Math.round(p.latitude * 1e5)}_${Math.round(p.longitude * 1e5)}`;
                    const existingKeys = new Set(
                      existing
                        .filter((c) => c.latD != null && c.lngD != null)
                        .map((c) =>
                          key({
                            latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
                            longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
                          }),
                        ),
                    );
                    const toAdd = points
                      .filter((p) => !existingKeys.has(key(p)))
                      .map((p) => {
                        const la = ddToDms(p.latitude);
                        const lo = ddToDms(p.longitude);
                        return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
                      });
                    if (toAdd.length === 0) return existing;
                    return [...existing, ...toAdd];
                  });
                  setGpsError(null);
                }
              }
            }}
          />
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewModalOpen}
        title={<span style={{ color: sidebarBg, fontWeight: fontWeightBold }}>Xem hình ảnh: {previewImageName}</span>}
        footer={null}
        onCancel={() => {
          setPreviewModalOpen(false);
          setPreviewImageUrl('');
        }}
        width={700}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          {previewImageUrl ? (
            <img src={previewImageUrl} alt={previewImageName} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
          ) : (
            <div style={{ padding: 40, color: textTertiary }}>Đang tải hình ảnh...</div>
          )}
        </div>
      </Modal>
    </>
  );
});
