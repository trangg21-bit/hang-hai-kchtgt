---
id: F-142
name: "Lịch sử Vùng nước"
slug: ui-ql-vn-lich-su
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T07:52:15Z"
last-updated: "2026-07-01T07:52:15Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Lịch sử Vùng nước

## Description

Tính năng Lịch sử Vùng nước cung cấp giao diện bảng hiển thị toàn bộ lịch sử thay đổi (LichSuThayDoi) của một vùng nước cụ thể, cho phép người dùng theo dõi mọi thay đổi về thông tin vùng nước theo thời gian. Trang mở từ nút "Lịch sử" trên trang Danh sách Vùng nước (F-136) hoặc trang Chi tiết (F-137), truyền theo ID vùng nước. Bảng hiển thị các cột: trường thay đổi (Field), giá trị cũ (Old Value), giá trị mới (New Value), người thay đổi (Changed By), thời gian thay đổi (Changed At). Dữ liệu được sắp xếp theo `changedAt` giảm dần (thay đổi mới nhất hiển thị đầu tiên). Có bộ lọc dropdown để lọc theo trường thay đổi (Field filter). Dòng đầu tiên của lịch sử luôn có indicator "Tạo mới" (action = CREATE) với tất cả các trường đều có giá trị mới (newValue) và oldValue là null. Các dòng sau là "Cập nhật" (action = UPDATE) với oldValue và newValue khác nhau. Khi một dòng được click, hệ thống mở drawer/modal hiển thị chi tiết thay đổi bao gồm cả thông tin người dùng thực hiện thay đổi.

## Business Intent

Cho phép người dùng truy vết và kiểm toán toàn bộ lịch sử thay đổi của một vùng nước, bao gồm lần tạo đầu tiên và mọi lần cập nhật sau đó, phục vụ cho việc kiểm tra chất lượng dữ liệu, truy nguyên lỗi, và tuân thủ quy trình quản lý biến động thông tin.

## Flow Summary

Người dùng click nút "Lịch sử" từ trang Danh sách Vùng nước hoặc trang Chi tiết. Hệ thống gọi API `GET /api/v1/vung-nuoc/{id}/history` để lấy danh sách bản ghi LichSuThayDoi của vùng nước. Dữ liệu trả về được hiển thị trên bảng với các cột: Field, Old Value, New Value, Changed By, Changed At, sắp xếp theo changedAt DESC. Dòng đầu tiên có indicator "Tạo mới" (CREATE) với Old Value = null cho mọi trường. Các dòng sau có indicator "Cập nhật" (UPDATE). Người dùng có thể lọc theo Field bằng dropdown (tất cả / maVungNuoc / tenVungNuoc / loaiVungNuoc / cangBienId / dienTich / doSauMax / doSauTrungBinh / trangThaiHoatDong / trangThaiPheDuyet). Khi click một dòng trong bảng, hệ thống mở drawer chi tiết hiển thị thêm thông tin: email/username của người thay đổi (Changed By), giải thích chi tiết về thay đổi (nếu có), và timestamps chi tiết (created/updated). Breadcrumb hiển thị "Danh sách Vùng nước > Chi tiết {tenVungNuoc} > Lịch sử".

## Acceptance Criteria

1. Khi mở trang, hệ thống gọi `GET /api/v1/vung-nuoc/{id}/history` và hiển thị danh sách bản ghi LichSuThayDoi của vùng nước tương ứng, sắp xếp theo changedAt giảm dần (mới nhất đầu tiên).
2. Dòng đầu tiên của lịch sử có indicator "Tạo mới" (CREATE) với Old Value = null cho tất cả các trường và New Value là giá trị ban đầu của vùng nước.
3. Các dòng sau indicator "Cập nhật" (UPDATE), Old Value và New Value thể hiện giá trị trước và sau khi thay đổi.
4. Bảng hiển thị đúng các cột: Field, Old Value, New Value, Changed By, Changed At (định dạng yyyy-MM-dd HH:mm:ss).
5. Dropdown Field filter hiển thị các lựa chọn: "Tất cả", "maVungNuoc", "tenVungNuoc", "loaiVungNuoc", "cangBienId", "dienTich", "doSauMax", "doSauTrungBinh", "trangThaiHoatDong", "trangThaiPheDuyet" — khi chọn một Field cụ thể, bảng chỉ hiển thị các dòng có Field trùng khớp.
6. Khi click một dòng trong bảng, drawer/modal mở ra hiển thị chi tiết: tên/username của Changed By, thời gian changedAt chi tiết, và giải thích thay đổi (nếu có).
7. Breadcrumb hiển thị "Danh sách Vùng nước > Chi tiết {tenVungNuoc} > Lịch sử", click "Chi tiết" quay lại trang Chi tiết Vùng nước.
8. Khi không có bản ghi LichSuThayDoi, hiển thị thông báo "Không có lịch sử thay đổi".

## In Scope

- Bảng lịch sử thay đổi (LichSuThayDoi) của một vùng nước cụ thể
- Sắp xếp changedAt DESC
- Cột: Field, Old Value, New Value, Changed By, Changed At
- Indicator "Tạo mới" (CREATE) cho dòng đầu tiên
- Indicator "Cập nhật" (UPDATE) cho các dòng sau
- Dropdown Field filter để lọc theo trường thay đổi
- Drawer/modal chi tiết khi click dòng
- Breadcrumb điều hướng
- Không có bản ghi → thông báo "Không có lịch sử thay đổi"

## Out of Scope

- Chỉnh sửa trực tiếp từ bảng lịch sử
- Xóa bản ghi lịch sử
- Batch approve/reject từ trang lịch sử
- Xóa vùng nước (thuộc F-141)
- Export lịch sử ra file Excel/PDF
- so sánh song song 2 phiên bản vùng nước

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Read | Xem lịch sử thay đổi tất cả vùng nước của cảng |
| NhanVienCangBien (Nhân viên cảng) | Read | Xem lịch sử thay đổi vùng nước mình tạo/quản lý |
| LeDuan (Lãnh đạo) | Read + Approve | Xem lịch sử thay đổi và phê duyệt/từ chối |
| QuanTramMien (Quan tra miền) | Read only | Chỉ xem, không có quyền chỉnh sửa hay phê duyệt |

## Entities

| Entity | Fields |
|---|---|
| VungNuoc | id (UUID), maVungNuoc (string, unique, length≤50), tenVungNuoc (string, length≤255), cangBienId (UUID, parent), dienTich (BigDecimal, precision 15 scale 2), doSauMax (BigDecimal, precision 10 scale 2), doSauTrungBinh (BigDecimal, precision 10 scale 2), loaiVungNuoc (string, length≤100), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable) |
| LichSuThayDoi (change history) | id (UUID), vungNuocId (UUID), field (string), oldValue (text), newValue (text), changedBy (UUID), changedAt (datetime), action (enum: CREATE, UPDATE) |
| User (người thay đổi) | id (UUID), displayName (string), email (string) |
| CangBien (parent) | id (UUID), tenCangBien (string), trangThaiHoatDong (string) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | Bản ghi đầu tiên của lịch sử có `action = CREATE` với Old Value = null cho mọi trường, New Value là giá trị ban đầu khi tạo mới | GET /history | F-037 |
| BR-02 | Các bản ghi sau có `action = UPDATE`, Old Value ≠ New Value cho trường thay đổi | GET /history | F-037 |
| BR-03 | Dữ liệu lịch sử được sắp xếp theo changedAt giảm dần (mới nhất đầu tiên) | GET /history | INT-003 |
| BR-04 | Field filter dropdown chỉ hiển thị các field hợp lệ của VungNuoc: maVungNuoc, tenVungNuoc, loaiVungNuoc, cangBienId, dienTich, doSauMax, doSauTrungBinh, trangThaiHoatDong, trangThaiPheDuyet | GET /history | UI standard |

## Testing Strategy

Kiểm thử đơn vị (unit test) xác nhận backend: API GET /api/v1/vung-nuoc/{id}/history trả về danh sách LichSuThayDoi sắp xếp changedAt DESC, bản ghi đầu tiên có action=CREATE với oldValue=null, bản ghi sau có action=UPDATE. Kiểm thử tích hợp xác nhận việc tạo mới vùng nước (POST) tạo bản ghi CREATE đầu tiên, và mỗi lần cập nhật (PUT) tạo bản ghi UPDATE với oldValue/newValue chính xác. Kiểm thử E2E/UI sử dụng browser automation để verify: bảng hiển thị đúng danh sách LichSuThayDoi sắp xếp changedAt DESC, dòng đầu tiên có indicator "Tạo mới" với Old Value null, các dòng sau có indicator "Cập nhật", dropdown Field filter hoạt động đúng (lọc theo các trường: maVungNuoc, tenVungNuoc, loaiVungNuoc, dienTich, doSauMax, doSauTrungBinh, v.v.), click dòng mở drawer với thông tin chi tiết Changed By và changedAt, breadcrumb hiển thị đúng cấu trúc, và thông báo "Không có lịch sử thay đổi" xuất hiện khi không có bản ghi nào.
