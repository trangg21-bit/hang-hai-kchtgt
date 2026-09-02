---
id: F-312
name: "Tạo mới Khu neo đậu"
slug: quan-ly-khu-neo-dau-tao-moi
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:26:02Z"
last-updated: "2026-08-28T06:26:02Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Tạo mới Khu neo đậu

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-312 — Tạo mới Khu neo đậu (Anchorage).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng thường có bước phê duyệt.
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` + Excel `HH_Tính năng & danh sách các trường thông tin.xlsx` sheet "Khu neo đậu" (57 trường). Entity `Anchorage` (`anchorages`) + bảng con `MooringWaterArea` / `MooringWaterAreaAnchorPoint` (KHÔNG tiền tố).

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `anchorage:create` tạo mới hồ sơ Khu neo đậu thuộc một Cảng biển. Mã `anchorageCode` server sinh theo khuôn `{portCode}-ND-{seq}`, client không sửa. Hồ sơ gồm thông tin chung (kèm Thuộc luồng hàng hải, Thuộc bến phao), kỹ thuật, công bố, khu nước neo buộc + điểm neo, GIS, file đính kèm. Sau khi tạo, hồ sơ ở `DRAFT` hoặc gửi duyệt vào quy trình 2 cấp (F-315).

## 2. Trường dữ liệu

### 2.1. Thông tin chung

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú (entity column) |
|---|---|---|---|---|
| 1 | Mã khu neo đậu | — (tự sinh) | Input disabled | `anchorageCode` = `{portCode}-ND-{seq}` |
| 2 | Tên khu neo đậu | Có | InputTextArea | `anchorageName` |
| 3 | Đơn vị quản lý | Có | SelectOrgCode / TreeSelect | `orgUnitId` |
| 4 | Thuộc cảng biển | Có (khi tạo) | SelectKcht (CB) | `portId` |
| 5 | Thuộc luồng hàng hải | Không | SelectKcht (LHH) | `navigationChannelId` |
| 6 | Thuộc bến phao | Không | SelectKcht (BP) | `buoyStationId` — **DRIFT: ngữ nghĩa BuoyBerth (M-002)** |
| 7 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther | `provinceId` |
| 8 | Địa điểm chi tiết | Không | InputTextArea | `detailedLocation` |
| 9 | Tình trạng | Có | SelectAppParams | `operationalStatus` |

### 2.2. Thông tin kỹ thuật

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 10 | Hình dạng | Không | InputTextArea | `shapeDescription` |
| 11 | Diện tích (ha) | Không | InputDecimal | `area` |
| 12 | Độ sâu khu nước theo thiết kế (m) | Không | Input | `designWaterDepth` |
| 13 | Độ sâu khu nước hiện tại (m) | Không | Input | `currentWaterDepth` |
| 14 | Cao độ đáy bến thiết kế | Không | Input | `bottomElevationDesign` |
| 15 | Cỡ tàu khai thác theo công bố (DWT) | Không | Input | `maxVesselDWT` |
| 16 | Số lượng khu neo đậu đang khai thác | Không | Input | `activeAnchorageCount` |
| 17 | Số lượng khu neo đậu đã công bố | Không | Input | `publishedAnchorageCount` |
| 18 | Số lượng khu neo đậu đang được thỏa thuận đầu tư XD | Không | Input | `underInvestmentAnchorageCount` |
| 19 | Ghi chú | Không | InputTextArea | `remarks` |

### 2.3. Thông tin công bố mở

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 20 | Thời điểm công bố mở, đưa ra sử dụng | Không | DatePicker | `openingAnnouncementDate` |
| 21 | Quyết định công bố / VB cho phép khai thác | Không | Input | `publicDecision` |
| 22 | Văn bản thỏa thuận đầu tư xây dựng | Không | InputTextArea | `investmentAgreement` |

### 2.4. Danh sách khu nước neo buộc tàu (bảng con `MooringWaterArea`) + điểm neo

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 23 | Phạm vi khu nước neo buộc tàu | Không | Text | `description` |
| 24 | Loại đối tượng | Không | Select (Điểm/Đường/Vùng) | `geometryType` |
| 25 | Biểu tượng | Không | Select | `mapSymbolId` |
| 26 | Hệ quy chiếu | Không | Text | `coordinateSystem`; WGS-84 mặc định |
| 27 | Quy tắc hiển thị | Không | Text | `displayRule`; DMS mặc định |
| 28 | Điểm neo | Không | Bảng con | `MooringWaterAreaAnchorPoint` (`name`, `latitude`, `longitude`) |

### 2.5. Vị trí GIS (TAB 2) + File đính kèm (TAB 3)

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 27–30 | Loại đối tượng / Biểu tượng / Hệ quy chiếu / Quy tắc hiển thị | Không | Select/Text | GIS entity cha |
| 31 | Tọa độ | Không | LongLatTable | `spatialId` |
| 34 | File đính kèm | Không | UploadFileTable (≤ 10 MB) | `infrastructure_attachments` |

> TAB 4 (Vận hành & bảo trì #33–#44) và TAB 5 (Xử lý & theo dõi #47–#57) read-only/server-derived.

## 3. Trạng thái và phê duyệt

- Phần phê duyệt: theo `docs/conventions/approval-2-level-spec.md` mục 3. Trạng thái số enum `ApprovalStatus` (DRAFT=0, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED=5, ARCHIVED=7, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9).
- Tạo mới → "Lưu tạm" = `DRAFT`; "Gửi duyệt" = `PENDING_APPROVAL`. Quy trình 2 cấp C1 → C2 (F-315).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-312-01 | Mã `anchorageCode` server sinh `{portCode}-ND-{seq}`; client không sửa; unique. | Create |
| BR-312-02 | Tên bắt buộc, trim. | Create |
| BR-312-03 | `orgUnitId` bắt buộc, trong scope user, cấm NULL. | Create |
| BR-312-04 | `portId` bắt buộc khi tạo. | Create |
| BR-312-05 | Khu nước neo buộc: Điểm ('1') đúng 1 cặp tọa độ; Đường ('2') ≥ 2; Vùng ('3') ≥ 3. | Create |
| BR-312-06 | Hệ quy chiếu mặc định WGS-84; hiển thị mặc định DMS; VN-2000/DD chỉ khi migration. | Create |
| BR-312-07 | Trim text; ghi createdBy/createdAt từ session. | Create |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-312-01 | User `anchorage:create`, chọn cảng | POST | Hồ sơ tạo, mã `{portCode}-ND-{seq}`, DRAFT/PENDING_APPROVAL | Mã đúng khuôn, unique |
| AC-312-02 | Thiếu trường bắt buộc | POST | API 400 tiếng Việt | Không tạo bản ghi |
| AC-312-03 | Khu nước neo buộc Loại=Điểm với ≠1 tọa độ | POST | Từ chối | Message 1 cặp tọa độ |
| AC-312-04 | Loại=Đường <2 / Vùng <3 tọa độ | POST | Từ chối | completeCount < 2 / < 3 |
| AC-312-05 | Thiếu `anchorage:create` | POST | 403 | Permission khớp |

### 4.3. User Stories

- **US-312-01:** Là Chuyên viên, tôi muốn tạo mới hồ sơ Khu neo đậu với đầy đủ thông tin.
- **US-312-02:** Là Chuyên viên, tôi muốn mã sinh tự động theo cảng biển.
- **US-312-03:** Là Chuyên viên, tôi muốn cảnh báo khi số tọa độ neo không đúng theo loại đối tượng.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới Khu neo đậu | `anchorage:create` |

| Vai trò | Tạo mới | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu gán `anchorage:create` | Trong phạm vi `orgUnitId` |
| Lãnh đạo Cảng vụ/Chi cục | Có nếu gán quyền | — |
| Lãnh đạo Cục / Admin Cục | Có nếu gán quyền | Xem thêm metadata |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN |
| Người không có quyền | Không | API 403 |

**Admin Cục:** tạo mới trong phạm vi Cục khi có `anchorage:create` hoặc `admin:all`/`*`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — 7 trạng thái chuẩn. |
| 2 | Có bước phê duyệt không | Có — 2 cấp C1 → C2. |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`; `@Filter` + `@DataScope`; ghi validate scope. |
| 4 | Trường chỉ hiện trong điều kiện nào | Mã disabled; Điểm neo hiện khi thêm khu nước neo buộc. |
| 5 | Quyền riêng | `anchorage:create`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Có — File đính kèm (≤ 10 MB). |
| 8 | Giao diện khác mẫu chung | Không — `AnchorageForm.tsx` (Drawer), tuân thủ token system. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/anchorage` | Tạo mới Khu neo đậu | `anchorage:create` |
| GET | `/api/v1/anchorage/generate-code?portId=` | Gợi ý mã | `anchorage:create` |
| POST | `/api/v1/anchorage/{id}/attachments` | Upload file | `anchorage:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Entity `Anchorage` + `mooring_water_areas` (FK `anchorage_id`) + `mooring_water_area_anchor_points` (FK `mooring_water_area_id`).
