---
id: F-053
name: Phê duyệt Cơ sở sửa chữa, đóng tàu
slug: phe-duyet-co-so-sua-chua-dong-tau
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Cơ sở sửa chữa, đóng tàu

## Description
Quy trình phê duyệt hai cấp cho các bản ghi cơ sở sửa chữa, đóng tàu: trưởng phòng phê duyệt cấp 1 và cục trưởng phê duyệt cấp 2. Sau khi hoàn tất cả hai cấp phê duyệt, bản ghi cơ sở sửa chữa, đóng tàu được đưa vào hệ thống chính thức và xuất hiện trong các báo cáo tổng hợp về hạ tầng phục vụ đóng sửa tàu.

## Business Intent
Đảm bảo chất lượng và tính chính xác của dữ liệu cơ sở sửa chữa, đóng tàu trước khi đưa vào hệ thống thống kê chính thức. Cơ chế phê duyệt hai cấp giúp kiểm soát thông tin, giảm thiểu sai sót và đảm bảo trách nhiệm giải trình trong quản lý tài sản hạ tầng hàng hải khu nước VTS.

## Flow Summary
Khi chuyên viên tạo mới hoặc cập nhật bản ghi cơ sở sửa chữa, đóng tàu, bản ghi ở trạng thái "chờ phê duyệt cấp 1". Trưởng phòng xem danh sách bản ghi chờ phê duyệt, kiểm tra thông tin và quyết định phê duyệt hoặc từ chối kèm lý do. Nếu được phê duyệt cấp 1, bản ghi chuyển sang "chờ phê duyệt cấp 2". Cục trưởng thực hiện phê duyệt cấp 2 và khi hoàn tất, bản ghi chuyển sang trạng thái "đã phê duyệt" và chính thức ghi nhận trong hệ thống.

## Acceptance Criteria
- Bản ghi cơ sở sửa chữa, đóng tàu cần phải trải qua 2 cấp phê duyệt (trưởng phòng → cục trưởng)
- Trưởng phòng có thể phê duyệt hoặc từ chối bản ghi chờ phê duyệt cấp 1
- Cục trưởng có thể phê duyệt hoặc từ chối bản ghi chờ phê duyệt cấp 2
- Khi từ chối, người từ chối phải nhập lý do và bản ghi được gửi lại cho người tạo
- Khi hoàn tất cả 2 cấp phê duyệt, bản ghi chuyển sang trạng thái "đã phê duyệt"

## In Scope
- Danh sách bản ghi cơ sở sửa chữa, đóng tàu chờ phê duyệt theo từng cấp
- Giao diện xem chi tiết và ra quyết định phê duyệt/từ chối
- Nhập lý do phê duyệt hoặc từ chối
- Theo dõi tiến độ phê duyệt theo từng cấp
- Thông báo cho người tạo khi bản ghi được phê duyệt hoặc từ chối

## Out of Scope
- Quy trình tạo mới bản ghi (thuộc tính năng F-050)
- Cập nhật bản ghi sau phê duyệt (thuộc tính năng F-051)
- Tự động phê duyệt dựa trên quy tắc
- Tự động gửi thông báo qua SMS/email

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xem bản ghi của mình, Nhận thông báo phê duyệt |
| Trưởng phòng | Phê duyệt cấp 1, Từ chối cấp 1, Xem bản ghi chờ |
| Cục trưởng | Phê duyệt cấp 2, Từ chối cấp 2, Xem mọi bản ghi |
| Admin | Xem và quản lý toàn bộ quy trình phê duyệt |

## Entities
- **CoSoSuaChua**: id, tenCoSo, diaChi, loaiHinhDV, nangLucTiepNhan, trangBiChinh, dienTich, soDienThoai, email, trangThai, pheDuyetC1, nguoiPheDuyetC1, ngayPheDuyetC1, pheDuyetC2, nguoiPheDuyetC2, ngayPheDuyetC2, lyDoTuChoi
- **PheDuyetLichSu**: id, coSoSuaChuaId, capPheDuyet, trangThai, nguoiPheDuyet, ngayPheDuyet, lyDo

## Business Rules
1. Quy trình phê duyệt bắt buộc 2 cấp: trưởng phòng (cấp 1) rồi đến cục trưởng (cấp 2)
2. Nếu bị từ chối ở cấp 1, bản ghi gửi lại cho chuyên viên để chỉnh sửa
3. Nếu bị từ chối ở cấp 2, bản ghi gửi lại cho chuyên viên để chỉnh sửa
4. Lý do từ chối là trường bắt buộc khi phê duyệt cấp từ chối
5. Thời gian phê duyệt mỗi cấp phải được ghi nhận và hiển thị trong giao diện

## Testing Strategy
Kiểm thử quy trình phê duyệt 2 cấp với các kịch bản: phê duyệt cả 2 cấp, từ chối cấp 1, từ chối cấp 2, gửi lại và tạo mới. Kiểm thử thời gian và trạng thái chuyển đổi giữa các bước. Kiểm thử quyền hạn: trưởng phòng không phê duyệt được cấp 2, cục trưởng chỉ phê duyệt cấp 2.
