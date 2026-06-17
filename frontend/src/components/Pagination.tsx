import { Pagination, Space, Select } from 'antd';
import type { PaginationProps } from 'antd';

interface PaginationPropsExtended {
  current?: number;
  total?: number;
  pageSize?: number;
  pageSizeOptions?: string[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => string;
  onChange?: (page: number, pageSize?: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Pagination component — page navigation v?i page size selector.
 * H? tr? hi?n th? "X-Y / Z" d? ch? r? trang th?o.
 */
export default function HHPagination({
  current = 1,
  total = 0,
  pageSize = 10,
  pageSizeOptions = ['10', '20', '50', '100'],
  showSizeChanger = true,
  showQuickJumper = false,
  showTotal,
  onChange,
  onPageSizeChange,
}: PaginationPropsExtended) {
  const defaultShowTotal = showTotal || ((totalVal: number) => `Tổng ${totalVal} mục`);

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
      <Pagination
        current={current}
        total={total}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger={showSizeChanger}
        showQuickJumper={showQuickJumper}
        showTotal={defaultShowTotal}
        onChange={(page, pageSz) => {
          onChange?.(page, pageSz);
          onPageSizeChange?.(pageSz);
        }}
        onShowSizeChange={(_page, pageSz) => {
          onPageSizeChange?.(pageSz);
        }}
        size="small"
      />
    </div>
  );
}
