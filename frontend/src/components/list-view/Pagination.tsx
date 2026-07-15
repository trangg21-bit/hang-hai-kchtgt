import React from 'react';
import { Select } from 'antd';
import { LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import {
  textSecondary, fontSizeMd, fontWeightBold, fontWeightMedium,
  borderDefault, spaceSm, radiusMd, dataSea1,
} from '../../tokens';

export interface PaginationProps {
  total: number; current: number; pageSize: number;
  pageSizeOptions?: number[]; onChange: (page: number, pageSize: number) => void;
}

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, border: `1px solid ${borderDefault}`, borderRadius: '50%',
  cursor: 'pointer', fontWeight: fontWeightMedium, fontSize: fontSizeMd,
  color: textSecondary, transition: 'background 0.15s, color 0.15s',
};

const Pagination: React.FC<PaginationProps> = ({
  total, current, pageSize, pageSizeOptions = [10, 20, 50, 100], onChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const isFirst = current <= 1;
  const isLast = current >= totalPages;

  const currentPageBtn = (
    <span style={{
      ...btnBase,
      background: `${dataSea1}15`,
      color: dataSea1,
      borderColor: `${dataSea1}40`,
      borderRadius: '50%',
      fontWeight: fontWeightBold,
      cursor: 'default',
      width: 32, height: 32,
    }}>
      {current}
    </span>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      padding: '8px 0', flexWrap: 'wrap', gap: spaceSm }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm }}>
        <span style={{ color: textSecondary, fontSize: fontSizeMd }}>
          Tổng cộng:{' '}
          <span style={{ fontWeight: fontWeightBold }}>{total}</span>
        </span>
        <button style={{ ...btnBase, opacity: isFirst ? 0.35 : 1, cursor: isFirst ? 'not-allowed' : 'pointer' }}
          disabled={isFirst} onClick={() => onChange(1, pageSize)}>
          <DoubleLeftOutlined />
        </button>
        <button style={{ ...btnBase, opacity: isFirst ? 0.35 : 1, cursor: isFirst ? 'not-allowed' : 'pointer' }}
          disabled={isFirst} onClick={() => onChange(current - 1, pageSize)}>
          <LeftOutlined />
        </button>
        {currentPageBtn}
        <button style={{ ...btnBase, opacity: isLast ? 0.35 : 1, cursor: isLast ? 'not-allowed' : 'pointer' }}
          disabled={isLast} onClick={() => onChange(current + 1, pageSize)}>
          <RightOutlined />
        </button>
        <button style={{ ...btnBase, opacity: isLast ? 0.35 : 1, cursor: isLast ? 'not-allowed' : 'pointer' }}
          disabled={isLast} onClick={() => onChange(totalPages, pageSize)}>
          <DoubleRightOutlined />
        </button>
        <Select value={pageSize} onChange={(val) => onChange(1, val)}
          options={pageSizeOptions.map((n) => ({ value: n, label: `${n}` }))}
          style={{ width: 80, borderRadius: radiusMd, height: 34, fontSize: fontSizeMd }} />
      </div>
    </div>
  );
};

export default Pagination;
