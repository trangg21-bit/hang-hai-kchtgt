---
feature-id: F-035
document: business-context
output-mode: lean
last-updated: 2026-06-27
---
# Business Context: Phê duyệt Vùng nước

## BA → Handoff Summary

**Verdict:** Ready for solution architecture

**Phases completed:** BA only

**Triage rationale:** F-035 introduces multi-level approval workflow (2 cấp) cho Vùng nước — entity YeuCauPheDuyetVN và PheDuyetLog là mới; trạng thái machine có 5 state; RBAC cần org-unit filter (Cảng vs Cục). SA cần quyết định kiến trúc multi-level workflow, permission matrix extension và immutability pattern.

**Business goal:** Đảm bảo mọi Vùng nước mới hoặc cập nhật trải qua phê duyệt hai cấp chặt chẽ (Trưởng phòng Cảng → Cục) trước khi được kích hoạt, đảm bảo tính pháp lý và an toàn tài sản vùng nước quốc gia.

**Scope in:**
- Danh sách và chi tiết Vùng nước chờ phê duyệt (Cấp 1 và Cấp 2 riêng biệt)
- Chấp thuận / Từ chối với lý do bắt buộc tại từng cấp
- Chuyển trạng thái tự động: cho_phe_duyet_c1 → cho_phe_duyet_c2 → da_kich_hoat (hoặc cho_chinh_sua khi bị từ chối)
- Ghi PheDuyetLog bất biến, thông báo kết quả đến người liên quan
- Chỉnh sửa và gửi lại khi bị từ chối

**Key business rules:**
- BR-001: Vùng nước mới/cập nhật luôn bắt đầu ở "Chờ phê duyệt Cấp 1"
- BR-002: Cấp 2 chỉ nhận hồ sơ sau khi Cấp 1 Chấp thuận
- BR-003: Cấp 2 từ chối → trạng thái về "Chờ phê duyệt Cấp 1"
- BR-005: Lý do từ chối bắt buộc ở cả hai cấp
- BR-007: RBAC + org-unit filter — Cấp 1 = A-002 tại Cảng; Cấp 2 = A-002 tại Cục

**Actors:** Lãnh đạo Cấp 1 (A-002, org=Cảng), Lãnh đạo Cấp 2 (A-002, org=Cục), Chuyên viên Cảng (A-003/A-004)

**UI/UX impact:** yes — designer required (màn hình danh sách theo cấp, chi tiết + lịch sử thay đổi, giao diện phê duyệt/từ chối với lý do)

**Screen types:** danh sách chờ phê duyệt (Cấp 1), danh sách chờ phê duyệt (Cấp 2), chi tiết Vùng nước + tab lịch sử, form phê duyệt/từ chối

**Open items (non-blocking):** Xác nhận mapping role Lãnh đạo Cấp 1 (Trưởng phòng) và Cấp 2 (Cục) với org-unit cụ thể trong permission matrix — SA quyết định.
