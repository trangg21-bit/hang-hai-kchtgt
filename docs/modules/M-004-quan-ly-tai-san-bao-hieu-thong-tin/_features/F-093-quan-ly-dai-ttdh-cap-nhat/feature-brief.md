---
id: F-093
name: Quản lý Đài TTDH - Cập nhật
slug: quan-ly-dai-ttdh-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:57Z
last-updated: 2026-08-11
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Đài TTDH - Cập nhật

**Tài liệu:** BA Feature Brief
**Feature:** F-093
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Mã chức năng:** QLKC-078
**Ngày cập nhật:** 2026-08-11

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép cập nhật thông tin Đài TTDH. Quyền cập nhật phụ thuộc trạng thái hiện tại và vai trò người dùng:

| Trạng thái | Được Sửa? | Ai sửa? | Nút hiển thị | Kết quả |
|-----------|:---:|---------|------------|--------|
| Lưu tạm | ✅ | Tất cả có quyền | Lưu tạm, Lưu và gửi, Lưu và phê duyệt (Cục) | Giữ Lưu tạm hoặc gửi duyệt |
| Chờ duyệt cấp CC | ❌ | — | — | Khóa hoàn toàn (R11) |
| Từ chối cấp CC | ✅ | Tất cả có quyền | Lưu và gửi, Lưu và phê duyệt (Cục) | Chuyển sang Chờ duyệt CC (R17) |
| Chờ duyệt cấp Cục | ❌ | — | — | Khóa hoàn toàn (R11) |
| Từ chối cấp Cục | ✅ | Tất cả có quyền | Lưu và gửi, Lưu và phê duyệt (Cục) | Chuyển sang Chờ duyệt CC (R17) |
| Đã phê duyệt | ✅ | **Chỉ Cục** | Lưu và phê duyệt | Giữ nguyên Đã phê duyệt |
| Lịch sử | ❌ | — | — | Read-only (F-094) |

**Ràng buộc đặc biệt:**
- **Mã đài (code):** immutable — không thể sửa (R2).
- **Đơn vị quản lý (unitId):** bị khóa khi sửa — không thể thay đổi (R5).
- **Bản ghi Từ chối:** ẩn nút "Lưu tạm", chỉ có "Lưu và gửi phê duyệt" → chuyển thẳng sang Chờ duyệt CC.
- **Bản ghi Đã phê duyệt:** Chỉ Cục được sửa, chỉ có nút "Lưu và phê duyệt" → giữ nguyên trạng thái Đã phê duyệt. Chuyên viên/Cán bộ không được sửa.

### 1.2. Tại sao cần?

Thông tin đài thay đổi theo thời gian (nâng cấp, thay đổi dịch vụ, điều chỉnh phân loại). Cần cập nhật kịp thời và có kiểm soát qua luồng phê duyệt.

### 1.3. Luồng chính

Người dùng chọn "Sửa" từ dropdown → Modal hiển thị dữ liệu hiện tại → Chỉnh sửa (code, unitId bị disable) → Tùy trạng thái và vai trò hiển thị nút tương ứng → Validate → HTTP 200/400.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Cơ chế phân quyền

Cập nhật Đài TTDH dùng chung cơ chế `PermissionMiddleware` — kiểm tra permission `data:update` theo từng tài khoản người dùng.

| Vai trò | Permission | Quyền sửa |
|---|---|---|
| ROLE_SYSTEM_ADMIN | *(bypass)* | Mọi bản ghi, toàn quốc |
| ROLE_ADMIN | `data:update` | Mọi bản ghi, toàn quốc |
| ROLE_SPECIALIST | `data:update` | Bản ghi đơn vị mình |
| ROLE_PORT_OPERATOR | `data:update` | Bản ghi đơn vị mình |

- **Cục (ROLE_ADMIN):** sửa được mọi bản ghi. Khi sửa Đã phê duyệt: chỉ có nút "Lưu và phê duyệt" → giữ nguyên trạng thái Đã phê duyệt.
- **Chuyên viên/Cán bộ (ROLE_SPECIALIST, ROLE_PORT_OPERATOR):** sửa được Lưu tạm và Từ chối. **Không sửa được Đã phê duyệt.** Khi sửa Từ chối: ẩn Lưu tạm, chỉ có Lưu và gửi → Chờ duyệt CC.
- Data scoping lọc theo `orgUnitId`. SYSTEM_ADMIN bypass.
- Admin Cục (ROLE_ADMIN, ROLE_SYSTEM_ADMIN): xem thông tin người sửa, thời gian sửa.

> Xem F-092 section 2.1 để biết đầy đủ cơ chế PermissionMiddleware và ánh xạ vai trò → permission.

---

## 3. User Stories

- **US-093-01:** Là Cán bộ, tôi muốn sửa Đài TTDH ở trạng thái Lưu tạm.
- **US-093-02:** Là Cán bộ, tôi muốn sửa Đài bị Từ chối và gửi duyệt lại (ẩn Lưu tạm, chỉ Lưu và gửi).
- **US-093-03:** Là Cục, tôi muốn sửa Đài đã phê duyệt và lưu ngay không cần duyệt lại.
- **US-093-04:** Là Cán bộ, tôi muốn Đơn vị quản lý bị khóa khi sửa (R5).
- **US-093-05:** Là Cán bộ, tôi muốn thay đổi dịch vụ và tọa độ của đài.

---

## 4. Acceptance Criteria

**AC-093-01 — Sửa thành công:** Sửa thông tin hợp lệ → cập nhật, ghi lịch sử UPDATE, HTTP 200.

**AC-093-02 — Code immutable:** Code bị disable, không thể sửa.

**AC-093-03 — UnitId bị khóa:** UnitId bị disable khi sửa (R5).

**AC-093-04 — Cục sửa Đã phê duyệt:** Cục sửa bản ghi Đã phê duyệt → chỉ có nút "Lưu và phê duyệt" → bản ghi giữ nguyên trạng thái Đã phê duyệt, ghi lịch sử UPDATE. Chuyên viên/Cán bộ không được sửa.

**AC-093-05 — Từ chối sửa Chờ duyệt:** Bản ghi Chờ duyệt (bất kỳ cấp) → từ chối sửa, HTTP 400 (R11).

**AC-093-06 — Gửi lại từ Từ chối:** Sửa + gửi duyệt từ Từ chối → status về Chờ duyệt CC (R17).

---

## 5. Business Rules

| ID | Rule | Source |
|----|------|--------|
| BR-093-01 | Chỉ sửa khi: Lưu tạm, Từ chối CC, Từ chối Cục (tất cả); Đã phê duyệt (chỉ Cục). Lịch sử: không thể sửa. | R7, F-094 |
| BR-093-02 | Đơn vị quản lý bị khóa khi sửa | R5 |
| BR-093-03 | Cục sửa Đã phê duyệt: chỉ nút "Lưu và phê duyệt" → giữ nguyên Đã phê duyệt | — |
| BR-093-04 | Chờ duyệt bị khóa hoàn toàn | R11 |
| BR-093-05 | Gửi duyệt lại từ Từ chối: ẩn Lưu tạm, chỉ Lưu và gửi → về Chờ duyệt CC | R17 |

---

## 6. Mô hình dữ liệu

Các trường có thể sửa: name, stationLevel, provinceId, detailedLocation, operatingUnitId, coverageArea, servicesProvided, usageStatus, remarks, geometryType, mapSymbolId, coordinateSystem, displayRule, coordinates, attachments.

Không thể sửa: code, unitId.

Trường bị ẩn: frequencyBand, transmitPower, equipmentType.

---

## 7. API

| Method | Endpoint | Mô tả |
|---|---|---|
| PUT | `/api/v1/stations/coastal/{id}` | Cập nhật |

---

## 8. Chi tiết

### 8.1. Form sửa

Modal như F-092, dữ liệu điền sẵn. Code và unitId hiển thị disabled. Nút hiển thị theo trạng thái: Lưu tạm (Lưu tạm + Lưu và gửi + Lưu và phê duyệt nếu Cục), Từ chối (ẩn Lưu tạm, chỉ Lưu và gửi + Lưu và phê duyệt nếu Cục), Đã phê duyệt (chỉ Cục, chỉ Lưu và phê duyệt).

### 8.2. Ghi lịch sử

So sánh diff từng trường, ghi changedField/previousValue/newValue.

---

## 9. NFRs

Performance < 500ms. Transaction atomic. Audit log. RBAC.

---

## 10. UI

Như F-092. Code, unitId: Input disabled, màu `textTertiary`, nền xám nhạt. Cảnh báo khi sửa Đã phê duyệt: Alert màu `statusAttention`.
