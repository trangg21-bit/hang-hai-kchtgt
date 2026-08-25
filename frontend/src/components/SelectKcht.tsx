import { useEffect, useState } from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd/es/select';
import api from '../services/api';

export interface KchtOption {
  id: string;
  name: string;
  code: string;
  type: string; // 'CB' | 'RADAR' | 'ATHH'
}

export interface SelectKchtProps extends Omit<SelectProps, 'options' | 'showSearch'> {
  category?: 'CB' | 'RADAR' | 'ATHH';
  allowClear?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string | undefined) => void;
}

const API_PATHS: Record<string, string> = {
  CB: '/v1/ports',
  RADAR: '/v1/radar-station',
  ATHH: '/v1/coastal-stations',
};

export const SelectKcht = ({
  category = 'RADAR',
  allowClear = true,
  placeholder = 'Chọn tài sản KCHT...',
  disabled = false,
  onChange,
  ...rest
}: SelectKchtProps) => {
  const [options, setOptions] = useState<KchtOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const endpoint = API_PATHS[category] || API_PATHS.RADAR;
        const res = await api.get(endpoint, { params: { size: 100, page: 0 } });
        const data = res.data.data.content || [];
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.deviceName || item.name || 'Không tên',
          code: item.deviceCode || item.code || item.portCode || '',
          type: category,
        }));
        setOptions(mapped);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, [category]);

  return (
    <Select
      allowClear={allowClear}
      placeholder={placeholder}
      loading={loading}
      disabled={disabled}
      options={options.map((o) => ({
        label: `${o.code} - ${o.name} (${o.type})`,
        value: o.id,
      }))}
      onChange={onChange}
      showSearch
      optionFilterProp="label"
      {...rest}
    />
  );
};

export default SelectKcht;
