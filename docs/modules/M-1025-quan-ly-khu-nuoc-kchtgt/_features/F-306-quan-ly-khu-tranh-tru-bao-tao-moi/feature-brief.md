---
id: F-306
name: "Tạo mới Khu tránh trú bão"
slug: quan-ly-khu-tranh-tru-bao-tao-moi
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:25:58Z"
last-updated: "2026-08-28T06:25:58Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Tạo mới Khu tránh trú bão

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-306 — Tạo mới Khu tránh trú bão (StormShelterArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng thường có bước phê duyệt (tạo → Lưu tạm DRAFT hoặc gửi duyệt).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` + CSV `HH_Tính năng & danh sách các trường thông tin(Khu tránh, trú bão).csv` (58 trường). Entity `StormShelterArea` (`storm_shelter_areas`) + bảng con `StormShelterMooringWaterArea` / `StormShelterMooringWaterAreaAnchorPoint`.

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `stormshelter:create` tạo mới hồ sơ Khu tránh trú bão thuộc một Cảng biển. Mã `stormShelterCode` server sinh theo khuôn `{portCode}-TTB-{seq}`, client không sửa. Hồ sơ gồm thông tin chung (kèm Thuộc luồng hàng hải, Thuộc bến phao, Phân loại), kỹ thuật, công bố, khu nước neo buộc + điểm neo, GIS, file đính kèm. Sau khi tạo, hồ sơ ở `DRAFT` hoặc gửi duyệt vào quy trình 2 cấp (F-309).

## 2. Trường dữ liệu

### 2.1. Thông tin chung

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú (entity column) |
|---|---|---|---|---|
| 1 | Mã khu tránh trú bão | — (tự sinh) | Input disabled | `stormShelterCode` = `{portCode}-TTB-{seq}` |
| 2 | Tên khu tránh trú bão | Có | InputTextArea | `stormShelterName` |
| 3 | Đơn vị quản lý | Có | SelectOrgCode / TreeSelect | `orgUnitId` |
| 4 | Thuộc cảng biển | Có (khi tạo) | SelectKcht (CB) | `portId` |
| 5 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther | `provinceId` |
| 6 | Thuộc luồng hàng hải | Không | Select | `navigationChannelId` (Filter=TRUE) |
| 7 | Thuộc bến phao | Không | Select | `buoyStationId` — **DRIFT: ngữ nghĩa BuoyBerth (M-002)** |
| 8 | Phân loại | Không | Select | `classification` (Filter=TRUE) |
| 9 | Địa điểm chi tiết | Không | InputTextArea | `detailedLocation` |
| 10 | Tình trạng | Có | SelectAppParams | `operationalStatus` |

### 2.2. Thông tin kỹ thuật

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 11 | Hình dạng | Không | InputTextArea | `shapeDescription` |
| 12 | Diện tích (ha) | Không | InputDecimal | `area` |
| 13 | Độ sâu khu nước theo thiết kế (m) | Không | Input | `designWaterDepth` |
| 14 | Độ sâu khu nước hiện tại (m) | Không | Input | `currentWaterDepth` |
| 15 | Cao độ đáy bến thiết kế | Không | Input | `bottomElevationDesign` |
| 16 | Cỡ tàu khai thác theo công bố (DWT) | Không | Input | `maxVesselDWT` — **DRIFT: mọi flag FALSE → DB-parity-only** |
| 17 | Số lượng khu tránh trú bão đang khai thác | Không | Input | `activeStormShelterCount` |
| 18 | Số lượng khu tránh trú bão đã công bố | Không | Input | `publishedStormShelterCount` |
| 19 | Số lượng khu tránh trú bão đang được thỏa thuận đầu tư XD | Không | Input | `underInvestmentStormShelterCount` |
| 20 | Ghi chú | Không | InputTextArea | `remarks` — **DRIFT: mọi flag FALSE → DB-parity-only** |

### 2.3. Thông tin công bố mở

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 21 | Thời điểm công bố mở, đưa ra sử dụng | Không | DatePicker | `openingAnnouncementDate` |
| 22 | Quyết định công bố / VB cho phép khai thác | Không | InputTextArea | `publicDecision` |
| 23 | Văn bản thỏa thuận đầu tư xây dựng | Không | InputTextArea | `investmentAgreement` |

### 2.4. Danh sách khu nước neo buộc tàu (bảng con) + điểm neo

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 24 | Phạm vi khu nước neo buộc tàu | Không | Text | `description` |
| 25 | Loại đối tượng | Không | Select (Điểm/Đường/Vùng) | `geometryType` |
| 26 | Biểu tượng | Không | Select | `mapSymbolId` |
| 27 | Hệ quy chiếu | Không | Text | `coordinateSystem`; WGS-84 mặc định |
| 28 | Quy tắc hiển thị | Không | Text | `displayRule`; DMS mặc định |
| 29 | Điểm neo | Không | Bảng con | `StormShelterMooringWaterAreaAnchorPoint` (`name`, `latitude`, `longitude`) |

### 2.5. Vị trí GIS (TAB 2) + File đính kèm (TAB 3)

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 28–31 | Loại đối tượng / Biểu tượng / Hệ quy chiếu / Quy tắc hiển thị | Không | Select/Text | GIS entity cha |
| 32 | Tọa độ | Không | LongLatTable | `spatialId` |
| 35 | File đính kèm | Không | UploadFileTable (≤ 10 MB) | `infrastructure_attachments` |

> TAB 4 (Vận hành & bảo trì #34–#45) và TAB 5 (Xử lý & theo dõi #48–#58) read-only/server-derived.

## 3. Trạng thái và phê duyệt

- Phần phê duyệt: theo `docs/conventions/approval-2-level-spec.md` mục 3. Trạng thái lưu số enum `ApprovalStatus` (DRAFT=0, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED=5, ARCHIVED=7, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9).
- Tạo mới → "Lưu tạm" = `DRAFT`; "Gửi duyệt" = `PENDING_APPROVAL`. Quy trình 2 cấp C1 → C2 (F-309).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-306-01 | Mã `stormShelterCode` server sinh `{portCode}-TTB-{seq}`; client không sửa; unique. | Create |
| BR-306-02 | Tên bắt buộc, trim. | Create |
| BR-306-03 | `orgUnitId` bắt buộc, trong scope user, cấm NULL. | Create |
| BR-306-04 | `portId` bắt buộc khi tạo. | Create |
| BR-306-05 | Khu nước neo buộc: Điểm ('1') đúng 1 cặp tọa độ; Đường ('2') ≥ 2; Vùng ('3') ≥ 3. | Create |
| BR-306-06 | Hệ quy chiếu mặc định WGS-84; hiển thị mặc định DMS; VN-2000/DD chỉ khi migration. | Create |
| BR-306-07 | Cỡ tàu DWT (#16) và Ghi chú (#20) là DB-parity-only — không hiển thị/nhận trên form (drift CSV). | Create |
| BR-306-08 | Trim text; ghi createdBy/createdAt từ session. | Create |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-306-01 | User có `stormshelter:create`, chọn cảng | POST | Hồ sơ tạo, mã `{portCode}-TTB-{seq}`, trạng thái DRAFT/PENDING_APPROVAL | Mã đúng khuôn, unique |
| AC-306-02 | Thiếu trường bắt buộc | POST | API 400 tiếng Việt | Không tạo bản ghi |
| AC-306-03 | Khu nước neo buộc Loại=Điểm với ≠1 tọa độ | POST | Từ chối | Message bắt buộc 1 cặp tọa độ |
| AC-306-04 | Loại=Đường <2 / Vùng <3 tọa độ | POST | Từ chối | completeCount < 2 / < 3 → lỗi |
| AC-306-05 | User thiếu `stormshelter:create` | POST | HTTP 403 | Permission khớp |

### 4.3. User Stories

- **US-306-01:** Là Chuyên viên, tôi muốn tạo mới hồ sơ Khu tránh trú bão với đầy đủ thông tin chung/kỹ thuật/khu nước neo buộc.
- **US-306-02:** Là Chuyên viên, tôi muốn mã được sinh tự động theo cảng biển đã chọn.
- **US-306-03:** Là Chuyên viên, tôi muốn được cảnh báo khi số tọa độ neo không đúng theo loại đối tượng.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới Khu tránh trú bão | `stormshelter:create` |

| Vai trò | Tạo mới | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu gán `stormshelter:create` | Trong phạm vi `orgUnitId` |
| Lãnh đạo Cảng vụ/Chi cục | Có nếu gán quyền | — |
| Lãnh đạo Cục / Admin Cục | Có nếu gán quyền | Xem thêm metadata |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN |
| Người không có quyền | Không | API 403 |

**Admin Cục:** tạo mới trong phạm vi Cục khi có `stormshelter:create` hoặc `admin:all`/`*`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — 7 trạng thái chuẩn. |
| 2 | Có bước phê duyệt không | Có — theo tài liệu nền mục 3 (C1 → C2). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`; `@Filter` + `@DataScope`; ghi validate scope. |
| 4 | Trường chỉ hiện trong điều kiện nào | Mã disabled; Điểm neo hiện khi thêm khu nước neo buộc; #16 DWT + #20 Ghi chú DB-parity-only (drift). |
| 5 | Quyền riêng | `stormshelter:create`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Có — File đính kèm (≤ 10 MB). |
| 8 | Giao diện khác mẫu chung | Không — `StormShelterForm.tsx` (Drawer), tuân thủ token system. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/storm-shelter` | Tạo mới Khu tránh trú bão | `stormshelter:create` |
| GET | `/api/v1/storm-shelter/generate-code?portId=` | Gợi ý mã | `stormshelter:create` |
| POST | `/api/v1/storm-shelter/{id}/attachments` | Upload file | `stormshelter:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Entity `StormShelterArea` + `storm_shelter_mooring_water_areas` + `storm_shelter_mooring_water_area_anchor_points`.
