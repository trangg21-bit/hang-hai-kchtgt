---
feature-id: F-021
document: business-context
output-mode: lean
last-updated: 2026-06-27
---
# Business Context: Quản lý Cầu cảng - Cập nhật

## BA → Handoff Summary

**Verdict:** Ready for Technical Lead planning

**Phases completed:** BA only

**Triage rationale:** Tính năng cập nhật sử dụng entity CauCang và LichSuThayDoi đã được định nghĩa tại F-020 (Tạo mới Cầu cảng); không tạo aggregate root, domain event hay bounded context mới. Pattern PUT API + transactional audit log đã được thiết lập qua F-009 (cập nhật Cảng biển) và F-020; không có quyết định kiến trúc mới cần SA.

**Business goal:** Đảm bảo cơ sở dữ liệu Cầu cảng luôn phản ánh đúng tình trạng kỹ thuật thực tế sau bảo trì, cải tạo hoặc nâng cấp tải trọng, phục vụ công tác đánh giá an toàn và lập kế hoạch sửa chữa.

**Scope in:**
- Biểu mẫu cập nhật CauCang với validation kỹ thuật (tải trọng, kích thước, loại kết cấu)
- Kiểm tra và bảo vệ tính bất biến của maCau
- Ràng buộc thay đổi Bến cảng mẹ khi có dữ liệu liên quan
- Cảnh báo trạng thái cho_phe_duyet / chặn trạng thái da_xoa
- Ghi nhật ký thay đổi tự động (LichSuThayDoi) trong transaction

**Key business rules:**
- BR-001: maCau bất biến sau khi tạo
- BR-002: taiTrongThietKe dương, ≤ 20 T/m²
- BR-003: chieuDaiCau và chieuRongCau dương, ≤ 500m
- BR-004: thay đổi benCangMeId bị chặn khi có dữ liệu liên quan
- BR-005: nhật ký immutable, ghi tự động per trường thay đổi
- BR-006: da_xoa chặn; cho_phe_duyet cảnh báo
- BR-007: chỉ Admin / Quan_ly_cang; kiểm tra ở tầng API

**Actors:** Quản trị viên (Admin), Quản lý cảng (Quan_ly_cang), Hệ thống (tự động ghi nhật ký)

**UI/UX impact:** yes — designer required (biểu mẫu cập nhật với pre-filled data, cảnh báo trạng thái, thông báo lỗi validation tiếng Việt)

**Screen types:** Form cập nhật Cầu cảng (pre-filled), dialog cảnh báo trạng thái, inline validation messages

**Open items (non-blocking):** Xác nhận cụ thể các trường bắt buộc vs optional trong biểu mẫu cập nhật (không ảnh hưởng đến AC đã định nghĩa)
