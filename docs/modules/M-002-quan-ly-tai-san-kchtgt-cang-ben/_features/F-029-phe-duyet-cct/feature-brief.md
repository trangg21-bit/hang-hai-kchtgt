---
id: F-029
name: Phê duyệt Cảng cạn
slug: phe-duyet-cct
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Cảng cạn

**Tài liệu:** BA Feature Brief
**Feature:** F-029 — Phê duyệt Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép người có thẩm quyền (`dryport:approve`) thực hiện **Phê duyệt** hoặc **Từ chối** đối với Cảng cạn đang ở trạng thái **Chờ duyệt (PENDING)**. Thao tác được thực hiện trực tiếp từ danh sách chung (F-083) — trên dòng có trạng thái PENDING sẽ hiển thị nút **Phê duyệt** và **Từ chối**.

Sau khi phê duyệt, Cảng cạn chuyển sang trạng thái **Đã duyệt (APPROVED)** và có thể đưa vào sử dụng. Nếu bị từ chối, trạng thái chuyển thành **Từ chối (REJECTED)**, người tạo có thể sửa lại và gửi duyệt lại.

### 1.2. Tại sao cần?

- Kiểm soát chất lượng dữ liệu trước khi Cảng cạn đi vào hoạt động chính thức
- Đảm bảo mọi Cảng cạn đều được Lãnh đạo xem xét trước khi phê duyệt
- Ghi nhận đầy đủ: ai duyệt, khi nào, lý do từ chối

### 1.3. Luồng chính

Từ danh sách F-083 → dòng có trạng thái PENDING → bấm **"Phê duyệt"** (xác nhận → APPROVED) hoặc **"Từ chối"** (nhập lý do → REJECTED).

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền theo chức năng

Thao tác phê duyệt/từ chối được bảo vệ bởi quyền `dryport:approve`. Người dùng chỉ có thể thực hiện khi vai trò của họ được cấp quyền này:

| Vai trò | Quyền xem | Quyền phê duyệt | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin | `dryport:read` | `dryport:approve` nếu được gán | Toàn bộ hệ thống | |
| admin (Security) | `dryport:read` | `dryport:approve` nếu được gán | Theo đơn vị được phân công | |
| admin-operation | `dryport:read` | `dryport:approve` nếu được gán | Theo đơn vị được phân công | |
| admin | `dryport:read` | `dryport:approve` nếu được gán | Theo đơn vị quản lý | |
| Lãnh đạo | `dryport:read` | `dryport:approve` (thường được gán) | Theo đơn vị được phân công | Vai trò chính thực hiện duyệt |
| Cán bộ | `dryport:read` | Không có quyền | Theo đơn vị công tác | Chỉ tạo và gửi duyệt |
| Cá nhân | Không có quyền | Không có quyền | Không | Không truy cập được |

> Phân quyền do M-001 quản lý. Cần quyền `dryport:approve`.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ Cảng cạn đang chờ duyệt, không giới hạn phạm vi đơn vị hay khu vực.
- **Phê duyệt toàn bộ:** Admin Cục được phê duyệt/từ chối Cảng cạn trong mọi đơn vị.
- **Xem thông tin người tạo:** Admin Cục thấy được `createdBy` (họ tên, tên đăng nhập) của bản ghi.
- **Xem thời gian tạo:** Admin Cục thấy được `createdAt` (timestamp) của bản ghi.
- **Xem thông tin người duyệt:** Admin Cục thấy được người phê duyệt/từ chối trong `approval_logs`.

> Các trường audit này chỉ hiển thị với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện.

---

## 3. User Stories

### Must
- **US-029-01:** Là Lãnh đạo, tôi muốn phê duyệt một Cảng cạn đang chờ duyệt để đưa vào sử dụng chính thức.
- **US-029-02:** Là Lãnh đạo, tôi muốn từ chối một Cảng cạn kèm lý do cụ thể để người tạo biết cần sửa gì.

### Should
- **US-029-03:** Là Lãnh đạo, tôi muốn xem được lý do từ chối trước đó nếu bản ghi đã từng bị từ chối.

### Could
- **US-029-04:** Là Admin Cục, tôi muốn xem được toàn bộ lịch sử phê duyệt/từ chối trên toàn hệ thống.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Phê duyệt

**AC-029-01:** Trên danh sách F-083, dòng có trạng thái PENDING → bấm "Phê duyệt" → hộp thoại xác nhận → xác nhận → trạng thái chuyển thành APPROVED → hiển thị thông báo "Phê duyệt thành công". Nếu không có quyền `dryport:approve` → HTTP 403.

### Nhóm 2: Từ chối

**AC-029-02:** Bấm "Từ chối" → hiển thị ô nhập lý do (bắt buộc, tối thiểu 10 ký tự) → xác nhận → trạng thái chuyển thành REJECTED → hiển thị thông báo "Đã từ chối".
**AC-029-03:** Lý do dưới 10 ký tự → hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự", không cho gửi.

### Nhóm 3: Điều kiện hiển thị

**AC-029-04:** Chỉ PENDING mới hiển thị nút Phê duyệt / Từ chối. Các trạng thái khác (NHAP, APPROVED, REJECTED, Lịch sử) không hiển thị.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-029-01 | **Chỉ PENDING mới được duyệt** — Nút Phê duyệt / Từ chối chỉ xuất hiện trên dòng có trạng thái PENDING. | Danh sách F-083 | Nghiệp vụ |
| BR-029-02 | **Phê duyệt → APPROVED** — Xác nhận phê duyệt, trạng thái chuyển thành Đã duyệt. Ghi nhận người duyệt và thời điểm duyệt vào `approval_logs`. | Backend | Nghiệp vụ |
| BR-029-03 | **Từ chối phải có lý do** — Bắt buộc nhập lý do tối thiểu 10 ký tự. Trạng thái chuyển thành Từ chối. | UI + Backend | Nghiệp vụ |
| BR-029-04 | **Không duyệt lại** — APPROVED và REJECTED không thể duyệt/từ chối lần nữa. Muốn thay đổi phải qua F-027 (Cập nhật → Lưu và phê duyệt). | Backend | Nghiệp vụ |
| BR-029-05 | **Phân quyền** — Cần `dryport:approve` để thấy và thực hiện nút Phê duyệt / Từ chối. | UI + Backend | RBAC |
| BR-029-06 | **Ghi nhận thao tác** — Mọi thao tác phê duyệt/từ chối được ghi vào `approval_logs` để kiểm toán. | Backend | Bảo mật |

---

## 6. Mô hình dữ liệu

> Không thêm bảng mới.

Ghi nhận thao tác phê duyệt/từ chối vào `approval_logs`: người thực hiện, thời điểm, hành động (APPROVE/REJECT), lý do (nếu từ chối).

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/dry-ports/{id}/approve` | Phê duyệt Cảng cạn | `dryport:approve` |
| POST | `/api/v1/dry-ports/{id}/reject?reason=` | Từ chối Cảng cạn (reason ≥ 10 ký tự) | `dryport:approve` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Phê duyệt

Trên danh sách F-083, dòng có trạng thái PENDING → bấm "Phê duyệt" → hộp thoại xác nhận: "Phê duyệt CC-XXXXXX — [Tên]?" → [Hủy] [Xác nhận] → trạng thái chuyển thành APPROVED → thông báo thành công → danh sách tự động làm mới.

### 8.2. Từ chối

Bấm "Từ chối" → hiển thị ô nhập lý do (bắt buộc, tối thiểu 10 ký tự) → [Hủy] [Xác nhận] → trạng thái chuyển thành REJECTED → thông báo "Đã từ chối".

### 8.3. Sau khi phê duyệt/từ chối

- APPROVED: Cảng cạn sẵn sàng đưa vào sử dụng. Nút Phê duyệt/Từ chối biến mất khỏi dòng.
- REJECTED: Người tạo có thể mở F-027 để sửa lại và Lưu và phê duyệt.

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** Thao tác phê duyệt/từ chối hoàn thành ≤1s
- **Bảo mật:** Chỉ người có `dryport:approve` mới thấy và thực hiện được. HTTPS; CSRF
- **Độ tin cậy:** Transaction atomic (cập nhật trạng thái + approval_logs)
- **Truy vết:** Mọi thao tác được ghi lại đầy đủ vào `approval_logs`

---

## 10. Yêu cầu giao diện

> Token từ `theme.ts` + `tokens.ts`. KHÔNG hardcode.

### 10.1. Nút hành động trên danh sách

- **Nút Phê duyệt:** màu `statusOperational` (xanh), hiển thị trên dòng PENDING trong dropdown hành động của F-083
- **Nút Từ chối:** màu `statusDanger` (đỏ), hiển thị trên dòng PENDING
- Cả hai `borderRadius: radiusPill`, `height: 32`

### 10.2. Popup Phê duyệt

- **Tiêu đề:** "Xác nhận phê duyệt"
- **Nội dung:** "Phê duyệt CC-XXXXXX — [Tên cảng cạn]?"
- **Footer:** [Hủy] outlined + [Xác nhận] `statusOperational`

### 10.3. Popup Từ chối

- **Tiêu đề:** "Từ chối phê duyệt"
- **Nội dung:** "CC-XXXXXX — [Tên cảng cạn]" + ô nhập lý do (TextArea, required, min 10 ký tự)
- **Footer:** [Hủy] outlined + [Xác nhận] `statusDanger`
- Nếu < 10 ký tự → lỗi đỏ dưới TextArea: "Lý do từ chối phải có ít nhất 10 ký tự"

### 10.4. Phân quyền hiển thị

| Vai trò | Thấy nút Phê duyệt/Từ chối | Ghi chú |
|---|---|---|
| system-admin | Có (nếu được gán `dryport:approve`) | Toàn bộ đơn vị |
| admin (Security) | Có (nếu được gán) | Trong đơn vị được phân công |
| admin-operation | Có (nếu được gán) | Trong đơn vị được phân công |
| admin | Có (nếu được gán) | Trong đơn vị quản lý |
| Lãnh đạo | Có (thường được gán) | Vai trò duyệt chính |
| Cán bộ | Không | Chỉ tạo và gửi duyệt |
| Admin Cục | Có (nếu được gán) | Toàn bộ đơn vị + xem audit fields |

### 10.5. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Popup thu nhỏ còn 90% chiều rộng
- Nút xếp dọc trong popup

### 10.6. UX

- Toast `statusOperational` "Phê duyệt thành công" sau khi duyệt
- Toast `statusWarning` "Đã từ chối" sau khi từ chối
- Toast `statusDanger` nếu lỗi (403, 409 nếu không phải PENDING)
- Loading spinner trên nút [Xác nhận] khi đang xử lý
- Danh sách F-083 tự động refresh sau khi thao tác thành công

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Backend | Done |
| Frontend | Pending |
