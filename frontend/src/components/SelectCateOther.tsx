import { useEffect, useState } from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd/es/select';
import api from '../services/api';

export interface CateOtherOption {
  value: string;
  label: string;
  parentId?: string;
}

export interface SelectCateOtherProps extends Omit<SelectProps, 'options' | 'showSearch'> {
  category?: string;
  isTree?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string | undefined) => void;
}

const DEFAULT_CATEGORIES: Record<string, CateOtherOption[]> = {
  DON_VI_KHAI_THAC: [],
  DON_VI_HANH_CHINH: [
    { value: 'TP_HANOI', label: 'Hà Nội' },
    { value: 'TP_HCM', label: 'TP. Hồ Chí Minh' },
    { value: 'HAIPHONG', label: 'Hải Phòng' },
    { value: 'DANANG', label: 'Đà Nẵng' },
    { value: 'BARIATUANG', label: 'Bà Rịa - Vũng Tàu' },
    { value: 'NAMDINH', label: 'Nam Định' },
    { value: 'THUATHIENHUE', label: 'Thừa Thiên Huế' },
    { value: 'QUANGNAM', label: 'Quảng Nam' },
    { value: 'QUANGNGAI', label: 'Quảng Ngãi' },
    { value: 'BINHDINH', label: 'Bình Định' },
    { value: 'KHANHHOA', label: 'Khánh Hòa' },
    { value: 'BINHTHUAN', label: 'Bình Thuận' },
    { value: 'TAYNINH', label: 'Tây Ninh' },
    { value: 'DONGNAI', label: 'Đồng Nai' },
    { value: 'BATHUACHA', label: 'Bạc Liêu' },
    { value: 'KIENGIANG', label: 'Kiên Giang' },
  ],
};

export const SelectCateOther = ({
  category = 'DON_VI_KHAI_THAC',
  isTree = false,
  allowClear = true,
  placeholder = 'Chọn...',
  disabled = false,
  onChange,
  ...rest
}: SelectCateOtherProps) => {
  const [options, setOptions] = useState<CateOtherOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const cached = DEFAULT_CATEGORIES[category];
        if (cached) {
          setOptions(cached);
        } else {
          const res = await api.get('/api/v1/app-params', { params: { category } });
          const data = res.data.data || [];
          setOptions(
            Array.isArray(data)
              ? data.map((item: any) => ({
                  value: item.value || String(item.id),
                  label: item.label || item.name || String(item.value),
                  parentId: item.parentId,
                }))
              : []
          );
        }
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
      options={options}
      onChange={onChange}
      showSearch
      optionFilterProp="label"
      mode={isTree ? undefined : undefined}
      {...rest}
    />
  );
};

export default SelectCateOther;
