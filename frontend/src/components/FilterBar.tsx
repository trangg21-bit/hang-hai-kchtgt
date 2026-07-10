import { Select } from 'antd';
import { FilterOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useFilter } from '../context/FilterContext';

// ============================================================
// Mock data
// ============================================================
const YEAR_OPTIONS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

const PROVINCE_OPTIONS = [
  'Tất cả',
  'Hải Phòng',
  'TP.HCM',
  'Đà Nẵng',
  'Quảng Ninh',
  'Bà Rịa - Vũng Tàu',
  'Khánh Hòa',
];

const INFRA_TYPE_OPTIONS = [
  'Tất cả',
  'Cảng biển',
  'Bến cảng',
  'Cầu cảng',
  'Luồng hàng hải',
  'Đèn biển',
  'Phao tiêu',
  'Đê/Kè',
];

// ============================================================
// FilterBar
// ============================================================
export default function FilterBar() {
  const { year, province, infraType, lastUpdated, setYear, setProvince, setInfraType } = useFilter();

  return (
    <div
      style={{
        background: '#F8F9FA',
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 10,
      }}
    >
      {/* Filter icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <FilterOutlined style={{ color: '#6B7280', fontSize: 14 }} />
        <span style={{ fontSize: 13, color: '#6B7280' }}>Bộ lọc</span>
      </div>

      {/* Year select */}
      <Select
        size="small"
        value={year}
        onChange={(val) => setYear(val)}
        style={{ width: 100 }}
        options={YEAR_OPTIONS.map((y) => ({ value: y, label: y.toString() }))}
      />

      {/* Province select */}
      <Select
        size="small"
        value={province ?? 'Tất cả'}
        onChange={(val) => setProvince(val === 'Tất cả' ? null : val)}
        style={{ width: 180 }}
        options={PROVINCE_OPTIONS.map((p) => ({ value: p, label: p }))}
      />

      {/* Infra type select */}
      <Select
        size="small"
        value={infraType ?? 'Tất cả'}
        onChange={(val) => setInfraType(val === 'Tất cả' ? null : val)}
        style={{ width: 170 }}
        options={INFRA_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
      />

      {/* Last updated timestamp — pushed to right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <ClockCircleOutlined style={{ color: '#6B7280', fontSize: 12 }} />
        <span style={{ fontSize: 12, color: '#6B7280' }}>Cập nhật lúc {lastUpdated}</span>
      </div>
    </div>
  );
}
