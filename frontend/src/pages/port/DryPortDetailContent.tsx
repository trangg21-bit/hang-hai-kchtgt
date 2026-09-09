import { useState, useMemo } from 'react';
import { Tabs, Button, Modal } from 'antd';
import {
  FileOutlined, EnvironmentOutlined,
  BankOutlined, SlidersOutlined, FileTextOutlined, AuditOutlined,
  DownOutlined, RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { detailLabelStyle } from '../../components/detail-drawer/detailSkin';
import { colors } from '../../themetokenchk';
import {
  textTertiary, surfaceCard,
  fontSizeSm, fontSizeLg, fontWeightBold, spaceSm, spaceMd, spaceFormField,
  statusOperational, statusAttention, statusCritical, actionPrimary, statusBadgeStyle,
  outlineButtonStyle, primaryButtonStyle,
  formatUserDisplayName, isUuidString,
} from '../../themetokenchk';
import type { DryPort } from '../../types/port';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { parseWktToCoordinates } from '../../utils/gisGeometry';
import toast from '../../components/ToastNotification';

const fontSizeMd = 13.5;

export interface DryPortDetailContentProps {
  selectedRecord: DryPort;
  organizations: any[];
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  userMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number | null | undefined) => { d: number | null; m: number | null; s: number | null };
  provinceName: (provinceId: number | null | undefined) => string;
  approvalStyleMap: Record<string, { color: string; label: string }>;
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

// Bảng tham chiếu (Thông tin quy hoạch / Vận hành khai thác / Bảo trì / Sự cố) — DetailTable chuẩn VTS CHK
const TAB_PAGE_SIZE = 10;
function DryPortRefTable({ title, emptyText, columns, dataSource = [] }: { title: string; emptyText: string; columns: Array<{ title: string; dataIndex?: string; width?: number }>; dataSource?: any[] }) {
  return (
    <div style={{ paddingTop: 3 }}>
      <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{title}</span>
      </div>
      <DetailTable
        dataSource={(Array.isArray(dataSource) ? dataSource : []).map((row, idx) => ({ ...row, key: row?.key ?? idx }))}
        emptyText={emptyText}
        pageSize={TAB_PAGE_SIZE}
        showTotal={(total) => `Tổng cộng ${total}`}
        columns={[
          { title: 'STT', width: 50 },
          ...columns.map((c) => ({ title: c.title, dataIndex: c.dataIndex, width: c.width })),
        ]}
      />
    </div>
  );
}

export default function DryPortDetailContent({
  selectedRecord: r,
  organizations,
  symbolMap,
  symbolImageMap,
  userMap,
  detailFiles,
  ddToDms,
  provinceName,
  approvalStyleMap,
}: DryPortDetailContentProps) {
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  // Toggle cụm 'Thông tin công bố' và 'Thông tin phê duyệt'
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(true);

  // Bản đồ orgUnitId → tên đơn vị
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    (Array.isArray(organizations) ? organizations : []).forEach((o: any) => { if (o?.id) map.set(o.id, o.name || o.id); });
    return map;
  }, [organizations]);

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
          row-gap: 6px !important;
          padding: 4px 0 !important;
        }

        .dry-port-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: baseline !important;
          min-height: 28px !important;
          line-height: 1.5 !important;
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
                        {r.dryPortCode ? <span style={statusBadgeStyle(actionPrimary)}>{r.dryPortCode}</span> : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tên cảng cạn</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
                        {r.dryPortName || '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Đơn vị quản lý</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const name = orgMap.get(r.orgUnitId || '') || r.orgUnitId || '—';
                          return <span style={{ fontWeight: fontWeightBold }}>{name}</span>;
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Đơn vị khai thác</span>
                      <span className="chk-detail-value">{r.operatingUnit || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Khu vực</span>
                      <span className="chk-detail-value">{r.region || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Địa điểm (Tỉnh/Thành Phố)</span>
                      <span className="chk-detail-value">{provinceName(r.provinceId) || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Hành lang vận tải</span>
                      <span className="chk-detail-value">{r.transportCorridor || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Phương thức kết nối giao thông</span>
                      <span className="chk-detail-value">{r.connectionMode || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Tình trạng</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const opMap: Record<string, { color: string; label: string }> = {
                            OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/Vận hành' },
                            NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/Vận hành' },
                            SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/Vận hành' },
                          };
                          const b = (r as any).operationalStatus && opMap[(r as any).operationalStatus]
                            ? opMap[(r as any).operationalStatus]
                            : (r.portStatus === 1 ? opMap.OPERATIONAL : opMap.NOT_YET_OPERATIONAL);
                          return <span style={statusBadgeStyle(b.color)}>{b.label}</span>;
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Địa điểm chi tiết</span>
                      <span className="chk-detail-value">{r.detailedLocation || '—'}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Ghi chú</span>
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {r.remarks || '—'}
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
                      <span className="chk-detail-value">{r.teuCapacity ? `${r.teuCapacity.toLocaleString('vi-VN')} TEU/năm` : '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tổng diện tích cảng (m²)</span>
                      <span className="chk-detail-value">{r.area ? `${r.area.toLocaleString('vi-VN')} m²` : '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Diện tích kho (m²)</span>
                      <span className="chk-detail-value">{r.warehouseArea ? `${r.warehouseArea.toLocaleString('vi-VN')} m²` : '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Diện tích bãi (m²)</span>
                      <span className="chk-detail-value">{r.yardArea ? `${r.yardArea.toLocaleString('vi-VN')} m²` : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Thông tin công bố mở, đưa vào sử dụng ── */}
                <div style={{ ...sectionBoxStyle, padding: announcementOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                  <div
                    onClick={() => setAnnouncementOpen(!announcementOpen)}
                    style={{
                      ...sectionHeaderStyle,
                      marginBottom: announcementOpen ? 10 : 0,
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
                    <span style={{ color: actionPrimary, fontSize: 12 }}>
                      {announcementOpen ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  </div>
                  {announcementOpen && (
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Quyết định công bố số</span>
                        <span className="chk-detail-value">{r.announcementDecisionNumber || '—'}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Ngày ra quyết định công bố</span>
                        <span className="chk-detail-value">{r.announcementDecisionDate ? dayjs(r.announcementDecisionDate).format('DD/MM/YYYY') : '—'}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Đơn vị ra quyết định công bố</span>
                        <span className="chk-detail-value">{r.announcementOrg || '—'}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Thời điểm công bố mở</span>
                        <span className="chk-detail-value">{r.announcementTime ? dayjs(r.announcementTime).format('DD/MM/YYYY') : '—'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 4: Thông tin phê duyệt (Toggle chuẩn AGENTS.md) ── */}
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
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Trạng thái phê duyệt</span>
                        <span className="chk-detail-value">
                          {r.approvalStatus && approvalStyleMap[r.approvalStatus] ? (
                            <span style={statusBadgeStyle(approvalStyleMap[r.approvalStatus].color)}>
                              {approvalStyleMap[r.approvalStatus].label}
                            </span>
                          ) : (r.approvalStatus || '—')}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ cập nhật</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{formatUserDisplayName(r.updatedBy, (r as any).updatedByName, userMap, r.createdBy, (r as any).createdByName)}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày cập nhật</span>
                        <span className="chk-detail-value">{r.updatedAt ? dayjs(r.updatedAt).format('DD/MM/YYYY HH:mm') : '—'}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Người tạo</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{formatUserDisplayName(r.createdBy, (r as any).createdByName, userMap)}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày tạo</span>
                        <span className="chk-detail-value">{r.createdAt ? dayjs(r.createdAt).format('DD/MM/YYYY HH:mm') : '—'}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ gửi phê duyệt</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{formatUserDisplayName((r as any).submittedForApprovalBy, (r as any).submittedForApprovalByName, userMap)}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày gửi phê duyệt</span>
                        <span className="chk-detail-value">{(r as any).submittedForApprovalAt ? dayjs((r as any).submittedForApprovalAt).format('DD/MM/YYYY HH:mm') : '—'}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ duyệt Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{formatUserDisplayName((r as any).portAuthorityApprovedBy, (r as any).portAuthorityApprovedByName, userMap)}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày duyệt Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">{(r as any).portAuthorityApprovedAt ? dayjs((r as any).portAuthorityApprovedAt).format('DD/MM/YYYY HH:mm') : '—'}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ duyệt cấp Cục</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{formatUserDisplayName((r as any).departmentApprovedBy, (r as any).departmentApprovedByName, userMap)}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày duyệt cấp Cục</span>
                        <span className="chk-detail-value">{(r as any).departmentApprovedAt ? dayjs((r as any).departmentApprovedAt).format('DD/MM/YYYY HH:mm') : '—'}</span>
                      </div>
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
                      {r.geometryType === 'POINT' ? 'Đối tượng điểm' : r.geometryType === 'LINE' ? 'Đối tượng đường' : r.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col2-label">Biểu tượng</span>
                    <span className="chk-detail-value">
                      {(() => {
                        const symId = r.mapSymbolId || '';
                        const symName = symbolMap.get(symId) || symId || '—';
                        const symImg = symbolImageMap.get(symId);
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
                    <span className="chk-detail-value">{COORD_SYS_LABELS[r.coordinateSystem || 0] || r.coordinateSystem || '—'}</span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col2-label">Quy tắc hiển thị</span>
                    <span className="chk-detail-value">
                      {(r.geometryType || r.coordinates || r.latitude != null || r.longitude != null) ? 'Độ, phút, giây (DMS)' : '—'}
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
                  onDownload={(_id, name) => {
                    toast.info(`Đang tải xuống tệp: ${name}`);
                  }}
                />
              </div>
            ),
          },
          {
            key: 'plan',
            label: 'Thông tin quy hoạch',
            children: (
              <DryPortRefTable
                title="Danh sách thông tin quy hoạch"
                emptyText="Chưa có thông tin quy hoạch"
                columns={[
                  { title: 'Số quyết định quy hoạch', dataIndex: 'planDecisionNo', width: 200 },
                  { title: 'Ngày quyết định quy hoạch', dataIndex: 'planDecisionDate', width: 180 },
                ]}
              />
            ),
          },
          {
            key: 'operation',
            label: 'Vận hành & bảo trì',
            children: (
              <div style={{ paddingTop: 3, overflowY: 'auto', maxHeight: 'calc(100vh - 290px)' }}>
                <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setOperationOpen(!operationOpen)}>
                  <span style={{ color: operationOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{operationOpen ? '▼' : '▶'} Thông tin vận hành khai thác</span>
                </button>
                {operationOpen && (
                  <div>
                    <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Danh sách vận hành khai thác</span>
                    <DetailTable
                      dataSource={(Array.isArray((r as any)?.operationPlanList) ? (r as any).operationPlanList : [])}
                      emptyText="Chưa có dữ liệu"
                      showTotal={(total) => `Tổng cộng ${total}`}
                      rowKey={(rec: any, idx?: number) => rec?.id || rec?.opPlanCode || String(idx)}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const },
                        { title: 'Mã kế hoạch', dataIndex: 'opPlanCode', key: 'opPlanCode', render: (v: string, rec: any) => v || rec.code || '—' },
                        { title: 'Tên kế hoạch', dataIndex: 'opPlanName', key: 'opPlanName', render: (v: string, rec: any) => v || rec.name || '—' },
                        { title: 'Ngày bắt đầu', dataIndex: 'opStartDate', key: 'opStartDate', width: 150, align: 'left' as const, render: (v: string, rec: any) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : (rec.startDate ? dayjs(rec.startDate).format('DD/MM/YYYY HH:mm') : '—') },
                        { title: 'Ngày kết thúc', dataIndex: 'opEndDate', key: 'opEndDate', width: 150, align: 'left' as const, render: (v: string, rec: any) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : (rec.endDate ? dayjs(rec.endDate).format('DD/MM/YYYY HH:mm') : '—') },
                      ]}
                    />
                  </div>
                )}
                <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setMaintenanceOpen(!maintenanceOpen)}>
                  <span style={{ color: maintenanceOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{maintenanceOpen ? '▼' : '▶'} Thông tin bảo trì</span>
                </button>
                {maintenanceOpen && (
                  <div>
                    <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Danh sách thông tin bảo trì</span>
                    <DetailTable
                      dataSource={(Array.isArray((r as any)?.maintenancePlanList) ? (r as any).maintenancePlanList : [])}
                      emptyText="Chưa có dữ liệu"
                      showTotal={(total) => `Tổng cộng ${total}`}
                      rowKey={(rec: any, idx?: number) => rec?.id || rec?.maintCode || String(idx)}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const },
                        { title: 'Mã kế hoạch', dataIndex: 'maintCode', key: 'maintCode', render: (v: string, rec: any) => v || rec.code || '—' },
                        { title: 'Tên kế hoạch', dataIndex: 'maintName', key: 'maintName', render: (v: string, rec: any) => v || rec.name || '—' },
                        { title: 'Thời gian bắt đầu', dataIndex: 'maintStart', key: 'maintStart', width: 150, align: 'left' as const, render: (v: string, rec: any) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : (rec.startTime || rec.start || '—') },
                        { title: 'Thời gian kết thúc', dataIndex: 'maintEnd', key: 'maintEnd', width: 150, align: 'left' as const, render: (v: string, rec: any) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : (rec.endTime || rec.end || '—') },
                      ]}
                    />
                  </div>
                )}
                <button type="button" style={{ cursor: 'pointer', marginTop: 12, marginBottom: 12, border: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', display: 'block' }} onClick={() => setIncidentOpen(!incidentOpen)}>
                  <span style={{ color: incidentOpen ? actionPrimary : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{incidentOpen ? '▼' : '▶'} Thông tin sự cố</span>
                </button>
                {incidentOpen && (
                  <div>
                    <span style={{ ...detailLabelStyle, marginBottom: spaceSm, display: 'inline-block' }}>Danh sách thông tin sự cố</span>
                    <DetailTable
                      dataSource={(Array.isArray((r as any)?.incidentList) ? (r as any).incidentList : [])}
                      emptyText="Chưa có dữ liệu"
                      showTotal={(total) => `Tổng cộng ${total}`}
                      rowKey={(rec: any, idx?: number) => rec?.id || rec?.incidentCode || String(idx)}
                      columns={[
                        { title: 'STT', width: 50, align: 'center' as const },
                        { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'incidentCode', render: (v: string, rec: any) => v || rec.code || '—' },
                        { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'incidentType', render: (v: string, rec: any) => v || rec.type || '—' },
                        { title: 'Địa điểm', dataIndex: 'incidentLocation', key: 'incidentLocation', render: (v: string) => v || '—' },
                        { title: 'Thời gian', dataIndex: 'incidentTime', key: 'incidentTime', width: 150, align: 'left' as const, render: (v: string, rec: any) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : (rec.time ? dayjs(rec.time).format('DD/MM/YYYY HH:mm') : '—') },
                      ]}
                    />
                  </div>
                )}
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
