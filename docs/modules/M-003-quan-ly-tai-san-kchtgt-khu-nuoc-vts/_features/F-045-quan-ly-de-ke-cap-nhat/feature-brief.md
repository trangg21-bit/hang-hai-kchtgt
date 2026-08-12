---
id: F-045
name: Quản lý Đê/kè - Cập nhật
slug: quan-ly-de-ke-cap-nhat
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-10T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Đê/kè - Cập nhật

**Tài liệu:** BA Feature Brief
**Feature:** F-045
**Module:** M-003 — Quản lý tài sản KCHTGT - Khu nước & VTS
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-10

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép người dùng có thẩm quyền chỉnh sửa thông tin của một công trình đê/kè đã được tạo trước đó (F-044). Sau khi cập nhật, trạng thái phê duyệt của công trình quay về "Chờ phê duyệt" (PROPOSED) và cần được phê duyệt lại (F-047) trước khi tiếp tục sử dụng.

### 1.2. Tại sao cần tính năng này?

Thông tin về công trình đê/kè có thể thay đổi theo thời gian (gia cố, nâng cấp, thay đổi thông số kỹ thuật sau khảo sát...). Tính năng này đảm bảo dữ liệu luôn được cập nhật chính xác, đồng thời duy trì quy trình phê duyệt để kiểm soát chất lượng thông tin.

### 1.3. Luồng hoạt động chính

1. Người dùng đăng nhập, vào danh sách Đê/kè.
2. Chọn một công trình và nhấn **"Sửa"** (chỉ hiển thị với bản ghi đủ điều kiện).
3. Hệ thống gọi API GET detail, hiển thị form với dữ liệu hiện tại.
4. Một số trường bị khóa (disabled): Đơn vị quản lý, Thuộc cảng biển, Mã đê kè.
5. Người dùng chỉnh sửa các trường được phép và chọn hành động lưu:
   - **"Lưu tạm":** Lưu thay đổi, trạng thái quay về PROPOSED.
   - **"Lưu và gửi phê duyệt":** Lưu và gửi yêu cầu phê duyệt lại.
6. Nếu thành công: Bản ghi được cập nhật, approvalHistory ghi nhận CAP_NHAT, thông báo thành công.
7. Nếu thất bại: Thông báo lỗi hiển thị tại trường tương ứng.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền (xem chi tiết tại tính năng Phân quyền).

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu trên hệ thống, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người chỉnh sửa:** Với mỗi bản ghi, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của dữ liệu (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới bản ghi (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới dữ liệu (timestamp).

> **Ghi chú:** Các trường `người tạo mới`, `thời gian tạo mới`, `người chỉnh sửa`, `thời gian cập nhật` cần được bổ sung vào bảng dữ liệu tương ứng và chỉ hiển thị đối với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-045-01:** Là Chuyên viên, tôi muốn sửa thông tin công trình đê/kè do đơn vị tôi quản lý để cập nhật dữ liệu mới nhất.
- **US-045-02:** Là Chuyên viên, tôi muốn các trường Đơn vị quản lý, Thuộc cảng biển, Mã đê kè bị khóa khi sửa để tránh thay đổi sai thông tin định danh.
- **US-045-03:** Là Chuyên viên, tôi muốn sau khi sửa, công trình quay về trạng thái "Chờ phê duyệt" để được kiểm soát chất lượng trước khi tiếp tục sử dụng.

### Mức Should (nên có)

- **US-045-04:** Là Chuyên viên, tôi muốn form sửa hiển thị dữ liệu hiện tại của công trình để tôi biết cần thay đổi gì.
- **US-045-05:** Là Chuyên viên, tôi muốn nhận thông báo rõ ràng khi cập nhật thành công hoặc thất bại.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-045-01 — Hiển thị form sửa với dữ liệu hiện tại:** Người dùng chọn "Sửa" từ danh sách, hệ thống gọi GET detail và hiển thị form với toàn bộ dữ liệu hiện tại của công trình. Các trường Đơn vị quản lý, Thuộc cảng biển, Mã đê kè ở trạng thái disabled.

**AC-045-02 — Điều kiện hiển thị nút Sửa:** Nút "Sửa" chỉ hiển thị với bản ghi thỏa mãn:
- Trạng thái PROPOSED + cùng đơn vị quản lý (Cấp Cục: tất cả đơn vị)
- Trạng thái REJECTED + cùng đơn vị quản lý
- Trạng thái APPROVED + cùng đơn vị (chỉ Cấp Cục hoặc vai trò đặc biệt)
Trường hợp khác: nút "Sửa" bị ẩn.

**AC-045-03 — Cập nhật PROPOSED thành công:** Chuyên viên sửa bản ghi PROPOSED và chọn "Lưu tạm". Bản ghi được cập nhật, approvalStatus giữ nguyên PROPOSED. ApprovalHistory ghi nhận CAP_NHAT. Thông báo "Cập nhật đê kè thành công".

**AC-045-04 — Cập nhật REJECTED thành công:** Chuyên viên sửa bản ghi REJECTED và chọn "Lưu tạm". Bản ghi được cập nhật, approvalStatus chuyển về PROPOSED. Có thể gửi duyệt lại.

**AC-045-05 — Cập nhật APPROVED (cần duyệt lại):** Người dùng có quyền sửa bản ghi APPROVED. Sau khi sửa, approvalStatus quay về PROPOSED, isApprovedLevel1 = isApprovedLevel2 = false. Công trình cần được phê duyệt lại từ đầu.

**AC-045-06 — Cập nhật & gửi phê duyệt:** Người dùng chọn "Lưu và gửi phê duyệt". Bản ghi được cập nhật và gửi yêu cầu phê duyệt. Hiển thị thông báo "Đã gửi phê duyệt cập nhật đê kè".

**AC-045-07 — Validation khi sửa:** Các trường bắt buộc (Tên, Địa điểm, Loại kết cấu, Chiều dài, Tình trạng) vẫn được validate khi sửa. Thiếu trường → lỗi, chặn submit.

**AC-045-08 — Không có quyền sửa:** Người dùng không có quyền `dikerevetment:update` hoặc bản ghi không đủ điều kiện. Nút "Sửa" bị ẩn. Gọi API trực tiếp → 403 Forbidden.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-045-01 — Khóa trường định danh khi sửa:** Các trường `orgUnitId` (Đơn vị quản lý), `cangBienId` (Thuộc cảng biển), `ma` (Mã đê kè) bị disabled khi sửa. Không thể thay đổi sau khi tạo.

**BR-045-02 — Sửa APPROVED → duyệt lại:** Khi sửa bản ghi đã APPROVED, approvalStatus quay về PROPOSED và isApprovedLevel1/2 reset về false. Công trình phải được phê duyệt lại toàn bộ (2 cấp).

**BR-045-03 — Ghi lịch sử thay đổi:** Mọi thao tác sửa đều được ghi vào `dike_revetment_approval_history` với actionType = CAP_NHAT. Lịch sử bao gồm: mã đê/kè, người sửa, thời gian sửa.

**BR-045-04 — Validation giống tạo mới:** Các quy tắc validation khi sửa giống hệt khi tạo mới (F-044): tên bắt buộc, chiều dài > 0, v.v. Xem BR-044-01, BR-044-02.

---

## 6. Vòng đời và liên kết

> ⚠ **QUAN TRỌNG CHO DEVELOPER:** F-045 là bước trung gian trong vòng đời. Sau khi sửa, công trình LUÔN quay về PROPOSED và cần duyệt lại (F-047). Xem sơ đồ vòng đời đầy đủ tại F-044 mục 6.1.

### 6.1. Các tính năng liên quan

| Feature | Vai trò | Mối liên kết |
|---|---|---|
| **F-044** | Tạo mới | F-045 sửa bản ghi được tạo từ F-044 |
| **F-047** | Phê duyệt | Sau khi sửa, phải duyệt lại qua F-047 |
| **F-048** | Xem chi tiết | Dùng chung form detail |
| **F-049** | Lịch sử | Ghi nhận mọi thao tác sửa |

---

## 7. Mô hình dữ liệu

Sử dụng cùng bảng `dike_revetment` như F-044. Không có trường mới.

Trường `updatedBy`, `updatedAt` được tự động cập nhật khi sửa.

---

## 8. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/dike-revetment/{id}` | Lấy chi tiết đê/kè (để hiển thị form sửa) | `dikerevetment:read` |
| PUT | `/api/v1/dike-revetment/{id}` | Cập nhật đê/kè | `dikerevetment:update` |

**Request Body (cập nhật):** giống POST F-044, ngoại trừ `orgUnitId`, `cangBienId`, `ma` bị bỏ qua (server không nhận từ client khi update).

---

## 9. Chi tiết nghiệp vụ

### 9.1. Form Sửa Đê/kè

Form sửa dùng chung component với form tạo mới (F-044), khác biệt:

- Dữ liệu được load sẵn từ GET detail
- Các trường bị disabled: `orgUnitId`, `cangBienId`, `ma`
- Nút hành động: "Lưu tạm", "Lưu và gửi phê duyệt"
- **Không** có nút "Lưu và phê duyệt" khi sửa (chỉ có khi tạo mới)

### 9.2. Nút hành động

| Nút | Trạng thái sau lưu | Mô tả |
|-----|-------------------|-------|
| **Lưu tạm** | PROPOSED | Lưu thay đổi, chưa gửi duyệt. Có thể sửa tiếp hoặc gửi duyệt sau. |
| **Lưu và gửi phê duyệt** | PROPOSED + gửi notify | Lưu và gửi yêu cầu phê duyệt lại. Công trình xuất hiện trong danh sách chờ duyệt (F-047). |
| **Hủy** | — | Hủy thao tác, quay về danh sách. Không lưu thay đổi. |

---

## 10. Yêu cầu phi chức năng

### 10.1. Hiệu năng

- Load dữ liệu form sửa (GET detail) ≤ 1 giây
- Lưu cập nhật phản hồi ≤ 1 giây

### 10.2. Bảo mật

- Kiểm tra quyền `dikerevetment:update` + điều kiện đơn vị trước khi cho sửa
- Chống mass-assignment: `orgUnitId`, `cangBienId`, `ma`, `approvalStatus` không nhận từ client khi update
- `updatedBy` lấy từ token, không nhận từ client

### 10.3. Trải nghiệm người dùng

- Form sửa hiển thị rõ ràng trường nào đang bị khóa (disabled style: nền xám, cursor not-allowed)
- Có thông báo xác nhận khi sửa bản ghi APPROVED: "Công trình đã duyệt sẽ cần phê duyệt lại sau khi sửa. Bạn có chắc chắn?"

---

## 11. Yêu cầu giao diện

Dùng chung bố cục và token với F-044. Khác biệt:

- Breadcrumb: "Quản lý KCHTGT Khu nước & VTS > Đê/kè > Sửa [tên công trình]"
- Các trường disabled hiển thị nền xám `#f5f5f5`, chữ `textTertiary`
- Nút chính: "Lưu và gửi phê duyệt" (actionPrimary)
