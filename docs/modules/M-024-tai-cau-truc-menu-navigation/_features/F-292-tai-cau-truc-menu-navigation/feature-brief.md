---
id: F-292
name: "Tái cấu trúc menu & điều hướng"
slug: tai-cau-truc-menu-navigation
module-id: M-024
status: proposed
classification: local
priority: medium
created: "2026-08-25T09:37:14Z"
last-updated: "2026-08-25T09:37:14Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Tái cấu trúc menu & điều hướng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-292
**Module:** M-024 — Tái cấu trúc Menu & Navigation
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước — Use Cases UC-024-xx, Business Rules BR-024-xx, Domain Model 7 nhóm + 13 thực thể + Dashboard 6 khối) + `HH_Menu_21-08-2026.xlsx` + `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`

> **Trước khi viết:** tài liệu nền của module (M-024 lean spec) đã định nghĩa phần CHUNG — file này CHỈ ghi phần RIÊNG của chức năng, không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Khai báo đầy đủ tại mục 5 dòng 3: chức năng này **không quản lý dữ liệu nghiệp vụ** → không có trường đơn vị, không có chiều ghi, không có ngoại lệ data scope (chi tiết xem lean spec BR-024-11).

---

## 1. Mô tả ngắn

Tái cấu trúc toàn bộ menu & điều hướng hệ thống: (1) trang chủ hiển thị **Dashboard Grid đúng 6 khối** làm cổng vào các nhóm chức năng; (2) sidebar chuyển sang **mô hình phân cấp (PMS Model)** với đúng 7 nhóm cấp 1, trong đó nhánh "Quản lý cảng biển" hiển thị đúng **13 thực thể KCHT** theo ma trận cha–con (Cảng biển → Bến cảng → Cầu cảng; Luồng hàng hải → Bến phao / Đèn biển / Đê kè / Nhà trạm → Phao tiêu; Cảng biển → Khu neo đậu / Khu chuyển tải / Khu tránh trú bão / CS sửa chữa đóng tàu). Chức năng dùng bởi mọi người dùng đã đăng nhập; quyền truy cập từng mục theo phân quyền động (nhóm/tài khoản) hiện có. Không tạo entity mới, không đổi schema; phạm vi thay đổi giới hạn trong 4 edit-target files theo triage.

## 2. Trường dữ liệu

> Chức năng này **không có form nhập liệu** (không tạo/sửa bản ghi). Dữ liệu chức năng là **cấu trúc menu cấu hình tĩnh** trong `AppLayout.tsx` (`rawMenuItems` dòng 222) + bảng quyền `MENU_PERMISSION_MAP` dòng 44 — không lưu database. Bảng dưới mô tả các trường cấu hình của một node menu (không phải form):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | `key` | Có | Text — tiếng Anh chuẩn, duy nhất trong cùng cấp; item lá bắt đầu bằng `/` (route) | VAL-024-01 |
| 2 | `label` | Có | Text — tiếng Việt có dấu, không rỗng | VAL-024-02; BR-024-10 |
| 3 | `parentKey` | Có (với item con) | Text — key của node cha; xác lập phân cấp theo ma trận cha–con | BR-024-03 |
| 4 | `route` (item lá) | Có nếu có màn hình | Path tiếng Anh chuẩn, tồn tại trong router | BR-024-08; VAL-024-05 |
| 5 | `permission` | Có nếu có phân quyền | `<resource>:<action>` có trong `MENU_PERMISSION_MAP`; nếu chưa có quyền → item disabled "Chưa triển khai" | BR-024-04; D-1 |
| 6 | `icon` | Không | Icon từ `@ant-design/icons` | — |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** — menu/điều hướng không phải dữ liệu nghiệp vụ có workflow phê duyệt C1/C2 (phê duyệt chỉ áp dụng cho dữ liệu KCHT trong các module nghiệp vụ).
- Trạng thái duy nhất của chức năng là trạng thái **hiển thị** của item menu, quyết định động theo quyền user: `hiển thị` (có quyền + có route), `ẩn` (thiếu quyền hoặc submenu hết con), `disabled – Chưa triển khai` (item thuộc target menu nhưng chưa có màn hình — BR-024-08). Không lưu trạng thái số xuống database.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung ở `ba/00-lean-spec.md` BR-024-xx).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-292-01 | Menu giữ đúng 7 nhóm cấp 1 theo `HH_Menu_21-08-2026.xlsx`; không tự đặt tên/đổi tên nhóm | Hierarchy |
| BR-292-02 | Nhánh "Quản lý cảng biển" hiển thị đủ 13 thực thể KCHT, phân cấp theo chuỗi cha–con ma trận (không phẳng) | Hierarchy |
| BR-292-03 | Mỗi item lá chỉ navigate khi có route thật; item chưa có màn hình hiển thị disabled + tooltip tiếng Việt "Chưa triển khai" — cấm navigate route giả | Navigation |
| BR-292-04 | Item chỉ hiển thị khi user có quyền tương ứng (`canAccessMenu` + `MENU_PERMISSION_MAP`, `AppLayout.tsx` dòng 44–97); submenu không còn con → ẩn cả nhánh (`filterEmptyChildren`) | Permission |
| BR-292-05 | Mọi permission mới (nếu có) phải seed qua `seedPermission` trong `run()` (`PermissionSeeder.java` dòng 41/726) — quyền động, không gán role | Permission |
| BR-292-06 | Định danh kỹ thuật tiếng Anh, label tiếng Việt có dấu, không hardcode màu/spacing/font-size (theo `theme.ts`/`tokens.ts`) | Naming/UI |

### 4.2. Acceptance Criteria kế thừa

- **AC-024-01** — Dashboard 6 khối: trang chủ render đúng 6 khối, mỗi khối có label tiếng Việt và điều hướng được.
- **AC-024-02** — Sidebar nhánh "Quản lý cảng biển" hiển thị đúng 13 thực thể theo ma trận cha–con (đếm node = 13, quan hệ cha–con đúng chuỗi).
- **AC-024-03** — Đúng 7 nhóm cấp 1 theo tên xlsx (I–VII).
- **AC-024-04** — User thiếu quyền → item ẩn; submenu hết con → ẩn nhánh.
- **AC-024-05** — User có `admin:all`/`*` → thấy toàn bộ menu.
- **AC-024-06** — Click item lá có route → navigate đúng; `selectedKey`/`openKeys` đồng bộ đúng nhánh.
- **AC-024-07** — Item chưa có màn hình → disabled + tooltip, không navigate route giả.
- **AC-024-09** — `cd frontend && npx tsc --noEmit` pass; `mvn compile -DskipTests` pass.
  Khi lỗi: item không hiển thị/vô quyền truy cập → kiểm tra lại `MENU_PERMISSION_MAP` + `hasPermissionFromList` (bypass chỉ qua `admin:all`/`*`/`resource:manage`, không phải `admin:manage`).

### 4.3. User Stories kế thừa

- **US-024-01:** Là người dùng đã đăng nhập, tôi muốn thấy 6 khối chức năng trên trang chủ để vào nhanh nhóm nghiệp vụ của mình.
- **US-024-02:** Là người dùng có quyền quản lý KCHT, tôi muốn sidebar phân cấp 13 thực thể theo quan hệ cha–con để định vị nhanh màn hình (Cảng biển → Bến cảng → Cầu cảng; Luồng hàng hải → Bến phao/Nhà trạm/Đèn biển/Đê kè...).
- **US-024-03:** Là người dùng không có quyền, tôi muốn menu không hiển thị các chức năng tôi không được dùng.
- **US-024-04:** Là quản trị viên (`admin:all`), tôi muốn thấy toàn bộ menu để quản trị hệ thống.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem/điều hướng nhóm I — QUẢN LÝ KCHT HÀNG HẢI | `port:read`, `berth:read`, `pier:read`, `navigationchannel:read`, `dikerevetment:read`, `shiprepair:read`, `buoy:read`, `vts:read`, `radarstation:read`, `coastalstation:read`, `specialstation:read`, `dryport:read`, `data:read` (Đèn biển, Nhà trạm phao/tiêu) |
| Xem/điều hướng nhóm II — QUẢN LÝ TÀI SẢN KCHT HÀNG HẢI | `asset:exploitation`, `asset:inventory`, `data:read` (mục khác ẩn/disabled tới khi module tài sản chốt quyền) |
| Xem/điều hướng nhóm III — PHÊ DUYỆT | `<resource>:approve` / `approvec1` / `approvec2` (theo từng loại KCHT) |
| Xem/điều hướng nhóm IV — BÁO CÁO THỐNG KÊ | `report:read` |
| Xem/điều hướng nhóm V — QUẢN LÝ NGƯỜI DÙNG | `user:read`, `orgunit:read`, `group:read`, `admin:view` (Quản lý log truy cập) |
| Xem/điều hướng nhóm VI — QUY HOẠCH & VẬN HÀNH | `document:read` (Văn bản pháp lý), `map:manage` (Biểu tượng bản đồ), `data:read` (danh mục GIS) |
| Xem/điều hướng nhóm VII — TÍCH HỢP | `connection:read` |
| Xem item tiện ích `Cấu hình hệ thống` | `admin:manage` |
| Xem `Trang chủ` | Không cần quyền (mọi user đã đăng nhập) |

**Admin Cục:** không cần quyền menu riêng — Admin Cục nhận full quyền theo tài liệu nền mục 3.8 (qua `orgunit:scope_all`/`admin:all` khi được gán), menu hiển thị theo quyền đã gán; menu không hiển thị metadata người tạo/người sửa (không phải màn dữ liệu) nên không phát sinh quyền xem thông tin nhạy cảm riêng.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có — menu không có trạng thái nghiệp vụ; chỉ có trạng thái hiển thị động theo quyền (hiển thị / ẩn / disabled "Chưa triển khai"), không lưu DB |
| 2 | Có bước phê duyệt không | Không — menu/điều hướng không thuộc luồng phê duyệt C1/C2 của dữ liệu KCHT |
| 3 | Lọc cha-con / theo đơn vị | Không — chức năng không quản lý dữ liệu nghiệp vụ nên không có trường đơn vị, không có chiều ghi, không có ngoại lệ data scope; phân cấp menu theo ma trận cha–con KCHT là cấu trúc hiển thị, không phải lọc theo orgUnit (xem lean spec BR-024-11) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — item menu chỉ hiển thị khi user có quyền tương ứng (BR-292-04); item chưa có màn hình hiển thị disabled "Chưa triển khai" (BR-292-03) |
| 5 | Quyền riêng | Không phát sinh permission mới (đề xuất — D-4): dùng lại `resource:read` hiện có trong `PermissionSeeder`; nếu SA chốt thêm `menu:view` thì seed qua `seedPermission` trong `run()` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — Dashboard Grid 6 khối (trang chủ) + Sidebar phân cấp PMS Model (7 nhóm, nhánh 13 thực thể); UI tuân thủ `theme.ts`/`tokens.ts`, không hardcode màu/spacing/font-size |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

> Không có endpoint mới — menu được cấu hình tĩnh ở frontend và gating bằng quyền hiện có (nguồn quyền: JWT `permissions` qua `authStore.ts` `parseJwt` → `permissionStore.ts`). Bảng dưới là đề xuất phương án; SA quyết định giữ tĩnh hay chuyển động.

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| — (không gọi API) | — | Menu tĩnh trong `AppLayout.tsx` (`rawMenuItems` dòng 222) + `MENU_PERMISSION_MAP` dòng 44; quyền lấy từ JWT/profile hiện có — **phương án đề xuất, không thêm endpoint** | (gating theo quyền nghiệp vụ, mục 4.4) |
| GET | `/api/menu` *(chỉ khi SA chốt menu động)* | Trả cây menu theo quyền user (thay cho cấu hình tĩnh) | `*` (authenticated) |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Không có bảng CSDL mới** — chức năng không tạo/sửa dữ liệu nghiệp vụ, không có migration (xem lean spec mục 8: không phát sinh `orgUnitId`/`@Filter`/`@DataScope`).

Nếu SA chốt chuyển menu sang **động** (phương án thay thế ở mục 6), đề xuất bảng `menu_item` (🔴 toàn bộ là trường mới): `id` (UUID, PK), `parent_id` (FK, tự tham chiếu — xác lập phân cấp), `label` (varchar, tiếng Việt có dấu), `route_key` (varchar, tiếng Anh), `permission_code` (varchar, nullable), `sort_order` (int), `level` (smallint ≤ 4), `active` (boolean) — **đề xuất BA, SA chốt; không áp dụng nếu giữ menu tĩnh**.
