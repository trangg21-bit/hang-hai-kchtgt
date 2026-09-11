import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { VtsSystemAsset } from '../../services/vtsasset/types';
import type {
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
import {
  getOrGenerateAttachmentBlob,
  getAttachmentPreviewUrl,
  downloadAttachmentFile,
} from '../../utils/attachmentStorage';

export interface VtsSystemAssetDetailContentProps {
  open: boolean;
  selectedRecord?: VtsSystemAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  vtsSystemMap: Map<string, { code: string; name: string }>;
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
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED_LEVEL1: {
    color: statusCritical,
    label: 'Từ chối cấp Cảng vụ/Chi cục',
  },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp Cục' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
};

const fmtDateTime = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—';
const fmtDate = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY') : '—';

export default function VtsSystemAssetDetailContent({
  open,
  selectedRecord: r,
  onClose,
  orgName,
  vtsSystemMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: VtsSystemAssetDetailContentProps) {
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
    if (!r?.attachmentName) {
      setDetailAttachments([]);
      return;
    }
    const names = r.attachmentName
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    let isMounted = true;

    const initialItems: InfrastructureAttachmentItem[] = names.map((name, i) => ({
      id: `vts-detail-att-${i}`,
      fileName: name,
      fileSize: 1024 * 1024,
      uploadedByName: r.updatedByName || r.submittedByName || 'Cán bộ quản lý',
      uploadedDate: r.updatedAt
        ? dayjs(r.updatedAt).toISOString()
        : dayjs().toISOString(),
    }));
    setDetailAttachments(initialItems);

    Promise.all(
      names.map(async (name, i) => {
        try {
          const url = await getAttachmentPreviewUrl(name, {
            assetCode: r.assetCode,
            assetName: r.assetName,
          });
          return { id: `vts-detail-att-${i}`, url };
        } catch {
          return { id: `vts-detail-att-${i}`, url: undefined };
        }
      })
    ).then((resolved) => {
      if (!isMounted) return;
      setDetailAttachments((prev) =>
        prev.map((item) => {
          const match = resolved.find((res) => res.id === item.id);
          return match?.url ? { ...item, url: match.url } : item;
        })
      );
    });

    return () => {
      isMounted = false;
    };
  }, [r]);

  const handleLoadReadonlyPreviewImage = useCallback(
    async (attachmentId: string) => {
      const att = detailAttachments.find((item) => item.id === attachmentId);
      if (!att) throw new Error('Không tìm thấy tệp');
      return await getOrGenerateAttachmentBlob(att.fileName, {
        assetCode: r?.assetCode,
        assetName: r?.assetName,
      });
    },
    [detailAttachments, r?.assetCode, r?.assetName]
  );

  const handleDownloadAttachment = useCallback(
    async (_id: string, fileName?: string) => {
      if (!fileName) return;
      await downloadAttachmentFile(fileName, {
        assetCode: r?.assetCode,
        assetName: r?.assetName,
      });
    },
    [r?.assetCode, r?.assetName]
  );

  const viewTabs = useMemo<ViewTabConfig<VtsSystemAsset>[]>(() => {
    if (!r) return [];

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
                label: 'Mã hệ thống VTS',
                value: (rec) =>
                  vtsSystemMap.get(rec.vtsSystemId || '')?.code || rec.vtsSystemCode || '—',
              },
              {
                label: 'Tên hệ thống VTS',
                value: (rec) =>
                  vtsSystemMap.get(rec.vtsSystemId || '')?.name || rec.vtsSystemName || '—',
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
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
                name: 'address',
                label: 'Địa chỉ',
                colSpan: 24,
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                colSpan: 24,
              },
            ],
          },
          {
            key: 'summary_indicators',
            title: 'Chỉ số tổng hợp',
            icon: <ProfileOutlined />,
            fields: [
              {
                label: 'Số lượng',
                value: (rec) =>
                  rec.quantity != null
                    ? `${fmtNum(rec.quantity)} ${rec.quantityUnit || ''}`.trim()
                    : '—',
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính',
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
                label: 'Diện tích (đất, sàn: m²)',
                type: ViewFieldType.Number,
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m²)',
                type: ViewFieldType.Number,
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
              onUpload={() => {}}
              onDelete={() => {}}
              onDownload={handleDownloadAttachment}
              loadReadonlyPreviewImage={handleLoadReadonlyPreviewImage}
            />
          </div>
        ),
      },
      {
        key: 'details',
        label: 'Thông tin chi tiết',
        sections: [
          {
            key: 'depreciation_info',
            title: 'Thông tin giá trị & Khấu hao tài sản',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai tài sản',
                type: ViewFieldType.Date,
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá (VNĐ)',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                render: (val) => (val != null ? `${val}%` : '—'),
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
                label: 'Số quyết định giao',
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
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      rowGap: 8,
                      columnGap: 24,
                    }}
                  >
                    <div>
                      <strong>Đơn vị khai thác:</strong>{' '}
                      {orgName.get(row.operatorOrgUnitId || '') || '—'}
                    </div>
                    <div>
                      <strong>Danh mục tài sản:</strong>{' '}
                      {row.assetCategory || '—'}
                    </div>
                    <div>
                      <strong>Đơn vị tính:</strong> {row.unitOfMeasure || '—'}
                    </div>
                    <div>
                      <strong>Số lượng:</strong>{' '}
                      {row.quantity != null ? fmtNum(row.quantity) : '—'}
                    </div>
                    <div>
                      <strong>Thời hạn khai thác:</strong>{' '}
                      {fmtDate(row.exploitationDeadline)}
                    </div>
                    <div>
                      <strong>Tổng số tiền thu được:</strong>{' '}
                      {row.totalRevenue != null ? `${fmtNum(row.totalRevenue)} VNĐ` : '—'}
                    </div>
                    <div>
                      <strong>Chi phí có liên quan:</strong>{' '}
                      {row.relatedCosts != null ? `${fmtNum(row.relatedCosts)} VNĐ` : '—'}
                    </div>
                    <div>
                      <strong>Nộp NSNN:</strong>{' '}
                      {row.stateBudgetPayment != null ? `${fmtNum(row.stateBudgetPayment)} VNĐ` : '—'}
                    </div>
                    <div>
                      <strong>Số tiền được thực hiện DA:</strong>{' '}
                      {row.projectAmount != null ? `${fmtNum(row.projectAmount)} VNĐ` : '—'}
                    </div>
                    <div>
                      <strong>Ghi chú:</strong> {row.description || '—'}
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
        label: `Lịch sử thay đổi nguyên giá (${combinedAdjustments.length})`,
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
              combinedAdjustments.map((row) => (
                <div key={row.id} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <div style={sectionTitleStyle}>
                      {row.icon}
                      <span>
                        {row.changeType} — {fmtDate(row.adjustmentDetails?.adjustmentDate)}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      rowGap: 8,
                      columnGap: 24,
                    }}
                  >
                    <div>
                      <strong>Số QĐ tăng/giảm:</strong>{' '}
                      {row.adjustmentDetails?.decisionNumber || '—'}
                    </div>
                    <div>
                      <strong>Ngày ra QĐ:</strong>{' '}
                      {fmtDate(row.adjustmentDetails?.decisionDate)}
                    </div>
                    <div>
                      <strong>Lý do tăng/giảm:</strong>{' '}
                      {row.adjustmentDetails?.adjustmentReason || '—'}
                    </div>
                    <div>
                      <strong>Ghi chú:</strong>{' '}
                      {row.adjustmentDetails?.adjustmentNotes || '—'}
                    </div>
                    <div>
                      <strong>Nguyên giá trước:</strong>{' '}
                      {row.adjustmentDetails?.originalValueBefore != null
                        ? `${fmtNum(row.adjustmentDetails.originalValueBefore)} VNĐ`
                        : '—'}
                    </div>
                    <div>
                      <strong>Nguyên giá sau:</strong>{' '}
                      {row.adjustmentDetails?.originalValueAfter != null
                        ? `${fmtNum(row.adjustmentDetails.originalValueAfter)} VNĐ`
                        : '—'}
                    </div>
                    <div>
                      <strong>Giá trị còn lại trước:</strong>{' '}
                      {row.adjustmentDetails?.remainingValueBefore != null
                        ? `${fmtNum(row.adjustmentDetails.remainingValueBefore)} VNĐ`
                        : '—'}
                    </div>
                    <div>
                      <strong>Giá trị còn lại sau:</strong>{' '}
                      {row.adjustmentDetails?.remainingValueAfter != null
                        ? `${fmtNum(row.adjustmentDetails.remainingValueAfter)} VNĐ`
                        : '—'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ),
      },
      {
        key: 'approval',
        label: 'Xử lý & theo dõi',
        icon: <AuditOutlined />,
        sections: [
          {
            key: 'status_info',
            title: 'Trạng thái & Thông tin cập nhật',
            fields: [
              {
                name: 'approvalStatus',
                label: 'Trạng thái',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => {
                  const statusInfo = APPROVAL_MAP[v as string] || {
                    color: textTertiary,
                    label: (v as string) || '—',
                  };
                  return (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 500,
                        background: `${statusInfo.color}15`,
                        border: `1px solid ${statusInfo.color}40`,
                        color: statusInfo.color,
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  );
                },
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || '—')}
                  </span>
                ),
              },
              {
                name: 'updatedAt',
                label: 'Ngày cập nhật',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDateTime(v as string),
              },
            ],
          },
          {
            key: 'submission_info',
            title: 'Thông tin gửi phê duyệt',
            fields: [
              {
                name: 'submittedByName',
                label: 'Cán bộ gửi phê duyệt',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'submittedAt',
                label: 'Ngày gửi phê duyệt',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDateTime(v as string),
              },
            ],
          },
          {
            key: 'port_approval',
            title: 'Phê duyệt cấp Cảng vụ/Chi cục',
            fields: [
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
            ],
          },
          {
            key: 'department_approval',
            title: 'Phê duyệt cấp Cục',
            fields: [
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt cấp Cục',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
              {
                name: 'rejectionReason',
                label: 'Lý do từ chối (nếu có)',
                type: ViewFieldType.Text,
                colSpan: 24,
                hidden: (rec) => !rec.rejectionReason,
                render: (val) => (
                  <span style={{ color: statusCritical, fontWeight: 500 }}>
                    {String(val)}
                  </span>
                ),
              },
            ],
          },
        ],
      },
    ];
  }, [
    r,
    orgName,
    vtsSystemMap,
    detailAttachments,
    exploitationRows,
    combinedAdjustments,
    handleDownloadAttachment,
    handleLoadReadonlyPreviewImage,
  ]);

  return (
    <DynamicViewSidebar
      open={open}
      record={r}
      title={`Chi tiết tài sản hệ thống VTS${r ? ` - ${r.assetName}` : ''}`}
      onClose={onClose}
      tabs={viewTabs}
      width={typeof window !== 'undefined' ? Math.min(1040, Math.floor(window.innerWidth * 0.95)) : 1040}
    />
  );
}
