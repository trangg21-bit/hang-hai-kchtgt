import { useMemo } from 'react';
import {
  BankOutlined,
  DeploymentUnitOutlined,
  SlidersOutlined,
  AuditOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import type {
  TransmissionAsset,
  TransmissionAssetExploitation,
  TransmissionAssetAdjustment,
} from '../../services/transmissionAsset/types';
import { fmtNum } from '../../utils/numFmt';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors,
  actionPrimary,
  fontWeightBold,
  fontWeightMedium,
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  radiusPill,
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
  APPROVAL_MAP,
  renderApprovalStatusBadge,
} from '../../components/shared/common-table';
import {
  fetchTransmissionAssetAttachments,
  downloadTransmissionAssetAttachment,
} from '../../services/transmissionAsset/api';
import { useAssetAttachments } from '../../hooks/useAssetAttachments';

export interface TransmissionAssetDetailContentProps {
  open: boolean;
  selectedRecord?: TransmissionAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  transmissionMap: Map<string, { code: string; name: string }>;
  exploitationRows: TransmissionAssetExploitation[];
  adjustmentRows: TransmissionAssetAdjustment[];
  attachments?: InfrastructureAttachmentItem[];
  onDownloadAttachment?: (id: string, fileName: string) => void;
}

export { renderApprovalStatusBadge };

export default function TransmissionAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  transmissionMap,
  exploitationRows,
  adjustmentRows,
  attachments: propAttachments,
  onDownloadAttachment,
}: TransmissionAssetDetailContentProps) {
  const r = selectedRecord;

  const { activeAttachments, handleDownloadDetail } = useAssetAttachments({
    record: r,
    fetchAttachments: fetchTransmissionAssetAttachments,
    downloadAttachment: downloadTransmissionAssetAttachment,
    attachmentUrlPrefix: '/v1/asset/transmission-assets',
    propAttachments,
    onDownloadAttachment,
    fallbackLabel: 'hệ thống truyền dẫn',
  });

  const exploitationTableOption = useMemo<TableOption<TransmissionAssetExploitation>>(
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
              {orgName.get(v as string) || '—'}
            </span>
          ),
        },
        {
          title: 'Danh mục tài sản',
          dataIndex: 'assetCategory',
          type: TableColumnType.Text,
          width: 200,
          render: (v) => (v as string) ?? '—',
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
          dataIndex: 'notes',
          type: TableColumnType.Description,
          width: 200,
        },
        {
          title: 'Ngày cập nhật',
          dataIndex: 'createdAt',
          type: TableColumnType.Date,
          width: 140,
        },
      ],
    }),
    [orgName]
  );

  const adjustmentTableOption = useMemo<TableOption<TransmissionAssetAdjustment>>(
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
            row.adjustmentType === 'TANG' || row.adjustmentType === 'INCREASE' ? (
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
          type: TableColumnType.Description,
          width: 200,
        },
        {
          title: 'Ghi chú',
          dataIndex: 'notes',
          type: TableColumnType.Description,
          width: 180,
        },
        {
          title: 'Trạng thái',
          dataIndex: 'status',
          type: TableColumnType.Template,
          width: 140,
          render: (_v, row) => renderApprovalStatusBadge(row.status),
        },
        {
          title: 'Ngày cập nhật',
          dataIndex: 'createdAt',
          type: TableColumnType.Date,
          width: 140,
        },
      ],
    }),
    []
  );

  const viewTabs = useMemo<ViewTabConfig<TransmissionAsset>[]>(() => {
    if (!r) return [];

    const approvalInfo = r.approvalStatus
      ? (APPROVAL_MAP[r.approvalStatus.toUpperCase()] ?? {
          color: textTertiary,
          label: r.approvalStatus,
        })
      : {
          color: textTertiary,
          label: '—',
        };

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'basic_info',
            title: 'Thông tin cơ bản & Quản lý vận hành',
            icon: <DeploymentUnitOutlined />,
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
                value: (rec) => (rec.parentOrgUnitId ? (orgName.get(rec.parentOrgUnitId) ?? '—') : '—'),
              },
              {
                label: 'Đơn vị quản lý',
                render: (_v, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {rec.orgUnitId ? (orgName.get(rec.orgUnitId) ?? '—') : '—'}
                  </span>
                ),
              },
              {
                label: 'Đơn vị sử dụng',
                render: (_v, rec) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {rec.usingOrgUnitId ? (orgName.get(rec.usingOrgUnitId) ?? '—') : '—'}
                  </span>
                ),
              },
              {
                label: 'Mã thiết bị',
                value: (rec) =>
                  (rec.transmissionId ? transmissionMap.get(rec.transmissionId)?.code : undefined) ?? '—',
              },
              {
                label: 'Tên hệ thống truyền dẫn',
                value: (rec) =>
                  (rec.transmissionId ? transmissionMap.get(rec.transmissionId)?.name : undefined) ?? '—',
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                render: (val) => (val ? String(val) : '—'),
              },
              {
                name: 'barcode',
                label: 'Barcode',
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                render: (val) => (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        val === 'Tốt'
                          ? `${statusOperational}18`
                          : `${statusAttention}18`,
                      color:
                        val === 'Tốt' ? statusOperational : statusAttention,
                    }}
                  >
                    {val ? String(val) : '—'}
                  </span>
                ),
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
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
            key: 'summary_indicators',
            title: 'Chỉ số tổng hợp & Kỹ thuật',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                render: (val, rec) =>
                  `${val != null ? fmtNum(Number(val)) : '—'} ${rec.quantityUnit || ''}`.trim(),
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
                label: 'Năm xây dựng / trang bị',
              },
              {
                name: 'useDate',
                label: 'Ngày sử dụng tài sản',
                type: ViewFieldType.Date,
              },
              {
                name: 'landArea',
                label: 'Diện tích đất (m²)',
                render: (val) => (val != null ? `${fmtNum(Number(val))} m²` : '—'),
              },
              {
                name: 'floorArea',
                label: 'Diện tích sàn sử dụng (m²)',
                render: (val) => (val != null ? `${fmtNum(Number(val))} m²` : '—'),
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
        key: 'attachments',
        label: 'Hồ sơ tài sản',
        customContent: (
          <div style={{ padding: '4px 0' }}>
            <InfrastructureAttachmentTab
              attachments={activeAttachments}
              readonly={true}
              onUpload={() => {}}
              onDelete={() => {}}
              onDownload={handleDownloadDetail}
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
            title: 'Giá trị tài sản & Khấu hao hao mòn',
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
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold, color: actionPrimary }}>
                    {val != null ? `${fmtNum(Number(val))} VNĐ` : '—'}
                  </span>
                ),
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/khấu hao (%)',
                render: (val) => (val != null ? `${val}%` : '—'),
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại (VNĐ)',
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold, color: statusOperational }}>
                    {val != null ? `${fmtNum(Number(val))} VNĐ` : '—'}
                  </span>
                ),
              },
              {
                label: 'Đơn vị tính giá trị',
                render: () => 'VNĐ',
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
                label: 'Khấu hao lũy kế (VNĐ)',
                render: (val) => (val != null ? `${fmtNum(Number(val))} VNĐ` : '—'),
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                render: (val) => (val != null ? `${fmtNum(Number(val))} VNĐ` : '—'),
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
            <CommonTable<TransmissionAssetExploitation>
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
        badgeCount: adjustmentRows.length,
        icon: <AuditOutlined />,
        customContent: (
          <div style={{ padding: '4px 0' }}>
            <CommonTable<TransmissionAssetAdjustment>
              options={adjustmentTableOption}
              dataSource={adjustmentRows}
              total={adjustmentRows.length}
            />
          </div>
        ),
      },
      {
        key: 'tracking',
        label: 'Xử lý & theo dõi',
        sections: [
          {
            key: 'tracking_info',
            title: 'Trạng thái & Lịch sử xử lý hồ sơ',
            icon: <AuditOutlined />,
            fields: [
              {
                label: 'Trạng thái phê duyệt',
                colSpan: 24,
                render: () => (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 12px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      background: `${approvalInfo.color}18`,
                      color: approvalInfo.color,
                      border: `1px solid ${approvalInfo.color}40`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: approvalInfo.color,
                      }}
                    />
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
                type: ViewFieldType.Date,
              },
              {
                name: 'submittedByName',
                label: 'Cán bộ gửi phê duyệt',
              },
              {
                name: 'submittedAt',
                label: 'Ngày gửi phê duyệt',
                type: ViewFieldType.Date,
              },
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Date,
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
                colSpan: 24,
              },
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt cấp Cục',
                type: ViewFieldType.Date,
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt cấp Cục',
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
    transmissionMap,
    activeAttachments,
    handleDownloadDetail,
    exploitationRows,
    adjustmentRows,
    exploitationTableOption,
    adjustmentTableOption,
  ]);

  return (
    <DynamicViewSidebar<TransmissionAsset>
      open={open}
      onClose={onClose}
      record={r}
      title={`Chi tiết tài sản HT truyền dẫn — ${r?.assetName || ''}`}
      tabs={viewTabs}
      rootClassName="transmission-asset-view-drawer"
      className="transmission-asset-view-drawer"
    />
  );
}
