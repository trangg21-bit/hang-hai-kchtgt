import { useMemo } from 'react';
import {
  BankOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import type {
  InmarsatAsset,
  InmarsatAssetExploitation,
  InmarsatAssetAdjustment,
} from '../../services/inmarsatAsset/types';
import { fmtNum } from '../../utils/numFmt';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors,
  fontWeightBold,
  statusCritical,
  textTertiary,
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
} from '../../components/shared/common-table';
import {
  fetchInmarsatAssetAttachments,
  downloadInmarsatAssetAttachment,
} from '../../services/inmarsatAsset/api';
import { useAssetAttachments } from '../../hooks/useAssetAttachments';

export interface InmarsatAssetDetailContentProps {
  open: boolean;
  selectedRecord?: InmarsatAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  inmarsatMap: Map<string, { code: string; name: string }>;
  exploitationRows: InmarsatAssetExploitation[];
  adjustmentRows: InmarsatAssetAdjustment[];
}

export default function InmarsatAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  inmarsatMap,
  exploitationRows,
  adjustmentRows,
}: InmarsatAssetDetailContentProps) {
  const r = selectedRecord;

  const { activeAttachments, handleDownloadDetail } = useAssetAttachments({
    record: r,
    fetchAttachments: fetchInmarsatAssetAttachments,
    downloadAttachment: downloadInmarsatAssetAttachment,
    attachmentUrlPrefix: '/v1/asset/coastal-station-assets',
    fallbackLabel: 'đài Inmarsat',
  });

  const exploitationTableOption = useMemo<TableOption<InmarsatAssetExploitation>>(
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
              {orgName.get(v as string) || ''}
            </span>
          ),
        },
        {
          title: 'Danh mục tài sản',
          dataIndex: 'assetCategory',
          type: TableColumnType.Text,
          width: 200,
          render: (v) => (v as string) ?? '',
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

  const adjustmentTableOption = useMemo<TableOption<InmarsatAssetAdjustment>>(
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

  const viewTabs = useMemo<ViewTabConfig<InmarsatAsset>[]>(() => {
    if (!r) return [];

    const approvalInfo = r.approvalStatus
      ? (APPROVAL_MAP[r.approvalStatus.toUpperCase()] ?? {
          color: textTertiary,
          label: r.approvalStatus,
        })
      : {
          color: textTertiary,
          label: '',
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
                render: (val) =>
                  val ? (
                    <span
                      style={{
                        fontWeight: fontWeightBold,
                        color: colors.sidebarBg,
                      }}
                    >
                      {String(val)}
                    </span>
                  ) : '',
              },
              {
                label: 'Cơ quan quản lý cấp trên',
                value: (rec) => (rec.parentOrgUnitId ? (orgName.get(rec.parentOrgUnitId) ?? '') : ''),
              },
              {
                label: 'Đơn vị quản lý',
                render: (_v, rec) =>
                  rec.orgUnitId && orgName.get(rec.orgUnitId) ? (
                    <span style={{ fontWeight: fontWeightBold }}>
                      {orgName.get(rec.orgUnitId)}
                    </span>
                  ) : '',
              },
              {
                label: 'Đơn vị sử dụng',
                render: (_v, rec) =>
                  rec.usingOrgUnitId && orgName.get(rec.usingOrgUnitId) ? (
                    <span style={{ fontWeight: fontWeightBold }}>
                      {orgName.get(rec.usingOrgUnitId)}
                    </span>
                  ) : '',
              },
              {
                label: 'Mã đài Inmarsat',
                value: (rec) =>
                  (rec.stationId ? inmarsatMap.get(rec.stationId)?.code : undefined) ?? rec.stationCode ?? '',
              },
              {
                label: 'Tên đài Inmarsat trực thuộc',
                value: (rec) =>
                  (rec.stationId ? inmarsatMap.get(rec.stationId)?.name : undefined) ?? rec.stationName ?? '',
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                render: (val) => (val ? String(val) : ''),
              },
              {
                name: 'barcode',
                label: 'Barcode',
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                render: (val) =>
                  val ? (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: fontWeightMedium,
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                      }}
                    >
                      {String(val)}
                    </span>
                  ) : '',
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                render: (val) =>
                  val ? (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: fontWeightMedium,
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      {String(val)}
                    </span>
                  ) : '',
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
                  val != null && String(val).trim() !== ''
                    ? `${fmtNum(Number(val))} ${rec.quantityUnit || 'Bộ'}`
                    : '',
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
                render: (val) =>
                  val != null && String(val).trim() !== '' ? `${fmtNum(Number(val))} m²` : '',
              },
              {
                name: 'floorArea',
                label: 'Diện tích sàn sử dụng (m²)',
                render: (val) =>
                  val != null && String(val).trim() !== '' ? `${fmtNum(Number(val))} m²` : '',
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
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
                value: () => approvalInfo.label,
                badgeColor: () => approvalInfo.color,
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
        key: 'exploitation',
        label: 'Khai thác tài sản',
        badgeCount: exploitationRows.length,
        icon: <BankOutlined />,
        customContent: (
          <div style={{ padding: '4px 0' }}>
            <CommonTable<InmarsatAssetExploitation>
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
            <CommonTable<InmarsatAssetAdjustment>
              options={adjustmentTableOption}
              dataSource={adjustmentRows}
              total={adjustmentRows.length}
            />
          </div>
        ),
      },
    ];
  }, [
    r,
    orgName,
    inmarsatMap,
    activeAttachments,
    exploitationRows,
    exploitationTableOption,
    adjustmentRows,
    adjustmentTableOption,
    handleDownloadDetail,
  ]);

  return (
    <DynamicViewSidebar<InmarsatAsset>
      open={open}
      title={
        <span>
          Xem chi tiết tài sản đài Inmarsat —{' '}
          <span style={{ color: colors.sidebarBg }}>
            {r?.assetName || ''}
          </span>
          {r?.assetCode && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 13,
                color: textTertiary,
                fontWeight: 'normal',
              }}
            >
              ({r.assetCode})
            </span>
          )}
        </span>
      }
      onClose={onClose}
      record={r}
      tabs={viewTabs}
      rootClassName="inmarsat-asset-view-drawer"
      className="inmarsat-asset-view-drawer"
    />
  );
}
