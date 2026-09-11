import React, { useEffect, useMemo, useState } from 'react';
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
  DryPortAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
  AssetValueAdjustmentDetails,
} from '../../services/assetmovement/types';
import { fetchInfraAssetAttachments } from '../../services/assetmovement/api';
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

export interface DryPortAssetDetailContentProps {
  open: boolean;
  selectedRecord?: DryPortAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  dryPortMap: Map<string, { id: string; name: string; code?: string }>;
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

const getAdjustmentDetailData = (
  row: AdjustmentRowItem,
  assetRecord?: DryPortAsset,
) => {
  const details: Record<string, unknown> = {
    ...(row.adjustmentDetails || parseStoredDetails(row.reason)),
  };

  const decisionNumber = String(
    details.decisionNumber ||
      details.decisionNo ||
      details.soQuyetDinh ||
      row.increaseCode ||
      row.decreaseCode ||
      '—',
  );
  const decisionDate = String(
    details.decisionDate ||
      details.decisionSignedDate ||
      details.ngayRaQuyetDinh ||
      row.createdAt ||
      '—',
  );
  const effectiveDate = String(
    details.effectiveDate ||
      details.adjustmentDate ||
      details.ngayTangGiam ||
      row.updatedAt ||
      row.createdAt ||
      '—',
  );
  const reasonText = String(
    details.reason || details.lyDo || row.reason || row.decreaseReason || '—',
  );
  const notesText = String(
    details.notes ||
      details.ghiChu ||
      (row as unknown as Record<string, unknown>).notes ||
      '—',
  );

  const originalBefore = Number(
    details.originalValueBefore ??
      details.nguyenGiaTruoc ??
      assetRecord?.originalValue ??
      0,
  );
  const deltaAmount = Number(
    details.adjustmentAmount ??
      details.amount ??
      (row as unknown as Record<string, unknown>).increaseAmount ??
      (row as unknown as Record<string, unknown>).decreaseAmount ??
      0,
  );
  const originalAfter =
    Number(details.originalValueAfter ?? details.nguyenGiaSau) ||
    (row.changeType === 'Tăng nguyên giá'
      ? originalBefore + deltaAmount
      : Math.max(0, originalBefore - deltaAmount));

  const remainingBefore = Number(
    details.remainingValueBefore ??
      details.giaTriConLaiTruoc ??
      assetRecord?.remainingValue ??
      0,
  );
  const remainingAfter =
    Number(details.remainingValueAfter ?? details.giaTriConLaiSau) ||
    (row.changeType === 'Tăng nguyên giá'
      ? remainingBefore + deltaAmount
      : Math.max(0, remainingBefore - deltaAmount));

  const declarationDate = String(
    details.declarationDate || assetRecord?.declarationDate || '—',
  );
  const depreciationRate = String(
    details.depreciationRate ?? assetRecord?.depreciationRate ?? '—',
  );
  const depreciationStartDate = String(
    details.depreciationStartDate || assetRecord?.depreciationStartDate || '—',
  );
  const depreciationMonths = String(
    details.depreciationMonths ?? assetRecord?.depreciationMonths ?? '—',
  );
  const depreciationEndDate = String(
    details.depreciationEndDate || assetRecord?.depreciationEndDate || '—',
  );
  const accumulatedDepreciation = Number(
    details.accumulatedDepreciation ??
      assetRecord?.accumulatedDepreciation ??
      0,
  );
  const monthlyDepreciation = Number(
    details.monthlyDepreciation ?? assetRecord?.monthlyDepreciation ?? 0,
  );
  const disposalMethod = String(
    details.disposalMethod || assetRecord?.disposalMethod || '—',
  );

  const submittedDate = String(
    details.submittedAt ||
      (row.status === 'CHO_PHE_DUYET' || row.status === 'PENDING_APPROVAL'
        ? row.createdAt
        : '—'),
  );
  const submittedBy = String(
    details.submittedByName || details.submittedBy || row.createdByName || '—',
  );
  const approvedPortDate = String(
    details.portAuthorityApprovedAt ||
      (row.status === 'APPROVED' || row.status === 'APPROVED_LEVEL1'
        ? row.updatedAt
        : '—'),
  );
  const approvedPortBy = String(
    details.portAuthorityApprovedByName || details.portAuthorityApprovedBy || '—',
  );
  const approvedPortContent = String(
    details.portAuthorityApprovalContent || '—',
  );
  const approvedDeptDate = String(
    details.departmentApprovedAt ||
      (row.status === 'APPROVED' ? row.updatedAt : '—'),
  );
  const approvedDeptBy = String(
    details.departmentApprovedByName || details.departmentApprovedBy || '—',
  );
  const approvedDeptContent = String(
    details.departmentApprovalContent || '—',
  );

  return {
    decisionNumber,
    decisionDate,
    effectiveDate,
    reasonText,
    notesText,
    originalBefore,
    originalAfter,
    remainingBefore,
    remainingAfter,
    declarationDate,
    depreciationRate,
    depreciationStartDate,
    depreciationMonths,
    depreciationEndDate,
    accumulatedDepreciation,
    monthlyDepreciation,
    disposalMethod,
    submittedDate,
    submittedBy,
    approvedPortDate,
    approvedPortBy,
    approvedPortContent,
    approvedDeptDate,
    approvedDeptBy,
    approvedDeptContent,
  };
};

export default function DryPortAssetDetailContent({
  open,
  selectedRecord: r,
  onClose,
  orgName,
  dryPortMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: DryPortAssetDetailContentProps) {
  const [selectedAdjustment, setSelectedAdjustment] =
    useState<AdjustmentRowItem | null>(null);

  const fallbackAttachments = useMemo<InfrastructureAttachmentItem[]>(() => {
    if (!r?.attachmentName) return [];
    return r.attachmentName.split(',').map((name, i) => ({
      id: `detail-att-${i}`,
      fileName: name.trim(),
      fileSize: 1024 * 512,
      uploadedByName: r.updatedByName || r.submittedByName || 'Cán bộ quản lý',
      uploadedDate: r.updatedAt || r.createdAt || dayjs().toISOString(),
    }));
  }, [r]);

  const [realAttachments, setRealAttachments] = useState<InfrastructureAttachmentItem[] | null>(null);

  useEffect(() => {
    if (!r?.id) return;
    let isMounted = true;
    void fetchInfraAssetAttachments(r.id)
      .then((realAtts) => {
        if (!isMounted) return;
        if (realAtts && realAtts.length > 0) {
          setRealAttachments(
            realAtts.map((att) => ({
              id: att.id,
              fileName: att.fileName,
              fileSize: att.fileSize,
              fileType: att.contentType,
              uploadedByName: att.uploadedByName || r.updatedByName || '—',
              uploadedDate: att.uploadedAt || (r.updatedAt ? dayjs(r.updatedAt).toISOString() : dayjs().toISOString()),
              filePath: `/v1/asset/infra-assets/${r.id}/attachments/${att.id}/download`,
            })),
          );
        } else {
          setRealAttachments(null);
        }
      })
      .catch(() => {
        if (isMounted) setRealAttachments(null);
      });
    return () => {
      isMounted = false;
    };
  }, [r?.id, r?.updatedAt, r?.updatedByName]);

  const detailAttachments = (realAttachments && realAttachments.length > 0) ? realAttachments : fallbackAttachments;

  const combinedAdjustments = useMemo<AdjustmentRowItem[]>(() => {
    const incItems: AdjustmentRowItem[] = increaseRows.map((inc) => ({
      id: inc.id,
      assetId: inc.assetId,
      assetName: inc.assetName,
      quantity: inc.increaseQuantity || 1,
      unitOfMeasure: inc.unitOfMeasure || 'Hệ thống',
      reason: inc.reason || 'Tăng nguyên giá tài sản',
      status: inc.status || 'CHO_PHE_DUYET',
      changeType: 'Tăng nguyên giá',
      icon: <PlusCircleOutlined style={{ color: statusOperational }} />,
      increaseCode: inc.increaseCode,
      adjustmentDetails: inc.adjustmentDetails,
      createdBy: inc.createdBy || '',
      createdByName: inc.createdByName || '',
      createdAt: inc.createdAt || '',
      updatedAt: inc.updatedAt || '',
    }));

    const decItems: AdjustmentRowItem[] = decreaseRows.map((dec) => ({
      id: dec.id,
      assetId: dec.assetId,
      assetName: dec.assetName,
      quantity: dec.decreaseQuantity || 1,
      unitOfMeasure: dec.unitOfMeasure || 'Hệ thống',
      reason: dec.reason || 'Giảm nguyên giá tài sản',
      status: dec.status || 'CHO_PHE_DUYET',
      changeType: 'Giảm nguyên giá',
      icon: <MinusCircleOutlined style={{ color: statusCritical }} />,
      decreaseCode: dec.decreaseCode,
      decreaseReason: dec.decreaseReason,
      decreaseType: dec.decreaseType,
      adjustmentDetails: dec.adjustmentDetails,
      createdBy: dec.createdBy || '',
      createdByName: dec.createdByName || '',
      createdAt: dec.createdAt || '',
      updatedAt: dec.updatedAt || '',
    }));

    return [...incItems, ...decItems].sort((a, b) =>
      dayjs(b.createdAt).diff(dayjs(a.createdAt)),
    );
  }, [increaseRows, decreaseRows]);

  const adjustmentColumns: ColumnsType<AdjustmentRowItem> = useMemo(
    () => [
      {
        title: 'STT',
        key: 'stt',
        width: 60,
        align: 'center',
        render: (_v, _r, index) => index + 1,
      },
      {
        title: 'Loại thay đổi nguyên giá',
        dataIndex: 'changeType',
        key: 'changeType',
        width: 170,
        render: (type: string, row: AdjustmentRowItem) => (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 500,
              color:
                type === 'Tăng nguyên giá'
                  ? statusOperational
                  : statusCritical,
            }}
          >
            {row.icon}
            <span>{type}</span>
          </span>
        ),
      },
      {
        title: 'Số QĐ tăng/giảm nguyên giá',
        key: 'decisionNumber',
        width: 190,
        render: (_val, row) => {
          const det = getAdjustmentDetailData(row, r);
          return det.decisionNumber !== '—'
            ? det.decisionNumber
            : row.increaseCode || row.decreaseCode || '—';
        },
      },
      {
        title: 'Ngày ra QĐ tăng/giảm nguyên giá',
        key: 'decisionDate',
        width: 160,
        align: 'center',
        render: (_val, row) => {
          const det = getAdjustmentDetailData(row, r);
          return fmtDate(det.decisionDate);
        },
      },
      {
        title: 'Ngày tăng/giảm nguyên giá',
        key: 'effectiveDate',
        width: 160,
        align: 'center',
        render: (_val, row) => {
          const det = getAdjustmentDetailData(row, r);
          return fmtDate(det.effectiveDate);
        },
      },
      {
        title: 'Lý do tăng/giảm nguyên giá',
        dataIndex: 'reason',
        key: 'reason',
        width: 170,
        render: (val, row) => {
          const det = getAdjustmentDetailData(row, r);
          return det.reasonText !== '—'
            ? det.reasonText
            : val || row.decreaseReason || '—';
        },
      },
      {
        title: 'Ghi chú (điều chỉnh)',
        key: 'notes',
        width: 180,
        ellipsis: true,
        render: (_val, row) => {
          const det = getAdjustmentDetailData(row, r);
          return det.notesText;
        },
      },
      {
        title: 'Nguyên giá trước khi tăng/giảm',
        key: 'originalBefore',
        width: 180,
        align: 'right',
        render: (_val, row) => {
          const det = getAdjustmentDetailData(row, r);
          return det.originalBefore > 0
            ? `${fmtNum(det.originalBefore)} VNĐ`
            : '—';
        },
      },
      {
        title: 'Nguyên giá sau khi tăng/giảm',
        key: 'originalAfter',
        width: 180,
        align: 'right',
        render: (_val, row) => {
          const det = getAdjustmentDetailData(row, r);
          return det.originalAfter > 0
            ? `${fmtNum(det.originalAfter)} VNĐ`
            : '—';
        },
      },
      {
        title: 'Giá trị còn lại trước khi tăng/giảm',
        key: 'remainingBefore',
        width: 180,
        align: 'right',
        render: (_val, row) => {
          const det = getAdjustmentDetailData(row, r);
          return det.remainingBefore > 0
            ? `${fmtNum(det.remainingBefore)} VNĐ`
            : '—';
        },
      },
      {
        title: 'Giá trị còn lại sau khi tăng/giảm',
        key: 'remainingAfter',
        width: 180,
        align: 'right',
        render: (_val, row) => {
          const det = getAdjustmentDetailData(row, r);
          return det.remainingAfter > 0
            ? `${fmtNum(det.remainingAfter)} VNĐ`
            : '—';
        },
      },
      {
        title: 'Ngày cập nhật',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 160,
        align: 'center',
        render: (val: string, row) => fmtDate(val || row.createdAt),
      },
      {
        title: 'Cán bộ cập nhật',
        dataIndex: 'createdByName',
        key: 'createdByName',
        width: 160,
        render: (val: string) => val || '—',
      },
      {
        title: 'Trạng thái thay đổi nguyên giá',
        dataIndex: 'status',
        key: 'status',
        width: 160,
        align: 'center',
        render: (status: string) => {
          const s = APPROVAL_MAP[status] || {
            color: statusDraft,
            label: status || 'Lưu tạm',
          };
          return (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: radiusPill,
                fontSize: 12,
                fontWeight: 500,
                background: `${s.color}15`,
                border: `1px solid ${s.color}40`,
                color: s.color,
              }}
            >
              {s.label}
            </span>
          );
        },
      },
    ],
    [r],
  );

  const viewTabs = useMemo<ViewTabConfig<DryPortAsset>[]>(() => {
    const approvalInfo = APPROVAL_MAP[r?.approvalStatus || ''] || {
      color: statusDraft,
      label: r?.approvalStatus || 'Lưu tạm',
    };

    const dryPortItem = r?.dryPortId ? dryPortMap.get(r.dryPortId) : undefined;
    const dryPortLabelText = dryPortItem
      ? `${dryPortItem.name}${dryPortItem.code ? ` (${dryPortItem.code})` : ''}`
      : r?.dryPortId || '—';

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'basic_info',
            title: '1. Thông tin cơ bản & Quản lý vận hành',
            icon: <CompassOutlined />,
            fields: [
              {
                name: 'parentOrgUnitId',
                label: 'Cơ quan quản lý cấp trên',
                value: (rec) =>
                  rec.parentOrgUnitId ? (orgName.get(rec.parentOrgUnitId) || '—') : '—',
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                value: (rec) =>
                  rec.orgUnitId ? (orgName.get(rec.orgUnitId) || '—') : '—',
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                value: (rec) =>
                  rec.usingOrgUnitId ? (orgName.get(rec.usingOrgUnitId) || '—') : '—',
              },
              {
                name: 'dryPortId',
                label: 'Mã cảng cạn',
                value: () => dryPortLabelText,
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                value: () => 'Tài sản cảng cạn',
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                colSpan: 24,
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
                    : val === 'Hư hỏng cần sửa chữa'
                      ? statusAttention
                      : statusCritical,
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
            ],
          },
          {
            key: 'summary_indices',
            title: 'Chỉ số tổng hợp',
            icon: <SlidersOutlined />,
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
                label: 'Diện tích (đất, sàn sử dụng: m²)',
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
        ],
      },
      {
        key: 'files',
        label: `Hồ sơ tài sản (${detailAttachments.length})`,
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
        key: 'details',
        label: 'Thông tin chi tiết',
        sections: [
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
        ],
      },
      {
        key: 'exploitation',
        label: `Khai thác tài sản (${exploitationRows.length})`,
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
                        {row.assetCategory || r?.assetName || '—'}
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
        label: `Lịch sử thay đổi nguyên giá (${combinedAdjustments.length})`,
        icon: <AuditOutlined />,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            <DetailTable<AdjustmentRowItem>
              columns={adjustmentColumns}
              dataSource={combinedAdjustments}
              rowKey="id"
              scrollY={DRAWER_TABLE_SCROLL_Y.detailView}
              onRow={(record) => ({
                onClick: () => setSelectedAdjustment(record),
                style: { cursor: 'pointer' },
              })}
              emptyText="Chưa có lịch sử thay đổi nguyên giá nào."
            />
          </div>
        ),
      },
      {
        key: 'tracking',
        label: 'Xử lý & theo dõi',
        sections: [
          {
            key: 'approval_info',
            title: '3. Thông tin phê duyệt',
            icon: <AuditOutlined />,
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
                label: 'Cán bộ gửi phê duyệt',
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt Cảng vụ/Chi cục',
                colSpan: 24,
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt cấp Cục',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
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
    ];
  }, [
    r,
    orgName,
    dryPortMap,
    detailAttachments,
    exploitationRows,
    combinedAdjustments,
    adjustmentColumns,
  ]);

  const selectedDet = useMemo(() => {
    if (!selectedAdjustment) return null;
    return getAdjustmentDetailData(selectedAdjustment, r);
  }, [selectedAdjustment, r]);

  return (
    <>
      <DynamicViewSidebar<DryPortAsset>
        open={open}
        onClose={onClose}
        record={r}
        title={`Chi tiết tài sản cảng cạn${r ? ` - ${r.assetName}` : ''}`}
        tabs={viewTabs}
        width={
          typeof window !== 'undefined'
            ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
            : 1000
        }
        rootClassName="berth-drawer-scope dry-port-drawer-scope"
        className="berth-drawer-scope dry-port-drawer-scope"
      />

      <Modal
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 16,
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
            }}
          >
            {selectedAdjustment?.icon}
            <span>
              Chi tiết thay đổi nguyên giá — {selectedAdjustment?.changeType}
            </span>
          </div>
        }
        open={Boolean(selectedAdjustment)}
        onCancel={() => setSelectedAdjustment(null)}
        footer={[
          <Button
            key="close"
            type="primary"
            style={{ borderRadius: radiusPill }}
            onClick={() => setSelectedAdjustment(null)}
          >
            Đóng
          </Button>,
        ]}
        width={850}
        destroyOnHidden
      >
        {selectedAdjustment && selectedDet && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              paddingTop: 8,
              maxHeight: 'calc(80vh - 120px)',
              overflowY: 'auto',
            }}
          >
            {/* Box 1: Thông tin quyết định điều chỉnh */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <SlidersOutlined style={{ color: actionPrimary }} />
                  <span>1. Thông tin quyết định điều chỉnh</span>
                </div>
              </div>
              <div className="chk-detail-grid">
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Loại thay đổi</span>
                  <span className="chk-detail-value">
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: radiusPill,
                        fontSize: 12,
                        fontWeight: 500,
                        background:
                          selectedAdjustment.changeType === 'Tăng nguyên giá'
                            ? '#1BAF7A15'
                            : '#E3494815',
                        color:
                          selectedAdjustment.changeType === 'Tăng nguyên giá'
                            ? '#1BAF7A'
                            : '#E34948',
                      }}
                    >
                      {selectedAdjustment.changeType}
                    </span>
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Số QĐ tăng/giảm</span>
                  <span className="chk-detail-value">
                    {selectedDet.decisionNumber}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Ngày ra quyết định</span>
                  <span className="chk-detail-value">
                    {fmtDate(selectedDet.decisionDate)}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">
                    Ngày tăng/giảm nguyên giá
                  </span>
                  <span className="chk-detail-value">
                    {fmtDate(selectedDet.effectiveDate)}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">
                    Lý do tăng/giảm nguyên giá
                  </span>
                  <span className="chk-detail-value">
                    {selectedDet.reasonText}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Trạng thái</span>
                  <span className="chk-detail-value">
                    {selectedAdjustment.status}
                  </span>
                </div>
                <div className="chk-detail-row chk-detail-row--full">
                  <span className="chk-detail-label">Ghi chú (điều chỉnh)</span>
                  <span className="chk-detail-value">
                    {selectedDet.notesText}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Giá trị nguyên giá & Giá trị còn lại trước/sau */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <AuditOutlined style={{ color: actionPrimary }} />
                  <span>2. Biến động giá trị tài sản</span>
                </div>
              </div>
              <div className="chk-detail-grid">
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Nguyên giá trước</span>
                  <span className="chk-detail-value">
                    {fmtNum(selectedDet.originalBefore)} VNĐ
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Nguyên giá sau</span>
                  <span
                    className="chk-detail-value"
                    style={{ fontWeight: 600, color: actionPrimary }}
                  >
                    {fmtNum(selectedDet.originalAfter)} VNĐ
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">
                    Giá trị còn lại trước
                  </span>
                  <span className="chk-detail-value">
                    {fmtNum(selectedDet.remainingBefore)} VNĐ
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Giá trị còn lại sau</span>
                  <span
                    className="chk-detail-value"
                    style={{ fontWeight: 600, color: actionPrimary }}
                  >
                    {fmtNum(selectedDet.remainingAfter)} VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Box 3: Thông tin chi tiết khấu hao sau thay đổi */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <SlidersOutlined style={{ color: actionPrimary }} />
                  <span>3. Thông tin chi tiết khấu hao</span>
                </div>
              </div>
              <div className="chk-detail-grid">
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Ngày kê khai tài sản</span>
                  <span className="chk-detail-value">
                    {fmtDate(selectedDet.declarationDate)}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">
                    Tỷ lệ hao mòn/Khấu hao
                  </span>
                  <span className="chk-detail-value">
                    {selectedDet.depreciationRate}%
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Ngày tính khấu hao</span>
                  <span className="chk-detail-value">
                    {fmtDate(selectedDet.depreciationStartDate)}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">
                    Số tháng tính khấu hao
                  </span>
                  <span className="chk-detail-value">
                    {selectedDet.depreciationMonths} tháng
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Ngày hết khấu hao</span>
                  <span className="chk-detail-value">
                    {fmtDate(selectedDet.depreciationEndDate)}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Khấu hao lũy kế</span>
                  <span className="chk-detail-value">
                    {fmtNum(selectedDet.accumulatedDepreciation)} VNĐ
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Khấu hao tháng</span>
                  <span className="chk-detail-value">
                    {fmtNum(selectedDet.monthlyDepreciation)} VNĐ
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">
                    Hình thức xử lý tài sản
                  </span>
                  <span className="chk-detail-value">
                    {selectedDet.disposalMethod}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 4: Thông tin phê duyệt thay đổi nguyên giá */}
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <AuditOutlined style={{ color: actionPrimary }} />
                  <span>4. Thông tin phê duyệt điều chỉnh</span>
                </div>
              </div>
              <div className="chk-detail-grid">
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Ngày gửi phê duyệt</span>
                  <span className="chk-detail-value">
                    {fmtDateTime(selectedDet.submittedDate)}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Cán bộ gửi</span>
                  <span className="chk-detail-value">
                    {selectedDet.submittedBy}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">
                    Ngày phê duyệt Cảng vụ/Chi cục
                  </span>
                  <span className="chk-detail-value">
                    {fmtDateTime(selectedDet.approvedPortDate)}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">
                    Cán bộ phê duyệt Cảng vụ/Chi cục
                  </span>
                  <span className="chk-detail-value">
                    {selectedDet.approvedPortBy}
                  </span>
                </div>
                <div className="chk-detail-row chk-detail-row--full">
                  <span className="chk-detail-label">
                    Nội dung duyệt Cảng vụ/Chi cục
                  </span>
                  <span className="chk-detail-value">
                    {selectedDet.approvedPortContent}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Ngày phê duyệt Cục</span>
                  <span className="chk-detail-value">
                    {fmtDateTime(selectedDet.approvedDeptDate)}
                  </span>
                </div>
                <div className="chk-detail-row">
                  <span className="chk-detail-label">Cán bộ phê duyệt Cục</span>
                  <span className="chk-detail-value">
                    {selectedDet.approvedDeptBy}
                  </span>
                </div>
                <div className="chk-detail-row chk-detail-row--full">
                  <span className="chk-detail-label">Nội dung duyệt Cục</span>
                  <span className="chk-detail-value">
                    {selectedDet.approvedDeptContent}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
