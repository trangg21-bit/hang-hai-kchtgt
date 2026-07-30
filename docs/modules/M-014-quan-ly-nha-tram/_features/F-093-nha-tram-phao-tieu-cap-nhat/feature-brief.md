---
id: F-093
name: Nhà trạm phao tiêu - Cập nhật
slug: nha-tram-phao-tieu-cap-nhat
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-07-30T00:00:00Z
last-updated: 2026-07-30T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Nhà trạm phao tiêu - Cập nhật

## Description
Tính năng cho phép Chuyên viên chỉnh sửa thông tin của nhà trạm phao tiêu đã tồn tại trong hệ thống, bao gồm cập nhật toàn bộ 8 nhóm thông tin: từ thông tin chung (đơn vị quản lý, tên, mã, diện tích, nhân sự), thông tin vị trí (tọa độ, biểu tượng), file đính kèm, danh sách phao tiêu trực thuộc, thông tin phê duyệt, kế hoạch vận hành, kế hoạch bảo trì, đến danh sách sự cố. Chỉ những bản ghi ở trạng thái DRAFT hoặc đã phê duyệt cấp 1 (APPROVED_L1) mới được phép cập nhật. Sau khi cập nhật, bản ghi tự động chuyển về trạng thái chờ duyệt lại (PENDING). Mọi thay đổi được ghi nhận đầy đủ vào lịch sử biến động để phục vụ kiểm toán và truy vết.

## Business Intent
Thông tin về nhà trạm phao tiêu có thể thay đổi theo thời gian do nhu cầu vận hành, bảo trì, nâng cấp hoặc điều chỉnh địa giới quản lý. Tính năng cập nhật cho phép người dùng điều chỉnh dữ liệu một cách có kiểm soát: chỉ những bản ghi chưa được phê duyệt hoặc mới phê duyệt cấp 1 mới được sửa; mọi thay đổi phải trải qua quy trình phê duyệt lại để đảm bảo tính chính xác. Việc ghi nhận chi tiết từng thay đổi (trường nào thay đổi, giá trị cũ → mới, ai thay đổi, thời điểm nào) giúp cơ quan quản lý có đầy đủ dữ liệu lịch sử để đối chiếu, kiểm tra khi cần thiết.

## Flow Summary
Chuyên viên truy cập danh sách nhà trạm phao tiêu, chọn bản ghi cần cập nhật và nhấn nút "Cập nhật" (hoặc "Sửa"). Hệ thống kiểm tra trạng thái bản ghi: nếu là DRAFT hoặc APPROVED_L1, hệ thống mở form cập nhật với dữ liệu hiện tại được điền sẵn vào tất cả các nhóm thông tin. Người dùng thay đổi các trường cần cập nhật: có thể sửa thông tin chung, thêm/xóa tọa độ, upload hoặc xóa file đính kèm, thêm/sửa/xóa phao tiêu trực thuộc, cập nhật kế hoạch vận hành/bảo trì, thêm sự cố mới. Hệ thống so sánh dữ liệu cũ và mới, ghi nhận từng thay đổi vào bảng lịch sử. Sau khi lưu, bản ghi chuyển sang trạng thái PENDING (chờ duyệt lại). Người dùng nhận thông báo thành công và bản ghi hiển thị với trạng thái mới trong danh sách. Nếu bản ghi ở trạng thái khác (APPROVED, PUBLISHED, REJECTED), hệ thống thông báo không cho phép cập nhật.

## Acceptance Criteria
- Chuyên viên có thể mở form cập nhật từ nút "Cập nhật" hoặc "Sửa" trên mỗi bản ghi trong danh sách nhà trạm phao tiêu.
- Hệ thống chỉ cho phép cập nhật đối với bản ghi ở trạng thái DRAFT hoặc APPROVED_L1. Các trạng thái khác hiển thị thông báo "Không thể cập nhật nhà trạm ở trạng thái hiện tại".
- Form cập nhật điền sẵn dữ liệu hiện tại của bản ghi trên tất cả 8 nhóm thông tin.
- Người dùng có thể thêm/xóa/sửa tọa độ trong danh sách tọa độ (Nhóm 2).
- Người dùng có thể upload file đính kèm mới và xóa file đính kèm cũ (Nhóm 3).
- Người dùng có thể thêm/sửa/xóa phao tiêu trực thuộc trong danh sách con (Nhóm 4).
- Người dùng có thể cập nhật thông tin phê duyệt, kế hoạch vận hành, kế hoạch bảo trì và danh sách sự cố (Nhóm 5-8).
- Hệ thống ghi nhận mọi thay đổi vào lịch sử biến động với thông tin: trường thay đổi, giá trị cũ, giá trị mới, người thay đổi, thời gian thay đổi.
- Sau khi lưu, bản ghi tự động chuyển trạng thái sang PENDING (chờ duyệt lại).
- Người dùng nhận thông báo "Cập nhật nhà trạm phao tiêu thành công. Bản ghi đang chờ phê duyệt lại."

## In Scope
- Form cập nhật toàn bộ 8 nhóm thông tin của nhà trạm phao tiêu
- Kiểm tra trạng thái bản ghi trước khi cho phép cập nhật (chỉ DRAFT và APPROVED_L1)
- Thêm/xóa/sửa danh sách tọa độ
- Upload và xóa file đính kèm
- Thêm/sửa/xóa danh sách phao tiêu trực thuộc
- Cập nhật thông tin phê duyệt, kế hoạch vận hành, kế hoạch bảo trì, sự cố
- So sánh và ghi nhận thay đổi vào lịch sử biến động
- Tự động chuyển trạng thái sang PENDING sau khi cập nhật
- Thông báo kết quả cập nhật

## Out of Scope
- Tạo mới nhà trạm phao tiêu (thuộc F-092)
- Phê duyệt nhà trạm phao tiêu
- Xóa nhà trạm phao tiêu (thuộc F-094)
- Xem chi tiết nhà trạm phao tiêu (thuộc F-095)
- Xem toàn bộ lịch sử thay đổi
- Khôi phục phiên bản cũ
- Cập nhật hàng loạt

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Cập nhật (DRAFT/APPROVED_L1), Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt cập nhật |
| Lãnh đạo Cục | Xem chi tiết, Phê duyệt cập nhật |
| Admin hệ thống | Cập nhật mọi trạng thái, Xem toàn bộ |

## Architecture Notes
- Frontend: Form cập nhật React tái sử dụng component từ form tạo mới, pre-populate dữ liệu từ API GET detail. Hiển thị badge "Đã thay đổi" cho các section có diff. Confirmation dialog trước khi lưu thay đổi.
- Backend: Endpoint PUT `/api/v1/buoy-beacon-stations/{id}`, service layer thực hiện: (1) kiểm tra trạng thái cho phép, (2) so sánh diff từng trường, (3) ghi change log vào bảng `buoy_beacon_station_changes`, (4) cập nhật bản ghi, (5) chuyển trạng thái sang PENDING.
- Audit log: Bảng `buoy_beacon_station_changes` lưu: stationId, fieldName, oldValue, newValue, changedBy, changedAt, changeType (UPDATE/ADD/DELETE).
- Versioning: Mỗi lần lưu tạo một snapshot phiên bản mới, không ghi đè dữ liệu cũ ngay lập tức. Cho phép xem lại phiên bản trước khi cập nhật.

## Entities
- **BuoyBeaconStation**: id, organizationId, operatingOrgId, portId, waterwayId, waterwayRouteId, code, name, province, address, constructionDate, totalArea, usableArea, staffCount, lastMaintenanceYear, status, note, approvalStatus, objectType, icon, coordinateSystem, displayFormat, updatedBy, updatedAt
- **BuoyBeaconStationCoordinate**: id, stationId, latitude, longitude, orderIndex
- **BuoyBeaconStationAttachment**: id, stationId, fileName, fileUrl, fileSize, uploadedBy, uploadedAt
- **BuoyBeaconSubItem**: id, stationId, category (PHAO/TIEU), buoyType, beaconType, code, name
- **BuoyBeaconStationChange**: id, stationId, fieldName, oldValue, newValue, changedBy, changedAt, changeType

## Business Rules
1. Chỉ nhà trạm phao tiêu ở trạng thái DRAFT hoặc APPROVED_L1 mới cho phép cập nhật. Bản ghi ở trạng thái APPROVED, PUBLISHED hoặc REJECTED không được phép sửa.
2. Mã nhà trạm (code) là trường bất biến (immutable), không được phép thay đổi khi cập nhật.
3. Tên nhà trạm (name) và danh sách tọa độ (coordinates) là bắt buộc, không cho phép xóa trống.
4. Mọi thay đổi phải được ghi nhận vào lịch sử biến động với thông tin: trường thay đổi, giá trị cũ, giá trị mới, người thay đổi và thời gian.
5. Sau khi cập nhật, bản ghi tự động chuyển sang trạng thái PENDING và yêu cầu phê duyệt lại toàn bộ.
6. Khi thêm/xóa phao tiêu trực thuộc (Nhóm 4), hệ thống ghi nhận từng thao tác thêm/xóa vào lịch sử.
7. File đính kèm cũ bị xóa sẽ được chuyển vào thùng rác tạm thời (soft delete) trước khi xóa vĩnh viễn sau 30 ngày.

## Testing Strategy
- Unit test: Kiểm tra service layer chỉ cho phép cập nhật khi trạng thái DRAFT/APPROVED_L1; kiểm tra ghi change log đầy đủ; kiểm tra chuyển trạng thái sang PENDING.
- Integration test: Gọi API PUT với trạng thái DRAFT → 200 + chuyển PENDING; gọi với trạng thái APPROVED → 403 Forbidden; gọi với mã trùng → 409 Conflict.
- E2E test: Tạo nhà trạm DRAFT, cập nhật tên và tọa độ, xác nhận change log có 2 bản ghi thay đổi, trạng thái chuyển PENDING.
