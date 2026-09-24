import { useState, type ReactNode } from 'react';
import { Pagination } from 'antd';
import { spaceMd } from '../../tokens';

export const HISTORY_CARD_PAGE_SIZE = 10;

interface PaginatedHistoryListProps<T> {
  items: T[];
  renderItems: (items: T[]) => ReactNode;
  pageSize?: number;
  resetKey?: string | number;
}

export function PaginatedHistoryList<T>({
  items,
  renderItems,
  pageSize = HISTORY_CARD_PAGE_SIZE,
  resetKey = 'default',
}: PaginatedHistoryListProps<T>) {
  const [paginationState, setPaginationState] = useState({ resetKey, page: 1 });
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const requestedPage = paginationState.resetKey === resetKey ? paginationState.page : 1;
  const page = Math.min(requestedPage, totalPages);

  const start = (page - 1) * pageSize;
  return (
    <>
      {renderItems(items.slice(start, start + pageSize))}
      {items.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: spaceMd }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={items.length}
            showSizeChanger={false}
            onChange={(nextPage) => setPaginationState({ resetKey, page: nextPage })}
          />
        </div>
      )}
    </>
  );
}
