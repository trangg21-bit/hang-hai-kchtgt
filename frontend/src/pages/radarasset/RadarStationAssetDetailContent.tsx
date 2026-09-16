import {
  AuditOutlined,
  BankOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  ProfileOutlined,
  RocketOutlined,
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
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
} from '../../services/assetmovement/types';
import type { RadarStationAsset } from '../../services/radarasset/types';
import {
  colors,
  fontWeightBold,
  fontWeightMedium,
  statusCritical,
  statusOperational,
} from '../../themetokenchk';
import {
  downloadAttachmentFile,
  getAttachmentPreviewUrl,
  getOrGenerateAttachmentBlob,
} from '../../utils/attachmentStorage';
import { fmtNum } from '../../utils/numFmt';

export interface RadarStationAssetDetailContentProps {
  open: boolean;
  selectedRecord?: RadarStationAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  radarStationMap: Map<string, { code: string; name: string }>;
  exploitationRows: AssetExploitationResponse[];
  increaseRows: AssetIncreaseResponse[];
  decreaseRows: AssetDecreaseResponse[];
}


export { renderApprovalStatusBadge };

const fmtDateTime = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—';
const fmtDate = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY') : '—';

export default function RadarStationAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  radarStationMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: RadarStationAssetDetailContentProps) {
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  useEffect(() => {
    const names = selectedRecord?.attachmentName
      ? selectedRecord.attachmentName.split(',').map((name) => name.trim()).filter(Boolean)
      : [];
    let isMounted = true;

    const initialItems: InfrastructureAttachmentItem[] = names.map((name, i) => ({
      id: `att-${i + 1}`,
      fileName: name,
      fileSize: 1024 * 1024,
      uploadedAt: selectedRecord?.createdAt,
      uploadedByName: selectedRecord?.createdByName || 'Cán bộ cập nhật',
    }));

    Promise.all(
      names.map(async (name, i) => {
        try {
          const url = await getAttachmentPreviewUrl(name, {
            assetCode: selectedRecord?.assetCode,
            assetName: selectedRecord?.assetName,
          });
          return { id: `att-${i + 1}`, url };
        } catch {
          return { id: `att-${i + 1}`, url: undefined };
        }
      })
    ).then((resolved) => {
      if (!isMounted) return;
      setAttachments(
        initialItems.map((item) => {
          const match = resolved.find((r) => r.id === item.id);
          return match?.url ? { ...item, url: match.url } : item;
        })
      );
    });

    return () => {
      isMounted = false;
    };
  }, [selectedRecord]);

  const handleLoadReadonlyPreviewImage = useCallback(
    async (attachmentId: string) => {
      const att = attachments.find((item) => item.id === attachmentId);
      if (!att) throw new Error('Không tìm thấy tệp');
      return await getOrGenerateAttachmentBlob(att.fileName, {
        assetCode: selectedRecord?.assetCode,
        assetName: selectedRecord?.assetName,
      });
    },
    [attachments, selectedRecord?.assetCode, selectedRecord?.assetName]
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
          render: (v) => (v as string) || selectedRecord?.assetName || '—',
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
        },
        {
          title: 'Ngày cập nhật',
          dataIndex: 'updatedAt',
          type: TableColumnType.Date,
          width: 140,
        },
      ],
    }),
    [orgName, selectedRecord?.assetName]
  );

  interface AdjustmentRowItem {
    [key: string]: unknown;
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
    increaseRows.forEach((r) => {
      list.push({
        id: r.id,
        adjustmentType: 'TANG',
        code: r.increaseCode,
        decisionNumber: r.adjustmentDetails?.decisionNumber,
        decisionDate: r.adjustmentDetails?.decisionDate,
        adjustmentDate: r.adjustmentDetails?.adjustmentDate,
        adjustmentReason: r.adjustmentDetails?.adjustmentReason,
        originalValueBefore: r.adjustmentDetails?.originalValueBefore,
        originalValueAfter: r.adjustmentDetails?.originalValueAfter,
        remainingValueBefore: r.adjustmentDetails?.remainingValueBefore,
        remainingValueAfter: r.adjustmentDetails?.remainingValueAfter,
        notes: r.adjustmentDetails?.adjustmentNotes,
        status: r.status,
      });
    });
    decreaseRows.forEach((r) => {
      list.push({
        id: r.id,
        adjustmentType: 'GIAM',
        code: r.decreaseCode,
        decisionNumber: r.adjustmentDetails?.decisionNumber,
        decisionDate: r.adjustmentDetails?.decisionDate,
        adjustmentDate: r.adjustmentDetails?.adjustmentDate,
        adjustmentReason: r.adjustmentDetails?.adjustmentReason,
        originalValueBefore: r.adjustmentDetails?.originalValueBefore,
        originalValueAfter: r.adjustmentDetails?.originalValueAfter,
        remainingValueBefore: r.adjustmentDetails?.remainingValueBefore,
        remainingValueAfter: r.adjustmentDetails?.remainingValueAfter,
        notes: r.adjustmentDetails?.adjustmentNotes,
        status: r.status,
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

  const tabs = useMemo<ViewTabConfig<RadarStationAsset>[]>(() => {
    if (!selectedRecord) return [];

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
                valueFormatter: (val) =>
                  (val && orgName.get(String(val))) || selectedRecord.parentOrgUnitName || '—',
                colSpan: 12,
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                type: ViewFieldType.Text,
                valueFormatter: (val) =>
                  (val && orgName.get(String(val))) || selectedRecord.orgUnitName || '—',
                colSpan: 12,
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                type: ViewFieldType.Text,
                valueFormatter: (val) =>
                  (val && orgName.get(String(val))) || selectedRecord.usingOrgUnitName || '—',
                colSpan: 12,
              },
              {
                name: 'radarStationId',
                label: 'Mã trạm radar',
                type: ViewFieldType.Text,
                valueFormatter: (val) => {
                  const r = val ? radarStationMap.get(String(val)) : undefined;
                  return r ? `${r.code} - ${r.name}` : selectedRecord.radarStationCode || '—';
                },
                colSpan: 12,
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
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: ViewFieldType.Text,
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
            key: 'tech_specs',
            title: 'Chỉ số tổng hợp & Quy mô kỹ thuật',
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                type: ViewFieldType.Number,
                valueFormatter: (val) => fmtNum(val),
                colSpan: 12,
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
                type: ViewFieldType.Text,
                valueFormatter: (val) => fmtDate(val as string),
                colSpan: 12,
              },
              {
                name: 'landArea',
                label: 'Diện tích (đất, sàn sử dụng: m²)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => fmtNum(val),
                colSpan: 12,
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m²)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => fmtNum(val),
                colSpan: 12,
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
        badgeCount: attachments.length,
        icon: <ProfileOutlined />,
        customContent: () => (
          <div style={{ padding: '8px 0' }}>
            <InfrastructureAttachmentTab
              attachments={attachments}
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
                type: ViewFieldType.Text,
                valueFormatter: (val) => fmtDate(val as string),
                colSpan: 12,
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá (VNĐ)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => `${fmtNum(val)} VNĐ`,
                colSpan: 12,
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => (val != null ? `${val}%` : '—'),
                colSpan: 12,
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại (VNĐ)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => `${fmtNum(val)} VNĐ`,
                colSpan: 12,
              },
              {
                name: 'valueUnit',
                label: 'Đơn vị tính giá trị',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'depreciationStartDate',
                label: 'Ngày tính khấu hao',
                type: ViewFieldType.Text,
                valueFormatter: (val) => fmtDate(val as string),
                colSpan: 12,
              },
              {
                name: 'depreciationMonths',
                label: 'Số tháng tính khấu hao',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: ViewFieldType.Text,
                valueFormatter: (val) => fmtDate(val as string),
                colSpan: 12,
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế (VNĐ)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => `${fmtNum(val)} VNĐ`,
                colSpan: 12,
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => `${fmtNum(val)} VNĐ`,
                colSpan: 12,
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
        icon: <RocketOutlined />,
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
    attachments,
    exploitationRows,
    exploitationTableOption,
    combinedAdjustments,
    adjustmentTableOption,
    orgName,
    radarStationMap,
    selectedRecord,
    handleDownloadAttachment,
    handleLoadReadonlyPreviewImage,
  ]);

  return (
    <DynamicViewSidebar<RadarStationAsset>
      open={open}
      title={
        <span
          style={{
            fontSize: 16,
            fontWeight: fontWeightBold,
            color: colors.sidebarBg,
          }}
        >
          Chi tiết tài sản trạm radar — {selectedRecord?.assetName || ''}
        </span>
      }
      record={selectedRecord}
      tabs={tabs}
      onClose={onClose}
      rootClassName="radar-asset-drawer-scope"
    />
  );
}
