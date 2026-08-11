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

Cho phép cập nhật thông tin Đài TTDH. Quyền cập nhật phụ thuộc trạng thái hiện tại (R7, R10, R11):

| Trạng thái | Được Sửa? | Ghi chú |
|-----------|:---:|---------|
| Lưu tạm | ✅ | Sửa tất cả trừ mã đài |
| Chờ duyệt cấp CC | ❌ | Khóa hoàn toàn (R11) |
| Từ chối cấp CC | ✅ | Sửa & gửi lại (R15) |
| Chờ duyệt cấp Cục | ❌ | Khóa hoàn toàn (R11) |
| Từ chối cấp Cục | ✅ | Sửa & gửi lại (R15) |
| Đã phê duyệt | ✅ | Sửa → tự về Lưu tạm (R10) |
| Lịch sử | ❌ | Read-only (F-094) |

**Ràng buộc đặc biệt:**
- **Mã đài (code):** immutable — không thể sửa (R2).
- **Đơn vị quản lý (unitId):** bị khóa khi sửa — không thể thay đổi (R5).
- **Sửa Đã phê duyệt:** trạng thái tự động quay về "Lưu tạm", cần duyệt lại (R10).

### 1.2. Tại sao cần?

Thông tin đài thay đổi theo thời gian (nâng cấp, thay đổi dịch vụ, điều chỉnh phân loại). Cần cập nhật kịp thời và có kiểm soát qua luồng phê duyệt.

### 1.3. Luồng chính

Người dùng chọn "Sửa" từ dropdown → Modal hiển thị dữ liệu hiện tại → Chỉnh sửa (code, unitId bị disable) → Nhấn Lưu tạm hoặc Lưu và gửi phê duyệt → Validate → HTTP 200/400.

---

## 2. Ai dùng?

### 2.1. Phân quyền

| Vai trò | Quyền sửa | Phạm vi |
|---|---|---|
| Cấp Cục | Mọi bản ghi (Lưu tạm/Từ chối/Đã phê duyệt) | Toàn quốc (R13) |
| Cấp Cảng vụ/Chi cục | Bản ghi đơn vị mình (Lưu tạm/Từ chối/Đã phê duyệt) | Đơn vị mình (R12) |
| Cán bộ | Bản ghi đơn vị mình | Đơn vị mình |

### 2.2. Admin Cục

Xem full + thông tin người sửa, thời gian sửa.

---

## 3. User Stories

- **US-093-01:** Là Cán bộ, tôi muốn sửa Đài TTDH ở trạng thái Lưu tạm/Từ chối.
- **US-093-02:** Là Cán bộ, tôi muốn sửa Đài đã phê duyệt, hệ thống tự đưa về Lưu tạm (R10).
- **US-093-03:** Là Cán bộ, tôi muốn Đơn vị quản lý bị khóa khi sửa (R5).
- **US-093-04:** Là Cán bộ, tôi muốn thay đổi dịch vụ và tọa độ của đài.

---

## 4. Acceptance Criteria

**AC-093-01 — Sửa thành công:** Sửa thông tin hợp lệ → cập nhật, ghi lịch sử UPDATE, HTTP 200.

**AC-093-02 — Code immutable:** Code bị disable, không thể sửa.

**AC-093-03 — UnitId bị khóa:** UnitId bị disable khi sửa (R5).

**AC-093-04 — Sửa Đã phê duyệt → Lưu tạm:** Khi sửa bản ghi Đã phê duyệt, status tự động về Lưu tạm (R10).

**AC-093-05 — Từ chối sửa Chờ duyệt:** Bản ghi Chờ duyệt (bất kỳ cấp) → từ chối sửa, HTTP 400 (R11).

**AC-093-06 — Gửi lại từ Từ chối:** Sửa + gửi duyệt từ Từ chối → status về Chờ duyệt CC (R17).

---

## 5. Business Rules

| ID | Rule | Source |
|----|------|--------|
| BR-093-01 | Chỉ sửa khi: Lưu tạm, Từ chối CC, Từ chối Cục, Đã phê duyệt. Lịch sử: không thể sửa. | R7, F-094 |
| BR-093-02 | Đơn vị quản lý bị khóa khi sửa | R5 |
| BR-093-03 | Sửa Đã phê duyệt → tự về Lưu tạm | R10 |
| BR-093-04 | Chờ duyệt bị khóa hoàn toàn | R11 |
| BR-093-05 | Gửi duyệt lại từ Từ chối → về Chờ duyệt CC | R17 |

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

Modal như F-092, dữ liệu điền sẵn. Code và unitId hiển thị disabled (nền xám). Nút: Lưu tạm, Lưu và gửi phê duyệt. Nếu sửa từ Đã phê duyệt: hiển thị cảnh báo "Bản ghi sẽ quay về trạng thái Lưu tạm và cần được duyệt lại".

### 8.2. Ghi lịch sử

So sánh diff từng trường, ghi changedField/previousValue/newValue.

---

## 9. NFRs

Performance < 500ms. Transaction atomic. Audit log. RBAC.

---

## 10. UI

Như F-092. Code, unitId: Input disabled, màu `textTertiary`, nền xám nhạt. Cảnh báo khi sửa Đã phê duyệt: Alert màu `statusAttention`.
