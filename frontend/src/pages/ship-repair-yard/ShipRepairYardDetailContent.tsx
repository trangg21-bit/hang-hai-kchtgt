import React, { useState } from 'react';
import { Tabs, Button, Modal } from 'antd';
import {
  FileOutlined, EnvironmentOutlined,
  BankOutlined, SlidersOutlined, AuditOutlined,
  DownOutlined, RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import toast from '../../components/ToastNotification';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import {
  textTertiary, surfaceCard,
  fontSizeSm, fontSizeLg, fontWeightBold,
  spaceSm, spaceMd, spaceFormField, actionPrimary,
  statusOperational, statusAttention, statusCritical,
  statusBadgeStyle, outlineButtonStyle, primaryButtonStyle,
  formatUserDisplayName, isUuidString,
} from '../../themetokenchk';
import type { ShipRepairYard } from '../../types/port';
import { VIETNAM_PROVINCES } from '../../types/common';
import { parseWktToCoordinates } from '../../utils/gisGeometry';

const fontSizeMd = 13.5;

export interface ShipRepairYardDetailContentProps {
  selectedRecord: ShipRepairYard;
  orgMap: Map<string, string>;
  organizations?: Array<{ id: string; name: string; parentId?: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  portOptions: Array<{ value: string; label: string }>;
  pierOptions?: Array<{ value: string; label: string }>;
  userMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  operationPlanList?: any[];
  maintenancePlanList?: any[];
  incidentList?: any[];
}

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

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

const parseGisCoordinates = (record: any): Array<{ lat: number; lng: number }> => {
  const out = parseWktToCoordinates(record?.coordinates)
    .map(({ latitude, longitude }) => ({ lat: latitude, lng: longitude }));
  if (out.length === 0 && record?.latitude != null && record?.longitude != null) {
    out.push({ lat: Number(record.latitude), lng: Number(record.longitude) });
  }
  return out;
};

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—');
const fmtNumber = (v: number | null | undefined): string => (v != null ? Number(v).toLocaleString('vi-VN') : '—');

export default function ShipRepairYardDetailContent({
  selectedRecord: r,
  orgMap,
  symbolMap,
  symbolImageMap,
  portOptions,
  pierOptions = [],
  userMap,
  detailFiles,
  ddToDms,
  approvalStyleMap,
  operationPlanList = [],
  maintenancePlanList = [],
  incidentList = [],
}: ShipRepairYardDetailContentProps) {
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);
  const [gisModalOpen, setGisModalOpen] = useState(false);

  return (
    <div className="ship-repair-yard-detail-content-wrapper">
      <style>{`
        .ship-repair-yard-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .ship-repair-yard-detail-content-wrapper,
        .ship-repair-yard-detail-content-wrapper .chk-detail-label,
        .ship-repair-yard-detail-content-wrapper .chk-detail-value,
        .ship-repair-yard-detail-content-wrapper .ant-table,
        .ship-repair-yard-detail-content-wrapper .ant-table-cell,
        .ship-repair-yard-detail-content-wrapper .ant-table-thead > tr > th,
        .ship-repair-yard-detail-content-wrapper .ant-tabs-tab,
        .ship-repair-yard-detail-content-wrapper .ant-btn,
        .ship-repair-yard-detail-content-wrapper .ant-select,
        .ship-repair-yard-detail-content-wrapper .ant-select-selection-item,
        .ship-repair-yard-detail-content-wrapper .ant-select-item {
          font-size: 13.5px !important;
        }

        .ship-repair-yard-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 6px !important;
          padding: 4px 0 !important;
        }

        .ship-repair-yard-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: baseline !important;
          min-height: 28px !important;
          line-height: 1.5 !important;
        }

        .ship-repair-yard-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .ship-repair-yard-drawer-scope .ship-repair-yard-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .ship-repair-yard-detail-content-wrapper .chk-detail-label {
          width: 235px !important;
          min-width: 235px !important;
          max-width: 235px !important;
          flex-shrink: 0 !important;
          color: ${colors.sidebarBg} !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          text-align: left !important;
          line-height: 1.5 !important;
        }

        .ship-repair-yard-drawer-scope .ship-repair-yard-detail-content-wrapper .chk-detail-row .sec-col1-label,
        .ship-repair-yard-detail-content-wrapper .sec-col1-label {
          width: 235px !important;
          min-width: 235px !important;
          max-width: 235px !important;
          flex-shrink: 0 !important;
        }

        .ship-repair-yard-drawer-scope .ship-repair-yard-detail-content-wrapper .chk-detail-row .sec-col2-label,
        .ship-repair-yard-detail-content-wrapper .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }

        .ship-repair-yard-drawer-scope .ship-repair-yard-detail-content-wrapper .chk-detail-row .sec-full-label,
        .ship-repair-yard-detail-content-wrapper .sec-full-label {
          width: 235px !important;
          min-width: 235px !important;
          max-width: 235px !important;
          flex-shrink: 0 !important;
        }

        .ship-repair-yard-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .ship-repair-yard-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .ship-repair-yard-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .ship-repair-yard-detail-content-wrapper .chk-detail-row--full {
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
                      <span className="chk-detail-label sec-col1-label">Mã cơ sở sửa chữa, đóng tàu</span>
                      <span className="chk-detail-value">
                        {r.shipRepairYardCode ? <span style={statusBadgeStyle(actionPrimary)}>{r.shipRepairYardCode}</span> : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Tên cơ sở sửa chữa, đóng tàu</span>
                      <span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
                        {r.shipRepairYardName || '—'}
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
                      <span className="chk-detail-label sec-col2-label">Thuộc cảng biển</span>
                      <span className="chk-detail-value">
                        {portOptions.find(o => o.value === r.portId)?.label || r.portId || '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Thuộc cầu cảng</span>
                      <span className="chk-detail-value">
                        {pierOptions.find(o => o.value === r.pierId)?.label || r.pierName || r.pierId || '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Địa điểm (Tỉnh/Thành phố)</span>
                      <span className="chk-detail-value">
                        {r.provinceId ? VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '—' : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Tình trạng</span>
                      <span className="chk-detail-value">
                        {(() => {
                          const s = r.operationalStatus;
                          const m: Record<string, { color: string; label: string }> = {
                            OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/Vận hành' },
                            NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/Vận hành' },
                            SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/Vận hành' },
                          };
                          const b = s && m[s];
                          return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : '—';
                        })()}
                      </span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Địa điểm chi tiết</span>
                      <span className="chk-detail-value">{r.detailedLocation || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Thông tin đặc thù & Năng lực kỹ thuật ── */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin đặc thù & Năng lực kỹ thuật</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Công năng sử dụng</span>
                      <span className="chk-detail-value">{r.usageFunction || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Diện tích nhà xưởng, kho bãi (m²)</span>
                      <span className="chk-detail-value">{fmtNumber(r.workshopArea)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Loại tàu đóng mới, sửa chữa</span>
                      <span className="chk-detail-value">{r.vesselType || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Cỡ tàu</span>
                      <span className="chk-detail-value">{r.vesselDwt || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Loại hình doanh nghiệp</span>
                      <span className="chk-detail-value">{r.businessType || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col2-label">Hoạt động</span>
                      <span className="chk-detail-value">{r.activity || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label sec-col1-label">Số lượng triền đà</span>
                      <span className="chk-detail-value">{fmtNumber(r.slipwayCount)}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label sec-full-label">Ghi chú</span>
                      <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {r.remarks || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Thông tin phê duyệt (Toggle chuẩn AGENTS.md) ── */}
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
                          ) : '—'}
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
                        <span className="chk-detail-value">{fmtDateTime(r.updatedAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ gửi phê duyệt</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{formatUserDisplayName(r.submittedForApprovalBy, (r as any).submittedForApprovalByName, userMap)}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày gửi phê duyệt</span>
                        <span className="chk-detail-value">{fmtDateTime(r.submittedForApprovalAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Cán bộ duyệt Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{formatUserDisplayName(r.portAuthorityApprovedBy, (r as any).portAuthorityApprovedByName, userMap)}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Ngày duyệt Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">{fmtDateTime(r.portAuthorityApprovedAt)}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-full-label">Nội dung duyệt Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">{r.portAuthorityApprovalContent || '—'}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col1-label">Cán bộ duyệt cấp Cục</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{formatUserDisplayName(r.departmentApprovedBy, (r as any).departmentApprovedByName, userMap)}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label sec-col2-label">Ngày duyệt cấp Cục</span>
                        <span className="chk-detail-value">{fmtDateTime(r.departmentApprovedAt)}</span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label sec-full-label">Nội dung duyệt cấp Cục</span>
                        <span className="chk-detail-value">{r.departmentApprovalContent || '—'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'gis',
            label: `Thông tin vị trí (${parseGisCoordinates(r).length})`,
            children: (
              <div style={{ paddingTop: 3, overflowY: 'auto', maxHeight: 'calc(100vh - 290px)' }}>
                <div className="chk-detail-grid">
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col1-label">Loại đối tượng</span>
                    <span className="chk-detail-value">
                      {(() => {
                        const gt = (r as any).geometryType || '';
                        const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' };
                        return m[gt] || gt || '—';
                      })()}
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
                    <span className="chk-detail-value">{r.coordinateSystem === 1 ? 'WGS-84' : r.coordinateSystem === 2 ? 'VN-2000' : r.coordinateSystem || '—'}</span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col2-label">Quy tắc hiển thị</span>
                    <span className="chk-detail-value">
                      {((r as any).geometryType || (r as any).coordinates || (r as any).latitude != null || (r as any).longitude != null) ? 'Độ, phút, giây (DMS)' : '—'}
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
            key: 'operationMaintenance',
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
                      dataSource={operationPlanList}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(rec: any) => rec.id || rec.planCode || rec.code}
                      columns={[
                        { title: 'STT', width: 50 },
                        { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '—' },
                        { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '—' },
                        { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.startTime || rec.start || null) },
                        { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.endTime || rec.end || null) },
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
                      dataSource={maintenancePlanList}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(rec: any) => rec.id || rec.planCode || rec.code}
                      columns={[
                        { title: 'STT', width: 50 },
                        { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '—' },
                        { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '—' },
                        { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.start || rec.startDate || null) },
                        { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.end || rec.endDate || null) },
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
                      dataSource={incidentList}
                      emptyText="Chưa có dữ liệu"
                      rowKey={(rec: any) => rec.id || rec.incidentCode || rec.code}
                      columns={[
                        { title: 'STT', width: 50 },
                        { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '—' },
                        { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec.type || '—' },
                        { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || '—' },
                        { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v: string, rec: any) => fmtDateTime(v || rec.time || null) },
                      ]}
                    />
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* GIS Location Selector Modal */}
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
