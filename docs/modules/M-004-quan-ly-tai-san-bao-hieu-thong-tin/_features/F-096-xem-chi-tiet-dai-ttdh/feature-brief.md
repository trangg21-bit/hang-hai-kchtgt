---
id: F-096
name: Xem chi tiết Đài TTDH
slug: xem-chi-tiet-dai-ttdh
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:57Z
last-updated: 2026-08-11
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem chi tiết Đài TTDH

**Tài liệu:** BA Feature Brief | **Feature:** F-096 | **Mã chức năng:** TCKC-031 | **Ngày:** 2026-08-11

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Hiển thị toàn bộ thông tin chi tiết của một Đài TTDH, bao gồm: thông tin chung, GIS (bảng tọa độ, loại đối tượng, biểu tượng), dịch vụ, file đính kèm, tình trạng, trạng thái phê duyệt. **Không hiển thị** các trường bị ẩn (tần số liên lạc, transmitPower, equipmentType).

### 1.2. Luồng

Chọn "Xem chi tiết" → GET /{id} → Modal/Drawer hiển thị đầy đủ thông tin → HTTP 200. Không tìm thấy → HTTP 404.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Cơ chế phân quyền

Xem chi tiết Đài TTDH dùng chung cơ chế `PermissionMiddleware` — kiểm tra permission `data:read` theo từng tài khoản người dùng.

| Vai trò | Permission | Ghi chú |
|---|---|---|
| ROLE_SYSTEM_ADMIN | *(bypass)* | Xem toàn bộ + audit fields |
| ROLE_ADMIN | `data:read` | Xem + audit fields |
| ROLE_LEADER | `data:read` | Xem thông tin chung |
| ROLE_SPECIALIST | `data:read` | Xem thông tin chung |
| ROLE_PORT_OPERATOR | `data:read` | Xem thông tin chung |
| ROLE_PUBLIC_USER | `data:read` | Xem thông tin chung |
| ROLE_INTEGRATION | `data:read` | Xem qua API |
| ROLE_SECURITY_MONITOR | *(không có `data:*`)* | Không có quyền |

- **Admin Cục (ROLE_ADMIN, ROLE_SYSTEM_ADMIN):** xem thêm audit fields (người tạo, thời gian tạo, người sửa, thời gian sửa).

> Xem F-092 section 2.1 để biết đầy đủ cơ chế PermissionMiddleware và ánh xạ vai trò → permission.

---

## 3. User Stories

- **US-096-01:** Là người dùng, tôi muốn xem toàn bộ thông tin Đài TTDH.
- **US-096-02:** Là Lãnh đạo, tôi muốn xem Phân loại đài và trạng thái phê duyệt.
- **US-096-03:** Là Admin Cục, tôi muốn xem thông tin kiểm toán.

---

## 4. Acceptance Criteria

**AC-096-01 — Xem chi tiết:** GET /{id} → HTTP 200, đầy đủ thông tin (trừ trường ẩn).

**AC-096-02 — Badge trạng thái:** 7 trạng thái hiển thị badge màu: Lưu tạm (xám nhạt), Chờ duyệt CC (vàng), Từ chối CC (đỏ), Chờ duyệt Cục (vàng), Từ chối Cục (đỏ), Đã phê duyệt (xanh lá), Lịch sử (xám đậm).

**AC-096-03 — Badge phân loại:** Loại I→V hiển thị dạng badge.

**AC-096-04 — Dịch vụ:** Hiển thị danh sách dịch vụ đã chọn dạng tag.

**AC-096-05 — Tọa độ:** Hiển thị bảng danh sách tọa độ.

**AC-096-06 — File đính kèm:** Hiển thị danh sách file với link download.

**AC-096-07 — Ẩn trường:** Không hiển thị frequencyBand, transmitPower, equipmentType.

**AC-096-08 — Không tìm thấy:** HTTP 404 "Không tìm thấy Đài TTDH".

---

## 5. Business Rules

| ID | Rule |
|----|------|
| BR-096-01 | Badge trạng thái màu: Lưu tạm=xám nhạt, Chờ duyệt=vàng, Từ chối=đỏ, Đã phê duyệt=xanh, Lịch sử=xám đậm (dark gray) |
| BR-096-02 | Đơn vị quản lý/khai thác resolve tên qua OrgUnitCacheService |
| BR-096-03 | Audit fields chỉ hiển thị cho Admin Cục |

---

## 6. Mô hình dữ liệu

Đọc toàn bộ coastal_station_vts + JOIN coordinates + JOIN attachments. Không thay đổi schema.

---

## 7. API

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/stations/coastal/{id}` | Xem chi tiết |

---

## 8. Chi tiết

### Bố cục:

**Section 1 — Thông tin chung:** Mã đài, Tên đài, Phân loại (badge), Tình trạng (badge), Trạng thái (badge màu), Đơn vị quản lý, Đơn vị khai thác, Địa điểm, Vùng phủ sóng, Ghi chú.

**Section 2 — Dịch vụ:** Danh sách tag các dịch vụ đã chọn.

**Section 3 — GIS:** Loại đối tượng, Hệ quy chiếu, Quy tắc hiển thị, Biểu tượng. Bảng tọa độ (STT, Vĩ độ, Kinh độ).

**Section 4 — File đính kèm:** Danh sách file (tên, dung lượng, ngày upload, link tải).

**Section 5 — Phê duyệt:** Cấp phê duyệt, Người duyệt, Ngày duyệt, Lý do từ chối (nếu có), Nội dung phê duyệt.

**Section 6 — Kiểm toán (chỉ Admin Cục):** Người tạo, Ngày tạo, Người sửa, Ngày sửa.

---

## 9. NFRs

Performance < 200ms. Cache unit names. XSS-safe.

---

## 10. UI

Modal/Drawer, width 800px. Dùng `badgeBaseStyle` cho tất cả badge. Dùng `cardStyle` cho từng section. Dùng `metaStyle` cho thời gian. Màu badge: Lưu tạm/Chờ duyệt=`statusAttention`, Từ chối=`statusCritical`, Đã phê duyệt=`statusOperational`, Lịch sử=`textTertiary` (dark gray).
