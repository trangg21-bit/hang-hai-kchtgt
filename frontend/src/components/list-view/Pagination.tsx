import React from 'react';
import { Select } from 'antd';
import { LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { useThemeToken } from '../../context/ThemeTokenContext';

export interface PaginationProps {
  total: number; current: number; pageSize: number;
  pageSizeOptions?: number[]; onChange: (page: number, pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  total, current, pageSize, pageSizeOptions = [20, 50, 100], onChange,
}) => {
  const {
    textSecondary, fontSizeMd, fontWeightBold, fontWeightMedium,
    borderDefault, spaceSm, radiusPill, paginationSizeSelectStyle, dataSea1,
  } = useThemeToken();

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, border: `1px solid ${borderDefault}`, borderRadius: '50%',
    cursor: 'pointer', fontWeight: fontWeightMedium, fontSize: fontSizeMd,
    color: textSecondary, transition: 'background 0.15s, color 0.15s',
  };

  const totalPages = Math.ceil(total / pageSize);
  const isFirst = current <= 1;
  const isLast = current >= totalPages;

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
    if (p === '...') return <span key={`dots-${idx}`} style={{ ...btnBase, border: 'none', cursor: 'default', width: 32, height: 32 }}>...</span>;
    const isActive = p === current;
    return (
      <button key={p} type="button" onClick={() => onChange(p, pageSize)}
        style={{
          ...btnBase,
          background: isActive ? `${dataSea1}15` : 'transparent',
          color: isActive ? dataSea1 : textSecondary,
          borderColor: isActive ? `${dataSea1}40` : borderDefault,
          fontWeight: isActive ? fontWeightBold : fontWeightMedium,
          cursor: isActive ? 'default' : 'pointer',
          width: 32, height: 32,
        }}>
        {p}
      </button>
    );
  };

  return (
    <div className="list-view-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      padding: '8px 0', flexWrap: 'wrap', gap: spaceSm }}>
      <style>{`.page-size-select .ant-select-item-option { border-radius: ${radiusPill}px !important; margin: 2px 4px; }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm }}>
        <span style={{ color: textSecondary, fontSize: fontSizeMd }}>
          Tổng cộng:{' '}
          <span style={{ fontWeight: fontWeightBold }}>{total}</span>
        </span>
        <button type="button" style={{ ...btnBase, opacity: isFirst ? 0.35 : 1, cursor: isFirst ? 'not-allowed' : 'pointer' }}
          disabled={isFirst} onClick={() => onChange(1, pageSize)}>
          <DoubleLeftOutlined />
        </button>
        <button type="button" style={{ ...btnBase, opacity: isFirst ? 0.35 : 1, cursor: isFirst ? 'not-allowed' : 'pointer' }}
          disabled={isFirst} onClick={() => onChange(current - 1, pageSize)}>
          <LeftOutlined />
        </button>
        {pageNumbers.map(pageBtn)}
        <button type="button" style={{ ...btnBase, opacity: isLast ? 0.35 : 1, cursor: isLast ? 'not-allowed' : 'pointer' }}
          disabled={isLast} onClick={() => onChange(current + 1, pageSize)}>
          <RightOutlined />
        </button>
        <button type="button" style={{ ...btnBase, opacity: isLast ? 0.35 : 1, cursor: isLast ? 'not-allowed' : 'pointer' }}
          disabled={isLast} onClick={() => onChange(totalPages, pageSize)}>
          <DoubleRightOutlined />
        </button>
        <Select className="page-size-select" value={pageSize} onChange={(val) => onChange(1, val)}
          options={pageSizeOptions.map((n) => ({ value: n, label: `${n} / trang` }))}
          style={{ ...paginationSizeSelectStyle, width: 110, height: 32, fontSize: fontSizeMd }}
          popupMatchSelectWidth={false}
        />
      </div>
    </div>
  );
};

export default Pagination;
