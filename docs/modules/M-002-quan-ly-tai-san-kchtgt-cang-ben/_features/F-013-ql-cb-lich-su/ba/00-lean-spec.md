---
feature-id: F-013
document: lean-spec
output-mode: lean
last-updated: 2026-07-30
---

# Quản lý Cảng biển - Lịch sử (F-013) — **CANCELLED**

## Summary

Feature này **đã bị hủy (CANCELLED)** vào ngày **2026-07-27**.

**Mô tả feature (lưu giữ context lịch sử):** Tính năng cung cấp trang tra cứu toàn bộ lịch sử thay đổi của một Cảng biển — bao gồm tạo mới, cập nhật từng trường, phê duyệt, và xóa — với chi tiết giá trị cũ/mới và người thực hiện.

## Lý do hủy

1. **URD III.4.30 "Quản lý cảng biển"** không yêu cầu chức năng "xem lịch sử" cho cảng biển.
2. TKCT có đề cập "Xem lịch sử KCHT" nhưng nội dung này chỉ **vòng đời vận hành** của kết cấu hạ tầng hàng hải (hình thành → vận hành → bảo trì → sự cố), **không phải** audit trail CRUD như F-013 được thiết kế.
3. Audit trail CRUD không nằm trong scope vòng đời vận hành KCHT.

## Ghi chú

- Lịch sử thay đổi CRUD **vẫn được ghi tự động** bởi F-008, F-009, F-010, F-011 qua cơ chế `LichSuThayDoi` / `PheDuyetLog` (ghi ở tầng ứng dụng, trigger hoặc interceptor).
- Tuy nhiên, **không có màn hình riêng (F-013)** để xem. Dữ liệu này chỉ phục vụ kiểm toán nội bộ qua truy vấn DB trực tiếp hoặc báo cáo kỹ thuật.

## Pipeline Triage

| Question       | Answer      | Rationale                                                                   |
|----------------|-------------|-----------------------------------------------------------------------------|
| Verdict        | **CANCELLED** | Hủy theo URD audit ngày 2026-07-27. Lý do: URD III.4.30 không yêu cầu; audit trail CRUD không phải vòng đời vận hành KCHT. |
