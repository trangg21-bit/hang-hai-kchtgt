import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ScadaSystemAsset } from '../../services/scadaasset/types';
import type {
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import { AssetCondition, UsageStatus } from '../../constants/assetDropdown';
import {
  colors,
  fontWeightBold,
  fontWeightMedium,
  statusOperational,
  statusAttention,
  statusCritical,
} from '../../themetokenchk';
import {
  DynamicViewSidebar,
  ViewFieldType,
  type ViewTabConfig,
} from '../../components/shared/dynamic-view-sidebar';
import {
  CommonTable,
  TableColumnType,
  type TableOption,
  renderApprovalStatusBadge,
} from '../../components/shared/common-table';
import {
  getOrGenerateAttachmentBlob,
  getAttachmentPreviewUrl,
  downloadAttachmentFile,
} from '../../utils/attachmentStorage';

export interface ScadaSystemAssetDetailContentProps {
  open: boolean;
  selectedRecord?: ScadaSystemAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  scadaDeviceMap: Map<string, { deviceCode: string; deviceName: string }>;
  exploitationRows: AssetExploitationResponse[];
  increaseRows: AssetIncreaseResponse[];
  decreaseRows: AssetDecreaseResponse[];
  attachments?: InfrastructureAttachmentItem[];
}

const fmtDateTime = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—';
const fmtDate = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY') : '—';
const fmtNum = (v?: number | string | null): string => {
  if (v == null || v === '') return '—';
  const n = Number(v);
  return isNaN(n) ? String(v) : n.toLocaleString('vi-VN');
};

export default function ScadaSystemAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  scadaDeviceMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
  attachments,
}: ScadaSystemAssetDetailContentProps) {
  const [detailAttachments, setDetailAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  useEffect(() => {
    let initialList: InfrastructureAttachmentItem[];
    if (attachments && attachments.length > 0) {
      initialList = attachments;
    } else if (selectedRecord?.attachmentName && selectedRecord.attachmentName.trim()) {
      initialList = selectedRecord.attachmentName
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name, i) => ({
          id: `scada-att-${selectedRecord.id}-${i + 1}`,
          fileName: name,
          fileSize: 1024 * 1024 * (i + 1),
          uploadedAt: selectedRecord.updatedAt || selectedRecord.createdAt,
          uploadedByName:
            selectedRecord.updatedByName ||
            selectedRecord.submittedByName ||
            'Cán bộ cập nhật',
        }));
    } else {
      initialList = [
        {
          id: 'scada-sample-att-1',
          fileName: 'Quyet_dinh_dau_tu_he_thong_scada.pdf',
          fileSize: 2450000,
          uploadedAt: selectedRecord?.createdAt || new Date().toISOString(),
          uploadedByName: selectedRecord?.updatedByName || 'Cán bộ quản lý',
        },
        {
          id: 'scada-sample-att-2',
          fileName: 'Bien_ban_kiem_dinh_thiet_bi_scada.pdf',
          fileSize: 1820000,
          uploadedAt: selectedRecord?.createdAt || new Date().toISOString(),
          uploadedByName: selectedRecord?.updatedByName || 'Cán bộ quản lý',
        },
        {
          id: 'scada-sample-att-3',
          fileName: 'So_do_lap_dat_scada.png',
          fileSize: 3100000,
          uploadedAt: selectedRecord?.createdAt || new Date().toISOString(),
          uploadedByName: selectedRecord?.updatedByName || 'Cán bộ quản lý',
        },
      ];
    }
    let isMounted = true;
    Promise.all(
      initialList.map(async (item) => {
        try {
          const url = await getAttachmentPreviewUrl(item.fileName, {
            assetCode: selectedRecord?.assetCode,
            assetName: selectedRecord?.assetName,
          });
          return { id: item.id, url };
        } catch {
          return { id: item.id, url: undefined };
        }
      })
    ).then((resolved) => {
      if (!isMounted) return;
      setDetailAttachments(
        initialList.map((item) => {
          const match = resolved.find((r) => r.id === item.id);
          return match?.url ? { ...item, url: match.url } : item;
        })
      );
    });

    return () => {
      isMounted = false;
    };
  }, [attachments, selectedRecord]);

  const handleLoadReadonlyPreviewImage = useCallback(
    async (attachmentId: string) => {
      const att = detailAttachments.find((item) => item.id === attachmentId);
      if (!att) throw new Error('Không tìm thấy tệp');
      return await getOrGenerateAttachmentBlob(att.fileName, {
        assetCode: selectedRecord?.assetCode,
        assetName: selectedRecord?.assetName,
      });
    },
    [detailAttachments, selectedRecord?.assetCode, selectedRecord?.assetName]
  );

  const handleDownloadAttachment = useCallback(
    async (_id: string, fileName?: string) => {
      if (!fileName) return;
      await downloadAttachmentFile(fileName, {
        assetCode: selectedRecord?.assetCode,
        assetName: selectedRecord?.assetName,
      });
    },
    [selectedRecord?.assetCode, selectedRecord?.assetName]
  );

  const exploitationTableOption = useMemo<TableOption<AssetExploitationResponse>>(
    () => ({
      dataKey: 'id',
      hideActionColumn: true,
      enablePaging: false,
      bordered: true,
      scroll: { x: 'max-content', y: 350 },
      mainColumns: [
        {
          title: 'Đơn vị khai thác',
          dataIndex: 'operatorOrgUnitId',
          type: TableColumnType.Text,
          width: 220,
          render: (v) => (
            <span style={{ fontWeight: fontWeightBold }}>
              {orgName.get(v as string) || (v as string) || '—'}
            </span>
          ),
        },
        {
          title: 'Danh mục tài sản',
          dataIndex: 'assetCategory',
          type: TableColumnType.Text,
          width: 200,
          render: (v) => {
            const raw = (v as string) ?? '';
            if (!raw || (selectedRecord && raw === selectedRecord.assetName)) {
              return (
                [selectedRecord?.assetCode, selectedRecord?.assetName]
                  .filter(Boolean)
                  .join(' - ') ||
                raw ||
                '—'
              );
            }
            return raw;
          },
        },
        {
          title: 'Đơn vị tính',
          dataIndex: 'unitOfMeasure',
          type: TableColumnType.Text,
          width: 120,
        },
        {
          title: 'Số lượng',
          dataIndex: 'quantity',
          type: TableColumnType.NumberFormatted,
          width: 120,
          align: 'right',
        },
        {
          title: 'Thời hạn khai thác',
          dataIndex: 'exploitationDeadline',
          type: TableColumnType.Date,
          width: 160,
        },
        {
          title: 'Tổng tiền thu được (VNĐ)',
          dataIndex: 'totalRevenue',
          type: TableColumnType.Money,
          width: 200,
          align: 'right',
        },
        {
          title: 'Chi phí liên quan (VNĐ)',
          dataIndex: 'relatedCosts',
          type: TableColumnType.Money,
          width: 190,
          align: 'right',
        },
        {
          title: 'Nộp ngân sách nhà nước (VNĐ)',
          dataIndex: 'stateBudgetPayment',
          type: TableColumnType.Money,
          width: 220,
          align: 'right',
        },
        {
          title: 'Số tiền thực hiện dự án (VNĐ)',
          dataIndex: 'projectAmount',
          type: TableColumnType.Money,
          width: 220,
          align: 'right',
        },
        {
          title: 'Ghi chú',
          dataIndex: 'description',
          type: TableColumnType.Description,
          width: 200,
          render: (v, record) =>
            ((v as string) || (record.notes as string) || '—'),
        },
        {
          title: 'Ngày cập nhật',
          dataIndex: 'updatedAt',
          type: TableColumnType.Date,
          width: 140,
        },
      ],
    }),
    [orgName]
  );

  interface AdjustmentRowItem {
    id: string;
    adjustmentType: 'TANG' | 'GIAM';
    code?: string;
    decisionNumber?: string;
    decisionDate?: string;
    adjustmentDate?: string;
    adjustmentReason?: string;
    originalValueBefore?: number;
    originalValueAfter?: number;
    remainingValueBefore?: number;
    remainingValueAfter?: number;
    notes?: string;
    status?: string;
    [key: string]: unknown;
  }

  const combinedAdjustments = useMemo<AdjustmentRowItem[]>(() => {
    const list: AdjustmentRowItem[] = [];
    increaseRows.forEach((row) => {
      list.push({
        id: row.id,
        adjustmentType: 'TANG',
        code: row.increaseCode,
        decisionNumber: row.adjustmentDetails?.decisionNumber,
        decisionDate: row.adjustmentDetails?.decisionDate,
        adjustmentDate: row.adjustmentDetails?.adjustmentDate,
        adjustmentReason: row.adjustmentDetails?.adjustmentReason,
        originalValueBefore: row.adjustmentDetails?.originalValueBefore,
        originalValueAfter: row.adjustmentDetails?.originalValueAfter,
        remainingValueBefore: row.adjustmentDetails?.remainingValueBefore,
        remainingValueAfter: row.adjustmentDetails?.remainingValueAfter,
        notes: row.adjustmentDetails?.adjustmentNotes,
        status: row.status,
      });
    });
    decreaseRows.forEach((row) => {
      list.push({
        id: row.id,
        adjustmentType: 'GIAM',
        code: row.decreaseCode,
        decisionNumber: row.adjustmentDetails?.decisionNumber,
        decisionDate: row.adjustmentDetails?.decisionDate,
        adjustmentDate: row.adjustmentDetails?.adjustmentDate,
        adjustmentReason: row.adjustmentDetails?.adjustmentReason,
        originalValueBefore: row.adjustmentDetails?.originalValueBefore,
        originalValueAfter: row.adjustmentDetails?.originalValueAfter,
        remainingValueBefore: row.adjustmentDetails?.remainingValueBefore,
        remainingValueAfter: row.adjustmentDetails?.remainingValueAfter,
        notes: row.adjustmentDetails?.adjustmentNotes,
        status: row.status,
      });
    });
    return list;
  }, [increaseRows, decreaseRows]);

  const adjustmentTableOption = useMemo<TableOption<AdjustmentRowItem>>(
    () => ({
      dataKey: 'id',
      hideActionColumn: true,
      enablePaging: false,
      bordered: true,
      scroll: { x: 'max-content', y: 350 },
      mainColumns: [
        {
          title: 'Loại biến động',
          dataIndex: 'adjustmentType',
          type: TableColumnType.Template,
          width: 160,
          render: (_v, row) =>
            row.adjustmentType === 'TANG' ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: fontWeightMedium,
                  background: `${statusOperational}15`,
                  border: `1px solid ${statusOperational}40`,
                  color: statusOperational,
                }}
              >
                <PlusCircleOutlined /> Tăng nguyên giá
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: fontWeightMedium,
                  background: `${statusCritical}15`,
                  border: `1px solid ${statusCritical}40`,
                  color: statusCritical,
                }}
              >
                <MinusCircleOutlined /> Giảm nguyên giá
              </span>
            ),
        },
        {
          title: 'Mã yêu cầu',
          dataIndex: 'code',
          type: TableColumnType.Text,
          width: 160,
        },
        {
          title: 'Số quyết định',
          dataIndex: 'decisionNumber',
          type: TableColumnType.Text,
          width: 180,
        },
        {
          title: 'Ngày ra quyết định',
          dataIndex: 'decisionDate',
          type: TableColumnType.Date,
          width: 165,
        },
        {
          title: 'Ngày điều chỉnh',
          dataIndex: 'adjustmentDate',
          type: TableColumnType.Date,
          width: 150,
        },
        {
          title: 'Nguyên giá trước (VNĐ)',
          dataIndex: 'originalValueBefore',
          type: TableColumnType.Money,
          width: 200,
          align: 'right',
        },
        {
          title: 'Nguyên giá sau (VNĐ)',
          dataIndex: 'originalValueAfter',
          type: TableColumnType.Money,
          width: 190,
          align: 'right',
        },
        {
          title: 'Giá trị còn lại trước (VNĐ)',
          dataIndex: 'remainingValueBefore',
          type: TableColumnType.Money,
          width: 210,
          align: 'right',
        },
        {
          title: 'Giá trị còn lại sau (VNĐ)',
          dataIndex: 'remainingValueAfter',
          type: TableColumnType.Money,
          width: 200,
          align: 'right',
        },
        {
          title: 'Lý do điều chỉnh',
          dataIndex: 'adjustmentReason',
          type: TableColumnType.Text,
          width: 200,
        },
        {
          title: 'Ghi chú',
          dataIndex: 'notes',
          type: TableColumnType.Description,
          width: 200,
        },
        {
          title: 'Trạng thái',
          dataIndex: 'status',
          type: TableColumnType.Template,
          width: 140,
          render: (_v, row) => renderApprovalStatusBadge(row.status),
        },
      ],
    }),
    []
  );

  const tabs = useMemo<ViewTabConfig<ScadaSystemAsset>[]>(() => {
    if (!selectedRecord) return [];

    const scadaInfo = selectedRecord.scadaId
      ? scadaDeviceMap.get(selectedRecord.scadaId)
      : undefined;
    const scadaDisplay = scadaInfo
      ? `${scadaInfo.deviceCode} - ${scadaInfo.deviceName}`
      : selectedRecord.scadaCode
      ? `${selectedRecord.scadaCode} - ${selectedRecord.scadaName || ''}`
      : '—';

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        icon: <BankOutlined />,
        sections: [
          {
            key: 'org_info',
            title: 'Cơ quan & Tổ chức quản lý',
            fields: [
              {
                name: 'parentOrgUnitId',
                label: 'Cơ quan quản lý cấp trên',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) =>
                  selectedRecord.parentOrgUnitName ||
                  (v ? orgName.get(v as string) : undefined) ||
                  '—',
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) =>
                  selectedRecord.orgUnitName ||
                  (v ? orgName.get(v as string) : undefined) ||
                  '—',
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) =>
                  selectedRecord.usingOrgUnitName ||
                  (v ? orgName.get(v as string) : undefined) ||
                  '—',
              },
              {
                name: 'scadaId',
                label: 'Mã thiết bị',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: () => scadaDisplay,
              },
            ],
          },
          {
            key: 'asset_basic',
            title: 'Thông tin tài sản',
            fields: [
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: ViewFieldType.Badge,
                badgeColor: (val) => {
                  if (val === AssetCondition.DANG_SU_DUNG) return statusOperational;
                  if (val === AssetCondition.HONG_KHONG_SU_DUNG) return statusCritical;
                  return statusAttention;
                },
                colSpan: 12,
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: ViewFieldType.Badge,
                badgeColor: (val) =>
                  val === UsageStatus.QUAN_LY_NHA_NUOC || val === UsageStatus.HDSN_KHONG_KINH_DOANH
                    ? statusOperational
                    : statusAttention,
                colSpan: 12,
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assetSubgroup',
                label: 'Phân nhóm tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'origin',
                label: 'Nguồn gốc',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
            ],
          },
          {
            key: 'composite_indexes',
            title: 'Chỉ số tổng hợp',
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) =>
                  v != null
                    ? `${fmtNum(v as number)} ${selectedRecord.quantityUnit || ''}`
                    : '—',
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính số lượng',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'model',
                label: 'Model',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'serialNumber',
                label: 'Serial',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'constructionYear',
                label: 'Năm xây dựng',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'useDate',
                label: 'Ngày sử dụng tài sản',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDate(v as string),
              },
              {
                name: 'landArea',
                label: 'Diện tích (đất, sàn sử dụng: m²)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m²)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
            ],
          },
          {
            key: 'approval_info',
            title: 'Thông tin phê duyệt',
            icon: <AuditOutlined />,
            collapsible: true,
            defaultCollapsed: false,
            fields: [
              {
                label: 'Trạng thái phê duyệt',
                type: ViewFieldType.Badge,
                colSpan: 24,
                render: (_v, r) => renderApprovalStatusBadge(r?.approvalStatus as string),
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
                name: 'updatedAt',
                label: 'Ngày cập nhật',
                type: ViewFieldType.DateTime,
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'submittedByName',
                label: 'Cán bộ gửi phê duyệt',
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
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
                render: (val, r) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || (r as any)?.approvedLevel1ByName || '—')}
                  </span>
                ),
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.DateTime,
                value: (r) => r?.portAuthorityApprovedAt || (r as any)?.approvedLevel1At,
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
                colSpan: 24,
                value: (r) => r?.portAuthorityApprovalContent || (r as any)?.approvalContentLevel1,
              },
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
                render: (val, r) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || (r as any)?.approvedLevel2ByName || '—')}
                  </span>
                ),
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt cấp Cục',
                type: ViewFieldType.DateTime,
                value: (r) => r?.departmentApprovedAt || (r as any)?.approvedLevel2At,
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt cấp Cục',
                colSpan: 24,
                value: (r) => r?.departmentApprovalContent || (r as any)?.approvalContentLevel2,
              },
              {
                name: 'rejectionReason',
                label: 'Lý do từ chối',
                colSpan: 24,
                hidden: (r) => !(r as any)?.rejectionReason,
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
        key: 'attachments',
        label: 'Hồ sơ tài sản',
        badgeCount: detailAttachments.length,
        icon: <ProfileOutlined />,
        customContent: () => (
          <div style={{ padding: '8px 0' }}>
            <InfrastructureAttachmentTab
              attachments={detailAttachments}
              readonly
              onDownload={handleDownloadAttachment}
              loadReadonlyPreviewImage={handleLoadReadonlyPreviewImage}
            />
          </div>
        ),
      },
      {
        key: 'details',
        label: 'Thông tin chi tiết',
        icon: <SlidersOutlined />,
        sections: [
          {
            key: 'financial_info',
            title: 'Thông tin giá trị & Khấu hao tài sản',
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai tài sản',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDate(v as string),
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá (VNĐ)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => (v != null ? `${v}%` : '—'),
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại (VNĐ)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
              },
              {
                name: 'valueUnit',
                label: 'Đơn vị tính giá trị',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => (v as string) || 'VNĐ',
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao (bao gồm cả tăng vốn)',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'depreciationStartDate',
                label: 'Ngày tính khấu hao',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDate(v as string),
              },
              {
                name: 'depreciationMonths',
                label: 'Số tháng tính khấu hao',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => (v != null ? `${v} tháng` : '—'),
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDate(v as string),
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế (VNĐ)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
            ],
          },
        ],
      },
      {
        key: 'exploitation',
        label: 'Khai thác tài sản',
        badgeCount: exploitationRows.length,
        icon: <BankOutlined />,
        customContent: (
          <div style={{ padding: '4px 0' }}>
            <CommonTable<AssetExploitationResponse>
              options={exploitationTableOption}
              dataSource={exploitationRows}
              total={exploitationRows.length}
            />
          </div>
        ),
      },
      {
        key: 'adjustments',
        label: 'Lịch sử thay đổi nguyên giá',
        badgeCount: combinedAdjustments.length,
        icon: <AuditOutlined />,
        customContent: (
          <div style={{ padding: '4px 0' }}>
            <CommonTable<AdjustmentRowItem>
              options={adjustmentTableOption}
              dataSource={combinedAdjustments}
              total={combinedAdjustments.length}
            />
          </div>
        ),
      },
    ];
  }, [
    selectedRecord,
    orgName,
    scadaDeviceMap,
    exploitationRows,
    detailAttachments,
    handleDownloadAttachment,
    handleLoadReadonlyPreviewImage,
    exploitationTableOption,
    adjustmentTableOption,
    combinedAdjustments,
  ]);

  return (
    <DynamicViewSidebar<ScadaSystemAsset>
      open={open}
      title={
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 16 }}>
          Chi tiết tài sản HT SCADA — {selectedRecord?.assetName || ''}
        </span>
      }
      record={selectedRecord}
      tabs={tabs}
      onClose={onClose}
    />
  );
}
