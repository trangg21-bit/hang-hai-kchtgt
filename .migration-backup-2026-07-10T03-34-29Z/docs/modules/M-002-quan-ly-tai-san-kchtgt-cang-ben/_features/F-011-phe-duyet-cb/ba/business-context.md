---
feature-id: F-011
document: business-context
output-mode: lean
last-updated: 2026-06-27
---
# Business Context: Phê duyệt Cảng biển

## BA → Handoff Summary

**Verdict:** Ready for solution architecture
**Phases completed:** BA only
**Triage rationale:** Tính năng tạo entity mới (PheDuyetLog) và workflow state-machine mới cho CangBien; cần SA xác định immutability constraint, notification mechanism, và RBAC mapping cho "Người phê duyệt được ủy quyền".
**Business goal:** Đảm bảo mọi Cảng biển trước khi được kích hoạt "Hiện hành" đều đã qua kiểm soát chất lượng bởi người có thẩm quyền, với nhật ký minh bạch và bất biến.

**Scope in:**
- Danh sách Cảng biển chờ phê duyệt (tạo mới + cập nhật)
- Chi tiết Cảng biển kèm delta lịch sử thay đổi
- Giao diện Chấp thuận / Từ chối (lý do từ chối bắt buộc)
- Cập nhật trạng thái CangBien và ghi PheDuyetLog bất biến
- Thông báo kết quả đến người tạo

**Key business rules:**
- BR-001: Cảng biển phải qua "Chờ phê duyệt" trước khi thành "Hiện hành"
- BR-002: Lý do từ chối bắt buộc; không có ngoại lệ
- BR-004: PheDuyetLog bất biến; kể cả Admin không xóa/sửa được
- BR-006: Chỉ vai trò Lãnh đạo (A-002) hoặc được ủy quyền tường minh mới phê duyệt được

**Actors:** Lãnh đạo (A-002) — người phê duyệt; Chuyên viên (A-003) / Người dùng tại Cảng (A-004) — người tạo nhận thông báo

**UI/UX impact:** yes — designer required (danh sách chờ phê duyệt, trang chi tiết + lịch sử thay đổi, modal phê duyệt/từ chối)
**Screen types:** List screen (danh sách chờ phê duyệt); Detail screen (chi tiết + tab lịch sử); Action modal (Chấp thuận / Từ chối với trường lý do)

**Open items (non-blocking):**
- Cơ chế "Người phê duyệt được ủy quyền" — SA cần định nghĩa trong permission matrix
- Notification delivery mechanism (real-time WebSocket vs polling) — SA quyết định
- Cách hiển thị delta lịch sử thay đổi (field-level diff) — Designer + SA phối hợp
