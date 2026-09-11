import { useMemo } from 'react';
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { StormShelterArea } from '../../types/port';
import type {
  StormShelterAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import { fmtNum } from '../../utils/numFmt';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
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
import { useInfraAssetDetailAttachments } from './useInfraAssetDetailAttachments';

export interface StormShelterAssetDetailContentProps {
  open: boolean;
  selectedRecord?: StormShelterAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  stormShelterMap: Map<string, StormShelterArea>;
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

export default function StormShelterAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  stormShelterMap,
  exploitationRows = [],
  increaseRows = [],
  decreaseRows = [],
}: StormShelterAssetDetailContentProps) {
  const r = selectedRecord;

  const combinedAdjustments = useMemo(() => {
    return [
      ...increaseRows.map((row) => ({
        ...row,
        changeType: 'Tăng nguyên giá',
      })),
      ...decreaseRows.map((row) => ({
        ...row,
        changeType: 'Giảm nguyên giá',
      })),
    ];
  }, [increaseRows, decreaseRows]);

  const detailAttachments = useInfraAssetDetailAttachments(r);

  const viewTabs = useMemo<ViewTabConfig<StormShelterAsset>[]>(() => {
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
                label: 'Mã khu tránh, trú bão',
                value: (rec) =>
                  stormShelterMap.get(rec.stormShelterId || '')?.stormShelterCode ||
                  '—',
              },
              {
                label: 'Tên khu tránh, trú bão',
                value: (rec) =>
                  stormShelterMap.get(rec.stormShelterId || '')?.stormShelterName ||
                  '—',
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                render: (val) =>
                  val === 'STORM_SHELTER'
                    ? 'Tài sản khu tránh, trú bão'
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
                type: ViewFieldType.Tag,
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
                name: 'address',
                label: 'Địa chỉ',
                colSpan: 24,
              },
            ],
          },
          {
            key: 'metrics',
            title: 'Chỉ số tổng hợp',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                render: (val, rec) =>
                  val != null
                    ? `${fmtNum(val as number)} ${rec.quantityUnit || ''}`.trim()
                    : '—',
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
                render: (val) => (val != null ? `${fmtNum(val as number)} m²` : '—'),
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m2)',
                render: (val) => (val != null ? `${fmtNum(val as number)} m²` : '—'),
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                colSpan: 24,
              },
            ],
          },
        ],
      },
      {
        key: 'files',
        label: `Hồ sơ tài sản (${detailAttachments.length})`,
        customContent: (
          <div style={{ paddingTop: 8 }}>
            <InfrastructureAttachmentTab
              attachments={detailAttachments}
              readonly={true}
            />
          </div>
        ),
      },
      {
        key: 'financial',
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
                render: (val) => (val != null ? `${fmtNum(val as number)} VNĐ` : '—'),
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                render: (val) => (val != null ? `${val}%` : '—'),
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại',
                render: (val) => (
                  <span
                    style={{
                      fontWeight: fontWeightBold,
                      color: colors.sidebarBg,
                    }}
                  >
                    {val != null ? `${fmtNum(val as number)} VNĐ` : '—'}
                  </span>
                ),
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
                render: (val) => (val != null ? `${val} tháng` : '—'),
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: ViewFieldType.Date,
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế',
                render: (val) => (val != null ? `${fmtNum(val as number)} VNĐ` : '—'),
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng',
                render: (val) => (val != null ? `${fmtNum(val as number)} VNĐ` : '—'),
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
        customContent: (
          <div style={{ paddingTop: 8 }}>
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 12,
                fontSize: 13,
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <RocketOutlined style={{ fontSize: 16 }} />
              <span>
                Danh sách các hợp đồng / quyết định khai thác tài sản khu tránh, trú bão được phê duyệt.
              </span>
            </div>
            {exploitationRows.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 0',
                  color: textTertiary,
                  background: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px dashed #E2E8F0',
                }}
              >
                Chưa có thông tin khai thác cho tài sản này.
              </div>
            ) : (
              exploitationRows.map((row, index) => (
                <div key={row.id || index} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      <RocketOutlined style={{ color: actionPrimary }} />
                      <span>
                        Lần {index + 1} — {row.updatedAt || row.createdAt ? dayjs(row.updatedAt || row.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
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
                  fontSize: 13.5,
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
                        <span className="chk-detail-label">Loại thay đổi</span>
                        <span
                          className="chk-detail-value"
                          style={{
                            fontWeight: fontWeightBold,
                            color: row.changeType === 'Tăng nguyên giá' ? statusOperational : statusCritical,
                          }}
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
                          {String(
                            details?.adjustmentReason ||
                              ('decreaseReason' in row ? row.decreaseReason : (row.reason || '—'))
                          )}
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
              })
            )}
          </div>
        ),
      },
      {
        key: 'tracking',
        label: 'Xử lý & theo dõi',
        sections: [
          {
            key: 'audit_info',
            title: 'Xử lý & theo dõi',
            icon: <AuditOutlined />,
            fields: [
              {
                label: 'Trạng thái',
                render: () => (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 999,
                      background: `${approvalInfo.color}15`,
                      border: `1px solid ${approvalInfo.color}40`,
                      color: approvalInfo.color,
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    <CheckCircleOutlined />
                    {approvalInfo.label}
                  </span>
                ),
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
              },
              {
                name: 'updatedAt',
                label: 'Ngày cập nhật',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'submittedByName',
                label: 'Cán bộ gửi phê duyệt',
              },
              {
                name: 'submittedAt',
                label: 'Ngày gửi phê duyệt',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
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
              },
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
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
              },
            ],
          },
        ],
      },
    ];
  }, [
    r,
    orgName,
    stormShelterMap,
    detailAttachments,
    exploitationRows,
    combinedAdjustments,
  ]);

  if (!r) return null;

  return (
    <DynamicViewSidebar<StormShelterAsset>
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SafetyCertificateOutlined style={{ color: actionPrimary, fontSize: 18 }} />
          <span>{`Chi tiết: ${r.assetName || r.assetCode}`}</span>
        </div>
      }
      record={r}
      tabs={viewTabs}
      onClose={onClose}
      width={980}
    />
  );
}
