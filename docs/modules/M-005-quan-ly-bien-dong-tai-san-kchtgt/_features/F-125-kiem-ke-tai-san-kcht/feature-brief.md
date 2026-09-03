---
id: F-125
name: Kiểm kê tài sản KCHT
slug: kiem-ke-tai-san-kcht
module-id: M-005
status: proposed
classification: local
priority: medium
created: 2026-06-16T04:41:00Z
last-updated: 2026-07-21T08:00:25Z
locked-fields: []
consumed_by_modules: []
source-paths:
  - src/main/java/com/hanghai/kchtg/assetmovement/controller/KeHoachKiemKeController.java
  - src/main/java/com/hanghai/kchtg/assetmovement/service/KeHoachKiemKeService.java
  - src/test/java/com/hanghai/kchtg/assetmovement/service/KeHoachKiemKeServiceTest.java
---
# Đặc tả nghiệp vụ: Kiểm kê tài sản KCHT

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-125 — Kiểm kê tài sản KCHT
**Module:** M-005 — Quản lý biến động tài sản KCHTGT
**Loại:** chức năng thường (quản lý thông tin kiểm kê; không có cột phê duyệt trong ma trận Excel cụm #34 — xem §3)
**Tham chiếu:**
- Nguồn sự thật (ma trận trường): Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` — sheet `30->43`, cụm **#34 "QL Kiểm kê tài sản"** (khối cột 120–127, 68 dòng × 128 cột — cụm đứng sau cụm #33 'QL Sản lượng cảng biển'). Trích xuất bằng openpyxl (như M-007 verify-report) vì bản markdown bị cắt dòng ở 2000 ký tự.
- Tài liệu yêu cầu gốc (hh.csdl): URD v3.0 **III.7.55 Kiểm kê tài sản** (`docs/intel/temp_extract/20260616T031810-3cef57d6c3853955-ZOxvv1/URD_MTIS_VMD_v3.0_PHCV-00000000.txt`, ~dòng 66853 trở đi).
- Tài liệu nền module M-005: `ba/00-lean-spec.md` (chưa có `ba/01-base-pattern.md` — phần CHUNG sẽ bổ sung khi module mở lại).

> ⚠️ Các mục 6–7 là đề xuất của BA, SA chốt khi triển khai. Ô Excel không đối chiếu chắc tới từng ô → ghi rõ **UNRESOLVED**, không bịa.

---

## 1. Mô tả ngắn

- Chức năng cho phép đơn vị kiểm kê **lập và quản lý các đợt kiểm kê tài sản KCHTGT**: khai thông tin chung (Đơn vị kiểm kê, Thời gian kiểm kê, Phân loại kiểm kê — định kỳ/đột xuất, Ghi chú), kèm **Danh sách Tài sản kiểm kê** (loại tài sản, tài sản, nguyên giá, giá trị còn lại, nguyên giá/giá trị còn lại **sau kiểm kê** và **chênh lệch** tự tính) và **Danh sách Hội đồng kiểm kê** (cán bộ kiểm kê, chức vụ, chức danh trong hội đồng).
- Người dùng: chuyên viên/lãnh đạo Cục, Phòng ban trực thuộc Cục, Cảng vụ/Chi cục (theo URD III.7.55.1); phạm vi đơn vị theo phân quyền dữ liệu.
- Trên danh sách sắp xếp mặc định theo **Ngày cập nhật giảm dần**; cho phép sorting theo Ngày cập nhật / Thời gian kiểm kê (URD III.7.55.2).

## 2. Trường dữ liệu

Cờ ma trận đọc trực tiếp từ Excel cụm #34 (không suy diễn): ✓ = true, — = false. Cột "Bắt buộc" lấy theo URD III.7.55.3 (M = bắt buộc; X = hiển thị/cho phép; — = không bắt buộc). Nhóm "Tài sản kiểm kê" và "Hội đồng kiểm kê" là **2 danh sách con** (mở popup Thêm mới — URD: "Popup Thêm mới hội đồng", "Popup Thêm mới Tài sản").

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| — | *Thông tin chung* (section — Excel: DS —, Lọc —, Xem —, Tạo —, Sửa —) | — | — | — |
| 1 | Đơn vị kiểm kê | Có (M) | `SelectOrgCode` (cây đơn vị) | DS ✓, Lọc ✓, Xem —, Tạo ✓, Sửa ✓. `orgUnitId` — trường DataScope |
| 2 | Thời gian kiểm kê | Có (M) | `DatePicker` (có giờ; disabled khi sửa) | DS ✓, Lọc ✓, Xem —, Tạo ✓, Sửa ✓. `inventoryTime` (range Từ ngày–đến ngày theo URD) |
| 3 | Phân loại kiểm kê | Có (M) | `Select` (Định kỳ / Đột xuất) | DS ✓, Lọc —, Xem —, Tạo ✓, Sửa ✓. `inventoryType` |
| 4 | Ghi chú | Không (—) | `InputTextArea` | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. `note` |
| — | *Tài sản kiểm kê (Thêm mới tài sản)* — danh sách con | — | — | Excel: DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓ |
| 5 | Loại tài sản | Có (M) | `Select` | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. `assetTypeId` |
| 6 | Tài sản | Có (M) | `Select` | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. `assetId` |
| 7 | Tình trạng tài sản | Không (X) | `Select` (disabled) | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. Tự hiển thị từ tài sản |
| 8 | Nguyên giá | Không (X) | `InputMoney` (disabled) | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. `originalValue` |
| 9 | Giá trị còn lại | Không (X) | `InputMoney` (disabled) | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. `residualValue` |
| 10 | Nguyên giá sau kiểm kê | Có (M) | `InputMoney` | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. `originalValueAfter` |
| 11 | Giá trị còn lại sau kiểm kê | Có (M) | `InputMoney` | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. `residualValueAfter` |
| 12 | Nguyên giá chênh lệch | Có (hệ thống) | `Text` (hiển thị, không nhập) | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. Tự tính = nguyên giá sau − nguyên giá |
| 13 | Giá trị còn lại chênh lệch | Có (hệ thống) | `Text` (hiển thị, không nhập) | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. Tự tính = giá trị còn lại sau − giá trị còn lại |
| — | *Hội đồng kiểm kê (Thêm mới hội đồng)* — danh sách con | — | — | Excel: DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓ |
| 14 | Cán bộ kiểm kê | Có (M) | `Select` | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. `inventoryOfficerId` |
| 15 | Chức vụ | Có (M) | `Select` | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. `position` |
| 16 | Chức danh trong hội đồng | Có (M) | `Select` | DS —, Lọc —, Xem —, Tạo ✓, Sửa ✓. `committeeRole` |
| 17 | Cán bộ cập nhật | Có (hệ thống) | `Text` (hiển thị, không nhập) | DS ✓, Lọc —, Xem —, Tạo —, Sửa —. `updatedByName` |
| 18 | Ngày cập nhật | Có (hệ thống) | `DatePicker` (hiển thị, không nhập) | DS ✓, Lọc ✓, Xem —, Tạo —, Sửa —. `updatedAt` |

> ⚠️ UNRESOLVED: cột **Xem chi tiết = false toàn bộ** trong Excel cụm #34 — không có trường nào hiển thị ở "Xem chi tiết" theo ma trận. Các danh sách con (5–16) chỉ bật Tạo/Sửa. BA/SA chốt lại cấu trúc màn Xem chi tiết khi module mở lại (có thể xem qua Drawer gộp thông tin chung + 2 danh sách con như màn Sửa — KHÔNG tự bịa).

## 3. Trạng thái và phê duyệt

- **Không có cột Trạng thái và không có cột phê duyệt nào trong ma trận Excel cụm #34** (68 dòng × 128 cột — đã đối chiếu tới ô cuối cùng của cụm). Chức năng theo Excel là quản lý **thông tin kiểm kê** (tìm kiếm/xem chi tiết/thêm/sửa/xóa — URD III.7.55.1), không có luồng phê duyệt riêng trên bản ghi kiểm kê.
- **UNRESOLVED:** nếu nghiệp vụ yêu cầu kế hoạch kiểm kê phải phê duyệt (như luồng 2 cấp M-1006 / F-127 của M-005), cần BA/SA chốt bổ sung cột Trạng thái + luồng duyệt khi module M-005 được mở lại — brief này không tự thêm trường không có trong Excel.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc RIÊNG của chức năng; phần CHUNG (DataScope, cache tên đơn vị, đa ngôn ngữ) theo AGENTS.md và tài liệu nền module.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-125-01 | Kế hoạch kiểm kê phải xác định Đơn vị kiểm kê + Thời gian kiểm kê + Phân loại kiểm kê (bắt buộc) | Create |
| BR-125-02 | Thời gian kiểm kê không đổi khi sửa (disabled) | Update |
| BR-125-03 | Mỗi dòng Tài sản kiểm kê: chọn Loại tài sản + Tài sản; Nguyên giá/Giá trị còn lại hiển thị từ hồ sơ tài sản (read-only) | Create/Update |
| BR-125-04 | Nguyên giá sau kiểm kê và Giá trị còn lại sau kiểm kê bắt buộc nhập; chênh lệch (12–13) hệ thống tự tính, không nhập tay | Create/Update |
| BR-125-05 | Hội đồng kiểm kê: mỗi thành viên phải có Cán bộ kiểm kê + Chức vụ + Chức danh trong hội đồng (bắt buộc) | Create/Update |
| BR-125-06 | Mọi ô text nhập liệu phải `.trim()` trước khi gửi API | All |
| BR-125-07 | Mọi thay đổi ghi đủ kiểm toán (`operatorId`/`updatedBy`/`updatedAt`) và lịch sử tập trung | All |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-125-01** — Tạo mới: khai đủ Thông tin chung + ≥ 1 Tài sản kiểm kê + ≥ 1 thành viên Hội đồng → lưu thành công; thiếu trường bắt buộc → chặn + báo lỗi tiếng Việt.
- **AC-125-02** — Chọn Tài sản → Tình trạng/Nguyên giá/Giá trị còn lại tự điền read-only; chênh lệch tự tính đúng số học.
- **AC-125-03** — Danh sách hiển thị Đơn vị kiểm kê / Thời gian kiểm kê / Phân loại kiểm kê / Ngày cập nhật / Cán bộ cập nhật; sort theo Ngày cập nhật (mặc định), Thời gian kiểm kê.
- **AC-125-04** — Bộ lọc: Đơn vị kiểm kê (cây), Ngày cập nhật (Từ–đến), Thời gian kiểm kê (Từ–đến) (URD III.7.55.3).
- **AC-125-05** — Danh sách đủ 4 trạng thái loading/error/empty/data.

### 4.3. User Stories kế thừa (nếu có)

- **US-125-01:** Là chuyên viên quản lý tài sản, tôi lập đợt kiểm kê kèm hội đồng kiểm kê để đối chiếu nguyên giá/giá trị còn lại của tài sản với thực tế.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo/Sửa/Xóa kế hoạch kiểm kê | `inventoryplan:manage` (đề xuất; theo PermissionSeeder + controller hiện có `InventoryPlanController`) |
| Tạo/Sửa/Xóa tài sản kiểm kê | `inventoryasset:manage` (theo code hiện có `InventoryAssetController`) |
| Tạo/Sửa/Xóa báo cáo kiểm kê | `inventoryreport:manage` (theo code hiện có — UNRESOLVED nếu gộp vào brief này) |
| Xem danh sách/chi tiết | xác thực (`isAuthenticated()` — controller hiện có) |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền — full quyền + xem thêm metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — Excel cụm #34 không có cột Trạng thái (xem §3, UNRESOLVED nếu cần thêm) |
| 2 | Có bước phê duyệt không | Không theo Excel (không có cột phê duyệt trong cụm #34); nếu cần phê duyệt kế hoạch → UNRESOLVED, chờ BA/SA chốt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — `Đơn vị kiểm kê` = `orgUnitId` + DataScope |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — 2 danh sách con (Tài sản kiểm kê, Hội đồng kiểm kê) chỉ thao tác ở Tạo/Sửa qua popup "Thêm mới" |
| 5 | Quyền riêng | `inventoryplan:manage`, `inventoryasset:manage`, `inventoryreport:manage` (đề xuất) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (Excel cụm #34 không có trường Upload/File đính kèm) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

> Code hiện có của M-005 (package `com.hanghai.kchtg.assetmovement`) đặt tên khác brief cũ (`InventoryPlanController`, bảng `inventory_plans` + `inventory_assets` + `inventory_reports`) — đường dẫn dưới đây theo code hiện có, BA đề xuất; SA chốt khi module mở lại.

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/asset/inventory-plans` | Danh sách kiểm kê (phân trang + lọc DataScope/ngày) | `isAuthenticated()` |
| POST | `/api/v1/asset/inventory-plans` | Tạo mới kế hoạch kiểm kê (thông tin chung + danh sách tài sản + hội đồng) | `inventoryplan:manage` |
| GET | `/api/v1/asset/inventory-plans/{id}` | Chi tiết kế hoạch kiểm kê | `isAuthenticated()` |
| PUT | `/api/v1/asset/inventory-plans/{id}` | Sửa kế hoạch | `inventoryplan:manage` |
| DELETE | `/api/v1/asset/inventory-plans/{id}` | Xóa kế hoạch | `inventoryplan:manage` |
| POST | `/api/v1/asset/inventory-assets` | Thêm tài sản kiểm kê (danh sách con) | `inventoryasset:manage` |
| PUT/DELETE | `/api/v1/asset/inventory-assets/{id}` | Sửa/Xóa tài sản kiểm kê | `inventoryasset:manage` |
| (đề xuất) | `/api/v1/asset/inventory-plan-officers` | Danh sách Hội đồng kiểm kê (nếu tách bảng con) | `inventoryplan:manage` — UNRESOLVED |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm (so với bảng đang có trong code M-005); ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `inventory_plans`** (Kế hoạch kiểm kê — theo code hiện có, mở rộng theo Excel #34):
- `id` UUID PK; 🔴 `org_unit_id` UUID NOT NULL (Đơn vị kiểm kê — DataScope, index) · 🔴 `inventory_time` TIMESTAMP/range (Thời gian kiểm kê — disabled khi sửa) · 🔴 `inventory_type` SMALLINT/ENUM (Phân loại kiểm kê: Định kỳ/Đột xuất) · 🔴 `note` TEXT (Ghi chú)
- Audit kế thừa `BaseEntity` (`created_by/at`, `updated_by/at`, `deleted_at/by` — phục vụ Cán bộ cập nhật #17, Ngày cập nhật #18) + `@Version`; 🔴 `org_unit_name` KHÔNG lưu — hiển thị qua `OrgUnitCacheService`
- Cột enum lưu số nguyên `@Enumerated(ORDINAL)`; tên bảng/cột/field tiếng Anh, message/giao diện tiếng Việt có dấu

**Bảng `inventory_assets`** (Tài sản kiểm kê — danh sách con #5–13): `id`, `plan_id` FK, `asset_type_id`, `asset_id` FK, `asset_condition`, `original_value` DECIMAL, `residual_value` DECIMAL, 🔴 `original_value_after` DECIMAL NOT NULL (Nguyên giá sau kiểm kê), 🔴 `residual_value_after` DECIMAL NOT NULL (Giá trị còn lại sau kiểm kê), 🔴 `original_difference` DECIMAL (Nguyên giá chênh lệch — tự tính), 🔴 `residual_difference` DECIMAL (Giá trị còn lại chênh lệch — tự tính).

**Bảng `inventory_plan_officers`** (🔴 Hội đồng kiểm kê — danh sách con #14–16, nếu tách bảng; code hiện có chưa có entity riêng): `id`, `plan_id` FK, `officer_id` UUID FK (Cán bộ kiểm kê), `position` (Chức vụ), `committee_role` (Chức danh trong hội đồng).

**Lịch sử:** ghi vào bảng tập trung (`infrastructure_history`) — không tạo bảng lịch sử riêng (convention dự án).
