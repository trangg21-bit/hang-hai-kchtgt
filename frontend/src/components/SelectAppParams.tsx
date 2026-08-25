import { Select } from 'antd';
import type { SelectProps } from 'antd/es/select';
import { spaceMd, spaceSm } from '../tokens';

export interface AppParamsOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectAppParamsProps extends Omit<SelectProps, 'options'> {
  groupName: string;
  options?: AppParamsOption[];
}

const DEFAULT_OPTIONS: Record<string, AppParamsOption[]> = {
  TRANG_THAI_HOAT_DONG: [
    { value: 'OPERATIONAL', label: 'Hiện hành' },
    { value: 'SUSPENDED', label: 'Tạm ngừng' },
  ],
  TRANG_THAI_PHE_DUYET: [
    { value: 'PENDING_APPROVAL', label: 'Chờ phê duyệt' },
    { value: 'APPROVED', label: 'Đã phê duyệt' },
    { value: 'REJECTED', label: 'Từ chối' },
  ],
  DON_VI_TINH: [
    { value: 'CAI', label: 'Cái' },
    { value: 'SET', label: 'Bộ' },
    { value: 'SETUP', label: 'Bộ lắp đặt' },
    { value: 'UNIT', label: 'Đơn vị' },
  ],
  LOAI_DOI_TUONG: [
    { value: '0', label: 'Điểm' },
    { value: '1', label: 'Đường' },
    { value: '2', label: 'Vùng' },
  ],
  HET_VAN_CHUA: [
    { value: 'WGS84', label: 'WGS 84' },
    { value: 'NAD83', label: 'NAD 83' },
    { value: 'NAD27', label: 'NAD 27' },
    { value: 'ETRS89', label: 'ETRS 89' },
  ],
  QUY_TAC_HIEN_THI: [
    { value: 'DEFAULT', label: 'Mặc định' },
    { value: 'ENHANCED', label: 'Tăng cường' },
    { value: 'SIMPLIFIED', label: 'Đơn giản hóa' },
    { value: 'DETAIL', label: 'Chi tiết' },
  ],
  TINH_TRANG: [
    { value: 'CHUA_KHAI_THAC', label: 'Chưa khai thác/vận hành' },
    { value: 'DANG_KHAI_THAC', label: 'Đang khai thác/vận hành' },
    { value: 'DUNG_KHAI_THAC', label: 'Dừng khai thác/vận hành' },
  ],
  LOAI_DOCUMENT: [
    { value: 'PDF', label: 'PDF' },
    { value: 'IMAGE', label: 'Hình ảnh' },
    { value: 'DRAWING', label: 'Bản vẽ' },
    { value: 'REPORT', label: 'Báo cáo' },
  ],
};

export const SelectAppParams = ({
  groupName,
  options,
  ...rest
}: SelectAppParamsProps) => {
  const actualOptions = options || DEFAULT_OPTIONS[groupName] || [];

  if (actualOptions.length === 0) {
    return <span style={{ color: '#999' }}>Chưa có tùy chọn cho nhóm {groupName}</span>;
  }

  return <Select options={actualOptions} {...rest} />;
};

export default SelectAppParams;
