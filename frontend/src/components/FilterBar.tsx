import { Select } from 'antd';
import { FilterOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useFilter } from '../context/FilterContext';
import { VIETNAM_PROVINCES } from '../types/common';
import {
  surfacePage,
  textSecondary,
  textTertiary,
  radiusSm,
  borderDefault as line,
  spaceSm,
  spaceMd,
  fontSizeMd,
} from '../tokens-dashboard';

const YEAR_OPTIONS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

const PROVINCE_OPTIONS = ['Tất cả', ...VIETNAM_PROVINCES];

const INFRA_TYPE_OPTIONS = [
  'Tất cả',
  'Bến cảng', 'Bến phao', 'Cảng biển', 'Cảng cạn', 'Cầu cảng',
  'Cơ sở sửa chữa, đóng tàu', 'Đài Thông tin Duyên hải', 'Đài Thông tin vệ tinh Inmarsat',
  'Đài Thông tin vệ tinh Cospas-Sarsat', 'Đài TTXL thông tin hàng hải Hà Nội',
  'Đài Nhận dạng và truy theo tầm xa (LRIT)', 'Đèn biển', 'Đê chắn sóng, đê chắn cát',
  'Hệ thống VTS', 'Kè hướng dòng, kè bảo vệ bờ', 'Khu chuyển tải',
  'Khu neo đậu', 'Khu tránh trú bão', 'Luồng hàng hải',
  'Nhà trạm quản lý vận hành phao tiêu', 'Phao tiêu', 'Trạm Radar',
];

export default function FilterBar() {
  const { year, province, infraType, lastUpdated, setYear, setProvince, setInfraType } = useFilter();
  return (
    <div
      style={{
        background: surfacePage,
        borderRadius: radiusSm,
        border: `1px solid ${line}`,
        padding: `${spaceSm}px ${spaceMd}px`,
        display: 'flex',
        alignItems: 'center',
        gap: spaceMd,
        flexWrap: 'wrap',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: spaceMd,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm }}>
        <FilterOutlined style={{ color: textSecondary, fontSize: 15 }} />
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>Bộ lọc</span>
      </div>
      <Select size='small' value={year} onChange={(val) => setYear(val)} style={{ width: 100 }} options={YEAR_OPTIONS.map((y) => ({ value: y, label: y.toString() }))} />
      <Select size='small' value={province ?? 'Tất cả'} onChange={(val) => setProvince(val === 'Tất cả' ? null : val)} style={{ width: 180 }} options={PROVINCE_OPTIONS.map((p) => ({ value: p, label: p }))} />
      <Select size='small' value={infraType ?? 'Tất cả'} onChange={(val) => setInfraType(val === 'Tất cả' ? null : val)} style={{ width: 170 }} options={INFRA_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))} />
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: spaceSm }}>
        <ClockCircleOutlined style={{ color: textTertiary, fontSize: fontSizeMd }} />
        <span style={{ fontSize: fontSizeMd, color: textTertiary }}>Cập nhật lúc {lastUpdated}</span>
      </div>
    </div>
  );
}
