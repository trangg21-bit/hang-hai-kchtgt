// ── BuoyFormContent — presentational Drawer form body (T4, design §2.5) ─
// No fetch, no routing. 3 Tabs: Thông tin chung / Thông tin vị trí / File đính kèm.

import React, { useState } from 'react';
import {
  Row, Col, Form, Input, InputNumber, Select, DatePicker, Upload, Button, Tabs,
  Table, message, Space, Modal,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { DeleteOutlined, FileOutlined, PlusOutlined, EnvironmentOutlined, InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import {
  textTertiary, textPrimary, sidebarBg, statusCritical, actionPrimary,
  fontSizeMd, fontSizeSm, fontSizeLg, fontWeightMedium, fontWeightBold,
  radiusPill, radiusMd, spaceSm, spaceMd, spaceFormField, surfaceCard, borderDefault, uploadHintStyle,
  readonlyInputStyle, drawerTabBarStyle, drawerTabContentStyle, drawerFormScrollStyle,
  primaryButtonStyle, outlineButtonStyle,
} from '../../themetokenchk';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import { useAuthStore } from '../../store/authStore';
import {
  CLASSIFICATION_OPTIONS,
  CLASSIFICATION_BUOY_OPTIONS,
  CLASSIFICATION_MARK_OPTIONS,
  CONDITION_OPTIONS,
  BEACON_LIGHT_OPTIONS,
} from './schema';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { fmtInputNumber } from '../../utils/numFmt';
import toast from '../../components/ToastNotification';
import GisLocationSelector from '../../components/gis/GisLocationSelector';

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
const parseInteger = (v: string | undefined): number => {
  const intPart = (v ?? '').replace(/,/g, '').split('.')[0];
  return intPart === '' ? 0 : Number(intPart);
};

const labelProps = (text: string) => ({
  label: <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px). */
const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null, m: number | null, s: number | null) => void,
) => {
  return (
    <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
      <InputNumber value={dVal} min={0} max={maxDeg} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(v, mVal ?? null, sVal ?? null)} style={{ flex: 1, minWidth: 0, borderRadius: '999px 0 0 999px', height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>°</span>
      <InputNumber value={mVal} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal ?? null, v, sVal ?? null)} style={{ flex: 1, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>'</span>
      <InputNumber value={sVal} min={0} max={59.99} step={0.01} placeholder="Giây" formatter={fmtInputNumber} onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal ?? null, mVal ?? null, v)} style={{ flex: 1.2, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitEndStyle}>"</span>
    </Space.Compact>
  );
};

const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length-1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.+-]+)\s+([\d.+-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* ignore */ }
  return [];
};

/** true khi giá trị field đã đạt đủ max ký tự — dùng để bật viền đỏ ô nhập + message cảnh báo bên dưới. */
function useMaxReached(name: string, max: number): boolean {
  const raw = Form.useWatch(name) ?? '';
  const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
  return len >= max;
}

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
  setUploadFileList: (files: any[]) => void;
  symbols: Array<{ id: string; name: string; code?: string; image?: string }>;
  /** Map id người dùng → tên hiển thị (cột Người tải lên trong bảng file đính kèm). */
  userMap?: Map<string, string>;
  geometryType?: string;
  gpsCoordList: Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>;
  gpsError?: string | null;
  addGpsPoint: () => void;
  removeGpsPoint: (i: number) => void;
  updateGpsPoint: (i: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => void;
  ddToDms: (dd: number | null | undefined) => { d: number | null; m: number | null; s: number | null };
}

export default function BuoyFormContent({
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
  geometryType,
  gpsCoordList,
  gpsError,
  addGpsPoint,
  removeGpsPoint,
  updateGpsPoint,
  ddToDms,
  buoyStations,
  loadingStations,
  onStationChange,
  currentStationId,
  selectedUnitId,
}: BuoyFormContentProps) {
  const currentUser = useAuthStore((s: any) => s.user);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsPage, setGpsPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  // Cụm toggle ▼/▶ trong tab Thông tin chung (mặc định MỞ) — pattern BuoyBerthForm announcementOpen
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [timingOpen, setTimingOpen] = useState(true);
  const [lightOpen, setLightOpen] = useState(true);
  const atMax = {
    name: useMaxReached('name', 255),
    locationDetail: useMaxReached('locationDetail', 500),
    shape: useMaxReached('shape', 500),
    structure: useMaxReached('structure', 2000),
    area: useMaxReached('area', 20),
    bodyHeight: useMaxReached('bodyHeight', 20),
    diameter: useMaxReached('diameter', 20),
    towerHeight: useMaxReached('towerHeight', 20),
    lightHeight: useMaxReached('lightHeight', 20),
    lightModel: useMaxReached('lightModel', 100),
    towerColor: useMaxReached('towerColor', 500),
    powerSupply: useMaxReached('powerSupply', 500),
    range: useMaxReached('range', 20),
    lightColor: useMaxReached('lightColor', 50),
    flashType: useMaxReached('flashType', 50),
    period: useMaxReached('period', 50),
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
    if (uploadFileList.length >= MAX_FILE_COUNT) {
      message.error('Chỉ được upload tối đa 10 file');
      return false;
    }
    const uploadFile: UploadFile = {
      uid: `-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'done',
      originFileObj: file,
    };
    setUploadFileList([...uploadFileList, uploadFile]);
    return false;
  };

  const handleRemoveFile = (file: UploadFile) => {
    setUploadFileList(uploadFileList.filter((f) => f.uid !== file.uid));
  };

  const tabItems = [
    {
      key: 'general',
      label: 'Thông tin chung',
      children: (
        <div style={drawerFormScrollStyle}>
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
                  disabled={!selectedUnitId || (buoyStations.length === 0 && !loadingStations) || (isEdit && !!currentStationId)}
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
                name="classification"
                {...labelProps('Phân loại')}
                required
                style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Vui lòng chọn phân loại' }]}
              >
                <Select placeholder="Chọn Phân loại" options={CLASSIFICATION_OPTIONS} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="classificationBuoy" {...labelProps('Phân loại phao')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn Phân loại phao" options={CLASSIFICATION_BUOY_OPTIONS} allowClear style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item name="classificationMark" {...labelProps('Phân loại tiêu')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn Phân loại tiêu" options={CLASSIFICATION_MARK_OPTIONS} allowClear style={selectStyle} />
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
                validateStatus={atMax.name ? 'error' : undefined} help={atMax.name ? 'Đã đạt tối đa 255 ký tự' : undefined}
              >
                <Input placeholder="Nhập Tên phao, tiêu" maxLength={255} showCount style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/Thành Phố)')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn Địa điểm (Tỉnh/Thành Phố)" options={VIETNAM_PROVINCE_OPTIONS} showSearch allowClear style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item name="locationDetail" {...labelProps('Địa điểm chi tiết')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.locationDetail ? 'error' : undefined} help={atMax.locationDetail ? 'Đã đạt tối đa 500 ký tự' : undefined}>
                <Input placeholder="Nhập Địa điểm chi tiết" maxLength={500} showCount style={inputStyle} />
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
          {/* ── Toggle: Chỉ số tổng hợp (mặc định MỞ) ── */}
          <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setSummaryOpen(!summaryOpen)}>
            <span style={{ color: summaryOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{summaryOpen ? '▼' : '▶'} Chỉ số tổng hợp</span>
          </button>
          {summaryOpen && (<div style={{ marginTop: spaceFormField }}>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="shape" {...labelProps('Hình dạng')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.shape ? 'error' : undefined} help={atMax.shape ? 'Đã đạt tối đa 500 ký tự' : undefined}>
                  <Input placeholder="Nhập Hình dạng" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="structure" {...labelProps('Kết cấu')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.structure ? 'error' : undefined} help={atMax.structure ? 'Đã đạt tối đa 2000 ký tự' : undefined}>
                  <Input placeholder="Nhập Kết cấu" maxLength={2000} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="area" {...labelProps('Diện tích (m2)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.area ? 'error' : undefined} help={atMax.area ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                  <InputNumber min={0} maxLength={20} placeholder="Nhập Diện tích (m2)" style={numberInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="bodyHeight" {...labelProps('Chiều cao thân phao (m)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.bodyHeight ? 'error' : undefined} help={atMax.bodyHeight ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                  <InputNumber min={0} maxLength={20} placeholder="Nhập Chiều cao thân phao (m)" style={numberInputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="diameter" {...labelProps('Đường kính phao (m)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.diameter ? 'error' : undefined} help={atMax.diameter ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                  <InputNumber min={0} maxLength={20} placeholder="Nhập Đường kính phao (m)" style={numberInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="beaconLight" {...labelProps('Đèn biển')} style={{ marginBottom: spaceFormField }}>
                  <Select placeholder="Chọn Đèn biển" options={BEACON_LIGHT_OPTIONS} allowClear style={selectStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="towerHeight" {...labelProps('Chiều cao tháp đèn')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.towerHeight ? 'error' : undefined} help={atMax.towerHeight ? 'Đã đạt tối đa 20 ký tự' : undefined}>
                  <InputNumber min={0} step={1} precision={0} maxLength={20} placeholder="Nhập Chiều cao tháp đèn" parser={parseInteger} style={numberInputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lightHeight"
                  {...labelProps('Chiều cao tâm sáng (hải đồ)')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Chiều cao tâm sáng là bắt buộc' }]}
                  validateStatus={atMax.lightHeight ? 'error' : undefined} help={atMax.lightHeight ? 'Đã đạt tối đa 20 ký tự' : undefined}
                >
                  <InputNumber min={0.01} step={1} precision={0} maxLength={20} placeholder="Nhập Chiều cao tâm sáng (hải đồ)" parser={parseInteger} style={numberInputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="lightModel" {...labelProps('Chủng loại đèn (Thiết bị báo hiệu)')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.lightModel ? 'error' : undefined} help={atMax.lightModel ? 'Đã đạt tối đa 100 ký tự' : undefined}>
                  <Input placeholder="Nhập Chủng loại đèn (Thiết bị báo hiệu)" maxLength={100} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="towerColor" {...labelProps('Màu sắc bên ngoài của tháp đèn')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.towerColor ? 'error' : undefined} help={atMax.towerColor ? 'Đã đạt tối đa 500 ký tự' : undefined}>
                  <Input placeholder="Nhập Màu sắc bên ngoài của tháp đèn" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="powerSupply" {...labelProps('Nguồn cung cấp năng lượng cho đèn')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.powerSupply ? 'error' : undefined} help={atMax.powerSupply ? 'Đã đạt tối đa 500 ký tự' : undefined}>
                  <Input placeholder="Nhập Nguồn cung cấp năng lượng cho đèn" maxLength={500} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="range"
                  {...labelProps('Phạm vi chiếu sáng')}
                  required
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Phạm vi chiếu sáng là bắt buộc' }]}
                  tooltip="Phạm vi chiếu sáng (hải lý)"
                  validateStatus={atMax.range ? 'error' : undefined} help={atMax.range ? 'Đã đạt tối đa 20 ký tự' : undefined}
                >
                  <InputNumber min={0.01} step={1} precision={0} maxLength={20} placeholder="Nhập Phạm vi chiếu sáng" parser={parseInteger} style={numberInputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>)}
          {/* ── Toggle: Thời điểm (mặc định MỞ) — 'Thời điểm sửa chữa gần nhất' chỉ hiển thị ở chi tiết ── */}
          <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setTimingOpen(!timingOpen)}>
            <span style={{ color: timingOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{timingOpen ? '▼' : '▶'} Thời điểm</span>
          </button>
          {timingOpen && (<div style={{ marginTop: spaceFormField }}>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="commissionedDate" {...labelProps('Thời điểm đưa vào sử dụng')} style={{ marginBottom: spaceFormField }}>
                  <DatePicker placeholder="Chọn Thời điểm đưa vào sử dụng" format="DD/MM/YYYY" popupClassName="buoy-date-picker" style={datePickerStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>)}
          {/* ── Toggle: Đặc tính ánh sáng (mặc định MỞ) — gom từ tab riêng ── */}
          <button type="button" style={{ cursor: 'pointer', marginTop: spaceFormField, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setLightOpen(!lightOpen)}>
            <span style={{ color: lightOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{lightOpen ? '▼' : '▶'} Đặc tính ánh sáng</span>
          </button>
          {lightOpen && (<div style={{ marginTop: spaceFormField }}>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="lightColor" {...labelProps('Màu sắc')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.lightColor ? 'error' : undefined} help={atMax.lightColor ? 'Đã đạt tối đa 50 ký tự' : undefined}>
                  <Input placeholder="Nhập Màu sắc" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="flashType" {...labelProps('Kiểu chớp')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.flashType ? 'error' : undefined} help={atMax.flashType ? 'Đã đạt tối đa 50 ký tự' : undefined}>
                  <Input placeholder="Nhập Kiểu chớp" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <Form.Item name="period" {...labelProps('Chu kỳ')} style={{ marginBottom: spaceFormField }} validateStatus={atMax.period ? 'error' : undefined} help={atMax.period ? 'Đã đạt tối đa 50 ký tự' : undefined}>
                  <Input placeholder="Nhập Chu kỳ" maxLength={50} showCount style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
          </div>)}
        </div>
      ),
    },
    {
      key: 'gis',
      label: `Thông tin vị trí (${gpsCoordList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
          <Row gutter={[24, 0]}>
            <Col span={12}>
              <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn Loại đối tượng" allowClear options={GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mapSymbolId" {...labelProps('Biểu tượng')} style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn Biểu tượng" allowClear showSearch optionFilterProp="label"
                  disabled={!geometryType} style={selectStyle}>
                  {symbols.map((sym) => (
                    <Select.Option key={sym.id} value={sym.id} label={sym.code ? `${sym.name} (${sym.code})` : sym.name}>
                      <Space>
                        {sym.image && <img src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                        <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
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
                <Select placeholder="Chọn Hệ quy chiếu" disabled style={selectStyle} options={COORD_SYS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Nhập Quy tắc hiển thị" maxLength={255} disabled style={readonlyInputStyle} />
              </Form.Item>
            </Col>
          </Row>
          {/* ── Tọa độ GPS: 6 trường DMS riêng (latD/latM/latS/lngD/lngM/lngS), mỗi ô ghi trực tiếp (chuẩn VTS CHK) ── */}
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
            <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
              Tọa độ GPS ({gpsCoordList.length})
            </span>
            <Space size={8}>
              <Button
                icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                onClick={() => setGisModalOpen(true)}
                disabled={!geometryType}
                style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                Chọn tọa độ trên bản đồ
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addGpsPoint}
                disabled={!geometryType}
                style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                Thêm tọa độ
              </Button>
            </Space>
          </div>
          {gpsCoordList.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
              <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!geometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
            </div>
          ) : (
            <>
            {gpsError && (
              <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
              </div>
            )}
            <Table
              size="small"
              tableLayout="fixed"
              pagination={gpsCoordList.length > 10 ? {
                current: gpsPage,
                pageSize: 10,
                total: gpsCoordList.length,
                onChange: (p) => setGpsPage(p),
                showSizeChanger: false,
                size: 'small',
              } : false}
              dataSource={gpsCoordList.map((c, i) => ({ ...c, _idx: i }))}
              rowKey={(r, idx) => r._idx ?? String(idx)}
              locale={{ emptyText: 'Chưa có tọa độ GPS nào' }}
              columns={[
                {
                  title: 'STT',
                  width: 60,
                  align: 'center',
                  render: (_v, _r, idx) => (gpsPage - 1) * 10 + idx + 1,
                },
                {
                  title: 'Vĩ độ (Latitude - N)',
                  key: 'lat',
                  render: (_v, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                },
                {
                  title: 'Kinh độ (Longitude - E)',
                  key: 'lng',
                  render: (_v, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
                },
                {
                  title: '',
                  width: 50,
                  align: 'center',
                  render: (_v, record: any) => (
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeGpsPoint(record._idx)} />
                  ),
                },
              ]}
            />
            </>
          )}
        </div>
      ),
    },
    {
      key: 'files',
      label: `File đính kèm (${uploadFileList.length})`,
      children: (
        <div style={drawerFormScrollStyle}>
          <div style={{ marginBottom: spaceMd }}>
            <Upload.Dragger
              beforeUpload={handleBeforeUpload}
              showUploadList={false}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
              multiple
              style={{ background: '#fafbfc', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, padding: '24px 16px' }}
            >
              <p style={{ marginBottom: 8 }}>
                <InboxOutlined style={{ fontSize: 44, color: actionPrimary }} />
              </p>
              <p style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: textPrimary, marginBottom: 4 }}>
                Kéo thả tệp vào đây hoặc nhấp để chọn tệp tải lên
              </p>
              <p style={{ fontSize: fontSizeSm, color: textTertiary, margin: 0 }}>
                Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Mỗi file ≤ 20MB.
              </p>
            </Upload.Dragger>
          </div>
          <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
            <span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
              Danh sách tệp đính kèm ({uploadFileList.length})
            </span>
          </div>
          <Table
            size="small"
            pagination={uploadFileList.length > 10 ? {
              current: filePage,
              pageSize: 10,
              total: uploadFileList.length,
              onChange: (p) => setFilePage(p),
              showSizeChanger: false,
              size: 'small',
            } : false}
            dataSource={uploadFileList.map((f, i) => ({ ...f, key: f.uid, _idx: i, name: f.name }))}
            rowKey={(r) => r.uid || r._idx}
            locale={{ emptyText: 'Chưa có tài liệu đính kèm nào' }}
            scroll={{ x: 720 }}
            columns={[
              {
                title: 'STT',
                width: 60,
                align: 'center',
                render: (_v, _r, idx) => (filePage - 1) * 10 + idx + 1,
              },
              {
                title: 'Tên tài liệu',
                key: 'name',
                dataIndex: 'name',
                render: (name: string) => (
                  <a
                    onClick={() => toast.info(`Đang tải xuống tệp: ${name}`)}
                    style={{ fontSize: fontSizeMd, color: actionPrimary, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: fontWeightMedium, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                  >
                    <FileOutlined />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  </a>
                ),
              },
              {
                title: 'Dung lượng',
                key: 'size',
                width: 120,
                align: 'right' as const,
                render: (_v, rec: any) => rec.size ? (rec.size > 1024 * 1024 ? `${(rec.size / (1024 * 1024)).toFixed(2)} MB` : `${(rec.size / 1024).toFixed(1)} KB`) : '—',
              },
              {
                title: 'Người tải lên',
                key: 'uploadedBy',
                width: 180,
                render: (_v, rec: any) => rec.uploadedBy ? (userMap?.get(rec.uploadedBy) || rec.uploadedBy) : (currentUser?.fullName || currentUser?.username || '—'),
              },
              {
                title: 'Ngày tải lên',
                key: 'uploadedDate',
                width: 160,
                align: 'center' as const,
                render: (_v, rec: any) => (rec.uploadedAt || rec.uploadedDate) ? dayjs(rec.uploadedAt || rec.uploadedDate).format('DD/MM/YYYY HH:mm') : '—',
              },
              {
                title: '',
                key: 'actions',
                width: 80,
                align: 'center',
                render: (_v, record: any) => (
                  <Space size={4}>
                    <Button type="text" icon={<DownloadOutlined style={{ color: actionPrimary }} />} onClick={() => toast.info(`Đang tải xuống tệp: ${record.name}`)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveFile(record)} />
                  </Space>
                ),
              },
            ]}
          />
          <div style={{ marginTop: spaceSm }}>
            <span style={uploadHintStyle}>Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Tối đa 10 file, mỗi file ≤20MB.</span>
          </div>
        </div>
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
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="cancel" onClick={() => setGisModalOpen(false)} style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}>
            Hủy
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => setGisModalOpen(false)}
            style={{ ...primaryButtonStyle, height: 36 }}
          >
            Xác nhận tọa độ
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType="POINT"
            height={520}
            onChange={(val) => {
              if (val?.coordinates) {
                const points = parseGisCoordinates({ geometryType: val.geometryType, coordinates: val.coordinates });
                if (points.length > 0) {
                  const toDmsRow = (p: { latitude: number; longitude: number }) => {
                    const latDms = ddToDms(p.latitude);
                    const lngDms = ddToDms(p.longitude);
                    return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
                  };
                  const rowKey = (row: any) => `${Math.round(((row.latD ?? 0) + (row.latM ?? 0) / 60 + (row.latS ?? 0) / 3600) * 1e5)}_${Math.round(((row.lngD ?? 0) + (row.lngM ?? 0) / 60 + (row.lngS ?? 0) / 3600) * 1e5)}`;
                  const existingKeys = new Set(gpsCoordList.map(rowKey));
                  const toAdd = points.map(toDmsRow).filter((r) => !existingKeys.has(rowKey(r)));
                  if (toAdd.length > 0) {
                    const baseIdx = gpsCoordList.length;
                    toAdd.forEach(() => { addGpsPoint(); });
                    toAdd.forEach((row, k) => {
                      updateGpsPoint(baseIdx + k, 'lat', row.latD, row.latM, row.latS);
                      updateGpsPoint(baseIdx + k, 'lng', row.lngD, row.lngM, row.lngS);
                    });
                  }
                }
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
}
