---
id: F-292
name: Tái cấu trúc menu & điều hướng (mô hình v2 — dashboard-first 6 khối)
slug: tai-cau-truc-menu-navigation
module-id: M-024
status: implemented
classification: local
priority: medium
created: 2026-08-25T09:37:14Z
last-updated: 2026-09-04
locked-fields: []
consumed_by_modules: []
source-paths:
  - frontend/src/config/navigation.tsx
  - frontend/src/components/AppLayout.tsx
  - frontend/src/pages/HomeLanding.tsx
  - frontend/src/App.tsx
  - frontend/src/components/AppLayout.test.tsx
  - frontend/e2e/integration/menu-permissions.spec.ts
---

# Đặc tả nghiệp vụ: Tái cấu trúc menu & điều hướng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-292
**Module:** M-024 — Tái cấu trúc Menu & Navigation
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước — mô hình v2 dashboard-first 6 khối, BR-024-xx, AC-024 mới) + `preview-menu-final.html` + `frontend/src/config/navigation.tsx` (nguồn sự thật code)

> **Ghi chú lịch sử:** bản trước mô tả mô hình cũ (sidebar 7 nhóm I–VII theo `HH_Menu_21-08-2026.xlsx`, nhóm III PHÊ DUYỆT, nhánh 13 thực thể) — đã được thay thế theo quyết định chốt 2026-09-04 (xem lean-spec mục 3).

---

## 1. Mô tả ngắn

Chức năng tái cấu trúc toàn bộ điều hướng hệ thống theo mô hình **dashboard-first**: trang chủ `/` là landing **6 khối chức năng** (Quản lý KCHT hàng hải / Quản lý tài sản KCHT / Quản lý quy hoạch & vận hành / GIS / Báo cáo thống kê / Quản trị hệ thống) làm cổng vào duy nhất. Sidebar không còn liệt kê nhóm cấp 1: khi user vào sâu một khối, sidebar hiện **cây menu của khối đó** (khối KCHT = cây 28 loại theo ma trận cha–con) kèm nút "Về trang chủ". Mọi màn điều hướng được quy tụ về **một nguồn cấu hình duy nhất** `frontend/src/config/navigation.tsx`. Người dùng: mọi tài khoản đã đăng nhập (menu lọc theo phân quyền `<resource>:<action>`).

## 2. Trường dữ liệu

Không áp dụng — chức năng điều hướng không có trường nhập liệu nghiệp vụ. "Dữ liệu" của chức năng là **cấu hình menu** (node: `key`, `route`, `label`, `icon`, `disabled`, `children`) khai báo tĩnh trong `navigation.tsx` — xem mục 6/7 (đề xuất, SA chốt).

| # | Trường | Bắt buộc | Kiểu–ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | `key` | Có | string — duy nhất trong cây; lá có route bắt đầu `/` | `selectedKey` AntD |
| 2 | `route` | Có (node có màn) | string — route tồn tại trong `App.tsx` | Không trỏ route chết (VAL-024-05) |
| 3 | `label` | Có | string — tiếng Việt có dấu | Hiển thị menu/breadcrumb |
| 4 | `disabled` | Không | boolean | Mờ + không navigate (BR-024-04) |
| 5 | `children` | Không | NavNode[] — tối đa cấp 4 | Cây cha–con theo ma trận |

## 3. Trạng thái và phê duyệt

Không áp dụng — chức năng không có bước phê duyệt. Lưu ý thiết kế: nhóm "PHÊ DUYỆT" tách riêng trong menu cũ **đã bị giải thể** (quyết định chốt 2026-09-04): việc duyệt C1/C2 nằm ngay trong từng màn nghiệp vụ qua StatusTabs 6 trạng thái, không tạo thêm màn tổng hợp "Duyệt…".

## 4. Quy tắc và phân quyền riêng

Menu v2 **không phát sinh quyền mới**: mỗi node lá dùng đúng quyền `<resource>:<read>` của màn tương ứng qua `MENU_PERMISSION_MAP` (`AppLayout.tsx`) — node nào thiếu quyền thì ẩn (BR-024-05); node chưa có màn (VHF) hiển thị mờ `disabled`.

| Vai trò / thao tác | Xem landing 6 khối | Mở khối | Duyệt cây | Về trang chủ |
|---|---|---|---|---|
| User có ≥ 1 quyền nhóm | ✅ | ✅ (khối có quyền) | ✅ (node có quyền) | ✅ |
| `ROLE_SYSTEM_ADMIN` / `admin:all` / `*` | ✅ toàn bộ | ✅ toàn bộ | ✅ toàn bộ | ✅ |
| **Admin Cục** | ✅ | ✅ toàn bộ nhóm nghiệp vụ | ✅ | ✅ |

Quy tắc riêng (chưa có trong tài liệu nền):
- **Bảo toàn route** (BR-024-10): mọi route từng hiển thị trong menu cũ phải có mặt trong cây mới — ví dụ giữ cả `/ship-repair-yard` và `/ship-repair-facility`, giữ biến thể `/navigation-channel-chk` (CHK). Nghiêm cấm làm mất lối vào của user khi tái cấu trúc.
- **Cây = cấu trúc hiển thị** (BR-024-08): không kéo data scope orgUnit vào menu; entity/màn nghiệp vụ vẫn tuân Data Scope Convention của chính module đó.

## 5. Điểm khác biệt so với mẫu chung

| # | Điểm | Khác biệt so với mẫu chung |
|---|---|---|
| 1 | Màn hình danh sách | Không có màn list CRUD mới — chỉ tái cấu trúc điều hướng |
| 2 | Popup/Modal | Không phát sinh |
| 3 | Lọc cha–con / theo đơn vị | Không áp dụng — cây menu là cấu trúc hiển thị, không phải data scope |
| 4 | Luồng phê duyệt | Nhóm PHÊ DUYỆT cũ đã giải thể; duyệt nằm trong từng màn qua StatusTabs |
| 5 | Trạng thái hiển thị | Giữ nguyên chuẩn 6 tab trạng thái của màn list thuộc module khác |
| 6 | Quyền & phân cấp | Dùng lại quyền `<resource>:<read>` đã có; không phát sinh quyền mới |
| 7 | Tìm kiếm menu | Ô tìm kiếm sidebar lọc trong cây của khối đang active (client-side, có trim) — không còn "input chết" |
| 8 | Giao diện (theme) | Khác mẫu chung: sidebar không liệt kê nhóm, theo khối active (dashboard-first); mọi màu/spacing/font vẫn lấy từ `theme.ts`/`tokens.ts`, không hardcode |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ SA chốt)

Không có API/endpoint mới — menu là cấu hình client-side; điều hướng bằng route nội bộ.

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| — | `/` | Landing 6 khối (`HomeLanding`) — nội bộ `navigate(group.homeRoute)` | — |
| — | `/dashboard` | Dashboard KPI cũ (Home) dời từ `/` sang | `report:read` (màn list báo cáo) |
| GET (render) | `/port`, `/berth`, … (route có sẵn) | Node lá điều hướng tới màn có sẵn | theo quyền từng màn |

Nguồn dữ liệu: `frontend/src/config/navigation.tsx` (NAV_GROUPS + helpers `groupOfPath`/`locateRoute`/`accessibleTree`/`firstAccessibleRoute`) — **nguồn duy nhất**, `AppLayout.tsx` và `HomeLanding.tsx` chỉ tiêu thụ config này.

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ SA chốt)

**Không có bảng CSDL mới, không migration** — chức năng không tạo/sửa dữ liệu nghiệp vụ (lean-spec mục 9: không phát sinh `orgUnitId`/`@Filter`/`@DataScope`).

Cấu trúc cấu hình (trong code, thay cho bảng):

```
NAV_GROUPS: { id, label, desc, icon, tree: NavNode[] }[]
NavNode: { key, route?, label, icon?, disabled?, note?, children? }
```

Nếu SA chốt chuyển menu sang **động** (phương án thay thế trong tương lai): bảng `menu_item` (`id` UUID PK, `parent_id` FK tự tham chiếu, `label`, `route_key`, `permission_code`, `sort_order`, `level` ≤ 4, `active`) — đề xuất BA, SA chốt; **không áp dụng** khi giữ menu tĩnh theo config (hiện tại).
