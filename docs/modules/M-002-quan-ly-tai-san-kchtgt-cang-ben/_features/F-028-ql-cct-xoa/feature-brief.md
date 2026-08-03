---
id: F-028
name: Quản lý Cảng cạn - Xóa
slug: ql-cct-xoa
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng cạn - Xóa

**Tài liệu:** BA Feature Brief
**Feature:** F-028 — Quản lý Cảng cạn - Xóa
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép người dùng có thẩm quyền xóa một Cảng cạn có trạng thái "Lưu tạm" trong danh sách.

Sau khi xóa, Cảng cạn chuyển sang trạng thái **"Lịch sử"** — vẫn hiển thị trong danh sách chính, có thể tra cứu và xem lại thông tin để phục vụ đối chiếu. Ở trạng thái này, không ai được phép chỉnh sửa hay thao tác gì thêm.

### 1.2. Điều kiện được xóa

**Chỉ được xóa Cảng cạn đang ở trạng thái Lưu tạm (NHAP).** Các trạng thái khác (Đang chờ duyệt, Đã duyệt, Từ chối) không được phép xóa. Điều này đảm bảo chỉ những bản ghi chưa hoàn thiện, chưa đưa vào sử dụng mới có thể xóa.

### 1.3. Luồng chính

Từ màn hình Danh sách (F-083), người dùng chọn một Cảng cạn đang ở trạng thái Lưu tạm → bấm "Xóa" → hệ thống hiển thị hộp thoại xác nhận, yêu cầu xác nhận → sau khi xác nhận, trạng thái chuyển thành "Lịch sử" → bản ghi vẫn hiển thị trong danh sách chính với trạng thái Lịch sử, có thể xem lại nhưng không thể chỉnh sửa.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền theo chức năng

Các thao tác trong tính năng được bảo vệ bởi quyền `dryport:delete`. Người dùng chỉ có thể thực hiện khi vai trò của họ được cấp quyền này:

| Vai trò | Quyền xem | Quyền xóa | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin | `dryport:read` | `dryport:delete` nếu được gán | Toàn bộ hệ thống | Xem thêm audit fields |
| admin (Security) | `dryport:read` | `dryport:delete` nếu được gán | Theo đơn vị được phân công | |
| admin-operation | `dryport:read` | `dryport:delete` nếu được gán | Theo đơn vị được phân công | |
| admin | `dryport:read` | `dryport:delete` nếu được gán | Theo đơn vị quản lý | |
| Lãnh đạo | `dryport:read` | Không có quyền xóa | Theo đơn vị được phân công | Chỉ xem |
| Cán bộ | `dryport:read` | `dryport:delete` nếu được gán | Theo đơn vị công tác | |
| Cá nhân | Không có quyền | Không có quyền | Không | Không truy cập được |

> Phân quyền do M-001 quản lý. Cần có quyền `dryport:delete`.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu Cảng cạn, không giới hạn phạm vi đơn vị hay khu vực.
- **Xóa toàn bộ:** Admin Cục được xóa Cảng cạn ở trạng thái NHAP trong mọi đơn vị, không giới hạn.
- **Xem thông tin người tạo:** Admin Cục thấy được `createdBy` (họ tên, tên đăng nhập) của bản ghi.
- **Xem thời gian tạo:** Admin Cục thấy được `createdAt` (timestamp) của bản ghi.
- **Xem thông tin người xóa:** Admin Cục thấy được `deletedBy` (họ tên, tên đăng nhập) của bản ghi đã xóa.

> Các trường audit này chỉ hiển thị với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện.

---

## 3. User Stories

### Must
- **US-028-01:** Là Cán bộ quản lý, tôi muốn xóa một Cảng cạn đang ở trạng thái Lưu tạm (ví dụ: tạo nhầm, không còn nhu cầu) để dọn dẹp dữ liệu.
- **US-028-02:** Là Cán bộ quản lý, tôi muốn được xác nhận trước khi xóa để tránh thao tác nhầm.

### Should
- **US-028-03:** Là Cán bộ quản lý, tôi muốn sau khi xóa vẫn xem lại được thông tin Cảng cạn đã xóa để đối chiếu khi cần.

### Could
- **US-028-04:** Là Admin Cục, tôi muốn xem được ai đã xóa bản ghi và thời điểm xóa.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Hiển thị nút Xóa

**AC-028-01:** Nút "Xóa" chỉ xuất hiện trên danh sách F-083 khi Cảng cạn đang ở trạng thái **Lưu tạm (NHAP)** và người dùng có quyền `dryport:delete`. Các trạng thái khác (PENDING, APPROVED, REJECTED, Lịch sử) không hiển thị nút Xóa.

### Nhóm 2: Xác nhận xóa

**AC-028-02:** Khi bấm "Xóa", hệ thống hiển thị hộp thoại xác nhận gồm: tên Cảng cạn, mã Cảng cạn, cảnh báo không thể hoàn tác, và hai nút [Hủy] [Xác nhận].
**AC-028-03:** Bấm "Hủy" hoặc phím Esc trên hộp thoại xác nhận → đóng hộp thoại, không thực hiện xóa.

### Nhóm 3: Sau khi xóa

**AC-028-04:** Sau khi xác nhận, trạng thái Cảng cạn chuyển thành **"Lịch sử"**. Bản ghi vẫn hiển thị trong danh sách với badge Lịch sử. Hiển thị thông báo "Đã chuyển vào Lịch sử".
**AC-028-05:** Cảng cạn ở trạng thái "Lịch sử" vẫn có thể mở ra xem đầy đủ thông tin, nhưng ở chế độ chỉ xem — không có nút Chỉnh sửa, Xóa, Phê duyệt hay bất kỳ thao tác nào khác.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-028-01 | **Chỉ được xóa bản ghi đang Lưu tạm** — Cảng cạn ở trạng thái NHAP là bản nháp, chưa hoàn thiện, chưa đưa vào sử dụng nên cho phép xóa. Các trạng thái khác (PENDING, APPROVED, REJECTED, Lịch sử) không được xóa vì đã đi vào quy trình hoặc đã được sử dụng. | Danh sách F-083 | Nghiệp vụ |
| BR-028-02 | **Xác nhận trước khi xóa** — Hiển thị hộp thoại xác nhận trước khi thực hiện, tránh thao tác nhầm. | UI | UX |
| BR-028-03 | **Sau xóa, trạng thái thành "Lịch sử"** — Bản ghi không bị xóa vật lý mà chuyển sang trạng thái Lịch sử. Ở trạng thái này, bản ghi chỉ để tra cứu, không thể chỉnh sửa hay thao tác gì thêm. | Backend | Nghiệp vụ |
| BR-028-04 | **Bản ghi Lịch sử là chỉ xem** — Ở trạng thái Lịch sử, mọi nút hành động (Chỉnh sửa, Xóa, Phê duyệt, Gửi phê duyệt) đều bị ẩn. Người dùng chỉ có thể xem thông tin. | UI | Nghiệp vụ |
| BR-028-05 | **Phân quyền xóa** — Chỉ người dùng có quyền `dryport:delete` mới thấy nút Xóa và thực hiện được. | UI + Backend | RBAC |
| BR-028-06 | **Ghi nhận thao tác** — Mọi thao tác xóa được ghi lại: ai xóa, xóa lúc nào, mã Cảng cạn bị xóa để phục vụ kiểm toán. | Backend | Bảo mật |

---

## 6. Mô hình dữ liệu

> Không thêm bảng mới. Sử dụng trường trạng thái có sẵn.

Cảng cạn có thêm trạng thái **"Lịch sử"** bên cạnh các trạng thái hiện có (NHAP, PENDING, APPROVED, REJECTED). Khi chuyển sang Lịch sử, bản ghi vẫn hiển thị trong danh sách chính với badge Lịch sử, ở chế độ chỉ xem.

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| PUT | `/api/v1/dry-ports/{id}/archive` | Chuyển trạng thái Cảng cạn thành "Lịch sử". Chỉ áp dụng cho bản ghi NHAP. | `dryport:delete` |
| GET | `/api/v1/dry-ports/{id}` | Xem chi tiết Cảng cạn, bao gồm cả bản ghi ở trạng thái Lịch sử (chế độ chỉ xem) | `dryport:read` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Khi nào hiển thị nút Xóa

Trên màn hình Danh sách (F-083), nút "Xóa" chỉ xuất hiện khi thỏa mãn đồng thời hai điều kiện:
1. Cảng cạn đang ở trạng thái **Lưu tạm (NHAP)**
2. Người dùng có quyền `dryport:delete`

Với các trạng thái Đang chờ duyệt, Đã duyệt, Từ chối, hoặc Lịch sử, nút Xóa không xuất hiện.

### 8.2. Hộp thoại xác nhận

Khi bấm "Xóa", hệ thống hiển thị hộp thoại gồm:
- Dòng thông báo: "Bạn có chắc chắn muốn xóa cảng cạn **CC-XXXXXX — [Tên]**? Hành động này không thể hoàn tác."
- Nút [Hủy]: đóng hộp thoại, không làm gì
- Nút [Xác nhận]: màu đỏ

### 8.3. Sau khi xóa

- Trạng thái Cảng cạn chuyển thành **"Lịch sử"**
- Bản ghi vẫn hiển thị trong danh sách với badge Lịch sử
- Hiển thị thông báo: "Đã chuyển vào Lịch sử"
- Vẫn có thể tìm và xem lại bản ghi ở chế độ chỉ xem (không sửa được, không thao tác gì thêm)

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** Thao tác xóa hoàn thành ≤1s, không để người dùng chờ đợi
- **Bảo mật:** Chỉ người có quyền `dryport:delete` mới thấy và thực hiện được. Xác nhận trước khi thực hiện để tránh xóa nhầm
- **Độ tin cậy:** Chuyển trạng thái và ghi lịch sử thao tác trong cùng một giao dịch — nếu lỗi thì không có gì thay đổi
- **Truy vết:** Mọi thao tác xóa đều được ghi lại để kiểm toán

---

## 10. Yêu cầu giao diện

> Token từ `theme.ts` + `tokens.ts`. KHÔNG hardcode.

### 10.1. Nút Xóa

- Trong danh sách F-083: nút "Xóa" trong dropdown hành động, chỉ hiện khi đủ điều kiện (NHAP + có quyền `dryport:delete`)
- Màu `statusDanger` (đỏ)

### 10.2. Hộp thoại xác nhận

- **Tiêu đề:** "Xác nhận xóa"
- **Nội dung:** hiển thị mã và tên Cảng cạn, cảnh báo không thể hoàn tác
- **Footer:** [Hủy] outlined + [Xác nhận] `statusDanger`, cả hai `borderRadius: radiusPill`, `height: 40`

### 10.3. Trang chi tiết bản ghi Lịch sử

- Hiển thị đầy đủ 25 trường như F-030
- Badge trạng thái "Lịch sử" (màu `textTertiary`, xám đậm)
- Ẩn toàn bộ nút hành động: không Chỉnh sửa, không Xóa, không Phê duyệt

### 10.4. Phân quyền hiển thị

| Vai trò | Thấy nút Xóa | Ghi chú |
|---|---|---|
| system-admin | Có (nếu được gán `dryport:delete`) | Toàn bộ đơn vị |
| admin (Security) | Có (nếu được gán) | Trong đơn vị được phân công |
| admin-operation | Có (nếu được gán) | Trong đơn vị được phân công |
| admin | Có (nếu được gán) | Trong đơn vị quản lý |
| Lãnh đạo | Không | Chỉ xem |
| Cán bộ | Có (nếu được gán) | Trong đơn vị công tác |
| Admin Cục | Có (nếu được gán) | Toàn bộ đơn vị + xem audit fields |

### 10.5. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Hộp thoại xác nhận thu nhỏ còn 90% chiều rộng
- Nút xếp dọc trong hộp thoại

### 10.6. UX

- Toast `statusOperational` "Đã chuyển vào Lịch sử" sau khi xóa thành công
- Toast `statusDanger` nếu lỗi (không có quyền, sai trạng thái)
- Loading spinner trên nút [Xác nhận] khi đang xử lý

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Backend | Done |
| Frontend | Pending |
