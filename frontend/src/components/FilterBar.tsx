import { Select } from 'antd';
import { FilterOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useFilter } from '../context/FilterContext';
import { VIETNAM_PROVINCE_OPTIONS } from '../types/common';
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

const INFRA_TYPE_OPTIONS = [
  { value: 'ports', label: 'Cảng biển' },
  { value: 'berths', label: 'Bến cảng' },
  { value: 'piers', label: 'Cầu cảng' },
  { value: 'dry_ports', label: 'Cảng cạn' },
  { value: 'water_zones', label: 'Vùng nước' },
  { value: 'beacon_light', label: 'Đèn biển' },
  { value: 'buoy', label: 'Phao tiêu' },
  { value: 'navigation_channel', label: 'Luồng hàng hải' },
  { value: 'dike_revetment', label: 'Đê, kè' },
  { value: 'radar_station', label: 'Trạm Radar' },
  { value: 'vts_system', label: 'Hệ thống VTS' },
  { value: 'ship_repair_facility', label: 'Cơ sở sửa chữa, đóng tàu' },
  { value: 'buoy_station', label: 'Nhà trạm quản lý vận hành phao tiêu' },
  { value: 'coastal_station_vts', label: 'Đài Thông tin Duyên hải' },
  { value: 'coastal_station_lrit', label: 'Đài Nhận dạng và truy theo tầm xa (LRIT)' },
  { value: 'coastal_station_inmarsat', label: 'Đài Thông tin vệ tinh Inmarsat' },
  { value: 'coastal_station_haiphong', label: 'Đài TTXL thông tin hàng hải Hải Phòng' },
  { value: 'coastal_station_cospas_sarsat', label: 'Đài Thông tin vệ tinh Cospas-Sarsat' },
];

const ALL_VALUE = 'Tất cả';

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
      <Select
        size='small'
        value={province ?? ALL_VALUE}
        onChange={(val) => setProvince(val === ALL_VALUE ? null : val)}
        style={{ width: 180 }}
        options={[{ value: ALL_VALUE, label: ALL_VALUE }, ...VIETNAM_PROVINCE_OPTIONS]}
      />
      <Select
        size='small'
        value={infraType ?? ALL_VALUE}
        onChange={(val) => setInfraType(val === ALL_VALUE ? null : val)}
        style={{ width: 170 }}
        options={[{ value: ALL_VALUE, label: ALL_VALUE }, ...INFRA_TYPE_OPTIONS]}
      />
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: spaceSm }}>
        <ClockCircleOutlined style={{ color: textTertiary, fontSize: fontSizeMd }} />
        <span style={{ fontSize: fontSizeMd, color: textTertiary }}>Cập nhật lúc {lastUpdated}</span>
      </div>
    </div>
  );
}
