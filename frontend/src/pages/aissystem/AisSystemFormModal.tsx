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
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../components/org-unit';
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
import { radarStationService } from '../../services/radarStationService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { symbolService, type Symbol as GisSymbol } from '../../services/symbolService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import toast from '../../components/ToastNotification';
import { useAuthStore } from '../../store/authStore';
import { AppDrawer } from '../../components/shared/AppDrawer';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import DetailTable from '../../components/shared/DetailTable';
import { generateTempId, DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';
import { useLocation } from 'react-router-dom';
import { colors } from '../../theme';
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
} from '../../tokens';

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

interface AisSystemFormModalProps {
  visible: boolean;
  item?: AisSystemResponse | null;
  orgUnits?: any[];
  opCenters?: { id: string; name: string; orgUnitId?: string }[];
  onCancel: () => void;
  onSuccess: () => void;
}

export const AisSystemFormModal: React.FC<AisSystemFormModalProps> = ({
  visible,
  item,
  orgUnits: propOrgUnits,
  opCenters: propOpCenters,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const location = useLocation();
  const isViewMode = location.pathname.endsWith('/view') || (!location.pathname.endsWith('/edit') && !!item && location.pathname.includes('/detail'));
  const currentUser = useAuthStore((s) => s.user);
  const canSaveAndApprove = (currentUser?.permissions || []).includes('aissystem:approvec2');

  const [activeTab, setActiveTab] = useState('basic');
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'DRAFT' | 'SUBMIT' | 'APPROVE' | 'UPDATE'>('DRAFT');
  const [orgUnits, setOrgUnits] = useState<any[]>(propOrgUnits || []);
  const [operatingOrganizations, setOperatingOrganizations] = useState(DEFAULT_OPERATING_ORGANIZATIONS);
  const [opCenters, setOpCenters] = useState<{ id: string; name: string; orgUnitId?: string }[]>(propOpCenters || []);
  const [radarStations, setRadarStations] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);
  const [symbols, setSymbols] = useState<GisSymbol[]>([]);
  const [coordinateList, setCoordinateList] = useState<CoordinateItem[]>([{ latitude: null, longitude: null }]);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [attachmentList, setAttachmentList] = useState<any[]>([]);

  const handleUploadAttachment = async (file: File) => {
    if (!item?.id) {
      const newItem = {
        id: generateTempId(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || file.name.split('.').pop()?.toLowerCase(),
        file,
        uploadedDate: dayjs().toISOString(),
        uploadedByName: currentUser?.fullName || currentUser?.username || 'Người dùng hiện tại',
      };
      setAttachmentList((prev) => [newItem, ...prev]);
      return;
    }

    try {
      await aisSystemService.uploadAttachment(item.id, file);
      toast.success('Tải lên tệp đính kèm thành công');
      const atts = await aisSystemService.listAttachments(item.id);
      setAttachmentList(atts || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi tải lên tệp đính kèm');
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!item?.id) {
      setAttachmentList((prev) => prev.filter((a) => a.id !== attId));
      toast.success('Đã xóa tệp đính kèm');
      return;
    }
    try {
      await aisSystemService.deleteAttachment(item.id, attId);
      toast.success('Xóa tệp đính kèm thành công');
      setAttachmentList((prev) => prev.filter((a) => a.id !== attId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi xóa tệp đính kèm');
    }
  };

  const handleDownloadAttachment = async (attId: string, fileName?: string) => {
    if (!attId) return;
    if (item?.id) {
      await aisSystemService.downloadAttachment(item.id, attId, fileName);
    } else {
      const found = attachmentList.find((a) => a.id === attId);
      if (found?.file) {
        const url = URL.createObjectURL(found.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = found.fileName || fileName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  const isEdit = !!item;
  const formOrgUnitId = Form.useWatch('orgUnitId', form);
  const watchedGeom = Form.useWatch('geometryType', form) || 'POINT';

  useEffect(() => {
    if (propOrgUnits && propOrgUnits.length > 0) setOrgUnits(propOrgUnits);
    if (propOpCenters && propOpCenters.length > 0) setOpCenters(propOpCenters);
  }, [propOrgUnits, propOpCenters]);

  const filteredOpCenters = useMemo(() => {
    if (!formOrgUnitId) return opCenters;
    const allowedIds = resolveOrgSubtreeIds(orgUnits, formOrgUnitId);
    return opCenters.filter((c) => !c.orgUnitId || allowedIds.has(c.orgUnitId));
  }, [opCenters, formOrgUnitId, orgUnits]);

  const filteredRadarStations = useMemo(() => {
    if (!formOrgUnitId) return radarStations;
    const allowedIds = resolveOrgSubtreeIds(orgUnits, formOrgUnitId);
    return radarStations.filter((r) => !r.orgUnitId || allowedIds.has(r.orgUnitId));
  }, [radarStations, formOrgUnitId, orgUnits]);

  const combinedLocationOptions = useMemo(() => [
    {
      label: 'Trung tâm điều hành VTS',
      options: filteredOpCenters.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      label: 'Trạm Radar',
      options: filteredRadarStations.map((r) => ({ value: r.id, label: r.name })),
    },
  ], [filteredOpCenters, filteredRadarStations]);

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

      // 2a. Load Radar Stations for dropdown
      radarStationService.getOptions().then((res) => {
        if (Array.isArray(res)) {
          setRadarStations(res.map((r) => ({ id: r.id, name: r.stationName || r.code || r.id, orgUnitId: r.orgUnitId })));
        }
      }).catch(() => {});

      // 2b. Load Operating Organizations
      vtsSystemCRUD.getOperatingOrganizationOptions().then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setOperatingOrganizations(res);
        }
      }).catch(() => {});

      // 3. Load Symbols
      symbolService.list().then((syms) => {
        if (Array.isArray(syms)) setSymbols(syms);
      }).catch(() => {});

      if (item) {
        const initialLocId = item.vtsOperationCenterId || item.radarStationId;
        form.setFieldsValue({
          code: item.code,
          name: item.name,
          locationId: initialLocId,
          vtsOperationCenterId: item.vtsOperationCenterId,
          radarStationId: item.radarStationId,
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
          geometryType: item.geometryType,
          symbolId: item.symbolId || undefined,
          coordinateSystem: item.geometryType ? 'WGS 84 / VN-2000' : undefined,
          displayRule: item.geometryType ? 'Độ, phút, giây (DMS)' : undefined,
        });

        const parsedCoords = parseWktToCoordinates(item.coordinates);
        setCoordinateList(parsedCoords);

        aisSystemService.listAttachments(item.id).then((atts) => {
          setAttachmentList(atts || []);
        }).catch(() => {});
      } else {
        form.resetFields();
        setAttachmentList([]);
        setCoordinateList([]);
        aisSystemService.generateCode().then((res) => {
          form.setFieldsValue({
            code: res.code,
            conditionStatus: ConditionStatus.OPERATIONAL,
            unitOfMeasure: UnitOfMeasure.SET,
            quantity: 1,
          });
        }).catch(() => {
          form.setFieldsValue({
            conditionStatus: ConditionStatus.OPERATIONAL,
            unitOfMeasure: UnitOfMeasure.SET,
            quantity: 1,
          });
        });
      }
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

  const handleSubmit = async (action: 'DRAFT' | 'SUBMIT' | 'APPROVE' | 'UPDATE' = 'DRAFT') => {
    try {
      setActionType(action);
      const values = await form.validateFields();

      if (values.geometryType) {
        const minCount = GEOMETRY_POINT_COUNT[values.geometryType] ?? 1;
        const validCoords = coordinateList.filter(
          (c) => c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude)
        );
        if (validCoords.length < minCount) {
          const typeLabel =
            values.geometryType === 'POLYGON'
              ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ'
              : values.geometryType === 'LINE'
                ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ'
                : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ';
          toast.error(typeLabel);
          setActiveTab('gis');
          return;
        }
      }

      setSubmitting(true);

      const geomType = values.geometryType || 'POINT';
      const wkt = serializeCoordinatesToWkt(coordinateList, geomType);

      const commYear = values.commissioningYear
        ? typeof values.commissioningYear === 'number'
          ? values.commissioningYear
          : values.commissioningYear.year()
        : undefined;

      const targetStatus = isEdit
        ? (item?.approvalStatus || 'APPROVED')
        : action === 'DRAFT'
          ? 'DRAFT'
          : action === 'SUBMIT'
            ? 'PENDING_APPROVAL'
            : 'APPROVED';

      const selectedLocationId = values.locationId;
      let vtsOpCenterId: string | undefined = undefined;
      let radarStId: string | undefined = undefined;

      if (selectedLocationId) {
        if (opCenters.some((c) => c.id === selectedLocationId)) {
          vtsOpCenterId = selectedLocationId;
        } else if (radarStations.some((r) => r.id === selectedLocationId)) {
          radarStId = selectedLocationId;
        } else {
          vtsOpCenterId = selectedLocationId;
        }
      }

      const payload: CreateAisSystemRequest = {
        code: values.code?.trim(),
        name: values.name?.trim(),
        vtsOperationCenterId: vtsOpCenterId,
        radarStationId: radarStId,
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
        approvalStatus: targetStatus as any,
      };

      let savedId = item?.id;
      if (isEdit && item) {
        await aisSystemService.update(item.id, payload);
        toast.success('Cập nhật hệ thống AIS thành công');
      } else {
        const created = await aisSystemService.create(payload);
        savedId = created.id;
        const msg =
          action === 'DRAFT'
            ? 'Lưu tạm hệ thống AIS thành công'
            : action === 'SUBMIT'
              ? 'Lưu và gửi phê duyệt thành công'
              : 'Lưu và phê duyệt thành công';
        toast.success(msg);
      }

      // Upload pending files if creating new
      if (savedId && !isEdit) {
        const pendingFiles = attachmentList.map((a) => a.file).filter(Boolean);
        if (pendingFiles.length > 0) {
          try {
            await aisSystemService.uploadAttachments(savedId, pendingFiles);
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
      label: 'Thông tin chung',
      children: (
        <div style={drawerTabContentStyle}>
          <Row gutter={formRowGutter}>
            <Col span={12}>
              <Form.Item
                name="orgUnitId"
                label="Đơn vị quản lý"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                style={formFieldStyle}
              >
                <OrgUnitTreeSelect
                  organizations={orgUnits}
                  placeholder="Chọn đơn vị quản lý"
                  style={formTreeSelectStyle}
                  onChange={(val) => {
                    form.setFieldValue('orgUnitId', val);
                    const curLoc = form.getFieldValue('locationId');
                    const allowedIds = resolveOrgSubtreeIds(orgUnits, val);
                    const inOpCenters = opCenters.some((c) => c.id === curLoc && (!c.orgUnitId || allowedIds.has(c.orgUnitId)));
                    const inRadars = radarStations.some((r) => r.id === curLoc && (!r.orgUnitId || allowedIds.has(r.orgUnitId)));
                    if (curLoc && !inOpCenters && !inRadars) {
                      form.setFieldValue('locationId', undefined);
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="locationId"
                label="Thuộc TTDH VTS / Trạm Radar"
                rules={[{ required: true, message: 'Vui lòng chọn TTDH VTS / Trạm Radar' }]}
                style={formFieldStyle}
              >
                <Select
                  placeholder={formOrgUnitId ? 'Chọn TTDH VTS / Trạm Radar' : 'Vui lòng chọn đơn vị quản lý trước'}
                  disabled={!formOrgUnitId}
                  options={combinedLocationOptions}
                  style={selectStyle}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={formRowGutter}>
            <Col span={12}>
              <Form.Item
                name="operatingOrgId"
                label="Đơn vị khai thác"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị khai thác' }]}
                style={formFieldStyle}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="Chọn đơn vị khai thác"
                  filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}
                  options={operatingOrganizations.map((o) => ({ value: o.id, label: o.name }))}
                  style={selectStyle}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã thiết bị"
                style={formFieldStyle}
              >
                <Input
                  placeholder="Mã thiết bị tự sinh (AIS-xxxxxx)"
                  disabled={true}
                  style={readonlyInputStyle}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={formRowGutter}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên thiết bị"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên thiết bị' },
                  { max: 255, message: 'Tên thiết bị tối đa 255 ký tự' },
                ]}
                style={formFieldStyle}
              >
                <Input placeholder="Nhập tên thiết bị AIS" maxLength={255} showCount style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="provinceId"
                label="Địa điểm (Tỉnh/TP)"
                rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành phố' }]}
                style={formFieldStyle}
              >
                <Select
                  placeholder="Chọn Tỉnh/Thành phố"
                  options={VIETNAM_PROVINCE_OPTIONS}
                  style={selectStyle}
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label).includes(normalizeSearchText(input))
                  }
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={formRowGutter}>
            <Col span={12}>
              <Form.Item
                name="detailedLocation"
                label="Địa điểm chi tiết"
                rules={[{ max: 500, message: 'Địa điểm chi tiết tối đa 500 ký tự' }]}
                style={formFieldStyle}
              >
                <Input placeholder="Nhập địa điểm chi tiết (số nhà, đường, xã/phường...)" maxLength={500} showCount style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="unitOfMeasure"
                label="Đơn vị tính"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị tính' }]}
                style={formFieldStyle}
              >
                <Select
                  placeholder="Chọn ĐVT"
                  options={UNIT_OF_MEASURE_OPTIONS}
                  style={selectStyle}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="quantity"
                label="Số lượng"
                rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                style={formFieldStyle}
              >
                <InputNumber
                  min={1}
                  placeholder="Số lượng"
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={formRowGutter}>
            <Col span={12}>
              <Form.Item name="commissioningYear" label="Năm đưa vào sử dụng" style={formFieldStyle}>
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
                style={formFieldStyle}
              >
                <Select
                  placeholder="Chọn tình trạng"
                  options={CONDITION_STATUS_OPTIONS}
                  style={selectStyle}
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
        <div style={drawerTabContentStyle}>
          <Row gutter={formRowGutter}>
            <Col span={12}>
              <Form.Item
                name="model"
                label="Model"
                rules={[{ max: 100, message: 'Model tối đa 100 ký tự' }]}
                style={formFieldStyle}
              >
                <Input placeholder="Nhập model" maxLength={100} showCount style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="manufacturer"
                label="Hãng sản xuất"
                rules={[{ max: 255, message: 'Hãng sản xuất tối đa 255 ký tự' }]}
                style={formFieldStyle}
              >
                <Input placeholder="Nhập hãng sản xuất" maxLength={255} showCount style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={formRowGutter}>
            <Col span={12}>
              <Form.Item
                name="specifications"
                label="Thông số kỹ thuật"
                rules={[{ max: 2000, message: 'Thông số kỹ thuật tối đa 2000 ký tự' }]}
                style={formFieldStyle}
              >
                <Input.TextArea rows={3} placeholder="Nhập thông số kỹ thuật" maxLength={2000} showCount style={{ ...textAreaStyle, padding: '10px 16px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maintenanceInfo"
                label="Thông tin bảo trì"
                rules={[{ max: 2000, message: 'Thông tin bảo trì tối đa 2000 ký tự' }]}
                style={formFieldStyle}
              >
                <Input.TextArea rows={3} placeholder="Nhập thông tin bảo trì" maxLength={2000} showCount style={{ ...textAreaStyle, padding: '10px 16px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="note"
            label="Ghi chú"
            rules={[{ max: 2000, message: 'Ghi chú tối đa 2000 ký tự' }]}
            style={formFieldStyle}
          >
            <Input.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" maxLength={2000} showCount style={{ ...textAreaStyle, padding: '10px 16px' }} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'gis',
      label: 'Thông tin vị trí',
      children: (
        <div style={drawerTabContentStyle}>
          {/* Row 1: 11. Loại đối tượng & 12. Biểu tượng */}
          <Row gutter={formRowGutter}>
            <Col span={12}>
              <Form.Item
                name="geometryType"
                label="Loại đối tượng"
                style={formFieldStyle}
              >
                <Select
                  placeholder="Chọn loại đối tượng"
                  allowClear
                  options={[
                    { value: 'POINT', label: 'Đối tượng điểm' },
                    { value: 'LINE', label: 'Đối tượng đường' },
                    { value: 'POLYGON', label: 'Đối tượng vùng' },
                  ]}
                  style={selectStyle}
                  onChange={(val) => {
                    form.setFieldValue('geometryType', val);
                    if (val) {
                      form.setFieldValue('coordinateSystem', 'WGS 84 / VN-2000');
                      form.setFieldValue('displayRule', 'Độ, phút, giây (DMS)');
                      const minCount = GEOMETRY_POINT_COUNT[val] ?? 1;
                      setCoordinateList((prev) => {
                        if (prev.length >= minCount) return prev;
                        const added = Array.from({ length: minCount - prev.length }, () => ({ latitude: null, longitude: null }));
                        return [...prev, ...added];
                      });
                    } else {
                      form.setFieldValue('coordinateSystem', undefined);
                      form.setFieldValue('displayRule', undefined);
                      form.setFieldValue('symbolId', undefined);
                      setCoordinateList([]);
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="symbolId"
                label="Biểu tượng"
                style={formFieldStyle}
              >
                <Select
                  placeholder="Chọn biểu tượng bản đồ"
                  allowClear
                  showSearch
                  disabled={!watchedGeom}
                  optionFilterProp="label"
                  style={selectStyle}
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
          <Row gutter={formRowGutter}>
            <Col span={12}>
              <Form.Item
                name="coordinateSystem"
                label="Hệ quy chiếu"
                style={formFieldStyle}
              >
                <Select
                  placeholder="Chọn hệ quy chiếu"
                  disabled
                  options={[
                    { value: 'WGS 84 / VN-2000', label: 'WGS 84 / VN-2000' },
                    { value: 'WGS-84', label: 'WGS-84' },
                    { value: 'VN-2000', label: 'VN-2000' },
                  ]}
                  style={selectStyle}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="displayRule"
                label="Quy tắc hiển thị"
                style={formFieldStyle}
              >
                <Input
                  placeholder="Chọn quy tắc hiển thị"
                  disabled
                  style={readonlyInputStyle}
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
                disabled={!watchedGeom}
                onClick={() => setMapModalOpen(true)}
                style={{ borderRadius: radiusPill }}
              >
                Chọn vị trí trên bản đồ
              </Button>
              {watchedGeom && watchedGeom !== 'POINT' && (
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
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: 20, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                disabled={!watchedGeom}
                onClick={() => setCoordinateList([{ latitude: null, longitude: null }])}
                style={{ borderRadius: radiusPill }}
              >
                Thêm tọa độ
              </Button>
            </div>
          ) : (
            <DetailTable
              scrollY={DRAWER_TABLE_SCROLL_Y.withButton}
              dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
              rowKey="_idx"
              emptyText="Chưa có tọa độ nào"
              columns={[
                {
                  title: 'STT',
                  key: 'stt',
                  width: 60,
                  align: 'center',
                  render: (_: any, __: any, i: number) => (
                    <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>
                  ),
                },
                {
                  title: 'Vĩ độ (N)',
                  key: 'lat',
                  render: (_: any, r: any) => renderDms(r._idx, 'lat', r),
                },
                {
                  title: 'Kinh độ (E)',
                  key: 'lng',
                  render: (_: any, r: any) => renderDms(r._idx, 'lng', r),
                },
                {
                  title: '',
                  key: 'actions',
                  width: 50,
                  align: 'center',
                  render: (_: any, r: any) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                      onClick={() => setCoordinateList((p) => p.filter((_, idx) => idx !== r._idx))}
                      title="Xóa tọa độ"
                    />
                  ),
                },
              ]}
            />
          )}
        </div>
      ),
    },
    {
      key: 'attachment',
      label: `File đính kèm (${attachmentList.length})`,
      children: (
        <InfrastructureAttachmentTab
          attachments={attachmentList}
          readonly={false}
          onUpload={handleUploadAttachment}
          onDelete={handleDeleteAttachment}
          onDownload={handleDownloadAttachment}
        />
      ),
    },
  ];

  return (
    <>
      <AppDrawer
        title={isEdit ? 'Chỉnh sửa hệ thống AIS' : 'Thêm mới hệ thống AIS'}
        open={visible}
        onClose={onCancel}
        footer={
          isEdit ? (
            <>
              <Button
                onClick={onCancel}
                style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={() => handleSubmit('UPDATE')}
                loading={submitting && actionType === 'UPDATE'}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Cập nhật
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => handleSubmit('DRAFT')}
                loading={submitting && actionType === 'DRAFT'}
                style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu tạm
              </Button>
              <Button
                type="primary"
                onClick={() => handleSubmit('SUBMIT')}
                loading={submitting && actionType === 'SUBMIT'}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu và gửi phê duyệt
              </Button>
              {canSaveAndApprove && (
                <Button
                  type="primary"
                  onClick={() => handleSubmit('APPROVE')}
                  loading={submitting && actionType === 'APPROVE'}
                  style={{
                    ...primaryButtonStyle,
                    background: statusOperational,
                    borderColor: statusOperational,
                    borderRadius: radiusPill,
                    height: 40,
                  }}
                >
                  Lưu và phê duyệt
                </Button>
              )}
            </>
          )
        }
        size="50%"
      >
        <Form form={form} layout="vertical">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            tabBarStyle={drawerTabBarStyle}
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
          height={550}
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
