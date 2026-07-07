---
id: F-078
name: "Danh sách Cầu cảng"
slug: ui-ql-cc-danh-sach
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:25Z"
last-updated: "2026-07-01T04:08:25Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Danh sách Cầu cảng

## Description

Giao diện danh sách Cầu cảng cho phép người dùng hiển thị toàn bộ danh sách các cầu cảng trong hệ thống quản lý tài sản giao thông vận tải biển với phân trang tùy chọn 20 hoặc 100 bản ghi mỗi trang. Danh sách được sắp xếp mặc định theo updatedAt giảm dần, hỗ trợ tìm kiếm nhanh theo mã cầu cảng (maCau) và tên cầu cảng (tenCau), cùng khả năng lọc theo trạng thái hoạt động (HIEN_HANH/TAM_NGUNG) và trạng thái phê duyệt (CHO_PHE_DUYET/DUOC_PHE_DUYET/TU_CHOI). Mỗi dòng hiển thị các thông tin chính: mã cầu cảng, tên cầu cảng, tên bến cảng cha (benCangId), chiều dài, chiều rộng, loại cầu cảng, trạng thái hoạt động và trạng thái phê duyệt. Người dùng có thể thực hiện các thao tác xem chi tiết, chỉnh sửa, xóa hoặc phê duyệt (đối với Leader) từ ngay hàng danh sách. Giao diện hỗ trợ điều hướng bằng bàn phím (Tab để di chuyển giữa các trường lọc và Enter để kích hoạt hành động). Nguồn: TKCT UC 12.

## Business Intent

Cho phép quản lý viên và lãnh đạo theo dõi, tìm kiếm và lọc toàn bộ danh sách cầu cảng hiện có trong hệ thống, từ đó hỗ trợ ra quyết định vận hành và phê duyệt tài sản cảng một cách nhanh chóng và chính xác.

## Flow Summary

Người dùng truy cập vào menu "Cầu cảng" → hệ thống hiển thị danh sách cầu cảng với phân trang 20 bản ghi, sắp xếp theo updatedAt DESC. Người dùng có thể nhập từ khóa tìm kiếm vào ô search (tìm theo maCau hoặc tenCau), chọn bộ lọc trạng thái hoạt động, chọn bộ lọc trạng thái phê duyệt, và chọn bộ lọc theo bến cảng cha. Kết quả danh sách được cập nhật động theo các bộ lọc. Từ mỗi dòng, người dùng có thể click vào cột mã/tên để xem chi tiết (F-079), click "Chỉnh sửa" để sửa thông tin (F-081), click "Xóa" để xóa mềm (F-097), Leader click "Phê duyệt" (F-082) hoặc click "Lịch sử" để xem lịch sử thay đổi (F-098). Tất cả thao tác đều có xác nhận khi cần. Phím Tab để di chuyển giữa các thành phần điều khiển và Enter để kích hoạt hành động.

## Acceptance Criteria

1. Giao diện hiển thị danh sách cầu cảng với phân trang, mặc định 20 bản ghi/trang, có thể chọn 100 bản ghi/trang.
2. Danh sách được sắp xếp mặc định theo updatedAt giảm dần (mới nhất lên đầu).
3. Ô tìm kiếm cho phép tìm theo mã cầu cảng (maCau) và tên cầu cảng (tenCau) — kết quả trả về bất kỳ trường nào chứa từ khóa tìm kiếm.
4. Bộ lọc trạng thái hoạt động cho phép lọc theo giá trị HIEN_HANH hoặc TAM_NGUNG.
5. Bộ lọc trạng thái phê duyệt cho phép lọc theo giá trị CHO_PHE_DUYET, DUOC_PHE_DUYET hoặc TU_CHOI.
6. Bộ lọc theo bến cảng cha (benCangId) hiển thị danh sách dropdown các bến cảng có sẵn.
7. Mỗi dòng hiển thị đúng 7 cột: maCau, tenCau, tên benCang (từ FK), chieuDai (m), chieuRong (m), loaiCau, trangThaiHoatDong, trangThaiPheDuyet.
8. Thao tác "Xem chi tiết" chuyển người dùng đến trang F-079 với đúng cầu cảng được chọn.
9. Thao tác "Chỉnh sửa" chuyển người dùng đến trang F-081 với form đã điền sẵn dữ liệu cầu cảng được chọn.
10. Thao tác "Xóa" kích hoạt hộp thoại xác nhận trước khi gọi DELETE API (F-097).
11. Leader có thể click "Phê duyệt" để chuyển đến trang F-082 cho cầu cảng CHO_PHE_DUYET.
12. Thao tác "Lịch sử" chuyển người dùng đến trang F-098 cho cầu cảng được chọn.
13. Hỗ trợ điều hướng bằng bàn phím: Tab di chuyển giữa các thành phần, Enter kích hoạt hành động.

## In Scope

- API GET /api/v1/cau-cang với phân trang, sắp xếp, tìm kiếm và lọc.
- Bảng danh sách với các cột: maCau, tenCau, benCang tên, chieuDai, chieuRong, loaiCau, trangThaiHoatDong, trangThaiPheDuyet, updatedAt.
- Phân trang tùy chọn 20 hoặc 100 bản ghi.
- Sắp xếp mặc định theo updatedAt DESC, có thể đổi hướng.
- Tìm kiếm theo maCau và tenCau.
- Bộ lọc theo trangThaiHoatDong, trangThaiPheDuyet, benCangId.
- Các hành động trên mỗi dòng: xem chi tiết, chỉnh sửa, xóa, phê duyệt (Leader), xem lịch sử.
- Điều hướng bàn phím (Tab/Enter).

## Out of Scope

- Xuất danh sách ra Excel/PDF.
- Import danh sách cầu cảng từ file.
- Bulk edit hoặc bulk approve nhiều cầu cảng cùng lúc.
- Báo cáo thống kê số lượng cầu cảng theo loại/trạng thái.
- Xem trước file đính kèm từ danh sách.
- Filter theo khoảng ngày updatedAt.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quan ly tai san | read | Xem danh sách cầu cảng, tìm kiếm, lọc, xem chi tiết |
| Quan ly tai san | update | Chỉnh sửa thông tin cầu cảng (F-081) |
| Quan ly tai san | delete | Xóa mềm cầu cảng (F-097) |
| Linh dao | approve | Phê duyệt hoặc từ chối cầu cảng (F-082) |
| Admin | approve | Phê duyệt hoặc từ chối cầu cảng (F-082) |

## Entities

- **CauCang**: id (UUID), maCau (string unique), tenCau (string), benCangId (UUID FK → BenCang), chieuDai (decimal m), chieuRong (decimal m), loaiCau (enum: DAI_TRO, BIT_NEO, LAN_THANH, DO_BIN_DAU_LOI, THUY_SAN), ghiChu (text), trangThaiHoatDong (enum: HIEN_HANH, TAM_NGUNG), trangThaiPheDuyet (enum: CHO_PHE_DUYET, DUOC_PHE_DUYET, TU_CHOI), orgUnitId (UUID), createdBy (UUID), updatedBy (UUID), createdAt, updatedAt, deletedAt (nullable)
- **BenCang** (FK): id (UUID), tenBenCang (string), trangThaiHoatDong (enum)

## Business Rules

1. maCau phải là duy nhất trong toàn bộ hệ thống — không được phép tạo mới hoặc cập nhật với mã đã tồn tại.
2. Parent BenCang (benCangId) phải tồn tại trong hệ thống và có trangThaiHoatDong = HIEN_HANH — việc tạo cầu cảng cho bến cảng đang TAM_NGUNG hoặc không tồn tại sẽ bị từ chối.
3. Mặc định trangThaiPheDuyet = CHO_PHE_DUYET khi tạo mới cầu cảng — cầu cảng chưa được phê duyệt không được đưa vào vận hành.
4. Xóa cầu cảng là xóa mềm (soft-delete): set deletedAt → không xóa dữ liệu vật lý, vẫn hiển thị trong lịch sử.

## Testing Strategy

Kiểm thử đơn vị (unit test) cho các endpoint API GET /api/v1/cau-cang với các tham số phân trang, sắp xếp, tìm kiếm và lọc, xác nhận các bộ lọc hoạt động độc lập và kết hợp. Kiểm thử tích hợp (integration test) cho flow đầy đủ: tạo cầu cảng → danh sách hiển thị → lọc theo từng tiêu chí → xem chi tiết → chỉnh sửa → phê duyệt/từ chối → xóa mềm → xác nhận trạng thái cuối cùng trong danh sách. Kiểm thử UI cho các thành phần bảng danh sách, phân trang, ô tìm kiếm, bộ lọc dropdown, và điều hướng bàn phím (Tab/Enter). Kiểm thử quyền truy cập (authorization test) xác nhận các role khác nhau chỉ thấy các hành động được phân quyền đúng (Leader thấy nút "Phê duyệt", user thường chỉ thấy "Xem/Chỉnh sửa/Xóa").
