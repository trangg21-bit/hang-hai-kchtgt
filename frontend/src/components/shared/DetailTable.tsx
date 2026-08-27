import React, { useState, useMemo } from 'react';
import { Table, Pagination } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';

export interface DetailTableProps<T = any> extends Omit<TableProps<T>, 'pagination'> {
  columns: ColumnsType<T>;
  dataSource: T[];
  pageSize?: number;
  rowKey?: string | ((record: T, index?: number) => string);
  emptyText?: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  headerNode?: React.ReactNode;
  padEmptyRows?: boolean;
}

/** Tự động suy luận độ rộng tối ưu cho cột nếu chưa được khai báo */
const getSmartColumnWidth = (col: any): number => {
  if (col.width && typeof col.width === 'number') {
    const key = String(col.dataIndex || col.key || col.title || '').toLowerCase();
    if (key.includes('severity') || key.includes('mức độ')) {
      return Math.max(col.width, 150);
    }
    if (key.includes('status') || key.includes('trạng thái') || key.includes('tình trạng') || key.includes('handle')) {
      return Math.max(col.width, 160);
    }
    if (key.includes('cost') || key.includes('chi phí') || key.includes('price') || key.includes('tiền')) {
      return Math.max(col.width, 170);
    }
    return col.width;
  }
  if (typeof col.width === 'string' && col.width.endsWith('px')) {
    const parsed = parseInt(col.width, 10);
    if (!isNaN(parsed)) return parsed;
  }
  const key = String(col.dataIndex || col.key || col.title || '').toLowerCase();
  if (key === 'stt' || col.title === 'STT') return 50;
  if (key.includes('code') || key.includes('mã')) return 120;
  if (key.includes('name') || key.includes('tên') || key.includes('spec') || key.includes('thông số') || key.includes('nội dung') || key.includes('content') || key.includes('mô tả') || key.includes('description') || key.includes('tiêu đề') || key.includes('title')) return 200;
  if (key.includes('date') || key.includes('time') || key.includes('ngày') || key.includes('thời gian') || key.includes('năm') || key.includes('year')) return 140;
  if (key.includes('org') || key.includes('unit') || key.includes('đơn vị') || key.includes('location') || key.includes('địa điểm') || key.includes('address') || key.includes('cơ quan')) return 180;
  if (key.includes('cost') || key.includes('chi phí') || key.includes('price') || key.includes('amount') || key.includes('tiền') || key.includes('kinh phí') || key.includes('budget')) return 170;
  if (key.includes('severity') || key.includes('mức độ')) return 150;
  if (key.includes('status') || key.includes('trạng thái') || key.includes('tình trạng') || key.includes('handle')) return 160;
  if (key.includes('lat') || key.includes('lng') || key.includes('kinh độ') || key.includes('vĩ độ')) return 160;
  return 140;
};

/** Tự động suy luận căn lề tối ưu cho cột nếu chưa được khai báo */
const getSmartColumnAlign = (col: any): 'left' | 'center' | 'right' => {
  if (col.align) return col.align;
  const key = String(col.dataIndex || col.key || col.title || '').toLowerCase();
  if (key === 'stt' || col.title === 'STT') return 'center';
  if (key.includes('date') || key.includes('time') || key.includes('ngày') || key.includes('thời gian') || key.includes('năm') || key.includes('year')) return 'center';
  if (key.includes('cost') || key.includes('chi phí') || key.includes('price') || key.includes('amount') || key.includes('tiền') || key.includes('kinh phí')) return 'right';
  return 'left';
};

/** Tự động sinh hàm so sánh Client-Side khi cột được cấu hình sorter: true */
const getSmartSorter = (col: any) => {
  if (!col.sorter) return undefined;
  if (typeof col.sorter === 'function') return col.sorter;
  const field = col.dataIndex || col.key;
  if (!field) return undefined;
  const key = String(field).toLowerCase();

  // Cột ngày tháng
  if (key.includes('date') || key.includes('time') || key.includes('ngày') || key.includes('thời gian') || key.includes('at')) {
    return (a: any, b: any) => {
      const timeA = a[field] ? new Date(a[field]).getTime() : 0;
      const timeB = b[field] ? new Date(b[field]).getTime() : 0;
      return timeA - timeB;
    };
  }

  // Cột số liệu
  if (key.includes('cost') || key.includes('price') || key.includes('amount') || key.includes('tiền') || key.includes('count') || key.includes('số lượng') || key.includes('stt')) {
    return (a: any, b: any) => {
      const valA = Number(a[field]) || 0;
      const valB = Number(b[field]) || 0;
      return valA - valB;
    };
  }

  // Cột chuỗi tiếng Việt có dấu
  return (a: any, b: any) => {
    const valA = a[field] ?? '';
    const valB = b[field] ?? '';
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
export const DetailTable = <T extends object = any>({
  columns,
  dataSource = [],
  pageSize = 10,
  rowKey,
  emptyText = 'Không có dữ liệu',
  currentPage,
  onPageChange,
  showTotal = (total) => `Tổng số: ${total} bản ghi`,
  headerNode,
  size = 'small',
  tableLayout = 'fixed',
  loading,
  className,
  style,
  padEmptyRows = false,
  ...rest
}: DetailTableProps<T>) => {
  const [internalPage, setInternalPage] = useState<number>(1);
  const activePage = currentPage !== undefined ? currentPage : internalPage;

  const handlePageChange = (page: number) => {
    if (currentPage === undefined) {
      setInternalPage(page);
    }
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const rawPagedData = useMemo(() => {
    return dataSource.slice((activePage - 1) * pageSize, activePage * pageSize);
  }, [dataSource, activePage, pageSize]);

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
  const { enhancedColumns, totalTableWidth } = useMemo(() => {
    let totalW = 0;
    const enhanced = columns.map((col: any) => {
      const originalRender = col.render;
      const width = getSmartColumnWidth(col);
      const align = getSmartColumnAlign(col);
      const sorter = getSmartSorter(col);
      totalW += width;

      return {
        ...col,
        width,
        align,
        sorter,
        render: (value: any, record: any, index: number) => {
          if (record && record.__isPlaceholder) {
            return <span style={{ display: 'inline-block', height: 22, color: 'transparent', userSelect: 'none' }}>&nbsp;</span>;
          }
          if (col.title === 'STT') {
            return (activePage - 1) * pageSize + index + 1;
          }
          if (originalRender) {
            return originalRender(value, record, index);
          }
          if (value === null || value === undefined || value === '') {
            return '—';
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

    return { enhancedColumns: enhanced, totalTableWidth: totalW };
  }, [columns, activePage, pageSize]);

  const resolveRowKey = (record: any, idx: number = 0) => {
    if (record && record.__isPlaceholder) {
      return record.__placeholderKey;
    }
    if (typeof rowKey === 'string' && record && record[rowKey] !== undefined) {
      return record[rowKey];
    }
    if (typeof rowKey === 'function') {
      return rowKey(record, idx);
    }
    if (record && (record.id || record.code || record.planCode || record.maintCode || record.incidentCode || record.fileName)) {
      return record.id || record.code || record.planCode || record.maintCode || record.incidentCode || record.fileName;
    }
    return `p${activePage}-r${idx}`;
  };

  // Tính toán chiều cao tối thiểu động theo pageSize của từng bảng (chỉ bật khi có nhiều trang)
  const dynamicMinHeight = useMemo(() => {
    if (dataSource.length <= pageSize) return undefined;
    const headerHeight = 38;
    const rowHeight = 42;
    return headerHeight + (pageSize * rowHeight);
  }, [dataSource.length, pageSize]);

  return (
    <div
      className={`chk-detail-table-card ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        ...style,
      }}
    >
      <style>{`
        .chk-detail-table-card .ant-table table {
          width: 100% !important;
          table-layout: fixed !important;
        }
        .chk-detail-table-card .ant-table-thead > tr > th {
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
          padding: 8px 12px !important;
          height: 38px !important;
          box-sizing: border-box !important;
        }
        .chk-detail-table-card .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
          padding: 6px 12px !important;
          height: 35px !important;
          line-height: 22px !important;
          box-sizing: border-box !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .chk-detail-table-card .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(.ant-tag),
        .chk-detail-table-card .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(span[style*="999px"]),
        .chk-detail-table-card .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(span[style*="borderRadius: 999px"]),
        .chk-detail-table-card .ant-table-tbody > tr:not(.ant-table-measure-row) > td:has(span[style*="border-radius: 999px"]),
        .chk-detail-table-card .ant-table-tbody > tr:not(.ant-table-measure-row) > td.chk-col-status {
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
        }
        .chk-detail-table-card .ant-table-thead > tr > th.ant-table-cell-align-right,
        .chk-detail-table-card .ant-table-tbody > tr > td.ant-table-cell-align-right {
          padding-right: 18px !important;
        }
        .chk-detail-table-card .ant-table-tbody > tr.ant-table-measure-row,
        .chk-detail-table-card .ant-table-tbody > tr.ant-table-measure-row > td {
          padding: 0 !important;
          height: 0 !important;
          border: 0 !important;
          line-height: 0 !important;
          font-size: 0 !important;
        }
        .chk-detail-table-card .ant-table-row-placeholder {
          pointer-events: none !important;
        }
        .chk-detail-table-card .ant-table-row-placeholder:hover > td {
          background: transparent !important;
        }
        .chk-detail-table-card .ant-pagination {
          display: inline-flex !important;
          align-items: center !important;
        }
        .chk-detail-table-card .ant-pagination-total-text {
          margin-inline-end: 12px !important;
          font-size: 13px !important;
          color: #5E6278 !important;
          white-space: nowrap !important;
          user-select: none !important;
        }
        .chk-detail-table-card .ant-pagination-item,
        .chk-detail-table-card .ant-pagination-prev,
        .chk-detail-table-card .ant-pagination-next {
          min-width: 24px !important;
          width: 24px !important;
          height: 24px !important;
          line-height: 22px !important;
          margin-inline-end: 6px !important;
          margin-inline-start: 0 !important;
          text-align: center !important;
          box-sizing: border-box !important;
        }
        .chk-detail-table-card .ant-pagination-next {
          margin-inline-end: 0 !important;
        }
      `}</style>
      {headerNode}
      <div style={{ minHeight: dynamicMinHeight }}>
        <Table<any>
          size={size}
          tableLayout="fixed"
          pagination={false}
          showSorterTooltip={false}
          dataSource={pagedData}
          rowKey={resolveRowKey}
          columns={enhancedColumns}
          locale={{
            emptyText: (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#7E6B3F', fontSize: 13 }}>
                {emptyText}
              </div>
            ),
          }}
          loading={loading}
          scroll={{ x: Math.max(totalTableWidth, 600) }}
          onRow={(record: any) => {
            if (record && record.__isPlaceholder) {
              return {
                className: 'ant-table-row-placeholder',
              };
            }
            return {};
          }}
          {...rest}
        />
      </div>
      {dataSource.length > pageSize && (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Pagination
            size="small"
            current={activePage}
            pageSize={pageSize}
            total={dataSource.length}
            showTotal={showTotal}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default DetailTable;

