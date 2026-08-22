import React, { useState } from 'react';
import { Table } from 'antd';
import Pagination from './Pagination';
import { spaceSm, textSecondary, fontSizeMd, fontWeightBold, fontWeightMedium } from '../../tokens';
import { colors } from '../../theme';

export const PAGED_TABLE_PAGE_SIZE = 5;

export interface PagedTableProps {
  /** Dữ liệu gốc đầy đủ (component tự slice theo trang). */
  dataSource: any[];
  /** Trả về STT hiển thị — mặc định = vị trí toàn cục + 1 (giữ liên tục qua các trang). */
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyText?: React.ReactNode;
  children: React.ReactNode;
  /** Props thêm truyền xuống Table (scroll, size, bordered...). */
  tableProps?: Record<string, unknown>;
  style?: React.CSSProperties;
}

/**
 * Bảng con dùng chung: slice thủ công + thanh phân trang chuẩn list-view
 * (giống PagedTabTable trong PierDetailContent / phân trang danh sách chính).
 * Đặt `pagination={false}` cho Table bên trong.
 */
export default function PagedTable({
  dataSource, pageSizeOptions = [5, 10, 20], defaultPageSize = PAGED_TABLE_PAGE_SIZE,
  emptyText, children, tableProps = {}, style,
}: PagedTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const maxPage = Math.max(1, Math.ceil(dataSource.length / pageSize));
  const cur = Math.min(page, maxPage);
  const rows = dataSource
    .map((row, idx) => ({ ...row, key: row?.key ?? row?.id ?? idx, __stt: idx + 1 }))
    .slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <div style={style}>
      <Table className="list-view-table" dataSource={rows} pagination={false} size="middle" bordered
        locale={emptyText ? { emptyText } : undefined}
        {...tableProps}>
        <Table.Column title="STT" key="stt" dataIndex="__stt" width={60} align="center"
          render={(v: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{v}</span>}
          onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
        {children}
      </Table>
      <div style={{ marginTop: spaceSm }}>
        <Pagination total={dataSource.length} current={cur} pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </div>
    </div>
  );
}
