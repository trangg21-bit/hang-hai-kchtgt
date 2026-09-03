---
id: F-310
name: "Xem chi tiết Khu tránh trú bão"
slug: xem-chi-tiet-khu-tranh-tru-bao
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:26:00Z"
last-updated: "2026-08-28T06:26:00Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xem chi tiết Khu tránh trú bão

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-310 — Xem chi tiết Khu tránh trú bão (StormShelterArea).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng thường (không có bước phê duyệt).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md`; CSV Khu tránh trú bão; entity `StormShelterArea` + bảng con.

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `stormshelter:read` mở Drawer "Chi tiết thông tin" của hồ sơ Khu tránh trú bão — read-only, gồm 5 tab: thông tin chung (kèm Thuộc luồng hàng hải, Thuộc bến phao, Phân loại) + kỹ thuật + công bố; Vị trí (GIS) với bảng tọa độ DMS; File đính kèm; Vận hành & bảo trì; Lịch sử & Phê duyệt.

## 2. Trường dữ liệu

| # | Trường | Kiểu hiển thị | Ghi chú |
|---|---|---|---|
| 1–2 | Mã, Tên khu tránh trú bão | Text | `stormShelterCode`, `stormShelterName` |
| 3–4 | Đơn vị quản lý, Thuộc cảng biển | Text | `orgUnitName` (cache), tên cảng |
| 5 | Địa điểm (Tỉnh/TP) | Text | `provinceId` |
| 6 | Thuộc luồng hàng hải | Text | `navigationChannelId` |
| 7 | Thuộc bến phao | Text | `buoyStationId` → BuoyBerth |
| 8 | Phân loại | Text | `classification` |
| 9 | Địa điểm chi tiết | Text | `detailedLocation` |
| 10 | Tình trạng | Badge | `operationalStatus` |
| 11–19 | Thông tin kỹ thuật | Text | `shapeDescription`, `area`, `designWaterDepth`, `currentWaterDepth`, `bottomElevationDesign`, `maxVesselDWT` (#16 DB-parity-only), `activeStormShelterCount`, `publishedStormShelterCount`, `underInvestmentStormShelterCount` |
| 20 | Ghi chú | Text | `remarks` (DB-parity-only) |
| 21–23 | Công bố | Text/Date | `openingAnnouncementDate`, `publicDecision`, `investmentAgreement` |
| 24–29 | Khu nước neo buộc + điểm neo | Bảng con | child tables |
| 28–32 | Vị trí GIS | LongLatTable | |
| 35 | File đính kèm | UploadFileTable | read-only |
| 34–45 | Vận hành & bảo trì | Text read-only | |
| 48–58 | Xử lý & theo dõi | Badge/Text | |

> **Drift:** CSV Storm-shelter để "Xem chi tiết = FALSE" cho toàn bộ TAB1 (khả năng lỗi nhập liệu); code DetailContent vẫn hiển thị các trường này. Cần PMO/SA chốt ma trận chuẩn.

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt.** Chỉ hiển thị `approvalStatus` (7 trạng thái chuẩn) + tracking C1/C2 read-only.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-310-01 | Chỉ xem hồ sơ trong phạm vi đơn vị (data scope). | Read |
| BR-310-02 | Tọa độ hiển thị theo quy tắc (mặc định DMS). | Read |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-310-01 | User `stormshelter:read`, hồ sơ trong scope | GET `/{id}` | Trả đủ thông tin | Drawer đủ trường |
| AC-310-02 | Hồ sơ ngoài scope | GET | Không trả (filter) | Không thấy bản ghi |
| AC-310-03 | Thiếu `stormshelter:read` | GET | 403; UI ẩn nút Xem | Permission khớp |

### 4.3. User Stories

- **US-310-01:** Là Chuyên viên, tôi muốn xem chi tiết hồ sơ Khu tránh trú bão (thông tin + GIS + file + lịch sử).
- **US-310-02:** Là Admin Cục, tôi muốn xem thêm metadata người tạo/người sửa/thời gian.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem chi tiết | `stormshelter:read` |

| Vai trò | Xem | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu gán `stormshelter:read`, theo scope | — |
| Lãnh đạo Cảng vụ/Chi cục | Có theo scope | — |
| Lãnh đạo Cục / Admin Cục | Có toàn phạm vi Cục | Xem metadata nhạy cảm |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN |
| Người không có quyền | Không | API 403 |

**Admin Cục:** xem toàn phạm vi Cục khi có `stormshelter:read` hoặc `orgunit:scope_all`/`admin:all`/`*`; xem thêm metadata nhạy cảm.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — 7 trạng thái chuẩn qua `ApprovalStatusBadge`. |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt (chỉ xem). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`; `@Filter` + `@DataScope`. |
| 4 | Trường chỉ hiện trong điều kiện nào | Tab Lịch sử chỉ hiện khi `drawerMode !== 'create'`; #16/#20 DB-parity-only. |
| 5 | Quyền riêng | `stormshelter:read`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Hiển thị danh sách file (read-only). |
| 8 | Giao diện khác mẫu chung | Không — `StormShelterDetailContent.tsx` trong Drawer. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/storm-shelter/{id}` | Chi tiết hồ sơ | `stormshelter:read` |
| GET | `/api/v1/storm-shelter/{id}/children` | Bảng con | `stormshelter:read` |
| GET | `/api/v1/storm-shelter/{id}/attachments` | File đính kèm | `stormshelter:read` |
| GET | `/api/v1/storm-shelter/{id}/history` | Lịch sử | `stormshelter:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Đọc từ `storm_shelter_areas` + `storm_shelter_mooring_water_areas` + `storm_shelter_mooring_water_area_anchor_points` + `infrastructure_attachments` + `infrastructure_history`.
