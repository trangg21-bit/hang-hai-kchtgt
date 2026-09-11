import { useState, useMemo } from 'react';
import { Tabs, Button, Modal } from 'antd';
import {
  EnvironmentOutlined,
  BankOutlined, SlidersOutlined, FileTextOutlined, AuditOutlined,
  DownOutlined, RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import {
  surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightBold, spaceSm, spaceMd, spaceFormField,
  actionPrimary, statusBadgeStyle,
  outlineButtonStyle, primaryButtonStyle,
  formatUserDisplayName, isUuidString,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import type { DryPort } from './dry-port';
import { downloadDryPortAttachment, trangThaiPheDuyetBadge, trangThaiHoatDongBadge } from './dry-port';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { parseWktToCoordinates } from '../../utils/gisGeometry';
import { fmtNum } from '../../utils/numFmt';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';

function formatDateOnly(d: string | null | undefined): string {
  if (!d) return '';
  try {
    return dayjs(d).format('DD/MM/YYYY');
  } catch {
    return d;
  }
}

export interface DryPortDetailContentProps {
  selectedRecord: DryPort;
  organizations: any[];
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  userMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number | null | undefined) => { d: number | null; m: number | null; s: number | null };
  provinceName: (provinceId: number | null | undefined) => string;
}

const COORD_SYS_LABELS: Record<number, string> = { 1: 'WGS-84', 2: 'VN-2000' };

// Style cho thẻ phân nhóm (Section Card) chuẩn Berth / Buoy / BuoyStation
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

// Parse tọa độ GPS: ưu tiên WKT qua parseWktToCoordinates; fallback sang latitude/longitude
const parseGisCoordinates = (record: any): Array<{ lat: number; lng: number }> => {
  const out = parseWktToCoordinates(record?.coordinates)
    .map(({ latitude, longitude }) => ({ lat: latitude, lng: longitude }));
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    out.push({ lat: Number(record.latitude), lng: Number(record.longitude) });
  }
  return out;
};

export default function DryPortDetailContent({
  selectedRecord: r,
  organizations,
  symbolMap,
  symbolImageMap,
  userMap,
  detailFiles,
  ddToDms,
  provinceName,
}: DryPortDetailContentProps) {
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  // Toggle cụm 'Thông tin công bố' và 'Thông tin phê duyệt'
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [planOpen, setPlanOpen] = useState(true);

  // Bản đồ orgUnitId → tên đơn vị
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    (Array.isArray(organizations) ? organizations : []).forEach((o: any) => { if (o?.id) map.set(o.id, o.name || o.id); });
    return map;
  }, [organizations]);

  const operatingOrgName = (r as any)?.operatingOrgName
    || DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === (r as any)?.operatingOrgId || o.id === r.operatingUnit)?.name
    || r.operatingUnit
    || (r as any)?.operatingOrgId
    || '';

  return (
    <div className="dry-port-detail-content-wrapper">
      <style>{`
        .dry-port-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .dry-port-detail-content-wrapper,
        .dry-port-detail-content-wrapper .chk-detail-label,
        .dry-port-detail-content-wrapper .chk-detail-value,
        .dry-port-detail-content-wrapper .ant-table,
        .dry-port-detail-content-wrapper .ant-table-cell,
        .dry-port-detail-content-wrapper .ant-table-thead > tr > th,
        .dry-port-detail-content-wrapper .ant-tabs-tab,
        .dry-port-detail-content-wrapper .ant-btn,
        .dry-port-detail-content-wrapper .ant-select,
        .dry-port-detail-content-wrapper .ant-select-selection-item,
        .dry-port-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .dry-port-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .dry-port-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: center !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .dry-port-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .dry-port-drawer-scope .dry-port-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .dry-port-detail-content-wrapper .chk-detail-label {
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

        .dry-port-drawer-scope .dry-port-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .dry-port-detail-content-wrapper .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .dry-port-drawer-scope .dry-port-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .dry-port-detail-content-wrapper .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }

        .dry-port-drawer-scope .dry-port-detail-content-wrapper .chk-detail-row .sec-full-label,
        .dry-port-detail-content-wrapper .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }

        .dry-port-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .dry-port-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .dry-port-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .dry-port-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
        }
      `}</style>

      <Tabs
        defaultActiveKey="general"
        tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
        items={[
          {
            key: 'general',
            label: 'Thông tin chung',
            children: (
              <div style={{ paddingTop: 6, paddingRight: 4, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành ── */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <BankOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin cơ bản & Quản lý vận hành</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Mã cảng cạn</span>
                      <span className="chk-detail-value">
                        {r.dryPortCode ? <span style={statusBadgeStyle(actionPrimary)}>{r.dryPortCode}</span> : ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tên cảng cạn</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
                        {r.dryPortName || ''}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Đơn vị quản lý</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const name = orgMap.get(r.orgUnitId || '') || r.orgUnitId || '';
                          return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Đơn vị khai thác</span>
                      <span className="chk-detail-value">{operatingOrgName}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Khu vực</span>
                      <span className="chk-detail-value">{r.region || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Địa điểm (Tỉnh/Thành Phố)</span>
                      <span className="chk-detail-value">{provinceName(r.provinceId) || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Hành lang vận tải</span>
                      <span className="chk-detail-value">{r.transportCorridor || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Phương thức kết nối giao thông</span>
                      <span className="chk-detail-value">{r.connectionMode || ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Tình trạng</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const b = trangThaiHoatDongBadge(r.portStatus, (r as any).operationalStatus);
                          return <span style={b.style}>{b.label}</span>;
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Địa điểm chi tiết</span>
                      <span className="chk-detail-value">{r.detailedLocation || ''}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Ghi chú</span>
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {r.remarks || ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Quy mô & Năng lực khai thác ── */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Quy mô & Năng lực khai thác</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Công suất khai thác</span>
                      <span className="chk-detail-value">{r.teuCapacity != null && r.teuCapacity !== '' ? fmtNum(r.teuCapacity) : ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tổng diện tích cảng (m²)</span>
                      <span className="chk-detail-value">{r.area != null && r.area !== '' ? `${fmtNum(r.area)} m²` : ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Diện tích kho (m²)</span>
                      <span className="chk-detail-value">{r.warehouseArea != null && r.warehouseArea !== '' ? `${fmtNum(r.warehouseArea)} m²` : ''}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Diện tích bãi (m²)</span>
                      <span className="chk-detail-value">{r.yardArea != null && r.yardArea !== '' ? `${fmtNum(r.yardArea)} m²` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Thông tin công bố mở, đưa vào sử dụng (đồng bộ chuẩn Cầu cảng - Pier) ── */}
                <div style={{ ...sectionBoxStyle, padding: announcementOpen ? sectionBoxStyle.padding : spaceMd }}>
                  <div
                    onClick={() => setAnnouncementOpen(!announcementOpen)}
                    style={{
                      ...sectionHeaderStyle,
                      marginBottom: announcementOpen ? spaceMd : 0,
                      paddingBottom: announcementOpen ? spaceSm : 0,
                      borderBottom: announcementOpen ? sectionHeaderStyle.borderBottom : 'none',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={sectionTitleStyle}>
                      <FileTextOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin công bố mở, đưa vào sử dụng</span>
                    </div>
                    {announcementOpen ? <DownOutlined style={{ color: actionPrimary }} /> : <RightOutlined style={{ color: actionPrimary }} />}
                  </div>
                  {announcementOpen && (
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Thời điểm công bố mở, đưa vào sử dụng</span>
                        <span className="chk-detail-value">{formatDateOnly(r.openingAnnouncementDate || r.announcementDecisionDate || r.announcementTime)}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Quyết định công bố/ Văn bản cho phép khai thác</span>
                        <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.openingDecision || r.announcementDecisionNumber || ''}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-col1-label">Văn bản thỏa thuận đầu tư xây dựng</span>
                        <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.investmentAgreementDoc || ''}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 4: Thông tin phê duyệt (Toggle chuẩn AGENTS.md & Cảng biển) ── */}
                <div style={{ ...sectionBoxStyle, padding: approvalOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                  <div
                    onClick={() => setApprovalOpen(!approvalOpen)}
                    style={{
                      ...sectionHeaderStyle,
                      marginBottom: approvalOpen ? 10 : 0,
                      paddingBottom: approvalOpen ? 8 : 0,
                      borderBottom: approvalOpen ? '1px solid #f1f5f9' : 'none',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={sectionTitleStyle}>
                      <AuditOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin phê duyệt</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {approvalOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {approvalOpen && (
                    <div className="chk-detail-grid">
                      {[
                        {
                          label: 'Trạng thái',
                          value: (() => {
                            const badge = trangThaiPheDuyetBadge(r.approvalStatus);
                            return badge.label ? <span style={badge.style}>{badge.label}</span> : '';
                          })(),
                          fullWidth: true,
                        },
                        {
                          label: 'Cán bộ cập nhật',
                          value: formatUserDisplayName(r.updatedBy, (r as any).updatedByName, userMap, r.createdBy, (r as any).createdByName),
                          isCol1: true,
                          bold: true,
                        },
                        {
                          label: 'Ngày cập nhật',
                          value: r.updatedAt ? dayjs(r.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '',
                          isCol1: false,
                        },
                      ].map((row, i) => (
                        <div
                          key={i}
                          className={`chk-detail-row${row.fullWidth ? ' chk-detail-row--full' : ''}`}
                        >
                          <span className={`chk-detail-label ${row.fullWidth ? 'sec-full-label' : (row.isCol1 ? 'sec-col1-label' : 'sec-col2-label')}`}>
                            {row.label}
                          </span>
                          <span className="chk-detail-value" style={row.bold ? { fontWeight: fontWeightBold } : undefined}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'location',
            label: `Thông tin vị trí (${parseGisCoordinates(r).length})`,
            children: (
              <div style={{ paddingTop: 3 }}>
                <div className="chk-detail-grid">
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col1-label">Loại đối tượng</span>
                    <span className="chk-detail-value">
                      {r.geometryType === 'POINT' ? 'Đối tượng điểm' : r.geometryType === 'LINE' ? 'Đối tượng đường' : r.geometryType === 'POLYGON' ? 'Đối tượng vùng' : ''}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col2-label">Biểu tượng</span>
                    <span className="chk-detail-value">
                      {(() => {
                        const symId = r.mapSymbolId || '';
                        const symName = symbolMap.get(symId) || symId || '';
                        const symImg = symbolImageMap.get(symId);
                        if (!symName && !symImg) return '';
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            {symImg ? <img src={symImg} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : null}
                            {symName}
                          </span>
                        );
                      })()}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col1-label">Hệ quy chiếu</span>
                    <span className="chk-detail-value">{COORD_SYS_LABELS[r.coordinateSystem || 0] || (r.coordinateSystem ? String(r.coordinateSystem) : '')}</span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col2-label">Quy tắc hiển thị</span>
                    <span className="chk-detail-value">
                      {(r.geometryType || r.coordinates || r.latitude != null || r.longitude != null) ? 'Độ, phút, giây (DMS)' : ''}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: spaceMd }}>
                  <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                    <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                      Tọa độ GPS ({parseGisCoordinates(r).length})
                    </span>
                    <Button
                      icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                      onClick={() => setGisModalOpen(true)}
                      style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Xem vị trí trên bản đồ
                    </Button>
                  </div>
                  {(() => {
                    const pts = parseGisCoordinates(r);
                    return (
                      <DetailTable
                        dataSource={pts.map((p) => ({ ...p }))}
                        emptyText="Chưa có tọa độ GPS nào"
                        showTotal={(total) => `Tổng cộng ${total}`}
                        scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                        columns={[
                          { title: 'STT', width: 50 },
                          { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                          { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                        ]}
                      />
                    );
                  })()}
                </div>
              </div>
            ),
          },
          {
            key: 'files',
            label: `File đính kèm (${detailFiles.length})`,
            children: (
              <div style={{ paddingTop: 6 }}>
                <InfrastructureAttachmentTab
                  attachments={detailFiles.map((f: any) => ({
                    ...f,
                    id: f.id || f.uid,
                    fileName: f.fileName || f.name,
                    fileSize: f.fileSize ?? f.size,
                    uploadedByName: (!isUuidString(f.uploadedByName) ? f.uploadedByName : '') || (f.uploadedBy ? userMap.get(f.uploadedBy) : '') || 'Cán bộ quản lý',
                    uploadedDate: f.uploadedDate || f.uploadedAt || f.createdAt,
                  }))}
                  readonly={true}
                  userMap={userMap}
                  onDownload={(id, name) => {
                    void downloadDryPortAttachment(r.id, id, name);
                  }}
                />
              </div>
            ),
          },
          {
            key: 'plan',
            label: 'Thông tin quy hoạch',
            children: (
              <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
                {/* Box: Thông tin quy hoạch (chuẩn toggle Vận hành & bảo trì) */}
                <div style={{ ...sectionBoxStyle, padding: planOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                  <div onClick={() => setPlanOpen(!planOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: planOpen ? 12 : 0, paddingBottom: planOpen ? 8 : 0, borderBottom: planOpen ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin quy hoạch</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {planOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {planOpen && (
                    <DetailTable
                      scrollY={160}
                      dataSource={(r as any)?.planList || []}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(rec: any) => rec?.id || rec?.planDecisionNo || rec?.planNo || 'row'}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const },
                        { title: 'Số quyết định quy hoạch', dataIndex: 'planDecisionNo', key: 'planNo', render: (v: string, rec: any) => v || rec?.decisionNo || rec?.planNo || '' },
                        { title: 'Ngày quyết định quy hoạch', dataIndex: 'planDecisionDate', key: 'planDate', width: 320, align: 'left' as const, render: (v: string, rec: any) => dayjs(v || rec?.decisionDate || rec?.planDate).isValid() ? dayjs(v || rec?.decisionDate || rec?.planDate).format('DD/MM/YYYY') : '' },
                      ]}
                    />
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'operation',
            label: 'Vận hành & bảo trì',
            children: (
              <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
                {/* ── Section Vận hành ── */}
                <div style={{ ...sectionBoxStyle, padding: operationOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                  <div onClick={() => setOperationOpen(!operationOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: operationOpen ? 12 : 0, paddingBottom: operationOpen ? 8 : 0, borderBottom: operationOpen ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin vận hành khai thác</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {operationOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {operationOpen && (
                    <DetailTable
                      scrollY={160}
                      dataSource={(r as any)?.operationPlanList || []}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(rec: any) => rec?.id || rec?.opPlanCode || rec?.planCode || 'row'}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const },
                        { title: 'Mã kế hoạch', dataIndex: 'opPlanCode', key: 'code', render: (v: string, rec: any) => v || rec?.planCode || (rec?.code ?? '') },
                        { title: 'Tên kế hoạch', dataIndex: 'opPlanName', key: 'name', render: (v: string, rec: any) => v || rec?.planName || (rec?.name ?? '') },
                        { title: 'Ngày bắt đầu', dataIndex: 'opStartDate', key: 'start', width: 150, align: 'left' as const, render: (v: string, rec: any) => dayjs(v || rec?.planStartDate || rec?.startDate).isValid() ? dayjs(v || rec?.planStartDate || rec?.startDate).format('DD/MM/YYYY') : '' },
                        { title: 'Ngày kết thúc', dataIndex: 'opEndDate', key: 'end', width: 150, align: 'left' as const, render: (v: string, rec: any) => dayjs(v || rec?.planEndDate || rec?.endDate).isValid() ? dayjs(v || rec?.planEndDate || rec?.endDate).format('DD/MM/YYYY') : '' },
                      ]}
                    />
                  )}
                </div>

                {/* ── Section Bảo trì ── */}
                <div style={{ ...sectionBoxStyle, padding: maintenanceOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                  <div onClick={() => setMaintenanceOpen(!maintenanceOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: maintenanceOpen ? 12 : 0, paddingBottom: maintenanceOpen ? 8 : 0, borderBottom: maintenanceOpen ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin bảo trì</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {maintenanceOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {maintenanceOpen && (
                    <DetailTable
                      scrollY={160}
                      dataSource={(r as any)?.maintenancePlanList || []}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(rec: any) => rec?.id || rec?.maintCode || rec?.planCode || 'row'}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const },
                        { title: 'Mã kế hoạch', dataIndex: 'maintCode', key: 'code', render: (v: string, rec: any) => v || rec?.planCode || (rec?.code ?? '') },
                        { title: 'Tên kế hoạch', dataIndex: 'maintName', key: 'name', render: (v: string, rec: any) => v || rec?.planName || (rec?.name ?? '') },
                        { title: 'Thời gian bắt đầu', dataIndex: 'maintStart', key: 'start', width: 150, align: 'left' as const, render: (v: string, rec: any) => dayjs(v || rec?.startTime || rec?.startDate).isValid() ? dayjs(v || rec?.startTime || rec?.startDate).format('DD/MM/YYYY') : '' },
                        { title: 'Thời gian kết thúc', dataIndex: 'maintEnd', key: 'end', width: 150, align: 'left' as const, render: (v: string, rec: any) => dayjs(v || rec?.endTime || rec?.endDate).isValid() ? dayjs(v || rec?.endTime || rec?.endDate).format('DD/MM/YYYY') : '' },
                      ]}
                    />
                  )}
                </div>

                {/* ── Section Sự cố ── */}
                <div style={{ ...sectionBoxStyle, padding: incidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                  <div onClick={() => setIncidentOpen(!incidentOpen)} style={{ ...sectionHeaderStyle, cursor: 'pointer', userSelect: 'none', marginBottom: incidentOpen ? 12 : 0, paddingBottom: incidentOpen ? 8 : 0, borderBottom: incidentOpen ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin sự cố</span>
                    </div>
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {incidentOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {incidentOpen && (
                    <DetailTable
                      scrollY={160}
                      dataSource={(r as any)?.incidentList || []}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(rec: any) => rec?.id || rec?.incidentCode || 'row'}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const },
                        { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec?.code || '' },
                        { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec?.type || '' },
                        { title: 'Địa điểm', dataIndex: 'incidentLocation', key: 'location', render: (v: string, rec: any) => v || rec?.location || '' },
                        { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'left' as const, render: (v: string, rec: any) => dayjs(v || rec?.time).isValid() ? dayjs(v || rec?.time).format('DD/MM/YYYY') : '' },
                      ]}
                    />
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* GIS Location Selector Modal — xem vị trí trên bản đồ chuyên dụng */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              Xem vị trí trên bản đồ chuyên dụng
            </span>
          </div>
        }
        open={gisModalOpen}
        onCancel={() => setGisModalOpen(false)}
        destroyOnClose
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={[
          <Button key="close" type="primary" onClick={() => setGisModalOpen(false)} style={{ ...primaryButtonStyle, height: 36 }}>
            Đóng
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            defaultGeometryType="POINT"
            disabled
            height={520}
            value={(() => {
              const pts = parseGisCoordinates(r);
              if (pts.length > 0) {
                const rawWkt = (r as any).coordinates || '';
                let geom: 'POINT' | 'LINE' | 'POLYGON' = 'POINT';
                let wkt = '';
                if (rawWkt.startsWith('LINESTRING')) {
                  geom = 'LINE';
                  wkt = `LINESTRING(${pts.map(p => `${p.lng} ${p.lat}`).join(', ')})`;
                } else if (rawWkt.startsWith('POLYGON')) {
                  geom = 'POLYGON';
                  wkt = `POLYGON((${pts.map(p => `${p.lng} ${p.lat}`).join(', ')}))`;
                } else if (pts.length > 1) {
                  wkt = `MULTIPOINT(${pts.map(p => `(${p.lng} ${p.lat})`).join(',')})`;
                } else {
                  wkt = `POINT(${pts[0].lng} ${pts[0].lat})`;
                }
                return { geometryType: geom, coordinates: wkt };
              }
              return undefined;
            })()}
          />
        </div>
      </Modal>
    </div>
  );
}
