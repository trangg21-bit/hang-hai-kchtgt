---
id: F-282
name: Biểu đồ xu hướng Dashboard
slug: bieu-do-xu-huong-dashboard
module-id: M-022
status: done
priority: high
created: 2026-07-09T00:00:00Z
last-updated: 2026-07-13T00:00:00Z
stage: closed
---
# Feature: Biểu đồ xu hướng Dashboard

## Mô tả chung

| Mục tiêu | Hiển thị hai biểu đồ xu hướng theo tháng trên Row 1 của Dashboard (ngay dưới hàng 6 thẻ KPI). Biểu đồ 1 thể hiện sản lượng hàng hóa thông qua cảng (stacked bar, 6 chuỗi). Biểu đồ 2 thể hiện lượt hành khách qua cảng (polar bar, 2 chuỗi). |
|---|---|
| **Tác nhân** | Người dùng Dashboard (xem), Hệ thống (tự động cập nhật khi đổi năm) |
| **Luồng chính** | Người dùng truy cập trang chủ → Dashboard load → Hai biểu đồ render với dữ liệu năm hiện tại. Người dùng đổi năm trên FilterBar → `useEffect([year])` refetch toàn bộ dữ liệu → Biểu đồ re-render. |
| **Điều kiện trước** | FilterProvider hoạt động, `filter.year` có giá trị. Dashboard data pipeline (`fetchWithFallback`) đã khởi tạo. |
| **Điều kiện sau** | Hai biểu đồ hiển thị dữ liệu 12 tháng của năm được chọn. Nếu API lỗi, fallback về mock data kèm tag "Dữ liệu mẫu". |
| **Quy tắc nghiệp vụ** | (1) Tháng chưa có dữ liệu → giá trị `null`, ECharts bỏ qua (không vẽ cột 0). (2) Tháng hiện tại → lũy kế đến ngày hiện tại. (3) Khi đổi năm, toàn bộ dữ liệu chart được refetch từ API. (4) Dữ liệu cargo hiện tại chưa có trường phân loại hàng hóa (G-001) → dùng mock ratio để tách 6 chuỗi. (5) Dữ liệu hành khách chưa có trường hướng đến/rời (G-002) → dùng mock split 53%/47%. |

## Mô tả màn hình

Hai biểu đồ nằm trên Row 1, bên dưới hàng KPI 6 card. Layout: `Row gutter={[16, 16]}`.

### Layout Row 1

| Cột | Tỷ lệ | Nội dung |
|---|---|---|
| Col 1 | `xs=24 md=16` (≈ 1.4:1 so với Col 2) | Biểu đồ 1 — Hàng hóa thông qua cảng theo tháng |
| Col 2 | `xs=24 md=8` | Biểu đồ 2 — Lượt hành khách qua cảng |

Mỗi biểu đồ được bọc trong thẻ `CARD_BASE`:
- `background: surfaceCard`, `borderRadius: radiusXl` (18px)
- `padding: 16px 20px`
- `border: 1px solid borderDefault` (`rgba(11,46,79,0.09)`)
- `boxShadow: shadowMd` (`0 2px 4px rgba(11,46,79,0.05), 0 12px 28px rgba(11,46,79,0.07)`)

### Biểu đồ 1 — Hàng hóa thông qua cảng theo tháng (Stacked Bar)

| STT | Tên trường / Điều khiển | Loại điều khiển | Giá trị | Mô tả |
|---|---|---|---|---|
| 1 | Tiêu đề card | `h4` (React node) | `"Hàng hóa thông qua cảng theo tháng"` | `fontSize: fontSizeLg` (15px), `fontWeight: 600`, `color: textPrimary`, `marginBottom: 8px`. Nếu `blockStates.stackedBar.isMockFallback === true` → hiển thị kèm `<Tag color="orange">Dữ liệu mẫu</Tag>`. |
| 2 | Vùng biểu đồ | ECharts instance (`ReactECharts`) | `option: cargoOption` | Chiều cao 320px. Prop `notMerge`. Re-render khi `[year]` thay đổi. |
| 3 | Trục X (category) | ECharts xAxis | 12 tháng `['01','02',…,'12']` | `axisTick: false`. `axisLine.color: borderDefault`. `axisLabel: chartTextStyle`. |
| 4 | Trục Y (value) | ECharts yAxis | `max: 25000` | Label format `(v/1000).toFixed(0) + 'M'`. `splitLine: dashed`, `color: borderDefault`. |
| 5 | Legend | ECharts legend | `bottom: 0`, `icon: 'roundRect'`, `itemWidth: 10`, `itemHeight: 10` | `textStyle: {...chartTextStyle, fontSize: fontSizeMd}` (13px). |
| 6 | Chuỗi 1 — Nội địa | `type: 'bar'`, `stack: 'total'` | `color: cargoSeriesColors[0]` (`dataNavy` = `#0b2e4f`) | `barWidth: '58%'`. `borderRadius: 0`. Dữ liệu: `CARGO_SERIES[0].data`. |
| 7 | Chuỗi 2 — Nhập khẩu | `type: 'bar'`, `stack: 'total'` | `color: cargoSeriesColors[1]` (`dataSea0` = `#123a63`) | `barWidth: '58%'`. `borderRadius: 0`. Dữ liệu: `CARGO_SERIES[1].data`. |
| 8 | Chuỗi 3 — Xuất khẩu | `type: 'bar'`, `stack: 'total'` | `color: cargoSeriesColors[2]` (`dataSea1` = `#2769b3`) | `barWidth: '58%'`. `borderRadius: 0`. Dữ liệu: `CARGO_SERIES[2].data`. |
| 9 | Chuỗi 4 — Chuyển tải | `type: 'bar'`, `stack: 'total'` | `color: cargoSeriesColors[3]` (`dataSea2` = `#4f9bd8`) | `barWidth: '58%'`. `borderRadius: 0`. Dữ liệu: `CARGO_SERIES[3].data`. |
| 10 | Chuỗi 5 — Quá cảnh (bốc dỡ) | `type: 'bar'`, `stack: 'total'` | `color: cargoSeriesColors[4]` (`dataSea3` = `#9ecdf0`) | `barWidth: '58%'`. `borderRadius: 0`. Dữ liệu: `CARGO_SERIES[4].data`. |
| 11 | Chuỗi 6 — Quá cảnh (K bốc dỡ) | `type: 'bar'`, `stack: 'total'` | `color: cargoSeriesColors[5]` (`dataTeal` = `#bedaf2`) | `barWidth: '58%'`. `borderRadius: [radiusSm, radiusSm, 0, 0]` (4px bo góc trên). Đây là chuỗi trên cùng. Dữ liệu: `CARGO_SERIES[5].data`. |
| 12 | Tooltip | ECharts tooltip | `trigger: 'axis'`, `axisPointer: { type: 'line' }` | Custom HTML formatter: dòng tháng (bold), từng chuỗi + giá trị, gạch ngang + tổng cuối. |
| 13 | Grid | ECharts grid | `{ ...chartGrid, bottom: 40 }` | Kế thừa `chartGrid` từ tokens (top: 16, right: 16, bottom: 40, left: 16, containLabel: true). |

> **Ghi chú dữ liệu:** `CARGO_SERIES` là hằng số inline 6 chuỗi định nghĩa tại `Home.tsx`. Dữ liệu tháng 01–07 có giá trị mock, tháng 08–12 là `null`. API pipeline (`fetchCargoMonthly`) lấy dữ liệu từ `GET /v1/integration/share/cargo/summary?periodType=MONTHLY` và transform qua `transformMonthlyCargo()` — hiện chỉ output 4 chuỗi dùng mock ratio (G-001: thiếu trường cargoType trong `CargoAggregate`). 2 chuỗi Quá cảnh không có pipeline (G-010).

### Biểu đồ 2 — Lượt hành khách qua cảng (Polar Bar)

| STT | Tên trường / Điều khiển | Loại điều khiển | Giá trị | Mô tả |
|---|---|---|---|---|
| 1 | Tiêu đề card | `h4` (React node) | `"Lượt hành khách qua cảng"` | `fontSize: fontSizeLg` (15px), `fontWeight: 600`, `color: textPrimary`, `marginBottom: 8px`. Nếu `blockStates.linePassenger.isMockFallback === true` → hiển thị kèm `<Tag color="orange">Dữ liệu mẫu</Tag>`. |
| 2 | Vùng biểu đồ | ECharts instance (`ReactECharts`) | `option: polarOption` | Chiều cao 320px. Prop `notMerge`. Re-render khi `[year]` thay đổi. |
| 3 | Polar | ECharts polar | `radius: ['18%', '78%']` | Vùng polar chart nằm giữa 18% và 78% bán kính. |
| 4 | Angle axis | ECharts angleAxis | `['T1','T2',…,'T12']`, `startAngle: 90` | `axisLabel: chartTextStyle`, `axisLine: false`, `axisTick: false`. `splitLine: dashed`, `color: borderDefault`. |
| 5 | Radius axis | ECharts radiusAxis | `type: 'value'` | `axisLabel: false`, `axisLine: false`, `axisTick: false`, `splitLine: false`. |
| 6 | Legend | ECharts legend | `bottom: 0`, `icon: 'roundRect'`, `itemWidth: 10`, `itemHeight: 10` | `textStyle: {...chartTextStyle, fontSize: fontSizeMd}` (13px). |
| 7 | Chuỗi 1 — Đến cảng | `type: 'bar'`, `coordinateSystem: 'polar'`, `stack: 'a'` | Gradient `dataSea0` (`#123a63`) → `dataSea1` (`#2769b3`) | Dữ liệu: `passengerMonthly.arrival[]`. `emphasis.itemStyle.color: dataSea1`. |
| 8 | Chuỗi 2 — Rời cảng | `type: 'bar'`, `coordinateSystem: 'polar'`, `stack: 'a'` | `dataSea2` (`#4f9bd8`) | `borderRadius: [radiusSm, radiusSm, 0, 0]` (4px bo góc trên). Đây là chuỗi trên cùng. `emphasis.itemStyle.color: dataSea2`. Dữ liệu: `passengerMonthly.departure[]`. |
| 9 | Tooltip | ECharts tooltip | `trigger: 'item'`, style từ `chartTooltip` | Format mặc định ECharts (series name + value). |

> **Ghi chú dữ liệu:** Dữ liệu `passengerMonthly` đến từ `dashboardData.linePassenger`. API pipeline (`fetchCargoPassenger`) lấy từ `GET /v1/integration/share/cargo/summary?periodType=CARGO_PASSENGER` và transform qua `transformPassengerData()` — split `vesselCount` theo tỷ lệ 53% arrival / 47% departure vì `CargoAggregate` thiếu trường direction (G-002).

## Luồng thao tác

### Luồng chính — Xem biểu đồ

1. Người dùng truy cập trang Dashboard (`/`).
2. `HomeDashboard` mount → `useEffect` gọi `dashboardApi.fetchWithFallback({ year, province: null, infraType: null }, MOCK_DATA)`.
3. 8 API calls chạy song song qua `Promise.allSettled`.
4. `fetchCargoMonthly(year)` → `GET /v1/integration/share/cargo/summary?periodType=MONTHLY&page=0&size=50` → filter `periodStart` theo năm → `transformMonthlyCargo()` (mock ratio split).
5. `fetchCargoPassenger(year)` → `GET /v1/integration/share/cargo/summary?periodType=CARGO_PASSENGER&page=0&size=200` → filter theo năm → `transformPassengerData()` (mock 53%/47% split).
6. `setDashboardData(result.data)` → `setBlockStates(result.states || {})`.
7. Biểu đồ cargo stacked bar render từ hằng `CARGO_SERIES` inline (chưa tiêu thụ `dashboardData.stackedBar`). Biểu đồ polar bar render từ `dashboardData.linePassenger`.
8. Nếu `blockStates.stackedBar.isMockFallback === true` → hiển thị tag "Dữ liệu mẫu" trên cargo chart.
9. Nếu `blockStates.linePassenger.isMockFallback === true` → hiển thị tag "Dữ liệu mẫu" trên passenger chart.

### Luồng phụ — Đổi năm

1. Người dùng thay đổi năm trên FilterBar → `FilterContext.year` thay đổi.
2. `useEffect([year])` trong `HomeDashboard` kích hoạt → gọi lại `fetchWithFallback`.
3. Toàn bộ bước 3–7 của luồng chính lặp lại với năm mới.
4. `ReactECharts` với prop `notMerge` re-render chart từ option mới.

## Cấu trúc kỹ thuật

| Thành phần | File | Vai trò |
|---|---|---|
| Trang Dashboard | `frontend/src/pages/Home.tsx` | Component chứa toàn bộ logic render biểu đồ. Định nghĩa hằng `CARGO_SERIES` (6 chuỗi), `CARD_BASE`, `CHART_TITLE_STYLE`. Xây dựng `cargoOption` (stacked bar) và `polarOption` (polar bar). |
| Token Dashboard | `frontend/src/tokens-dashboard.ts` | Cung cấp `cargoSeriesColors[0..5]`, `chartGrid`, `chartTooltip`, `chartTextStyle`. Re-export tất cả token từ `tokens.ts`. |
| Semantic Tokens | `frontend/src/tokens.ts` | Định nghĩa palette 13 màu, thang số (radius, spacing, font), style conventions. |
| API Layer | `frontend/src/services/dashboardApi.ts` | `fetchCargoMonthly()`, `fetchCargoPassenger()`, `transformMonthlyCargo()`, `transformPassengerData()`, `fetchWithFallback()`. |
| Types | `frontend/src/services/dashboardTypes.ts` | `CargoAggregate`, `MonthlyCargoSeries`, `PassengerMonthlySeries`, `DashboardData`, `BlockState`. |
| Mock Data | `frontend/src/services/dashboardMockData.ts` | `MOCK_DATA.stackedBar` (4-series), `MOCK_DATA.linePassenger` (arrival/departure). |
| Filter Context | `frontend/src/context/FilterContext.tsx` | Cung cấp `{ year, province, infraType }` cho toàn bộ Dashboard. `year` change trigger `useEffect` refetch. |
| ECharts Bindings | `echarts-for-react` (npm) | Component `ReactECharts`. Prop `notMerge` cho re-render khi đổi năm. |

## Quy tắc giao diện

### Layout & Card

1. Row gutter `[16, 16]`, marginBottom `16px`.
2. `CARD_BASE`: `surfaceCard` nền trắng, `borderRadius: radiusXl` (18px), padding `16px 20px`, border `1px solid borderDefault`, `boxShadow: shadowMd`.
3. Chiều cao chart: **320px** cho cả hai biểu đồ.
4. Title chart: `fontSize: fontSizeLg` (15px), `fontWeight: 600`, `color: textPrimary`, `marginBottom: 8px`.
5. Grid spacing: `chartGrid` từ tokens (top 16, right 16, bottom 40, left 16, `containLabel: true`). Cargo thêm `bottom: 40`.

### Chart-Specific

6. **Cargo stacked bar**: `barWidth: '58%'`. Không có `barGap` hoặc `barCategoryGap` — segments dính nhau (không khe 2px). Chuỗi cuối (Quá cảnh K bốc dỡ, index 5) bo góc trên `[radiusSm, radiusSm, 0, 0]`. Các chuỗi khác `borderRadius: 0`.
7. **Cargo Y-axis**: `max: 25000`, label format `###M` (chia 1000). AxisLine color `borderDefault`. `splitLine: dashed`.
8. **Polar passenger**: `polar.radius: ['18%', '78%']`. `angleAxis.startAngle: 90`. Chuỗi "Rời cảng" (trên cùng) bo góc `[radiusSm, radiusSm, 0, 0]`.
9. **Legend**: `bottom: 0`, `icon: 'roundRect'`, `itemWidth: 10`, `itemHeight: 10`, `textStyle.fontSize: fontSizeMd` (13px).
10. **Cargo tooltip**: Custom HTML — dòng tháng (bold), từng chuỗi marker + tên + giá trị, gạch ngang + tổng cuối (font-weight 700).
11. **Passenger tooltip**: default ECharts `trigger: 'item'`.
12. **Colors**: **KHÔNG hardcode hex**. Tất cả từ tokens: `dataNavy`, `dataSea0`, `dataSea1`, `dataSea2`, `dataSea3`, `dataTeal` qua `cargoSeriesColors[0..5]`.

## Xử lý trạng thái

### Loading

Hiện tại Home.tsx **chưa dùng** `TrendChartCard` — chart render trực tiếp trong `CARD_BASE`. Khi `fetchWithFallback` đang chạy, chart render với dữ liệu hiện tại (data cũ hoặc MOCK_DATA ban đầu). **Chưa có skeleton loading riêng cho từng chart block.** Xem G-011.

### Empty

Khi API trả về empty `content[]`: transform function fallback về giá trị mock (MOCK_DATA.stackedBar.series[n].data[m] hoặc MOCK_DATA.linePassenger.arrival[m]/departure[m]). **Chưa có empty state UI riêng cho chart blocks.**

### Error

- Mỗi API call trong `Promise.allSettled` độc lập — lỗi block này không ảnh hưởng block khác.
- Khi `fetchCargoMonthly` reject → `dashboardData.stackedBar = MOCK_DATA.stackedBar`, `blockStates.stackedBar = { state: 'error', isMockFallback: true, lastError: '...' }`.
- Khi `fetchCargoPassenger` reject → `dashboardData.linePassenger = MOCK_DATA.linePassenger`, `blockStates.linePassenger = { state: 'error', isMockFallback: true, lastError: '...' }`.
- UI hiển thị tag `<Tag color="orange">Dữ liệu mẫu</Tag>` kế bên title card khi `isMockFallback === true`.
- Console.warn log cho mỗi block fallback.

### Mock Fallback

- **G-001**: `transformMonthlyCargo()` dùng mock ratio (nội địa 0.58, xuất khẩu 0.27, nhập khẩu 0.15, chuyển tải 0.1) để split `totalTons` thành 4 chuỗi. 2 chuỗi Quá cảnh không có pipeline (G-010).
- **G-002**: `transformPassengerData()` dùng mock split (arrival 53%, departure 47% của `vesselCount`).
- `cargoOption` đọc từ hằng `CARGO_SERIES` inline — chưa tiêu thụ `dashboardData.stackedBar`.

## Dependencies

- **F-280 (FilterBar)**: Filter state (`year`) điều khiển chart data refetch qua `useFilter()` → `useEffect([year])`.
- **M-009 (Integration API)**: E2 endpoint (`GET /v1/integration/share/cargo/summary`) là nguồn dữ liệu cho cả hai chart. Backend cần bổ sung cargo-type breakdown field (G-001) và passenger direction field (G-002).
- **F-281 (Thẻ KPI Dashboard)**: Cung cấp `dashboardTypes.ts`, `dashboardApi.ts`, `dashboardMockData.ts` — pipeline dữ liệu dùng chung.
- **tokens-dashboard.ts**: `cargoSeriesColors[0..5]`, `chartGrid`, `chartTooltip`, `chartTextStyle`.
- **echarts-for-react** (npm): Component `ReactECharts` thay thế Recharts.
- **TrendChartCard** (`frontend/src/components/TrendChartCard.tsx`): Component xử lý loading/empty/error states — **chưa được tích hợp vào Home.tsx (G-011)**.
