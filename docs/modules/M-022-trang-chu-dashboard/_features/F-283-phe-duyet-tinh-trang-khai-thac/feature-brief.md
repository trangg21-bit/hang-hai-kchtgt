---
id: F-283
name: Phê duyệt & Tình trạng khai thác
slug: phe-duyet-tinh-trang-khai-thac
module-id: M-022
status: done
priority: high
created: 2026-07-09T00:00:00Z
last-updated: 2026-07-13T00:00:00Z
stage: closed
---
# Feature: Phê duyệt & Tình trạng khai thác

## Mô tả chung

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Hiển thị 3 khối thông tin trên trang Dashboard: (1) 2 thẻ ApprovalCard — Phê duyệt tài sản & Phê duyệt KCHT — với tổng số đã xử lý + thanh bar trạng thái (Đã duyệt / Chờ duyệt / Từ chối) + legend + pending pill; (2) Bảng tình trạng khai thác 10 dòng KCHT với 6 cột (Loại, Tổng số lượng, Chưa khai thác/vận hành, Đang khai thác/vận hành, Dừng khai thác/vận hành, Hành động) |
| **Tác nhân** | Người dùng Dashboard (Manager, Viewer); Hệ thống Backend API |
| **Luồng chính** | 1. Dashboard mount → `useEffect([year])` gọi `fetchAssetApprovalStats()` và `fetchKchtApprovalStats()` (song song); 2. Đồng thời render bảng KCHT từ hằng `INFRA_DATA` hardcode không phụ thuộc API; 3. User thấy 2 thẻ ApprovalCard (KPI row, vị trí card thứ 4 & 5) và bảng khai thác (Row 2, Col phải) |
| **Điều kiện trước** | Dashboard đã render (Home.tsx); FilterContext cung cấp `year` |
| **Điều kiện sau** | Dữ liệu approval và bảng khai thác hiển thị đúng vị trí; mỗi hàng bảng có icon mắt trỏ đến trang chi tiết loại KCHT trên `vmd-mtis-ui` |
| **Quy tắc nghiệp vụ** | Approval stats không phụ thuộc `year` nhưng vẫn gọi lại khi year thay đổi; bảng Khai thác là dữ liệu mẫu hardcode (không gọi API); mỗi hàng có icon mắt → link đến trang chi tiết loại KCHT tương ứng trên hệ thống `vmd-mtis-ui` (URL mapping từng loại đang chờ sếp cung cấp); H-Bar chart (`hBarOption`) đã defined với 3 series (Đã duyệt/Chờ duyệt/Từ chối) từ `dashboardData.hBarApproval` nhưng CHƯA được render trong JSX (gap) |

## Mô tả màn hình

### Block 1 — ApprovalCard: Phê duyệt tài sản

| STT | Tên | Loại | Cho phép sửa | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Label | Text | Không | Có | "Phê duyệt tài sản" | Nhãn card — fontSizeMd (13px), color textSecondary, marginBottom 4 |
| 2 | Total number | Number + text | Không | Có | 466 | Số total fontSizeDisplay (28px), fontMono, fontWeight 600, color textPrimary, lineHeight 1.2; suffix "đã xử lý" fontSizeMd (13px), fontWeight 400, color textSecondary |
| 3 | Stacked status bar | Visual (div) | Không | Có | — | height 8px, borderRadius 4, background approvalBarTrack, display flex, overflow hidden, marginTop 16. 3 segments có transition 'width 0.4s': (1) approvalApproved (dataSea0) cho Đã duyệt, (2) approvalPending (dataSea2) cho Chờ duyệt, (3) approvalRejected (dataSea3) cho Từ chối. Mỗi segment chỉ render nếu pct > 0 |
| 4 | Legend | Flex row | Không | Có | — | display flex, gap 16, marginTop 6, fontSizeMd, color textSecondary. Mỗi mục có 8×8 color square (borderRadius 2, marginRight 4, verticalAlign middle). Xuất hiện nếu count > 0: "Đã duyệt {n}" (square: approvalApproved), "Từ chối {n}" (square: approvalRejected) |
| 5 | Pending pill | Badge (span) | Không | Có | ✓ 0 chờ | marginTop 6, display inline-block, borderRadius radiusPill, padding '2px 10px', fontSizeMd, fontWeight 500. 2 trạng thái: (a) pending === 0 → bg pendingZeroBg (dataSea3 #9ecdf0), color pendingZeroColor (dataSea1 #2769b3), text "✓ 0 chờ"; (b) pending > 0 → bg pendingActiveBg (rgba(79,155,216,0.12)), color pendingActiveColor (dataSea0 #123a63), text "⏳ {n} chờ" |

**Nguồn dữ liệu**: `fetchAssetApprovalStats()` → `GET /v1/dashboard/approval-asset` → state `assetStats`. Default (mock fallback): `{ total: 466, approved: 448, pending: 0, rejected: 18 }`.

### Block 2 — ApprovalCard: Phê duyệt KCHT

| STT | Tên | Loại | Cho phép sửa | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Label | Text | Không | Có | "Phê duyệt KCHT" | Nhãn card — fontSizeMd (13px), color textSecondary, marginBottom 4 |
| 2 | Total number | Number + text | Không | Có | 4.176 | Số total fontSizeDisplay (28px), fontMono, fontWeight 600, color textPrimary, lineHeight 1.2; suffix "đã xử lý" fontSizeMd (13px), fontWeight 400, color textSecondary |
| 3 | Stacked status bar | Visual (div) | Không | Có | — | Giống Block 1: height 8px, borderRadius 4, bg approvalBarTrack, 3 segments ( approvalApproved / approvalPending / approvalRejected ) với transition width 0.4s |
| 4 | Legend | Flex row | Không | Có | — | Giống Block 1: display flex, gap 16, fontSizeMd, color textSecondary. Xuất hiện nếu count > 0: "Đã duyệt {n}" + "Từ chối {n}" |
| 5 | Pending pill | Badge (span) | Không | Có | ✓ 0 chờ | Giống Block 1: borderRadius radiusPill, padding '2px 10px', fontSizeMd, fontWeight 500. Hai trạng thái zero/active với bg/color tương ứng |

**Nguồn dữ liệu**: `fetchKchtApprovalStats()` → `GET /v1/dashboard/approval-kcht` → state `kchtStats`. Default (mock fallback): `{ total: 4176, approved: 4149, pending: 0, rejected: 27 }`.

Cả hai API được gọi trong `useEffect([year])` nhưng **không phụ thuộc year** — vẫn gọi lại khi year thay đổi.

### Block 3 — Bảng tình trạng khai thác (Infra Table)

**Thuộc tính bảng**: Ant Design `<Table size="small" pagination={false} scroll={{ x: 620, y: 340 }} />`. Card wrapper: `CARD_BASE`, height '100%'. Tiêu đề: `<h4 style={CHART_TITLE_STYLE}>Bảng chi tiết thông số kỹ thuật Kết cấu hạ tầng</h4>`. Nếu `blockStates.infraTable?.isMockFallback === true` → hiển thị `<Tag color="orange">Dữ liệu mẫu</Tag>`.

| STT | Tên | Loại | Cho phép sửa | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Cột Loại KCHT | Text column | Không | Có | — | `dataIndex='loai'`, `key='loai'`, width 150. **KHÔNG có tiêu đề cột** (`title: ''`). Hiển thị tên loại KCHT (Bến cảng, Bến phao, ...) |
| 2 | Cột Tổng số lượng | Number column | Không | Có | — | `dataIndex='tongSL'`, width 90, `align: 'center'`. Title: "Tổng số lượng". Render: `<span style={{ fontWeight: 600, fontFamily: fontMono, color: textPrimary }}>{v}</span>` |
| 3 | Cột Chưa khai thác/vận hành | Number column (pill badge) | Không | Có | — | Title 2 dòng: `<span>Chưa khai thác/<br/>vận hành</span>`, width 110, align center. Sử dụng `pillBadge(v, sea0, \`${sea0}18\`, surface)` → text màu sea0 (#123a63), bg sea0 alpha 18%, zero bg surface (#FFFFFF) |
| 4 | Cột Đang khai thác/vận hành | Number column (pill badge) | Không | Có | — | Title 2 dòng: `<span>Đang khai thác/<br/>vận hành</span>`, width 110, align center. Sử dụng `pillBadge(v, surface, sea0, surface)` → text màu surface (#FFFFFF), bg sea0 (#123a63), zero bg surface |
| 5 | Cột Dừng khai thác/vận hành | Number column (pill badge) | Không | Có | — | Title 2 dòng: `<span>Dừng khai thác/<br/>vận hành</span>`, width 110, align center. Sử dụng `pillBadge(v, sea0, sea3, surface)` → text màu sea0 (#123a63), bg sea3 (#9ecdf0), zero bg surface |
| 6 | Cột Hành động | Icon + Link | Không | Có | — | `key='action'`, width 40, align center. Title rỗng. Render `<EyeOutlined style={{ color: textSecondary, cursor: 'pointer' }} />`. **Khi click → điều hướng đến màn hình chi tiết tương ứng với từng loại KCHT** (mỗi loại map đến màn quản lý riêng của loại đó). |

**Hàm `pillBadge(count, activeColor, activeBg, zeroBg)`** (inline function trong Home.tsx):

- Nếu `count === 0`: borderRadius radiusPill, padding '1px 8px', fontSizeMd, background `zeroBg`, color `ink3` (textTertiary), fontWeight 500 → hiển thị "0"
- Nếu `count > 0`: borderRadius radiusPill, padding '1px 8px', fontSizeMd, background `activeBg`, color `activeColor`, fontWeight 500 → hiển thị "{count}"

**10 dòng dữ liệu hardcode** (`INFRA_DATA` — hằng số, không gọi API):

| STT | Loại | Tổng SL | Chưa KT | Đang KT | Dừng KT |
|---|---|---|---|---|---|
| 1 | Bến cảng | 42 | 5 | 34 | 3 |
| 2 | Bến phao | 18 | 2 | 15 | 1 |
| 3 | Cầu cảng | 56 | 8 | 45 | 3 |
| 4 | Khu neo đậu | 24 | 4 | 19 | 1 |
| 5 | Khu chuyển tải | 12 | 2 | 9 | 1 |
| 6 | Luồng hàng hải | 38 | 5 | 33 | 0 |
| 7 | Đèn biển | 215 | 12 | 198 | 5 |
| 8 | Phao tiêu | 183 | 9 | 170 | 4 |
| 9 | Đê chắn sóng | 8 | 1 | 7 | 0 |
| 10 | Kè bảo vệ bờ | 15 | 2 | 12 | 1 |

**Quan trọng về màu**: Cả 3 cột trạng thái (3-4-5) đều dùng **sea-blue palette** — KHÔNG dùng green/yellow/red. "Chưa" = sea0 text / sea0-18% bg; "Đang" = white text / sea0 solid bg; "Dừng" = sea0 text / sea3 bg.

### Block 4 (Gap) — H-Bar Phê duyệt (Approval by category)

Biến `hBarOption: EChartsOption` được **định nghĩa** trong Home.tsx (sau polarOption, trước donutOption) với 3 series:
1. **Đã duyệt** — stack 'total', itemStyle `approvalApproved`, barWidth 20
2. **Chờ duyệt** — stack 'total', itemStyle `approvalPending`
3. **Từ chối** — stack 'total', itemStyle `approvalRejected`, borderRadius [0, radiusSm, radiusSm, 0]

Dữ liệu từ `dashboardData.hBarApproval` — mỗi item có `{ category, approved, pending, rejected }`. Y-axis hiển thị `category` (reverse order). Grid: left 100, bottom 40.

Tuy nhiên, `hBarOption` **KHÔNG được render trong JSX return block** — không có `<ReactECharts option={hBarOption} />` nào trong template. Đây là **lỗ hổng (gap)** — cần được implement để hiển thị biểu đồ H-Bar phê duyệt theo hạng mục trong một card riêng.

## Luồng thao tác

### Luồng chính: Dashboard mount

```
1. HomeDashboard mount
2. useEffect([year]) chạy
3.   ├── dashboardApi.fetchWithFallback(...) → gọi API tổng dashboard → setDashboardData / setBlockStates
4.   ├── dashboardApi.fetchAssetApprovalStats() → GET /v1/dashboard/approval-asset → setAssetStats(...)
5.   └── dashboardApi.fetchKchtApprovalStats() → GET /v1/dashboard/approval-kcht → setKchtStats(...)
6. Render grid Row 0 (KPI row):
7.   ├── <MiniKpiCard card={kpiCards[0]} />           // KPI card 1: Lượt tàu
8.   ├── <MiniKpiCard card={kpiCards[1]} />           // KPI card 2: Hành khách
9.   ├── <MiniKpiCard card={kpiCards[2]} />           // KPI card 3: KCHT
10.  ├── <ApprovalCard label="Phê duyệt tài sản" stats={assetStats} />   // Card 4
11.  ├── <ApprovalCard label="Phê duyệt KCHT" stats={kchtStats} />       // Card 5
12.  └── <HeroCard heroKpi={dashboardData.heroKpi} year={year} />        // Card 6
13. Render Row 2 (Map + Table):
14.  ├── Col md=12 (trái): Map + filter bar
15.  └── Col md=12 (phải): <Table columns={infraColumns} dataSource={INFRA_DATA} ... />
```

### Luồng thay đổi năm

```
1. User thay đổi year trong FilterBar
2. FilterContext cập nhật → HomeDashboard re-render
3. useEffect([year]) chạy lại
4.   ├── fetchWithFallback({ year, province: null, infraType: null }, MOCK_DATA) → cập nhật dashboardData, blockStates
5.   ├── fetchAssetApprovalStats() → gọi lại (dù không phụ thuộc year)
6.   └── fetchKchtApprovalStats() → gọi lại (dù không phụ thuộc year)
7. Bảng INFRA_DATA không đổi (hardcode — không phụ thuộc year)
8. Tất cả re-render với dữ liệu mới
```

## Cấu trúc kỹ thuật

| Thành phần | File | Vai trò |
|---|---|---|
| HomeDashboard | `frontend/src/pages/Home.tsx` | Container chính — quản lý state `assetStats`, `kchtStats`, `dashboardData`, `blockStates`; render ApprovalCard + Infra Table + các chart khác |
| ApprovalCard (inline) | `frontend/src/pages/Home.tsx` | Component inline function (dòng ~131-192) — props: `{ label: string, stats: { total, approved, pending, rejected } }`. Hiển thị 1 thẻ phê duyệt: label, total + suffix, stacked bar, legend, pending pill |
| infraColumns | `frontend/src/pages/Home.tsx` | Mảng 6 column definitions (dòng ~85-127) — loai (rỗng), tongSL (bold fontMono), 3 pillBadge columns, action (EyeOutlined) |
| INFRA_DATA | `frontend/src/pages/Home.tsx` | Hằng số `InfraRow[]` — 10 dòng dữ liệu mẫu KCHT (dòng ~58-70) |
| pillBadge | `frontend/src/pages/Home.tsx` | Helper function (dòng ~73-104) — render span pill badge, 2 mode: count===0 (zeroBg, textTertiary) vs count>0 (activeBg, activeColor) |
| Dashboard API service | `frontend/src/services/dashboardApi.ts` | `fetchAssetApprovalStats(): GET /v1/dashboard/approval-asset`, `fetchKchtApprovalStats(): GET /v1/dashboard/approval-kcht` |
| ApprovalStats type | `frontend/src/services/dashboardApi.ts` | Interface `{ total: number; approved: number; pending: number; rejected: number }` |
| Dashboard tokens | `frontend/src/tokens-dashboard.ts` | `approvalApproved` (dataSea0), `approvalPending` (dataSea2), `approvalRejected` (dataSea3), `approvalBarTrack`, `pendingZeroBg`, `pendingZeroColor`, `pendingActiveBg`, `pendingActiveColor`, `dataSea0/1/2/3` |
| Base tokens | `frontend/src/tokens.ts` | `textPrimary` (#0c2438), `textSecondary` (#566a7c), `textTertiary` (#93a3b3), `fontSizeMd` (13), `fontSizeDisplay` (28), `fontMono`, `radiusPill` (999), `surfaceCard`, `borderDefault`, `shadowMd`, `radiusXl` (18) |
| H-Bar option (gap) | `frontend/src/pages/Home.tsx` | `hBarOption: EChartsOption` — defined với 3 series (Đã duyệt/Chờ duyệt/Từ chối) từ `dashboardData.hBarApproval`, grid left 100, bottom 40. **Chưa được render trong JSX** |

## Quy tắc giao diện

### ApprovalCard (Block 1 & 2)

| Thuộc tính | Giá trị |
|---|---|
| Container | `CARD_BASE`: background `surfaceCard` (#FFFFFF), borderRadius `radiusXl` (18px), padding '16px 20px', border `1px solid borderDefault`, boxShadow `shadowMd` |
| Label | fontSizeMd (13px), color textSecondary, marginBottom 4 |
| Total number | fontSizeDisplay (28px), fontFamily fontMono, color textPrimary, fontWeight 600, lineHeight 1.2 |
| Total suffix "đã xử lý" | fontSizeMd (13px), fontWeight 400, color textSecondary |
| Stacked bar | height 8px, borderRadius 4, background approvalBarTrack, display flex, overflow hidden, marginTop 16. Segments: approvalApproved (dataSea0 #123a63), approvalPending (dataSea2 #4f9bd8), approvalRejected (dataSea3 #9ecdf0), mỗi segment có `transition: 'width 0.4s'` |
| Legend | display flex, gap 16, marginTop 6, fontSizeMd, color textSecondary. Color square: 8×8, borderRadius 2, marginRight 4, verticalAlign middle |
| Pending pill | marginTop 6, display inline-block, borderRadius radiusPill, padding '2px 10px', fontSizeMd, fontWeight 500. Zero state: bg pendingZeroBg (dataSea3), color pendingZeroColor (dataSea1), "✓ 0 chờ". Active state: bg pendingActiveBg (rgba(79,155,216,0.12)), color pendingActiveColor (dataSea0), "⏳ {n} chờ" |

### Bảng khai thác (Block 3)

| Thuộc tính | Giá trị |
|---|---|
| Card wrapper | `CARD_BASE`, height '100%' |
| Chart title | `CHART_TITLE_STYLE`: fontSizeLg (15px), fontWeight 600, color textPrimary, margin 0, marginBottom 8. Text: "Bảng chi tiết thông số kỹ thuật Kết cấu hạ tầng". Kèm Tag "Dữ liệu mẫu" nếu `blockStates.infraTable?.isMockFallback === true` |
| Bảng | Ant Design `<Table size="small" pagination={false} scroll={{ x: 620, y: 340 }} />` |
| Cột 1 (Loại KCHT) | width 150, title rỗng, render text thường |
| Cột 2 (Tổng số lượng) | width 90, align center, render `<span style={{ fontWeight: 600, fontFamily: fontMono, color: textPrimary }}>{v}</span>` |
| Cột 3 (Chưa khai thác/vận hành) | width 110, align center. pillBadge(v, sea0, \`${sea0}18\`, surface) — text sea0, bg sea0 alpha 18% |
| Cột 4 (Đang khai thác/vận hành) | width 110, align center. pillBadge(v, surface, sea0, surface) — text surface (#FFF), bg sea0 |
| Cột 5 (Dừng khai thác/vận hành) | width 110, align center. pillBadge(v, sea0, sea3, surface) — text sea0, bg sea3 |
| Cột 6 (Hành động) | width 40, align center. `<EyeOutlined style={{ color: textSecondary, cursor: 'pointer' }} />`. Click → điều hướng đến màn hình chi tiết tương ứng với từng loại KCHT |
| **Màu sắc** | Cả 3 cột trạng thái dùng **sea-blue palette** — KHÔNG dùng green/yellow/red semantic |

### Layout vị trí

| Block | Vị trí | Container | Ghi chú |
|---|---|---|---|
| Block 1 & 2 (ApprovalCards) | **Row 0 — KPI row** | `display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16; marginBottom: 16` | ApprovalCard là card thứ 4 (Phê duyệt tài sản) và thứ 5 (Phê duyệt KCHT) trong 6 card (sau KPI card 1-3, trước HeroCard) |
| Block 3 (Infra Table) | **Row 2 — Map + Table row** | `<Row gutter={[16, 16]} style={{ marginBottom: 16, alignItems: 'stretch' }}>` → `<Col xs={24} md={12}>` (phải) | Bảng nằm Col bên phải Map; Map ở Col trái |

## Xử lý trạng thái

| Trạng thái | Xử lý | Block áp dụng |
|---|---|---|
| **Loading** | API call `fetchAssetApprovalStats` / `fetchKchtApprovalStats` không có loading state riêng — chạy song song với `fetchWithFallback`. Khi chưa có dữ liệu, sử dụng **default state** (assetStats: { total: 466, approved: 448, pending: 0, rejected: 18 }; kchtStats: { total: 4176, approved: 4149, pending: 0, rejected: 27 }) | Block 1, 2 |
| **Empty** | API trả về `{ total: 0, approved: 0, pending: 0, rejected: 0 }` → bar segments không hiển thị (width 0% vì pct = 0), legend chỉ hiển thị nếu count > 0, pending pill hiển thị "✓ 0 chờ" | Block 1, 2 |
| **Error** | try/catch trong `fetchAssetApprovalStats()` và `fetchKchtApprovalStats()` không có .catch riêng — nếu API throw, promise không được handle → state giữ nguyên giá trị default | Block 1, 2 |
| **Mock fallback (bảng)** | Bảng INFRA_DATA hardcode luôn hiển thị — không có mock fallback tag mặc định. Home.tsx kiểm tra `blockStates.infraTable?.isMockFallback` để hiển thị Tag "Dữ liệu mẫu" nếu có | Block 3 |
| **H-Bar gap** | `hBarOption` đã defined nhưng chưa được mount vào JSX → không hiển thị gì | Block 4 (gap) |

## Dependencies

- **F-280 (FilterBar)**: FilterContext cung cấp `year`; khi year thay đổi → `useEffect([year])` khởi động lại approval APIs (dù không phụ thuộc year)
- **F-281 (KPI Cards)**: ApprovalCards chia sẻ cùng grid KPI row với MiniKpiCard và HeroCard trong Home.tsx
- **`tokens-dashboard.ts`**: approvalApproved, approvalPending, approvalRejected, approvalBarTrack, pendingZeroBg, pendingZeroColor, pendingActiveBg, pendingActiveColor, dataSea0, dataSea1, dataSea2, dataSea3
- **`tokens.ts`**: textPrimary, textSecondary, textTertiary, fontSizeMd, fontSizeDisplay, fontMono, radiusPill, surfaceCard, borderDefault, shadowMd, radiusXl
- **`dashboardApi.ts`**: fetchAssetApprovalStats() → `GET /v1/dashboard/approval-asset`, fetchKchtApprovalStats() → `GET /v1/dashboard/approval-kcht`
- **H-Bar chart (gap)**: `hBarOption` (EChartsOption) đã defined với 3 series từ `dashboardData.hBarApproval` nhưng cần được mount vào JSX để hiển thị biểu đồ phê duyệt theo hạng mục
