import React, { useState } from 'react';
import { Input, Select, Button, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  cardStyle, fontSizeMd, fontWeightBold, spaceSm,
  radiusPill, actionPrimary, textSecondary, borderDefault,
} from '../../tokens';
import { colors } from '../../theme';

export interface FilterField {
  key: string; type: 'search' | 'select' | 'dateRange' | 'date'; label: string;
  placeholder?: string; options?: { value: string; label: string }[]; width?: number;
}

export interface FilterBarProps {
  fields: FilterField[]; onSearch: (values: Record<string, any>) => void;
  onReset: () => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightBold, marginBottom: 4,
};

const FilterBar: React.FC<FilterBarProps> = ({
  fields, onSearch, onReset,
}) => {
  const [values, setValues] = useState<Record<string, any>>({});

  const handleFieldChange = (key: string, value: any) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const handleSearch = () => onSearch(values);
  const handleReset = () => { setValues({}); onReset(); };

  return (
    <div style={{ ...cardStyle, marginBottom: 4 }}>
      <div style={{
        display: 'flex', gap: spaceSm, alignItems: 'flex-end', flexWrap: 'wrap',
      }}>
        {fields.map((field) => (
          <div key={field.key} style={{ flex: '1 1 160px', minWidth: 140 }}>
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
              <Select placeholder={field.placeholder} allowClear
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
        ))}
        <div style={{ display: 'flex', gap: spaceSm, flexShrink: 0 }}>
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
