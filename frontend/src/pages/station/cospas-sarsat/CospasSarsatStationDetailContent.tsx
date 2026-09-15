import React, { useState, useEffect } from 'react';
import { Tabs, Button, Tooltip, Modal, Spin } from 'antd';
import {
  BankOutlined,
  DownOutlined,
  RightOutlined,
  FileOutlined,
  DownloadOutlined,
  FileImageOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../../components/ToastNotification';
import api from '../../../services/api';
import { cospasSarsatStationService } from '../../../services/cospasSarsatStationService';
import type { CoastalStationCospasSarsatResponse } from '../../../services/station/types';
import { ConditionStatus } from '../../../types/vtsSystem';
import {
  colors,
  actionPrimary,
  fontWeightBold,
  fontWeightMedium,
  fontSizeSm,
  textTertiary,
  statusCritical,
  radiusPill,
  statusBadgeStyle,
  outlineButtonStyle,
  primaryButtonStyle,
  surfaceCard,
  DRAWER_TABLE_SCROLL_Y,
  getConditionStatusColor,
  getConditionStatusLabel,
} from '../../../themetokenchk';
import { getProvinceNameById } from '../../../types/common';
import DetailTable from '../../../components/shared/DetailTable';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import GisLocationSelector from '../../../components/gis/GisLocationSelector';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import { parseWktToCoordinates } from '../../../utils/gisGeometry';

const fontSizeMd = 13.5;

const isImageFile = (name?: string): boolean => {
  if (!name) return false;
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
};

const cospasDetailStyle = `
  .cospas-detail-content-wrapper,
  .cospas-detail-content-wrapper .chk-detail-label,
  .cospas-detail-content-wrapper .chk-detail-value,
  .cospas-detail-content-wrapper .ant-table,
  .cospas-detail-content-wrapper .ant-table-cell,
  .cospas-detail-content-wrapper .ant-table-thead > tr > th,
  .cospas-detail-content-wrapper .ant-tabs-tab,
  .cospas-detail-content-wrapper .ant-btn,
  .cospas-detail-content-wrapper .ant-select,
  .cospas-detail-content-wrapper .ant-select-selection-item,
  .cospas-detail-content-wrapper .ant-select-item {
    font-size: 13.5px !important;
  }

  .cospas-detail-content-wrapper .chk-detail-grid {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
    column-gap: 28px !important;
    row-gap: 0 !important;
  }

  .cospas-detail-content-wrapper .chk-detail-row {
    display: flex !important;
    align-items: flex-start !important;
    min-height: 36px !important;
    padding: 7px 0 !important;
    border-bottom: 1px solid #f1f5f9 !important;
    line-height: 1.5 !important;
    gap: 10px !important;
  }

  .cospas-detail-content-wrapper .chk-detail-row:last-child {
    border-bottom: none !important;
  }

  .cospas-detail-content-wrapper .chk-detail-row--full {
    grid-column: 1 / -1 !important;
  }

  .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .chk-detail-label,
  .cospas-detail-content-wrapper .chk-detail-label {
    width: 215px !important;
    min-width: 215px !important;
    max-width: 215px !important;
    flex-shrink: 0 !important;
    color: ${colors.sidebarBg} !important;
    font-weight: 600 !important;
    font-size: 13.5px !important;
    text-align: left !important;
    line-height: 1.5 !important;
  }

  .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .sec-col1-label,
  .cospas-detail-content-wrapper .sec-col1-label {
    width: 215px !important;
    min-width: 215px !important;
    max-width: 215px !important;
    flex-shrink: 0 !important;
  }

  .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .sec-col2-label,
  .cospas-detail-content-wrapper .sec-col2-label {
    width: 250px !important;
    min-width: 250px !important;
    max-width: 250px !important;
    flex-shrink: 0 !important;
  }

  .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .sec-full-label,
  .cospas-detail-content-wrapper .sec-full-label {
    width: 215px !important;
    min-width: 215px !important;
    max-width: 215px !important;
    flex-shrink: 0 !important;
  }

  .cospas-detail-content-wrapper .chk-detail-label::after {
    content: ':' !important;
    margin-left: 1px !important;
    margin-right: 4px !important;
  }

  .cospas-detail-content-wrapper .chk-detail-value {
    color: #1e293b !important;
    font-size: 13.5px !important;
    flex: 1 !important;
    min-width: 0 !important;
    text-align: left !important;
    line-height: 1.5 !important;
    word-break: break-word !important;
  }

  @media (max-width: 960px) {
    .cospas-detail-content-wrapper .chk-detail-grid {
      grid-template-columns: 1fr !important;
      column-gap: 0 !important;
    }
    .cospas-detail-content-wrapper .chk-detail-row--full {
      grid-column: 1 !important;
    }
    .cospas-sarsat-drawer-scope .cospas-detail-content-wrapper .chk-detail-row .chk-detail-label,
    .cospas-detail-content-wrapper .chk-detail-label,
    .cospas-detail-content-wrapper .sec-col1-label,
    .cospas-detail-content-wrapper .sec-col2-label,
    .cospas-detail-content-wrapper .sec-full-label {
      width: 250px !important;
      min-width: 250px !important;
      max-width: 250px !important;
    }
  }
`;

const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '12px 18px 8px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
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

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '');

const ddToDms = (dd?: number | null) => {
  if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
  return { d, m, s };
};

const parseGisCoordinates = (record: any): Array<{ lat: number; lng: number }> => {
  if (!record) return [];
  const out: Array<{ lat: number; lng: number }> = [];
  const raw = record.coordinates;
  if (raw && typeof raw === 'string' && raw.trim()) {
    const parsed = parseWktToCoordinates(raw);
    if (parsed.length > 0) {
      parsed.forEach((p) => {
        if (!isNaN(p.latitude) && !isNaN(p.longitude)) {
          out.push({ lat: p.latitude, lng: p.longitude });
        }
      });
    }
  }
  if (out.length === 0 && Array.isArray(raw)) {
    raw.forEach((p: any) => {
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.lng);
      if (!isNaN(lat) && !isNaN(lng)) out.push({ lat, lng });
    });
  }
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    const lat = Number(record.latitude);
    const lng = Number(record.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      out.push({ lat, lng });
    }
  }
  return out;
};

export function getOperatingOrgName(id?: string | null): string {
  if (!id) return '';
  const found = DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === id);
  return found ? found.name : id;
}

export const COSPAS_SERVICE_OPTIONS = [
  { value: '406_MHZ_BEACON', label: '406 MHz Distress Beacon — Phao phát tín hiệu báo nạn 406 MHz' },
  { value: 'GEOSAR', label: 'GEOSAR — Hệ thống vệ tinh địa tĩnh Cospas-Sarsat' },
  { value: 'LEOSAR', label: 'LEOSAR — Hệ thống vệ tinh quỹ đạo thấp Cospas-Sarsat' },
  { value: 'MEOSAR', label: 'MEOSAR — Hệ thống vệ tinh quỹ đạo tầm trung thế hệ mới' },
  { value: 'EPIRB', label: 'EPIRB — Phao vô tuyến chỉ báo vị trí khẩn cấp hàng hải' },
  { value: 'ELT', label: 'ELT — Thiết bị phát sóng khẩn cấp cho máy bay' },
  { value: 'PLB', label: 'PLB — Thiết bị định vị cá nhân tìm kiếm cứu nạn' },
  { value: 'LUT', label: 'LUT — Trạm thu mặt đất xử lý tín hiệu cấp cứu' },
  { value: 'MCC', label: 'MCC — Trung tâm kiểm soát điều phối tìm kiếm cứu nạn' },
];

export function getServiceName(code: string): string {
  const found = COSPAS_SERVICE_OPTIONS.find((s) => s.value === code);
  return found ? found.label : code;
}

export interface CospasSarsatStationDetailContentProps {
  id: string;
  initialData?: CoastalStationCospasSarsatResponse | null;
  orgUnits?: any[];
  symbols?: any[];
  onClose?: () => void;
  onEdit?: (record: CoastalStationCospasSarsatResponse) => void;
}

export default function CospasSarsatStationDetailContent(props: CospasSarsatStationDetailContentProps) {
  const { id, initialData, orgUnits, symbols, onClose, onEdit } = props;
  const [data, setData] = useState<CoastalStationCospasSarsatResponse | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [approvalCollapsed, setApprovalCollapsed] = useState(false);

  // File preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    setLoading(true);
    cospasSarsatStationService.getById(id)
      .then((res) => {
        if (!cancelled && res) {
          setData(res);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.message || 'Không thể tải thông tin chi tiết đài Cospas-Sarsat');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading && !data) {
    return (
      <div style={{ padding: 24 }}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: textTertiary }}>
        Không tìm thấy dữ liệu đài Cospas-Sarsat
      </div>
    );
  }

  const orgName = (() => {
    const uId = data.unitId || data.orgUnitId;
    if (!uId) return '';
    if (Array.isArray(orgUnits)) {
      const found = orgUnits.find((o) => String(o.id) === String(uId));
      if (found) return found.name || found.code || uId;
    }
    return data.orgUnitName || uId;
  })();

  const operatingOrg = getOperatingOrgName(data.operatingOrgId);
  const provinceName = data.provinceId ? getProvinceNameById(data.provinceId) : '';
  const gisCoords = parseGisCoordinates(data);

  // TAB 1: Thông tin chung
  const renderGeneralInfoTab = () => (
    <div style={{ padding: '8px 0', fontSize: fontSizeMd }}>
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>
            <BankOutlined style={{ color: actionPrimary }} />
            <span>Thông tin đài Cospas-Sarsat</span>
          </div>
        </div>

        <div className="chk-detail-grid">
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">1. Mã đài</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>{data.stationCode || data.code || '—'}</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">2. Tên đài</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>{data.stationName || data.name || '—'}</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">3. Đơn vị quản lý</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>{orgName || '—'}</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">4. Đơn vị khai thác</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>{operatingOrg || '—'}</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">5. Địa điểm (Tỉnh/TP)</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>{provinceName || '—'}</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">6. Tình trạng</span>
            <span className="chk-detail-value">
              {data.conditionStatus ? (
                <span
                  style={{
                    ...statusBadgeStyle,
                    borderRadius: radiusPill,
                    padding: '2px 10px',
                    fontWeight: fontWeightMedium,
                    fontSize: fontSizeMd,
                    background: `${getConditionStatusColor(data.conditionStatus as ConditionStatus)}15`,
                    border: `1px solid ${getConditionStatusColor(data.conditionStatus as ConditionStatus)}40`,
                    color: getConditionStatusColor(data.conditionStatus as ConditionStatus),
                  }}
                >
                  {getConditionStatusLabel(data.conditionStatus as ConditionStatus)}
                </span>
              ) : (
                '—'
              )}
            </span>
          </div>
          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label sec-full-label">7. Địa điểm chi tiết</span>
            <span className="chk-detail-value" style={{ color: '#0F172A' }}>{data.locationAddress || '—'}</span>
          </div>
          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label sec-full-label">8. Vùng phủ sóng</span>
            <span className="chk-detail-value" style={{ color: '#0F172A' }}>{data.coverageArea || '—'}</span>
          </div>
          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label sec-full-label">9. Dịch vụ cung cấp</span>
            <span className="chk-detail-value">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.isArray(data.services) && data.services.length > 0 ? (
                  data.services.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: radiusPill,
                        padding: '2px 10px',
                        fontSize: fontSizeSm,
                        color: '#0F172A',
                      }}
                    >
                      {getServiceName(s)}
                    </span>
                  ))
                ) : (
                  <span style={{ color: textTertiary }}>—</span>
                )}
              </div>
            </span>
          </div>
          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label sec-full-label">10. Tần số liên lạc</span>
            <span className="chk-detail-value" style={{ color: '#0F172A' }}>{data.frequency || '—'}</span>
          </div>
          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label sec-full-label">11. Ghi chú</span>
            <span className="chk-detail-value" style={{ color: '#0F172A' }}>{data.description || data.note || '—'}</span>
          </div>
        </div>
      </div>

      {/* Mục toggle: Thông tin phê duyệt */}
      <div style={sectionBoxStyle}>
        <div
          style={{ ...sectionHeaderStyle, cursor: 'pointer', borderBottom: approvalCollapsed ? 'none' : '1px solid #f1f5f9' }}
          onClick={() => setApprovalCollapsed(!approvalCollapsed)}
        >
          <div style={sectionTitleStyle}>
            <FileTextOutlined style={{ color: actionPrimary }} />
            <span>Thông tin phê duyệt</span>
          </div>
          {approvalCollapsed ? <RightOutlined style={{ color: textTertiary }} /> : <DownOutlined style={{ color: textTertiary }} />}
        </div>

        {!approvalCollapsed && (
          <div className="chk-detail-grid">
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col1-label">Trạng thái phê duyệt</span>
              <span className="chk-detail-value"><ApprovalStatusBadge status={data.approvalStatus} /></span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col2-label">Ngày cập nhật</span>
              <span className="chk-detail-value" style={{ color: '#0F172A' }}>{fmtDateTime(data.updatedAt) || '—'}</span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col1-label">Cán bộ gửi phê duyệt</span>
              <span className="chk-detail-value" style={{ color: '#0F172A' }}>{data.submittedByName || data.submittedBy || '—'}</span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col2-label">Ngày gửi phê duyệt</span>
              <span className="chk-detail-value" style={{ color: '#0F172A' }}>{fmtDateTime(data.submittedAt) || '—'}</span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt C1</span>
              <span className="chk-detail-value" style={{ color: '#0F172A' }}>{data.approverLevel1Name || data.approverLevel1 || '—'}</span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col2-label">Ngày phê duyệt C1</span>
              <span className="chk-detail-value" style={{ color: '#0F172A' }}>{fmtDateTime(data.approvedDateLevel1) || '—'}</span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt C2</span>
              <span className="chk-detail-value" style={{ color: '#0F172A' }}>{data.approverLevel2Name || data.approverLevel2 || '—'}</span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col2-label">Ngày phê duyệt C2</span>
              <span className="chk-detail-value" style={{ color: '#0F172A' }}>{fmtDateTime(data.approvedDateLevel2) || '—'}</span>
            </div>
            {data.rejectionReason && (
              <div className="chk-detail-row chk-detail-row--full" style={{ color: statusCritical }}>
                <span className="chk-detail-label sec-full-label">Lý do từ chối</span>
                <span className="chk-detail-value" style={{ color: statusCritical, fontWeight: fontWeightBold }}>{data.rejectionReason}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // TAB 2: Vị trí (GIS)
  const renderGisTab = () => {
    const symbolItem = Array.isArray(symbols) ? symbols.find((s) => s.id === data.symbolId) : null;
    return (
      <div style={{ padding: '8px 0', fontSize: fontSizeMd }}>
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <EnvironmentOutlined style={{ color: actionPrimary }} />
              <span>Thông tin tọa độ & bản đồ</span>
            </div>
          </div>

          <div className="chk-detail-grid" style={{ marginBottom: 14 }}>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col1-label">12. Loại đối tượng</span>
              <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>{data.geometryType || data.objectType || 'Điểm'}</strong></span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col2-label">13. Biểu tượng</span>
              <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>{symbolItem ? symbolItem.name : (data.symbolId || 'Đài Cospas-Sarsat')}</strong></span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col1-label">14. Hệ quy chiếu</span>
              <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>{data.coordinateSystem || 'WGS84 (EPSG:4326)'}</strong></span>
            </div>
            <div className="chk-detail-row">
              <span className="chk-detail-label sec-col2-label">15. Quy tắc hiển thị</span>
              <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>{data.displayRule || 'Hiển thị theo lớp Đài trạm chuyên dùng'}</strong></span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>16. Bảng tọa độ (LongLatTable):</span>
          </div>

          {gisCoords.length > 0 ? (
            <DetailTable
              rowKey={(_, idx) => String(idx)}
              pagination={false}
              scroll={{ y: '220px' }}
              columns={[
                { title: 'STT', dataIndex: 'idx', width: 60, align: 'center', render: (_: any, __: any, idx: number) => idx + 1 },
                {
                  title: 'Vĩ độ (Latitude)',
                  dataIndex: 'lat',
                  width: 220,
                  render: (lat: number) => {
                    const dms = ddToDms(lat);
                    return <span>{lat.toFixed(6)}° ({dms.d}° {dms.m}&apos; {dms.s}&quot; N)</span>;
                  },
                },
                {
                  title: 'Kinh độ (Longitude)',
                  dataIndex: 'lng',
                  width: 220,
                  render: (lng: number) => {
                    const dms = ddToDms(lng);
                    return <span>{lng.toFixed(6)}° ({dms.d}° {dms.m}&apos; {dms.s}&quot; E)</span>;
                  },
                },
              ]}
              dataSource={gisCoords.map((c, i) => ({ ...c, idx: i }))}
            />
          ) : (
            <div style={{ color: textTertiary, fontStyle: 'italic', marginBottom: 12 }}>
              Chưa có dữ liệu tọa độ địa lý
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <GisLocationSelector
              value={gisCoords.length > 0 ? { lat: gisCoords[0].lat, lng: gisCoords[0].lng } : undefined}
              readOnly={true}
              height={320}
              popupTitle="Bản đồ vị trí đài Cospas-Sarsat"
            />
          </div>
        </div>
      </div>
    );
  };

  // TAB 3: File đính kèm
  const renderAttachmentsTab = () => {
    const files = Array.isArray(data.files) ? data.files : [];
    return (
      <div style={{ padding: '8px 0', fontSize: fontSizeMd }}>
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <FileOutlined style={{ color: actionPrimary }} />
              <span>17. File đính kèm hồ sơ kỹ thuật ({files.length})</span>
            </div>
          </div>

          {files.length > 0 ? (
            <DetailTable
              rowKey="id"
              pagination={false}
              scroll={{ y: DRAWER_TABLE_SCROLL_Y.detailView }}
              columns={[
                { title: 'STT', width: 60, align: 'center', render: (_: any, __: any, idx: number) => idx + 1 },
                {
                  title: 'Tên file',
                  dataIndex: 'fileName',
                  render: (fn: string, r: any) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isImageFile(fn) ? <FileImageOutlined style={{ color: actionPrimary }} /> : <FileOutlined />}
                      <span style={{ fontWeight: fontWeightMedium }}>{fn || r.name || 'Tài liệu'}</span>
                    </div>
                  ),
                },
                { title: 'Kích thước', dataIndex: 'fileSize', width: 120, render: (sz: number) => (sz ? `${(sz / 1024).toFixed(1)} KB` : '—') },
                { title: 'Ngày tải lên', dataIndex: 'uploadedAt', width: 160, render: (dt: string) => fmtDateTime(dt) || '—' },
                {
                  title: 'Thao tác',
                  width: 120,
                  align: 'center',
                  render: (_: any, r: any) => (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      {isImageFile(r.fileName) && (
                        <Tooltip title="Xem trước">
                          <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined style={{ color: actionPrimary }} />}
                            onClick={() => {
                              setPreviewUrl(r.fileUrl || r.url || '');
                              setPreviewTitle(r.fileName || 'Hình ảnh');
                              setPreviewOpen(true);
                            }}
                          />
                        </Tooltip>
                      )}
                      <Tooltip title="Tải về">
                        <Button
                          type="text"
                          size="small"
                          icon={<DownloadOutlined style={{ color: actionPrimary }} />}
                          onClick={() => {
                            if (r.fileUrl || r.url) window.open(r.fileUrl || r.url, '_blank');
                            else toast.info('Chưa có link tải file');
                          }}
                        />
                      </Tooltip>
                    </div>
                  ),
                },
              ]}
              dataSource={files}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: textTertiary }}>
              Chưa có file đính kèm nào được tải lên
            </div>
          )}
        </div>
      </div>
    );
  };

  // TAB 4: Vận hành & bảo trì (read-only)
  const renderOperationTab = () => (
    <div style={{ padding: '8px 0', fontSize: fontSizeMd }}>
      {/* 1. Thông tin vận hành khai thác */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ color: colors.sidebarBg }}>Thông tin vận hành khai thác</span>
          </div>
        </div>
        <div className="chk-detail-grid">
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">18. Mã kế hoạch</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>KH-VH-SARSAT-2026</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">19. Tên kế hoạch</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>Kế hoạch trực canh tiếp nhận tín hiệu cấp cứu 24/7</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">20. Ngày bắt đầu</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>01/01/2026</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">21. Ngày kết thúc</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>31/12/2026</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Thông tin bảo trì */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ color: colors.sidebarBg }}>Thông tin bảo trì</span>
          </div>
        </div>
        <div className="chk-detail-grid">
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">22. Mã kế hoạch</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>BT-SARSAT-Q1-2026</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">23. Tên kế hoạch</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>Bảo dưỡng định kỳ ăng-ten thu vệ tinh MEOSAR & máy chủ xử lý LUT</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">24. Thời gian bắt đầu</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>15/03/2026 08:00</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">25. Thời gian kết thúc</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>16/03/2026 17:00</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Thông tin sự cố */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ color: colors.sidebarBg }}>Thông tin sự cố</span>
          </div>
        </div>
        <div className="chk-detail-grid">
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">26. Mã sự cố</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>SC-2026-001</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">27. Loại sự cố</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>Nhiễu kênh tần số phụ 406.025 MHz do thời tiết</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col1-label">28. Địa điểm</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>Trạm thu MEOSAR mặt đất</strong></span>
          </div>
          <div className="chk-detail-row">
            <span className="chk-detail-label sec-col2-label">29. Thời gian</span>
            <span className="chk-detail-value"><strong style={{ color: '#0F172A' }}>10/02/2026 14:20</strong></span>
          </div>
        </div>
      </div>
    </div>
  );

  // TAB 5: Xử lý & theo dõi
  const renderTrackingTab = () => {
    const trackingRows = [
      { key: 'status', label: '30. Trạng thái', value: <ApprovalStatusBadge status={data.approvalStatus} /> },
      { key: 'updatedAt', label: '31. Ngày cập nhật', value: fmtDateTime(data.updatedAt) || '—' },
      { key: 'updatedBy', label: '32. Cán bộ cập nhật', value: data.updatedByName || data.updatedBy || '—' },
      { key: 'submittedAt', label: '33. Ngày gửi phê duyệt', value: fmtDateTime(data.submittedAt) || '—' },
      { key: 'submittedBy', label: '34. Cán bộ gửi phê duyệt', value: data.submittedByName || data.submittedBy || '—' },
      { key: 'approvedDateL1', label: '35. Ngày phê duyệt cấp Cảng vụ/Chi cục', value: fmtDateTime(data.approvedDateLevel1) || '—' },
      { key: 'approverL1', label: '36. Cán bộ phê duyệt cấp Cảng vụ/Chi cục', value: data.approverLevel1Name || data.approverLevel1 || '—' },
      { key: 'contentL1', label: '37. Nội dung phê duyệt C1', value: data.approvalStatus === 'APPROVED_LEVEL1' ? 'Đã thẩm định hồ sơ kỹ thuật đài đạt yêu cầu' : '—' },
      { key: 'approvedDateL2', label: '38. Ngày phê duyệt cấp Cục', value: fmtDateTime(data.approvedDateLevel2) || '—' },
      { key: 'approverL2', label: '39. Cán bộ phê duyệt cấp Cục', value: data.approverLevel2Name || data.approverLevel2 || '—' },
      { key: 'contentL2', label: '40. Nội dung phê duyệt C2', value: data.approvalStatus === 'APPROVED' ? 'Chấp thuận đưa đài Cospas-Sarsat vào khai thác chính thức' : (data.rejectionReason ? `Từ chối: ${data.rejectionReason}` : '—') },
    ];

    return (
      <div style={{ padding: '8px 0', fontSize: fontSizeMd }}>
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <HistoryOutlined style={{ color: actionPrimary }} />
              <span>Tiến trình xử lý & theo dõi hồ sơ</span>
            </div>
          </div>
          <DetailTable
            rowKey="key"
            pagination={false}
            columns={[
              { title: 'Thông tin theo dõi', dataIndex: 'label', width: 320, render: (l: string) => <span style={{ fontWeight: fontWeightBold }}>{l}</span> },
              { title: 'Giá trị ghi nhận', dataIndex: 'value', render: (v: any) => <span>{v}</span> },
            ]}
            dataSource={trackingRows}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="cospas-detail-content-wrapper">
      <style>{cospasDetailStyle}</style>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'info', label: 'TAB 1: Thông tin chung', children: renderGeneralInfoTab() },
          { key: 'gis', label: 'TAB 2: Vị trí (GIS)', children: renderGisTab() },
          { key: 'files', label: 'TAB 3: File đính kèm', children: renderAttachmentsTab() },
          { key: 'ops', label: 'TAB 4: Vận hành & bảo trì', children: renderOperationTab() },
          { key: 'track', label: 'TAB 5: Xử lý & theo dõi', children: renderTrackingTab() },
        ]}
      />

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={750}
      >
        <div style={{ textAlign: 'center', padding: 12 }}>
          <img src={previewUrl} alt={previewTitle} style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain' }} />
        </div>
      </Modal>
    </div>
  );
}
