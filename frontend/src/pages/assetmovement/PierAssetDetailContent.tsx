import React, { useMemo } from 'react';
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Pier } from '../../types/port';
import type {
  PierAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import { fmtNum } from '../../utils/numFmt';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors,
  actionPrimary,
  textTertiary,
  fontWeightBold,
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
} from '../../themetokenchk';
import {
  DynamicViewSidebar,
  ViewFieldType,
  type ViewTabConfig,
} from '../../components/shared/dynamic-view-sidebar';

export interface PierAssetDetailContentProps {
  open: boolean;
  selectedRecord?: PierAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  pierMap: Map<string, Pier>;
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
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: {
    color: statusAttention,
    label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
  },
  CHO_PHE_DUYET: {
    color: statusAttention,
    label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
  },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED_LEVEL1: {
    color: statusCritical,
    label: 'Từ chối cấp Cảng vụ/Chi cục',
  },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp Cục' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
};

const fmtDateTime = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—';
const fmtDate = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY') : '—';

export default function PierAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  pierMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: PierAssetDetailContentProps) {
  const parsedAttachments = useMemo<InfrastructureAttachmentItem[]>(() => {
    if (!selectedRecord?.attachmentName) return [];
    try {
      const parsed = JSON.parse(selectedRecord.attachmentName);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
    return [
      {
        id: '1',
        fileName: selectedRecord.attachmentName,
        fileSize: 0,
        uploadedAt: selectedRecord.createdAt || new Date().toISOString(),
        uploadedBy: selectedRecord.createdBy || 'Hệ thống',
      },
    ];
  }, [selectedRecord]);

  const viewTabs = useMemo<ViewTabConfig[]>(() => {
    if (!selectedRecord) return [];

    const approvalInfo = selectedRecord.approvalStatus
      ? APPROVAL_MAP[selectedRecord.approvalStatus] || {
          color: textTertiary,
          label: selectedRecord.approvalStatus,
        }
      : { color: textTertiary, label: 'Lưu tạm' };

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'basic_info',
            title: 'Thông tin cơ bản & Quản lý vận hành',
            icon: <BankOutlined />,
            fields: [
              {
                name: 'parentOrgUnitId',
                label: 'Cơ quan quản lý cấp trên',
                type: ViewFieldType.Text,
                render: (_v, rec) => (rec.parentOrgUnitId ? orgName.get(rec.parentOrgUnitId) : undefined),
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                type: ViewFieldType.Text,
                render: (_v, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {rec.orgUnitId ? orgName.get(rec.orgUnitId) : undefined}
                  </span>
                ),
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                type: ViewFieldType.Text,
                render: (_v, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {rec.usingOrgUnitId ? orgName.get(rec.usingOrgUnitId) : undefined}
                  </span>
                ),
              },
              {
                name: 'pierId',
                label: 'Mã cầu cảng',
                type: ViewFieldType.Text,
                render: (_v, rec) => (rec.pierId ? pierMap.get(rec.pierId)?.pierCode : undefined),
              },
              {
                label: 'Tên cầu cảng',
                type: ViewFieldType.Text,
                render: (_v, rec) => (rec.pierId ? pierMap.get(rec.pierId)?.pierName : undefined),
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: ViewFieldType.Text,
                render: () => 'Tài sản cầu cảng',
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: ViewFieldType.Text,
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: ViewFieldType.Text,
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: ViewFieldType.Text,
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: ViewFieldType.Text,
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: ViewFieldType.Text,
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: ViewFieldType.Text,
              },
              {
                name: 'assetSubgroup',
                label: 'Phân nhóm tài sản',
                type: ViewFieldType.Text,
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
              {
                name: 'origin',
                label: 'Nguồn gốc',
                type: ViewFieldType.Text,
              },
            ],
          },
          {
            key: 'aggregate_indicators',
            title: 'Chỉ số tổng hợp',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                type: ViewFieldType.Number,
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính số lượng',
                type: ViewFieldType.Text,
              },
              {
                name: 'model',
                label: 'Model',
                type: ViewFieldType.Text,
              },
              {
                name: 'serialNumber',
                label: 'Serial',
                type: ViewFieldType.Text,
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: ViewFieldType.Text,
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
                type: ViewFieldType.Text,
              },
              {
                name: 'constructionYear',
                label: 'Năm xây dựng',
                type: ViewFieldType.Text,
              },
              {
                name: 'useDate',
                label: 'Ngày sử dụng tài sản',
                type: ViewFieldType.Date,
              },
              {
                name: 'landArea',
                label: 'Diện tích (đất, sàn sử dụng: m2)',
                type: ViewFieldType.Number,
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m2)',
                type: ViewFieldType.Number,
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
            ],
          },
        ],
      },
      {
        key: 'attachments',
        label: `Hồ sơ tài sản (${parsedAttachments.length})`,
        customContent: (
          <div style={{ padding: 12 }}>
            <InfrastructureAttachmentTab
              attachments={parsedAttachments}
              readonly={true}
            />
          </div>
        ),
      },
      {
        key: 'details',
        label: 'Thông tin chi tiết',
        sections: [
          {
            key: 'detailed_info',
            title: 'Thông tin chi tiết tài sản',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai tài sản',
                type: ViewFieldType.Date,
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá (nguồn ngân sách, nguồn khác)',
                type: ViewFieldType.Money,
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: ViewFieldType.Text,
                render: (val) =>
                  val != null ? `${val}%` : '—',
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại',
                type: ViewFieldType.Money,
              },
              {
                name: 'currencyUnit',
                label: 'Đơn vị tính giá trị',
                type: ViewFieldType.Text,
                render: () => 'VNĐ',
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao (bao gồm cả tăng vốn)',
                type: ViewFieldType.Text,
              },
              {
                name: 'depreciationStartDate',
                label: 'Ngày tính khấu hao',
                type: ViewFieldType.Date,
              },
              {
                name: 'depreciationMonths',
                label: 'Số tháng tính khấu hao',
                type: ViewFieldType.Text,
                render: (val) =>
                  val != null ? `${val} tháng` : '—',
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: ViewFieldType.Date,
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế',
                type: ViewFieldType.Money,
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng',
                type: ViewFieldType.Money,
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
                type: ViewFieldType.Text,
              },
            ],
          },
        ],
      },
      {
        key: 'exploitation',
        label: `Khai thác tài sản (${exploitationRows.length})`,
        customContent: (
          <div style={{ padding: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                color: colors.primary,
                fontWeight: fontWeightBold,
                fontSize: 14,
              }}
            >
              <RocketOutlined />
              <span>Hồ sơ khai thác tài sản</span>
            </div>
            {exploitationRows.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 0',
                  color: textTertiary,
                }}
              >
                Chưa có dữ liệu khai thác tài sản
              </div>
            ) : (
              exploitationRows.map((row, idx) => (
                <div key={row.id || idx} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <RocketOutlined style={{ color: actionPrimary }} />
                      <span>
                        Lần {idx + 1} — {row.updatedAt || row.createdAt ? dayjs(row.updatedAt || row.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="chk-detail-grid">
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị khai thác</span>
                      <span className="chk-detail-value">
                        {row.operatorOrgUnitId ? (orgName.get(row.operatorOrgUnitId) || '—') : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Danh mục tài sản</span>
                      <span className="chk-detail-value">
                        {row.assetCategory || '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Đơn vị tính</span>
                      <span className="chk-detail-value">
                        {row.unitOfMeasure || '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số lượng</span>
                      <span className="chk-detail-value">
                        {row.quantity != null ? fmtNum(row.quantity) : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Thời hạn khai thác</span>
                      <span className="chk-detail-value">
                        {row.exploitationDeadline ? fmtDate(row.exploitationDeadline) : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Tổng tiền thu được (VNĐ)</span>
                      <span className="chk-detail-value">
                        {row.totalRevenue != null
                          ? `${fmtNum(row.totalRevenue)} VNĐ`
                          : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Chi phí liên quan</span>
                      <span className="chk-detail-value">
                        {row.relatedCosts != null
                          ? `${fmtNum(row.relatedCosts)} VNĐ`
                          : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Nộp NSNN</span>
                      <span className="chk-detail-value">
                        {row.stateBudgetPayment != null
                          ? `${fmtNum(row.stateBudgetPayment)} VNĐ`
                          : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Số tiền thực hiện dự án</span>
                      <span className="chk-detail-value">
                        {row.projectAmount != null
                          ? `${fmtNum(row.projectAmount)} VNĐ`
                          : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Cán bộ cập nhật</span>
                      <span className="chk-detail-value">
                        {row.createdByName || '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row chk-detail-row--full">
                      <span className="chk-detail-label">Ghi chú</span>
                      <span className="chk-detail-value">
                        {row.description || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ),
      },
      {
        key: 'price_history',
        label: `Thay đổi nguyên giá (${increaseRows.length + decreaseRows.length})`,
        customContent: (
          <div
            style={{
              paddingTop: 6,
              paddingRight: 4,
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 190px)',
              minHeight: 350,
            }}
          >
            {increaseRows.length === 0 && decreaseRows.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: textTertiary,
                  fontSize: 13.5,
                }}
              >
                Chưa có lịch sử thay đổi nguyên giá nào.
              </div>
            ) : (
              <>
                {increaseRows.map((row, idx) => {
                  const details = row.adjustmentDetails;
                  const origBefore = details?.originalValueBefore != null ? Number(details.originalValueBefore) : undefined;
                  const origAfter = details?.originalValueAfter != null ? Number(details.originalValueAfter) : undefined;
                  const diffAmount = origBefore != null && origAfter != null
                    ? Math.abs(origAfter - origBefore)
                    : undefined;

                  return (
                    <div key={row.id || idx} style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <PlusCircleOutlined style={{ color: statusOperational }} />
                          <span>
                            Tăng nguyên giá — Lần {idx + 1} ({fmtDateTime(row.updatedAt || row.createdAt)})
                          </span>
                        </div>
                      </div>
                      <div className="chk-detail-grid">
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Loại thay đổi</span>
                          <span
                            className="chk-detail-value"
                            style={{ fontWeight: fontWeightBold, color: statusOperational }}
                          >
                            Tăng nguyên giá
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Số QĐ điều chỉnh</span>
                          <span className="chk-detail-value">
                            {String(details?.decisionNumber || row.increaseCode || '—')}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Ngày ra quyết định</span>
                          <span className="chk-detail-value">
                            {details?.decisionDate ? fmtDate(details.decisionDate) : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Ngày điều chỉnh</span>
                          <span className="chk-detail-value">
                            {details?.adjustmentDate ? fmtDate(details.adjustmentDate) : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Giá trị điều chỉnh</span>
                          <span
                            className="chk-detail-value"
                            style={{ fontWeight: fontWeightBold, color: statusOperational }}
                          >
                            {diffAmount != null ? `+${fmtNum(diffAmount)} VNĐ` : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Nguyên giá trước</span>
                          <span className="chk-detail-value">
                            {origBefore != null ? `${fmtNum(origBefore)} VNĐ` : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Nguyên giá sau</span>
                          <span
                            className="chk-detail-value"
                            style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}
                          >
                            {origAfter != null ? `${fmtNum(origAfter)} VNĐ` : '—'}
                          </span>
                        </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Khấu hao lũy kế</span>
                            <span className="chk-detail-value">
                              {details?.accumulatedDepreciation != null
                                ? `${fmtNum(Number(details.accumulatedDepreciation))} VNĐ`
                                : '—'}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Giá trị còn lại sau điều chỉnh</span>
                            <span className="chk-detail-value">
                              {details?.remainingValueAfter != null
                                ? `${fmtNum(Number(details.remainingValueAfter))} VNĐ`
                                : '—'}
                            </span>
                          </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Lý do điều chỉnh</span>
                          <span className="chk-detail-value">
                            {String(details?.adjustmentReason || row.reason || '—')}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Cán bộ thực hiện</span>
                          <span className="chk-detail-value">
                            {row.createdByName || '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label">Ghi chú</span>
                          <span className="chk-detail-value">
                            {String(details?.adjustmentNotes || '—')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {decreaseRows.map((row, idx) => {
                  const details = row.adjustmentDetails;
                  const origBefore = details?.originalValueBefore != null ? Number(details.originalValueBefore) : undefined;
                  const origAfter = details?.originalValueAfter != null ? Number(details.originalValueAfter) : undefined;
                  const diffAmount = origBefore != null && origAfter != null
                    ? Math.abs(origBefore - origAfter)
                    : undefined;

                  return (
                    <div key={row.id || idx} style={sectionBoxStyle}>
                      <div style={sectionHeaderStyle}>
                        <div style={sectionTitleStyle}>
                          <MinusCircleOutlined style={{ color: statusCritical }} />
                          <span>
                            Giảm nguyên giá — Lần {idx + 1} ({fmtDateTime(row.updatedAt || row.createdAt)})
                          </span>
                        </div>
                      </div>
                      <div className="chk-detail-grid">
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Loại thay đổi</span>
                          <span
                            className="chk-detail-value"
                            style={{ fontWeight: fontWeightBold, color: statusCritical }}
                          >
                            Giảm nguyên giá
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Số QĐ điều chỉnh</span>
                          <span className="chk-detail-value">
                            {String(details?.decisionNumber || row.decreaseCode || '—')}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Ngày ra quyết định</span>
                          <span className="chk-detail-value">
                            {details?.decisionDate ? fmtDate(details.decisionDate) : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Ngày điều chỉnh</span>
                          <span className="chk-detail-value">
                            {details?.adjustmentDate ? fmtDate(details.adjustmentDate) : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Giá trị điều chỉnh</span>
                          <span
                            className="chk-detail-value"
                            style={{ fontWeight: fontWeightBold, color: statusCritical }}
                          >
                            {diffAmount != null ? `-${fmtNum(diffAmount)} VNĐ` : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Nguyên giá trước</span>
                          <span className="chk-detail-value">
                            {origBefore != null ? `${fmtNum(origBefore)} VNĐ` : '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Nguyên giá sau</span>
                          <span
                            className="chk-detail-value"
                            style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}
                          >
                            {origAfter != null ? `${fmtNum(origAfter)} VNĐ` : '—'}
                          </span>
                        </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Khấu hao lũy kế</span>
                            <span className="chk-detail-value">
                              {details?.accumulatedDepreciation != null
                                ? `${fmtNum(Number(details.accumulatedDepreciation))} VNĐ`
                                : '—'}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Giá trị còn lại sau điều chỉnh</span>
                            <span className="chk-detail-value">
                              {details?.remainingValueAfter != null
                                ? `${fmtNum(Number(details.remainingValueAfter))} VNĐ`
                                : '—'}
                            </span>
                          </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Lý do điều chỉnh</span>
                          <span className="chk-detail-value">
                            {String(details?.adjustmentReason || row.decreaseReason || row.reason || '—')}
                          </span>
                        </div>
                        <div className="chk-detail-row">
                          <span className="chk-detail-label">Cán bộ thực hiện</span>
                          <span className="chk-detail-value">
                            {row.createdByName || '—'}
                          </span>
                        </div>
                        <div className="chk-detail-row chk-detail-row--full">
                          <span className="chk-detail-label">Ghi chú</span>
                          <span className="chk-detail-value">
                            {String(details?.adjustmentNotes || '—')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ),
      },
      {
        key: 'tracking',
        label: 'Xử lý & theo dõi',
        sections: [
          {
            key: 'approval_info',
            title: 'Thông tin phê duyệt',
            icon: <AuditOutlined />,
            fields: [
              {
                name: 'status',
                label: 'Trạng thái',
                type: ViewFieldType.Badge,
                render: () => (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '2px 10px',
                      fontSize: 13,
                      fontWeight: 500,
                      background: `${approvalInfo.color}15`,
                      border: `1px solid ${approvalInfo.color}40`,
                      color: approvalInfo.color,
                      display: 'inline-block',
                    }}
                  >
                    {approvalInfo.label}
                  </span>
                ),
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
                type: ViewFieldType.Text,
              },
              {
                name: 'updatedAt',
                label: 'Ngày cập nhật',
                type: ViewFieldType.Text,
                render: () => fmtDateTime(selectedRecord.updatedAt),
              },
              {
                name: 'submittedByName',
                label: 'Cán bộ gửi phê duyệt',
                type: ViewFieldType.Text,
              },
              {
                name: 'submittedAt',
                label: 'Ngày gửi phê duyệt',
                type: ViewFieldType.Text,
                render: () => fmtDateTime(selectedRecord.submittedAt),
              },
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Text,
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Text,
                render: () => fmtDateTime(selectedRecord.portAuthorityApprovedAt),
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
                type: ViewFieldType.Text,
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt cấp Cục',
                type: ViewFieldType.Text,
                render: () => fmtDateTime(selectedRecord.departmentApprovedAt),
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt cấp Cục',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
            ],
          },
        ],
      },
    ];
  }, [
    selectedRecord,
    orgName,
    pierMap,
    parsedAttachments,
    exploitationRows,
    increaseRows,
    decreaseRows,
  ]);

  return (
    <DynamicViewSidebar
      open={open}
      title="Chi tiết tài sản cầu cảng"
      record={selectedRecord}
      tabs={viewTabs}
      onClose={onClose}
      width={900}
      rootClassName="pier-drawer-scope"
    />
  );
}
