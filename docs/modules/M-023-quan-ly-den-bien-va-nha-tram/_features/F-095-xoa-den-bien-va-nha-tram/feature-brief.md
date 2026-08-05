---
id: F-095
name: Xóa Đèn biển và nhà trạm gắn với Đèn biển
slug: xoa-den-bien-va-nha-tram
module-id: M-023
status: proposed
classification: local
priority: high
created: 2026-08-05T00:00:00Z
last-updated: 2026-08-05T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xóa Đèn biển và nhà trạm gắn với Đèn biển

**Tài liệu:** BA Feature Brief
**Feature:** F-095
**Module:** M-023 — Quản lý Đèn biển và nhà trạm gắn với Đèn biển
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-05
**Tham khảo:** `references/qlkc-052-quan-ly-den-bien-va-nha-tram.md` (mục 7)

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép xóa mềm (soft delete) bản ghi **Đèn biển và nhà trạm gắn với Đèn biển**. Bản ghi không bị xóa vật lý khỏi database mà được đánh dấu `status = S_0`.

### 1.2. Tại sao cần tính năng này?

Khi dữ liệu được tạo sai hoặc không còn cần thiết, cần có khả năng loại bỏ khỏi danh sách hoạt động nhưng vẫn giữ lại dấu vết để phục vụ kiểm tra, đối chiếu sau này.

### 1.3. Luồng hoạt động chính

Danh sách DBNT → bấm "Xóa" trên dòng (chỉ hiển thị khi đủ điều kiện) → xác nhận → `DELETE /api/v1/tskt/qlkc_052?id=...&ma=...` → bản ghi biến mất khỏi danh sách (status = S_0).

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Logic phân quyền chung

Nút **Xóa** chỉ hiển thị khi thỏa mãn đồng thời 2 điều kiện:
1. **Trạng thái bản ghi = S_1 (Lưu tạm)** — bản ghi đang duyệt (S_2-S_5) hoặc đã duyệt (S_6) không được xóa
2. **Người dùng là Cấp Cục** hoặc **đúng Chi cục quản lý** bản ghi đó

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-095-01:** Là Chuyên viên/Cán bộ đúng đơn vị, tôi muốn xóa bản ghi Đèn biển và nhà trạm đang ở trạng thái Lưu tạm mà tôi đã tạo sai.
- **US-095-02:** Là Cấp Cục, tôi muốn xóa bất kỳ bản ghi Lưu tạm nào trong hệ thống.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-095-01 — Điều kiện hiển thị nút Xóa:** Chỉ hiển thị khi status = S_1 và (user là Cấp Cục hoặc user thuộc đúng `fkDonViQl` của bản ghi). Các trạng thái khác (S_2-S_6) không hiển thị nút Xóa.

**AC-095-02 — Xác nhận trước khi xóa:** Khi bấm "Xóa", hiển thị popup xác nhận: "Bạn có chắc chắn muốn xóa Đèn biển [tên] không?".

**AC-095-03 — Soft delete:** `DELETE /api/v1/tskt/qlkc_052?id=...&ma=...` → set `status = S_0`. Bản ghi không xuất hiện trong danh sách mặc định. Thông báo thành công.

**AC-095-04 — Chặn xóa bản ghi đang duyệt:** Nếu status là S_2-S_5 (đang trong luồng duyệt) → không hiển thị nút Xóa. Nếu cố tình gọi API → 400 Bad Request.

**AC-095-05 — Chặn xóa bản ghi đã duyệt:** Nếu status = S_6 → không hiển thị nút Xóa. Nếu cố tình gọi API → 400 Bad Request.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-095-01 — Chỉ xóa bản ghi Lưu tạm:** Chỉ bản ghi ở S_1 mới có thể bị xóa. Bản ghi đang duyệt hoặc đã duyệt không thể xóa để đảm bảo tính toàn vẹn quy trình.

**BR-095-02 — Soft delete, không xóa vật lý:** Bản ghi được đánh dấu S_0, không bị xóa khỏi database. Dữ liệu vẫn tồn tại để phục vụ đối chiếu, kiểm tra.

**BR-095-03 — Phân quyền xóa:** Cấp Cục xóa được mọi bản ghi S_1. Chi cục chỉ xóa được bản ghi thuộc đơn vị mình quản lý.

---

## 6. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| DELETE | `/api/v1/tskt/qlkc_052?id=...&ma=...` | Soft delete (S_1 → S_0) | Cục / Chi cục (đúng đơn vị) |

---

## 7. Yêu cầu giao diện người dùng

Dùng chung token màu sắc, thang số, style với F-092.

### 7.1. Nút Xóa trên danh sách

Thuộc action dropdown trên mỗi dòng. Chỉ hiển thị khi thỏa điều kiện (AC-095-01). Màu đỏ (`danger`).

### 7.2. Popup xác nhận

Tiêu đề: "Xác nhận xóa". Nội dung: "Bạn có chắc chắn muốn xóa Đèn biển [{ten}] không? Hành động này không thể hoàn tác." Nút: "Hủy" (mặc định) / "Xóa" (danger).

### 7.3. Cấu trúc file nguồn tham khảo

```
qlkc-052/index.tsx → Action column → Delete button
Qlkc052RestController.java → DELETE endpoint
```
