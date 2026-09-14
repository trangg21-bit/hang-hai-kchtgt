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
  renderApprovalStatusBadge,
  TableColumnType,
  type TableOption
} from '../../components/shared/common-table';
import {
  DynamicViewSidebar,
  ViewFieldType,
  type ViewTabConfig,
} from '../../components/shared/dynamic-view-sidebar';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import type { AisSystemAsset } from '../../services/aisasset/types';
import type {
  AssetDecreaseResponse,
  AssetExploitationResponse,
  AssetIncreaseResponse,
} from '../../services/assetmovement/types';
import {
  colors,
  fontWeightBold,
  fontWeightMedium,
  statusCritical,
  statusOperational
} from '../../themetokenchk';
import {
  downloadAttachmentFile,
  getAttachmentPreviewUrl,
  getOrGenerateAttachmentBlob,
} from '../../utils/attachmentStorage';
import { fmtNum } from '../../utils/numFmt';

export { renderApprovalStatusBadge };

export interface AisSystemAssetDetailContentProps {
  open: boolean;
  selectedRecord?: AisSystemAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  aisSystemMap: Map<string, { code: string; name: string }>;
  exploitationRows: AssetExploitationResponse[];
  increaseRows: AssetIncreaseResponse[];
  decreaseRows: AssetDecreaseResponse[];
  attachments?: InfrastructureAttachmentItem[];
}

const fmtDateTime = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—';
const fmtDate = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY') : '—';

export default function AisSystemAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  aisSystemMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
  attachments,
}: AisSystemAssetDetailContentProps) {
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
          id: `ais-att-${selectedRecord.id}-${i + 1}`,
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
          id: 'ais-sample-att-1',
          fileName: 'Quyet_dinh_dau_tu_he_thong_ais.pdf',
          fileSize: 2450000,
          uploadedAt: selectedRecord?.createdAt || new Date().toISOString(),
          uploadedByName: selectedRecord?.updatedByName || 'Cán bộ quản lý',
        },
        {
          id: 'ais-sample-att-2',
          fileName: 'Bien_ban_kiem_dinh_thiet_bi_ais.pdf',
          fileSize: 1820000,
          uploadedAt: selectedRecord?.createdAt || new Date().toISOString(),
          uploadedByName: selectedRecord?.updatedByName || 'Cán bộ quản lý',
        },
        {
          id: 'ais-sample-att-3',
          fileName: 'So_do_lap_dat_tram_ais.png',
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
          type: TableColumnType.Template,
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
    [orgName]
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

  const tabs = useMemo<ViewTabConfig<AisSystemAsset>[]>(() => {
    if (!selectedRecord) return [];

    const ais = selectedRecord.aisSystemId
      ? aisSystemMap.get(selectedRecord.aisSystemId)
      : undefined;
    const aisDisplay = ais
      ? `${ais.code} - ${ais.name}`
      : selectedRecord.aisSystemCode
      ? `${selectedRecord.aisSystemCode} - ${selectedRecord.aisSystemName || ''}`
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
                render: () =>
                  selectedRecord.parentOrgUnitName ||
                  (selectedRecord.parentOrgUnitId
                    ? orgName.get(selectedRecord.parentOrgUnitId)
                    : undefined) ||
                  '—',
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: () =>
                  selectedRecord.orgUnitName ||
                  orgName.get(selectedRecord.orgUnitId) ||
                  '—',
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: () =>
                  selectedRecord.usingOrgUnitName ||
                  (selectedRecord.usingOrgUnitId
                    ? orgName.get(selectedRecord.usingOrgUnitId)
                    : undefined) ||
                  '—',
              },
              {
                name: 'aisSystemId',
                label: 'Mã hệ thống AIS',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: () => aisDisplay,
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
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
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
                render: (v) => (v ? String(v) : '—'),
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
                label: 'Trạng thái phê duyệt',
                type: ViewFieldType.Custom,
                colSpan: 12,
                render: (v) => renderApprovalStatusBadge(v as string),
              },
              {
                name: 'status',
                label: 'Tình trạng vận hành',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => (v === 'MANAGED' ? 'Đang quản lý' : (v as string) || '—'),
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
                type: ViewFieldType.Text,
                colSpan: 12,
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
            key: 'port_authority_approval',
            title: 'Phê duyệt cấp Cảng vụ/Chi cục',
            fields: [
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt',
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
                label: 'Cán bộ phê duyệt',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt',
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
              },
            ],
          },
        ],
      },
    ];
  }, [
    selectedRecord,
    orgName,
    aisSystemMap,
    exploitationRows,
    detailAttachments,
    handleDownloadAttachment,
    handleLoadReadonlyPreviewImage,
    combinedAdjustments,
    exploitationTableOption,
    adjustmentTableOption,
  ]);

  return (
    <DynamicViewSidebar<AisSystemAsset>
      open={open}
      title={
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 16 }}>
          Chi tiết tài sản hệ thống AIS — {selectedRecord?.assetName || ''}
        </span>
      }
      record={selectedRecord}
      tabs={tabs}
      onClose={onClose}
    />
  );
}
