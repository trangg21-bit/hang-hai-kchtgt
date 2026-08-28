---
id: F-304
name: "Xem chi tiết Khu chuyển tải"
slug: xem-chi-tiet-khu-chuyen-tai
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:25:57Z"
last-updated: "2026-08-28T06:25:57Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xem chi tiết Khu chuyển tải

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-304 — Xem chi tiết Khu chuyển tải (TransferArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng thường (không có bước phê duyệt).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md`; CSV Khu chuyển tải cột "Xem chi tiết = TRUE"; entity `TransferArea` + bảng con.

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `transferarea:read` mở Drawer "Chi tiết thông tin" của một hồ sơ Khu chuyển tải. Drawer hiển thị 5 tab: Thông tin chung + kỹ thuật + công bố + thời gian hoạt động; Vị trí (GIS) với bảng tọa độ DMS; File đính kèm; Vận hành & bảo trì (read-only); Lịch sử & Phê duyệt (tab hiển thị khi `drawerMode !== 'create'`). Toàn bộ dữ liệu read-only.

## 2. Trường dữ liệu

Các trường có cột "Xem chi tiết = TRUE" trong CSV (không nhập liệu, chỉ hiển thị):

| # | Trường | Kiểu hiển thị | Ghi chú |
|---|---|---|---|
| 1 | Mã khu chuyển tải | Text | `transferAreaCode` |
| 2 | Tên khu chuyển tải | Text | `transferAreaName` |
| 3 | Đơn vị quản lý | Text | `orgUnitName` (qua `OrgUnitCacheService`) |
| 4 | Thuộc cảng biển | Text | `portId` → tên cảng |
| 5 | Địa điểm (Tỉnh/TP) | Text | `provinceId` → tên tỉnh |
| 6 | Địa điểm chi tiết | Text | `detailedLocation` |
| 7 | Công năng khai thác | Text | `operationalFunctions` |
| 8 | Tình trạng | Badge | `operationalStatus` |
| 9–18 | Thông tin kỹ thuật (#9–#18) | Text | `shapeDescription`, `area`, `designWaterDepth`, `currentWaterDepth`, `bottomElevationDesign`, `maxVesselDWT`, `activeTransferCount`, `publishedTransferCount`, `underInvestmentTransferCount`, `remarks` |
| 19–23 | Công bố + thời gian HĐ | Text/Date | `openingAnnouncementDate`, `publicDecision`, `investmentAgreement`, `activityStartDate`, `activityEndDate` |
| 24–29 | Khu nước neo buộc + điểm neo | Bảng con | `description`, `geometryType`, `mapSymbolId`, `coordinateSystem`, `displayRule`, anchor points (name/lat/lng DMS) |
| 30–34 | Vị trí GIS | LongLatTable | `mapSymbolId`, `coordinateSystem`, `displayRule`, spatial coordinates |
| 35 | File đính kèm | UploadFileTable | read-only list |
| 36–47 | Vận hành & bảo trì | Text read-only | operation/maintenance/incident |
| 48–58 | Xử lý & theo dõi | Badge/Text read-only | `approvalStatus`, ngày/cán bộ cập nhật/gửi/duyệt C1/C2 |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** trong chức năng xem chi tiết. Chỉ hiển thị trạng thái `approvalStatus` (7 trạng thái chuẩn) và thông tin phê duyệt C1/C2 dạng read-only.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-304-01 | Chỉ xem hồ sơ trong phạm vi đơn vị user (data scope). | Read |
| BR-304-02 | Hiển thị tọa độ theo quy tắc hiển thị (mặc định DMS). | Read |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-304-01 | User có `transferarea:read`, hồ sơ trong scope | GET `/{id}` | Trả đầy đủ thông tin 5 tab | Drawer hiển thị đủ trường Detail=TRUE |
| AC-304-02 | Hồ sơ ngoài scope đơn vị | GET `/{id}` | Không trả (filter orgUnitFilter) | Không thấy bản ghi |
| AC-304-03 | User thiếu `transferarea:read` | GET `/{id}` | HTTP 403; UI ẩn nút Xem | Permission khớp |

### 4.3. User Stories

- **US-304-01:** Là Chuyên viên, tôi muốn xem chi tiết hồ sơ Khu chuyển tải (thông tin + GIS + file + lịch sử) để nắm thông tin đầy đủ.
- **US-304-02:** Là Admin Cục, tôi muốn xem thêm metadata người tạo/người sửa/thời gian.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem chi tiết | `transferarea:read` |

| Vai trò | Xem | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu gán `transferarea:read`, theo scope | — |
| Lãnh đạo Cảng vụ/Chi cục | Có theo scope | — |
| Lãnh đạo Cục / Admin Cục | Có toàn phạm vi Cục | Xem thêm metadata người tạo/người sửa/thời gian |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN vượt mọi kiểm tra |
| Người không có quyền | Không | API 403 |

**Admin Cục:** xem hồ sơ toàn phạm vi Cục khi có `transferarea:read` (hoặc `orgunit:scope_all`/`admin:all`/`*`); xem thêm metadata nhạy cảm (người tạo, người sửa cuối, thời gian tạo/cập nhật).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị 7 trạng thái chuẩn qua `ApprovalStatusBadge`. |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt (chỉ xem). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`; entity `@Filter(orgUnitFilter)` + controller `@DataScope`. |
| 4 | Trường chỉ hiện trong điều kiện nào | Tab "Lịch sử & Phê duyệt" chỉ hiện khi `drawerMode !== 'create'`; GIS hiển thị DMS. |
| 5 | Quyền riêng | `transferarea:read`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Hiển thị danh sách file đính kèm (read-only), không upload trong chế độ xem. |
| 8 | Giao diện khác mẫu chung | Không — dùng `TransferAreaDetailContent.tsx` trong Drawer (`AppDrawer`), tuân thủ token system. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/transfer-area/{id}` | Lấy chi tiết hồ sơ | `transferarea:read` |
| GET | `/api/v1/transfer-area/{id}/children` | Lấy bảng con khu nước neo buộc + điểm neo | `transferarea:read` |
| GET | `/api/v1/transfer-area/{id}/attachments` | Danh sách file đính kèm | `transferarea:read` |
| GET | `/api/v1/transfer-area/{id}/history` | Lịch sử phê duyệt/thay đổi | `transferarea:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Đọc từ `transfer_areas` + `transfer_area_mooring_water_areas` + `transfer_area_mooring_water_area_anchor_points` + `infrastructure_attachments` + `infrastructure_history`.
