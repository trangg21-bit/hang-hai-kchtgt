---
id: F-052
name: Quan ly co so sua chua dong tau - Xoa
slug: quan-ly-co-so-sua-chua-dong-tau-xoa
module-id: M-003
status: proposed
classification: local
priority: P1
created: 2026-06-29T00:00:00Z
last-updated: 2026-08-03T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cơ sở sửa chữa, đóng tàu — Xóa

**Tài liệu:** BA Feature Brief
**Feature:** F-052
**Module:** M-003 — Quản lý tài sản KCHTGT khu nước VTS
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép **Chuyên viên** xóa (soft delete) một bản ghi cơ sở sửa chữa, đóng tàu khỏi danh sách chính. Bản ghi bị xóa chuyển sang trạng thái S_0 và không còn hiển thị trong danh sách, nhưng vẫn tồn tại trong cơ sở dữ liệu và có thể được xem lại qua tính năng Lịch sử (F-055).

### 1.2. Tại sao cần tính năng này?

Trong quá trình quản lý, có những bản ghi được tạo ra do nhầm lẫn, trùng lặp, hoặc không còn phù hợp. Soft delete đảm bảo dữ liệu không bị mất vĩnh viễn, vẫn có thể truy vết và khôi phục nếu cần, đồng thời giữ cho danh sách chính luôn sạch sẽ.

### 1.3. Luồng hoạt động chính

Chuyên viên mở danh sách CSSCDT → tìm bản ghi cần xóa (phải ở trạng thái S_1 - Lưu tạm) → nhấn nút **Xóa** trên dòng → hệ thống hiển thị hộp thoại xác nhận → Chuyên viên xác nhận → bản ghi chuyển sang S_0 → biến mất khỏi danh sách chính.

> ⚠ **Quan trọng:** Chỉ xóa được bản ghi ở trạng thái **S_1 (Lưu tạm)** — tức là bản ghi chưa từng được gửi duyệt. Một khi đã gửi duyệt (S_2 trở đi), không thể xóa được nữa.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác được áp dụng theo hệ thống phân quyền tập trung, kiểm soát bởi cơ chế RBAC.

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

- **Xem full dữ liệu:** Admin Cục thấy toàn bộ dữ liệu, không giới hạn phạm vi đơn vị.
- **Xem thông tin người xóa:** thấy được họ tên, tên đăng nhập người thực hiện xóa.
- **Xem thời gian xóa:** thấy được timestamp thời điểm xóa.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-052-01:** Là **Chuyên viên**, tôi muốn xóa bản ghi CSSCDT đang ở trạng thái Lưu tạm mà tôi đã tạo nhầm hoặc không còn cần thiết.
- **US-052-02:** Là **Chuyên viên**, tôi muốn hệ thống yêu cầu xác nhận trước khi xóa để tránh thao tác nhầm.

### Mức Should (nên có)

- **US-052-03:** Là **Chuyên viên**, tôi muốn thấy lý do tại sao không xóa được một bản ghi (vd: "Bản ghi đã gửi duyệt, không thể xóa").
- **US-052-04:** Là **Admin**, tôi muốn có thể khôi phục bản ghi đã xóa từ màn Lịch sử (F-055).

### Mức Could (có thể có sau)

- **US-052-05:** Là **Admin**, tôi muốn xóa vĩnh viễn (hard delete) bản ghi sau khi đã soft delete một thời gian.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-052-01 — Chỉ hiển thị nút Xóa khi đủ điều kiện:** Nút Xóa chỉ hiển thị trên dòng khi **đồng thời** thỏa mãn: (1) `status = S_1`, (2) user có quyền `cosuachua:delete`, (3) user thuộc đúng `fkDonViQl` của bản ghi. Nếu không đủ điều kiện, nút Xóa bị ẩn.

**AC-052-02 — Xác nhận trước khi xóa:** Khi nhấn Xóa, hiển thị hộp thoại: "Bạn có chắc chắn muốn xóa cơ sở '{tên cơ sở}'? Bản ghi sẽ được chuyển vào Lịch sử và có thể khôi phục sau." với 2 nút Hủy và Xóa.

**AC-052-03 — Soft delete:** Sau khi xác nhận, backend thực hiện soft delete: set `status = S_0`, không xóa vật lý dữ liệu. Ghi log thao tác vào bảng lịch sử.

**AC-052-04 — Từ chối xóa bản ghi không đủ điều kiện:** Nếu gọi API DELETE với bản ghi có status ≠ S_1, trả về lỗi 422: "Chỉ có thể xóa bản ghi ở trạng thái Lưu tạm."

**AC-052-05 — Kiểm tra quyền đơn vị:** Nếu user không thuộc `fkDonViQl` của bản ghi, trả về 403.

**AC-052-06 — Refresh danh sách sau xóa:** Sau khi xóa thành công, danh sách tự động refresh, bản ghi biến mất khỏi bảng.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-052-01 — Chỉ xóa được S_1:** Bản ghi phải ở trạng thái Lưu tạm (chưa từng gửi duyệt) mới được xóa.

**BR-052-02 — Soft delete, không xóa vật lý:** Dữ liệu không bị xóa khỏi database. Chỉ set `status = S_0` và ghi log.

**BR-052-03 — Dữ liệu liên quan không tự động xóa:** Nếu CSSCDT đã có dữ liệu vận hành, bảo trì, sự cố gắn kèm, các dữ liệu đó **không** tự động bị xóa theo.

**BR-052-04 — Cùng đơn vị mới được xóa:** User phải thuộc `fkDonViQl` của bản ghi.

**BR-052-05 — Có thể khôi phục:** Bản ghi S_0 vẫn tồn tại trong DB, có thể xem lại qua F-055 (Lịch sử).

---

### 5.1. Khi nào KHÔNG thấy nút Xóa?

| Trạng thái | Thấy nút Xóa? | Lý do |
|---|---|---|
| S_1 (Lưu tạm) | ✅ | Đủ điều kiện |
| S_2 (Chờ Chi cục) | ❌ | Đã gửi duyệt |
| S_3 (Chờ Cục) | ❌ | Đang trong luồng duyệt |
| S_4 (Từ chối CC) | ❌ | Đã từng gửi duyệt |
| S_5 (Từ chối Cục) | ❌ | Đã từng gửi duyệt |
| S_6 (Đã duyệt) | ❌ | Đã duyệt |
| S_0 (Đã xóa) | ❌ | Đã xóa rồi |

---

## 6. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| DELETE | `/api/v1/co-so-sua-chua/{id}` | Soft delete CSSCDT | `cosuachua:delete` |

### 6.1. Response thành công (200 OK)

```json
{
  "success": true,
  "message": "Đã xóa cơ sở Cơ sở sửa chữa tàu biển ABC"
}
```

### 6.2. Response lỗi (422 Unprocessable Entity)

```json
{
  "success": false,
  "message": "Chỉ có thể xóa bản ghi ở trạng thái Lưu tạm."
}
```

---

## 7. Chi tiết nghiệp vụ

### 7.1. Quy trình xóa

```
1. User nhấn "Xóa" trên dòng trong danh sách
2. Frontend kiểm tra status = S_1 → nếu không, nút đã bị ẩn
3. Hiển thị hộp thoại xác nhận với tên cơ sở
4. User nhấn "Xóa" xác nhận
5. Frontend gọi DELETE /api/v1/co-so-sua-chua/{id}
6. Backend:
   a. Kiểm tra bản ghi tồn tại
   b. Kiểm tra status = S_1 → nếu không, 422
   c. Kiểm tra user thuộc fkDonViQl → nếu không, 403
   d. Set status = S_0, updatedAt = now
   e. Ghi log vào phe_duyet_lich_su: loaiThaoTac = XOA
   f. Return 200
7. Frontend hiển thị toast "Đã xóa cơ sở {tên}"
8. Refresh danh sách
```

### 7.2. Hộp thoại xác nhận xóa

| Thành phần | Nội dung |
|---|---|
| Tiêu đề | "Xác nhận xóa" |
| Nội dung | "Bạn có chắc chắn muốn xóa cơ sở '{tên cơ sở}'? Bản ghi sẽ được chuyển vào Lịch sử và có thể khôi phục sau." |
| Nút Hủy | Màu xám, outline — đóng hộp thoại |
| Nút Xóa | Màu đỏ, solid — thực hiện xóa |

---

## 8. Liên kết với các tính năng khác

| Feature | Liên quan |
|---|---|
| **F-050** | Bản ghi do F-050 tạo, nếu còn S_1 thì F-052 xóa được |
| **F-051** | Sau khi F-051 sửa, nếu gửi duyệt rồi thì F-052 không xóa được |
| **F-053** | Một khi đã vào luồng duyệt, F-052 mất tác dụng |
| **F-055** | Bản ghi S_0 vẫn xem được qua Lịch sử |

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng
- Thao tác xóa hoàn thành trong ≤ 1 giây.

### 9.2. Bảo mật
- Kiểm tra user thuộc `fkDonViQl` trước khi cho xóa.
- Validate JWT token.

### 9.3. Độ tin cậy
- Transaction: UPDATE status + ghi log trong cùng một transaction.

### 9.4. Trải nghiệm người dùng
- Nút Xóa màu đỏ để phân biệt với các hành động khác.
- Hộp thoại xác nhận rõ ràng, không gây nhầm lẫn.
- Toast thông báo sau khi xóa thành công.
