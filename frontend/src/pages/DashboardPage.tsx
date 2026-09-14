import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Table, Tag, Input, Button, Tooltip, Select } from 'antd';
import type { TableProps } from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { VIETNAM_PROVINCES } from '../types/common';
import { FilterProvider, useFilter } from '../context/FilterContext';
import FilterBar from '../components/FilterBar';
import DashboardMap from '../components/DashboardMap';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import * as themeTokenChk from '../themetokenchk';
import {
  colors,
  actionPrimary,
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  statusBadgeStyle,
  textPrimary,
  textSecondary,
  textTertiary,
  surfaceCard,
  borderDefault,
  radiusSm,
  radiusMd,
  radiusLg,
  radiusPill,
  shadowSm,
  fontMono,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontSizeDisplay,
  fontWeightBold,
  fontWeightMedium,
  chartGrid,
  chartTooltip,
  chartTextStyle,
} from '../themetokenchk';
import { ThemeTokenProvider } from '../context/ThemeTokenContext';
import { ScreenHeader } from '../components/list-view';
import { dashboardApi } from '../services/dashboardApi';
import { MOCK_DATA } from '../services/dashboardMockData';
import type { DashboardData, BlockState } from '../services/dashboardTypes';

// ============================================================
// Shared Card & Container Styles
// ============================================================
const CARD_BASE: React.CSSProperties = {
  background: surfaceCard,
  borderRadius: radiusLg,
  padding: '16px 18px',
  border: `1px solid ${borderDefault}`,
  boxShadow: shadowSm,
  display: 'flex',
  flexDirection: 'column',
};

const CHART_TITLE_STYLE: React.CSSProperties = {
  color: colors.sidebarBg,
  fontSize: fontSizeLg,
  fontWeight: fontWeightBold,
  margin: 0,
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

// 6 chuỗi màu chuyên nghiệp theo chuẩn dải màu hàng hải của hệ thống
const CARGO_SERIES_COLORS = [
  colors.sidebarBg, // #1a3f83 - Nội địa
  actionPrimary,    // #204e9c - Nhập khẩu
  '#0284c7',        // Sky - Xuất khẩu
  '#0ea5e9',        // Light sky - Chuyển tải
  '#14b8a6',        // Teal - Quá cảnh (bốc dỡ)
  '#2dd4bf',        // Light teal - Quá cảnh (K bốc dỡ)
];

const CARGO_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const CARGO_SERIES = [
  { name: 'Nội địa', data: [6500, 6100, 7000, 7200, 7400, 7600, 7700, null, null, null, null, null], color: CARGO_SERIES_COLORS[0] },
  { name: 'Nhập khẩu', data: [3100, 2900, 3400, 3500, 3600, 3700, 3750, null, null, null, null, null], color: CARGO_SERIES_COLORS[1] },
  { name: 'Xuất khẩu', data: [3800, 3500, 4100, 4300, 4400, 4500, 4600, null, null, null, null, null], color: CARGO_SERIES_COLORS[2] },
  { name: 'Chuyển tải', data: [1800, 1600, 1900, 1950, 2000, 2050, 2100, null, null, null, null, null], color: CARGO_SERIES_COLORS[3] },
  { name: 'Quá cảnh (bốc dỡ)', data: [1200, 1050, 1300, 1350, 1400, 1450, 1480, null, null, null, null, null], color: CARGO_SERIES_COLORS[4] },
  { name: 'Quá cảnh (K bốc dỡ)', data: [950, 820, 1000, 1050, 1080, 1120, 1150, null, null, null, null, null], color: CARGO_SERIES_COLORS[5] },
];

// ============================================================
// Dữ liệu bảng thông số kỹ thuật Kết cấu hạ tầng
// ============================================================
interface InfraRow {
  sequenceNo: number;
  code?: string;
  type: string;
  total: number;
  pending: number;
  operating: number;
  suspended: number;
}

export const INFRA_DATA: InfraRow[] = [
  { sequenceNo: 1, type: 'Bến cảng', total: 42, pending: 5, operating: 34, suspended: 3 },
  { sequenceNo: 2, type: 'Bến phao', total: 18, pending: 2, operating: 15, suspended: 1 },
  { sequenceNo: 3, type: 'Cầu cảng', total: 56, pending: 8, operating: 45, suspended: 3 },
  { sequenceNo: 4, type: 'Khu neo đậu', total: 24, pending: 4, operating: 19, suspended: 1 },
  { sequenceNo: 5, type: 'Khu chuyển tải', total: 12, pending: 2, operating: 9, suspended: 1 },
  { sequenceNo: 6, type: 'Luồng hàng hải', total: 38, pending: 5, operating: 33, suspended: 0 },
  { sequenceNo: 7, type: 'Đèn biển', total: 215, pending: 12, operating: 198, suspended: 5 },
  { sequenceNo: 8, type: 'Phao tiêu', total: 183, pending: 9, operating: 170, suspended: 4 },
  { sequenceNo: 9, type: 'Đê chắn sóng', total: 8, pending: 1, operating: 7, suspended: 0 },
  { sequenceNo: 10, type: 'Kè bảo vệ bờ', total: 15, pending: 2, operating: 12, suspended: 1 },
];

const KCHT_LABEL_ROUTES: Record<string, string> = {
  'Cảng biển': '/port',
  'Bến cảng': '/berth',
  'Cầu cảng': '/pier',
  'Cảng cạn': '/dry-port',
  'Khu neo đậu': '/anchorage',
  'Khu chuyển tải': '/transfer-area',
  'Khu tránh, trú bão': '/storm-shelter',
  'Bến phao': '/buoy-berth',
  'Cơ sở sửa chữa, đóng tàu': '/ship-repair-yard',
  'Luồng hàng hải': '/navigation-channel',
  'Đèn biển và nhà trạm gắn với Đèn biển': '/beacon-stations',
  'Phao, tiêu': '/buoys',
  'Nhà trạm quản lý vận hành phao tiêu': '/buoy-station',
  'Đê chắn sóng, đê chắn cát, kè': '/dike-revetment',
  'Hệ thống VTS': '/vts-system',
  'Trung tâm điều hành VTS': '/vts-operation-center',
  'Trạm Radar': '/radar-station',
  'Hệ thống trạm bờ AIS': '/ais-system',
  'Hệ thống camera giám sát CCTV': '/cctv',
  'Hệ thống điều khiển SCADA': '/scada',
  'Hệ thống truyền dẫn': '/transmission',
  'Hệ thống phụ trợ VTS': '/vts-assist',
  'Đài Thông tin duyên hải': '/dai-ttdh',
  'Hệ thống VHF': '/dai-ttdh',
  'Đài Thông tin vệ tinh Inmarsat': '/station/inmarsat',
  'Đài Nhận dạng và truy theo tầm xa (LRIT)': '/station/lrit',
  'Đài Thông tin vệ tinh Cospas-Sarsat': '/station/cospas-sarsat',
  'Đài TTXL thông tin hàng hải Hà Nội / Hải Phòng': '/station/hanoi',
  'Đèn biển': '/beacon-stations',
  'Phao tiêu': '/buoys',
  'Trạm phao': '/buoy-station',
  'Đê kè': '/dike-revetment',
  'Đài VTS': '/dai-ttdh',
  'Đài LRIT': '/station/lrit',
  'Đài Inmarsat': '/station/inmarsat',
  'Đài Hải Phòng': '/station/hanoi',
  'Đài Cospas-Sarsat': '/station/cospas-sarsat',
  'Khu tránh bão': '/storm-shelter',
  'Cơ sở sửa chữa tàu': '/ship-repair-yard',
};

function MockBadge({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <Tag color="orange" style={{ marginLeft: 8, fontSize: fontSizeSm, borderRadius: radiusPill }}>
      Dữ liệu mẫu
    </Tag>
  );
}

// Cột bảng thông số KCHT tuân thủ 100% Pill Badges Standard của hệ thống
const infraColumns: NonNullable<TableProps<InfraRow>['columns']> = [
  {
    title: 'Loại kết cấu hạ tầng',
    dataIndex: 'type',
    key: 'type',
    width: 170,
    render: (type: string) => (
      <span style={{ fontWeight: 600, color: colors.sidebarBg }}>{type}</span>
    ),
  },
  {
    title: 'Tổng số lượng',
    dataIndex: 'total',
    key: 'total',
    width: 100,
    align: 'center',
    render: (v: number) => (
      <span style={{ fontWeight: 700, fontFamily: fontMono, color: textPrimary }}>{v}</span>
    ),
  },
  {
    title: <span>Chưa khai thác/<br />vận hành</span>,
    dataIndex: 'pending',
    key: 'pending',
    width: 125,
    align: 'center',
    render: (v: number) => (
      <span style={statusBadgeStyle(v > 0 ? statusAttention : statusDraft)}>{v}</span>
    ),
  },
  {
    title: <span>Đang khai thác/<br />vận hành</span>,
    dataIndex: 'operating',
    key: 'operating',
    width: 125,
    align: 'center',
    render: (v: number) => (
      <span style={statusBadgeStyle(v > 0 ? statusOperational : statusDraft)}>{v}</span>
    ),
  },
  {
    title: <span>Dừng khai thác/<br />vận hành</span>,
    dataIndex: 'suspended',
    key: 'suspended',
    width: 125,
    align: 'center',
    render: (v: number) => (
      <span style={statusBadgeStyle(v > 0 ? statusCritical : statusDraft)}>{v}</span>
    ),
  },
];

// ============================================================
// Component: HeroCard (Sản lượng chủ đạo)
// ============================================================
function HeroCard({ heroKpi, year }: { heroKpi: any; year: number }) {
  const isUp = heroKpi?.deltaDirection === 'up';
  return (
    <div
      style={{
        ...CARD_BASE,
        background: `linear-gradient(135deg, ${colors.sidebarBg}, ${actionPrimary})`,
        border: 'none',
        color: '#ffffff',
      }}
    >
      <div style={{ fontSize: fontSizeSm, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, fontWeight: fontWeightMedium }}>
        SẢN LƯỢNG CHỦ ĐẠO · {year}
      </div>
      <div style={{ fontSize: fontSizeDisplay, fontFamily: fontMono, fontWeight: 700, lineHeight: 1.1 }}>
        {heroKpi?.value?.toLocaleString('vi-VN') ?? 0}
      </div>
      <div style={{ fontSize: fontSizeSm, opacity: 0.85, marginTop: 2 }}>{heroKpi?.unit || 'nghìn tấn'}</div>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: fontSizeSm, fontWeight: 600, color: isUp ? '#a7f3d0' : '#fecaca' }}>
          {isUp ? '▲' : '▼'} {heroKpi?.deltaPercent ?? 0}%
        </span>
        <span style={{ fontSize: fontSizeSm, opacity: 0.75 }}>so với {heroKpi?.previousYearValue?.toLocaleString('vi-VN') ?? 0}</span>
      </div>
      <div style={{ marginTop: 8, height: 32 }}>
        <ReactECharts
          option={{
            grid: { top: 0, right: 0, bottom: 0, left: 0 },
            xAxis: { type: 'category', data: (heroKpi?.sparklineData || []).map((_: number, i: number) => i), show: false },
            yAxis: { type: 'value', show: false, min: (v: { min: number }) => v.min * 0.95 },
            series: [{
              type: 'line', data: heroKpi?.sparklineData || [], smooth: true, symbol: 'none',
              lineStyle: { color: '#ffffff', width: 1.5 },
              areaStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: 'rgba(255,255,255,0.35)' }, { offset: 1, color: 'rgba(255,255,255,0.05)' }],
                },
              },
            }],
          }}
          style={{ height: '100%' }} notMerge
        />
      </div>
    </div>
  );
}

// ============================================================
// Component: MiniKpiCard (Chỉ số KPI tiêu chuẩn)
// ============================================================
function MiniKpiCard({ card }: { card: any }) {
  const isUp = card?.deltaDirection === 'up';
  const isDown = card?.deltaDirection === 'down';
  return (
    <div style={CARD_BASE}>
      <div style={{ fontSize: fontSizeSm, color: textSecondary, fontWeight: fontWeightMedium, marginBottom: 4 }}>
        {card?.label}
      </div>
      <div style={{ fontSize: fontSizeDisplay, fontFamily: fontMono, color: textPrimary, fontWeight: 700, lineHeight: 1.2 }}>
        {card?.value ?? 0}
      </div>
      {card?.deltaPercent !== undefined && (
        <div style={{ marginTop: 4, fontSize: fontSizeSm, fontWeight: fontWeightMedium, color: isUp ? statusOperational : isDown ? statusCritical : textSecondary }}>
          {isUp ? '▲' : isDown ? '▼' : '→'} {Math.abs(card.deltaPercent)}%
        </div>
      )}
      {card?.sparklineData && (
        <div style={{ marginTop: 6, height: 26 }}>
          <ReactECharts
            option={{
              grid: { top: 0, right: 0, bottom: 0, left: 0 },
              xAxis: { type: 'category', data: card.sparklineData.map((_: number, i: number) => i), show: false },
              yAxis: { type: 'value', show: false, min: (v: { min: number }) => v.min * 0.95 },
              series: [{
                type: card.sparklineType === 'bar' ? 'bar' : 'line',
                data: card.sparklineData, smooth: true, symbol: 'none',
                lineStyle: { color: actionPrimary, width: 1.5 },
                itemStyle: { color: actionPrimary },
                areaStyle: card.sparklineType !== 'bar' ? {
                  color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [{ offset: 0, color: `${actionPrimary}25` }, { offset: 1, color: `${actionPrimary}05` }],
                  },
                } : undefined,
              }],
            }}
            style={{ height: '100%' }} notMerge
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Component: ApprovalCard (Phê duyệt theo chuẩn Semantic Token)
// ============================================================
interface ApprovalStats { total: number; approved: number; pending: number; rejected: number; }
const EMPTY_APPROVAL_STATS: ApprovalStats = { total: 0, approved: 0, pending: 0, rejected: 0 };

function ApprovalCard({ label, stats }: { label: string; stats: ApprovalStats }) {
  const approvedPct = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;
  const pendingPct = stats.total > 0 ? (stats.pending / stats.total) * 100 : 0;
  const rejectedPct = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;

  return (
    <div style={CARD_BASE}>
      <div style={{ fontSize: fontSizeSm, color: textSecondary, fontWeight: fontWeightMedium, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: fontSizeDisplay, fontFamily: fontMono, color: textPrimary, fontWeight: 700, lineHeight: 1.2 }}>
        {stats.total.toLocaleString('vi-VN')} <span style={{ fontSize: fontSizeSm, fontWeight: 400, color: textSecondary }}>đã xử lý</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', display: 'flex', overflow: 'hidden', marginTop: 14 }}>
        {approvedPct > 0 && <div style={{ width: `${approvedPct}%`, background: statusOperational, transition: 'width 0.4s' }} />}
        {pendingPct > 0 && <div style={{ width: `${pendingPct}%`, background: statusAttention, transition: 'width 0.4s' }} />}
        {rejectedPct > 0 && <div style={{ width: `${rejectedPct}%`, background: statusCritical, transition: 'width 0.4s' }} />}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: fontSizeSm, color: textSecondary }}>
        {stats.approved > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: statusOperational, marginRight: 4 }} />
            Đã duyệt {stats.approved.toLocaleString('vi-VN')}
          </span>
        )}
        {stats.rejected > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: statusCritical, marginRight: 4 }} />
            Từ chối {stats.rejected.toLocaleString('vi-VN')}
          </span>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        {stats.pending === 0 ? (
          <span style={statusBadgeStyle(statusOperational)}>✓ 0 chờ duyệt</span>
        ) : (
          <span style={statusBadgeStyle(statusAttention)}>⏳ {stats.pending} chờ duyệt</span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// HomeDashboard
// ============================================================
function HomeDashboard({ hideHeader = false }: { hideHeader?: boolean }) {
  const { year, province, infraType } = useFilter();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<DashboardData>(MOCK_DATA);
  const [blockStates, setBlockStates] = useState<Record<string, BlockState>>({});
  const [assetStats, setAssetStats] = useState<ApprovalStats>(EMPTY_APPROVAL_STATS);
  const [kchtStats, setKchtStats] = useState<ApprovalStats>(EMPTY_APPROVAL_STATS);
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>();
  const [selectedKchtType, setSelectedKchtType] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [infraData, setInfraData] = useState<InfraRow[]>([]);

  const handleMapSearch = () => {
    const params = new URLSearchParams();
    if (selectedProvince) params.set('province', selectedProvince);
    if (selectedKchtType?.length) params.set('kchtType', selectedKchtType.join(','));
    if (searchKeyword.trim()) params.set('search', searchKeyword.trim());
    navigate(`/gis/map?${params.toString()}`);
  };

  useEffect(() => {
    let isCurrentRequest = true;

    dashboardApi
      .fetchWithFallback({ year, province, infraType }, MOCK_DATA)
      .then(({ data, states, assetStatus }) => {
        if (!isCurrentRequest) return;
        setDashboardData(data);
        setBlockStates(states || {});
        setKchtStats(assetStatus?.approvalStats || EMPTY_APPROVAL_STATS);
        setInfraData(assetStatus?.breakdown || []);
      })
      .catch(() => {
        if (!isCurrentRequest) return;
        setDashboardData(MOCK_DATA);
        setKchtStats(EMPTY_APPROVAL_STATS);
        setInfraData([]);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [year, province, infraType]);

  useEffect(() => {
    let isMounted = true;
    dashboardApi.fetchAssetApprovalStats().then((stats) => {
      if (isMounted) setAssetStats(stats);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const memoInfraColumns = useMemo<NonNullable<TableProps<InfraRow>['columns']>>(() => [
    ...infraColumns,
    {
      title: 'Thao tác',
      key: 'action',
      width: 70,
      align: 'center',
      render: (_: unknown, record: InfraRow) => (
        <Tooltip title={`Xem chi tiết ${record.type || ''}`}>
          <Button
            type="text"
            shape="circle"
            icon={<EyeOutlined style={{ color: actionPrimary, fontSize: 16 }} />}
            onClick={() => navigate(KCHT_LABEL_ROUTES[record.type || ''] || '/')}
          />
        </Tooltip>
      ),
    },
  ], [navigate]);

  const kpiCards = dashboardData.kpiCards || [];

  // 1. Biểu đồ hàng hóa thông qua cảng (Stacked Bar 12 tháng)
  const stackedBar = dashboardData.stackedBar;
  const cargoSeries = stackedBar?.series?.length ? stackedBar.series : CARGO_SERIES;
  const cargoMonths = stackedBar?.months?.length
    ? stackedBar.months.map((m: string) => m.replace('T', ''))
    : CARGO_MONTHS;
  const cargoOption: EChartsOption = useMemo(() => ({
    tooltip: {
      ...chartTooltip,
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: borderDefault, type: 'solid' } },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return '';
        let total = 0;
        let html = `<div style="font-weight:600;margin-bottom:4px">Tháng ${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          const v = p.value ?? 0;
          total += v;
          html += `<div style="display:flex;justify-content:space-between;gap:12px"><span>${p.marker} ${p.seriesName}</span><span style="font-weight:600">${v.toLocaleString('vi-VN')}</span></div>`;
        });
        html += `<div style="border-top:1px solid rgba(255,255,255,0.2);margin-top:4px;padding-top:4px;display:flex;justify-content:space-between"><span>Tổng</span><span style="font-weight:700">${total.toLocaleString('vi-VN')}</span></div>`;
        return html;
      },
    },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { ...chartTextStyle, fontSize: fontSizeSm, color: textSecondary },
    },
    grid: { ...chartGrid, bottom: 35, top: 15, right: 15, left: 50 },
    xAxis: {
      type: 'category',
      data: cargoMonths,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: borderDefault } },
      axisLabel: { ...chartTextStyle, color: textSecondary },
    },
    yAxis: {
      type: 'value',
      max: 25_000,
      axisLabel: { ...chartTextStyle, color: textTertiary, formatter: (v: number) => (v / 1000).toFixed(0) + 'M' },
      splitLine: { lineStyle: { color: borderDefault, type: 'dashed' } },
    },
    series: cargoSeries.map((s: any, idx: number) => ({
      type: 'bar' as const,
      name: s.name,
      stack: 'total',
      barWidth: '55%',
      data: s.data,
      itemStyle: {
        color: CARGO_SERIES_COLORS[idx % CARGO_SERIES_COLORS.length],
        borderRadius: idx === cargoSeries.length - 1 ? [radiusSm, radiusSm, 0, 0] : 0,
      },
    })),
  }), [stackedBar]);

  // 2. Biểu đồ cơ cấu phương tiện (Donut 1)
  const donut1Data = dashboardData.donutPhuongTien || [];
  const donutColors = [colors.sidebarBg, actionPrimary, '#0284c7', '#63abfd'];
  const donut1Option: EChartsOption = useMemo(() => ({
    tooltip: { ...chartTooltip, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { ...chartTextStyle, fontSize: fontSizeSm, color: textSecondary },
    },
    series: [{
      type: 'pie',
      radius: ['52%', '75%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: radiusSm, borderColor: surfaceCard, borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: fontSizeMd, fontWeight: 'bold' } },
      data: donut1Data.map((d, i) => ({
        value: d.value,
        name: d.name,
        itemStyle: { color: donutColors[i % donutColors.length] },
      })),
    }],
  }), [donut1Data]);

  // 3. Biểu đồ lượt hành khách qua cảng (Polar Bar)
  const passengerMonthly = dashboardData.linePassenger;
  const polarOption: EChartsOption = useMemo(() => ({
    tooltip: { ...chartTooltip, trigger: 'item' },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { ...chartTextStyle, fontSize: fontSizeSm, color: textSecondary },
    },
    polar: { radius: ['18%', '75%'] },
    angleAxis: {
      type: 'category',
      data: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      startAngle: 90,
      axisLabel: { ...chartTextStyle, color: textSecondary },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: borderDefault, type: 'dashed' } },
    },
    radiusAxis: {
      type: 'value',
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'bar',
        name: 'Đến cảng',
        coordinateSystem: 'polar',
        stack: 'a',
        data: passengerMonthly?.arrival || [],
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [{ offset: 0, color: colors.sidebarBg }, { offset: 1, color: actionPrimary }],
          },
        },
        emphasis: { itemStyle: { color: actionPrimary } },
      },
      {
        type: 'bar',
        name: 'Rời cảng',
        coordinateSystem: 'polar',
        stack: 'a',
        data: passengerMonthly?.departure || [],
        itemStyle: {
          borderRadius: [radiusSm, radiusSm, 0, 0],
          color: '#0284c7',
        },
        emphasis: { itemStyle: { color: '#0284c7' } },
      },
    ],
  }), [passengerMonthly]);

  // 4. Biểu đồ tỷ lệ KCHT vận hành (Ring Chart)
  const ringData = dashboardData.ringKcht;
  const ringOption: EChartsOption = useMemo(() => ({
    tooltip: { ...chartTooltip, trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['62%', '80%'],
      center: ['50%', '48%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 0, borderColor: surfaceCard, borderWidth: 3 },
      label: { show: false },
      emphasis: { label: { show: false } },
      data: [
        { value: ringData.operatingCount, name: 'Đang vận hành', itemStyle: { color: statusOperational } },
        { value: Math.max(0, ringData.totalCount - ringData.operatingCount), name: 'Chưa vận hành', itemStyle: { color: borderDefault } },
      ],
    }],
    graphic: [{
      type: 'text',
      left: 'center',
      top: '40%',
      style: {
        text: `${ringData.percentage}%`,
        textAlign: 'center',
        fill: colors.sidebarBg,
        fontSize: 26,
        fontWeight: 700,
        fontFamily: fontMono,
      },
    }, {
      type: 'text',
      left: 'center',
      top: '55%',
      style: {
        text: `${ringData.operatingCount}/${ringData.totalCount} KCHT`,
        textAlign: 'center',
        fill: textSecondary,
        fontSize: fontSizeSm,
        fontWeight: 500,
      },
    }],
  }), [ringData]);

  // 5. Biểu đồ phê duyệt theo hạng mục (H-Bar 3 màu chuẩn: Xanh lá, Vàng cam, Đỏ)
  const hBarData = dashboardData.hBarApproval || [];
  const hBarOption: EChartsOption = useMemo(() => ({
    tooltip: { ...chartTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { ...chartTextStyle, fontSize: fontSizeSm, color: textSecondary },
    },
    grid: { ...chartGrid, left: 90, bottom: 35, top: 10, right: 20 },
    xAxis: {
      type: 'value',
      axisLabel: { ...chartTextStyle, color: textTertiary },
      splitLine: { lineStyle: { color: borderDefault, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: [...hBarData].reverse().map((d) => d.category),
      axisLabel: { ...chartTextStyle, color: textPrimary, fontWeight: 500 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        name: 'Đã duyệt',
        stack: 'total',
        data: [...hBarData].reverse().map((d) => d.approved),
        itemStyle: { color: statusOperational },
        barWidth: 18,
      },
      {
        type: 'bar',
        name: 'Chờ duyệt',
        stack: 'total',
        data: [...hBarData].reverse().map((d) => d.pending),
        itemStyle: { color: statusAttention },
      },
      {
        type: 'bar',
        name: 'Từ chối',
        stack: 'total',
        data: [...hBarData].reverse().map((d) => d.rejected),
        itemStyle: { color: statusCritical, borderRadius: [0, radiusSm, radiusSm, 0] },
      },
    ],
  }), [hBarData]);

  return (
    <div className="dashboard-page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`
        .dashboard-page-wrapper,
        .dashboard-page-wrapper .ant-table,
        .dashboard-page-wrapper .ant-table-cell,
        .dashboard-page-wrapper .ant-select,
        .dashboard-page-wrapper .ant-input,
        .dashboard-page-wrapper .ant-btn {
          font-size: 13.5px !important;
        }
        .dashboard-page-wrapper .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: ${colors.sidebarBg} !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          border-bottom: 1px solid #e4e4e4 !important;
        }
      `}</style>

      {/* ScreenHeader: Breadcrumb điều hướng chuẩn của hệ thống (khi mở trực tiếp route /dashboard) */}
      {!hideHeader && (
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý tài sản KCHT hàng hải' },
            { label: 'Tổng quan Dashboard' },
          ]}
        />
      )}

      {/* Thanh bộ lọc toàn trang */}
      <FilterBar />

      {/* Row 1 — Hàng 6 thẻ KPI chỉ số cốt lõi chuẩn F-281 (đã loại bỏ 2 thẻ dư thừa) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 4,
        }}
      >
        <HeroCard heroKpi={dashboardData.heroKpi} year={year} />
        {kpiCards[0] && <MiniKpiCard card={kpiCards[0]} />}
        {kpiCards[1] && <MiniKpiCard card={kpiCards[1]} />}
        {kpiCards[2] && <MiniKpiCard card={kpiCards[2]} />}
        <ApprovalCard label="Phê duyệt tài sản" stats={assetStats} />
        <ApprovalCard label="Phê duyệt KCHT" stats={kchtStats} />
      </div>

      {/* Row 2 — Xu hướng hàng hóa & cơ cấu phương tiện (Col 16 / Col 8 chuẩn F-282) */}
      <Row gutter={[14, 14]}>
        <Col xs={24} md={16}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <div style={CHART_TITLE_STYLE}>
              <span>Hàng hóa thông qua cảng theo tháng</span>
              <MockBadge show={blockStates.stackedBar?.isMockFallback} />
            </div>
            <ReactECharts option={cargoOption} style={{ height: 310 }} notMerge lazyUpdate />
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <div style={CHART_TITLE_STYLE}>
              <span>Cơ cấu phương tiện</span>
              <MockBadge show={blockStates.donutPhuongTien?.isMockFallback} />
            </div>
            <ReactECharts option={donut1Option} style={{ height: 310 }} notMerge lazyUpdate />
          </div>
        </Col>
      </Row>

      {/* Row 3 — Giám sát KCHT & Phê duyệt (Col 8 / Col 8 / Col 8 cân bằng) */}
      <Row gutter={[14, 14]}>
        <Col xs={24} md={8}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <div style={CHART_TITLE_STYLE}>
              <span>Lượt hành khách qua cảng</span>
              <MockBadge show={blockStates.linePassenger?.isMockFallback} />
            </div>
            <ReactECharts option={polarOption} style={{ height: 310 }} notMerge lazyUpdate />
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <div style={CHART_TITLE_STYLE}>
              <span>Tỷ lệ KCHT vận hành</span>
              <MockBadge show={blockStates.ringKcht?.isMockFallback} />
            </div>
            <ReactECharts option={ringOption} style={{ height: 310 }} notMerge lazyUpdate />
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <div style={CHART_TITLE_STYLE}>
              <span>Phê duyệt theo hạng mục</span>
              <MockBadge show={blockStates.hBarApproval?.isMockFallback} />
            </div>
            <ReactECharts option={hBarOption} style={{ height: 310 }} notMerge lazyUpdate />
          </div>
        </Col>
      </Row>

      {/* Row 4 — Bản đồ & Bảng chi tiết KCHT (Col 12 / Col 12 chuẩn F-284) */}
      <Row gutter={[14, 14]} style={{ alignItems: 'stretch' }}>
        <Col xs={24} md={12}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <div style={CHART_TITLE_STYLE}>
              <span>Bản đồ tra cứu Kết cấu hạ tầng</span>
            </div>
            <div style={{ background: '#ffffff', borderRadius: radiusSm, padding: '2px 0', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <Select
                showSearch
                placeholder="Địa điểm (Tỉnh/TP)"
                style={{ width: '28%', minWidth: 125 }}
                value={selectedProvince}
                onChange={setSelectedProvince}
                allowClear
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
              />
              <Select
                mode="multiple"
                maxTagCount={1}
                placeholder="Loại kết cấu hạ tầng"
                style={{ width: '38%', minWidth: 160 }}
                value={selectedKchtType}
                onChange={setSelectedKchtType}
                allowClear
                options={[
                  { value: 'Berth', label: 'Bến cảng' },
                  { value: 'BENPHAO', label: 'Bến phao' },
                  { value: 'Port', label: 'Cảng biển' },
                  { value: 'Pier', label: 'Cầu cảng' },
                  { value: 'DryPort', label: 'Cảng cạn' },
                  { value: 'COSO_SUACHUA', label: 'Cơ sở sửa chữa, đóng tàu' },
                  { value: 'KHUCHUYEN_TAI', label: 'Khu chuyển tải' },
                  { value: 'DENBIEN', label: 'Đèn biển và nhà trạm gắn liền với đèn biển' },
                  { value: 'DIKE_REVETMENT', label: 'Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ' },
                  { value: 'DAI_TTDH', label: 'Đài TTDH' },
                  { value: 'DAI_INMARSAT', label: 'Đài Thông tin Vệ tinh mặt đất Inmarsat Hải Phòng' },
                  { value: 'NAVIGATION_CHANNEL', label: 'Luồng hàng hải' },
                  { value: 'DAI_LRIT', label: 'Đài Thông tin nhận dạng và truy theo tầm xa (LRIT)' },
                  { value: 'KHUNEO_DAU', label: 'Khu neo đậu' },
                  { value: 'NHATRAM_PHAO', label: 'Nhà trạm quản lý vận hành phao tiêu' },
                  { value: 'PHAOTIEU', label: 'Phao, tiêu' },
                  { value: 'DAI_COSPAS_SARSAT', label: 'Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam' },
                  { value: 'KHUTRANH_TRU_BAO', label: 'Khu tránh, trú bão' },
                  { value: 'DAI_HANOI', label: 'Đài Trung tâm xử lý thông tin hàng hải Hà Nội' },
                  { value: 'HE_THONG_VTS', label: 'Hệ thống VTS' },
                ]}
              />
              <Input
                placeholder="Kết cấu hạ tầng"
                maxLength={255}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                suffix={<span style={{ fontSize: fontSizeSm, color: textTertiary, userSelect: 'none' }}>{searchKeyword.length}/255</span>}
                style={{ flex: 1, minWidth: 120 }}
                onPressEnter={handleMapSearch}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleMapSearch}
                style={{ background: actionPrimary, borderColor: actionPrimary }}
              />
            </div>
            <div style={{ height: 380, borderRadius: radiusMd, overflow: 'hidden', border: `1px solid ${borderDefault}` }}>
              <DashboardMap />
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <div style={CHART_TITLE_STYLE}>
              <span>Bảng chi tiết thông số kỹ thuật Kết cấu hạ tầng</span>
              <MockBadge show={blockStates.infraTable?.isMockFallback} />
            </div>
            <Table<InfraRow>
              columns={memoInfraColumns}
              dataSource={infraData.length > 0 ? infraData : INFRA_DATA}
              rowKey="sequenceNo"
              pagination={false}
              size="small"
              scroll={{ x: 640, y: 340 }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}

// ============================================================
// DashboardPage — Wrapper bọc ThemeTokenProvider và FilterProvider
// ============================================================
export default function DashboardPage({ hideHeader = false }: { hideHeader?: boolean }) {
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <FilterProvider>
        <HomeDashboard hideHeader={hideHeader} />
      </FilterProvider>
    </ThemeTokenProvider>
  );
}

