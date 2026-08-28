---
id: F-300
name: "Tạo mới Khu chuyển tải"
slug: quan-ly-khu-chuyen-tai-tao-moi
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:25:55Z"
last-updated: "2026-08-28T06:25:55Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Tạo mới Khu chuyển tải

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-300 — Tạo mới Khu chuyển tải (TransferArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng thường có bước phê duyệt (tạo → Lưu tạm DRAFT hoặc gửi duyệt → quy trình 2 cấp).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (module anchor) + `docs/conventions/approval-2-level-spec.md` + CSV `HH_Tính năng & danh sách các trường thông tin(Khu chuyển tải).csv` (58 trường). Entity `TransferArea` (bảng `transfer_areas`) + bảng con `TransferAreaMooringWaterArea` / `TransferAreaMooringWaterAreaAnchorPoint`.

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `transferarea:create` tạo mới hồ sơ Khu chuyển tải thuộc một Cảng biển. Mã `transferAreaCode` do server sinh theo khuôn `{portCode}-CT-{seq}`, client không sửa. Hồ sơ gồm: thông tin chung, thông tin kỹ thuật, thông tin công bố, thời gian hoạt động, danh sách khu nước neo buộc tàu (bảng con + điểm neo), vị trí GIS, file đính kèm. Sau khi tạo, hồ sơ ở trạng thái `DRAFT` (Lưu tạm) hoặc được gửi duyệt ngay vào quy trình 2 cấp Cảng vụ/Chi cục → Cục (F-303).

## 2. Trường dữ liệu

Ma trận trường theo CSV (58 trường). Cột "Bắt buộc" áp dụng khi Tạo mới; cột entity là cột lưu trữ tương ứng.

### 2.1. Thông tin chung

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú (entity column) |
|---|---|---|---|---|
| 1 | Mã khu chuyển tải | — (tự sinh) | Input disabled | `transferAreaCode` = `{portCode}-CT-{seq}`; BR-300-01 |
| 2 | Tên khu chuyển tải | Có | InputTextArea | `transferAreaName`; trim; BR-300-02 |
| 3 | Đơn vị quản lý | Có | SelectOrgCode / TreeSelect | `orgUnitId`; phải trong scope user; BR-300-03 |
| 4 | Thuộc cảng biển | Có (khi tạo) | SelectKcht (CB) | `portId` FK → ports.id; BR-300-04 |
| 5 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther | `provinceId` (Integer) |
| 6 | Địa điểm chi tiết | Không | InputTextArea | `detailedLocation` |
| 7 | Công năng khai thác | Có | SelectAppParams (multi-select) | `operationalFunctions` (500) |
| 8 | Tình trạng | Có | SelectAppParams | `operationalStatus` (converter → INT) |

### 2.2. Thông tin kỹ thuật

| # | Trường | Bắt buộc | Kiểu | Ghi chú (entity column) |
|---|---|---|---|---|
| 9 | Hình dạng | Không | InputTextArea | `shapeDescription` (TEXT) |
| 10 | Diện tích (ha) | Không | InputDecimal | `area` (15,2) |
| 11 | Độ sâu khu nước theo thiết kế (m) | Không | Input | `designWaterDepth` (10,2) |
| 12 | Độ sâu khu nước hiện tại (m) | Không | Input | `currentWaterDepth` (10,2) |
| 13 | Cao độ đáy bến thiết kế | Không | Input | `bottomElevationDesign` (10,2) |
| 14 | Cỡ tàu khai thác theo công bố (DWT) | Không | Input | `maxVesselDWT` (15,2) |
| 15 | Số lượng khu chuyển tải đang khai thác | Không | Input | `activeTransferCount` (Integer) |
| 16 | Số lượng khu chuyển tải đã công bố | Không | Input | `publishedTransferCount` |
| 17 | Số lượng khu chuyển tải đang được thỏa thuận đầu tư xây dựng | Không | Input | `underInvestmentTransferCount` |
| 18 | Ghi chú | Không | InputTextArea | `remarks` (TEXT) |

### 2.3. Thông tin công bố mở + Thời gian hoạt động

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 19 | Thời điểm công bố mở, đưa ra sử dụng | Không | DatePicker | `openingAnnouncementDate` |
| 20 | Quyết định công bố / VB cho phép khai thác | Không | InputTextArea | `publicDecision` (500) |
| 21 | Văn bản thỏa thuận đầu tư xây dựng | Không | InputTextArea | `investmentAgreement` (TEXT) |
| 22 | Thời gian hoạt động (Từ ngày) | Không | DatePicker | `activityStartDate` |
| 23 | Thời gian hoạt động (Đến ngày) | Không | DatePicker | `activityEndDate` |

### 2.4. Danh sách khu nước neo buộc tàu (bảng con `TransferAreaMooringWaterArea`) + điểm neo

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 24 | Phạm vi khu nước neo buộc tàu | Không | Text | `description` (1000) |
| 25 | Loại đối tượng | Không | Select (Điểm/Đường/Vùng) | `geometryType`; logic bắt buộc mục 3 |
| 26 | Biểu tượng | Không | Select | `mapSymbolId` |
| 27 | Hệ quy chiếu | Không | Text | `coordinateSystem`; mặc định WGS-84 |
| 28 | Quy tắc hiển thị | Không | Text | `displayRule`; mặc định DMS |
| 29 | Điểm neo | Không | Bảng con (Tên điểm neo, tọa độ GIS) | `TransferAreaMooringWaterAreaAnchorPoint` (`name`, `latitude`, `longitude`) |

### 2.5. Vị trí GIS (TAB 2) + File đính kèm (TAB 3)

| # | Trường | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|
| 30 | Loại đối tượng | Không | Select (Điểm/Đường/Vùng) | GIS của entity cha |
| 31 | Biểu tượng | Không | Select | `mapSymbolId` |
| 32 | Hệ quy chiếu | Không | Text | `coordinateSystem`; WGS-84 mặc định |
| 33 | Quy tắc hiển thị | Không | Text | `displayRule`; DMS mặc định |
| 34 | Tọa độ | Không | LongLatTable | `spatialId` (GIS spatial object) |
| 35 | File đính kèm | Không | UploadFileTable (≤ 10 MB) | `infrastructure_attachments` |

> TAB 4 (Vận hành & bảo trì, #36–#47) và TAB 5 (Xử lý & theo dõi, #48–#58) là read-only / server-derived — không nhận từ client khi tạo.

## 3. Trạng thái và phê duyệt

- Phần phê duyệt: theo `docs/conventions/approval-2-level-spec.md` (mục 3). Trạng thái lưu dạng số enum `ApprovalStatus` (DRAFT=0, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED=5, ARCHIVED=7, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9).
- Khi tạo mới: nếu chọn "Lưu tạm" → `DRAFT`; nếu chọn "Gửi duyệt" → `PENDING_APPROVAL` (Chờ Cảng vụ/Chi cục duyệt).
- Quy trình 2 cấp C1 → C2 (chi tiết F-303): Chờ Cảng vụ/Chi cục → Đồng ý → Chờ Cục → Đồng ý → Đã duyệt; từ chối ở vòng nào thì trả về trạng thái tương ứng (REJECTED_LEVEL1/REJECTED_LEVEL2) và bắt buộc lý do ≥ 10 ký tự.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-300-01 | Mã `transferAreaCode` do server sinh `{portCode}-CT-{seq}`; client không gửi, không sửa được; unique. | Create |
| BR-300-02 | Tên khu chuyển tải bắt buộc, trim khoảng trắng đầu/cuối trước khi lưu. | Create |
| BR-300-03 | `orgUnitId` bắt buộc; phải nằm trong phạm vi đơn vị user (`OrgUnitScopeService.Scope.allows`); cấm NULL. | Create |
| BR-300-04 | `portId` (Thuộc cảng biển) bắt buộc khi tạo; mã dựa trên `portCode` của cảng được chọn. | Create |
| BR-300-05 | Khu nước neo buộc — Loại đối tượng Điểm ('1') bắt buộc đúng 1 cặp tọa độ; Đường ('2') ≥ 2; Vùng ('3') ≥ 3. | Create |
| BR-300-06 | Hệ quy chiếu mặc định WGS-84; quy tắc hiển thị mặc định DMS; VN-2000/DD chỉ khi migration. | Create |
| BR-300-07 | Mọi text input trim trước khi lưu. | Create |
| BR-300-08 | Tạo mới ghi `createdBy`/`createdAt` từ session người thao tác. | Create |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-300-01 | User có `transferarea:create`, chọn cảng biển | Gửi POST tạo mới | Hồ sơ tạo với `transferAreaCode` = `{portCode}-CT-{seq}` và `approvalStatus` theo lựa chọn (DRAFT hoặc PENDING_APPROVAL) | Mã đúng khuôn, unique, tự tăng seq |
| AC-300-02 | Thiếu trường bắt buộc (tên/đơn vị/cảng/công năng/tình trạng) | Gửi POST | API từ chối với message tiếng Việt | HTTP 400, không tạo bản ghi |
| AC-300-03 | Khu nước neo buộc Loại=Điểm với ≠1 tọa độ | Gửi POST | API từ chối | Message "bắt buộc và chỉ được nhập 1 cặp tọa độ" |
| AC-300-04 | Khu nước neo buộc Loại=Đường với <2 tọa độ | Gửi POST | API từ chối | completeCount < 2 → lỗi |
| AC-300-05 | Khu nước neo buộc Loại=Vùng với <3 tọa độ | Gửi POST | API từ chối | completeCount < 3 → lỗi |
| AC-300-06 | User thiếu `transferarea:create` | Gửi POST | HTTP 403 (sau khi SA khôi phục @PreAuthorize) | Permission `transferarea:create` |

### 4.3. User Stories

- **US-300-01:** Là Chuyên viên, tôi muốn tạo mới hồ sơ Khu chuyển tải với đầy đủ thông tin chung + kỹ thuật + khu nước neo buộc để quản lý hạ tầng.
- **US-300-02:** Là Chuyên viên, tôi muốn mã khu chuyển tải được sinh tự động theo cảng biển đã chọn để đảm bảo định danh nhất quán.
- **US-300-03:** Là Chuyên viên, tôi muốn nhập khu nước neo buộc kèm điểm neo và được cảnh báo khi số tọa độ không đúng theo loại đối tượng.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới Khu chuyển tải | `transferarea:create` |
| Gợi ý mã | `transferarea:create` |

| Vai trò | Tạo mới | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu được gán `transferarea:create` | Chỉ tạo trong phạm vi `orgUnitId` của mình |
| Lãnh đạo Cảng vụ/Chi cục | Có nếu được gán quyền | — |
| Lãnh đạo Cục / Admin Cục | Có nếu được gán quyền | Xem thêm metadata người tạo/người sửa/thời gian |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN vượt mọi kiểm tra |
| Người không có quyền | Không | API trả 403 |

**Admin Cục:** với F-300, Admin Cục được tạo mới hồ sơ Khu chuyển tải trong phạm vi Cục khi có `transferarea:create` hoặc quyền tổng `admin:all`/`*`; vẫn chịu ràng buộc write-scope theo đơn vị.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chuẩn `ApprovalStatus`; tạo mới về DRAFT hoặc PENDING_APPROVAL. |
| 2 | Có bước phê duyệt không | Có — theo tài liệu nền mục 3 (2 cấp C1 → C2); tạo mới có thể "Lưu tạm" hoặc "Gửi duyệt". |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị. Field scope `orgUnitId` (bắt buộc); entity khai `@Filter(orgUnitFilter)`, controller `@DataScope`; chiều ghi validate `OrgUnitScopeService.Scope.allows`. |
| 4 | Trường chỉ hiện trong điều kiện nào | Mã `transferAreaCode` disabled tự sinh; Điểm neo chỉ hiện khi thêm khu nước neo buộc; TAB4/TAB5 read-only. |
| 5 | Quyền riêng | `transferarea:create` (tạo + gợi ý mã). |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. POST yêu cầu đăng nhập + RBAC + data scope. |
| 7 | Tải lên tệp | Có — File đính kèm (≤ 10 MB) gắn sau khi tạo qua `POST /{id}/attachments`. |
| 8 | Giao diện khác mẫu chung | Không — dùng `TransferAreaForm.tsx` (Drawer), tuân thủ token system, không hardcode màu/spacing/font. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/transfer-area` | Tạo mới Khu chuyển tải; server sinh mã, gán đơn vị | `transferarea:create` |
| GET | `/api/v1/transfer-area/generate-code?portId=` | Gợi ý mã theo cảng biển | `transferarea:create` |
| POST | `/api/v1/transfer-area/{id}/attachments` | Upload file đính kèm | `transferarea:update` |
| POST | `/api/v1/transfer-area/{id}/submit-approval` | Gửi duyệt (nếu tạo tạm rồi gửi) | `transferarea:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Không thay đổi schema — code đã ship. Entity `TransferArea` (`transfer_areas`) + bảng con `transfer_area_mooring_water_areas` (FK `transfer_area_id`) + `transfer_area_mooring_water_area_anchor_points` (FK `transfer_area_mooring_water_area_id`). Các trường đã liệt kê ở mục 2 với cột tương ứng; không thêm cột, không thêm index.
