import {
  AuditOutlined,
  BankOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  ProfileOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CommonTable,
  TableColumnType,
  type TableOption,
  renderApprovalStatusBadge,
} from '../../components/shared/common-table';
import {
  DynamicViewSidebar,
  ViewFieldType,
  type ViewTabConfig,
} from '../../components/shared/dynamic-view-sidebar';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import AssetAdjustmentHistoryTab from '../../components/shared/AssetAdjustmentHistoryTab';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
} from '../../services/assetmovement/types';
import type { VtsSystemAsset } from '../../services/vtsasset/types';
import { AssetCondition, UsageStatus } from '../../constants/assetDropdown';
import {
  colors,
  fontWeightBold,
  fontWeightMedium,
  statusAttention,
  statusCritical,
  statusOperational,
} from '../../themetokenchk';
import {
  downloadAttachmentFile,
  getAttachmentPreviewUrl,
  getOrGenerateAttachmentBlob,
} from '../../utils/attachmentStorage';

export { renderApprovalStatusBadge };

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

const fmtDateTime = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—';


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
  const [detailAttachments, setDetailAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  useEffect(() => {
    const names = r?.attachmentName
      ? r.attachmentName.split(',').map((name) => name.trim()).filter(Boolean)
      : [];
    let isMounted = true;

    const initialItems: InfrastructureAttachmentItem[] = names.map((name, i) => ({
      id: `vts-detail-att-${i}`,
      fileName: name,
      fileSize: 1024 * 1024,
      uploadedByName: r?.updatedByName || r?.submittedByName || 'Cán bộ quản lý',
      uploadedAt: r?.updatedAt || r?.createdAt || new Date().toISOString(),
    }));
    setDetailAttachments(initialItems);

    Promise.all(
      names.map(async (name, i) => {
        try {
          const url = await getAttachmentPreviewUrl(name, {
            assetCode: r?.assetCode,
            assetName: r?.assetName,
          });
          return { id: `vts-detail-att-${i}`, url };
        } catch {
          return { id: `vts-detail-att-${i}`, url: undefined };
        }
      })
    ).then((resolved) => {
      if (!isMounted) return;
      setDetailAttachments(
        initialItems.map((item) => {
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
            if (!raw || (r && raw === r.assetName)) {
              return (
                [r?.assetCode, r?.assetName]
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

  interface AdjustmentRowItem extends Record<string, unknown> {
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
                  val === AssetCondition.DANG_SU_DUNG
                    ? statusOperational
                    : val === AssetCondition.HONG_KHONG_SU_DUNG
                      ? statusCritical
                      : statusAttention,
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: ViewFieldType.Badge,
                badgeColor: (val) =>
                  val === UsageStatus.QUAN_LY_NHA_NUOC ||
                  val === UsageStatus.HDSN_KHONG_KINH_DOANH
                    ? statusOperational
                    : statusAttention,
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
                render: (_v, rec) => renderApprovalStatusBadge(rec?.approvalStatus as string),
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
                render: (val, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || (rec as any)?.approvedLevel1ByName || '—')}
                  </span>
                ),
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.DateTime,
                value: (rec) => rec?.portAuthorityApprovedAt || (rec as any)?.approvedLevel1At,
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
                colSpan: 24,
                value: (rec) => rec?.portAuthorityApprovalContent || (rec as any)?.approvalContentLevel1,
              },
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
                render: (val, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || (rec as any)?.approvedLevel2ByName || '—')}
                  </span>
                ),
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt cấp Cục',
                type: ViewFieldType.DateTime,
                value: (rec) => rec?.departmentApprovedAt || (rec as any)?.approvedLevel2At,
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt cấp Cục',
                colSpan: 24,
                value: (rec) => rec?.departmentApprovalContent || (rec as any)?.approvalContentLevel2,
              },
              {
                name: 'rejectionReason',
                label: 'Lý do từ chối',
                colSpan: 24,
                hidden: (rec) => !(rec as any)?.rejectionReason,
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
        customContent: <AssetAdjustmentHistoryTab dataSource={combinedAdjustments} />,
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
    />
  );
}
