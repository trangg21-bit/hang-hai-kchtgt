import { Select } from 'antd';
import { FilterOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useFilter } from '../context/FilterContext';
import { bg, ink2, ink3, rSm, line } from '../tokens-dashboard';

const spaceSm = 8;
const spaceMd = 16;
const spaceLg = 24;

const YEAR_OPTIONS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

const PROVINCE_OPTIONS = [
  'Tất cả', 'Hải Phòng', 'TP.HCM', 'Đà Nẵng', 'Quảng Ninh', 'Bà Rịa - Vũng Tàu', 'Khánh Hòa',
];

const INFRA_TYPE_OPTIONS = [
  'Tất cả', 'Cảng biển', 'Bến cảng', 'Cầu cảng', 'Luồng hàng hải', 'Đèn biển', 'Phao tiêu', 'Đê/Kè',
];

export default function FilterBar() {
  const { year, province, infraType, lastUpdated, setYear, setProvince, setInfraType } = useFilter();
  return (
    <div
      style={{
        background: bg,
        borderRadius: rSm,
        border: `1px solid ${line}`,
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: spaceMd,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm }}>
        <FilterOutlined style={{ color: ink2, fontSize: 15 }} />
        <span style={{ fontSize: 13, color: ink2 }}>Bộ lọc</span>
      </div>
      <Select size='small' value={year} onChange={(val) => setYear(val)} style={{ width: 100 }} options={YEAR_OPTIONS.map((y) => ({ value: y, label: y.toString() }))} />
      <Select size='small' value={province ?? 'Tất cả'} onChange={(val) => setProvince(val === 'Tất cả' ? null : val)} style={{ width: 180 }} options={PROVINCE_OPTIONS.map((p) => ({ value: p, label: p }))} />
      <Select size='small' value={infraType ?? 'Tất cả'} onChange={(val) => setInfraType(val === 'Tất cả' ? null : val)} style={{ width: 170 }} options={INFRA_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))} />
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: spaceSm }}>
        <ClockCircleOutlined style={{ color: ink3, fontSize: 11 }} />
        <span style={{ fontSize: 11, color: ink3 }}>Cập nhật lúc {lastUpdated}</span>
      </div>
    </div>
  );
}