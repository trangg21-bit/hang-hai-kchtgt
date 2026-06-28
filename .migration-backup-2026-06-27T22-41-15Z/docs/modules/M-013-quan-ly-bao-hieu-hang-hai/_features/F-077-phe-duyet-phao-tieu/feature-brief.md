---
id: F-077
name: Phê duyệt Phao tiêu
slug: phe-duyet-phao-tieu
module-id: M-013
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Phao tiêu

## Description
Chức năng cho phép Lãnh đạo cấp Phòng và cấp Cục thực hiện phê duyệt hồ sơ Phao tiêu theo quy trình 2 cấp. Trưởng phòng xem xét và phê duyệt hồ sơ ở cấp độ cơ sở, sau đó Chuyển hồ sơ lên Lãnh đạo Cục để phê duyệt cấp cao hơn. Mỗi cấp có bảng danh sách công việc riêng và khả năng chấp nhận hoặc từ chối hồ sơ kèm lý do chi tiết, tương tự quy trình phê duyệt Đèn biển.

## Business Intent
Hệ thống cần đảm bảo mọi Phao tiêu mới tạo, cập nhật hoặc đề nghị xóa đều phải trải qua quy trình kiểm tra độc lập bởi ít nhất 2 cấp quản lý, đảm bảo thông tin kỹ thuật chính xác, vị trí hợp lý, loại Phao tiêu phù hợp với quy chuẩn IALA Region A, và tuân thủ quy chuẩn kỹ thuật quốc gia về hệ thống báo hiệu hàng hải trước khi được đưa vào hoạt động chính thức trên hệ thống quản lý.

## Flow Summary
Trưởng phòng truy cập danh sách công việc "hồ sơ chờ phê duyệt", chọn hồ sơ Phao tiêu cần xem xét, hệ thống hiển thị chi tiết thông tin kỹ thuật của Phao tiêu kèm thông tin người nộp và thời gian nộp. Trưởng phòng kiểm tra và chọn "Phê duyệt cấp 1" hoặc "Từ chối" kèm lý do. Nếu phê duyệt, hồ sơ chuyển đến hàng đợi phê duyệt của Lãnh đạo Cục. Lãnh đạo Cục thực hiện tương tự ở cấp 2. Sau khi cả 2 cấp phê duyệt, Phao tiêu chuyển sang trạng thái "approved" và xuất hiện trong danh sách hoạt động. Nếu từ chối ở bất kỳ cấp nào, hồ sơ quay lại trạng thái "rejected" và gửi thông báo cho người nộp.

## Acceptance Criteria
- Trưởng phòng có thể xem danh sách tất cả hồ sơ Phao tiêu chờ phê duyệt cấp 1
- Trưởng phòng có thể chấp nhận hoặc từ chối hồ sơ kèm lý do chi tiết
- Hồ sơ được Trưởng phòng phê duyệt chuyển tự động đến hàng đợi phê duyệt của Lãnh đạo Cục
- Lãnh đạo Cục có thể xem danh sách hồ sơ chờ phê duyệt cấp 2
- Hồ sơ được cả 2 cấp phê duyệt chuyển sang trạng thái "approved" và xuất hiện trong danh sách hoạt động
- Hồ sơ bị từ chối ở bất kỳ cấp nào gửi thông báo tự động cho người nộp kèm lý do

## In Scope
- Danh sách công việc cho Trưởng phòng (cấp 1) và Lãnh đạo Cục (cấp 2)
- Hiển thị chi tiết hồ sơ Phao tiêu kèm thông tin kỹ thuật đầy đủ
- Nút chấp nhận/phê duyệt kèm trường nhập lý do tùy chọn (cho cấp 1) hoặc bắt buộc (cho cấp 2 từ chối)
- Nút từ chối kèm trường nhập lý do bắt buộc
- Chuyển trạng thái workflow tự động sau khi phê duyệt/từ chối
- Thông báo tự động gửi cho người nộp kết quả phê duyệt

## Out of Scope
- Tạo mới Phao tiêu (thuộc F-074)
- Cập nhật thông tin Phao tiêu (thuộc F-075)
- Xóa Phao tiêu (thuộc F-076)
- Xem chi tiết Phao tiêu (thuộc F-078)
- Xem lịch sử thay đổi (thuộc F-079)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Trưởng phòng | Approve level 1, Reject level 1, View |
| Lãnh đạo Cục | Approve level 2, Reject level 2, View |
| Chuyên viên | View own submissions, Receive notifications |
| Quản trị hệ thống | View all, Override workflow |

## Architecture Notes
Workflow phê duyệt được implement bằng State Machine Pattern với enum `ApprovalStage { PENDING, APPROVED_LEVEL_1, APPROVED, REJECTED }`. Endpoint REST API `POST /api/v1/buoys/{buoyId}/approve` và `POST /api/v1/buoys/{buoyId}/reject`. Notification service gửi email và thông báo trong hệ thống khi trạng thái thay đổi. Audit trail ghi lại mọi hành động phê duyệt/từ chối ở cả 2 cấp.

## Entities
- **Buoy**: id, buoyCode, name, latitude, longitude, buoyType, shape, color, lightCharacteristic, radarReflector, mooringType, waterDepth, status, approvalStage, approvedByLevel1, approvedByLevel2, approvedAt, rejectedBy, rejectedReason, rejectedAt, createdAt, updatedAt
- **ApprovalAuditLog**: id, buoyId, stage, action (approve/reject), performedBy, performedAt, comment

## Business Rules
1. Quy trình phê duyệt bắt buộc gồm 2 cấp: Trưởng phòng (cấp 1) → Lãnh đạo Cục (cấp 2)
2. Hồ sơ chỉ được chuyển lên cấp 2 sau khi Trưởng phòng đã phê duyệt ở cấp 1
3. Lý do từ chối ở cấp 2 là bắt buộc, ở cấp 1 là tùy chọn
4. Chỉ một người ở mỗi cấp có thể phê duyệt một hồ sơ (không phê duyệt trùng lặp)
5. Hồ sơ bị từ chối ở bất kỳ cấp nào không thể tự động phê duyệt lại, phải tạo lại từ người nộp
6. Thời gian xử lý phê duyệt được ghi nhận để đo lường hiệu suất quản lý

## Testing Strategy
- Unit test cho state machine logic chuyển đổi trạng thái approval giữa các cấp
- Integration test cho API endpoints `POST /api/v1/buoys/{buoyId}/approve` và `reject` kiểm tra workflow 2 cấp
- End-to-end test kiểm tra toàn bộ quy trình: tạo → phê duyệt cấp 1 → phê duyệt cấp 2 → approved
- End-to-end test kiểm tra flow bị từ chối: tạo → từ chối cấp 1 → rejected
- Test kiểm tra notification gửi đúng người và đúng nội dung khi trạng thái thay đổi
- Test kiểm tra audit trail ghi nhận đầy đủ hành động ở cả 2 cấp
- Test kiểm tra concurrency: 2 người dùng cố gắng phê duyệt cùng 1 hồ sơ
