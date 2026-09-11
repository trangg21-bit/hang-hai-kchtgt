import { useMemo } from 'react';
import {
  DeploymentUnitOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type {
  DaiTtdhAsset,
  DaiTtdhAssetExploitation,
  DaiTtdhAssetAdjustment,
} from '../../services/daiTtdhAsset/types';
import { fmtNum } from '../../utils/numFmt';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors,
  actionPrimary,
  textTertiary,
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
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
import CommonTable from '../../components/shared/common-table/CommonTable';
import {
  TableColumnType,
  type TableOption,
} from '../../components/shared/common-table/table.model';
import {
  fetchDaiTtdhAssetAttachments,
  downloadDaiTtdhAssetAttachment,
} from '../../services/daiTtdhAsset/api';
import { useAssetAttachments } from '../../hooks/useAssetAttachments';

export interface DaiTtdhAssetDetailContentProps {
  open: boolean;
  selectedRecord?: DaiTtdhAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  daiTtdhMap: Map<string, { code: string; name: string }>;
  exploitationRows: DaiTtdhAssetExploitation[];
  adjustmentRows: DaiTtdhAssetAdjustment[];
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
  fontSize: fontSizeMd,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL1: { color: '#0284C7', label: 'Chờ Cục duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã duyệt' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Cảng vụ từ chối' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Cục từ chối' },
};

export default function DaiTtdhAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  daiTtdhMap,
  exploitationRows,
  adjustmentRows,
}: DaiTtdhAssetDetailContentProps) {
  const r = selectedRecord;

  const { activeAttachments, handleDownloadDetail } = useAssetAttachments({
    record: r,
    fetchAttachments: fetchDaiTtdhAssetAttachments,
    downloadAttachment: downloadDaiTtdhAssetAttachment,
    attachmentUrlPrefix: '/v1/dai-ttdh',
    fallbackLabel: 'đài TTDH',
  });

  const exploitationTableOption = useMemo<TableOption<DaiTtdhAssetExploitation>>(
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
          render: (v) => (v as string) || r?.assetName || '—',
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
    [orgName, r?.assetName]
  );

  const adjustmentTableOption = useMemo<TableOption<DaiTtdhAssetAdjustment>>(
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
          type: TableColumnType.Status,
          width: 140,
          statusMapping: {
            DRAFT: { label: 'Lưu tạm', color: '#93A3B3' },
            CHO_PHE_DUYET: { label: 'Chờ duyệt', color: '#EDA100' },
            APPROVED: { label: 'Đã duyệt', color: '#1BAF7A' },
            REJECTED: { label: 'Từ chối', color: '#E34948' },
          },
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

  const viewTabs = useMemo<ViewTabConfig<DaiTtdhAsset>[]>(() => {
    if (!r) return [];

    const rawStatus = r.approvalStatus != null ? String(r.approvalStatus) : '';
    const approvalInfo = APPROVAL_MAP[rawStatus] ||
      APPROVAL_MAP[rawStatus.toUpperCase()] || {
        color: statusDraft,
        label: rawStatus || '—',
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
                label: 'Mã đài TTDH',
                value: (rec) =>
                  daiTtdhMap.get(rec.stationId || '')?.code || rec.stationCode || '—',
              },
              {
                label: 'Tên đài TTDH trực thuộc',
                value: (rec) =>
                  daiTtdhMap.get(rec.stationId || '')?.name || rec.stationName || '—',
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                render: (val) => String(val || 'Tài sản đài TTDH'),
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
                      fontWeight: fontWeightMedium,
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    {String(val || '—')}
                  </span>
                ),
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                render: (val) => (
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
                    {String(val || '—')}
                  </span>
                ),
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
                  val != null ? `${fmtNum(Number(val))} ${rec.quantityUnit || 'Bộ'}` : '—',
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
        key: 'exploitations',
        label: 'Khai thác tài sản',
        customContent: (
          <div style={{ padding: '4px 0' }}>
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <RocketOutlined style={{ color: actionPrimary }} />
                  <span>Danh sách khai thác tài sản đài TTDH ({exploitationRows.length})</span>
                </div>
              </div>
              <CommonTable
                options={exploitationTableOption as unknown as TableOption<Record<string, unknown>>}
                dataSource={exploitationRows as unknown as Record<string, unknown>[]}
                total={exploitationRows.length}
                page={1}
                pageSize={100}
                loading={false}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'adjustments',
        label: 'Tăng giảm tài sản',
        customContent: (
          <div style={{ padding: '4px 0' }}>
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <AuditOutlined style={{ color: actionPrimary }} />
                  <span>Lịch sử tăng / giảm nguyên giá ({adjustmentRows.length})</span>
                </div>
              </div>
              <CommonTable
                options={adjustmentTableOption as unknown as TableOption<Record<string, unknown>>}
                dataSource={adjustmentRows as unknown as Record<string, unknown>[]}
                total={adjustmentRows.length}
                page={1}
                pageSize={100}
                loading={false}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'approval',
        label: 'Thông tin phê duyệt',
        sections: [
          {
            key: 'approval_status_section',
            title: 'Trạng thái & Quyết định phê duyệt',
            icon: <AuditOutlined />,
            fields: [
              {
                label: 'Trạng thái phê duyệt',
                render: () => (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 12px',
                      borderRadius: 999,
                      fontWeight: fontWeightBold,
                      fontSize: 13,
                      color: approvalInfo.color,
                      backgroundColor: `${approvalInfo.color}15`,
                      border: `1px solid ${approvalInfo.color}40`,
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
                label: 'Cán bộ gửi phê duyệt',
                value: (rec) => rec.submittedByName || '—',
              },
              {
                label: 'Ngày gửi phê duyệt',
                value: (rec) =>
                  rec.submittedAt
                    ? dayjs(rec.submittedAt).format('DD/MM/YYYY HH:mm')
                    : '—',
              },
              {
                label: 'Cán bộ phê duyệt Cảng vụ/Chi cục',
                value: (rec) => rec.portAuthorityApprovedByName || '—',
              },
              {
                label: 'Ngày Cảng vụ/Chi cục duyệt',
                value: (rec) =>
                  rec.portAuthorityApprovedAt
                    ? dayjs(rec.portAuthorityApprovedAt).format('DD/MM/YYYY HH:mm')
                    : '—',
              },
              {
                label: 'Nội dung Cảng vụ duyệt',
                value: (rec) => rec.portAuthorityApprovalContent || '—',
                colSpan: 24,
              },
              {
                label: 'Cán bộ phê duyệt Cục',
                value: (rec) => rec.departmentApprovedByName || '—',
              },
              {
                label: 'Ngày Cục duyệt',
                value: (rec) =>
                  rec.departmentApprovedAt
                    ? dayjs(rec.departmentApprovedAt).format('DD/MM/YYYY HH:mm')
                    : '—',
              },
              {
                label: 'Nội dung Cục duyệt',
                value: (rec) => rec.departmentApprovalContent || '—',
                colSpan: 24,
              },
              {
                label: 'Lý do từ chối (nếu có)',
                value: (rec) => rec.rejectionReason || '—',
                colSpan: 24,
              },
              {
                label: 'Cán bộ cập nhật cuối',
                value: (rec) => rec.updatedByName || '—',
              },
              {
                label: 'Ngày cập nhật cuối',
                value: (rec) =>
                  rec.updatedAt
                    ? dayjs(rec.updatedAt).format('DD/MM/YYYY HH:mm')
                    : '—',
              },
            ],
          },
        ],
      },
    ];
  }, [
    r,
    orgName,
    daiTtdhMap,
    activeAttachments,
    exploitationRows,
    exploitationTableOption,
    adjustmentRows,
    adjustmentTableOption,
  ]);

  return (
    <DynamicViewSidebar<DaiTtdhAsset>
      open={open}
      title={
        <span>
          Xem chi tiết tài sản đài TTDH —{' '}
          <span style={{ color: colors.sidebarBg }}>
            {r?.assetName || '—'}
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
      width={
        typeof window !== 'undefined'
          ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
          : 1000
      }
      rootClassName="daittdh-asset-view-drawer"
      className="daittdh-asset-view-drawer"
    />
  );
}
