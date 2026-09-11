import React, { useState, useMemo, useId } from 'react';
import { Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import Pagination from '../list-view/Pagination';
import { DRAWER_TABLE_SCROLL_Y } from '../../themetokenchk';

export interface DetailTableProps<T = Record<string, unknown>> extends Omit<TableProps<T>, 'pagination'> {
  columns: ColumnsType<T>;
  dataSource: T[];
  total?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  rowKey?: string | ((record: T, index?: number) => string);
  emptyText?: string;
  currentPage?: number;
  onPageChange?: (page: number, pageSize?: number) => void;
  headerNode?: React.ReactNode;
  padEmptyRows?: boolean;
  /** Khi true và dataSource rỗng → thân bảng co theo nội dung thay vì filler cao cố định */
  emptyHeightAuto?: boolean;
  scrollY?: number | string;
}

/** Tự động suy luận độ rộng tối ưu cho cột nếu chưa được khai báo */
const getSmartColumnWidth = (col: Record<string, unknown>): number | undefined => {
  if (col.width && typeof col.width === 'number') {
    return col.width;
  }
  if (typeof col.width === 'string' && col.width.endsWith('px')) {
    const parsed = parseInt(col.width, 10);
    if (!isNaN(parsed)) return parsed;
  }
  if (col.width === '100%') {
    return undefined;
  }
  if (col.width !== undefined) return col.width as number | undefined;
  const key = String(col.dataIndex || col.key || col.title || '').toLowerCase();
  if (key === 'stt' || col.title === 'STT') return 60;
  if (key.includes('code') || key.includes('mã')) return 140;
  if (key.includes('spec') || key.includes('thông số') || key.includes('kỹ thuật')) return 240;
  if (key.includes('type') || key.includes('loại')) return 260;
  if (key.includes('date') || key.includes('time') || key.includes('ngày') || key.includes('thời gian') || key.includes('năm') || key.includes('year')) return 140;
  if (key.includes('status') || key.includes('trạng thái') || key.includes('tình trạng') || key.includes('handle')) return 160;
  if (key.includes('cost') || key.includes('chi phí') || key.includes('price') || key.includes('amount') || key.includes('tiền')) return 160;
  if (key.includes('org') || key.includes('unit') || key.includes('đơn vị')) return 240;
  if (key.includes('name') || key.includes('tên')) return undefined;
  return undefined;
};

/** Tự động suy luận căn lề tối ưu cho cột nếu chưa được khai báo */
const getSmartColumnAlign = (col: Record<string, unknown>): 'left' | 'center' | 'right' => {
  if (col.align) return col.align as 'left' | 'center' | 'right';
  const key = String(col.dataIndex || col.key || col.title || '').toLowerCase();
  if (key === 'stt' || col.title === 'STT') return 'center';
  if (key.includes('date') || key.includes('time') || key.includes('ngày') || key.includes('thời gian') || key.includes('năm') || key.includes('year')) return 'center';
  if (key.includes('cost') || key.includes('chi phí') || key.includes('price') || key.includes('amount') || key.includes('tiền') || key.includes('kinh phí')) return 'right';
  return 'left';
};

/** Tự động sinh hàm so sánh Client-Side khi cột được cấu hình sorter: true */
const getSmartSorter = (col: Record<string, unknown>) => {
  if (!col.sorter) return undefined;
  if (typeof col.sorter === 'function') return col.sorter;
  const field = (col.dataIndex || col.key) as string;
  if (!field) return undefined;
  const key = String(field).toLowerCase();

  // Cột ngày tháng
  if (key.includes('date') || key.includes('time') || key.includes('ngày') || key.includes('thời gian') || key.includes('at')) {
    return (a: Record<string, unknown>, b: Record<string, unknown>) => {
      const timeA = a[field] ? new Date(a[field] as string | number | Date).getTime() : 0;
      const timeB = b[field] ? new Date(b[field] as string | number | Date).getTime() : 0;
      return timeA - timeB;
    };
  }

  // Cột số liệu
  if (key.includes('cost') || key.includes('price') || key.includes('amount') || key.includes('tiền') || key.includes('count') || key.includes('số lượng') || key.includes('stt')) {
    return (a: Record<string, unknown>, b: Record<string, unknown>) => {
      const valA = Number(a[field]) || 0;
      const valB = Number(b[field]) || 0;
      return valA - valB;
    };
  }

  // Cột chuỗi tiếng Việt có dấu
  return (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const valA = String(a[field] ?? '');
    const valB = String(b[field] ?? '');
    return String(valA).localeCompare(String(valB), 'vi');
  };
};

/**
 * DetailTable — Component bảng dữ liệu chi tiết thông minh dùng chung cho Drawer/Modal toàn hệ thống.
 * 
 * Tự động hóa 100%:
 * 1. Tự động tính toán độ rộng chuẩn (pixel widths) cho mọi cột ngăn chặn hoàn toàn hiện tượng lệch cột khi đổi trang.
 * 2. Tự động căn lề (STT/ngày ở giữa, số tiền bên phải, chữ bên trái).
 * 3. Tự động gắn Ellipsis (...) kèm tooltip hover cho nội dung văn bản dài.
 * 4. Tự động bảo toàn 100% tiêu đề cột không bao giờ bị cắt chữ.
 * 5. Tự động gắn bộ sắp xếp Client-Side tiếng Việt mượt mà.
 * 6. Tự động co giãn theo số lượng bản ghi và neo thanh phân trang ngay dưới dòng cuối, không tạo khoảng trống thừa.
 */
export const DetailTable = <T extends object = Record<string, unknown>>({
  columns,
  dataSource = [],
  pageSize: propPageSize,
  pageSizeOptions = [20, 50, 100],
  rowKey,
  emptyText = 'Không có dữ liệu',
  currentPage,
  onPageChange,
  headerNode,
  size = 'small',
  tableLayout = 'fixed',
  loading,
  className,
  style,
  padEmptyRows = false,
  emptyHeightAuto = false,
  scrollY,
  scroll,
  total,
  ...rest
}: DetailTableProps<T>) => {
  const [internalPageSize, setInternalPageSize] = useState<number>(propPageSize ?? 20);
  const pageSize = propPageSize !== undefined ? propPageSize : internalPageSize;
  const [internalPage, setInternalPage] = useState<number>(1);
  const activePage = currentPage !== undefined ? currentPage : internalPage;
  const effectiveTotal = total !== undefined ? total : dataSource.length;

  const handlePageChange = (page: number, newPageSize: number) => {
    if (newPageSize !== pageSize) {
      setInternalPageSize(newPageSize);
      setInternalPage(1);
      if (onPageChange) {
        onPageChange(1, newPageSize);
      }
      return;
    }
    if (currentPage === undefined) {
      setInternalPage(page);
    }
    if (onPageChange) {
      onPageChange(page, pageSize);
    }
  };

  const rawPagedData = useMemo(() => {
    if (onPageChange && total !== undefined) {
      return dataSource;
    }
    return dataSource.slice((activePage - 1) * pageSize, activePage * pageSize);
  }, [dataSource, activePage, pageSize, onPageChange, total]);

  // Tự động đệm các hàng trống nếu bật padEmptyRows
  const pagedData = useMemo(() => {
    if (!padEmptyRows || rawPagedData.length === 0 || rawPagedData.length >= pageSize) {
      return rawPagedData;
    }
    const placeholdersCount = pageSize - rawPagedData.length;
    const placeholders = Array.from({ length: placeholdersCount }, (_, i) => ({
      __isPlaceholder: true,
      __placeholderKey: `placeholder-p${activePage}-r${i}`,
    }));
    return [...rawPagedData, ...placeholders];
  }, [rawPagedData, pageSize, activePage, padEmptyRows]);

  // Chuẩn hóa và làm giàu cấu hình cột tự động
  const enhancedColumns = useMemo(() => {
    const enhanced = columns.map((colItem) => {
      const col = colItem as Record<string, unknown> & {
        render?: (val: unknown, rec: T, idx: number) => React.ReactNode;
        title?: React.ReactNode;
      };
      const originalRender = col.render;
      const width = getSmartColumnWidth(col);
      const align = getSmartColumnAlign(col);
      const sorter = getSmartSorter(col);

      return {
        ...col,
        ...(width !== undefined ? { width } : {}),
        align,
        sorter,
        render: (value: unknown, record: T, index: number) => {
          const rec = record as Record<string, unknown>;
          if (rec && rec.__isPlaceholder) {
            return <span style={{ display: 'inline-block', height: 22, color: 'transparent', userSelect: 'none' }}>&nbsp;</span>;
          }
          if (col.title === 'STT') {
            return (activePage - 1) * pageSize + index + 1;
          }
          if (originalRender) {
            return originalRender(value, record, index);
          }
          if (value === null || value === undefined || value === '') {
            return null;
          }
          // Auto-format dates
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            const isDateTime = value.includes('T') || value.includes(':');
            const d = dayjs(value);
            if (d.isValid()) {
              return d.format(isDateTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY');
            }
          }
          // Auto-format numbers with currency / thousands separator if cost
          const key = String(col.dataIndex || col.key || '').toLowerCase();
          if (typeof value === 'number' && (key.includes('cost') || key.includes('price') || key.includes('amount') || key.includes('tiền'))) {
            return value.toLocaleString('vi-VN');
          }
          // Standard text with ellipsis and title tooltip
          return (
            <span
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={typeof value === 'string' ? value : String(value)}
            >
              {String(value)}
            </span>
          );
        },
      };
    });

    return enhanced;
  }, [columns, activePage, pageSize]);

  const resolveRowKey = (record: T, idx: number = 0): React.Key => {
    const rec = record as Record<string, unknown>;
    if (rec && rec.__isPlaceholder) {
      return rec.__placeholderKey as React.Key;
    }
    if (typeof rowKey === 'string' && rec && rec[rowKey] !== undefined) {
      return rec[rowKey] as React.Key;
    }
    if (typeof rowKey === 'function') {
      return rowKey(record, idx);
    }
    if (rec && (rec.id || rec.code || rec.planCode || rec.maintCode || rec.incidentCode || rec.fileName)) {
      return (rec.id || rec.code || rec.planCode || rec.maintCode || rec.incidentCode || rec.fileName) as React.Key;
    }
    return `p${activePage}-r${idx}`;
  };

  const rawId = useId();
  const instanceId = useMemo(() => `chk-dt-${rawId.replace(/:/g, '')}`, [rawId]);
  const currentRowCount = Array.isArray(dataSource) ? dataSource.length : 0;
  const isAutoHeightForEmpty = currentRowCount === 0 && emptyHeightAuto;
  const effectiveScrollY = isAutoHeightForEmpty ? 'auto' : (scrollY || DRAWER_TABLE_SCROLL_Y.detailView);
  return (
    <div
      className={`chk-detail-table-card ${instanceId} ${className || ''}`}
      style={{
        width: '100%',
        ...style,
      }}
    >
      <style>{`
        .${instanceId} .ant-table table {
          ${scroll?.x ? 'width: max-content !important; min-width: 100% !important;' : 'width: 100% !important;'}
          table-layout: fixed !important;
        }
        .${instanceId} .ant-table-thead > tr > th {
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
          padding: 8px 12px !important;
          height: 38px !important;
          box-sizing: border-box !important;
        }
        .${instanceId} .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
          padding: 6px 12px !important;
          height: 35px !important;
          line-height: 22px !important;
          box-sizing: border-box !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .${instanceId} .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(.ant-tag),
        .${instanceId} .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(span[style*="999px"]),
        .${instanceId} .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(span[style*="borderRadius: 999px"]),
        .${instanceId} .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(span[style*="border-radius: 999px"]),
        .${instanceId} .ant-table-tbody > tr:not(.ant-table-measure-row) > td.chk-col-status {
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
        }
        .${instanceId} .ant-table-thead > tr > th.ant-table-cell-align-right,
        .${instanceId} .ant-table-tbody > tr > td.ant-table-cell-align-right {
          padding-right: 18px !important;
        }
        .${instanceId} .ant-table-tbody > tr.ant-table-measure-row,
        .${instanceId} .ant-table-tbody > tr.ant-table-measure-row > td {
          padding: 0 !important;
          height: 0 !important;
          border: 0 !important;
          line-height: 0 !important;
          font-size: 0 !important;
        }
        .${instanceId} .ant-table-row-placeholder {
          pointer-events: none !important;
        }
        .${instanceId} .ant-table-body {
          max-height: ${typeof effectiveScrollY === 'number' ? `${effectiveScrollY}px` : effectiveScrollY} !important;
          overflow-x: auto !important;
          ${pagedData.length === 0 ? 'overflow-y: hidden !important;' : 'overflow-y: auto !important;'}
        }
        .${instanceId} .ant-table-placeholder .ant-table-cell,
        .${instanceId} .ant-table-placeholder > td,
        .${instanceId} .ant-table-tbody > tr.ant-table-placeholder > td {
          height: ${typeof effectiveScrollY === 'number' ? `${effectiveScrollY}px` : effectiveScrollY} !important;
          border-bottom: none !important;
        }
        .${instanceId} .ant-table-tbody > tr > td:last-child {
          padding-left: 4px !important;
          padding-right: 4px !important;
        }
        .${instanceId} .ant-table-thead > tr > th:last-child {
          padding-left: 4px !important;
          padding-right: 4px !important;
        }
        /* Pagination fixed tại bottom-right trong Drawer */
        .ant-drawer .${instanceId} .chk-detail-table-pagination {
          position: fixed !important;
          bottom: 76px !important;
          right: 24px !important;
          z-index: 100 !important;
          margin: 0 !important;
          display: flex !important;
          justify-content: flex-end !important;
          align-items: center !important;
        }
        .ant-drawer:has(.ant-drawer-footer) .${instanceId} .chk-detail-table-pagination {
          bottom: 68px !important;
        }
        /* ── Cỡ chữ 13.5px chuẩn toàn bộ DetailTable ── */
        .${instanceId},
        .${instanceId} .ant-table,
        .${instanceId} .ant-table-cell,
        .${instanceId} .ant-table-thead > tr > th,
        .${instanceId} .ant-table-tbody > tr > td,
        .${instanceId} .chk-detail-table-pagination,
        .${instanceId} .ant-pagination,
        .${instanceId} .ant-pagination-item,
        .${instanceId} .ant-pagination-total-text {
          font-size: 13.5px !important;
        }
      `}</style>
      {headerNode}
      <Table<T>
        size={size}
        tableLayout={tableLayout}
        pagination={false}
        showSorterTooltip={false}
        dataSource={pagedData}
        rowKey={resolveRowKey}
        columns={enhancedColumns}
        locale={{
          emptyText: (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#7E6B3F', fontSize: 13.5 }}>
              {emptyText}
            </div>
          ),
        }}
        loading={loading}
        scroll={{
          y: isAutoHeightForEmpty ? undefined : effectiveScrollY,
          ...scroll,
        }}
        onRow={(record: T) => {
          const rec = record as Record<string, unknown>;
          if (rec && rec.__isPlaceholder) {
            return {
              className: 'ant-table-row-placeholder',
            };
          }
          return {};
        }}
        {...rest}
      />
      {effectiveTotal > 0 && (
        <div
          className="chk-detail-table-pagination"
          style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}
        >
          <Pagination
            total={effectiveTotal}
            current={activePage}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};
export default DetailTable;
