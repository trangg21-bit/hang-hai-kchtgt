import React, { useMemo, useState } from 'react';
import { Modal, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CompassOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type {
  LritAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
  AssetValueAdjustmentDetails,
} from '../../services/assetmovement/types';
import { fmtNum } from '../../utils/numFmt';
import DetailTable from '../../components/shared/DetailTable';
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
  radiusPill,
  DRAWER_TABLE_SCROLL_Y,
} from '../../themetokenchk';
import {
  DynamicViewSidebar,
  ViewFieldType,
  type ViewTabConfig,
} from '../../components/shared/dynamic-view-sidebar';

export interface LritAssetDetailContentProps {
  open: boolean;
  selectedRecord?: LritAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  stationMap: Map<string, { id: string; name: string; code?: string }>;
  exploitationRows: AssetExploitationResponse[];
  increaseRows: AssetIncreaseResponse[];
  decreaseRows: AssetDecreaseResponse[];
}

export interface AdjustmentRowItem {
  id: string;
  assetId: string;
  assetName: string;
  quantity: number;
  unitOfMeasure: string;
  reason: string;
  status: string;
  changeType: 'Tăng nguyên giá' | 'Giảm nguyên giá';
  icon: React.ReactNode;
  increaseCode?: string;
  decreaseCode?: string;
  decreaseReason?: string;
  decreaseType?: string;
  adjustmentDetails?: AssetValueAdjustmentDetails;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
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
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED_LEVEL1: {
    color: statusCritical,
    label: 'Từ chối cấp Cảng vụ/Chi cục',
  },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp cục' },
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

const getAdjustmentDetailData = (
  row: AdjustmentRowItem,
  assetRecord?: LritAsset,
) => {
  const details: Record<string, unknown> = {
    ...(row.adjustmentDetails || parseStoredDetails(row.reason)),
  };

  const decisionNumber = String(
    details.decisionNumber ||
      (row.changeType === 'Tăng nguyên giá' ? row.increaseCode : row.decreaseCode) ||
      '—',
  );

  const decisionDate = fmtDate(details.decisionDate as string);
  const adjustmentDate = fmtDate(details.adjustmentDate as string);
  const adjustmentReason = String(
    details.adjustmentReason ||
      (row.changeType === 'Tăng nguyên giá' ? row.reason : row.decreaseReason) ||
      '—',
  );

  const notes = String(
    details.adjustmentNotes || details.notes || row.reason || '—',
  );

  const origBefore =
    details.originalValueBefore != null
      ? Number(details.originalValueBefore)
      : assetRecord?.originalValue != null
      ? Number(assetRecord.originalValue)
      : undefined;

  const origAfter =
    details.originalValueAfter != null
      ? Number(details.originalValueAfter)
      : details.originalValue != null
      ? Number(details.originalValue)
      : undefined;

  const remBefore =
    details.remainingValueBefore != null
      ? Number(details.remainingValueBefore)
      : assetRecord?.remainingValue != null
      ? Number(assetRecord.remainingValue)
      : undefined;

  const remAfter =
    details.remainingValueAfter != null
      ? Number(details.remainingValueAfter)
      : details.remainingValue != null
      ? Number(details.remainingValue)
      : undefined;

  // Detail popup fields (64 - 75)
  const declarationDate = fmtDate(
    (details.declarationDate as string) || assetRecord?.declarationDate,
  );
  const originalValue = origAfter ?? origBefore;
  const depreciationRate =
    details.depreciationRate ?? assetRecord?.depreciationRate;
  const remainingValue = remAfter ?? remBefore;
  const valueUnit = String(details.valueUnit || 'VNĐ');
  const assignmentDecisionNumber = String(
    details.assignmentDecisionNumber ||
      assetRecord?.assignmentDecisionNumber ||
      '—',
  );
  const depreciationStartDate = fmtDate(
    (details.depreciationStartDate as string) ||
      assetRecord?.depreciationStartDate,
  );
  const depreciationMonths =
    details.depreciationMonths ?? assetRecord?.depreciationMonths;
  const depreciationEndDate = fmtDate(
    (details.depreciationEndDate as string) ||
      assetRecord?.depreciationEndDate,
  );
  const accumulatedDepreciation =
    details.accumulatedDepreciation ?? assetRecord?.accumulatedDepreciation;
  const monthlyDepreciation =
    details.monthlyDepreciation ?? assetRecord?.monthlyDepreciation;
  const disposalMethod = String(
    details.disposalMethod ||
      row.decreaseType ||
      assetRecord?.disposalMethod ||
      '—',
  );

  // Approval fields (76 - 83)
  const submittedAt = fmtDateTime(
    (details.submittedAt as string) ||
      row.createdAt ||
      assetRecord?.submittedAt,
  );
  const submittedByName = String(
    details.submittedByName ||
      row.createdByName ||
      assetRecord?.submittedByName ||
      '—',
  );
  const portAuthorityApprovedAt = fmtDateTime(
    (details.portAuthorityApprovedAt as string) ||
      assetRecord?.portAuthorityApprovedAt,
  );
  const portAuthorityApprovedByName = String(
    details.portAuthorityApprovedByName ||
      assetRecord?.portAuthorityApprovedByName ||
      '—',
  );
  const portAuthorityApprovalContent = String(
    details.portAuthorityApprovalContent ||
      assetRecord?.portAuthorityApprovalContent ||
      '—',
  );
  const departmentApprovedAt = fmtDateTime(
    (details.departmentApprovedAt as string) ||
      assetRecord?.departmentApprovedAt,
  );
  const departmentApprovedByName = String(
    details.departmentApprovedByName ||
      assetRecord?.departmentApprovedByName ||
      '—',
  );
  const departmentApprovalContent = String(
    details.departmentApprovalContent ||
      assetRecord?.departmentApprovalContent ||
      '—',
  );

  return {
    decisionNumber,
    decisionDate,
    adjustmentDate,
    adjustmentReason,
    notes,
    origBefore,
    origAfter,
    remBefore,
    remAfter,
    declarationDate,
    originalValue,
    depreciationRate,
    remainingValue,
    valueUnit,
    assignmentDecisionNumber,
    depreciationStartDate,
    depreciationMonths,
    depreciationEndDate,
    accumulatedDepreciation,
    monthlyDepreciation,
    disposalMethod,
    submittedAt,
    submittedByName,
    portAuthorityApprovedAt,
    portAuthorityApprovedByName,
    portAuthorityApprovalContent,
    departmentApprovedAt,
    departmentApprovedByName,
    departmentApprovalContent,
  };
};

export default function LritAssetDetailContent({
  open,
  selectedRecord: r,
  onClose,
  orgName,
  stationMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: LritAssetDetailContentProps) {
  const [selectedAdjustment, setSelectedAdjustment] =
    useState<AdjustmentRowItem | null>(null);

  const combinedAdjustments: AdjustmentRowItem[] = useMemo(() => {
    return [
      ...increaseRows.map((row) => ({
        ...row,
        changeType: 'Tăng nguyên giá' as const,
        icon: <PlusCircleOutlined style={{ color: statusOperational }} />,
      })),
      ...decreaseRows.map((row) => ({
        ...row,
        changeType: 'Giảm nguyên giá' as const,
        icon: <MinusCircleOutlined style={{ color: statusCritical }} />,
      })),
    ];
  }, [increaseRows, decreaseRows]);

  const detailAttachments: InfrastructureAttachmentItem[] = useMemo(() => {
    if (!r?.attachmentName) return [];
    return r.attachmentName.split(',').map((name, i) => ({
      id: `detail-att-${i}`,
      fileName: name.trim(),
      fileSize: 1024 * 512,
      uploadedByName: r.updatedByName || r.submittedByName || 'Cán bộ quản lý',
      uploadedDate: r.updatedAt
        ? dayjs(r.updatedAt).toISOString()
        : dayjs().toISOString(),
    }));
  }, [r]);

  const adjustmentColumns: ColumnsType<AdjustmentRowItem> = useMemo(
    () => [
      {
        title: 'STT',
        key: 'stt',
        width: 60,
        align: 'center',
        render: (_v, _rec, index) => index + 1,
      },
      {
        title: 'Loại thay đổi nguyên giá',
        dataIndex: 'changeType',
        key: 'changeType',
        width: 170,
        render: (val: string) => {
          const isIncrease = val === 'Tăng nguyên giá';
          const color = isIncrease ? statusOperational : statusCritical;
          const Icon = isIncrease ? PlusCircleOutlined : MinusCircleOutlined;
          return (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 10px',
                borderRadius: radiusPill,
                fontSize: fontSizeMd,
                fontWeight: 500,
                background: `${color}15`,
                border: `1px solid ${color}40`,
                color,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon />
              {val}
            </span>
          );
        },
      },
      {
        title: 'Số QĐ tăng/giảm nguyên giá',
        key: 'decisionNumber',
        width: 190,
        render: (_v, row) => {
          const data = getAdjustmentDetailData(row, r);
          return <span style={{ fontWeight: 600 }}>{data.decisionNumber}</span>;
        },
      },
      {
        title: 'Ngày ra QĐ tăng/giảm nguyên giá',
        key: 'decisionDate',
        width: 160,
        align: 'center',
        render: (_v, row) => getAdjustmentDetailData(row, r).decisionDate,
      },
      {
        title: 'Ngày tăng/giảm nguyên giá',
        key: 'adjustmentDate',
        width: 160,
        align: 'center',
        render: (_v, row) => getAdjustmentDetailData(row, r).adjustmentDate,
      },
      {
        title: 'Lý do tăng/giảm nguyên giá',
        key: 'adjustmentReason',
        width: 170,
        render: (_v, row) => getAdjustmentDetailData(row, r).adjustmentReason,
      },
      {
        title: 'Ghi chú (điều chỉnh)',
        key: 'notes',
        width: 180,
        ellipsis: true,
        render: (_v, row) => {
          const notes = getAdjustmentDetailData(row, r).notes;
          return <span title={notes}>{notes}</span>;
        },
      },
      {
        title: 'Nguyên giá trước khi tăng/giảm',
        key: 'origBefore',
        width: 180,
        align: 'right',
        render: (_v, row) => {
          const val = getAdjustmentDetailData(row, r).origBefore;
          return val != null ? `${fmtNum(val)} VNĐ` : '—';
        },
      },
      {
        title: 'Nguyên giá sau khi tăng/giảm',
        key: 'origAfter',
        width: 180,
        align: 'right',
        render: (_v, row) => {
          const val = getAdjustmentDetailData(row, r).origAfter;
          return val != null ? `${fmtNum(val)} VNĐ` : '—';
        },
      },
      {
        title: 'Giá trị còn lại trước khi tăng/giảm',
        key: 'remBefore',
        width: 180,
        align: 'right',
        render: (_v, row) => {
          const val = getAdjustmentDetailData(row, r).remBefore;
          return val != null ? `${fmtNum(val)} VNĐ` : '—';
        },
      },
      {
        title: 'Giá trị còn lại sau khi tăng/giảm',
        key: 'remAfter',
        width: 180,
        align: 'right',
        render: (_v, row) => {
          const val = getAdjustmentDetailData(row, r).remAfter;
          return val != null ? `${fmtNum(val)} VNĐ` : '—';
        },
      },
      {
        title: 'Ngày cập nhật',
        key: 'updatedAt',
        width: 160,
        align: 'center',
        render: (_v, row) => fmtDateTime(row.updatedAt || row.createdAt),
      },
      {
        title: 'Cán bộ cập nhật',
        key: 'createdByName',
        width: 160,
        render: (_v, row) => row.createdByName || '—',
      },
      {
        title: 'Trạng thái thay đổi nguyên giá',
        key: 'status',
        width: 160,
        align: 'center',
        render: (_v, row) => {
          const st = String(row.status || '').toUpperCase();
          let color = statusOperational;
          let label = 'Đã duyệt';
          if (st === 'DRAFT' || st === 'NHAP') {
            color = statusDraft;
            label = 'Lưu tạm';
          } else if (
            st.includes('PENDING') ||
            st.includes('CHO_PHE_DUYET') ||
            st.includes('PROPOSED')
          ) {
            color = statusAttention;
            label = 'Chờ duyệt';
          } else if (st.includes('REJECT') || st.includes('TU_CHOI')) {
            color = statusCritical;
            label = 'Từ chối';
          }
          return (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: radiusPill,
                fontSize: fontSizeMd,
                fontWeight: 500,
                background: `${color}15`,
                border: `1px solid ${color}40`,
                color,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          );
        },
      },
    ],
    [r],
  );

  const viewTabs = useMemo<ViewTabConfig<LritAsset>[]>(() => {
    if (!r) return [];

    const approvalInfo =
      APPROVAL_MAP[r.approvalStatus || ''] ||
      APPROVAL_MAP[r.approvalStatus?.toUpperCase() || ''] || {
        color: statusDraft,
        label: r.approvalStatus || '—',
      };

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        icon: <CompassOutlined />,
        sections: [
          {
            key: 'basic_info',
            title: '1. Thông tin cơ bản & Quản lý vận hành',
            icon: <CompassOutlined />,
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
                label: 'Mã đài',
                value: (rec) => {
                  const st = stationMap.get(rec.lritStationId || '');
                  return st ? (st.code ? `${st.name} (${st.code})` : st.name) : '—';
                  },
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                render: () => 'Tài sản đài LRIT',
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
                label: 'Diện tích đất, sàn sử dụng (m²)',
                type: ViewFieldType.Number,
                suffix: 'm²',
              },
              {
                name: 'floorArea',
                label: 'Diện tích sàn sử dụng (m²)',
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
          {
            key: 'depreciation_info',
            title: '2. Thông tin giá trị & Khấu hao tài sản',
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
                label: 'Giá trị còn lại (VNĐ)',
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
                render: (val) => (val != null ? `${val} tháng` : '—'),
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: ViewFieldType.Date,
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế (VNĐ)',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
              },
            ],
          },
          {
            key: 'approval_info',
            title: '3. Thông tin phê duyệt',
            icon: <AuditOutlined />,
            collapsible: true,
            defaultCollapsed: false,
            fields: [
              {
                label: 'Trạng thái',
                type: ViewFieldType.Badge,
                value: () => approvalInfo.label,
                badgeColor: () => approvalInfo.color,
              },
              {
                name: 'updatedAt',
                label: 'Ngày cập nhật',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || '—')}
                  </span>
                ),
              },
              {
                name: 'submittedAt',
                label: 'Ngày gửi phê duyệt',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'submittedByName',
                label: 'Người gửi phê duyệt',
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày duyệt Cảng vụ/Chi cục',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'portAuthorityApprovedByName',
                label: 'Người duyệt Cảng vụ/Chi cục',
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt Cảng vụ/Chi cục',
                colSpan: 24,
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày duyệt Cục',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'departmentApprovedByName',
                label: 'Người duyệt Cục',
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt Cục',
                colSpan: 24,
              },
              {
                name: 'rejectionReason',
                label: 'Lý do từ chối',
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
      {
        key: 'files',
        label: 'Hồ sơ tài sản',
        badgeCount: detailAttachments.length,
        icon: <SlidersOutlined />,
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
        key: 'exploitation',
        label: 'Khai thác tài sản',
        badgeCount: exploitationRows.length,
        icon: <RocketOutlined />,
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
                        {orgName.get(row.operatorOrgUnitId || '') || '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">Danh mục tài sản</span>
                      <span className="chk-detail-value">
                        {row.assetCategory || r.assetName}
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
                        {fmtDate(row.exploitationDeadline)}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Tổng tiền thu được (VNĐ)
                      </span>
                      <span className="chk-detail-value">
                        {(row.totalRevenue ?? row.doanhThu) != null
                          ? `${fmtNum(row.totalRevenue ?? row.doanhThu)} VNĐ`
                          : '—'}
                      </span>
                    </div>
                    <div className="chk-detail-row">
                      <span className="chk-detail-label">
                        Chi phí liên quan
                      </span>
                      <span className="chk-detail-value">
                        {(row.relatedCosts ?? row.depreciation) != null
                          ? `${fmtNum(row.relatedCosts ?? row.depreciation)} VNĐ`
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
        label: 'Lịch sử thay đổi nguyên giá',
        badgeCount: combinedAdjustments.length,
        icon: <AuditOutlined />,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            <DetailTable<AdjustmentRowItem>
              columns={adjustmentColumns}
              dataSource={combinedAdjustments}
              rowKey="id"
              scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
              emptyText="Chưa có lịch sử thay đổi nguyên giá nào."
              onRow={(record) => ({
                onClick: () => setSelectedAdjustment(record),
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        ),
      },
    ];
  }, [
    r,
    orgName,
    stationMap,
    detailAttachments,
    exploitationRows,
    combinedAdjustments,
    adjustmentColumns,
  ]);

  return (
    <>
      <DynamicViewSidebar<LritAsset>
        open={open}
        onClose={onClose}
        record={r}
        title={`Chi tiết tài sản đài LRIT${r?.assetName ? ` — ${r.assetName}` : ''}`}
        tabs={viewTabs}
        rootClassName="lrit-drawer-scope"
        className="lrit-drawer-scope"
      />

      {/* Modal Popup Chi tiết thay đổi nguyên giá (gồm 2 nhóm thông tin) */}
      <Modal
        open={Boolean(selectedAdjustment)}
        onCancel={() => setSelectedAdjustment(null)}
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 16,
              fontWeight: fontWeightBold,
              color: colors.sidebarBg,
            }}
          >
            <AuditOutlined style={{ color: actionPrimary }} />
            <span>
              Chi tiết thay đổi nguyên giá —{' '}
              {selectedAdjustment
                ? getAdjustmentDetailData(selectedAdjustment, r).decisionNumber
                : ''}
            </span>
          </div>
        }
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setSelectedAdjustment(null)}
            style={{
              borderRadius: radiusPill,
              height: 40,
              paddingLeft: 24,
              paddingRight: 24,
              background: actionPrimary,
            }}
          >
            Đóng
          </Button>,
        ]}
        width={920}
        destroyOnClose
        centered
        styles={{
          body: {
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            padding: '16px 20px',
          },
        }}
      >
        {selectedAdjustment && (() => {
          const d = getAdjustmentDetailData(selectedAdjustment, r);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nhóm 1: Thông tin chi tiết thay đổi nguyên giá */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>1. Thông tin chi tiết thay đổi nguyên giá</span>
                  </div>
                </div>
                <div className="chk-detail-grid">
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Ngày kê khai tài sản</span>
                    <span className="chk-detail-value">{d.declarationDate}</span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Nguyên giá</span>
                    <span className="chk-detail-value">
                      {d.originalValue != null
                        ? `${fmtNum(d.originalValue)} VNĐ`
                        : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">
                      Tỷ lệ hao mòn/Khấu hao (%)
                    </span>
                    <span className="chk-detail-value">
                      {d.depreciationRate != null
                        ? `${d.depreciationRate}%`
                        : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Giá trị còn lại</span>
                    <span className="chk-detail-value">
                      {d.remainingValue != null
                        ? `${fmtNum(d.remainingValue)} VNĐ`
                        : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Đơn vị tính</span>
                    <span className="chk-detail-value">{d.valueUnit}</span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">
                      Số quyết định giao (bao gồm cả tăng vốn)
                    </span>
                    <span className="chk-detail-value">
                      {d.assignmentDecisionNumber}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Ngày tính khấu hao</span>
                    <span className="chk-detail-value">
                      {d.depreciationStartDate}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">
                      Số tháng tính khấu hao
                    </span>
                    <span className="chk-detail-value">
                      {d.depreciationMonths != null
                        ? `${d.depreciationMonths} tháng`
                        : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Ngày hết khấu hao</span>
                    <span className="chk-detail-value">
                      {d.depreciationEndDate}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Khấu hao lũy kế</span>
                    <span className="chk-detail-value">
                      {d.accumulatedDepreciation != null
                        ? `${fmtNum(d.accumulatedDepreciation)} VNĐ`
                        : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">Khấu hao tháng</span>
                    <span className="chk-detail-value">
                      {d.monthlyDepreciation != null
                        ? `${fmtNum(d.monthlyDepreciation)} VNĐ`
                        : '—'}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">
                      Hình thức xử lý tài sản
                    </span>
                    <span className="chk-detail-value">{d.disposalMethod}</span>
                  </div>
                </div>
              </div>

              {/* Nhóm 2: Thông tin phê duyệt thay đổi nguyên giá */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <AuditOutlined style={{ color: actionPrimary }} />
                    <span>2. Thông tin phê duyệt thay đổi nguyên giá</span>
                  </div>
                </div>
                <div className="chk-detail-grid">
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">
                      Ngày gửi phê duyệt
                    </span>
                    <span className="chk-detail-value">{d.submittedAt}</span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">
                      Cán bộ gửi phê duyệt
                    </span>
                    <span className="chk-detail-value">{d.submittedByName}</span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">
                      Ngày phê duyệt cấp Cảng vụ/Chi cục
                    </span>
                    <span className="chk-detail-value">
                      {d.portAuthorityApprovedAt}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">
                      Cán bộ phê duyệt cấp Cảng vụ/Chi cục
                    </span>
                    <span className="chk-detail-value">
                      {d.portAuthorityApprovedByName}
                    </span>
                  </div>
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label">
                      Nội dung phê duyệt Cảng vụ/Chi cục
                    </span>
                    <span className="chk-detail-value">
                      {d.portAuthorityApprovalContent}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">
                      Ngày phê duyệt cấp Cục
                    </span>
                    <span className="chk-detail-value">
                      {d.departmentApprovedAt}
                    </span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label">
                      Cán bộ phê duyệt cấp Cục
                    </span>
                    <span className="chk-detail-value">
                      {d.departmentApprovedByName}
                    </span>
                  </div>
                  <div className="chk-detail-row chk-detail-row--full">
                    <span className="chk-detail-label">
                      Nội dung phê duyệt cấp Cục
                    </span>
                    <span className="chk-detail-value">
                      {d.departmentApprovalContent}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
