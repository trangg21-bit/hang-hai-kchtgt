// ── BuoyFormContent — presentational Drawer form body (T4, design §2.5) ─
// No fetch, no routing. 3 Tabs: Thông tin chung / Thông tin vị trí / File đính kèm.

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useAuthStore } from '../../store/authStore';
import {
  Row, Col, Form, Input, Select, DatePicker, Button, Tabs,
  message, Space, Modal,
} from 'antd';
import InputNumber from '../../components/shared/LocalizedInputNumber';
import type { UploadProps } from 'antd';
import { DeleteOutlined, PlusOutlined, EnvironmentOutlined, BankOutlined, SlidersOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { colors } from '../../themetokenchk';
import {
  textTertiary, sidebarBg, statusCritical, actionPrimary,
  fontSizeMd, fontSizeSm, fontSizeLg, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceXs, spaceFormField, borderDefault,
  readonlyInputStyle, drawerTabBarStyle, drawerFormScrollStyle,
  primaryButtonStyle, outlineButtonStyle,
  DRAWER_TABLE_SCROLL_Y, textAreaStyle,
} from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import { triggerBlobDownload } from '../../components/shared/infrastructureAttachmentUtils';
import { buoyCRUD } from '../beaconService';
import {
  CLASSIFICATION_OPTIONS,
  CLASSIFICATION_BUOY_OPTIONS,
  CLASSIFICATION_MARK_OPTIONS,
  CONDITION_OPTIONS,
  BUOY_LIGHT_OPTIONS,
} from './schema';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { fmtInputNumber } from '../../utils/numFmt';
import toast from '../../components/ToastNotification';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { normalizeSearchText } from '../../components/org-unit';
import {
  dmsToDd,
  GEOMETRY_POINT_COUNT,
  parseWktToCoordinates,
  serializeCoordinatesToWkt,
} from '../../utils/gisGeometry';
import { NumberInputWithCount } from '../../components/shared/NumberInputWithCount';
import {
  parseNumber20,
  getValueFromEvent20,
  decimalNumberRule,
} from '../../utils/numberRuleHelper';

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];
const COORD_SYS_OPTIONS = [{ value: 1, label: 'WGS-84' }, { value: 2, label: 'VN-2000' }];

const inputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40 };
const selectStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const numberInputStyle: React.CSSProperties = { borderRadius: radiusPill, height: 40, width: '100%' };
const datePickerStyle: React.CSSProperties = { width: '100%', borderRadius: radiusPill, height: 40 };

// Màn Cảng biển dùng font 13.5px cho phần tiêu đề/chỉ số trong drawer.
const portFormFontSizeMd = 13.5;
const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: radiusMd,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spaceFormField,
  paddingBottom: spaceSm,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: portFormFontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: spaceSm,
};

const labelProps = (text: string) => ({
  label: <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

/**
 * Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px).
 * Căn giữa bảng, hỗ trợ tự động căn dọc thông báo lỗi dưới từng ô input.
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
      key: 'd', base: 'Độ', value: dVal, max: maxDeg,
      radius: '999px 0 0 999px', unit: '°', unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1, formatter: undefined,
      msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
    },
    {
      key: 'm', base: 'Phút', value: mVal, max: 59,
      radius: '0', unit: "'", unitStyle: dmsUnitStyle, basis: '1 0 108px', width: 108,
      step: 1, formatter: undefined,
      msg: started && mVal == null ? 'Phút bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, v, sVal ?? null),
    },
    {
      key: 's', base: 'Giây', value: sVal, max: 59.99,
      radius: '0', unit: '"', unitStyle: dmsUnitEndStyle, basis: '1.2 0 130px', width: 130,
      step: 0.01, formatter: fmtInputNumber,
      msg: started && sVal == null ? 'Giây bắt buộc' : undefined,
      onEdit: (v: number | null) => onChange(dVal ?? null, mVal ?? null, v),
    },
  ] as const;

  const hasError = started && inputs.some((inp) => !!inp.msg);

  const inputRow = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 360, margin: '0 auto', minWidth: 0 }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ display: 'flex', flex: inp.basis, minWidth: 0, width: inp.width }}>
          <InputNumber
            className="chk-dms-input-number"
            value={inp.value}
            min={0}
            max={inp.max}
            step={inp.step}
            placeholder={inp.base}
            formatter={'formatter' in inp ? (inp as any).formatter : undefined}
            status={inp.msg ? 'error' : undefined}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(raw) => inp.onEdit(raw == null ? null : Number(raw))}
            style={{ flex: 1, minWidth: 0, borderRadius: inp.radius, height: 32, textAlign: 'center' }}
            controls={false}
          />
          <span style={inp.unitStyle}>{inp.unit}</span>
        </div>
      ))}
    </div>
  );

  const messageRow = hasError ? (
    <div aria-live="polite" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%', maxWidth: 360, margin: `${spaceXs}px auto 0 auto`, minWidth: 0, height: 14, lineHeight: '14px', overflow: 'hidden' }}>
      {inputs.map((inp) => (
        <div key={inp.key} style={{ flex: inp.basis, minWidth: 0, width: inp.width, textAlign: 'center' }}>
          {inp.msg && <span role="alert" style={{ color: statusCritical, fontSize: fontSizeSm, whiteSpace: 'nowrap' }}>{inp.msg}</span>}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minWidth: 0 }}>
      {inputRow}
      {messageRow}
    </div>
  );
};

export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_FILE_COUNT = 10;

export interface BuoyFormContentProps {
  /** Optional — the page owns the Form instance via <Form form={...}> wrapper. */
  form?: any;
  isEdit?: boolean;
  /** For create mode: active tab key */
  activeTabKey?: string;
  /** For create mode: tab change handler */
  onTabChange?: (key: string) => void;
  orgUnits: OrgUnitTreeOption[];
  loadingOrgs?: boolean;
  buoyStations: Array<{ id: string; name: string; code: string }>;
  loadingStations?: boolean;
  /** Đơn vị quản lý đang chọn trong form — chưa chọn thì field nhà trạm bị disable (pattern BerthForm load Cảng biển). */
  selectedUnitId?: string | null;
  /**
   * Nhà trạm QLVH hiện tại của phao tiêu (chế độ chỉnh sửa).
   * Chỉ cho phép đổi khi phao tiêu CHƯA có nhà trạm (currentStationId rỗng);
   * phao đã thuộc nhà trạm thì khóa không cho đổi.
   */
  currentStationId?: string | null;
  /** Sinh mã tự động {mã nhà trạm}-PT-{seq} khi chọn nhà trạm (chỉ chế độ thêm mới). */
  onStationChange?: (stationId: string | undefined) => void;
  /** For create mode: code auto-generation in-flight (mã sinh tự động). */
  codeLoading?: boolean;
  uploadFileList: any[];
  setUploadFileList: React.Dispatch<React.SetStateAction<any[]>>;
  symbols: Array<{ id: string; name: string; code?: string; image?: string }>;
  /** Map id người dùng → tên hiển thị (cột Người tải lên trong bảng file đính kèm). */
  userMap?: Map<string, string>;
  waterwayOptions?: Array<{ value: string; label: string }>;
  loadingWaterways?: boolean;
  geometryType?: string;
  gpsCoordList: Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>;
  gpsError?: string | null;
  addGpsPoint: () => void;
  removeGpsPoint: (i: number) => void;
  clearGpsPoint?: (i: number) => void;
  updateGpsPoint: (i: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => void;
  replaceGpsPoints: React.Dispatch<React.SetStateAction<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>>;
  ddToDms: (dd: number | null | undefined) => { d: number | null; m: number | null; s: number | null };
  onDeleteAttachment?: (uid: string) => void;
  record?: any;
}

export default function BuoyFormContent({
  form,
  isEdit,
  activeTabKey,
  onTabChange,
  orgUnits,
  loadingOrgs,
  codeLoading,
  uploadFileList,
  setUploadFileList,
  symbols,
  userMap,
  waterwayOptions,
  loadingWaterways,
  geometryType,
  gpsCoordList,
  gpsError,
  addGpsPoint,
  removeGpsPoint,
  clearGpsPoint,
  updateGpsPoint,
  replaceGpsPoints,
  ddToDms,
  buoyStations,
  loadingStations,
  onStationChange,
  currentStationId,
  selectedUnitId,
  onDeleteAttachment,
  record,
}: BuoyFormContentProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const watchedGeometryType = Form.useWatch('geometryType', form);
  // Loại đối tượng đang được chọn trên form (không fallback về record cũ khi đã xóa hoặc chưa chọn)
  const effectiveGeometryType = watchedGeometryType !== undefined ? watchedGeometryType : geometryType;
  // Biểu tượng chỉ bắt buộc khi người dùng có chọn Loại đối tượng
  const isGeometryTypeSelected = Boolean(effectiveGeometryType);
  const hasCoordinates = (gpsCoordList || []).some((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null));

  const handleGeometryTypeChange = (val: string | undefined) => {
    form?.setFieldsValue({ geometryType: val });
    if (!val) {
      form?.setFieldsValue({ coordinateSystem: undefined, displayRule: undefined, mapSymbolId: undefined, symbolId: undefined });
      replaceGpsPoints([]);
      return;
    }
    form?.setFieldsValue({
      coordinateSystem: 1,
      displayRule: 'Độ, phút, giây (DMS)',
    });
    const count = GEOMETRY_POINT_COUNT[val] ?? 1;
    replaceGpsPoints((prev: any) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      }
      if (val === 'POINT' && prev.length > 1) {
        return [prev[0]];
      }
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
        return [...prev, ...added];
      }
      return prev;
    });
  };

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      message.error(`File "${file.name}" vượt quá 20MB`);
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      message.error(`Định dạng .${ext} không được hỗ trợ`);
      return false;
    }
    const nowIso = dayjs().toISOString();
    const uploaderName = currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý';
    const uploadFile: any = {
      uid: `-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      fileName: file.name,
      size: file.size,
      fileSize: file.size,
      type: file.type,
      fileType: file.type,
      uploadedByName: uploaderName,
      uploadedBy: currentUser?.userId || currentUser?.id || uploaderName,
      uploadedDate: nowIso,
      uploadedAt: nowIso,
      createdAt: nowIso,
      status: 'done',
      originFileObj: file,
    };
    setUploadFileList((previousFiles) => {
      if (previousFiles.length >= MAX_FILE_COUNT) {
        message.error('Chỉ được upload tối đa 10 file');
        return previousFiles;
      }
      return [...previousFiles, uploadFile];
    });
    return false;
  };

  const tabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
          {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <BankOutlined style={{ color: actionPrimary }} />
                <span style={{ marginLeft: 8 }}>Thông tin cơ bản & Quản lý vận hành</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="unitId"
                  {...labelProps('Đơn vị quản lý')}
                  required={!isEdit}
                  style={{ marginBottom: spaceFormField }}
                  rules={!isEdit ? [{ required: true, message: 'Đơn vị quản lý là bắt buộc khi thêm mới' }] : []}
                >
                  <OrgUnitTreeSelect
                    organizations={orgUnits}
                    placeholder="Chọn Đơn vị quản lý"
                    loading={loadingOrgs}
                    disabled={isEdit}
                    showPath
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="buoyStationId"
                  {...labelProps('Thuộc nhà trạm quản lý vận hành phao, tiêu')}
                  required={!isEdit}
                  style={{ marginBottom: spaceFormField }}
                  tooltip={!selectedUnitId ? 'Vui lòng chọn Đơn vị quản lý trước' : (isEdit && !!currentStationId ? 'Phao tiêu đã thuộc nhà trạm này — không thể đổi nhà trạm quản lý vận hành' : undefined)}
                  rules={!isEdit ? [{ required: true, message: 'Thuộc nhà trạm quản lý vận hành phao, tiêu là bắt buộc' }] : []}
                >
                  <Select
                    placeholder={!selectedUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : (buoyStations.length === 0 && !loadingStations ? 'Không có nhà trạm đã phê duyệt thuộc đơn vị quản lý' : 'Chọn Thuộc nhà trạm quản lý vận hành phao, tiêu')}
                    loading={loadingStations}
                    disabled={isEdit || !selectedUnitId || (buoyStations.length === 0 && !loadingStations)}
                    options={buoyStations.map((s) => ({ value: s.id, label: s.name }))}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                    notFoundContent="Không có nhà trạm đã phê duyệt thuộc đơn vị quản lý"
                    onChange={onStationChange}
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="navigationChannelId"
                  {...labelProps('Thuộc luồng hàng hải')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder={!selectedUnitId ? 'Vui lòng chọn đơn vị quản lý trước' : 'Chọn luồng hàng hải đã phê duyệt'}
                    options={waterwayOptions}
                    loading={loadingWaterways}
                    disabled={!selectedUnitId}
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    notFoundContent="Không có luồng hàng hải đã phê duyệt thuộc đơn vị quản lý"
                    style={selectStyle}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  {...labelProps('Mã phao, tiêu')}
                  style={{ marginBottom: spaceFormField }}
                  tooltip={!isEdit ? 'Mã tự sinh theo {mã nhà trạm}-PT-{seq}, không thể chỉnh sửa' : undefined}
                  rules={!isEdit ? [{ max: 50, message: 'Tối đa 50 ký tự' }] : []}
                >
                  <Input
                    disabled
                    placeholder={isEdit ? undefined : (codeLoading ? 'Đang sinh mã...' : 'Mã tự động')}
                    maxLength={50}
                    style={readonlyInputStyle}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  {...labelProps('Tên phao, tiêu')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Tên phao tiêu không được để trống' }, { max: 255, message: 'Tối đa 255 ký tự' }]}
                >
                  <Input placeholder="Nhập Tên phao, tiêu" maxLength={255} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="classification"
                  {...labelProps('Phân loại')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Vui lòng chọn phân loại' }]}
                >
                  <Select placeholder="Chọn Phân loại" options={CLASSIFICATION_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="classificationBuoy" {...labelProps('Phân loại phao')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn Phân loại phao" options={CLASSIFICATION_BUOY_OPTIONS} allowClear style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="classificationMark" {...labelProps('Phân loại tiêu')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn Phân loại tiêu" options={CLASSIFICATION_MARK_OPTIONS} allowClear style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn Địa điểm (Tỉnh/Thành Phố)" options={VIETNAM_PROVINCE_OPTIONS} showSearch allowClear style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="condition"
                  {...labelProps('Tình trạng')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  initialValue="Chưa khai thác/vận hành"
                  rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                >
                  <Select placeholder="Chọn Tình trạng" options={CONDITION_OPTIONS} style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="locationDetail" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 2: Thông số kỹ thuật & Quy mô thân phao / tháp đèn ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <SlidersOutlined style={{ color: actionPrimary }} />
                <span style={{ marginLeft: 8 }}>Thông số kỹ thuật & Quy mô thân phao / tháp đèn</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="shape" {...labelProps('Hình dạng')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Hình dạng" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="area"
                  {...labelProps('Diện tích (m2)')}
                  style={{ marginBottom: spaceFormField }}
                  getValueFromEvent={getValueFromEvent20}
                  rules={[decimalNumberRule]}
                >
                  <NumberInputWithCount
                    allowDecimal
                    min={0}
                    step={0.01}
                    maxLength={20}
                    placeholder="0"
                    style={numberInputStyle}
                    parser={parseNumber20}
                    formatter={fmtInputNumber}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="bodyHeight"
                  {...labelProps('Chiều cao thân phao (m)')}
                  style={{ marginBottom: spaceFormField }}
                  getValueFromEvent={getValueFromEvent20}
                  rules={[decimalNumberRule]}
                >
                  <NumberInputWithCount
                    allowDecimal
                    min={0}
                    step={0.01}
                    maxLength={20}
                    placeholder="0"
                    style={numberInputStyle}
                    parser={parseNumber20}
                    formatter={fmtInputNumber}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="diameter"
                  {...labelProps('Đường kính phao (m)')}
                  style={{ marginBottom: spaceFormField }}
                  getValueFromEvent={getValueFromEvent20}
                  rules={[decimalNumberRule]}
                >
                  <NumberInputWithCount
                    allowDecimal
                    min={0}
                    step={0.01}
                    maxLength={20}
                    placeholder="0"
                    style={numberInputStyle}
                    parser={parseNumber20}
                    formatter={fmtInputNumber}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="beaconLight" {...labelProps('Đèn biển')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn Đèn biển" options={BUOY_LIGHT_OPTIONS} allowClear style={selectStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="towerHeight"
                  {...labelProps('Chiều cao tháp đèn')}
                  style={{ marginBottom: spaceFormField }}
                  getValueFromEvent={getValueFromEvent20}
                  rules={[decimalNumberRule]}
                >
                  <NumberInputWithCount
                    allowDecimal
                    min={0}
                    step={0.01}
                    maxLength={20}
                    placeholder="0"
                    style={numberInputStyle}
                    parser={parseNumber20}
                    formatter={fmtInputNumber}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="lightHeight"
                  {...labelProps('Chiều cao tâm sáng (hải đồ)')}
                  style={{ marginBottom: spaceFormField }}
                  getValueFromEvent={getValueFromEvent20}
                  rules={[decimalNumberRule]}
                >
                  <NumberInputWithCount
                    allowDecimal
                    min={0}
                    step={0.01}
                    maxLength={20}
                    placeholder="0"
                    style={numberInputStyle}
                    parser={parseNumber20}
                    formatter={fmtInputNumber}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lightModel" {...labelProps('Chủng loại đèn (Thiết bị báo hiệu)')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Chủng loại đèn (Thiết bị báo hiệu)" maxLength={100} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="towerColor" {...labelProps('Màu sắc bên ngoài của tháp đèn')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Màu sắc bên ngoài của tháp đèn" maxLength={200} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="powerSupply" {...labelProps('Nguồn cung cấp năng lượng cho đèn')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Nguồn cung cấp năng lượng cho đèn" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item
                  name="range"
                  {...labelProps('Phạm vi chiếu sáng')}
                  style={{ marginBottom: spaceFormField }}
                  tooltip="Phạm vi chiếu sáng (hải lý)"
                  getValueFromEvent={getValueFromEvent20}
                  rules={[decimalNumberRule]}
                >
                  <NumberInputWithCount
                    allowDecimal
                    min={0}
                    step={0.01}
                    maxLength={20}
                    placeholder="0"
                    style={numberInputStyle}
                    parser={parseNumber20}
                    formatter={fmtInputNumber}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item name="structure" {...labelProps('Kết cấu')} style={{ marginBottom: spaceFormField }}>
                  <Input.TextArea rows={3} placeholder="Nhập Kết cấu" maxLength={2000} showCount style={textAreaStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section 3: Đặc tính ánh sáng & Thời gian vận hành ── */}
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionTitleStyle}>
                <ThunderboltOutlined style={{ color: actionPrimary }} />
                <span style={{ marginLeft: 8 }}>Đặc tính ánh sáng & Thời gian vận hành</span>
              </div>
            </div>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="lightColor" {...labelProps('Màu sắc')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Màu sắc" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="flashType" {...labelProps('Kiểu chớp')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Kiểu chớp" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="period" {...labelProps('Chu kỳ')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Chu kỳ" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="commissionedDate" {...labelProps('Thời điểm đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker placeholder="Chọn Thời điểm đưa vào sử dụng" format="DD/MM/YYYY" classNames={{ popup: { root: 'buoy-date-picker' } }} style={datePickerStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      ),
    },
    {
      key: 'gis',
      label: `Thông tin vị trí (${gpsCoordList.length})`,
      forceRender: true,
      children: (
        <div style={drawerFormScrollStyle}>
          {/* ── Section Card: Thông số đối tượng bản đồ ── */}
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
                    onChange={handleGeometryTypeChange}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="mapSymbolId"
                  {...labelProps('Biểu tượng')}
                  required={isGeometryTypeSelected}
                  rules={isGeometryTypeSelected ? [{ required: true, message: 'Vui lòng chọn biểu tượng bản đồ' }] : []}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder="Chọn biểu tượng bản đồ"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    disabled={!isGeometryTypeSelected}
                    filterOption={(input, option) =>
                      normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                    }
                    style={selectStyle}
                    options={symbols.map((sym: any) => ({
                      value: String(sym.id),
                      label: sym.code ? `${sym.name} (${sym.code})` : sym.name,
                      image: sym.image,
                    }))}
                    optionRender={(option) => (
                      <Space>
                        {option.data.image && (
                          <img
                            src={option.data.image.startsWith('data:') ? option.data.image : `data:image/png;base64,${option.data.image}`}
                            alt=""
                            style={{ width: 20, height: 20, objectFit: 'contain' }}
                          />
                        )}
                        <span>{option.data.label}</span>
                      </Space>
                    )}
                    labelRender={(props) => {
                      const sym = symbols.find((s: any) => String(s.id) === String(props.value));
                      return (
                        <Space style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {sym?.image && (
                            <img
                              src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
                              alt=""
                              style={{ width: 18, height: 18, objectFit: 'contain' }}
                            />
                          )}
                          <span>{props.label}</span>
                        </Space>
                      );
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="coordinateSystem" {...labelProps('Hệ quy chiếu')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn Hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                  <Input placeholder="Nhập Quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ── Section Card: Tọa độ GPS ── */}
          <div style={sectionBoxStyle}>
            <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
              <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: portFormFontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                Tọa độ GPS ({gpsCoordList.length})
              </span>
              <Space size={8}>
                <Button
                  icon={<EnvironmentOutlined style={{ color: !effectiveGeometryType ? 'rgba(0, 0, 0, 0.25)' : actionPrimary }} />}
                  onClick={() => setGisModalOpen(true)}
                  disabled={!effectiveGeometryType}
                  style={!effectiveGeometryType ? {
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    borderRadius: radiusPill,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#f5f5f5',
                    borderColor: '#d9d9d9',
                    color: 'rgba(0, 0, 0, 0.25)',
                    cursor: 'not-allowed',
                    boxShadow: 'none',
                  } : {
                    ...outlineButtonStyle,
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title={!effectiveGeometryType ? 'Vui lòng chọn loại đối tượng trước khi chọn tọa độ trên bản đồ' : undefined}
                >
                  Chọn tọa độ trên bản đồ
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined style={{ color: (!effectiveGeometryType || (effectiveGeometryType === 'POINT' && gpsCoordList.length >= 1)) ? 'rgba(0, 0, 0, 0.25)' : undefined }} />}
                  onClick={addGpsPoint}
                  disabled={!effectiveGeometryType || (effectiveGeometryType === 'POINT' && gpsCoordList.length >= 1)}
                  style={(!effectiveGeometryType || (effectiveGeometryType === 'POINT' && gpsCoordList.length >= 1)) ? {
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    borderRadius: radiusPill,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#f5f5f5',
                    borderColor: '#d9d9d9',
                    color: 'rgba(0, 0, 0, 0.25)',
                    cursor: 'not-allowed',
                    boxShadow: 'none',
                  } : {
                    ...primaryButtonStyle,
                    height: 32,
                    fontSize: fontSizeSm,
                    padding: '0 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title={!effectiveGeometryType ? 'Vui lòng chọn loại đối tượng trước khi thêm tọa độ' : (effectiveGeometryType === 'POINT' && gpsCoordList.length >= 1 ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS' : undefined)}
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
            <DetailTable
              size="small"
              scrollY={DRAWER_TABLE_SCROLL_Y.withGisForm}
              dataSource={gpsCoordList.map((c, i) => ({ ...c, _idx: i }))}
              rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
              emptyText="Chưa có tọa độ GPS nào"
              columns={[
                {
                  title: 'STT',
                  width: 60,
                  align: 'center' as const,
                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                  render: (_v: any, _r: any, idx: number) => idx + 1,
                },
                {
                  title: 'Vĩ độ (Latitude - N)',
                  key: 'lat',
                  align: 'center' as const,
                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                  render: (_v: any, record: any) =>
                    renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) =>
                      updateGpsPoint(record._idx, 'lat', d, m, s)
                    ),
                },
                {
                  title: 'Kinh độ (Longitude - E)',
                  key: 'lng',
                  align: 'center' as const,
                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                  render: (_v: any, record: any) =>
                    renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) =>
                      updateGpsPoint(record._idx, 'lng', d, m, s)
                    ),
                },
                {
                  title: '',
                  width: 50,
                  align: 'center' as const,
                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                  render: (_v: any, record: any) => {
                    const isPoint = (effectiveGeometryType || 'POINT') === 'POINT';
                    const minPoints = isPoint ? 1 : effectiveGeometryType === 'LINE' ? 2 : 3;
                    const canDelete = gpsCoordList.length > minPoints;

                    if (isPoint) {
                      const hasValue =
                        record.latD != null ||
                        record.latM != null ||
                        record.latS != null ||
                        record.lngD != null ||
                        record.lngM != null ||
                        record.lngS != null;
                      return (
                        <Button
                          type="text"
                          disabled={!hasValue}
                          icon={<DeleteOutlined style={{ fontSize: 16, color: hasValue ? statusCritical : undefined }} />}
                          onClick={() => clearGpsPoint ? clearGpsPoint(record._idx) : updateGpsPoint(record._idx, 'lat', null, null, null)}
                          style={{
                            width: 32,
                            height: 32,
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title={hasValue ? 'Xóa trắng giá trị tọa độ' : 'Chưa có dữ liệu'}
                        />
                      );
                    }

                    return (
                      <Button
                        type="text"
                        danger={canDelete}
                        disabled={!canDelete}
                        icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                        onClick={() => canDelete && removeGpsPoint(record._idx)}
                        style={{
                          width: 32,
                          height: 32,
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={
                          !canDelete
                            ? effectiveGeometryType === 'LINE'
                              ? 'Đối tượng đường phải có tối thiểu 2 tọa độ'
                              : 'Đối tượng vùng phải có tối thiểu 3 tọa độ'
                            : 'Xóa điểm tọa độ này'
                        }
                      />
                    );
                  },
                },
              ]}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'files',
      label: `File đính kèm (${uploadFileList.length})`,
      children: (
        <InfrastructureAttachmentTab
          attachments={uploadFileList.map((f: any) => ({
            ...f,
            id: f.uid || f.id,
            fileName: f.name || f.fileName,
            fileType: f.contentType || f.fileType || f.type,
            fileSize: f.fileSize ?? f.size ?? f.originFileObj?.size,
            uploadedByName: f.uploadedByName || (f.uploadedBy ? (userMap?.get(f.uploadedBy) || f.uploadedBy) : '') || currentUser?.fullName || currentUser?.username || 'Cán bộ quản lý',
            uploadedDate: f.uploadedDate || f.uploadedAt || f.createdAt || dayjs().toISOString(),
          }))}
          readonly={false}
          userMap={userMap}
          onUpload={(file) => { handleBeforeUpload(file as any, [file as any]); return false; }}
          onDelete={(uid) => {
            onDeleteAttachment?.(uid);
            setUploadFileList((prev) => prev.filter((x) => (x.uid || (x as any).id) !== uid));
          }}
          onDownload={async (uid, name) => {
            const fileItem = uploadFileList.find((x: any) => (x.uid || x.id) === uid);
            const rawFile = fileItem?.originFileObj || (fileItem as any)?.file;
            if (rawFile) {
              triggerBlobDownload(rawFile, name || (rawFile as File).name || 'attachment');
              return;
            }

            if (isEdit && record?.id) {
              try {
                const blob = await buoyCRUD.downloadAttachment(record.id, uid);
                triggerBlobDownload(blob, name || 'attachment');
              } catch {
                toast.error('Không thể tải xuống tệp đính kèm');
              }
            } else {
              toast.error('Không tìm thấy tệp để tải xuống');
            }
          }}
          loadReadonlyPreviewImage={
            isEdit && record?.id
              ? (attachmentId) => buoyCRUD.downloadAttachment(record.id, attachmentId)
              : undefined
          }
          loadPreviewAttachment={
            isEdit && record?.id
              ? (attachmentId) => buoyCRUD.downloadAttachment(record.id, attachmentId)
              : undefined
          }
        />
      ),
    },
  ];

  return (
    <>
      {/* Nút "Hôm nay" trong popup DatePicker tô màu tím (colors.info) thay vì màu colorLink mặc định */}
      <style>{`.buoy-date-picker .ant-picker-today-btn{color:${colors.info}!important}`}</style>
      <Tabs
        activeKey={activeTabKey}
        onChange={onTabChange}
        tabBarStyle={drawerTabBarStyle}
        animated={false}
        destroyInactiveTabPane={false}
        items={tabItems}
      />

      {/* GIS Location Selector Modal — chọn tọa độ trên bản đồ chuyên dụng (chuẩn VTS CHK) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: sidebarBg, fontSize: fontSizeLg }}>
              Chọn vị trí & tọa độ trên bản đồ chuyên dụng
            </span>
          </div>
        }
        open={gisModalOpen}
        onCancel={() => setGisModalOpen(false)}
        destroyOnHidden
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="cancel" onClick={() => setGisModalOpen(false)} style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}>
            Hủy
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              setGisModalOpen(false);
              toast.success('Đã xác nhận vị trí từ bản đồ');
            }}
            style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}
          >
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType={(effectiveGeometryType as any) || 'POINT'}
            value={{
              geometryType: (effectiveGeometryType as any) || 'POINT',
              coordinates: serializeCoordinatesToWkt(
                gpsCoordList
                  .filter((c) => (c.latD != null || c.latM != null || c.latS != null) && (c.lngD != null || c.lngM != null || c.lngS != null))
                  .map((c) => ({
                    latitude: dmsToDd(c.latD, c.latM, c.latS),
                    longitude: dmsToDd(c.lngD, c.lngM, c.lngS),
                  }))
                  .filter((c) => c.latitude != null && c.longitude != null) as { latitude: number; longitude: number }[],
                effectiveGeometryType || 'POINT',
              ),
              symbolId: form?.getFieldValue('mapSymbolId') || form?.getFieldValue('symbolId'),
            }}
            height={520}
            onChange={(val) => {
              if (val?.coordinates) {
                const points = parseWktToCoordinates(val.coordinates);
                if (points.length > 0) {
                  const geom = ((val?.geometryType || effectiveGeometryType || 'POINT') as string).toUpperCase();
                  const newPoints = points.map((p) => {
                    const latDms = ddToDms(p.latitude);
                    const lngDms = ddToDms(p.longitude);
                    return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                  });

                  if (geom === 'POINT') {
                    replaceGpsPoints([newPoints[0]]);
                  } else {
                    replaceGpsPoints(newPoints);
                  }
                }
              }
              if (val?.geometryType && val.geometryType !== effectiveGeometryType) {
                form?.setFieldValue('geometryType', val.geometryType);
              }
              if (val?.symbolId) {
                form?.setFieldValue('mapSymbolId', val.symbolId);
                form?.setFieldValue('symbolId', val.symbolId);
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
}
