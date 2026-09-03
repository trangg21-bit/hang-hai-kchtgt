---
id: F-316
name: "Xem chi tiết Khu neo đậu"
slug: xem-chi-tiet-khu-neo-dau
module-id: M-1025
status: proposed
classification: local
priority: medium
created: "2026-08-28T06:26:04Z"
last-updated: "2026-08-28T06:26:04Z"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xem chi tiết Khu neo đậu

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7 section).
**Chức năng:** F-316 — Xem chi tiết Khu neo đậu (Anchorage).
**Module:** M-1025 — Quản lý khu nước KCHTGT.
**Loại:** chức năng thường (không có bước phê duyệt).
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md`; Excel sheet "Khu neo đậu"; entity `Anchorage` + bảng con.

## 1. Mô tả ngắn

Chức năng cho phép người dùng có `anchorage:read` mở Drawer "Chi tiết thông tin" của hồ sơ Khu neo đậu — read-only, 5 tab: thông tin chung (kèm Thuộc luồng hàng hải, Thuộc bến phao) + kỹ thuật + công bố; Vị trí (GIS) với bảng tọa độ DMS; File đính kèm; Vận hành & bảo trì; Lịch sử & Phê duyệt.

## 2. Trường dữ liệu

| # | Trường | Kiểu hiển thị | Ghi chú |
|---|---|---|---|
| 1–2 | Mã, Tên khu neo đậu | Text | `anchorageCode`, `anchorageName` |
| 3–4 | Đơn vị quản lý, Thuộc cảng biển | Text | `orgUnitName` (cache), tên cảng |
| 5 | Thuộc luồng hàng hải | Text | `navigationChannelId` |
| 6 | Thuộc bến phao | Text | `buoyStationId` → BuoyBerth |
| 7 | Địa điểm (Tỉnh/TP) | Text | `provinceId` |
| 8 | Địa điểm chi tiết | Text | `detailedLocation` |
| 9 | Tình trạng | Badge | `operationalStatus` |
| 10–19 | Thông tin kỹ thuật | Text | `shapeDescription`, `area`, `designWaterDepth`, `currentWaterDepth`, `bottomElevationDesign`, `maxVesselDWT`, `activeAnchorageCount`, `publishedAnchorageCount`, `underInvestmentAnchorageCount`, `remarks` |
| 20–22 | Công bố | Text/Date | `openingAnnouncementDate`, `publicDecision`, `investmentAgreement` |
| 23–28 | Khu nước neo buộc + điểm neo | Bảng con | `mooring_water_areas` + `mooring_water_area_anchor_points` |
| 27–31 | Vị trí GIS | LongLatTable | |
| 34 | File đính kèm | UploadFileTable | read-only |
| 33–44 | Vận hành & bảo trì | Text read-only | |
| 47–57 | Xử lý & theo dõi | Badge/Text | |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt.** Chỉ hiển thị `approvalStatus` (7 trạng thái chuẩn) + tracking C1/C2 read-only.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-316-01 | Chỉ xem hồ sơ trong phạm vi đơn vị (data scope). | Read |
| BR-316-02 | Tọa độ hiển thị theo quy tắc (mặc định DMS). | Read |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-316-01 | User `anchorage:read`, hồ sơ trong scope | GET `/{id}` | Trả đủ thông tin | Drawer đủ trường |
| AC-316-02 | Hồ sơ ngoài scope | GET | Không trả (filter) | Không thấy bản ghi |
| AC-316-03 | Thiếu `anchorage:read` | GET | 403; UI ẩn nút Xem | Permission khớp |

### 4.3. User Stories

- **US-316-01:** Là Chuyên viên, tôi muốn xem chi tiết hồ sơ Khu neo đậu (thông tin + GIS + file + lịch sử).
- **US-316-02:** Là Admin Cục, tôi muốn xem thêm metadata người tạo/người sửa/thời gian.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem chi tiết | `anchorage:read` |

| Vai trò | Xem | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu gán `anchorage:read`, theo scope | — |
| Lãnh đạo Cảng vụ/Chi cục | Có theo scope | — |
| Lãnh đạo Cục / Admin Cục | Có toàn phạm vi Cục | Xem metadata nhạy cảm |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN |
| Người không có quyền | Không | API 403 |

**Admin Cục:** xem toàn phạm vi Cục khi có `anchorage:read` hoặc `orgunit:scope_all`/`admin:all`/`*`; xem thêm metadata nhạy cảm.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — 7 trạng thái chuẩn qua `ApprovalStatusBadge`. |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt (chỉ xem). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị `orgUnitId`; `@Filter` + `@DataScope`. |
| 4 | Trường chỉ hiện trong điều kiện nào | Tab Lịch sử chỉ hiện khi `drawerMode !== 'create'`. |
| 5 | Quyền riêng | `anchorage:read`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. |
| 7 | Tải lên tệp | Hiển thị danh sách file (read-only). |
| 8 | Giao diện khác mẫu chung | Không — `AnchorageDetailContent.tsx` trong Drawer. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/anchorage/{id}` | Chi tiết hồ sơ | `anchorage:read` |
| GET | `/api/v1/anchorage/{id}/children` | Bảng con | `anchorage:read` |
| GET | `/api/v1/anchorage/{id}/attachments` | File đính kèm | `anchorage:read` |
| GET | `/api/v1/anchorage/{id}/history` | Lịch sử | `anchorage:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT)

Không thay đổi schema. Đọc từ `anchorages` + `mooring_water_areas` + `mooring_water_area_anchor_points` + `infrastructure_attachments` + `infrastructure_history`.
