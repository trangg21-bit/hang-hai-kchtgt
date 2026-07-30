---
id: F-095
name: Nhà trạm phao tiêu - Xem chi tiết
slug: nha-tram-phao-tieu-xem-chi-tiet
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-07-30T00:00:00Z
last-updated: 2026-07-30T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Nhà trạm phao tiêu - Xem chi tiết

## Description
Tính năng cho phép mọi người dùng có quyền truy cập tra cứu và xem chi tiết toàn bộ thông tin của một nhà trạm phao tiêu thông qua popup đọc-only. Popup hiển thị đầy đủ 8 nhóm thông tin: (1) thông tin chung với đơn vị quản lý, đơn vị khai thác, cảng biển, luồng hàng hải, mã/tên nhà trạm, địa điểm, diện tích, nhân sự, tình trạng; (2) thông tin vị trí với danh sách tọa độ hiển thị trên bản đồ tích hợp; (3) danh sách file đính kèm cho phép tải xuống; (4) danh sách phao tiêu trực thuộc; (5) thông tin phê duyệt 2 cấp; (6) kế hoạch vận hành; (7) kế hoạch bảo trì; (8) danh sách sự cố. Popup được kích hoạt từ biểu tượng "mắt" (EyeOutlined) trên mỗi dòng trong danh sách nhà trạm phao tiêu. Toàn bộ dữ liệu hiển thị ở chế độ đọc-only, không cho phép chỉnh sửa trực tiếp từ popup.

## Business Intent
Cho phép mọi người dùng có quyền truy cập (Chuyên viên, Trưởng phòng, Lãnh đạo Cục, Admin) tra cứu nhanh và đầy đủ thông tin của bất kỳ nhà trạm phao tiêu nào trong hệ thống. Việc hiển thị dưới dạng popup (không chuyển trang) giúp người dùng xem nhanh thông tin mà không mất ngữ cảnh danh sách. Popup xem chi tiết đóng vai trò là nguồn tham khảo chính xác và duy nhất cho mọi quyết định liên quan đến nhà trạm — từ lập kế hoạch bảo trì, xử lý sự cố, đến đánh giá tình trạng vận hành.

## Flow Summary
Người dùng đang xem danh sách nhà trạm phao tiêu, tìm bản ghi cần tra cứu và nhấn vào biểu tượng "mắt" (EyeOutlined) ở cột hành động trên dòng tương ứng. Hệ thống gọi API GET chi tiết để lấy toàn bộ dữ liệu của nhà trạm bao gồm 8 nhóm thông tin, sau đó hiển thị popup modal với layout chia theo các tab hoặc section có thể cuộn (scroll). Tab đầu tiên "Thông tin chung" hiển thị các trường: đơn vị quản lý, đơn vị khai thác, cảng biển, luồng, tuyến luồng, mã/tên, tỉnh/thành phố, địa chỉ, thời điểm xây dựng, tổng diện tích, diện tích sử dụng, số nhân sự, năm bảo trì gần nhất, tình trạng, ghi chú, trạng thái phê duyệt. Tab "Vị trí" hiển thị danh sách tọa độ dạng bảng và đánh dấu trên bản đồ nhỏ. Tab "File đính kèm" liệt kê danh sách file với nút tải xuống. Tab "Phao tiêu trực thuộc" hiển thị danh sách phao/tiêu con. Các tab còn lại hiển thị thông tin phê duyệt, kế hoạch vận hành, kế hoạch bảo trì và sự cố. Popup có nút "Đóng" để quay lại danh sách. Không có nút "Sửa" hay "Xóa" trong popup — các thao tác này được thực hiện từ màn hình danh sách.

## Acceptance Criteria
- Biểu tượng "mắt" (EyeOutlined) hiển thị trên mỗi dòng trong danh sách nhà trạm phao tiêu, ở cột hành động.
- Nhấn vào biểu tượng mắt mở popup modal hiển thị chi tiết nhà trạm phao tiêu ở chế độ đọc-only.
- Popup hiển thị đầy đủ 8 nhóm thông tin theo tab hoặc section:
  - Tab 1 — Thông tin chung: tất cả trường Nhóm 1
  - Tab 2 — Vị trí: loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, danh sách tọa độ + bản đồ
  - Tab 3 — File đính kèm: danh sách file với nút tải xuống
  - Tab 4 — Phao tiêu trực thuộc: danh sách phao/tiêu với phân loại, mã, tên
  - Tab 5 — Phê duyệt: thông tin phê duyệt 2 cấp (nội dung, ngày, cán bộ)
  - Tab 6 — Vận hành khai thác: danh sách kế hoạch vận hành
  - Tab 7 — Bảo trì: danh sách kế hoạch bảo trì
  - Tab 8 — Sự cố: danh sách sự cố (mã, loại, địa điểm, thời gian)
- Danh sách tọa độ được hiển thị dạng bảng (STT, vĩ độ, kinh độ) và đánh dấu trên bản đồ tích hợp (Leaflet).
- File đính kèm hiển thị tên file, dung lượng và nút tải xuống.
- Mọi dữ liệu trong popup đều ở chế độ đọc-only, không có nút chỉnh sửa hay xóa.
- Popup có nút "Đóng" để quay lại danh sách.
- Mọi role có quyền truy cập (Chuyên viên, Trưởng phòng, Lãnh đạo Cục, Admin) đều xem được chi tiết.

## In Scope
- Popup modal xem chi tiết nhà trạm phao tiêu với 8 tab thông tin
- Hiển thị danh sách tọa độ dạng bảng + bản đồ tích hợp
- Danh sách file đính kèm với nút tải xuống (download)
- Danh sách phao tiêu trực thuộc
- Thông tin phê duyệt 2 cấp
- Danh sách kế hoạch vận hành, kế hoạch bảo trì, sự cố
- Nút đóng popup

## Out of Scope
- Tạo mới nhà trạm phao tiêu (thuộc F-092)
- Cập nhật thông tin (thuộc F-093)
- Xóa nhà trạm phao tiêu (thuộc F-094)
- Phê duyệt nhà trạm phao tiêu
- Xem lịch sử thay đổi chi tiết
- In ấn / xuất PDF thông tin chi tiết
- Chia sẻ link xem chi tiết

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xem chi tiết |
| Trưởng phòng | Xem chi tiết |
| Lãnh đạo Cục | Xem chi tiết |
| Admin hệ thống | Xem chi tiết toàn bộ |

## Architecture Notes
- Frontend: Popup modal React (Ant Design Modal) với Tabs (Ant Design Tabs) cho 8 nhóm thông tin. Bản đồ Leaflet nhúng trong tab Vị trí với các marker đánh dấu tọa độ. Danh sách file sử dụng Ant Design Table hoặc List với nút Download.
- Backend: Endpoint GET `/api/v1/buoy-beacon-stations/{id}/detail` trả về full DTO bao gồm tất cả 8 nhóm thông tin trong một response. Cache ngắn hạn (5 phút) để giảm tải database.
- Authorization: Middleware xác thực — tất cả authenticated users đều được phép xem chi tiết. Không phân biệt role cho hành động xem.
- API response structure: `{ station: {...}, coordinates: [...], attachments: [...], subItems: [...], approvals: { l1: {...}, l2: {...} }, operationPlans: [...], maintenancePlans: [...], incidents: [...] }`

## Entities
- **BuoyBeaconStationDetail** (composite DTO): id, organization, operatingOrg, port, waterway, waterwayRoute, code, name, province, address, constructionDate, totalArea, usableArea, staffCount, lastMaintenanceYear, status, note, approvalStatus, objectType, icon, coordinateSystem, displayFormat, createdBy, updatedBy, createdAt, updatedAt, coordinates[], attachments[], subItems[], approvalL1, approvalL2, operationPlans[], maintenancePlans[], incidents[]

## Business Rules
1. Mọi người dùng đã đăng nhập và có quyền truy cập module M-014 đều được xem chi tiết nhà trạm phao tiêu, không phân biệt trạng thái của bản ghi (DRAFT, PENDING, APPROVED, REJECTED).
2. Popup hiển thị ở chế độ đọc-only tuyệt đối — không có button, input, toggle, hay bất kỳ thành phần tương tác nào có thể thay đổi dữ liệu.
3. Các file đính kèm chỉ hiển thị nút tải xuống, không hiển thị nút xóa hoặc chỉnh sửa.
4. Danh sách tọa độ hiển thị chính xác đến 6 chữ số thập phân theo chuẩn DMS hoặc thập phân tùy theo quy tắc hiển thị của bản ghi.
5. Bản đồ hiển thị tất cả các tọa độ của nhà trạm dưới dạng marker, tự động zoom để fit toàn bộ các marker.
6. Thông tin phê duyệt 2 cấp chỉ hiển thị nếu đã có dữ liệu; nếu chưa có thì hiển thị "Chưa có thông tin phê duyệt".

## Testing Strategy
- Unit test: Kiểm tra service layer trả về đúng composite DTO bao gồm tất cả 8 nhóm dữ liệu; kiểm tra xử lý khi bản ghi không có dữ liệu con (empty arrays).
- Integration test: Gọi GET `/api/v1/buoy-beacon-stations/{id}/detail` với id hợp lệ → 200 + đầy đủ 8 nhóm; gọi với id không tồn tại → 404; gọi không có token → 401.
- E2E test: Truy cập danh sách, nhấn icon mắt trên một bản ghi, xác nhận popup hiển thị đúng 8 tab thông tin, kiểm tra bản đồ hiển thị marker tọa độ, kiểm tra nút tải file hoạt động.
