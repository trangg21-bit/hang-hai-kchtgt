---
id: M-028
name: "Sản lượng cảng biển"
slug: san-luong-cang-bien
module-id: M-028
status: proposed
classification: local
priority: high
created: 2026-09-06
last-updated: 2026-09-06
locked-fields: []
consumed_by_modules: []
---

# Lean Spec — Module M-028 "Sản lượng cảng biển" (SeaportThroughput)

**Phạm vi tài liệu:** Đặc tả nghiệp vụ nền (single source of truth) cho toàn bộ module M-028. Feature-brief `F-301-san-luong-cang-bien` chỉ ghi phần RIÊNG (bảng 29 trường + đường dẫn gọi dữ liệu + cấu trúc bảng đề xuất), tham chiếu tài liệu này cho phần CHUNG.
**Nguồn yêu cầu gốc (TKCT):** Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` — sheet `30->43`, cụm **#33 "QL Sản lượng cảng biển"** (SOURCE OF TRUTH cho thứ tự form STT 1–29) + URD mục **III.7.53 Quản lý sản lượng cảng biển** / **III.7.54 Phê duyệt thông tin sản lượng cảng biển** (MH Cập nhật, MH Tìm kiếm; UC #148 xem lịch sử hình thành, UC #149 phê duyệt).
**Tài liệu chung bắt buộc đọc trước:** `docs/feature-brief-template.md` (khuôn 7 mục), `docs/conventions/approval-2-level-spec.md` (phê duyệt 2 cấp C1→C2 — bản chốt M-1006 DP-9/AC-25), `docs/conventions/list-screen-ui-standard.md`, `docs/conventions/form-and-list-patterns.md`, `AGENTS.md` (Data Scope Convention, Permission Registration, Cache tên đơn vị, UI theme/tokens, mã lỗi tiếng Việt có dấu).
**Quy tắc ngôn ngữ (bắt buộc):** mọi định danh kỹ thuật (bảng, cột, biến, package, permission, enum, class) viết **tiếng Anh chuẩn**; mọi message/label/error hiển thị viết **tiếng Việt có dấu**. Không hardcode màu/spacing/font trong mô tả giao diện — dùng semantic tokens (`theme.ts`/`tokens.ts`).

## 1. Mô tả ngắn & mục tiêu

- Module cho phép chuyên viên/người dùng cảng **kê khai và quản lý sản lượng cảng biển** theo kỳ tháng: mỗi bản ghi xác định bởi **1 Đơn vị quản lý (org_unit_id) + 1 Thời gian tổng hợp sản lượng (report_month, theo tháng)**.
- Số liệu hàng hóa khai theo **8 chỉ tiêu × 3 nhóm tuyến/vận chuyển** (Hàng container/khô/lỏng/khác × đơn vị Tấn & Tấn-Km; nhóm: trong nước `domestic_*`, nước ngoài `foreign_*`, theo tuyến vận chuyển `route_*`) + chỉ tiêu **Lượt hành khách (`passenger_trips`)** + **File đính kèm** (bảng con `seaport_throughput_file`).
- Số liệu phải qua **luồng phê duyệt 2 cấp: Cảng vụ/Chi cục (cấp 1) → Cục (cấp 2, ban hành)** theo `docs/conventions/approval-2-level-spec.md`; sau ban hành số liệu trở thành **đầu vào nguồn** cho các báo cáo khối lượng hàng hóa của module Thống kê chuyên đề (legacy — ngoài phạm vi M-028).
- Người dùng: Chuyên viên Cục/Cảng vụ/Chi cục (kê khai, sửa, gửi duyệt, import), Lãnh đạo Cảng vụ/Chi cục (duyệt C1), Lãnh đạo Cục (duyệt C2/ban hành), Admin Cục.

## 2. Actors & Use Cases

| Actor | Mô tả |
|---|---|
| Chuyên viên Cục/Cảng vụ/Chi cục | Người nhập liệu: tạo/lưu tạm/sửa/xóa bản ghi trong phạm vi đơn vị, gửi phê duyệt, import Excel, quản lý file đính kèm |
| Lãnh đạo Cảng vụ/Chi cục | Duyệt cấp 1 (approve/reject) các bản ghi của đơn vị trong phạm vi |
| Lãnh đạo Cục | Duyệt cấp 2 (approve_level2/reject) — ban hành; submit thẳng được khi thuộc cấp Cục (`OrgUnit.level`) |
| Admin Cục | Full quyền + xem metadata nhạy cảm (người tạo/sửa, thời gian) |

| Use case | Mô tả | URD tham chiếu |
|---|---|---|
| UC-SLCB-01 | Tạo bản ghi mới (mặc định Lưu tạm `DRAFT`), nhập 3 nhóm chỉ tiêu + hành khách + file | MH Cập nhật |
| UC-SLCB-02 | Sửa / Xóa bản ghi chưa ban hành (chỉ xóa khi `DRAFT`; soft delete ghi `deletedBy`) | MH Cập nhật |
| UC-SLCB-03 | Gửi phê duyệt (`submit`) từ `DRAFT`/`REJECTED_*` → ghi submittedAt/submittedBy | MH Cập nhật |
| UC-SLCB-04 | Duyệt/từ chối cấp Cảng vụ/Chi cục (C1): approve → chờ Cục; reject → REJECTED_LEVEL1 kèm lý do | III.7.54 |
| UC-SLCB-05 | Duyệt/từ chối cấp Cục (C2): approve_level2 → Ban hành `APPROVED`; reject → REJECTED_LEVEL2 kèm lý do | III.7.54 |
| UC-SLCB-06 | Xem danh sách + lọc (Đơn vị cây, trạng thái, tháng, khoảng ngày cập nhật); sort Ngày cập nhật giảm dần | MH Tìm kiếm |
| UC-SLCB-07 | Xem chi tiết (3 nhóm chỉ tiêu + hành khách + file) + Lịch sử hình thành & phê duyệt | UC #148/#149 |
| UC-SLCB-08 | Cập nhật số liệu hàng loạt từ file Excel (import) | MH Tìm kiếm – File upload |
| UC-SLCB-09 | Upload / xóa file đính kèm của bản ghi (chưa ban hành) | UC #148 |

## 3. Domain Model

### 3.1. Entity `SeaportThroughput` (bảng `seaport_throughput`)

1 bản ghi = 1 đơn vị × 1 tháng (unique `(org_unit_id, report_month)`). Nhóm cột:

| Nhóm | Cột | Kiểu / ràng buộc |
|---|---|---|
| Định danh + phạm vi | `id` (UUID PK), `org_unit_id` (UUID NOT NULL — DataScope; **không lưu `org_unit_name`**, hiển thị qua `OrgUnitCacheService`) | PK / index |
| Kỳ kê khai | `report_month` (DATE — chỉ lưu tháng, hiển thị MM/YYYY; bắt buộc) | unique cùng `org_unit_id` |
| Ghi chú | `note` | TEXT (không bắt buộc, trim) |
| Nhóm trong nước | `domestic_container_ton`, `domestic_container_ton_km`, `domestic_dry_ton`, `domestic_dry_ton_km`, `domestic_liquid_ton`, `domestic_liquid_ton_km`, `domestic_other_ton`, `domestic_other_ton_km` | DECIMAL ≥ 0, mặc định 0 |
| Nhóm nước ngoài | `foreign_*` (8 cột cùng cấu trúc) | DECIMAL ≥ 0, mặc định 0 |
| Nhóm theo tuyến | `route_*` (8 cột cùng cấu trúc) | DECIMAL ≥ 0, mặc định 0 |
| Hành khách | `passenger_trips` | BIGINT/DECIMAL ≥ 0 |
| Phê duyệt | `approval_status` (INT/ENUM ORDINAL — §4), `submitted_at`, `submitted_by`, `approved_l1_at`, `approved_l1_by`, `approved_l1_note`, `approved_l2_at` (= ban hành), `approved_l2_by`, `approved_l2_note`, `rejected_at`, `rejected_by`, `rejection_reason` | theo approval-2-level-spec §3 |
| Kiểm toán | kế thừa `BaseEntity`/`BaseApprovableEntity`: `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_at`… | không tạo lại |

> Ghi chú phương án chuẩn hóa (SA chốt khi scaffold): **24 cột cố định + `passenger_trips`** (khớp 1:1 Excel #33/URD III.7.53) so với bảng con `throughput_detail` (`route_type` ENUM DOMESTIC/FOREIGN/ROUTE, `cargo_type` ENUM CONTAINER/DRY/LIQUID/OTHER, `ton`, `ton_km`) dễ mở rộng tuyến. BA đề xuất 24 cột — xem §11.

### 3.2. Entity `SeaportThroughputFile` (bảng `seaport_throughput_file`)

| Cột | Kiểu / ràng buộc |
|---|---|
| `id` | UUID PK |
| `throughput_id` | UUID FK → `seaport_throughput.id` (NOT NULL; cascade xóa theo bản ghi cha; orphanRemoval) |
| `file_name` | TEXT (bắt buộc) |
| `file_path` / blob ref | TEXT (lưu tham chiếu file — theo cơ chế upload hiện có của dự án) |
| `created_by`, `created_at` | kiểm toán |

Quan hệ: `SeaportThroughput` 1 — N `SeaportThroughputFile`. Không tạo bảng lịch sử riêng: lịch sử hình thành + phê duyệt ghi vào bảng tập trung `infrastructure_history` / approval-history (convention dự án); mỗi bước phê duyệt cũng lưu metadata trực tiếp trên entity theo approval-2-level-spec §3.

### 3.3. Quy ước code

- Entity/DTO khai `@FieldNameConstants` (Lombok); dùng hằng số sinh tự động, **không hardcode tên cột/trường chuỗi**.
- Enum trạng thái lưu **INT, `@Enumerated(EnumType.ORDINAL)`** — không lưu VARCHAR.
- Tái sử dụng `ApprovalHistoryUtils.recordSoftDelete(...)`, `EntityUpdateUtils.copyPropertiesIfPresent(...)`.

## 4. Trạng thái và phê duyệt (2 cấp — phần CHUNG)

**Theo `docs/conventions/approval-2-level-spec.md` (bản chốt M-1006 DP-9/AC-25).** Tập đóng 7 trạng thái, lưu INT (ORDINAL):

| # | Trạng thái nghiệp vụ | `ApprovalStatus` (ordinal) | Ghi chú |
|---|---|---|---|
| 1 | Lưu tạm | `DRAFT` (0) | Mặc định khi tạo; sửa/xóa được |
| 2 | Chờ Cảng vụ/Chi cục duyệt (vòng 1) | `PENDING_APPROVAL` (2) | Đã submit, chờ C1 |
| 3 | Chờ Cục duyệt (vòng 2) | `APPROVED_LEVEL1` (3) | C1 đã duyệt xong; cũng là đích khi người gửi cấp Cục submit thẳng (`OrgUnit.level`) |
| 4 | Bị Cảng vụ/Chi cục trả về | `REJECTED_LEVEL1` (8) | C1 từ chối (kèm lý do) |
| 5 | Bị Cục trả về | `REJECTED_LEVEL2` (9) | C2 từ chối (kèm lý do) |
| 6 | Ban hành (= Đã duyệt) | `APPROVED` (5) | C2 duyệt xong — số liệu chính thức, khóa sửa dữ liệu kê khai |
| 7 | Đã xóa (lịch sử) | `ARCHIVED` (7) | Xóa mềm chỉ khi `DRAFT`; không hiển thị |

> `PROPOSED` (1), `APPROVED_LEVEL2` (4), `REJECTED` (6) là giá trị **legacy** — giữ enum để đọc dữ liệu cũ, **không dùng trong luồng M-028**.
> **Đối chiếu feature-brief F-301 §3:** bảng đề xuất trong brief dùng tên tạm `PENDING_L1`/`PENDING_L2`/`REJECTED` (bản viết trước khi có chuẩn chung, đánh dấu UNRESOLVED). Bảng trên (mục 4) là ánh xạ **chuẩn của module** — SA dùng bảng này khi scaffold; nhãn UI trên badge/StatusTabs giữ ngôn ngữ Excel #33: tab "Ban hành" cho `APPROVED`, nhóm tab trạng thái theo chuẩn 6 tab của AGENTS.md (màu lấy từ semantic tokens `theme.ts`/`tokens.ts` — không hardcode).

**Luồng chuyển trạng thái (mỗi dòng = 1 test case):**

| Từ | Hành động | Sang | Ai thực hiện |
|---|---|---|---|
| (mới) | Lưu tạm | `DRAFT` | Người nhập |
| (mới, cấp Cục) | Gửi duyệt thẳng | `APPROVED_LEVEL1` (chờ C2) | Người nhập cấp Cục |
| `DRAFT` | Gửi duyệt | `PENDING_APPROVAL` (chờ C1) | Người nhập |
| `PENDING_APPROVAL` | Đồng ý (C1) | `APPROVED_LEVEL1` (chờ C2) | Cảng vụ/Chi cục |
| `PENDING_APPROVAL` | Từ chối (C1) | `REJECTED_LEVEL1` | Cảng vụ/Chi cục |
| `APPROVED_LEVEL1` | Đồng ý (C2) | `APPROVED` (Ban hành) | Cục |
| `APPROVED_LEVEL1` | Từ chối (C2) | `REJECTED_LEVEL2` | Cục |
| `REJECTED_LEVEL1` | Sửa + gửi lại | `PENDING_APPROVAL` | Người nhập |
| `REJECTED_LEVEL2` | Sửa + gửi lại | `PENDING_APPROVAL` | Người nhập |
| `APPROVED` | Sửa (chỉ trường theo dõi) | `APPROVED` | Người có quyền phê duyệt |
| `DRAFT` | Xóa mềm | `ARCHIVED` | Người nhập |

**Nguyên tắc bắt buộc (approval-2-level-spec):** 2 vòng đúng thứ tự, không nhảy vòng; phân cấp theo `OrgUnit.level` (người gửi thuộc cấp Cục → bỏ vòng 1); **4-eyes** — người kê khai không tự duyệt bản ghi của mình; từ chối bắt buộc nhập lý do (lưu `rejection_reason` + nội dung phê duyệt + lịch sử); đóng băng sửa khi `PENDING_APPROVAL`/`APPROVED_LEVEL1`; **không hạ hồ sơ về `DRAFT`** sau khi đã gửi (sửa từ `REJECTED_*` → gửi lại `PENDING_APPROVAL`); chỉ xóa khi `DRAFT`.

## 5. Phân quyền (resource `seaportthroughput`)

Module đăng ký permission động tại `PermissionSeeder.java` (`seedPermission(definitions, resource, action, ...)` trong `run()` — mỗi action 1 dòng; permission seed xong tự xuất hiện trong cây phân quyền nhóm/tài khoản). **Resource chuẩn của module: `seaportthroughput` (không gạch nối)** — khớp module-brief, intake triage và tên class `SeaportThroughput`; convention đặt tên resource theo entity (vd `navigationchannel:create`).

| Thao tác | Permission |
|---|---|
| Xem danh sách / chi tiết / lịch sử | `seaportthroughput:read` |
| Tạo mới / Lưu tạm | `seaportthroughput:create` |
| Sửa bản ghi (chưa ban hành) | `seaportthroughput:update` |
| Xóa bản ghi (chưa ban hành) | `seaportthroughput:delete` |
| Gửi phê duyệt | `seaportthroughput:submit` |
| Cập nhật từ file Excel | `seaportthroughput:import` |
| Phê duyệt cấp Cảng vụ/Chi cục | `seaportthroughput:approve` |
| Phê duyệt cấp Cục (ban hành) | `seaportthroughput:approve_level2` |
| Từ chối (theo cấp) | `seaportthroughput:reject` |

| Vai trò | read | create/update/delete | submit/import | approve (C1) | approve_level2 (C2) |
|---|---|---|---|---|---|
| Chuyên viên Cục/Cảng vụ/Chi cục | ✅ (phạm vi đơn vị) | ✅ | ✅ | — | — |
| Lãnh đạo Cảng vụ/Chi cục | ✅ | — | — | ✅ | — |
| Lãnh đạo Cục | ✅ full | — | — | — | ✅ |
| Admin Cục | ✅ | ✅ | ✅ | ✅ | ✅ |
| ROLE_SYSTEM_ADMIN | ✅ | ✅ (vượt mọi kiểm tra) | ✅ | ✅ | ✅ |

**Admin Cục:** xem thêm metadata nhạy cảm (người tạo/người sửa cuối/thời gian tạo/cập nhật); là cấp duyệt cuối toàn bộ đơn vị qua `orgunit:scope_all`/`admin:all`.
> **Đối chiếu feature-brief F-301 §4.4/§6:** brief ghi dạng gạch nối `seaport-throughput` (đề xuất viết từ ngữ cảnh cũ). Resource chuẩn module là `seaportthroughput`; SA khi scaffold thống nhất chuỗi định danh (permission + `@PreAuthorize`) theo bảng này và cập nhật lại §4.4/§6 của brief.

## 6. Data Scope theo đơn vị (phần CHUNG)

- Entity nghiệp vụ **bắt buộc có `org_unit_id`** (NOT NULL) + khai `@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")`.
- Controller **bắt buộc khai `@DataScope`** (class-level) — nếu không filter không bao giờ được kích hoạt.
- Chiều GHI: khi tạo gán đơn vị = đơn vị người tạo (fallback) hoặc chọn trong phạm vi; **validate đơn vị trong phạm vi user** (`OrgUnitScopeService.Scope.allows(...)` / `requireOrganizationInScope`) trước khi lưu — cấm gán vào đơn vị ngoài phạm vi; **cấm để `org_unit_id` NULL**.
- Khi sửa: `org_unit_id` không đổi (disabled) — chỉ sửa số liệu.
- Hiển thị: response trả `orgUnitId` + `orgUnitName` (map qua `OrgUnitCacheService`); mọi luồng thêm/sửa/xóa/duyệt/từ chối/thay đổi cây đơn vị gọi `orgUnitCacheService.evictAfterCommit()` (sau commit).
- Ngoại lệ: **không** — kể cả phía báo cáo downstream, đọc theo phạm vi đơn vị của user gọi.

## 7. Quy tắc nghiệp vụ (Business Rules — hợp nhất)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-SLCB-01 | Unique (org_unit_id, report_month): trùng (đơn vị, tháng) khi tạo/sửa → lỗi tiếng Việt "Đã tồn tại số liệu sản lượng của đơn vị trong tháng này" | Create/Edit |
| BR-SLCB-02 | Đơn vị quản lý bắt buộc, gán mặc định = đơn vị người kê khai (hoặc chọn trong DataScope); không đổi khi sửa | Create |
| BR-SLCB-03 | Thời gian tổng hợp bắt buộc, chọn theo tháng (MM/YYYY); không cho 2 bản ghi cùng đơn vị cùng tháng | Create |
| BR-SLCB-04 | Chỉ tiêu số ≥ 0, mặc định 0, không nhập âm (24 cột DECIMAL + `passenger_trips`) | Create/Edit |
| BR-SLCB-05 | `APPROVED` (Ban hành): khóa sửa/xóa trường kê khai (STT 1–29); chỉ xem + theo dõi | Edit/Delete |
| BR-SLCB-06 | Chỉ submit khi `DRAFT` hoặc `REJECTED_LEVEL1`/`REJECTED_LEVEL2` (sau khi sửa lại) | Submit |
| BR-SLCB-07 | 4-eyes: người kê khai không tự phê duyệt bản ghi mình tạo | Approve |
| BR-SLCB-08 | Từ chối bất kỳ cấp nào bắt buộc nhập lý do (lưu `rejection_reason` + nội dung phê duyệt + lịch sử) | Reject |
| BR-SLCB-09 | Import Excel: validate đúng danh sách cột (Đơn vị quản lý + Thời gian tổng hợp bắt buộc); báo lỗi theo dòng rõ ràng (all-or-nothing hoặc báo cáo lỗi dòng — SA chốt); không ghi nửa chừng | Import |
| BR-SLCB-10 | Mọi thay đổi trạng thái/sửa/xóa ghi đủ kiểm toán (`operatorId`/`updatedBy`/`deletedBy`) + lịch sử tập trung | All |
| BR-SLCB-11 | Không nhập tên đơn vị tự do; lấy từ cây OrgUnit qua `OrgUnitCacheService`; response trả `orgUnitId` + `orgUnitName` | All |
| BR-SLCB-12 | Đóng băng khi `PENDING_APPROVAL`/`APPROVED_LEVEL1` (không sửa/xóa); chỉ xóa mềm khi `DRAFT` | All |
| BR-SLCB-13 | Người gửi thuộc cấp Cục (`OrgUnit.level`) → submit thẳng `APPROVED_LEVEL1` (bỏ vòng 1) | Submit |
| BR-SLCB-14 | Không hạ hồ sơ đã gửi về `DRAFT`; từ `REJECTED_*` sửa + gửi lại → `PENDING_APPROVAL` | Submit/Edit |
| BR-SLCB-15 | Text đầu vào trim khoảng trắng đầu/cuối trước khi lưu/lọc | All |

## 8. Validation rules chi tiết

| Trường | Luật | Thông báo lỗi (tiếng Việt có dấu) |
|---|---|---|
| `org_unit_id` | bắt buộc; thuộc phạm vi DataScope user; không đổi khi sửa | "Vui lòng chọn Đơn vị quản lý" / "Đơn vị quản lý nằm ngoài phạm vi được phép" |
| `report_month` | bắt buộc; chọn tháng MM/YYYY; không trùng (đơn vị, tháng) | "Vui lòng chọn Thời gian tổng hợp sản lượng" / "Đã tồn tại số liệu sản lượng của đơn vị trong tháng này" |
| 24 cột DECIMAL | số ≥ 0, mặc định 0 | "Giá trị không được nhỏ hơn 0" |
| `passenger_trips` | số nguyên ≥ 0 | "Lượt hành khách không được nhỏ hơn 0" |
| `note`, `file_name` | trim; không bắt buộc | — |
| Trạng thái | chỉ chuyển theo bảng §4; 4-eyes | "Người kê khai không được tự phê duyệt bản ghi của mình" / "Vui lòng nhập lý do từ chối" |

## 9. Giao diện (theo convention chung — chỉ ghi điểm RIÊNG)

- Danh sách: `ScreenHeader` + `FilterBar` + `StatusTabs` + `DataTable` + `Pagination` (`frontend/src/components/list-view/`), `FilterTableLayout` với `hideFilterToggle={true}` (sidebar cuộn 280px, đáy 2 nút Reload + Tìm kiếm); cấu hình theo `docs/conventions/list-screen-ui-standard.md`.
- Bộ lọc: `orgUnitId` (OrgUnitTreeSelect cây) · `search` từ khóa · `reportMonth` (chọn tháng) · `approvalStatus` (StatusTabs) · `updatedFrom/updatedTo` (RangePicker DD/MM/YYYY); sort mặc định theo Ngày cập nhật giảm dần.
- Drawer: chế độ view/create/edit trên trang danh sách (không route riêng); tab "Thông tin phê duyệt" trong Tab Thông tin chung; mở "Lịch sử" từ `rowActions` (không tạo tab log riêng); Drawer child-table/pagination theo chuẩn `DRAWER_TABLE_SCROLL_Y` (`themetokenchk.ts`) + `drawer-table-layout-standard.md`.
- Badge trạng thái: **Pill Badge Standard** (viên thuốc, màu semantic từ tokens — không hardcode); StatusTabs 6 tab theo AGENTS.md; nhãn trạng thái cuối của module = "Ban hành" (Excel #33).
- Form: trường 1 (SelectOrgCode, disabled khi sửa), trường 2 (DatePicker chọn tháng), 24 ô `InputDecimal` (3 nhóm có tiêu đề nhóm), `passenger_trips`, `note` (InputTextArea), UploadFileTable cho file đính kèm; các ô input dùng preset style (radiusPill/height 40/spaceFormField) — chi tiết tại F-301 §2.
- Kiểm tra đủ 4 trạng thái màn: `loading / error / empty / data`.

## 10. Kiểm toán & lịch sử

- Lịch sử hình thành + lịch sử phê duyệt ghi vào bảng **tập trung `infrastructure_history` / approval-history** (bỏ `change_logs`/`approval_logs`; không tạo bảng lịch sử riêng cho module).
- Metadata phê duyệt lưu trên entity (`submitted_at/by`, `approved_l1_*`, `approved_l2_*`, `rejected_*`, `rejection_reason`) + hiển thị trong mục "Thông tin phê duyệt"; không ghi dòng trạng thái chuyển tiếp trùng lặp vào `infrastructure_history` (approval-2-level-spec §3).
- Soft delete: chỉ khi `DRAFT`, qua `ApprovalHistoryUtils.recordSoftDelete(...)`, ghi `deleted_by`/`deleted_at`.

## 11. Điểm chờ SA chốt (risks/decisions)

| # | Vấn đề | Đề xuất BA |
|---|---|---|
| 1 | Schema: 24 cột cố định vs bảng con `throughput_detail` | **24 cột + `passenger_trips`** (khớp 1:1 Excel #33/URD III.7.53); bảng con dễ mở rộng tuyến nhưng lệch form Excel |
| 2 | Package: tái dùng `com.hanghai.kchtg.statistics` (chứa service legacy) vs package/entity riêng | **Entity riêng** `seaport_throughput`, package mới theo chuẩn module (vd `com.hanghai.kchtg.seaportthroughput`); không ghép vào code statistics legacy |
| 3 | Chuỗi định danh: `seaport-throughput` (F-301 brief) vs `seaportthroughput` (module-brief/intake) | **`seaportthroughput`** cho permission + `@PreAuthorize`; cập nhật F-301 §4.4/§6 khi scaffold |
| 4 | `report_month` DatePicker: disabled khi nào (sau ban hành?) | Excel ghi "disabled" — chốt: khóa cùng đợt khóa bản ghi `APPROVED` (BR-05) |
| 5 | Nhãn "lịch sử" trên Excel ("Trạng thái (lưu tạm/ban hành/lịch sử)") | Hiểu: badge chỉ Lưu tạm/Ban hành + trạng thái duyệt; "lịch sử" = màn hình xem riêng (UC #148) |
| 6 | Import: all-or-nothing vs báo cáo lỗi theo dòng | Báo lỗi theo dòng, không ghi nửa chừng (BR-09) |
| 7 | Người dùng cấp Cục kê khai trực tiếp (không qua Cảng vụ) | Submit thẳng `APPROVED_LEVEL1` theo `OrgUnit.level` — quy tắc chung đã chốt (BR-13) |

## 12. Tài liệu tham chiếu

- Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` — sheet `30->43`, cụm **#33 "QL Sản lượng cảng biển"**
- URD MTIS VMD v3.0 — mục **III.7.53** / **III.7.54** (`docs/intel/_tkct_raw.txt` UC #148/#149)
- `docs/modules/M-028-san-luong-cang-bien/_features/F-301-san-luong-cang-bien/feature-brief.md` (phần RIÊNG)
- `docs/conventions/approval-2-level-spec.md`, `docs/conventions/list-screen-ui-standard.md`, `docs/conventions/form-and-list-patterns.md`, `docs/conventions/drawer-table-layout-standard.md`
- Code mẫu: `PermissionSeeder.java`, `DataScopeAspect.java`, `OrgUnitScopeService`, `OrgUnitCacheService`, màn hình chuẩn `frontend/src/pages/UsersPage.tsx`
