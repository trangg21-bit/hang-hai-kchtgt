import React, { useState, useMemo } from 'react';
import { Tabs } from 'antd';
import {
  BankOutlined, SlidersOutlined, AuditOutlined,
  DownOutlined, RightOutlined, RocketOutlined, PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Berth } from '../../types/port';
import type {
  PortTerminalAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import { fmtNum } from '../../utils/numFmt';
import toast from '../../components/ToastNotification';
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors, actionPrimary, textTertiary, surfaceCard,
  fontSizeMd, fontWeightBold,
  statusBadgeStyle, statusOperational, statusAttention, statusCritical, statusDraft,
} from '../../themetokenchk';

export interface PortTerminalAssetDetailContentProps {
  selectedRecord: PortTerminalAsset;
  orgName: Map<string, string>;
  berthMap: Map<string, Berth>;
  exploitationRows: AssetExploitationResponse[];
  increaseRows: AssetIncreaseResponse[];
  decreaseRows: AssetDecreaseResponse[];
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

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  CHO_PHE_DUYET: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp cục' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
};

const fmtDateTime = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—');
const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '—');

const conditionBadge = (value?: string) => {
  if (!value) return '—';
  const color = value === 'Tốt' ? statusOperational : value === 'Không sử dụng được' ? statusCritical : statusAttention;
  return <span style={statusBadgeStyle(color)}>{value}</span>;
};

const usageBadge = (value?: string) => {
  if (!value) return '—';
  const color = value === 'Đang sử dụng' ? statusOperational : value === 'Tạm dừng sử dụng' ? statusCritical : statusDraft;
  return <span style={statusBadgeStyle(color)}>{value}</span>;
};

const parseStoredDetails = (value?: string): Record<string, unknown> => {
  if (!value) return {};
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return { notes: value }; }
};

export default function PortTerminalAssetDetailContent({
  selectedRecord: r,
  orgName,
  berthMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: PortTerminalAssetDetailContentProps) {
  const [approvalOpen, setApprovalOpen] = useState(true);

  const approvalInfo = APPROVAL_MAP[r.approvalStatus || ''] || APPROVAL_MAP[r.approvalStatus?.toUpperCase() || ''] || {
    color: statusDraft,
    label: r.approvalStatus || '—',
  };

  const combinedAdjustments = [
    ...increaseRows.map(row => ({ ...row, changeType: 'Tăng nguyên giá', icon: <PlusCircleOutlined style={{ color: statusOperational }} /> })),
    ...decreaseRows.map(row => ({ ...row, changeType: 'Giảm nguyên giá', icon: <MinusCircleOutlined style={{ color: statusCritical }} /> })),
  ];

  const detailAttachments: InfrastructureAttachmentItem[] = useMemo(() => {
    if (!r.attachmentName) return [];
    return r.attachmentName.split(',').map((name, i) => ({
      id: `detail-att-${i}`,
      fileName: name.trim(),
      fileSize: 1024 * 1024,
      uploadedByName: r.updatedByName || r.submittedByName || 'Cán bộ quản lý',
      uploadedDate: r.updatedAt ? dayjs(r.updatedAt).toISOString() : dayjs().toISOString(),
    }));
  }, [r.attachmentName, r.updatedByName, r.submittedByName, r.updatedAt]);

  return (
    <div className="berth-detail-content-wrapper">
      <style>{`
        .berth-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .berth-detail-content-wrapper,
        .berth-detail-content-wrapper .chk-detail-label,
        .berth-detail-content-wrapper .chk-detail-value,
        .berth-detail-content-wrapper .ant-table,
        .berth-detail-content-wrapper .ant-table-cell,
        .berth-detail-content-wrapper .ant-tabs-tab {
          font-size: 13.5px !important;
        }

        .berth-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .berth-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .berth-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        .berth-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .berth-drawer-scope .berth-detail-content-wrapper .chk-detail-row .chk-detail-label,
        .berth-detail-content-wrapper .chk-detail-label {
          width: 220px !important;
          min-width: 220px !important;
          max-width: 220px !important;
          flex-shrink: 0 !important;
          color: ${colors.sidebarBg} !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          text-align: left !important;
          line-height: 1.5 !important;
        }

        .berth-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .berth-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .berth-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .berth-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
        }
      `}</style>

      <Tabs
        defaultActiveKey="general"
        tabBarStyle={{
          marginBottom: 0,
          paddingTop: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          background: surfaceCard,
        }}
        items={[
          {
            key: 'general',
            label: 'Thông tin chung',
            children: (
              <div style={{ paddingTop: 6, paddingRight: 4, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                {/* Section 1: Thông tin cơ bản & Quản lý vận hành */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <BankOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin cơ bản & Quản lý vận hành</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Mã tài sản</span>
                      <span className="chk-detail-value">
                        {r.assetCode ? <span style={statusBadgeStyle(actionPrimary)}>{r.assetCode}</span> : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Tên tài sản</span>
                      <span className="chk-detail-value">
                        <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{r.assetName || '—'}</span>
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Cơ quan quản lý cấp trên</span>
                      <span className="chk-detail-value">{orgName.get(r.parentOrgUnitId || '') || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị quản lý</span>
                      <span className="chk-detail-value">
                        <span style={{ fontWeight: fontWeightBold }}>{orgName.get(r.orgUnitId || '') || '—'}</span>
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị sử dụng</span>
                      <span className="chk-detail-value">
                        <span style={{ fontWeight: fontWeightBold }}>{orgName.get(r.usingOrgUnitId || '') || '—'}</span>
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Mã bến cảng</span>
                      <span className="chk-detail-value">{berthMap.get(r.berthId || '')?.berthCode || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Tên bến cảng</span>
                      <span className="chk-detail-value">{berthMap.get(r.berthId || '')?.berthName || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Loại tài sản</span>
                      <span className="chk-detail-value">Tài sản bến cảng</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Barcode</span>
                      <span className="chk-detail-value">{r.barcode || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Tình trạng tài sản</span>
                      <span className="chk-detail-value">{conditionBadge(r.assetCondition)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Hiện trạng sử dụng</span>
                      <span className="chk-detail-value">{usageBadge(r.usageStatus)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Nhóm tài sản</span>
                      <span className="chk-detail-value">{r.assetGroup || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Phân nhóm tài sản</span>
                      <span className="chk-detail-value">{r.assetSubgroup || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Nguồn gốc</span>
                      <span className="chk-detail-value">{r.origin || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số lượng</span>
                      <span className="chk-detail-value">
                        {r.quantity != null ? `${fmtNum(r.quantity)} ${r.quantityUnit || ''}`.trim() : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị tính</span>
                      <span className="chk-detail-value">{r.quantityUnit || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Model</span>
                      <span className="chk-detail-value">{r.model || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Serial</span>
                      <span className="chk-detail-value">{r.serialNumber || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Xuất xứ</span>
                      <span className="chk-detail-value">{r.countryOfOrigin || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Hãng sản xuất</span>
                      <span className="chk-detail-value">{r.manufacturer || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Năm xây dựng</span>
                      <span className="chk-detail-value">{r.constructionYear || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Ngày sử dụng tài sản</span>
                      <span className="chk-detail-value">{fmtDate(r.useDate)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Diện tích đất, sàn (m²)</span>
                      <span className="chk-detail-value">{r.landArea != null ? fmtNum(r.landArea) : '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Diện tích sàn sử dụng (m²)</span>
                      <span className="chk-detail-value">{r.floorArea != null ? fmtNum(r.floorArea) : '—'}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label">Vị trí tài sản</span>
                      <span className="chk-detail-value">{r.assetLocation || '—'}</span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label">Địa chỉ</span>
                      <span className="chk-detail-value">{r.address || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Thông tin giá trị & Khấu hao tài sản */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <SlidersOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin giá trị & Khấu hao tài sản</span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Ngày kê khai tài sản</span>
                      <span className="chk-detail-value">{fmtDate(r.declarationDate)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Nguyên giá (VNĐ)</span>
                      <span className="chk-detail-value">
                        {r.originalValue != null ? `${fmtNum(r.originalValue)} VNĐ` : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Tỷ lệ hao mòn/Khấu hao (%)</span>
                      <span className="chk-detail-value">{r.depreciationRate != null ? `${r.depreciationRate}%` : '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Giá trị còn lại</span>
                      <span className="chk-detail-value">
                        {r.remainingValue != null ? `${fmtNum(r.remainingValue)} VNĐ` : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị tính giá trị</span>
                      <span className="chk-detail-value">VNĐ</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số quyết định giao</span>
                      <span className="chk-detail-value">{r.assignmentDecisionNumber || '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Ngày tính khấu hao</span>
                      <span className="chk-detail-value">{fmtDate(r.depreciationStartDate)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số tháng tính khấu hao</span>
                      <span className="chk-detail-value">{r.depreciationMonths != null ? `${r.depreciationMonths} tháng` : '—'}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Ngày hết khấu hao</span>
                      <span className="chk-detail-value">{fmtDate(r.depreciationEndDate)}</span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Khấu hao lũy kế</span>
                      <span className="chk-detail-value">
                        {r.accumulatedDepreciation != null ? `${fmtNum(r.accumulatedDepreciation)} VNĐ` : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Khấu hao tháng</span>
                      <span className="chk-detail-value">
                        {r.monthlyDepreciation != null ? `${fmtNum(r.monthlyDepreciation)} VNĐ` : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Hình thức xử lý tài sản</span>
                      <span className="chk-detail-value">{r.disposalMethod || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Thông tin phê duyệt */}
                <div style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <AuditOutlined style={{ color: actionPrimary }} />
                      <span>Thông tin phê duyệt</span>
                    </div>
                    <div onClick={() => setApprovalOpen(!approvalOpen)} style={{ cursor: 'pointer', color: textTertiary }}>
                      {approvalOpen ? <DownOutlined /> : <RightOutlined />}
                    </div>
                  </div>
                  {approvalOpen && (
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Trạng thái</span>
                        <span className="chk-detail-value">
                          <span style={statusBadgeStyle(approvalInfo.color)}>{approvalInfo.label}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Ngày cập nhật</span>
                        <span className="chk-detail-value">{fmtDateTime(r.updatedAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Cán bộ cập nhật</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{r.updatedByName || '—'}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Ngày gửi phê duyệt</span>
                        <span className="chk-detail-value">{fmtDateTime(r.submittedAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Cán bộ gửi phê duyệt</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{r.submittedByName || '—'}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Ngày duyệt Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">{fmtDateTime(r.portAuthorityApprovedAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Cán bộ duyệt Cảng vụ/Chi cục</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{r.portAuthorityApprovedByName || '—'}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label">Nội dung duyệt Cảng vụ</span>
                        <span className="chk-detail-value">{r.portAuthorityApprovalContent || '—'}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Ngày phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">{fmtDateTime(r.departmentApprovedAt)}</span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Cán bộ phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">
                          <span style={{ fontWeight: fontWeightBold }}>{r.departmentApprovedByName || '—'}</span>
                        </span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label">Nội dung phê duyệt cấp Cục</span>
                        <span className="chk-detail-value">{r.departmentApprovalContent || '—'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'files',
            label: `Hồ sơ tài sản (${detailAttachments.length})`,
            children: (
              <div style={{ paddingTop: 6 }}>
                <InfrastructureAttachmentTab
                  attachments={detailAttachments}
                  readonly
                  emptyText="Chưa có tài liệu đính kèm"
                  onDownload={(_id, name) => {
                    toast.info(`Tải xuống tệp: ${name}`);
                  }}
                />
              </div>
            ),
          },
          {
            key: 'exploit',
            label: `Khai thác tài sản (${exploitationRows.length})`,
            children: (
              <div style={{ paddingTop: 6, paddingRight: 4, overflowY: 'auto', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                {exploitationRows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: textTertiary, fontSize: fontSizeMd }}>
                    Chưa có lịch sử khai thác tài sản nào.
                  </div>
                ) : (
                  exploitationRows.map((row, index) => (
                    <div key={row.id} style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <RocketOutlined style={{ color: actionPrimary }} />
                          <span>Lần {index + 1} — {fmtDateTime(row.updatedAt)}</span>
                        </div>
                      </div>
                      <div className="chk-detail-grid">
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Đơn vị khai thác</span>
                          <span className="chk-detail-value">{orgName.get(row.operatorOrgUnitId || '') || '—'}</span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Danh mục tài sản</span>
                          <span className="chk-detail-value">{row.assetCategory || r.assetName}</span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Đơn vị tính</span>
                          <span className="chk-detail-value">{row.unitOfMeasure || '—'}</span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Số lượng</span>
                          <span className="chk-detail-value">{row.quantity != null ? fmtNum(row.quantity) : '—'}</span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Thời hạn khai thác</span>
                          <span className="chk-detail-value">{fmtDate(row.exploitationDeadline)}</span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Tổng tiền thu được (VNĐ)</span>
                          <span className="chk-detail-value">
                            {(row.totalRevenue ?? row.doanhThu) != null ? `${fmtNum(row.totalRevenue ?? row.doanhThu)} VNĐ` : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Chi phí liên quan</span>
                          <span className="chk-detail-value">
                            {(row.relatedCosts ?? row.depreciation) != null ? `${fmtNum(row.relatedCosts ?? row.depreciation)} VNĐ` : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Nộp NSNN</span>
                          <span className="chk-detail-value">
                            {row.stateBudgetPayment != null ? `${fmtNum(row.stateBudgetPayment)} VNĐ` : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Số tiền thực hiện dự án</span>
                          <span className="chk-detail-value">
                            {row.projectAmount != null ? `${fmtNum(row.projectAmount)} VNĐ` : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Cán bộ cập nhật</span>
                          <span className="chk-detail-value">{row.createdByName || '—'}</span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label">Ghi chú</span>
                          <span className="chk-detail-value">{row.description || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ),
          },
          {
            key: 'adjustments',
            label: `Thay đổi nguyên giá (${combinedAdjustments.length})`,
            children: (
              <div style={{ paddingTop: 6, paddingRight: 4, overflowY: 'auto', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                {combinedAdjustments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: textTertiary, fontSize: fontSizeMd }}>
                    Chưa có lịch sử thay đổi nguyên giá nào.
                  </div>
                ) : (
                  combinedAdjustments.map((row, index) => {
                    const details: Record<string, unknown> = { ...(row.adjustmentDetails || parseStoredDetails(row.reason)) };
                    return (
                      <div key={row.id} style={sectionBoxStyle}>
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            {row.icon}
                            <span>{row.changeType} — Lần {index + 1}</span>
                          </div>
                        </div>
                        <div className="chk-detail-grid">
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Loại thay đổi</span>
                            <span className="chk-detail-value">{row.changeType}</span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Số QĐ điều chỉnh</span>
                            <span className="chk-detail-value">
                              {String(details.decisionNumber || ('increaseCode' in row ? row.increaseCode : '—'))}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Ngày ra quyết định</span>
                            <span className="chk-detail-value">{fmtDate(details.decisionDate as string)}</span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Ngày thay đổi nguyên giá</span>
                            <span className="chk-detail-value">{fmtDate(details.adjustmentDate as string)}</span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Lý do điều chỉnh</span>
                            <span className="chk-detail-value">
                              {String(details.adjustmentReason || ('decreaseReason' in row ? row.decreaseReason : '—'))}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Nguyên giá trước điều chỉnh</span>
                            <span className="chk-detail-value">
                              {details.originalValueBefore != null ? `${fmtNum(details.originalValueBefore as number)} VNĐ` : '—'}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Nguyên giá sau điều chỉnh</span>
                            <span className="chk-detail-value">
                              {details.originalValueAfter != null ? `${fmtNum(details.originalValueAfter as number)} VNĐ` : '—'}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Giá trị còn lại trước</span>
                            <span className="chk-detail-value">
                              {details.remainingValueBefore != null ? `${fmtNum(details.remainingValueBefore as number)} VNĐ` : '—'}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Giá trị còn lại sau</span>
                            <span className="chk-detail-value">
                              {details.remainingValueAfter != null ? `${fmtNum(details.remainingValueAfter as number)} VNĐ` : '—'}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Cán bộ thực hiện</span>
                            <span className="chk-detail-value">{row.createdByName || '—'}</span>
                          </div>
                          <div className="chk-detail-row chk-detail-row--full">
                            <span className="chk-detail-label">Ghi chú điều chỉnh</span>
                            <span className="chk-detail-value">
                              {String(details.adjustmentNotes || details.notes || row.reason || '—')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
