---
id: F-057
name: "Quản lý Trạm radar - Cập nhật"
slug: quan-ly-tram-radar-cap-nhat
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-30T00:00:00Z"
last-updated: "2026-08-07T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Trạm radar - Cập nhật

**Tài liệu:** BA Feature Brief
**Feature:** F-057
**Module:** M-003 — Quản lý tài sản KCHTGT - Khu nước & VTS
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-07

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép người dùng có thẩm quyền chỉnh sửa thông tin của một Trạm radar đã tồn tại. **Form và trường dữ liệu giống hệt form Tạo mới (F-056)**, chỉ khác ở các điểm dưới đây.

### 1.2. Luồng hoạt động chính

1. Người dùng chọn một trạm radar từ danh sách → click "Sửa".
2. Hệ thống gọi GET detail để load toàn bộ dữ liệu hiện tại, điền sẵn vào form.
3. Người dùng chỉnh sửa các trường được phép.
4. Người dùng chọn một trong ba hành động lưu (giống F-056).
5. Sau khi cập nhật, trạng thái phê duyệt quay về `PROPOSED` → cần duyệt lại.

---

## 2. Khác biệt so với Tạo mới (F-056)

> Tham khảo đầy đủ các trường, validation, và UI tại tài liệu F-056. Dưới đây chỉ liệt kê các điểm **khác biệt**.

### 2.1. Trường bị khóa (disabled/read-only)

| Trường | Trạng thái | Lý do |
|---|---|---|
| Đơn vị quản lý | **Disabled** | Không được thay đổi đơn vị quản lý sau khi tạo |
| Mã radar | **Disabled** (hiển thị) | Mã là định danh duy nhất, không thể sửa |

### 2.2. Dữ liệu khởi tạo

- **Tạo mới:** Form mở với tất cả trường rỗng.
- **Cập nhật:** Form được điền sẵn toàn bộ dữ liệu hiện tại từ API `GET /api/v1/radar-station/:id`.

### 2.3. File đính kèm

- **Tạo mới:** Khu vực upload trống, chỉ có nút thêm mới.
- **Cập nhật:** Hiển thị danh sách file đã upload trước đó. Có thể thêm file mới hoặc xóa file cũ.

### 2.4. Nút hành động

| Tạo mới (F-056) | Cập nhật (F-057) |
|---|---|
| "Lưu tạm" | "Cập nhật" |
| "Lưu và gửi phê duyệt" | "Cập nhật và gửi phê duyệt" |
| "Lưu và phê duyệt" | "Cập nhật và phê duyệt" |

### 2.5. API

| | Tạo mới | Cập nhật |
|---|---|---|
| Method | `POST` | `PUT` |
| Endpoint | `/api/v1/radar-station?action=...` | `/api/v1/radar-station/:id?action=...` |
| Load dữ liệu | Không cần | `GET /api/v1/radar-station/:id` |

---

## 3. Quy tắc nghiệp vụ bổ sung (so với F-056)

**BR-057-01 — Chỉ user cùng đơn vị mới được sửa:** Chỉ người dùng thuộc đúng `orgUnitId` của trạm radar mới có quyền chỉnh sửa. Backend kiểm tra `orgUnitId` của user khớp với `orgUnitId` của trạm radar.

**BR-057-02 — Sửa xong phải duyệt lại:** Sau khi cập nhật, `approvalStatus` tự động quay về `PROPOSED`. Trạm radar đang ở trạng thái `APPROVED` mà bị sửa sẽ **tạm thời biến mất** khỏi dropdown chọn trạm radar của các module khác cho đến khi được duyệt lại (F-059).

**BR-057-03 — Ghi nhật ký thay đổi:** Mọi lần cập nhật đều tạo bản ghi `ApprovalHistory` ghi lại từng trường bị thay đổi (fieldChanged, oldValue, newValue, changedBy, changedAt).

**BR-057-04 — Cascade ràng buộc khi sửa VTS:** Khi thay đổi `vtsSystemId`, tự động clear `ttdhVtsId`. Khi thay đổi `orgUnitId` (chỉ Admin Cục được phép), tự động clear `cangBienId`, `vtsSystemId`, `ttdhVtsId`.

---

## 4. Vòng đời & liên kết

```mermaid
stateDiagram-v2
    PROPOSED --> PROPOSED: F-057 - Cập nhật (vẫn chờ duyệt)
    APPROVED --> PROPOSED: F-057 - Cập nhật (cần duyệt lại)
    REJECTED --> PROPOSED: F-057 - Sửa và gửi lại
```

> ⚠ **Lưu ý cho dev:** Trạm radar đã duyệt (`APPROVED`) mà bị sửa → trạng thái quay về `PROPOSED` → **tạm thời không khả dụng** trong dropdown của module khác (Bản đồ, Quản lý tài sản, Vận hành, Bảo trì...) cho đến khi được duyệt lại qua F-059.

### Các tính năng liên quan

| Feature | Liên kết |
|---|---|
| **F-056** | Form giống hệt — tham khảo toàn bộ trường, validation, UI |
| **F-059** | Sau khi cập nhật, cần phê duyệt lại |
| **F-060** | Xem chi tiết — có nút "Chỉnh sửa" điều hướng đến F-057 |
| **F-061** | Lịch sử thay đổi — ghi nhận mọi lần cập nhật |

---

## 5. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/radar-station/:id` | Load dữ liệu hiện tại để điền sẵn vào form | `radarstation:read` |
| PUT | `/api/v1/radar-station/:id?action=LUU_TAM` | Cập nhật (không gửi duyệt) | `radarstation:update` |
| PUT | `/api/v1/radar-station/:id?action=LUU_VA_GUI_PHE_DUYET` | Cập nhật và gửi duyệt | `radarstation:update` |
| PUT | `/api/v1/radar-station/:id?action=LUU_VA_PHE_DUYET` | Cập nhật và phê duyệt ngay (Admin/Lãnh đạo) | `radarstation:update` |

---

## 6. Yêu cầu giao diện người dùng

### 6.1. Màn hình Cập nhật Trạm radar

Màn hình dùng chung component `FormCrud` với `formMode=EDIT`. **Bố cục, màu sắc, collapsible giống hệt F-056.** Các điểm khác biệt:

1. **ScreenHeader:** "Khu nước & VTS > Quản lý Trạm radar > Sửa: [tên trạm radar]".

2. **Form fields pre-filled:** Toàn bộ trường được điền sẵn từ API detail. Các trường bị khóa (đơn vị quản lý, mã radar) hiển thị disabled.

3. **File đính kèm:** Hiển thị file đã upload + cho phép thêm/xóa.

4. **Form actions:**
   - Nút **"Cập nhật"** (textSecondary, pill outline) — Lưu không gửi duyệt
   - Nút **"Cập nhật và gửi phê duyệt"** (actionPrimary, pill) — **Hành động chính**
   - Nút **"Cập nhật và phê duyệt"** (actionPrimary, pill) — Chỉ Admin/Lãnh đạo
   - Nút **"Hủy"** (textSecondary, pill outline) — Quay về danh sách

---

*Tham khảo toàn bộ trường dữ liệu, validation, mô hình dữ liệu, phi chức năng, và UI chi tiết tại tài liệu F-056.*
