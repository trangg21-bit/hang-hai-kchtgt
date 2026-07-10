import { useState, useEffect } from 'react';
import { Row, Col, Table, Tag } from 'antd';
import { EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';
import { FilterProvider, useFilter } from '../context/FilterContext';
import FilterBar from '../components/FilterBar';
import DashboardMap from '../components/DashboardMap';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  bg, bgTint, surface,
  navy, sea0, sea1, sea2, sea3, teal,
  stApproved, stPending, stRejected, stDraft,
  ink, ink2, ink3,
  line, rCard, rSm, rPill,
  shadowMd, shadowLg,
  fontSans, fontMono,
  chartGrid, chartTooltip, chartTextStyle,
} from '../tokens-dashboard';
import { dashboardApi, MOCK_DATA } from '../services/dashboardApi';
import type { DashboardData } from '../services/dashboardTypes';

// ============================================================
// Shared style tokens
// ============================================================
const CHART_TITLE_STYLE: React.CSSProperties = {
  color: '#12468C',
  fontSize: 14,
  fontWeight: 500,
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
// Colors: matching spec exactly
// ============================================================
const CARGO_SERIES_COLORS = ['#0f3a63', '#1e5e97', '#3f8fcf', '#6fb0e0', '#a3cfec', '#cbe2f4'];

const CARGO_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const CARGO_SERIES = [
  {
    name: 'Nội địa',
    data: [6500, 6100, 7000, 7200, 7400, 7600, 7700, null, null, null, null, null],
    color: CARGO_SERIES_COLORS[0],
  },
  {
    name: 'Nhập khẩu',
    data: [3100, 2900, 3400, 3500, 3600, 3700, 3750, null, null, null, null, null],
    color: CARGO_SERIES_COLORS[1],
  },
  {
    name: 'Xuất khẩu',
    data: [3800, 3500, 4100, 4300, 4400, 4500, 4600, null, null, null, null, null],
    color: CARGO_SERIES_COLORS[2],
  },
  {
    name: 'Chuyển tải',
    data: [1800, 1600, 1900, 1950, 2000, 2050, 2100, null, null, null, null, null],
    color: CARGO_SERIES_COLORS[3],
  },
  {
    name: 'Quá cảnh (bốc dỡ)',
    data: [1200, 1050, 1300, 1350, 1400, 1450, 1480, null, null, null, null, null],
    color: CARGO_SERIES_COLORS[4],
  },
  {
    name: 'Quá cảnh (K bốc dỡ)',
    data: [950, 820, 1000, 1050, 1080, 1120, 1150, null, null, null, null, null],
    color: CARGO_SERIES_COLORS[5],
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
          fontSize: 11,
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
        fontSize: 11,
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
  { title: 'Loại KCHT', dataIndex: 'loai', key: 'loai', width: 150 },
  {
    title: 'Tổng SL',
    dataIndex: 'tongSL',
    key: 'tongSL',
    width: 80,
    align: 'center' as const,
    render: (v: number) => (
      <span style={{ fontWeight: 600, fontFamily: fontMono, color: ink }}>{v}</span>
    ),
  },
  {
    title: <span><span style={{display:'inline-block',width:6,height:6,borderRadius:3,background:sea3,marginRight:4}} />Chưa</span>,
    dataIndex: 'chuaKhaiThac',
    key: 'chuaKhaiThac',
    width: 70,
    align: 'center' as const,
    render: (v: number) =>
      pillBadge(v, sea0, `${sea0}18`, bg),
  },
  {
    title: <span><span style={{display:'inline-block',width:6,height:6,borderRadius:3,background:sea0,marginRight:4}} />Đang</span>,
    dataIndex: 'dangKhaiThac',
    key: 'dangKhaiThac',
    width: 70,
    align: 'center' as const,
    render: (v: number) =>
      pillBadge(v, surface, sea0, bg),
  },
  {
    title: <span><span style={{display:'inline-block',width:6,height:6,borderRadius:3,background:sea2,marginRight:4}} />Dừng</span>,
    dataIndex: 'dungKhaiThac',
    key: 'dungKhaiThac',
    width: 70,
    align: 'center' as const,
    render: (v: number) =>
      pillBadge(v, sea0, sea3, bg),
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
      <div style={{ fontSize: 12, color: ink2, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontFamily: fontMono, color: ink, fontWeight: 600, lineHeight: 1.2 }}>
        {stats.total.toLocaleString('vi-VN')}{' '}
        <span style={{ fontSize: 13, fontWeight: 400, color: ink2 }}>đã xử lý</span>
      </div>

      {/* Status bar */}
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: line,
          display: 'flex',
          overflow: 'hidden',
          marginTop: 10,
        }}
      >
        {approvedPct > 0 && (
          <div style={{ width: `${approvedPct}%`, background: sea0, transition: 'width 0.4s' }} />
        )}
        {pendingPct > 0 && (
          <div style={{ width: `${pendingPct}%`, background: sea2, transition: 'width 0.4s' }} />
        )}
        {rejectedPct > 0 && (
          <div style={{ width: `${rejectedPct}%`, background: sea3, transition: 'width 0.4s' }} />
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10.5, color: ink2 }}>
        {stats.approved > 0 && (
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 2,
                background: sea0,
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
                background: sea3,
                marginRight: 4,
                verticalAlign: 'middle',
              }}
            />
            Từ chối {stats.rejected.toLocaleString('vi-VN')}
          </span>
        )}
      </div>

      {/* Pending pill */}
      <div style={{ marginTop: 8 }}>
        {stats.pending === 0 ? (
          <span
            style={{
              display: 'inline-block',
              borderRadius: rPill,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 500,
              background: sea3,
              color: sea1,
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
              fontSize: 11,
              fontWeight: 500,
              background: '#FFF3E0',
              color: stPending,
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
        color: '#eaf4fc',
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        SẢN LƯỢNG CHỦ ĐẠO · {year}
      </div>
      <div style={{ fontSize: 28, fontFamily: fontMono, fontWeight: 700, lineHeight: 1.1 }}>
        {heroKpi.value.toLocaleString('vi-VN')}
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{heroKpi.unit}</div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isUp ? '#6EE7B7' : '#FCA5A5',
          }}
        >
          {isUp ? '▲' : '▼'} {heroKpi.deltaPercent}%
        </span>
        <span style={{ fontSize: 11, opacity: 0.6 }}>so với {heroKpi.previousYearValue.toLocaleString('vi-VN')}</span>
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
                lineStyle: { color: '#7dd3fc', width: 1.5 },
                areaStyle: {
                  color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(125,211,252,0.35)' },
                      { offset: 1, color: 'rgba(125,211,252,0.02)' },
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
      <div style={{ fontSize: 12, color: ink2, marginBottom: 4 }}>{card.label}</div>
      <div style={{ fontSize: 22, fontFamily: fontMono, color: ink, fontWeight: 600, lineHeight: 1.2 }}>
        {card.value}
      </div>
      {card.deltaPercent !== undefined && (
        <div style={{ marginTop: 4, fontSize: 12, color: isUp ? stApproved : isDown ? stRejected : ink2 }}>
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
                  lineStyle: { color: sea1, width: 1.5 },
                  itemStyle: { color: sea1 },
                  areaStyle: card.sparklineType !== 'bar'
                    ? {
                        color: {
                          type: 'linear',
                          x: 0, y: 0, x2: 0, y2: 1,
                          colorStops: [
                            { offset: 0, color: 'rgba(39,105,179,0.2)' },
                            { offset: 1, color: 'rgba(39,105,179,0.02)' },
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

  const [dashboardData, setDashboardData] = useState<DashboardData>(MOCK_DATA);
  const [assetStats, setAssetStats] = useState({ total: 466, approved: 448, pending: 0, rejected: 18 });
  const [kchtStats, setKchtStats] = useState({ total: 4176, approved: 4149, pending: 0, rejected: 27 });

  // Fetch dashboard data on mount & year change
  useEffect(() => {
    dashboardApi
      .fetchWithFallback({ year, province: null, infraType: null }, MOCK_DATA)
      .then(({ data }) => setDashboardData(data))
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
      textStyle: { ...chartTextStyle, fontSize: 11 },
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
        borderRadius: idx === CARGO_SERIES.length - 1 ? [6, 6, 0, 0] : 0,
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
      textStyle: { ...chartTextStyle, fontSize: 11 },
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
              { offset: 0, color: '#123a63' },
              { offset: 1, color: '#2769b3' },
            ],
          },
        },
        emphasis: { itemStyle: { color: '#2769b3' } },
      },
      {
        type: 'bar',
        name: 'Rời cảng',
        coordinateSystem: 'polar',
        stack: 'a',
        data: passengerMonthly?.departure || [],
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#4f9bd8' },
              { offset: 1, color: '#79b6e6' },
            ],
          },
        },
        emphasis: { itemStyle: { color: '#79b6e6' } },
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
      textStyle: { ...chartTextStyle, fontSize: 11 },
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
        itemStyle: { color: stApproved },
        barWidth: 20,
      },
      {
        type: 'bar',
        name: 'Chờ duyệt',
        stack: 'total',
        data: [...(hBarData || [])].reverse().map((d) => d.pending),
        itemStyle: { color: stPending },
      },
      {
        type: 'bar',
        name: 'Từ chối',
        stack: 'total',
        data: [...(hBarData || [])].reverse().map((d) => d.rejected),
        itemStyle: { color: stRejected, borderRadius: [0, 6, 6, 0] },
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
      textStyle: { ...chartTextStyle, fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '78%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: surface,
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
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
          gap: 12,
          marginBottom: 12,
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
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={16}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <h4 style={CHART_TITLE_STYLE}>Hàng hóa thông qua cảng theo tháng</h4>
            <ReactECharts option={cargoOption} style={{ height: 320 }} notMerge />
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <h4 style={CHART_TITLE_STYLE}>Lượt hành khách qua cảng</h4>
            <ReactECharts option={polarOption} style={{ height: 320 }} notMerge />
          </div>
        </Col>
      </Row>

      {/* Row 2 — Map + Table */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12, alignItems: 'stretch' }}>
        <Col xs={24} md={12}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
            <h4 style={CHART_TITLE_STYLE}>Bản đồ tra cứu Kết cấu hạ tầng</h4>
            <div style={{ height: 380, borderRadius: rSm, overflow: 'hidden' }}>
              <DashboardMap />
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div style={{ ...CARD_BASE, height: '100%' }}>
              <h4 style={CHART_TITLE_STYLE}>Bảng chi tiết thông số kỹ thuật Kết cấu hạ tầng</h4>
            <Table
              columns={infraColumns}
              dataSource={INFRA_DATA}
              rowKey="stt"
              pagination={false}
              size="small"
              scroll={{ x: 480, y: 340 }}
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
