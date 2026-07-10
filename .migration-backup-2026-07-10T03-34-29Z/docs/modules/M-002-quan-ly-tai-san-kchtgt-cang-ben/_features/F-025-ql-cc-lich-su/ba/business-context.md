---
feature-id: F-025
document: business-context
stage: ba
last-updated: 2026-06-27
---
# Business Context: Quản lý Cầu cảng - Lịch sử (F-025)

## BA → Handoff Summary

**Verdict:** Ready for solution architecture

**Phases completed:** BA only

**Triage rationale:** Tính năng chỉ thêm chức năng đọc/lọc trên entity LichSuThayDoi đã tồn tại (định nghĩa tại F-021), không tạo domain element mới. Tuy nhiên các quyết định kiến trúc về append-only enforcement, field-level permission server-side, và tích hợp sự kiện cross-feature (F-020/F-021/F-022/F-023) yêu cầu SA xác nhận cơ chế kỹ thuật.

**Business goal:** Cung cấp khả năng truy vết toàn bộ quá trình biến động của Cầu cảng, hỗ trợ kiểm toán và giải trình về mọi thay đổi hạ tầng cảng biển.

**Scope in:**
- Trang hiển thị lịch sử thay đổi Cầu cảng theo thứ tự thời gian giảm dần
- Chi tiết từng sự kiện: loại, trường thay đổi, giá trị cũ/mới, người thực hiện, timestamp
- Lọc theo loại sự kiện / người thực hiện / khoảng thời gian
- Tích hợp sự kiện từ F-020 (tao_moi), F-021 (cap_nhat), F-022 (xoa), F-023 (phe_duyet)
- Phân quyền: Quản trị viên và Quản lý cảng thấy đầy đủ; Nhân viên vận hành ẩn trường kỹ thuật

**Key business rules:**
- BR-001: Mọi thay đổi Cầu cảng phải được ghi nhận tự động — không có ngoại lệ
- BR-002: Bản ghi lịch sử append-only; không UPDATE/DELETE — vi phạm là sự cố bảo mật
- BR-003: Sự kiện từ F-020/F-021/F-022/F-023 hợp nhất vào một dòng thời gian theo cauCangId
- BR-005: Trường kỹ thuật bị ẩn phía backend (không chỉ frontend) với Nhân viên vận hành

**Actors:** Quản trị viên (A-001), Quản lý cảng (A-002/A-003), Nhân viên vận hành (A-004)

**UI/UX impact:** Yes — cần trang danh sách lịch sử với bộ lọc và trang chi tiết sự kiện

**Screen types:** Trang danh sách lịch sử (có bộ lọc và phân trang), Panel chi tiết sự kiện (inline hoặc modal)

**Open items (non-blocking):**
- Danh sách chính xác các trường kỹ thuật bị ẩn với Nhân viên vận hành cần xác nhận với domain expert (AC-008)
- Cơ chế ghi lịch sử (AOP interceptor / DB trigger / manual) — SA quyết định
