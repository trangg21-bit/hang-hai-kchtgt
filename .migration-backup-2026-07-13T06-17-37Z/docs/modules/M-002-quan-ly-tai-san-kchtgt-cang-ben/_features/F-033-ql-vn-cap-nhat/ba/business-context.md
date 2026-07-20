---
feature-id: F-033
document: business-context
stage: ba
last-updated: 2026-06-27
---
# Business Context: Quản lý Vùng nước - Cập nhật (F-033)

## BA → Handoff Summary

**Verdict:** Ready for Technical Lead planning

**Phases completed:** BA only

**Triage rationale:** F-033 là thao tác cập nhật CRUD trên entity VungNuoc đã được định nghĩa tại F-032; không tạo mới aggregate root, bounded context, domain event hoặc service boundary mới; pattern PUT API + transactional audit log + cảnh báo trạng thái + kích hoạt phê duyệt lại đã được xác lập tại F-021 (Cập nhật Cầu cảng) và các feature tương tự trong M-002.

**Business goal:** Cho phép người dùng có thẩm quyền cập nhật chính xác thông tin Vùng nước khi có thay đổi về điều kiện tự nhiên hoặc pháp lý, đảm bảo CSDL tài sản KCHTGT luôn phản ánh thực tế và các thay đổi ảnh hưởng an toàn hàng hải được kiểm soát qua phê duyệt lại.

**Scope in:**
- Biểu mẫu cập nhật tất cả trường VungNuoc ngoại trừ mã (bất biến)
- Validation kỹ thuật (diện tích > 0, độ sâu 0–200m)
- Cảnh báo khi trangThai = cho_phe_duyet; chặn khi da_xoa
- Kích hoạt phê duyệt lại (F-035) khi thay đổi doSau hoặc khaNangThongHanh
- Ghi nhật ký thay đổi tự động (LichSuVungNuoc), immutable

**Key business rules:**
- BR-001: ma (mã vùng nước) bất biến sau khi tạo
- BR-004: thay đổi doSau hoặc khaNangThongHanh bắt buộc phê duyệt lại
- BR-005: LichSuVungNuoc ghi per trường, không xóa/sửa được
- BR-006: da_xoa → chặn hoàn toàn; cho_phe_duyet → cảnh báo + xác nhận

**Actors:** Quản trị viên (Admin), Quản lý cảng (Quan_ly_cang)

**UI/UX impact:** Yes — designer required (biểu mẫu cập nhật, cảnh báo trạng thái, confirmation dialog)

**Screen types:** Form cập nhật Vùng nước (prefilled), confirmation dialog (khi trangThai = cho_phe_duyet hoặc khi thay đổi trường quan trọng), inline validation messages

**Open items (non-blocking):** Ngưỡng giá trị tối đa của dienTich chưa được quy định rõ trong feature-brief — đề nghị xác nhận ở giai đoạn tech-lead; đơn vị của dienTich (m² hay km²) cần thống nhất với F-032.
