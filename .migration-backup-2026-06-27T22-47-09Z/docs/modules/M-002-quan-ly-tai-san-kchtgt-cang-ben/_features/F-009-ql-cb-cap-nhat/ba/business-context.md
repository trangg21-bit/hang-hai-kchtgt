---
feature-id: F-009
document: business-context
stage: ba
last-updated: 2026-06-27
---
# Business Context: F-009 Quản lý Cảng biển - Cập nhật

## BA Handoff Summary

**Verdict:** Ready for Technical Lead planning
**Phases completed:** BA only
**Triage rationale:** Tính năng chỉ mở rộng entity CangBien và LichSuThayDoi đã được định nghĩa tại F-008; không tạo aggregate root, bounded context hay domain event mới; pattern PUT API + transactional audit log là kiến trúc đã được thiết lập trong module, không cần quyết định kiến trúc mới.
**Business goal:** Đảm bảo cơ sở dữ liệu Cảng biển luôn phản ánh đúng tình trạng thực tế của hạ tầng hàng hải, hỗ trợ quy hoạch và báo cáo cơ quan quản lý nhà nước.

**Scope in:**
- Biểu mẫu cập nhật thông tin Cảng biển (tenCang, toDo, dienTich, khaNangTiepNhanTau, ghiChu)
- Validation rules cho từng trường có thể thay đổi
- Khóa read-only trường maCang ở cả frontend và backend
- Cảnh báo / chặn theo trangThai Cảng biển
- Ghi nhật ký thay đổi tự động trong cùng transaction với cập nhật

**Key business rules:**
- BR-001: maCang bất biến sau khi tạo
- BR-004: LichSuThayDoi immutable, một bản ghi per trường thay đổi
- BR-005: da_xoa bị chặn hoàn toàn; cho_phe_duyet hiển thị cảnh báo
- BR-006: Phân quyền server-side bắt buộc (Admin, Quan_ly_cang)

**Actors:** Quản trị viên (A-001 / Admin), Chuyên viên tại cảng (A-004 / Quan_ly_cang)
**Domain highlights:** N/A (Phase 2 không chạy — không có domain model mới)
**UI/UX impact:** Yes — biểu mẫu cập nhật, cảnh báo trạng thái, thông báo lỗi validation
**Screen types:** Form cập nhật Cảng biển (pre-populated), modal cảnh báo trangThai
**Open items (non-blocking):** Định nghĩa chính xác các trường "khả năng tiếp nhận tàu" (string tự do hay enum) — có thể làm rõ ở tech-lead planning

## Artifact Reference

Full lean spec: `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/_features/F-009-ql-cb-cap-nhat/ba/00-lean-spec.md`
