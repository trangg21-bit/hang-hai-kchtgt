import React, { useMemo } from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import {
  actionPrimary,
  borderDefault,
  fontSizeMd,
  fontWeightMedium,
  multiSelectTagStyle,
  radiusMd,
  spaceSm,
  surfacePage,
  textSecondary,
} from '../../themetokenchk';

export interface ServiceOption {
  value: string;
  label: string;
}

export interface ServiceMultiSelectProps {
  options?: ServiceOption[];
  value?: string[] | string;
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  showSearch?: boolean;
  filterOption?: SelectProps['filterOption'];
}

const serviceTagRender: SelectProps['tagRender'] = ({ label, value, closable, onClose }) => {
  const displayValue = typeof label === 'string' && label.trim()
    ? label.trim()
    : String(value ?? '').trim();

  return (
    <span
      style={{
        ...multiSelectTagStyle,
        display: 'flex',
        alignItems: 'center',
        gap: spaceSm,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        margin: 0,
        padding: `2px ${spaceSm}px`,
        border: `1px solid ${borderDefault}`,
        borderRadius: radiusMd,
        background: surfacePage,
        color: textSecondary,
        fontSize: fontSizeMd,
        fontWeight: fontWeightMedium,
        lineHeight: '20px',
      }}
    >
      <span
        style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={displayValue}
      >
        {displayValue}
      </span>
      {closable && (
        <button
          type="button"
          onClick={onClose}
          aria-label={`Bỏ ${displayValue}`}
          style={{
            border: 0,
            padding: 0,
            background: 'transparent',
            color: actionPrimary,
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default function ServiceMultiSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Chọn dịch vụ cung cấp',
  disabled = false,
  showSearch = false,
  filterOption,
}: ServiceMultiSelectProps) {
  const cleanValue = useMemo(() => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item).trim()).filter(Boolean);
          }
        } catch {}
      }
      return trimmed.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [value]);

  return (
    <Select
      mode="multiple"
      allowClear
      showSearch={showSearch}
      value={cleanValue}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      tagRender={serviceTagRender}
      filterOption={filterOption}
      className="chk-multi-select"
      style={{ width: '100%' }}
    />
  );
}
