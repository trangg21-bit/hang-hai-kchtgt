---
id: F-046
name: Quản lý Đê/kè - Xóa
slug: quan-ly-de-ke-xoa
module-id: M-003
status: proposed
classification: local
priority: medium
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-10T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Đê/kè - Xóa

**Tài liệu:** BA Feature Brief
**Feature:** F-046
**Module:** M-003 — Quản lý tài sản KCHTGT - Khu nước & VTS
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-10

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép người dùng có thẩm quyền xóa mềm (soft delete) một công trình đê/kè khỏi hệ thống. Công trình bị xóa sẽ không hiển thị trong danh sách mặc định và không thể tham chiếu từ các module khác. Dữ liệu vẫn được lưu trong database để phục vụ kiểm toán.

### 1.2. Tại sao cần tính năng này?

Công trình đê/kè có thể bị phá dỡ, thay thế hoặc nhập sai thông tin cần hủy bỏ. Cơ chế xóa mềm đảm bảo:
- Dữ liệu lịch sử không bị mất, phục vụ kiểm toán và báo cáo
- Các bản ghi liên quan (lịch sử phê duyệt, file đính kèm) được giữ nguyên
- Có thể khôi phục nếu cần (trong tương lai)

### 1.3. Luồng hoạt động chính

1. Người dùng vào danh sách Đê/kè.
2. Chọn công trình và nhấn **"Xóa"** (chỉ hiển thị với bản ghi PROPOSED).
3. Hệ thống hiển thị popup xác nhận: "Bạn có chắc chắn muốn xóa công trình [tên]?"
4. Người dùng xác nhận. Hệ thống gọi API DELETE.
5. Bản ghi được đánh dấu `isDeleted = true`, `deletedAt = now`, `deletedBy = userId`.
6. ApprovalHistory ghi nhận XOA_MEM.
7. Hiển thị thông báo "Xóa đê kè thành công". Bản ghi biến mất khỏi danh sách mặc định.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền (xem chi tiết tại tính năng Phân quyền).

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-046-01:** Là Chuyên viên, tôi muốn xóa công trình đê/kè ở trạng thái "Lưu tạm" do tôi tạo sai để dọn dẹp dữ liệu.
- **US-046-02:** Là Cục trưởng, tôi muốn xóa bất kỳ công trình PROPOSED nào trong toàn hệ thống để quản lý dữ liệu.

### Mức Should (nên có)

- **US-046-03:** Là Chuyên viên, tôi muốn nhận popup xác nhận trước khi xóa để tránh thao tác nhầm.
- **US-046-04:** Là Chuyên viên, tôi muốn dữ liệu đã xóa không hiển thị trong danh sách mặc định nhưng vẫn có thể tra cứu khi cần.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-046-01 — Xóa thành công bản ghi PROPOSED:** Người dùng có quyền, bản ghi PROPOSED cùng đơn vị. Nhấn Xóa → xác nhận. Bản ghi được soft delete: `isDeleted = true`, `deletedAt = now`. ApprovalHistory ghi XOA_MEM. Thông báo "Xóa đê kè thành công". Bản ghi không còn hiển thị trong danh sách.

**AC-046-02 — Không cho xóa bản ghi không phải PROPOSED:** Người dùng cố xóa bản ghi UNDER_REVIEW, APPROVED hoặc REJECTED. Nút "Xóa" bị ẩn. Gọi API trực tiếp → lỗi "Chỉ có thể xóa bản ghi ở trạng thái Lưu tạm".

**AC-046-03 — Điều kiện hiển thị nút Xóa:** Nút "Xóa" chỉ hiển thị khi:
- Bản ghi PROPOSED + (Cấp Cục) hoặc (cùng đơn vị quản lý)
Trường hợp khác: nút bị ẩn.

**AC-046-04 — Popup xác nhận:** Khi nhấn Xóa, hiển thị popup: "Bạn có chắc chắn muốn xóa công trình [tên]? Thao tác này không thể hoàn tác." Có 2 nút: "Hủy" và "Xóa".

**AC-046-05 — Không có quyền:** Người dùng không có quyền `dikerevetment:delete`. Nút "Xóa" bị ẩn. Gọi API → 403.

**AC-046-06 — Xóa Cấp Cục:** Cục trưởng có thể xóa bất kỳ bản ghi PROPOSED nào, không giới hạn đơn vị.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-046-01 — Chỉ xóa PROPOSED:** Chỉ bản ghi ở trạng thái PROPOSED (chưa duyệt) mới có thể bị xóa. Bản ghi đã APPROVED cần quy trình hủy riêng, không xóa trực tiếp.

**BR-046-02 — Xóa mềm, không xóa cứng:** Dữ liệu không bị xóa vật lý khỏi database. Chỉ đánh dấu `isDeleted = true`. Các bảng liên quan (attachment, approvalHistory) được giữ nguyên.

**BR-046-03 — Ghi lịch sử:** Thao tác xóa được ghi vào `dike_revetment_approval_history` với actionType = XOA_MEM.

**BR-046-04 — Không xóa cascade:** Khi xóa đê/kè, không tự động xóa các bản ghi liên quan ở module khác. Nếu đê/kè đã được gắn tài sản hoặc có dữ liệu vận hành, cần xử lý riêng trước khi xóa.

---

## 6. Vòng đời và liên kết

| Feature | Vai trò | Mối liên kết |
|---|---|---|
| **F-044** | Tạo mới | F-046 xóa bản ghi được tạo từ F-044 (chỉ khi PROPOSED) |
| **F-045** | Cập nhật | Không thể xóa sau khi đã sửa và gửi duyệt |
| **F-049** | Lịch sử | Ghi nhận thao tác xóa |

---

## 7. Mô hình dữ liệu

Sử dụng bảng `dike_revetment`. Các trường liên quan đến xóa:

- **isDeleted:** boolean, mặc định false, set true khi xóa
- **deletedAt:** timestamp, thời điểm xóa
- **deletedBy:** UUID, người thực hiện xóa

---

## 8. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| DELETE | `/api/v1/dike-revetment/{id}` | Xóa mềm đê/kè | `dikerevetment:delete` |

---

## 9. Chi tiết nghiệp vụ

### 9.1. Popup xác nhận xóa

Khi nhấn nút "Xóa" trên danh sách:

- Tiêu đề: "Xác nhận xóa"
- Nội dung: "Bạn có chắc chắn muốn xóa công trình **{tên}**? Thao tác này không thể hoàn tác."
- Nút "Hủy" (textSecondary): đóng popup
- Nút "Xóa" (màu đỏ): thực hiện xóa

---

## 10. Yêu cầu phi chức năng

- Xác nhận xóa hiển thị trong ≤ 200ms
- API xóa phản hồi ≤ 500ms
- Bản ghi đã xóa vẫn truy vết được qua lịch sử (F-049)
- Không ảnh hưởng đến dữ liệu module khác
