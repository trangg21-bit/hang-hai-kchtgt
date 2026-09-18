import {
  EyeOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import React, { useMemo, useState } from 'react';
import AssetAdjustmentDetailModal, {
  type AssetAdjustmentDetailRecord,
} from './AssetAdjustmentDetailModal';
import {
  CommonTable,
  getApprovalStatusInfo,
  renderApprovalStatusBadge,
  TableColumnType,
  type TableOption,
} from './common-table';
import {
  fontWeightMedium,
  statusCritical,
  statusOperational,
} from '../../themetokenchk';
import { fmtNum } from '../../utils/numFmt';

export interface AssetAdjustmentHistoryTabProps {
  dataSource?: AssetAdjustmentDetailRecord[] | Record<string, unknown>[];
  loading?: boolean;
}

export function normalizeAdjustmentRecord(
  raw: Record<string, unknown>
): AssetAdjustmentDetailRecord {
  const details = (raw.adjustmentDetails as Record<string, unknown>) || {};

  let adjType =
    (raw.adjustmentType as string) || (raw.changeType as string) || '';
  if (!adjType) {
    if ('increaseCode' in raw || raw.increaseDate || raw.increaseReason) {
      adjType = 'TANG';
    } else if (
      'decreaseCode' in raw ||
      raw.decreaseDate ||
      raw.decreaseReason
    ) {
      adjType = 'GIAM';
    }
  }

  const decisionNumber =
    (details.decisionNumber as string) ||
    (raw.decisionNumber as string) ||
    (raw.code as string) ||
    (raw.increaseCode as string) ||
    (raw.decreaseCode as string) ||
    '';

  const decisionDate =
    (details.decisionDate as string) ||
    (raw.decisionDate as string) ||
    (raw.createdDate as string) ||
    '';

  const adjustmentDate =
    (details.adjustmentDate as string) ||
    (raw.adjustmentDate as string) ||
    (raw.increaseDate as string) ||
    (raw.decreaseDate as string) ||
    '';

  const originalValueBefore =
    (details.originalValueBefore as number) ??
    (raw.originalValueBefore as number) ??
    (raw.originalValue as number) ??
    undefined;

  const originalValueAfter =
    (details.originalValueAfter as number) ??
    (raw.originalValueAfter as number) ??
    undefined;

  const remainingValueBefore =
    (details.remainingValueBefore as number) ??
    (raw.remainingValueBefore as number) ??
    (raw.remainingValue as number) ??
    undefined;

  const remainingValueAfter =
    (details.remainingValueAfter as number) ??
    (raw.remainingValueAfter as number) ??
    undefined;

  const adjustmentAmount =
    (raw.adjustmentAmount as number) ??
    (details.adjustmentAmount as number) ??
    (originalValueBefore != null && originalValueAfter != null
      ? originalValueAfter - originalValueBefore
      : undefined);

  const adjustmentReason =
    (details.adjustmentReason as string) ||
    (raw.adjustmentReason as string) ||
    (raw.increaseReason as string) ||
    (raw.decreaseReason as string) ||
    '';

  const notes =
    (details.adjustmentNotes as string) ||
    (details.notes as string) ||
    (raw.notes as string) ||
    (raw.description as string) ||
    '';

  const status =
    (raw.status as string) ||
    (details.status as string) ||
    (raw.approvalStatus as string) ||
    '';

  const createdAt =
    (raw.createdAt as string) ||
    (raw.createdDate as string) ||
    (details.createdAt as string) ||
    '';

  return {
    ...raw,
    id: String(raw.id || Math.random()),
    adjustmentType: adjType,
    decisionNumber,
    decisionDate,
    adjustmentDate,
    originalValueBefore,
    originalValueAfter,
    remainingValueBefore,
    remainingValueAfter,
    adjustmentAmount,
    adjustmentReason,
    notes,
    status,
    createdAt,
  };
}

/**
 * Tự động tính toán bề rộng cột Trạng thái dựa trên độ dài của nhãn trạng thái dài nhất
 * (ví dụ: "Chờ phê duyệt cấp Cảng vụ/Chi cục" 33 ký tự -> cột tự mở rộng ~365px)
 * để đảm bảo không bao giờ bị tràn sang cột bên cạnh.
 */
export function calculateStatusColumnWidth(
  records?: AssetAdjustmentDetailRecord[] | Record<string, unknown>[]
): number {
  const DEFAULT_WIDTH = 200;
  if (!records || records.length === 0) {
    return DEFAULT_WIDTH;
  }

  let maxLen = 10;
  for (const rec of records) {
    const rawStatus =
      (rec.status as string) ||
      (rec.approvalStatus as string) ||
      ((rec.adjustmentDetails as Record<string, unknown>)?.status as string) ||
      '';
    if (rawStatus) {
      const info = getApprovalStatusInfo(rawStatus);
      if (info.label && info.label.length > maxLen) {
        maxLen = info.label.length;
      }
    }
  }

  const computedWidth = Math.ceil(maxLen * 8.5) + 95;
  return Math.max(DEFAULT_WIDTH, computedWidth);
}

export const AssetAdjustmentHistoryTab: React.FC<AssetAdjustmentHistoryTabProps> = ({
  dataSource = [],
  loading = false,
}) => {
  const [selectedRecord, setSelectedRecord] =
    useState<AssetAdjustmentDetailRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const normalizedRows = useMemo<AssetAdjustmentDetailRecord[]>(() => {
    return (dataSource || []).map((row) =>
      normalizeAdjustmentRecord(row as Record<string, unknown>)
    );
  }, [dataSource]);

  const statusColWidth = useMemo(() => {
    return calculateStatusColumnWidth(normalizedRows);
  }, [normalizedRows]);

  const handleOpenDetail = (record: AssetAdjustmentDetailRecord) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handleCloseDetail = () => {
    setModalOpen(false);
    setSelectedRecord(null);
  };

  const tableOption = useMemo<TableOption<AssetAdjustmentDetailRecord>>(
    () => ({
      dataKey: 'id',
      hideActionColumn: false,
      enablePaging: false,
      bordered: true,
      scroll: { x: 'max-content', y: 350 },
      mainColumns: [
        {
          title: 'Loại biến động',
          dataIndex: 'adjustmentType',
          type: TableColumnType.Template,
          width: 160,
          render: (_v, row) => {
            const isInc =
              row.adjustmentType === 'TANG' ||
              row.adjustmentType === 'INCREASE' ||
              row.changeType === 'Tăng nguyên giá' ||
              String(row.adjustmentType || '').toLowerCase().includes('tăng');

            return isInc ? (
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
            );
          },
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
          title: 'Giá trị điều chỉnh (VNĐ)',
          dataIndex: 'adjustmentAmount',
          type: TableColumnType.Template,
          width: 190,
          align: 'right',
          render: (_v, row) => {
            const isInc =
              row.adjustmentType === 'TANG' ||
              row.adjustmentType === 'INCREASE' ||
              row.changeType === 'Tăng nguyên giá' ||
              String(row.adjustmentType || '').toLowerCase().includes('tăng');

            const diff =
              row.adjustmentAmount !== undefined
                ? row.adjustmentAmount
                : row.originalValueAfter !== undefined && row.originalValueBefore !== undefined
                ? row.originalValueAfter - row.originalValueBefore
                : undefined;

            if (diff == null) return '—';
            const sign = diff >= 0 || isInc ? '+' : '-';
            const absVal = Math.abs(diff);

            return (
              <span
                style={{
                  fontWeight: fontWeightMedium,
                  color: isInc ? statusOperational : statusCritical,
                }}
              >
                {sign}{fmtNum(absVal)} VNĐ
              </span>
            );
          },
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
          width: statusColWidth,
          minWidth: statusColWidth,
          render: (_v, row) =>
            row.status ? renderApprovalStatusBadge(row.status) : '—',
        },
        {
          title: 'Ngày cập nhật',
          dataIndex: 'createdAt',
          type: TableColumnType.Date,
          width: 140,
        },
      ],
      actions: (row: AssetAdjustmentDetailRecord) => [
        {
          key: 'detail',
          label: 'Xem chi tiết',
          icon: <EyeOutlined />,
          onClick: () => handleOpenDetail(row),
        },
      ],
    }),
    [statusColWidth]
  );

  return (
    <div style={{ padding: '4px 0' }}>
      <CommonTable<AssetAdjustmentDetailRecord>
        options={tableOption}
        dataSource={normalizedRows}
        total={normalizedRows.length}
        loading={loading}
      />
      <AssetAdjustmentDetailModal
        open={modalOpen}
        onClose={handleCloseDetail}
        record={selectedRecord}
      />
    </div>
  );
};

export default AssetAdjustmentHistoryTab;
