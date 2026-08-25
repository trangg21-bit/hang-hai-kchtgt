import React, { useState } from 'react';
import { Input, Select, Button, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  cardStyle, fontSizeMd, fontWeightBold, spaceSm,
  radiusPill, actionPrimary, textSecondary, borderDefault,
} from '../../tokens';
import { colors } from '../../theme';
import { normalizeSearchText } from '../org-unit';

export interface FilterField {
  key: string; type: 'search' | 'select' | 'dateRange' | 'date' | 'radio'; label: string;
  placeholder?: string; options?: { value: string | number; label: string }[]; width?: number;
}

export interface FilterBarExtraFilter {
  key: string;
  component: React.ReactNode;
  label?: string;
}

export interface FilterBarProps {
  fields?: FilterField[];
  onSearch?: (values?: Record<string, any>) => void;
  onReset?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  keyword?: string;
  onSearchChange?: (val: string) => void;
  onKeywordChange?: (val: string) => void;
  extraFilters?: FilterBarExtraFilter[];
  statusOptions?: { value: string | number; label: string }[];
  statusValue?: string | number;
  onStatusChange?: (val: any) => void;
  centerActions?: boolean;
  onFieldChange?: (key: string, value: any) => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4,
};

const FilterBar: React.FC<FilterBarProps> = ({
  fields,
  onSearch,
  onReset,
  searchPlaceholder,
  searchValue,
  keyword,
  onSearchChange,
  onKeywordChange,
  extraFilters,
  statusOptions,
  statusValue,
  onStatusChange,
  centerActions,
  onFieldChange,
}) => {
  const [values, setValues] = useState<Record<string, any>>({});

  const currentSearch = keyword !== undefined ? keyword : (searchValue || '');
  const handleSearchTextChange = (val: string) => {
    if (onKeywordChange) onKeywordChange(val);
    if (onSearchChange) onSearchChange(val);
  };

  const handleFieldChange = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (onFieldChange) onFieldChange(key, value);
  };

  const handleSearch = () => {
    if (onSearch) onSearch(values);
  };

  const handleReset = () => {
    setValues({});
    if (onKeywordChange) onKeywordChange('');
    if (onSearchChange) onSearchChange('');
    if (onStatusChange) onStatusChange(undefined);
    if (onReset) onReset();
  };

  // If fields prop is not provided, construct simple search bar UI
  const itemList = fields || [
    ...(searchPlaceholder !== undefined || searchValue !== undefined || keyword !== undefined ? [{
      key: 'search',
      type: 'search' as const,
      label: 'Tìm kiếm',
      placeholder: searchPlaceholder || 'Tìm theo tên, mã...',
    }] : []),
    ...(extraFilters || []),
    ...(statusOptions ? [{
      key: 'status',
      type: 'select' as const,
      label: 'Trạng thái',
      placeholder: 'Chọn trạng thái',
      options: statusOptions.map(o => ({ value: String(o.value), label: o.label })),
    }] : [])
  ];

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={{
        display: 'flex', gap: spaceSm, alignItems: 'flex-end', flexWrap: 'wrap',
      }}>
        {fields ? (
          fields.map((field) => (
            <div key={field.key} style={{ flex: field.width ? `0 0 ${field.width}px` : '1 1 160px', minWidth: field.width || 140 }}>
              <div style={labelStyle}>{field.label}</div>
              {field.type === 'search' && (
                <Input placeholder={field.placeholder}
                  prefix={<SearchOutlined style={{ color: colors.sidebarBg }} />} allowClear
                  value={values[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  onPressEnter={handleSearch}
                  style={{ borderRadius: radiusPill, height: 40 }} />
              )}
              {field.type === 'select' && (
                <Select placeholder="Tất cả" allowClear showSearch
                  filterOption={(input, option) => normalizeSearchText(String(option?.label ?? '')).includes(normalizeSearchText(input))}
                  value={values[field.key] || undefined}
                  onChange={(val) => handleFieldChange(field.key, val)}
                  options={field.options}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              )}
              {field.type === 'dateRange' && (
                <DatePicker.RangePicker value={values[field.key] || null}
                  onChange={(dates) => handleFieldChange(field.key, dates)}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              )}
              {field.type === 'date' && (
                <DatePicker value={values[field.key] || null}
                  onChange={(date) => handleFieldChange(field.key, date)}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              )}
            </div>
          ))
        ) : (
          <>
            <div style={{ flex: '1 1 200px', minWidth: 180 }}>
              <div style={labelStyle}>Tìm kiếm</div>
              <Input
                placeholder={searchPlaceholder || 'Tìm theo tên, mã...'}
                prefix={<SearchOutlined style={{ color: colors.sidebarBg }} />}
                allowClear
                value={currentSearch}
                onChange={(e) => handleSearchTextChange(e.target.value)}
                onPressEnter={() => onSearch && onSearch({})}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </div>
            {extraFilters?.map((extra) => (
              <div key={extra.key}>
                {extra.label && <div style={labelStyle}>{extra.label}</div>}
                {extra.component}
              </div>
            ))}
            {statusOptions && (
              <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                <div style={labelStyle}>Trạng thái</div>
                <Select
                  placeholder="Tất cả"
                  allowClear
                  showSearch
                  filterOption={(input, option) => normalizeSearchText(String(option?.label ?? '')).includes(normalizeSearchText(input))}
                  value={statusValue}
                  onChange={(val) => onStatusChange && onStatusChange(val)}
                  options={statusOptions.map(o => ({ value: o.value, label: o.label }))}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>
            )}
          </>
        )}
        {(itemList.length > 3 || centerActions) && <div style={{ width: '100%' }} />}
        <div style={{ display: 'flex', gap: spaceSm, justifyContent: centerActions ? 'center' : undefined, flex: centerActions ? 1 : undefined, marginLeft: itemList.length > 3 ? 'auto' : undefined }}>
          <Button icon={<ReloadOutlined />} onClick={handleReset}
            style={{ color: textSecondary, borderColor: borderDefault, borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}
            style={{ background: actionPrimary, borderColor: actionPrimary, borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>
            Tìm kiếm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
