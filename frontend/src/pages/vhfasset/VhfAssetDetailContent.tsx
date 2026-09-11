import { useMemo } from 'react';
import {
  ApiOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import type {
  VhfAsset,
  VhfAssetExploitation,
  VhfAssetAdjustment,
} from '../../services/vhfAsset/types';
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
  fetchVhfAssetAttachments,
  downloadVhfAssetAttachment,
} from '../../services/vhfAsset/api';
import { useAssetAttachments } from '../../hooks/useAssetAttachments';

export interface VhfAssetDetailContentProps {
  open: boolean;
  selectedRecord?: VhfAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  transmissionMap: Map<string, { code: string; name: string }>;
  exploitationRows: VhfAssetExploitation[];
  adjustmentRows: VhfAssetAdjustment[];
  attachments?: InfrastructureAttachmentItem[];
  onDownloadAttachment?: (id: string, fileName: string) => void;
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

export default function VhfAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  transmissionMap,
  exploitationRows,
  adjustmentRows,
  attachments: propAttachments,
  onDownloadAttachment,
}: VhfAssetDetailContentProps) {
  const r = selectedRecord;

  const { activeAttachments, handleDownloadDetail } = useAssetAttachments({
    record: r,
    fetchAttachments: fetchVhfAssetAttachments,
    downloadAttachment: downloadVhfAssetAttachment,
    attachmentUrlPrefix: '/v1/asset/transmission-assets',
    propAttachments,
    onDownloadAttachment,
    fallbackLabel: 'HTTT liên lạc VHF',
  });

  const exploitationTableOption = useMemo<TableOption<VhfAssetExploitation>>(
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

  const adjustmentTableOption = useMemo<TableOption<VhfAssetAdjustment>>(
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
          type: TableColumnType.Text,
          width: 180,
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
          width: 150,
          render: (val) => {
            const s = String(val || 'DRAFT').toUpperCase();
            const isApproved = s === 'APPROVED' || s === 'DA_DUYET';
            const color = isApproved ? statusOperational : statusAttention;
            return (
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: fontWeightMedium,
                  background: `${color}15`,
                  border: `1px solid ${color}40`,
                  color,
                }}
              >
                {isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
              </span>
            );
          },
        },
        {
          title: 'Ngày lập',
          dataIndex: 'createdAt',
          type: TableColumnType.Date,
          width: 130,
        },
      ],
    }),
    []
  );

  const viewTabs = useMemo<ViewTabConfig<VhfAsset>[]>(() => {
    if (!r) return [];

    const approvalStatusKey = (r.approvalStatus || 'DRAFT').toUpperCase();
    const approvalInfo = APPROVAL_MAP[approvalStatusKey] || {
      color: textTertiary,
      label: r.approvalStatus || '—',
    };

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'basic_info',
            title: 'Thông tin cơ bản & Quản lý vận hành',
            icon: <ApiOutlined />,
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
                label: 'Mã thiết bị',
                value: (rec) =>
                  transmissionMap.get(rec.transmissionId || '')?.code || '—',
              },
              {
                label: 'Tên thiết bị VHF / truyền dẫn',
                value: (rec) =>
                  transmissionMap.get(rec.transmissionId || '')?.name || '—',
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                render: (val) => String(val || 'Tài sản HTTT liên lạc VHF'),
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
                    {String(val || 'Tốt')}
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
            key: 'tech_info',
            title: 'Chỉ số tổng hợp & Kỹ thuật',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                render: (val, rec) => `${fmtNum(Number(val) || 0)} ${rec.quantityUnit || 'Bộ'}`,
              },
              {
                name: 'model',
                label: 'Model',
              },
              {
                name: 'serialNumber',
                label: 'Số Serial',
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
                label: 'Ngày sử dụng',
                type: ViewFieldType.Date,
              },
              {
                name: 'landArea',
                label: 'Diện tích đất (m²)',
                type: ViewFieldType.Number,
                suffix: 'm²',
              },
              {
                name: 'floorArea',
                label: 'Diện tích sàn (m²)',
                type: ViewFieldType.Number,
                suffix: 'm²',
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
        label: `Hồ sơ tài sản (${activeAttachments.length})`,
        customContent: (
          <div style={{ padding: '0 4px', marginBottom: 12 }}>
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
        key: 'depreciation',
        label: 'Giá trị & Khấu hao',
        sections: [
          {
            key: 'depreciation_section',
            title: 'Thông tin nguyên giá & Khấu hao tài sản',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai',
                type: ViewFieldType.Date,
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá',
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold, color: actionPrimary }}>
                    {fmtNum(Number(val) || 0)} VNĐ
                  </span>
                ),
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/khấu hao',
                render: (val) => `${val ?? 0} %`,
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế',
                render: (val) => `${fmtNum(Number(val) || 0)} VNĐ`,
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại',
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold, color: statusOperational }}>
                    {fmtNum(Number(val) || 0)} VNĐ
                  </span>
                ),
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
                render: (val) => (val ? `${val} tháng` : '—'),
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: ViewFieldType.Date,
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng',
                render: (val) => `${fmtNum(Number(val) || 0)} VNĐ`,
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý',
              },
            ],
          },
        ],
      },
      {
        key: 'exploitation',
        label: `Khai thác tài sản (${exploitationRows.length})`,
        customContent: (
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <span style={sectionTitleStyle}>
                <RocketOutlined /> Danh sách theo dõi khai thác tài sản
              </span>
              <span style={{ fontSize: 13, color: textTertiary }}>
                Tổng số: <strong>{exploitationRows.length}</strong> bản ghi
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <CommonTable<VhfAssetExploitation>
                options={exploitationTableOption}
                dataSource={exploitationRows}
                total={exploitationRows.length}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'adjustment',
        label: `Biến động tài sản (${adjustmentRows.length})`,
        customContent: (
          <div style={sectionBoxStyle}>
            <div style={sectionHeaderStyle}>
              <span style={sectionTitleStyle}>
                <SlidersOutlined /> Lịch sử điều chỉnh tăng/giảm nguyên giá
              </span>
              <span style={{ fontSize: 13, color: textTertiary }}>
                Tổng số: <strong>{adjustmentRows.length}</strong> lần điều chỉnh
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <CommonTable<VhfAssetAdjustment>
                options={adjustmentTableOption}
                dataSource={adjustmentRows}
                total={adjustmentRows.length}
              />
            </div>
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
                label: 'Trạng thái',
                render: () => (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      background: `${approvalInfo.color}18`,
                      color: approvalInfo.color,
                      border: `1px solid ${approvalInfo.color}40`,
                    }}
                  >
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
    exploitationRows,
    adjustmentRows,
    exploitationTableOption,
    adjustmentTableOption,
  ]);

  return (
    <DynamicViewSidebar<VhfAsset>
      open={open}
      onClose={onClose}
      record={r}
      title={`Chi tiết tài sản HTTT liên lạc VHF — ${r?.assetName || ''}`}
      tabs={viewTabs}
      width={
        typeof window !== 'undefined'
          ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
          : 1000
      }
      rootClassName="vhf-asset-view-drawer"
      className="vhf-asset-view-drawer"
    />
  );
}
