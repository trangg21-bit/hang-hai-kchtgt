import { Input, Select, Button, Space, Tag } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { SelectProps } from 'antd';

interface FilterOption {
  label: string;
  value: string;
}

interface SearchFilterProps {
  onSearch: (value: string) => void;
  onFilter: (key: string, value: string) => void;
  onReset: () => void;
  placeholder?: string;
  filters?: {
    key: string;
    label: string;
    options: FilterOption[];
  }[];
  width?: number;
  showCount?: boolean;
}

/**
 * SearchFilter component v?i search theo name/email, filter theo status/role,
 * và nút reset d? xóa t?t c? b? l?c.
 */
export default function SearchFilter({
  onSearch,
  onFilter,
  onReset,
  placeholder = 'Tìm ki?m...',
  filters = [],
  width = 600,
  showCount = true,
}: SearchFilterProps) {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const handleFilterChange = (key: string, value: string | number | string[]) => {
    onFilter(key, value as string);
    const filterValues = filters.map((f) => {
      const val = (f.options as FilterOption[]).find((o) => o.value === value);
      return val ? val.value : '';
    }).filter(Boolean).length;
    setActiveFilterCount(filterValues);
  };

  const handleReset = () => {
    setSearchValue('');
    setActiveFilterCount(0);
    filters.forEach((f) => {
      onFilter(f.key, '');
    });
    onReset();
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        size="large"
        placeholder={placeholder}
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        allowClear
        style={{ width }}
        onPressEnter={() => onSearch(searchValue)}
      />
      {filters.map((filter) => (
        <Select
          key={filter.key}
          placeholder={filter.label}
          allowClear
          size="large"
          style={{ width: 150 }}
          onChange={(value) => handleFilterChange(filter.key, value)}
          options={filter.options}
          optionRender={(option) => (
            <Space>
              <span>{option.label}</span>
              {option.data?.active && (
                <Tag color="blue" style={{ marginLeft: 'auto' }}>
                  Ðã ch?n
                </Tag>
              )}
            </Space>
          )}
        />
      ))}
      {activeFilterCount > 0 && (
        <Button
          size="large"
          icon={<ReloadOutlined />}
          onClick={handleReset}
          style={{ width: 80 }}
        >
          Xóa l?c
        </Button>
      )}
    </Space.Compact>
  );
}
