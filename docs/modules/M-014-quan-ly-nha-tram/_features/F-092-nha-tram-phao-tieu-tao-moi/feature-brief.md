---
id: F-092
name: Nhà trạm phao tiêu - Tạo mới
slug: nha-tram-phao-tieu-tao-moi
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-07-30T00:00:00Z
last-updated: 2026-07-30T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Nhà trạm phao tiêu - Tạo mới

## Description
Tính năng cho phép Chuyên viên đăng nhập hệ thống và tạo mới hồ sơ Nhà trạm phao tiêu thông qua form nhập liệu đầy đủ 8 nhóm thông tin: (1) thông tin chung bao gồm đơn vị quản lý, đơn vị khai thác, thuộc cảng biển, luồng hàng hải, mã và tên nhà trạm, địa điểm, diện tích, nhân sự, tình trạng; (2) thông tin vị trí với loại đối tượng điểm, biểu tượng, hệ quy chiếu WGS-84, quy tắc hiển thị DMS và danh sách tọa độ; (3) file đính kèm; (4) danh sách phao, tiêu trực thuộc; (5) thông tin phê duyệt; (6) kế hoạch vận hành khai thác; (7) kế hoạch bảo trì; (8) danh sách sự cố. Sau khi tạo thành công, bản ghi có trạng thái DRAFT và phải trải qua quy trình phê duyệt trước khi chính thức có hiệu lực. Tất cả các trường thuộc Nhóm 1 và Nhóm 2 đều có thể nhập liệu ngay tại form tạo; các nhóm 3-8 có thể được bổ sung sau thông qua chức năng cập nhật.

## Business Intent
Nhà trạm phao tiêu là cơ sở hạ tầng hàng hải quan trọng phục vụ công tác dẫn đường, cảnh báo luồng lạch và đảm bảo an toàn hàng hải. Việc tạo mới hồ sơ nhà trạm phao tiêu với đầy đủ 8 nhóm thông tin giúp hệ thống có một bức tranh toàn diện về từng nhà trạm — từ vị trí địa lý, tình trạng khai thác, danh sách phao tiêu trực thuộc, đến kế hoạch vận hành, bảo trì và lịch sử sự cố. Dữ liệu chính xác và đầy đủ ngay từ đầu giúp giảm thiểu rủi ro sai sót trong công tác quản lý, hỗ trợ ra quyết định kịp thời về bảo trì, đầu tư và xử lý sự cố.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập giao diện quản lý nhà trạm phao tiêu, chọn chức năng "Thêm mới". Hệ thống hiển thị form tạo với các nhóm thông tin được sắp xếp theo tab hoặc section: Nhóm 1 (Thông tin chung) bao gồm các trường đơn vị quản lý, đơn vị khai thác, cảng biển, luồng hàng hải, mã và tên nhà trạm, tỉnh/thành phố, địa chỉ, diện tích, nhân sự, tình trạng; Nhóm 2 (Vị trí) cho phép nhập loại đối tượng, chọn biểu tượng, thiết lập tọa độ dạng danh sách với hệ WGS-84 và hiển thị DMS, có thể tích hợp bản đồ để chọn tọa độ trực quan. Người dùng điền đầy đủ các trường bắt buộc (mã, tên, tọa độ) và các trường khuyến khích khác. Hệ thống validate dữ liệu: kiểm tra mã duy nhất, tọa độ trong phạm vi cho phép, định dạng số hợp lệ. Nếu hợp lệ, hệ thống tạo bản ghi với trạng thái DRAFT, hiển thị thông báo thành công và đưa người dùng về danh sách nhà trạm phao tiêu.

## Acceptance Criteria
- Chuyên viên có thể truy cập form tạo mới nhà trạm phao tiêu từ nút "Thêm mới" trong màn hình danh sách.
- Form hiển thị đầy đủ 8 nhóm thông tin theo đúng cấu trúc: (1) Thông tin chung, (2) Vị trí, (3) File đính kèm, (4) Danh sách phao tiêu, (5) Phê duyệt, (6) Vận hành khai thác, (7) Bảo trì, (8) Sự cố.
- Các trường bắt buộc gồm: mã nhà trạm (code), tên nhà trạm (name), danh sách tọa độ (coordinates) — hiển thị dấu * đỏ bên cạnh.
- Hệ thống validate mã duy nhất: nếu mã đã tồn tại, hiển thị lỗi "Mã nhà trạm đã tồn tại trong hệ thống".
- Hệ thống validate tọa độ nằm trong vùng biển Việt Nam (kinh độ: 101°Đ – 117°Đ, vĩ độ: 8°B – 23°B).
- Sau khi tạo thành công, bản ghi có trạng thái DRAFT và hiển thị ngay trong danh sách với trạng thái tương ứng.
- Các nhóm 3-8 có thể để trống khi tạo mới và được bổ sung sau qua chức năng cập nhật.
- Người dùng nhận được thông báo thành công dạng toast "Tạo mới nhà trạm phao tiêu thành công".

## In Scope
- Form tạo mới nhà trạm phao tiêu với 8 nhóm thông tin đầy đủ
- Nhập liệu thông tin chung: đơn vị quản lý, đơn vị khai thác, cảng biển, luồng hàng hải, tuyến luồng, mã/tên nhà trạm, tỉnh/thành phố, địa chỉ, thời điểm xây dựng, diện tích, nhân sự, tình trạng, ghi chú
- Nhập liệu vị trí: loại đối tượng (Đối tượng điểm), biểu tượng, hệ quy chiếu WGS-84, quy tắc hiển thị DMS, danh sách tọa độ
- Validate dữ liệu đầu vào (required fields, mã duy nhất, định dạng tọa độ, số dương)
- Tự động gán trạng thái DRAFT và trạng thái phê duyệt mặc định
- Thông báo kết quả tạo mới (thành công / lỗi)
- Hiển thị danh sách nhà trạm phao tiêu sau khi tạo

## Out of Scope
- Phê duyệt nhà trạm phao tiêu (chuyển từ DRAFT sang PENDING/APPROVED)
- Cập nhật thông tin sau khi tạo (thuộc F-093)
- Xóa nhà trạm phao tiêu (thuộc F-094)
- Xem chi tiết nhà trạm phao tiêu (thuộc F-095)
- Xem lịch sử thay đổi
- Xuất/import dữ liệu hàng loạt
- Tích hợp bản đồ tương tác để chọn tọa độ (có thể ở phiên bản sau)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem danh sách |
| Trưởng phòng | Xem danh sách, Xem chi tiết |
| Lãnh đạo Cục | Xem danh sách, Xem chi tiết |
| Admin hệ thống | Tạo mới, Xem toàn bộ |

## Architecture Notes
- Frontend: Form React với các section collapse/tab cho 8 nhóm thông tin, validation đồng bộ client-side (Yup/Formik) và server-side. Tích hợp bản đồ Leaflet để chọn tọa độ. Upload file sử dụng Ant Design Upload component.
- Backend: Endpoint RESTful POST `/api/v1/buoy-beacon-stations` thuộc controller `BuoyBeaconStationController`, service layer xử lý validate và tạo mới với transaction bao gồm cả danh sách tọa độ con.
- Database: INSERT vào bảng `buoy_beacon_stations` (thông tin chung) + `buoy_beacon_station_coordinates` (danh sách tọa độ) trong cùng một transaction. Các nhóm 3-8 tạo bản ghi rỗng hoặc nullable.
- State machine: Trạng thái ban đầu luôn là `DRAFT`, chờ thao tác trình duyệt để chuyển sang `PENDING`.

## Entities
- **BuoyBeaconStation**: id, organizationId, operatingOrgId, portId, waterwayId, waterwayRouteId, code, name, province, address, constructionDate, totalArea, usableArea, staffCount, lastMaintenanceYear, status, note, approvalStatus, objectType, icon, coordinateSystem, displayFormat, createdBy, updatedBy, createdAt, updatedAt
- **BuoyBeaconStationCoordinate**: id, stationId, latitude, longitude, orderIndex
- **BuoyBeaconStationAttachment**: id, stationId, fileName, fileUrl, fileSize, uploadedBy, uploadedAt
- **BuoyBeaconSubItem**: id, stationId, category (PHAO/TIEU), buoyType, beaconType, code, name

## Business Rules
1. Mã nhà trạm phao tiêu (code) phải là duy nhất trên toàn hệ thống, không được trùng lặp khi tạo mới.
2. Tên nhà trạm (name) và danh sách tọa độ (coordinates) là bắt buộc, không cho phép bỏ trống.
3. Tọa độ phải nằm trong vùng biển Việt Nam (kinh độ: 101°Đ – 117°Đ, vĩ độ: 8°B – 23°B), nếu không hiển thị cảnh báo.
4. Trạng thái mặc định của bản ghi mới tạo là DRAFT, trạng thái phê duyệt mặc định là DRAFT (chưa gửi duyệt).
5. Các trường số (totalArea, usableArea, staffCount) phải là số không âm.
6. Danh sách tọa độ phải có tối thiểu 1 tọa độ hợp lệ.
7. Các nhóm thông tin 3-8 không bắt buộc khi tạo mới, có thể bổ sung sau.

## Testing Strategy
- Unit test: Kiểm tra validate mã duy nhất, required fields trên service layer. Kiểm tra transaction rollback khi insert coordinate thất bại.
- Integration test: Gọi API POST với dữ liệu hợp lệ → 201 + bản ghi DRAFT; gọi với mã trùng → 409 Conflict; gọi thiếu tọa độ → 400 Bad Request.
- E2E test: Tạo mới nhà trạm phao tiêu từ UI với đầy đủ thông tin, xác nhận bản ghi xuất hiện trong danh sách với trạng thái DRAFT.
