import React, { useMemo, useState, useEffect } from 'react';
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TransferArea } from '../../types/port';
import type {
  TransferAreaAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import { fetchInfraAssetAttachments } from '../../services/assetmovement/api';
import { fmtNum } from '../../utils/numFmt';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors,
  actionPrimary,
  textTertiary,
  fontSizeMd,
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

export interface TransferAreaAssetDetailContentProps {
  open: boolean;
  selectedRecord?: TransferAreaAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  transferAreaMap: Map<string, TransferArea>;
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

const parseStoredDetails = (value?: string): Record<string, unknown> => {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return { notes: value };
  }
};

export default function TransferAreaAssetDetailContent({
  open,
  selectedRecord: r,
  onClose,
  orgName,
  transferAreaMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: TransferAreaAssetDetailContentProps) {
  const combinedAdjustments = useMemo(() => {
    return [
      ...increaseRows.map((row) => ({
        ...row,
        changeType: 'Tăng nguyên giá',
        icon: <PlusCircleOutlined style={{ color: statusOperational }} />,
      })),
      ...decreaseRows.map((row) => ({
        ...row,
        changeType: 'Giảm nguyên giá',
        icon: <MinusCircleOutlined style={{ color: statusCritical }} />,
      })),
    ];
  }, [increaseRows, decreaseRows]);

  const [detailAttachments, setDetailAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  useEffect(() => {
    if (!r?.id) {
      setDetailAttachments([]);
      return;
    }
    let isMounted = true;
    fetchInfraAssetAttachments(r.id)
      .then((realAtts) => {
        if (!isMounted) return;
        if (realAtts && realAtts.length > 0) {
          setDetailAttachments(
            realAtts.map((att) => ({
              id: att.id,
              fileName: att.fileName,
              fileSize: att.fileSize,
              fileType: att.contentType,
              uploadedByName: att.uploadedByName || r.updatedByName || '—',
              uploadedDate: att.uploadedAt || (r.updatedAt ? dayjs(r.updatedAt).toISOString() : dayjs().toISOString()),
              filePath: `/v1/asset/infra-assets/${r.id}/attachments/${att.id}/download`,
            }))
          );
        } else if (r.attachmentName) {
          setDetailAttachments(
            r.attachmentName.split(',').map((name, i) => ({
              id: `detail-att-${i}`,
              fileName: name.trim(),
              fileSize: 1024 * 1024,
              uploadedByName: r.updatedByName || '—',
              uploadedDate: r.updatedAt ? dayjs(r.updatedAt).toISOString() : dayjs().toISOString(),
            }))
          );
        } else {
          setDetailAttachments([]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        if (r.attachmentName) {
          setDetailAttachments(
            r.attachmentName.split(',').map((name, i) => ({
              id: `detail-att-${i}`,
              fileName: name.trim(),
              fileSize: 1024 * 1024,
              uploadedByName: r.updatedByName || '—',
              uploadedDate: r.updatedAt ? dayjs(r.updatedAt).toISOString() : dayjs().toISOString(),
            }))
          );
        } else {
          setDetailAttachments([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [r]);

  const viewTabs = useMemo<ViewTabConfig<TransferAreaAsset>[]>(() => {
    if (!r) return [];

    const approvalInfo = r.approvalStatus
      ? (APPROVAL_MAP[r.approvalStatus] || APPROVAL_MAP[r.approvalStatus.toUpperCase()] || {
          color: statusDraft,
          label: r.approvalStatus,
        })
      : { color: statusDraft, label: '—' };

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'basic_info',
            title: 'Thông tin chung',
            icon: <BankOutlined />,
            fields: [
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: ViewFieldType.Tag,
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                render: (val) => (
                  <span
                    style={{
                      fontWeight: fontWeightBold,
                      color: colors.sidebarBg,
                    }}
                  >
                    {String(val || '—')}
                  </span>
                ),
              },
              {
                label: 'Cơ quan quản lý cấp trên',
                value: (rec) => orgName.get(rec.parentOrgUnitId || '') || '—',
              },
              {
                label: 'Đơn vị quản lý',
                render: (_v, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {orgName.get(rec.orgUnitId || '') || '—'}
                  </span>
                ),
              },
              {
                label: 'Đơn vị sử dụng',
                render: (_v, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {orgName.get(rec.usingOrgUnitId || '') || '—'}
                  </span>
                ),
              },
              {
                label: 'Mã khu chuyển tải',
                value: (rec) =>
                  transferAreaMap.get(rec.transferAreaId || '')?.transferAreaCode ||
                  '—',
              },
              {
                label: 'Tên khu chuyển tải',
                value: (rec) =>
                  transferAreaMap.get(rec.transferAreaId || '')?.transferAreaName ||
                  '—',
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                render: (val) =>
                  val === 'TRANSFER_AREA'
                    ? 'Tài sản khu chuyển tải'
                    : String(val || '—'),
              },
              {
                name: 'barcode',
                label: 'Barcode',
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: ViewFieldType.Badge,
                badgeColor: (val) =>
                  val === 'Tốt'
                    ? statusOperational
                    : val === 'Không sử dụng được'
                      ? statusCritical
                      : statusAttention,
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: ViewFieldType.Badge,
                badgeColor: (val) =>
                  val === 'Đang sử dụng'
                    ? statusOperational
                    : val === 'Tạm dừng sử dụng'
                      ? statusCritical
                      : statusDraft,
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
              },
              {
                name: 'assetSubgroup',
                label: 'Phân nhóm tài sản',
              },
              {
                name: 'origin',
                label: 'Nguồn gốc',
              },
              {
                label: 'Số lượng',
                value: (rec) =>
                  rec.quantity != null
                    ? `${fmtNum(rec.quantity)} ${rec.quantityUnit || ''}`.trim()
                    : '—',
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính số lượng',
              },
              {
                name: 'model',
                label: 'Model',
              },
              {
                name: 'serialNumber',
                label: 'Serial',
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
              },
              {
                name: 'constructionYear',
                label: 'Năm xây dựng',
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
                suffix: 'm²',
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m2)',
                type: ViewFieldType.Number,
                suffix: 'm²',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                colSpan: 24,
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                colSpan: 24,
              },
            ],
          },
        ],
      },
      {
        key: 'files',
        label: `Hồ sơ tài sản (${detailAttachments.length})`,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={detailAttachments}
              readonly={true}
            />
          </div>
        ),
      },
      {
        key: 'detail',
        label: 'Thông tin chi tiết',
        sections: [
          {
            key: 'depreciation_info',
            title: 'Thông tin chi tiết',
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
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: ViewFieldType.Number,
                suffix: '%',
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                label: 'Đơn vị tính giá trị',
                value: () => 'VNĐ',
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao (bao gồm cả tăng vốn)',
              },
              {
                name: 'depreciationStartDate',
                label: 'Ngày tính khấu hao',
                type: ViewFieldType.Date,
              },
              {
                name: 'depreciationMonths',
                label: 'Số tháng tính khấu hao',
                type: ViewFieldType.Number,
                suffix: 'tháng',
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: ViewFieldType.Date,
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
              },
            ],
          },
        ],
      },
      {
        key: 'exploitation',
        label: `Khai thác tài sản (${exploitationRows.length})`,
        customContent: () => (
          <div
            style={{
              paddingTop: 6,
              paddingRight: 4,
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 190px)',
              minHeight: 350,
            }}
          >
            {exploitationRows.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: textTertiary,
                  fontSize: fontSizeMd,
                }}
              >
                Chưa có lịch sử khai thác tài sản nào.
              </div>
            ) : (
              exploitationRows.map((row, index) => (
                <div key={row.id} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <RocketOutlined style={{ color: actionPrimary }} />
                      <span>
                        Lần {index + 1} — {fmtDateTime(row.updatedAt)}
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
                      <span className="chk-detail-label">
                        Thời hạn khai thác
                      </span>
                      <span className="chk-detail-value">
                        {row.exploitationDeadline ? fmtDate(row.exploitationDeadline) : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Tổng tiền thu được (VNĐ)
                      </span>
                      <span className="chk-detail-value">
                        {row.totalRevenue != null
                          ? `${fmtNum(row.totalRevenue)} VNĐ`
                          : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Chi phí liên quan
                      </span>
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
                      <span className="chk-detail-label">
                        Số tiền thực hiện dự án
                      </span>
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
        key: 'adjustments',
        label: `Thay đổi nguyên giá (${combinedAdjustments.length})`,
        customContent: () => (
          <div
            style={{
              paddingTop: 6,
              paddingRight: 4,
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 190px)',
              minHeight: 350,
            }}
          >
            {combinedAdjustments.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: textTertiary,
                  fontSize: fontSizeMd,
                }}
              >
                Chưa có lịch sử thay đổi nguyên giá nào.
              </div>
            ) : (
              combinedAdjustments.map((row, index) => {
                const details = row.adjustmentDetails;
                const origBefore = details?.originalValueBefore != null ? Number(details.originalValueBefore) : undefined;
                const origAfter = details?.originalValueAfter != null ? Number(details.originalValueAfter) : undefined;
                const diffAmount = (origBefore != null && origAfter != null)
                  ? Math.abs(origAfter - origBefore)
                  : undefined;

                return (
                  <div key={row.id} style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        {row.icon}
                        <span>
                          {row.changeType} — Lần {index + 1} ({fmtDateTime(row.updatedAt || row.createdAt)})
                        </span>
                      </div>
                    </div>
                    <div className="chk-detail-grid">
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Loại thay đổi nguyên giá
                        </span>
                        <span
                          className="chk-detail-value"
                          style={{ fontWeight: fontWeightBold }}
                        >
                          {row.changeType}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Số QĐ điều chỉnh</span>
                        <span className="chk-detail-value">
                          {String(
                            details?.decisionNumber ||
                              ('increaseCode' in row ? row.increaseCode : ('decreaseCode' in row ? row.decreaseCode : '—'))
                          )}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Ngày ra QĐ</span>
                        <span className="chk-detail-value">
                          {details?.decisionDate ? fmtDate(String(details.decisionDate)) : '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Ngày điều chỉnh nguyên giá
                        </span>
                        <span className="chk-detail-value">
                          {details?.adjustmentDate ? fmtDate(String(details.adjustmentDate)) : '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Lý do điều chỉnh</span>
                        <span className="chk-detail-value">
                          {String(
                            details?.adjustmentReason ||
                              ('decreaseReason' in row ? row.decreaseReason : (row.reason || '—'))
                          )}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Giá trị điều chỉnh</span>
                        <span
                          className="chk-detail-value"
                          style={{
                            fontWeight: fontWeightBold,
                            color: row.changeType === 'Tăng nguyên giá' ? statusOperational : statusCritical,
                          }}
                        >
                          {diffAmount != null
                            ? `${row.changeType === 'Tăng nguyên giá' ? '+' : '-'}${fmtNum(diffAmount)} VNĐ`
                            : '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Nguyên giá trước điều chỉnh
                        </span>
                        <span className="chk-detail-value">
                          {origBefore != null ? `${fmtNum(origBefore)} VNĐ` : '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Nguyên giá sau điều chỉnh
                        </span>
                        <span
                          className="chk-detail-value"
                          style={{
                            fontWeight: fontWeightBold,
                            color: colors.sidebarBg,
                          }}
                        >
                          {origAfter != null ? `${fmtNum(origAfter)} VNĐ` : '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Khấu hao lũy kế
                        </span>
                        <span className="chk-detail-value">
                          {details?.accumulatedDepreciation != null
                            ? `${fmtNum(Number(details.accumulatedDepreciation))} VNĐ`
                            : '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">
                          Giá trị còn lại sau điều chỉnh
                        </span>
                        <span
                          className="chk-detail-value"
                          style={{
                            fontWeight: fontWeightBold,
                            color: actionPrimary,
                          }}
                        >
                          {details?.remainingValueAfter != null
                            ? `${fmtNum(Number(details.remainingValueAfter))} VNĐ`
                            : '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row">
                        <span className="chk-detail-label">Cán bộ thực hiện</span>
                        <span className="chk-detail-value">
                          {row.createdByName || '—'}
                        </span>
                      </div>
                      <div className="chk-detail-row chk-detail-row--full">
                        <span className="chk-detail-label">Ghi chú điều chỉnh</span>
                        <span className="chk-detail-value">
                          {String(details?.adjustmentNotes || '—')}
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
      {
        key: 'approval',
        label: 'Xử lý & theo dõi',
        sections: [
          {
            key: 'tracking_info',
            title: 'Thông tin cập nhật & gửi phê duyệt',
            icon: <AuditOutlined />,
            fields: [
              {
                name: 'approvalStatus',
                label: 'Trạng thái',
                type: ViewFieldType.Badge,
                badgeColor: () => approvalInfo.color,
                render: () => approvalInfo.label,
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
                render: (val) => String(val || '—'),
              },
              {
                name: 'updatedAt',
                label: 'Ngày cập nhật',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'submittedByName',
                label: 'Cán bộ gửi phê duyệt',
                render: (val) => String(val || '—'),
              },
              {
                name: 'submittedAt',
                label: 'Ngày gửi phê duyệt',
                type: ViewFieldType.DateTime,
              },
            ],
          },
          {
            key: 'port_authority_approval',
            title: 'Phê duyệt cấp Cảng vụ / Chi cục',
            icon: <CheckCircleOutlined />,
            fields: [
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
                render: (val) => String(val || '—'),
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt',
                colSpan: 24,
                render: (val) => String(val || '—'),
              },
            ],
          },
          {
            key: 'department_approval',
            title: 'Phê duyệt cấp Cục Hàng hải',
            icon: <SafetyCertificateOutlined />,
            fields: [
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
                render: (val) => String(val || '—'),
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt cấp Cục',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt',
                colSpan: 24,
                render: (val) => String(val || '—'),
              },
            ],
          },
        ],
      },
    ];
  }, [
    r,
    orgName,
    transferAreaMap,
    detailAttachments,
    exploitationRows,
    combinedAdjustments,
  ]);

  return (
    <DynamicViewSidebar
      open={open}
      title={`Chi tiết tài sản khu chuyển tải${r?.assetName ? ` — ${r.assetName}` : ''}`}
      onClose={onClose}
      record={r}
      tabs={viewTabs}
      width={
        typeof window !== 'undefined'
          ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
          : 1000
      }
    />
  );
}
