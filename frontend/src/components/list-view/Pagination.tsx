import React from 'react';
import { Select } from 'antd';
import { LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { useThemeToken } from '../../context/ThemeTokenContext';

export interface PaginationProps {
  total: number;
  current: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onChange: (page: number, pageSize: number) => void;
  compact?: boolean;
  align?: 'left' | 'center' | 'right' | 'space-between';
  showSizeChanger?: boolean;
  showTotal?: boolean;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

const Pagination: React.FC<PaginationProps> = ({
  total,
  current,
  pageSize,
  pageSizeOptions = [20, 50, 100],
  onChange,
  compact = false,
  align = 'space-between',
  showSizeChanger = true,
  showTotal = true,
  fontSize = 13.5,
  className,
  style,
}) => {
  const {
    textSecondary, fontWeightBold, fontWeightMedium,
    borderDefault, spaceSm, radiusPill, paginationSizeSelectStyle, dataSea1,
  } = useThemeToken();

  const btnSize = 32;
  const btnFontSize = fontSize;
  const controlGap = compact ? 4 : 6;
  const selectWidth = 114;

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: btnSize,
    height: btnSize,
    minWidth: btnSize,
    border: `1px solid ${borderDefault}`,
    borderRadius: '50%',
    cursor: 'pointer',
    fontWeight: fontWeightMedium,
    fontSize: btnFontSize,
    color: textSecondary,
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
    padding: 0,
    flexShrink: 0,
    boxSizing: 'border-box',
  };

  const totalPages = Math.ceil(total / pageSize);
  const isFirst = current <= 1;
  const isLast = current >= totalPages || totalPages <= 1;

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    pages.push(1);
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const pageBtn = (p: number | '...', idx: number) => {
    if (p === '...') {
      return (
        <span
          key={`dots-${idx}`}
          style={{
            ...btnBase,
            border: 'none',
            cursor: 'default',
            width: compact ? 20 : btnSize,
            minWidth: compact ? 20 : btnSize,
          }}
        >
          ...
        </span>
      );
    }
    const isActive = p === current;
    return (
      <button
        key={p}
        type="button"
        onClick={() => onChange(p, pageSize)}
        aria-label={`Trang ${p}`}
        aria-current={isActive ? 'page' : undefined}
        style={{
          ...btnBase,
          background: isActive ? `${dataSea1}15` : 'transparent',
          color: isActive ? dataSea1 : textSecondary,
          borderColor: isActive ? `${dataSea1}40` : borderDefault,
          fontWeight: isActive ? fontWeightBold : fontWeightMedium,
          cursor: isActive ? 'default' : 'pointer',
        }}
      >
        {p}
      </button>
    );
  };

  return (
    <div
      className={`list-view-pagination ${className || ''} ${compact ? 'list-view-pagination--compact' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'space-between'
          ? 'space-between'
          : align === 'left'
            ? 'flex-start'
            : align === 'center'
              ? 'center'
              : 'flex-end',
        flexWrap: 'wrap',
        rowGap: 8,
        columnGap: compact ? 6 : spaceSm,
        padding: '8px 0',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <style>{`
        .list-view-pagination {
          container-type: inline-size;
        }
        .page-size-select .ant-select-item-option {
          border-radius: ${radiusPill}px !important;
          margin: 2px 4px;
        }
        .page-size-select .ant-select-selector {
          font-size: ${btnFontSize}px !important;
          height: ${btnSize}px !important;
          display: flex !important;
          align-items: center !important;
        }
        .page-size-select .ant-select-selection-item {
          font-size: ${btnFontSize}px !important;
          line-height: ${btnSize - 2}px !important;
        }
        .page-size-select-popup .ant-select-item-option-content {
          font-size: ${btnFontSize}px !important;
        }
        @container (max-width: 540px) {
          .list-view-pagination .pagination-btn-extreme {
            display: none !important;
          }
        }
        @media (max-width: 576px) {
          .list-view-pagination .pagination-btn-extreme {
            display: none !important;
          }
        }
      `}</style>

      {showTotal && (
        <div
          className="pagination-total"
          style={{
            color: textSecondary,
            fontSize: btnFontSize,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            lineHeight: `${btnSize}px`,
          }}
        >
          {compact ? 'Tổng:' : 'Tổng cộng:'}{' '}
          <span style={{ fontWeight: fontWeightBold }}>
            {total.toLocaleString('vi-VN')}
          </span>
        </div>
      )}

      <div
        className="pagination-controls"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: controlGap,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          maxWidth: '100%',
        }}
      >
        {!compact && (
          <button
            type="button"
            className="pagination-btn-extreme"
            style={{
              ...btnBase,
              opacity: isFirst ? 0.35 : 1,
              cursor: isFirst ? 'not-allowed' : 'pointer',
            }}
            disabled={isFirst}
            onClick={() => onChange(1, pageSize)}
            title="Trang đầu"
            aria-label="Trang đầu"
          >
            <DoubleLeftOutlined />
          </button>
        )}
        <button
          type="button"
          style={{
            ...btnBase,
            opacity: isFirst ? 0.35 : 1,
            cursor: isFirst ? 'not-allowed' : 'pointer',
          }}
          disabled={isFirst}
          onClick={() => onChange(current - 1, pageSize)}
          title="Trang trước"
          aria-label="Trang trước"
        >
          <LeftOutlined />
        </button>
        {pageNumbers.map(pageBtn)}
        <button
          type="button"
          style={{
            ...btnBase,
            opacity: isLast ? 0.35 : 1,
            cursor: isLast ? 'not-allowed' : 'pointer',
          }}
          disabled={isLast}
          onClick={() => onChange(current + 1, pageSize)}
          title="Trang sau"
          aria-label="Trang sau"
        >
          <RightOutlined />
        </button>
        {!compact && (
          <button
            type="button"
            className="pagination-btn-extreme"
            style={{
              ...btnBase,
              opacity: isLast ? 0.35 : 1,
              cursor: isLast ? 'not-allowed' : 'pointer',
            }}
            disabled={isLast}
            onClick={() => onChange(totalPages, pageSize)}
            title="Trang cuối"
            aria-label="Trang cuối"
          >
            <DoubleRightOutlined />
          </button>
        )}
        {showSizeChanger && (
          <Select
            className="page-size-select"
            classNames={{ popup: { root: 'page-size-select-popup' } }}
            value={pageSize}
            onChange={(val) => onChange(1, val)}
            options={pageSizeOptions.map((n) => ({ value: n, label: `${n} / trang` }))}
            style={{
              ...paginationSizeSelectStyle,
              width: selectWidth,
              height: btnSize,
              fontSize: btnFontSize,
            }}
            popupMatchSelectWidth={false}
          />
        )}
      </div>
    </div>
  );
};

export default Pagination;
