---
id: F-107
name: Phê duyệt Đại Cospas-Sarsat
slug: phe-duyet-dai-cospas-sarsat
module-id: M-015
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Đại Cospas-Sarsat

## Description
Cho phép lãnh đạo cấp Phòng và cấp Cục thực hiện quy trình phê duyệt hai cấp cho các yêu cầu tạo mới, cập nhật hoặc xóa Đại Cospas-Sarsat (trạm vệ tinh cứu nạn Cospas-Sarsat). Hệ thống quản lý luồng phê duyệt tuần tự từ Phòng lên Cục, với đầy đủ chức năng xem chi tiết, bình luận và ghi chú phê duyệt.

## Business Intent
Quy trình phê duyệt hai cấp (Phòng → Cục) đảm bảo mọi thay đổi về thông tin Đại Cospas-Sarsat đều được kiểm tra và chấp thuận bởi các cấp quản lý có thẩm quyền, đảm bảo tính chính xác và an toàn của dữ liệu hệ thống vệ tinh cứu nạn Cospas-Sarsat phục vụ công tác tìm kiếm cứu nạn (SAR) trên biển một cách tin cậy.

## Flow Summary
Lãnh đạo cấp Phòng nhận được thông báo yêu cầu phê duyệt, truy cập hệ thống để xem chi tiết yêu cầu (tạo mới/cập nhật/xóa), kiểm tra thông tin kỹ thuật (loại beacon, tần số 406 MHz, vùng phủ sóng, mã MMSI), thêm ghi chú nếu cần, sau đó chọn Phê duyệt hoặc Từ chối. Nếu được Phòng phê duyệt, yêu cầu chuyển lên Cấp Cục để xem xét và phê duyệt cấp 2. Sau khi cả hai cấp đều phê duyệt, bản ghi được cập nhật chính thức.

## Acceptance Criteria
- Trưởng phòng có thể xem chi tiết yêu cầu phê duyệt và thực hiện phê duyệt/từ chối
- Yêu cầu được chuyển tự động từ Cấp Phòng sang Cấp Cục sau khi Phòng phê duyệt
- Trưởng cục có thể xem và thực hiện phê duyệt cấp 2
- Lịch sử phê duyệt (ai, khi nào, ý kiến) được ghi nhận đầy đủ
- Trạng thái bản ghi được cập nhật chính thức sau khi cả hai cấp phê duyệt

## In Scope
- Giao diện xem chi tiết yêu cầu phê duyệt (thông tin kỹ thuật Cospas-Sarsat)
- Chức năng Phê duyệt / Từ chối cho từng cấp
- Hiển thị thông tin so sánh (trước/sau) cho yêu cầu cập nhật
- Ghi chú/bình luận cho từng yêu cầu phê duyệt
- Workflow hai cấp: Phòng → Cục tự động
- Thông báo trạng thái phê duyệt cho Chuyên viên tạo

## Out of Scope
- Quy trình phê duyệt vượt cấp (skip level)
- Tự động phê duyệt dựa trên rule engine
- Phê duyệt hàng loạt nhiều yêu cầu cùng lúc
- Tích hợp chữ ký số trong quy trình phê duyệt

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Trưởng phòng | Phê duyệt / Từ chối cấp 1, Xem yêu cầu |
| Trưởng cục | Phê duyệt / Từ chối cấp 2, Xem yêu cầu |
| Chuyên viên | Xem trạng thái yêu cầu của mình, Nhận thông báo |
| Admin | Xem toàn bộ, Quản lý workflow |

## Architecture Notes
Dùng state machine cho workflow phê duyệt: `pending_1` → `pending_2` → `approved` hoặc `pending_1` → `rejected`. Bảng `approval_workflow` lưu các bước phê duyệt, bao gồm approver_id, approved_at, comment, decision. Tích hợp NotificationService để gửi thông báo ở mỗi bước.

## Entities
- **CoastalStationCospasSarsat**: id, device_code, station_name, beacon_type, frequency, coverage_zone, status (pending/approved/rejected), version
- **ApprovalWorkflow**: id, entity_type, entity_id, current_level, status (pending_1/pending_2/approved/rejected), level_1_approver_id, level_1_decision, level_1_comment, level_1_at, level_2_approver_id, level_2_decision, level_2_comment, level_2_at
- **ApprovalComment**: id, workflow_id, approver_id, comment, created_at

## Business Rules
1. Quy trình phê duyệt luôn là 2 cấp: Phòng → Cục, không thể bỏ qua cấp nào
2. Bản ghi chỉ được kích hoạt (status = approved) sau khi cả hai cấp phê duyệt
3. Nếu một cấp từ chối, toàn bộ yêu cầu bị hủy và Chuyên viên nhận thông báo
4. Mỗi cấp phê duyệt phải có lý do/ghi chú đi kèm
5. Chỉ lãnh đạo thuộc cấp tương ứng mới được phép phê duyệt ở cấp đó

## Testing Strategy
- Test unit: kiểm tra logic chuyển trạng thái workflow
- Test integration: API phê duyệt, xác nhận trạng thái chuyển đúng
- Test workflow: test luồng 2 cấp (phòng → cục → approved/rejected)
- Test notification: xác nhận thông báo được gửi đúng người, đúng thời điểm
