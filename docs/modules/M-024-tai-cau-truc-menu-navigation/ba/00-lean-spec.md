---
feature-id: M-024
document: lean-spec
output-mode: lean
last-updated: 2026-09-04
---

# M-024 Tái cấu trúc Menu & Navigation — Lean Spec (BA)

> **⚠️ SUPERSEDED 2026-09-04 — MÔ HÌNH MỚI (dashboard-first, 6 khối) thay thế mô hình cũ.**
> Bản trước (2026-08-28) mô tả mô hình cũ **"sidebar 7 nhóm cấp 1 (I–VII) theo `HH_Menu_21-08-2026.xlsx`"** với nhóm III **PHÊ DUYỆT** và nhánh **13 thực thể KCHT**. Mô hình đó đã bị bỏ theo quyết định chốt 2026-09-04 (mục 3). Nội dung mô tả 7 nhóm I–VII / nhóm PHÊ DUYỆT / 13 thực thể trong bản cũ chỉ còn giá trị **lịch sử** — không áp dụng cho code hiện tại. Code nguồn sự thật mới: `frontend/src/config/navigation.tsx`.

> **Nguồn sự thật (đọc cùng tài liệu này):**
> - `frontend/src/config/navigation.tsx` — nguồn sự thật code (MENU-MODEL v2).
> - `preview-menu-final.html` (root workspace) — bản preview mô hình mới.
> - `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` — ma trận cha–con 28 loại KCHT (3–4 lớp).
> - Quyết định chốt 2026-09-04 (memory `AM-66150ca50c005faa`); triage `docs/intel/_intake/TRI-1788457723340-50a8.json`.

---

## 1. Mô tả ngắn

Tái cấu trúc toàn bộ điều hướng theo mô hình **dashboard-first**: trang chủ `/` là **landing 6 khối chức năng** làm cổng vào duy nhất; sidebar **không còn liệt kê nhóm cấp 1** — ở landing chỉ giữ logo + ô tìm kiếm, khi user vào sâu trong một khối thì sidebar hiện **cây menu của khối đó** (kèm nút "Về trang chủ"). Khối "Quản lý KCHT hàng hải" hiển thị **cây 28 loại KCHT** theo ma trận cha–con. Dashboard KPI cũ dời sang `/dashboard` thuộc khối Báo cáo thống kê. Nhóm "PHÊ DUYỆT" tách riêng đã bị giải thể.

## 2. Hiện trạng & lý do đổi hướng

- Mô hình cũ (2026-08-28): sidebar 7 nhóm I–VII theo xlsx + Dashboard Grid 6 khối + nhánh "Quản lý cảng biển" 13 thực thể. Module ghi nhận closed/released nhưng **code sau đó đã vượt docs**: thêm route/quyền/menu cho Bến phao, Khu neo đậu, Khu chuyển tải, Khu tránh trú bão (`/buoy-berth`, `/anchorage`, `/transfer-area`, `/storm-shelter`); `Home.tsx` hiện là dashboard KPI chứ không phải grid 6 khối — docs–code lệch nhau.
- Code cũ chia cắt cây 28 loại KCHT ra nhiều nhóm menu khác nhau ("Quản lý KCHT Hàng Hải", "Khu nước & VTS", "Báo hiệu hàng hải", "Đài duyên hải & Vệ tinh") trong khi ma trận cha–con yêu cầu một cây phân cấp duy nhất → bug điều hướng lộ ra.
- Quyết định 2026-09-04: chuyển sang mô hình mới (dashboard-first 6 khối) theo `preview-menu-final.html`.

## 3. Mô hình mới (đã chốt)

### 3.1 Sáu khối chức năng (cấp 1)

| # | Khối | Mô tả | Nguồn cũ |
|---|---|---|---|
| 1 | **Quản lý KCHT hàng hải** | Cây 28 loại KCHT cha–con | Nhóm cảng biển + khu nước & VTS + báo hiệu + đài (gộp) |
| 2 | **Quản lý tài sản KCHT hàng hải** | Tăng, giảm, kiểm kê, khai thác tài sản | Nhóm Biến động tài sản (trước ẩn) |
| 3 | **Quản lý quy hoạch & vận hành** | Quy hoạch bến cảng, sự cố, văn bản pháp lý | Nhóm Văn bản & Sự cố |
| 4 | **Quản lý KCHT trên nền bản đồ (GIS)** | Danh mục điểm/đường/vùng, lớp, biểu tượng | Nhóm GIS |
| 5 | **Báo cáo thống kê** | Dashboard KPI (`/dashboard`) + tất cả báo cáo | Nhóm Báo cáo (trước ẩn) |
| 6 | **Quản trị hệ thống** | Người dùng, đơn vị, nhóm, log, tích hợp, cấu hình | Nhóm Quản trị + Tích hợp (gộp) |

### 3.2 Quyết định then chốt (chốt 2026-09-04)

1. **Landing `/` = 6 khối**, sidebar biến hình theo khối active (suy từ route qua `groupOfPath`); không còn sidebar 7 nhóm (AC cũ 7 nhóm bị bỏ).
2. **Giải thể nhóm III PHÊ DUYỆT** — duyệt C1/C2 nằm trong từng màn qua StatusTabs; không còn màn "Duyệt …" tách riêng.
3. **Cây 28 loại KCHT** trong khối kcht theo ma trận cha–con; **6 đài viễn thông (Đài TTDH, VHF, Duyên hải, Inmarsat, Cospas-Sarsat, LRIT, TTXLTT) là nhánh root "Đài viễn thông hàng hải" RIÊNG**, không nằm dưới Hệ thống VTS như xlsx cũ; VHF chưa có route → node disabled.
4. **KPI cũ dời `/dashboard`** (khối report); `/` thành landing.
5. Giữ nguyên chuẩn màn hình list (6 tab trạng thái, theme/tokens, cấm hardcode màu) và cơ chế phân quyền `<resource>:<action>`; cây menu = **cấu trúc hiển thị**, không kéo data scope đơn vị.

## 4. Domain Model — cấu trúc điều hướng

- Config duy nhất `navigation.tsx`: `NAV_GROUPS` (6 khối), mỗi khối `tree` (node: key/route/label/icon/disabled/children); helpers `groupOfPath`, `locateRoute`, `accessibleTree`, `firstAccessibleRoute`.
- Node lá = route có màn; node có con + route = submenu (click tiêu đề → route); node disabled hiển thị mờ, không navigate.
- Route được **bảo toàn**: mọi route từng hiển thị trong AppLayout cũ đều có mặt trong cây mới (kể cả biến thể CHK và 2 màn Cơ sở sửa chữa `/ship-repair-yard`, `/ship-repair-facility`).

## 5. Use Cases

| ID | Use Case | Luồng chính |
|---|---|---|
| UC-024-01 | Xem landing 6 khối | User đăng nhập → `/` render 6 card (label + mô tả + icon); card không có quyền nào → disabled |
| UC-024-02 | Sidebar theo khối active | Vào sâu trong khối → sidebar hiện cây khối đó (suy từ route); nút "Về trang chủ" → `/` |
| UC-024-03 | Duyệt cây 28 loại KCHT | Khối kcht: mở/đóng nhánh, click node lá → navigate; nhánh đang mở theo route hiện tại |
| UC-024-04 | Ẩn node thiếu quyền | Node không đủ quyền → ẩn; submenu hết con khả dụng → ẩn cả nhánh; node disabled giữ mờ |
| UC-024-05 | Truy cập Dashboard KPI | `/dashboard` trong khối report |
| UC-024-06 | Deep-link | Vào thẳng `/port`, `/dai-ttdh`, … → sidebar suy đúng khối + mở đúng nhánh |

## 6. Business Rules

| ID | Quy tắc |
|---|---|
| BR-024-01 | Đúng 6 khối cấp 1 theo `NAV_GROUPS`; không tự đặt tên/đổi tên khối |
| BR-024-02 | Cây khối kcht = 28 loại KCHT theo ma trận cha–con (3–4 lớp, không phẳng) |
| BR-024-03 | "Đài viễn thông hàng hải" là nhánh root riêng (không nằm dưới Hệ thống VTS) |
| BR-024-04 | Node disabled (vd VHF) hiển thị mờ + tooltip "Chức năng đang được xây dựng", không navigate |
| BR-024-05 | Node chỉ hiển thị khi đủ quyền (`accessibleTree`); quyền khai trong `PermissionSeeder` |
| BR-024-06 | Chỉ click node lá (route) navigate; submenu cha có route navigate khi click tiêu đề |
| BR-024-07 | Key/route/resource tiếng Anh; label/message tiếng Việt có dấu; không hardcode màu/spacing — dùng theme/tokens |
| BR-024-08 | Không entity/schema mới; menu = cấu trúc hiển thị, không lọc theo đơn vị (không data scope) |
| BR-024-09 | An ninh không chỉ dựa vào ẩn menu — route trực tiếp vẫn bị backend chặn 403 |
| BR-024-10 | Bảo toàn route: không làm mất lối vào của bất kỳ màn nào đang hiển thị |
| BR-024-11 | Nhóm PHÊ DUYỆT cũ đã giải thể (không còn khối/màn "Duyệt…" tách riêng) |

## 7. Validation rules

| ID | Quy tắc |
|---|---|
| VAL-024-01 | Key duy nhất trong cây; node lá có route bắt đầu bằng `/` |
| VAL-024-02 | Label tiếng Việt có dấu, không rỗng |
| VAL-024-03 | Độ sâu tối đa 4 (khối → cấp 4 theo ma trận) |
| VAL-024-04 | Node có phân quyền → có entry quyền; node chưa triển khai → disabled |
| VAL-024-05 | Không node trỏ route không tồn tại (trừ disabled) |
| VAL-024-06 | Đúng 6 khối; không còn nhóm PHÊ DUYỆT; cây kcht đủ 28 loại theo ma trận |

## 8. Acceptance Criteria (AC-024 — mới)

| ID | Tiêu chí | Cách kiểm tra |
|---|---|---|
| AC-024-01 | `/` render đúng 6 card khối (label + mô tả + icon), click vào khối tương ứng | Mở `/`, đếm 6 card, click từng card |
| AC-024-02 | Sidebar theo khối: landing không liệt kê nhóm; trong khối hiện cây khối + nút "Về trang chủ" | Vào `/` → không có `.ant-menu`; vào `/port` → cây kcht + nút về `/` |
| AC-024-03 | Cây kcht đủ 28 loại theo ma trận cha–con | Đếm node + kiểm tra chuỗi cha–con |
| AC-024-04 | Nhánh "Đài viễn thông hàng hải" root riêng; VHF disabled không navigate | Vào `/dai-ttdh` → vị trí nhánh; hover/click VHF |
| AC-024-05 | User thiếu quyền → node ẩn; submenu hết con khả dụng → ẩn nhánh | Đăng nhập user hạn chế |
| AC-024-06 | Click node lá navigate đúng; selected/openKeys đồng bộ | Click từng node lá |
| AC-024-07 | Không còn nhóm PHÊ DUYỆT trong menu | Duyệt toàn menu |
| AC-024-08 | `/dashboard` truy cập được (Dashboard KPI) | Mở `/dashboard` |
| AC-024-09 | Deep-link `/port`, `/dai-ttdh` suy đúng khối + mở đúng nhánh | Mở thẳng URL |

## 9. Out of scope

- Không sửa màn nghiệp vụ của các module khác (danh sách/chi tiết vẫn theo chuẩn riêng của từng module).
- Không tạo entity/bảng/migration mới.
- Không thiết kế lại visual theme (giữ `theme.ts`/`tokens.ts`).
- Việc bổ sung màn cho các khối đang trống (asset/plan chưa đủ màn thật) là các module nghiệp vụ tương lai, không thuộc M-024.
