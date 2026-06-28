---
feature-id: F-024
document: business-context
output-mode: lean
last-updated: 2026-06-27
---
# Business Context: Xem chi tiết Cầu cảng

## BA → Handoff Summary

**Verdict:** Ready for solution architecture
**Phases completed:** BA only
**Triage rationale:** F-024 là read-only feature không tạo aggregate/entity mới (CauCang đã được định nghĩa bởi F-020), nhưng đòi hỏi API design phi tầm thường: field-level RBAC projection tại service layer, cross-entity navigation link sang BenCang (F-016), và performance SLA ≤ 3s trên 614 bản ghi — cần solution architecture quyết định.
**Business goal:** Cung cấp khả năng tra cứu và xem chi tiết Cầu cảng (614 đơn vị toàn quốc) cho cán bộ quản lý và người vận hành, phục vụ kiểm tra năng lực tiếp nhận tàu và báo cáo nhà nước.
**Scope in:**
- Tìm kiếm/lọc danh sách Cầu cảng theo mã, tên, Bến cảng mẹ, trạng thái
- Trang chi tiết hiển thị đầy đủ 15 trường CauCang entity
- Liên kết điều hướng đến Bến cảng mẹ
- Field-level RBAC: ẩn trường kỹ thuật cho A-004
- Phân trang 50 bản ghi/trang với sắp xếp

**Key business rules:**
- BR-001: Mặc định chỉ hiện trạng thái hien_hanh + tam_ngung
- BR-002: A-004 chỉ xem 4 trường cơ bản (maCau, tenCau, trangThai, tenBenCangMe)
- BR-003: Trường kỹ thuật chỉ hiện cho A-003 trở lên; A-001 luôn thấy đủ
- BR-004: Tối đa 50 bản ghi/trang, bắt buộc phân trang
- BR-005: Link BenCang mẹ chỉ hiện khi có quyền VIEW_BEN_CANG
- BR-006: Live search debounce ≤ 500ms

**Actors:** A-001 (Quản trị), A-002 (Lãnh đạo), A-003 (Chuyên viên), A-004 (Người dùng tại Cảng)
**Domain highlights:** N/A — Phase 2 không chạy (không có domain element mới)
**UI/UX impact:** Yes — designer required (màn hình danh sách + trang chi tiết)
**Screen types:** (1) Danh sách Cầu cảng với thanh tìm kiếm/lọc và phân trang; (2) Trang chi tiết Cầu cảng với field-level visibility control và liên kết Bến cảng mẹ
**Open items (non-blocking):** Cơ chế lọc Bến cảng mẹ (typeahead vs dropdown) cần xác nhận từ designer; trường mucNuocCaoNhat có thể null cần empty-state UX rõ ràng
