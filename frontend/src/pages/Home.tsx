import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Table, Tag, Select, Input, Button } from 'antd';
import { EnvironmentOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { FilterProvider, useFilter } from '../context/FilterContext';
import { VIETNAM_PROVINCES } from '../types/common';
import FilterBar from '../components/FilterBar';
import DashboardMap from '../components/DashboardMap';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  surfaceCard as surface,
  textPrimary, textSecondary, textTertiary as ink3,
  borderDefault as line,
  radiusXl, radiusSm, radiusPill,
  shadowMd,
  fontMono,
  fontSizeMd, fontSizeLg, fontSizeDisplay,
  chartGrid, chartTooltip, chartTextStyle,
  dataNavy, dataSea0, dataSea1, dataSea2, dataSea3,
  statusOperational, statusCritical,
  cargoSeriesColors,
  approvalApproved, approvalPending, approvalRejected,
  approvalBarTrack,
  pendingActiveBg, pendingActiveColor,
  pendingZeroBg, pendingZeroColor,
} from '../tokens-dashboard';
import { dashboardApi } from '../services/dashboardApi';
import { MOCK_DATA } from '../services/dashboardMockData';
import type { DashboardData, BlockState } from '../services/dashboardTypes';

// ============================================================
// Shared style tokens
// ============================================================
const ink = textPrimary;
const ink2 = textSecondary;
const rCard = radiusXl;
const rSm = radiusSm;
const rPill = radiusPill;
const sea0 = dataSea0;
const sea1 = dataSea1;
const sea2 = dataSea2;
const sea3 = dataSea3;
const navy = dataNavy;

const CHART_TITLE_STYLE: React.CSSProperties = {
  color: textPrimary,
  fontSize: fontSizeLg,
  fontWeight: 600,
  margin: 0,
  marginBottom: 8,
};

const CARD_BASE: React.CSSProperties = {
  background: surface,
  borderRadius: rCard,
  padding: '16px 20px',
  border: `1px solid ${line}`,
  boxShadow: shadowMd,
};

// ============================================================
// 6-series monthly cargo data (01-07 data, 08-12 null)
// ============================================================

const CARGO_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const CARGO_SERIES = [
  {
    name: 'Nội địa',
    data: [6500, 6100, 7000, 7200, 7400, 7600, 7700, null, null, null, null, null],
    color: cargoSeriesColors[0],
  },
  {
    name: 'Nhập khẩu',
    data: [3100, 2900, 3400, 3500, 3600, 3700, 3750, null, null, null, null, null],
    color: cargoSeriesColors[1],
  },
  {
    name: 'Xuất khẩu',
    data: [3800, 3500, 4100, 4300, 4400, 4500, 4600, null, null, null, null, null],
    color: cargoSeriesColors[2],
  },
  {
    name: 'Chuyển tải',
    data: [1800, 1600, 1900, 1950, 2000, 2050, 2100, null, null, null, null, null],
    color: cargoSeriesColors[3],
  },
  {
    name: 'Quá cảnh (bốc dỡ)',
    data: [1200, 1050, 1300, 1350, 1400, 1450, 1480, null, null, null, null, null],
    color: cargoSeriesColors[4],
  },
  {
    name: 'Quá cảnh (K bốc dỡ)',
    data: [950, 820, 1000, 1050, 1080, 1120, 1150, null, null, null, null, null],
    color: cargoSeriesColors[5],
  },
];

// ============================================================
// Infrastructure table data (10 rows)
// ============================================================
interface InfraRow {
  stt: number;
  loai: string;
  tongSL: number;
  chuaKhaiThac: number;
  dangKhaiThac: number;
  dungKhaiThac: number;
}

const INFRA_DATA: InfraRow[] = [
  { stt: 1, loai: 'Bến cảng', tongSL: 42, chuaKhaiThac: 5, dangKhaiThac: 34, dungKhaiThac: 3 },
  { stt: 2, loai: 'Bến phao', tongSL: 18, chuaKhaiThac: 2, dangKhaiThac: 15, dungKhaiThac: 1 },
  { stt: 3, loai: 'Cầu cảng', tongSL: 56, chuaKhaiThac: 8, dangKhaiThac: 45, dungKhaiThac: 3 },
  { stt: 4, loai: 'Khu neo đậu', tongSL: 24, chuaKhaiThac: 4, dangKhaiThac: 19, dungKhaiThac: 1 },
  { stt: 5, loai: 'Khu chuyển tải', tongSL: 12, chuaKhaiThac: 2, dangKhaiThac: 9, dungKhaiThac: 1 },
  { stt: 6, loai: 'Luồng hàng hải', tongSL: 38, chuaKhaiThac: 5, dangKhaiThac: 33, dungKhaiThac: 0 },
  { stt: 7, loai: 'Đèn biển', tongSL: 215, chuaKhaiThac: 12, dangKhaiThac: 198, dungKhaiThac: 5 },
  { stt: 8, loai: 'Phao tiêu', tongSL: 183, chuaKhaiThac: 9, dangKhaiThac: 170, dungKhaiThac: 4 },
  { stt: 9, loai: 'Đê chắn sóng', tongSL: 8, chuaKhaiThac: 1, dangKhaiThac: 7, dungKhaiThac: 0 },
  { stt: 10, loai: 'Kè bảo vệ bờ', tongSL: 15, chuaKhaiThac: 2, dangKhaiThac: 12, dungKhaiThac: 1 },
];

// ============================================================
// Pill badge styles for table status counts
// ============================================================
function pillBadge(count: number, activeColor: string, activeBg: string, zeroBg: string) {
  if (count === 0) {
    return (
      <span
        style={{
          display: 'inline-block',
          borderRadius: rPill,
          padding: '1px 8px',
          fontSize: fontSizeMd,
          background: zeroBg,
          color: ink3,
          fontWeight: 500,
        }}
      >
        0
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: rPill,
        padding: '1px 8px',
        fontSize: fontSizeMd,
        background: activeBg,
        color: activeColor,
        fontWeight: 500,
      }}
    >
      {count}
    </span>
  );
}

// ============================================================
// Infrastructure table columns
// ============================================================
const infraColumns = [
  { title: '', dataIndex: 'loai', key: 'loai', width: 150 },
  {
    title: 'Tổng số lượng',
    dataIndex: 'tongSL',
    key: 'tongSL',
    width: 90,
    align: 'center' as const,
    render: (v: number) => (
      <span style={{ fontWeight: 600, fontFamily: fontMono, color: ink }}>{v}</span>
    ),
  },
  {
    title: <span>Chưa khai thác/<br/>vận hành</span>,
    dataIndex: 'chuaKhaiThac',
    key: 'chuaKhaiThac',
    width: 110,
    align: 'center' as const,
    render: (v: number) =>
      pillBadge(v, sea0, `${sea0}18`, surface),
  },
  {
    title: <span>Đang khai thác/<br/>vận hành</span>,
    dataIndex: 'dangKhaiThac',
    key: 'dangKhaiThac',
    width: 110,
    align: 'center' as const,
    render: (v: number) =>
      pillBadge(v, surface, sea0, surface),
  },
  {
    title: <span>Dừng khai thác/<br/>vận hành</span>,
    dataIndex: 'dungKhaiThac',
    key: 'dungKhaiThac',
    width: 110,
    align: 'center' as const,
    render: (v: number) =>
      pillBadge(v, sea0, sea3, surface),
  },
  {
    title: '',
    key: 'action',
    width: 40,
    align: 'center' as const,
    render: () => <EyeOutlined style={{ color: ink2, cursor: 'pointer' }} />,
  },
];

// ============================================================
// Approval card component (Phê duyệt tài sản / KCHT)
// ============================================================
interface ApprovalCardProps {
  label: string;
  stats: { total: number; approved: number; pending: number; rejected: number };
}

function ApprovalCard({ label, stats }: ApprovalCardProps) {
  const approvedPct = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;
  const pendingPct = stats.total > 0 ? (stats.pending / stats.total) * 100 : 0;
  const rejectedPct = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;

  return (
    <div style={CARD_BASE}>
      <div style={{ fontSize: fontSizeMd, color: ink2, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: fontSizeDisplay, fontFamily: fontMono, color: ink, fontWeight: 600, lineHeight: 1.2 }}>
        {stats.total.toLocaleString('vi-VN')}{' '}
        <span style={{ fontSize: fontSizeMd, fontWeight: 400, color: ink2 }}>đã xử lý</span>
      </div>

      {/* Status bar */}
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: approvalBarTrack,
          display: 'flex',
          overflow: 'hidden',
          marginTop: 16,
        }}
      >
        {approvedPct > 0 && (
          <div style={{ width: `${approvedPct}%`, background: approvalApproved, transition: 'width 0.4s' }} />
        )}
        {pendingPct > 0 && (
          <div style={{ width: `${pendingPct}%`, background: approvalPending, transition: 'width 0.4s' }} />
        )}
        {rejectedPct > 0 && (
          <div style={{ width: `${rejectedPct}%`, background: approvalRejected, transition: 'width 0.4s' }} />
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: fontSizeMd, color: ink2 }}>
        {stats.approved > 0 && (
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 2,
                background: approvalApproved,
                marginRight: 4,
                verticalAlign: 'middle',
              }}
            />
            Đã duyệt {stats.approved.toLocaleString('vi-VN')}
          </span>
        )}
        {stats.rejected > 0 && (
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 2,
                background: approvalRejected,
                marginRight: 4,
                verticalAlign: 'middle',
              }}
            />
            Từ chối {stats.rejected.toLocaleString('vi-VN')}
          </span>
        )}
      </div>

      {/* Pending pill */}
      <div style={{ marginTop: 6 }}>
        {stats.pending === 0 ? (
          <span
            style={{
              display: 'inline-block',
              borderRadius: rPill,
              padding: '2px 10px',
              fontSize: fontSizeMd,
              fontWeight: 500,
              background: pendingZeroBg,
              color: pendingZeroColor,
            }}
          >
            ✓ {stats.pending} chờ
          </span>
        ) : (
          <span
            style={{
              display: 'inline-block',
              borderRadius: rPill,
              padding: '2px 10px',
              fontSize: fontSizeMd,
              fontWeight: 500,
              background: pendingActiveBg,
              color: pendingActiveColor,
            }}
          >
            ⏳ {stats.pending} chờ
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Hero KPI card — "SẢN LƯỢNG CHỦ ĐẠO · {year}"
// ============================================================
function HeroCard({ heroKpi, year }: { heroKpi: any; year: number }) {
  const isUp = heroKpi.deltaDirection === 'up';

  return (
    <div
      style={{
        ...CARD_BASE,
        background: `linear-gradient(135deg, ${navy}, ${sea0})`,
        border: 'none',
        color: '#eaf4fc', /* one-off: light text on dark gradient */
      }}
    >
      <div style={{ fontSize: fontSizeMd, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        SẢN LƯỢNG CHỦ ĐẠO · {year}
      </div>
      <div style={{ fontSize: fontSizeDisplay, fontFamily: fontMono, fontWeight: 600, lineHeight: 1.1 }}>
        {heroKpi.value.toLocaleString('vi-VN')}
      </div>
      <div style={{ fontSize: fontSizeMd, opacity: 0.7, marginTop: 2 }}>{heroKpi.unit}</div>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: fontSizeMd,
            fontWeight: 600,
            color: isUp ? statusOperational : statusCritical,
          }}
        >
          {isUp ? '▲' : '▼'} {heroKpi.deltaPercent}%
        </span>
        <span style={{ fontSize: fontSizeMd, opacity: 0.6 }}>so với {heroKpi.previousYearValue.toLocaleString('vi-VN')}</span>
      </div>
      {/* Sparkline */}
      <div style={{ marginTop: 10, height: 36 }}>
        <ReactECharts
          option={{
            grid: { top: 0, right: 0, bottom: 0, left: 0 },
            xAxis: { type: 'category', data: heroKpi.sparklineData.map((_: number, i: number) => i), show: false },
            yAxis: { type: 'value', show: false, min: (v: { min: number }) => v.min * 0.95 },
            series: [
              {
                type: 'line',
                data: heroKpi.sparklineData,
                smooth: true,
                symbol: 'none',
                lineStyle: { color: dataSea3, width: 1.5 },
                areaStyle: {
                  color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: `${dataSea3}59` },
                      { offset: 1, color: `${dataSea3}05` },
                    ],
                  },
                },
              },
            ],
          }}
          style={{ height: '100%' }}
          notMerge
        />
      </div>
    </div>
  );
}

// ============================================================
// KPI mini card
// ============================================================
function MiniKpiCard({ card }: { card: any }) {
  const isUp = card.deltaDirection === 'up';
  const isDown = card.deltaDirection === 'down';

  return (
    <div style={CARD_BASE}>
      <div style={{ fontSize: fontSizeMd, color: ink2, marginBottom: 4 }}>{card.label}</div>
      <div style={{ fontSize: fontSizeDisplay, fontFamily: fontMono, color: ink, fontWeight: 600, lineHeight: 1.2 }}>
        {card.value}
      </div>
      {card.deltaPercent !== undefined && (
        <div style={{ marginTop: 4, fontSize: fontSizeMd, color: isUp ? statusOperational : isDown ? statusCritical : textSecondary }}>
          {isUp ? '▲' : isDown ? '▼' : '→'} {Math.abs(card.deltaPercent)}%
        </div>
      )}
      {card.sparklineData && (
        <div style={{ marginTop: 6, height: 28 }}>
          <ReactECharts
            option={{
              grid: { top: 0, right: 0, bottom: 0, left: 0 },
              xAxis: { type: 'category', data: card.sparklineData.map((_: number, i: number) => i), show: false },
              yAxis: { type: 'value', show: false, min: (v: { min: number }) => v.min * 0.95 },
              series: [
                {
                  type: card.sparklineType === 'bar' ? 'bar' : 'line',
                  data: card.sparklineData,
                  smooth: true,
                  symbol: 'none',
                  lineStyle: { color: dataSea1, width: 1.5 },
                  itemStyle: { color: dataSea1 },
                  areaStyle: card.sparklineType !== 'bar'
                    ? {
                        color: {
                          type: 'linear',
                          x: 0, y: 0, x2: 0, y2: 1,
                          colorStops: [
                            { offset: 0, color: `${dataSea1}33` },
                            { offset: 1, color: `${dataSea1}05` },
                          ],
                        },
                      }
                    : undefined,
                },
              ],
            }}
            style={{ height: '100%' }}
            notMerge
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// HomeDashboard — inner component with access to hooks
// ============================================================
function HomeDashboard() {
  const { year } = useFilter();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<DashboardData>(MOCK_DATA);
  const [blockStates, setBlockStates] = useState<Record<string, BlockState>>({});
  const [assetStats, setAssetStats] = useState({ total: 466, approved: 448, pending: 0, rejected: 18 });
  const [kchtStats, setKchtStats] = useState({ total: 4176, approved: 4149, pending: 0, rejected: 27 });

  const [selectedProvince, setSelectedProvince] = useState<string | undefined>();
  const [selectedKchtType, setSelectedKchtType] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const handleMapSearch = () => {
    const params = new URLSearchParams();
    if (selectedProvince) params.set('province', selectedProvince);
    if (selectedKchtType && selectedKchtType.length > 0) params.set('kchtType', selectedKchtType.join(','));
    if (searchKeyword) params.set('search', searchKeyword);
    navigate(`/gis/map?${params.toString()}`);
  };

  // Fetch dashboard data on mount & year change
  useEffect(() => {
    dashboardApi
      .fetchWithFallback({ year, province: null, infraType: null }, MOCK_DATA)
      .then(({ data, states }) => { setDashboardData(data); setBlockStates(states || {}); })
      .catch(() => setDashboardData(MOCK_DATA));

    dashboardApi.fetchAssetApprovalStats().then((s) => setAssetStats(s));
    dashboardApi.fetchKchtApprovalStats().then((s) => setKchtStats(s));
  }, [year]);

  const kpiCards = dashboardData.kpiCards || [];

  // ==========================================================
  // Cargo stacked bar option
  // ==========================================================
  const cargoOption: EChartsOption = {
    tooltip: {
      ...chartTooltip,
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: line, type: 'solid' } },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return '';
        let total = 0;
        let html = `<div style=\"font-weight:600;margin-bottom:4px\">Tháng ${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          const v = p.value ?? 0;
          total += v;
          html += `<div style=\"display:flex;justify-content:space-between;gap:12px\"><span>${p.marker} ${p.seriesName}</span><span style=\"font-weight:600\">${v.toLocaleString('vi-VN')}</span></div>`;
        });
        html += `<div style=\"border-top:1px solid rgba(255,255,255,0.2);margin-top:4px;padding-top:4px;display:flex;justify-content:space-between\"><span>Tổng</span><span style=\"font-weight:700\">${total.toLocaleString('vi-VN')}</span></div>`;
        return html;
      },
    },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { ...chartTextStyle, fontSize: fontSizeMd },
    },
    grid: { ...chartGrid, bottom: 40 },
    xAxis: {
      type: 'category',
      data: CARGO_MONTHS,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: line } },
      axisLabel: { ...chartTextStyle },
    },
    yAxis: {
      type: 'value',
      max: 25_000,
      axisLabel: {
        ...chartTextStyle,
        formatter: (v: number) => (v / 1000).toFixed(0) + 'M',
      },
      splitLine: { lineStyle: { color: line, type: 'dashed' } },
    },
    series: CARGO_SERIES.map((s, idx) => ({
      type: 'bar' as const,
      name: s.name,
      stack: 'total',
      barWidth: '58%',
      data: s.data,
      itemStyle: {
        color: s.color,
        borderRadius: idx === CARGO_SERIES.length - 1 ? [radiusSm, radiusSm, 0, 0] : 0,
      },
    })),
  };

  // ==========================================================
  // Polar passenger option
  // ==========================================================
  const passengerMonthly = dashboardData.linePassenger;
  const polarOption: EChartsOption = {
    tooltip: {
      ...chartTooltip,
      trigger: 'item',
    },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { ...chartTextStyle, fontSize: fontSizeMd },
    },
    polar: {
      radius: ['18%', '78%'],
    },
    angleAxis: {
      type: 'category',
      data: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      startAngle: 90,
      axisLabel: { ...chartTextStyle },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: line, type: 'dashed' } },
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
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: dataSea0 },
              { offset: 1, color: dataSea1 },
            ],
          },
        },
        emphasis: { itemStyle: { color: dataSea1 } },
      },
      {
        type: 'bar',
        name: 'Rời cảng',
        coordinateSystem: 'polar',
        stack: 'a',
        data: passengerMonthly?.departure || [],
        itemStyle: {
          borderRadius: [radiusSm, radiusSm, 0, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: dataSea2 },
              { offset: 1, color: dataSea2 },
            ],
          },
        },
        emphasis: { itemStyle: { color: dataSea2 } },
      },
    ],
  };

  // ==========================================================
  // H-Bar approval option (Phê duyệt theo hạng mục)
  // ==========================================================
  const hBarData = dashboardData.hBarApproval;
  const hBarOption: EChartsOption = {
    tooltip: {
      ...chartTooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { ...chartTextStyle, fontSize: fontSizeMd },
    },
    grid: { ...chartGrid, left: 100, bottom: 40 },
    xAxis: {
      type: 'value',
      axisLabel: { ...chartTextStyle },
      splitLine: { lineStyle: { color: line, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: [...(hBarData || [])].reverse().map((d) => d.category),
      axisLabel: { ...chartTextStyle },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        name: 'Đã duyệt',
        stack: 'total',
        data: [...(hBarData || [])].reverse().map((d) => d.approved),
        itemStyle: { color: approvalApproved },
        barWidth: 20,
      },
      {
        type: 'bar',
        name: 'Chờ duyệt',
        stack: 'total',
        data: [...(hBarData || [])].reverse().map((d) => d.pending),
        itemStyle: { color: approvalPending },
      },
      {
        type: 'bar',
        name: 'Từ chối',
        stack: 'total',
        data: [...(hBarData || [])].reverse().map((d) => d.rejected),
        itemStyle: { color: approvalRejected, borderRadius: [0, radiusSm, radiusSm, 0] },
      },
    ],
  };

  // ==========================================================
  // Donut phê duyệt option
  // ==========================================================
  const donutData = dashboardData.donutPheDuyet || [];
  const donutOption: EChartsOption = {
    tooltip: {
      ...chartTooltip,
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { ...chartTextStyle, fontSize: fontSizeMd },
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '78%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: radiusSm,
          borderColor: surface,
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: fontSizeLg, fontWeight: 'bold' },
        },
        data: donutData.map((d) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: d.color },
        })),
      },
    ],
  };

  // ==========================================================
  // Render
  // ==========================================================
  return (
    <div style={{ marginTop: -12 }}>
      {/* FilterBar */}
      <FilterBar />

      {/* Stats Row — 6 cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* KPI Card 1: Lượt tàu */}
        {kpiCards[0] && <MiniKpiCard card={kpiCards[0]} />}

        {/* KPI Card 2: Hành khách */}
        {kpiCards[1] && <MiniKpiCard card={kpiCards[1]} />}

        {/* KPI Card 3: KCHT */}
        {kpiCards[2] && <MiniKpiCard card={kpiCards[2]} />}

        {/* Approval Card: Phê duyệt tài sản */}
        <ApprovalCard label="Phê duyệt tài sản" stats={assetStats} />

        {/* Approval Card: Phê duyệt KCHT */}
        <ApprovalCard label="Phê duyệt KCHT" stats={kchtStats} />

        {/* Hero Card — SẢN LƯỢNG CHỦ ĐẠO (last position, rightmost) */}
        <HeroCard heroKpi={dashboardData.heroKpi} year={year} />
      </div>

      {/* Row 1 — Cargo chart + Polar passenger */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={16}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <h4 style={CHART_TITLE_STYLE}>Hàng hóa thông qua cảng theo tháng
              {blockStates.stackedBar?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: fontSizeMd }}>Dữ liệu mẫu</Tag>}
            </h4>
            <ReactECharts option={cargoOption} style={{ height: 320 }} notMerge />
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <h4 style={CHART_TITLE_STYLE}>Lượt hành khách qua cảng
              {blockStates.linePassenger?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: fontSizeMd }}>Dữ liệu mẫu</Tag>}
            </h4>
            <ReactECharts option={polarOption} style={{ height: 320 }} notMerge />
          </div>
        </Col>
      </Row>

      {/* Row 2 — Map + Table */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16, alignItems: 'stretch' }}>
        <Col xs={24} md={12}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <h4 style={CHART_TITLE_STYLE}>Bản đồ tra cứu Kết cấu hạ tầng</h4>
            {/* Filter Bar placed right above the map */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: radiusSm,
                padding: '4px 0',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Select
                showSearch
                placeholder="Địa điểm (Tỉnh/TP)"
                style={{ width: '30%', minWidth: 140 }}
                value={selectedProvince}
                onChange={setSelectedProvince}
                allowClear
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
              />
              <Select
                mode="multiple"
                placeholder="Loại kết cấu hạ tầng"
                style={{ width: '35%', minWidth: 180 }}
                value={selectedKchtType}
                onChange={setSelectedKchtType}
                allowClear
                options={[
                  { value: 'BENCANG', label: 'Bến cảng' },
                  { value: 'BENPHAO', label: 'Bến phao' },
                  { value: 'CANGBIEN', label: 'Cảng biển' },
                  { value: 'CAUCANG', label: 'Cầu cảng' },
                  { value: 'CANGCAN', label: 'Cảng cạn' },
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
                suffix={
                  <span style={{ fontSize: fontSizeMd, color: '#999', userSelect: 'none' }}>
                    {searchKeyword.length}/255
                  </span>
                }
                style={{ flex: 1 }}
                onPressEnter={handleMapSearch}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleMapSearch}
              />
            </div>
            {/* Map container below */}
            <div style={{ height: 380, borderRadius: rSm, overflow: 'hidden' }}>
              <DashboardMap />
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
              <h4 style={CHART_TITLE_STYLE}>Bảng chi tiết thông số kỹ thuật Kết cấu hạ tầng
              {blockStates.infraTable?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: fontSizeMd }}>Dữ liệu mẫu</Tag>}
            </h4>
            <Table
              columns={infraColumns}
              dataSource={INFRA_DATA}
              rowKey="stt"
              pagination={false}
              size="small"
              scroll={{ x: 620, y: 340 }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}

// ============================================================
// HomePage — wraps everything in FilterProvider
// ============================================================
export default function HomePage() {
  return (
    <FilterProvider>
      <HomeDashboard />
    </FilterProvider>
  );
}
