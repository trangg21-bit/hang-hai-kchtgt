---
feature-id: F-282
document: lean-spec
output-mode: retrospective
last-updated: 2026-07-10
---

# Lean Spec: Biểu đồ xu hướng Dashboard (F-282)

## 1. Summary

Hai biểu đồ trend (xu hướng theo tháng) trên trang chủ Dashboard, layout 2 cột. Biểu đồ 1 là stacked bar "Hàng hóa qua cảng", biểu đồ 2 là line chart "Lượt hành khách". Cả hai dùng chung component wrapper `TrendChartCard` với loading/empty/error state, custom HTML legend, tooltip tiếng Việt.

## 2. Scope

| Item | In scope |
|---|---|
| User story | Người dùng xem xu hướng hàng hóa (stacked bar) và hành khách (line) theo tháng |
| Actors | Cán bộ quản lý cảng, lãnh đạo Cục |
| Data source | Mock data inline trong Home.tsx (2 mảng `cargoData` / `passengerData`) |
| Layout | Row/Col 2 cột, xs=24 (full width mobile), md=12 (50% desktop) |
| State handling | Loading (Skeleton), Empty (📭 + "Không có dữ liệu"), Error (WarningOutlined + "Đã xảy ra lỗi" + Thử lại button) |

## 3. User Stories

| ID | MoSCoW | Story |
|---|---|---|
| US-01 | Must | Là cán bộ quản lý, tôi muốn xem biểu đồ cột chồng hàng hóa theo tháng (Nội địa/Xuất khẩu/Nhập khẩu/Chuyển tải) |
| US-02 | Must | Là cán bộ quản lý, tôi muốn xem biểu đồ đường lượt hành khách đến và rời cảng theo tháng |
| US-03 | Must | Là người dùng, tôi muốn thấy trạng thái loading/empty/error rõ ràng nếu dữ liệu chưa sẵn sàng |
| US-04 | Should | Là người dùng, tôi muốn hover vào biểu đồ để thấy giá trị cụ thể (tooltip tiếng Việt) |

## 4. Acceptance Criteria

| ID | Scenario | Gherkin | Negative? |
|---|---|---|---|
| AC-01 | Stacked bar đủ 4 chuỗi | Given dữ liệu 12 tháng, When render chart, Then thấy 4 chuỗi chồng: Nội địa (dataPrimary #2A78D6), Xuất khẩu (statusOperational #1BAF7A), Nhập khẩu (statusAttention #EDA100), Chuyển tải (dataSecondary #E87BA4) | No |
| AC-02 | Chuyển tải bo góc trên | Given stacked bar, When render Chuyển tải segment, Then segment cuối có radius top (radius=[4,4,0,0]) | No |
| AC-03 | Line chart 2 đường | Given dữ liệu 12 tháng, When render line chart, Then Đến cảng (statusOperational #1BAF7A, strokeWidth=2, liền) và Rời cảng (statusCritical #E34948, strokeWidth=2, strokeDasharray="6 4") | No |
| AC-04 | Đường bo mượt | Given line chart, When render, Then dùng type="monotone" | No |
| AC-05 | Custom legend | Given cả hai chart, When render, Then legend là HTML inline (không dùng Recharts Legend), mỗi item là dot 8px + label | No |
| AC-06 | Tooltip tiếng Việt | Given hover vào chart, Then tooltip hiển thị value với `toLocaleString('vi-VN')` và label tiếng Việt | No |
| AC-07 | Loading state | Given `loading=true`, Then render Skeleton active (4 rows) thay vì chart | Yes |
| AC-08 | Empty state | Given `empty=true`, Then hiển thị icon 📭 + "Không có dữ liệu" | Yes |
| AC-09 | Error state | Given `error=true`, Then hiển thị WarningOutlined + "Đã xảy ra lỗi" + nút "Thử lại" (gọi `onRetry`) | Yes |
| AC-10 | Layout 2 cột | Given desktop, Then biểu đồ chiếm md=12 mỗi cột; Given mobile (xs), Then mỗi cột full width | No |
| AC-11 | Responsive container | Given mọi kích thước, Then chart nằm trong ResponsiveContainer với width=100% | No |

## 5. TrendChartCard Component API

| Prop | Type | Default | Description |
|---|---|---|---|
| title | string | — | Tiêu đề card, render ở Card title với fontSizeLg (15px) / fontWeightMedium (500) |
| legendItems | { color: string, label: string }[] | undefined | Mảng các item legend, mỗi item là dot tròn 8px + label. Gap spaceLg (16px) |
| loading | boolean | false | Bật Skeleton active (4 paragraph rows) |
| empty | boolean | false | Hiển thị trạng thái empty (📭 + "Không có dữ liệu") |
| error | boolean | false | Hiển thị trạng thái lỗi (WarningOutlined + "Đã xảy ra lỗi" + Thử lại button) |
| onRetry | () => void | undefined | Callback khi bấm nút Thử lại (chỉ hiển thị khi error=true) |
| height | number | 240 | Chiều cao vùng nội dung (px) |
| children | ReactNode | — | Nội dung chart (được render khi !loading && !error && !empty) |

**State precedence:** loading > error > empty > children. Chỉ một state active tại một thời điểm.

## 6. Token Compliance

| Token | Value | Usage in F-282 |
|---|---|---|
| dataPrimary | #2A78D6 | Stacked bar "Nội địa" (fill) |
| statusOperational | #1BAF7A | Stacked bar "Xuất khẩu" (fill); Line "Đến cảng" (stroke) |
| statusAttention | #EDA100 | Stacked bar "Nhập khẩu" (fill) |
| dataSecondary | #E87BA4 | Stacked bar "Chuyển tải" (fill) |
| statusCritical | #E34948 | Line "Rời cảng" (stroke); Error icon color |
| textSecondary | #6B7280 | Legend label, axis tick, empty/error message text |
| borderDefault | #E5E7EB | CartesianGrid stroke, tooltip border |
| fontSizeSm | 11px | Legend label, axis tick |
| fontSizeMd | 13px | Empty/error message text |
| fontSizeLg | 15px | Card title |
| fontSizeXl | 20px | Empty icon, error icon |
| fontWeightMedium | 500 | Card title |
| radiusSm | 4px | Legend dot border-radius |
| radiusMd | 8px | Tooltip border-radius |
| spaceSm | 8px | Gap trong legend item, flex gap empty/error |
| spaceMd | 12px | Card body padding, margin-bottom legend |
| spaceLg | 16px | Gap legend items, gutter Row |
| cardStyle | — | Card container style (surfaceCard background + border + radiusLg + padding) |
| accent budget | ≤ 3 | TrendChartCard error button dùng actionPrimary → 1 use (OK, ≤ 3) |

## 7. Implementation Notes

- **Stacked bar:** 4 `<Bar stackId="a">`, segment cuối (Chuyển tải) dùng `radius={[4,4,0,0]}` để bo góc trên cột. Khe 2px giữa segments đạt được nhờ stroke mặc định Recharts.
- **Line chart:** `type="monotone"` bo mượt, `dot={false}`, `activeDot={{ r: 4 }}`. Đường đứt dùng `strokeDasharray="6 4"`.
- **Tooltip:** `contentStyle` dùng borderRadius + border từ tokens. `formatter` map dataKey sang label tiếng Việt (VD: `noiDia` → "Nội địa") và dùng `value.toLocaleString('vi-VN')`.
- **Trạng thái:** Home.tsx hiện không truyền `loading`/`empty`/`error` (luôn render chart với mock data). Các props này sẵn sàng cho integration với dữ liệu thật sau.
- **Zero hardcoded hex:** Tất cả màu từ token (dataPrimary, statusOperational, statusAttention, dataSecondary, statusCritical).

## 8. Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Q1: creates new domain elements? | No | TrendChartCard là UI component, không có entity/aggregate mới |
| Q2: affects system architecture? | No | Chỉ là component con trong Home.tsx, không thay đổi routing/state |
| Q3: approach clear? | Yes | Dùng TrendChartCard + Recharts, pattern đã có sẵn trong codebase |
| **Route to** | `engineering-technical-lead` | Frontend-only task, rõ ràng |
