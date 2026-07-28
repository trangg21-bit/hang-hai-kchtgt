---
id: F-281
name: Thẻ KPI Dashboard
slug: the-kpi-dashboard
module-id: M-022
status: done
classification: local
priority: high
created: 2026-07-09T00:00:00Z
last-updated: 2026-07-13T00:00:00Z
locked-fields: []
consumed_by_modules: []
stage: closed
---

# Feature: Thẻ KPI Dashboard

## Mô tả chung

| Nội dung | Mô tả |
| --- | --- |
| Mục đích | Hiển thị hàng 6 card chỉ số cốt lõi ngay dưới thanh bộ lọc, cho phép người dùng "liếc" là thấy ngay toàn cảnh hoạt động cảng biển: sản lượng, lượt tàu, hành khách, tình trạng KCHT, tồn đọng phê duyệt. |
| Tác nhân | Người dùng đã đăng nhập, truy cập trang Dashboard |
| Luồng chính | Người dùng mở Dashboard → FilterProvider khởi tạo → `useEffect([year])` trong HomeDashboard gọi `dashboardApi.fetchWithFallback()` + `fetchAssetApprovalStats()` + `fetchKchtApprovalStats()` song song → dữ liệu trả về → 6 card render trong grid `auto-fit, minmax(200px, 1fr)` gap 16px. Khi người dùng đổi Năm trên FilterBar → `useEffect` trigger lại → toàn bộ KPI cards cập nhật giá trị mới. |
| Điều kiện trước | - Người dùng đã truy cập trang Dashboard. - FilterBar (F-280) đã render và FilterContext đã khởi tạo. |
| Điều kiện sau | - 6 card hiển thị đầy đủ giá trị từ API (hoặc MOCK_DATA fallback nếu API lỗi). - HeroCard hiển thị năm hiện tại từ FilterContext. - ApprovalCard hiển thị trạng thái tồn đọng phê duyệt mới nhất. |
| Quy tắc nghiệp vụ | - **Nguồn dữ liệu**: kpiCards[0..2] từ `dashboardData.kpiCards[]` (qua `fetchWithFallback`), Approval cards từ 2 API riêng `fetchAssetApprovalStats()` và `fetchKchtApprovalStats()`. - **isRatio**: MiniKpiCard 3 có `isRatio=true` → hiển thị dạng "operatingCount/totalCount" thay vì số đơn lẻ, không hiển thị delta arrow. - **Pending pill**: `pending === 0` → zero variant (nền dataSea3, chữ dataSea1, "✓ 0 chờ"); `pending > 0` → active variant (nền `rgba(79,155,216,0.12)`, chữ dataSea0, "⏳ N chờ"). - **Delta arrow**: `deltaDirection === 'up'` → ▲ xanh statusOperational; `'down'` → ▼ đỏ statusCritical; `undefined/null` → → xám textSecondary. - **Làm tròn**: deltaPercent làm tròn 1 chữ số thập phân. - **Format số**: `toLocaleString('vi-VN')` cho phân cách hàng nghìn. - **Toàn bộ token từ tokens-dashboard.ts**: cấm hardcode hex/spacing/font. |

## Mô tả màn hình

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **HeroCard** — SẢN LƯỢNG CHỦ ĐẠO | Card (hiển thị) | Không | Có | Theo dữ liệu | **Vị trí**: rightmost (cuối cùng bên phải). **Nền**: `linear-gradient(135deg, dataNavy, dataSea0)`, không border. **Nội dung**: (a) Nhãn "SẢN LƯỢNG CHỦ ĐẠO · {year}" — text màu `#eaf4fc`, opacity 0.7, uppercase, letterSpacing 1px. (b) Giá trị `heroKpi.value.toLocaleString('vi-VN')` — fontSizeDisplay, fontMono, fontWeight 600. (c) Đơn vị `heroKpi.unit` — fontSizeMd, opacity 0.7. (d) Delta: ▲/▼ + `heroKpi.deltaPercent`% + "so với {heroKpi.previousYearValue.toLocaleString()}" — fontSizeMd. (e) Sparkline ECharts 12 tháng — line chart với area gradient (dataSea3 35%→5%), height 36px. **Nguồn dữ liệu**: `heroKpi.value = SUM(totalTons)` từ `fetchCargoTotal(year)`; `heroKpi.deltaPercent` từ `fetchYearOverYear(year)`. Nếu API lỗi → fallback MOCK_DATA.heroKpi. |
| 2 | **MiniKpiCard 1** — Lượt tàu qua cảng | Card (hiển thị) | Không | Có | Theo dữ liệu | **Vị trí**: thứ 1 từ trái. **Nền**: surfaceCard, borderRadius radiusXl, padding 16px 20px, border + shadowMd. **Nội dung**: (a) Nhãn "Lượt tàu qua cảng" — fontSizeMd, textSecondary. (b) Giá trị `kpiCards[0].value` — fontSizeDisplay, fontMono, fontWeight 600. (c) Delta arrow: ▲ statusOperational nếu up, ▼ statusCritical nếu down, → textSecondary nếu undefined. (d) Sparkline ECharts (line/bar tùy sparklineType) — height 28px, màu dataSea1. **Nguồn dữ liệu**: `value = SUM(vesselCount)` từ `fetchCargoAnnual(year)`. Delta đang mock 8.9% (chưa có YoY riêng). Nếu API lỗi → MOCK_DATA.kpiCards[0]. |
| 3 | **MiniKpiCard 2** — Lượt hành khách | Card (hiển thị) | Không | Có | Theo dữ liệu | **Vị trí**: thứ 2 từ trái. **Nội dung**: tương tự MiniKpiCard 1. Nhãn "Lượt hành khách". **Nguồn dữ liệu**: `value = SUM(vesselCount)` từ `fetchCargoPassenger(year)`. Delta đang mock 15.6%. Nếu API lỗi → MOCK_DATA.kpiCards[1]. |
| 4 | **MiniKpiCard 3** — KCHT đang vận hành | Card (hiển thị) | Không | Có | Theo dữ liệu | **Vị trí**: thứ 3 từ trái. **Nội dung**: Nhãn "KCHT đang vận hành". Giá trị hiển thị dạng `"operatingCount/totalCount"` (isRatio=true). Delta hiển thị `percentage`% (tỷ lệ vận hành). **Nguồn dữ liệu**: `operatingCount = assetsByStatus['PUBLISHED']`, `totalCount = totalAssets` từ `fetchAssetStatus()`. `percentage = Math.round((operatingCount/totalCount)*100)`. Nếu API lỗi → MOCK_DATA.kpiCards[2]. |
| 5 | **ApprovalCard 1** — Phê duyệt tài sản | Card (hiển thị) | Không | Có | Theo dữ liệu | **Vị trí**: thứ 4 từ trái. **Nội dung**: (a) Nhãn "Phê duyệt tài sản". (b) Số tổng `total.toLocaleString()` + "đã xử lý". (c) Stacked status bar: 3 đoạn màu (approvalApproved, approvalPending, approvalRejected) trên nền approvalBarTrack, height 8px, borderRadius 4px. (d) Legend: chấm vuông màu + "Đã duyệt N", "Từ chối N". (e) Pending pill: ✓ 0 chờ (zero variant) hoặc ⏳ N chờ (active variant). **Nguồn dữ liệu**: `GET /v1/dashboard/approval-asset` → `{ total, approved, pending, rejected }`. Không phụ thuộc year. |
| 6 | **ApprovalCard 2** — Phê duyệt KCHT | Card (hiển thị) | Không | Có | Theo dữ liệu | **Vị trí**: thứ 5 từ trái. **Nội dung**: giống ApprovalCard 1, nhãn "Phê duyệt KCHT". **Nguồn dữ liệu**: `GET /v1/dashboard/approval-kcht` → `{ total, approved, pending, rejected }`. Không phụ thuộc year. |

## Luồng thao tác

### Luồng chính — Load trang Dashboard

```
Người dùng truy cập "/"
  → HomePage render → FilterProvider khởi tạo
  → HomeDashboard mount → useEffect([year]) chạy
  → 3 data sources chạy song song:
      (A) dashboardApi.fetchWithFallback({ year, ... }, MOCK_DATA)
          → 9 API endpoints (Promise.allSettled)
          → transformCargoTotals() → heroKpi + kpiCard1
          → transformCargoTotals() → kpiCard1 (Lượt tàu)
          → cargoPassenger → kpiCard2 (Lượt hành khách)
          → transformKchtRing() → kpiCard3 (KCHT vận hành)
      (B) fetchAssetApprovalStats() → assetStats
      (C) fetchKchtApprovalStats() → kchtStats
  → setDashboardData(data), setAssetStats, setKchtStats
  → 6 card render: 3 MiniKpiCard → 2 ApprovalCard → 1 HeroCard
```

### Luồng phụ — Đổi năm trên FilterBar

```
Người dùng chọn năm 2025 trên FilterBar
  → FilterContext.setState: year = 2025
  → HomeDashboard.useEffect([year]) trigger lại
  → (A) + (B) + (C) fetch lại toàn bộ dữ liệu với year mới
  → HeroCard hiển thị "SẢN LƯỢNG CHỦ ĐẠO · 2025"
  → KPI cards 1-3 cập nhật giá trị năm 2025
  → Approval cards không đổi (không phụ thuộc year)
```

## Cấu trúc kỹ thuật

| Thành phần | File | Vai trò |
| --- | --- | --- |
| HeroCard | `frontend/src/pages/Home.tsx` (inline component) | Card nổi bật nhất: gradient nền, số lớn, sparkline, delta YoY |
| MiniKpiCard | `frontend/src/pages/Home.tsx` (inline component) | Card KPI tiêu chuẩn: nhãn + giá trị + delta arrow + sparkline |
| ApprovalCard | `frontend/src/pages/Home.tsx` (inline component) | Card phê duyệt: stacked bar + legend + pending pill |
| dashboardApi | `frontend/src/services/dashboardApi.ts` | Data fetching: `fetchWithFallback`, `fetchAssetApprovalStats`, `fetchKchtApprovalStats` |
| dashboardTypes | `frontend/src/services/dashboardTypes.ts` | Type definitions: `DashboardData`, `KpiCardData`, `ApprovalStats` |
| dashboardMockData | `frontend/src/services/dashboardMockData.ts` | MOCK_DATA fallback khi API lỗi |
| Design tokens | `frontend/src/tokens-dashboard.ts` | Token màu sắc, spacing, font-size cho toàn bộ card |

## Quy tắc giao diện

### Grid layout

| Thuộc tính | Giá trị |
| --- | --- |
| Display | `grid` |
| Template columns | `repeat(auto-fit, minmax(200px, 1fr))` |
| Gap | 16px |
| Margin bottom | 16px |

### CARD_BASE style (dùng chung cho MiniKpiCard + ApprovalCard)

| Thuộc tính | Token |
| --- | --- |
| Background | `surfaceCard` (#FFFFFF) |
| Border-radius | `radiusXl` (18px) |
| Padding | `16px 20px` |
| Border | `1px solid borderDefault` |
| Box-shadow | `shadowMd` |

### Token sử dụng theo card

| Card | Token sử dụng |
| --- | --- |
| HeroCard | `dataNavy`, `dataSea0` (gradient), `dataSea3` (sparkline area), `fontSizeDisplay`, `fontSizeMd`, `fontMono`, `statusOperational`, `statusCritical` |
| MiniKpiCard | `surfaceCard`, `radiusXl`, `shadowMd`, `borderDefault`, `textPrimary`, `textSecondary`, `fontSizeDisplay`, `fontSizeMd`, `fontMono`, `statusOperational`, `statusCritical`, `dataSea1` (sparkline) |
| ApprovalCard | `surfaceCard`, `radiusXl`, `shadowMd`, `borderDefault`, `textPrimary`, `textSecondary`, `fontSizeDisplay`, `fontSizeMd`, `fontMono`, `approvalApproved`, `approvalPending`, `approvalRejected`, `approvalBarTrack`, `pendingActiveBg`, `pendingActiveColor`, `pendingZeroBg`, `pendingZeroColor`, `radiusPill` |

## Xử lý trạng thái

| Trạng thái | Cách xử lý |
| --- | --- |
| **Loading** | Hiển thị skeleton placeholder per card, giữ nguyên layout grid để tránh layout shift |
| **Empty** | Khi `dashboardData.kpiCards[]` rỗng hoặc API trả về null → card hiển thị text "Không có dữ liệu" |
| **Error / API lỗi** | `fetchWithFallback` dùng `Promise.allSettled` → block nào lỗi fallback riêng về MOCK_DATA. Card hiển thị dữ liệu mẫu + tag "Dữ liệu mẫu" màu cam. |
| **Mock fallback toàn bộ** | Nếu `fetchAll` throw → toàn bộ `DashboardData = MOCK_DATA`, tất cả `blockStates[key].isMockFallback = true` |

## Dependencies

| Dependency | Vai trò |
| --- | --- |
| F-280 (FilterBar) | KPI cards phụ thuộc vào `year` từ FilterContext — khi year thay đổi, toàn bộ KPI fetch lại |
| `tokens-dashboard.ts` + `tokens.ts` | Design token system — màu sắc, spacing, font-size, shadow |
| `dashboardApi.ts` | 3 hàm data fetching: `fetchWithFallback`, `fetchAssetApprovalStats`, `fetchKchtApprovalStats` |
| `dashboardTypes.ts` | TypeScript interfaces: `DashboardData`, `KpiCardData`, `KpiWithSparkline`, `BlockState` |
| `dashboardMockData.ts` | `MOCK_DATA` fallback khi API không available |
| `echarts-for-react` (ECharts) | Sparkline rendering trong HeroCard và MiniKpiCard |
| `react-router-dom` | `useSearchParams` trong FilterContext để lấy `year` hiện tại |
