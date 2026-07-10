---
id: F-089
name: "Chi tiết Vùng nước"
slug: ui-xem-vn-chi-tiet
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:44Z"
last-updated: "2026-07-01T04:08:44Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Chi tiết Vùng nước

## Description

Tính năng Chi tiết Vùng nước cung cấp giao diện hiển thị toàn bộ thông tin của một vùng nước cụ thể trong hệ thống quản lý tài sản cảng biển. Trang bao gồm breadcrumb điều hướng từ trang Danh sách Vùng nước → Chi tiết, cho phép người dùng quay lại danh sách hoặc chuyển sang trang cha (Cảng biển) thông qua tên cảng mẹ được hiển thị dưới dạng liên kết có thể click. Các trường thông tin hiển thị gồm: mã vùng nước (maVungNuoc), tên vùng nước (tenVungNuoc), loại vùng nước (loaiVungNuoc), cảng mẹ (tenCangBien — link đến Chi tiết Cảng biển), diện tích (dienTich — đơn vị km²), độ sâu max (doSauMax — đơn vị mét), độ sâu trung bình (doSauTrungBinh — đơn vị mét), trạng thái hoạt động (trangThaiHoatDong) với badge màu (xanh lá cho HIEN_HANH, đỏ cho TAM_NGUNG), trạng thái phê duyệt (trangThaiPheDuyet) với badge màu (vàng cho CHỜ_PHÊ_DUYỆT, xanh dương cho ĐƯỢC_PHÊ_DUYỆT, đỏ cho TỪ_CHỐI), và các trường hệ thống: tên người tạo (createdBy), tên người cập nhật cuối cùng (updatedBy), ngày tạo (createdAt), ngày cập nhật (updatedAt). Nếu vùng nước có danh mục tài liệu/tệp đính kèm (attachment list) dạng PDF, DOCX hoặc JPEG (tối đa 10MB/file), hệ thống hiển thị danh sách các tệp với nút tải xuống và in cho từng tệp. Dành cho người dùng có vai trò Lãnh đạo, trang chi tiết còn hiển thị các nút hành động Phê duyệt và Từ chối khi vùng nước ở trạng thái CHỜ_PHÊ_DUYỆT.

## Business Intent

Cho phép người dùng xem toàn bộ thông tin chi tiết của một vùng nước cụ thể, bao gồm thông tin cảng mẹ, diện tích, độ sâu, trạng thái hoạt động và phê duyệt, phục vụ cho việc rà soát, đánh giá và ra quyết định phê duyệt hoặc từ chối vùng nước.

## Flow Summary

Người dùng click vào tên vùng nước hoặc nút "Xem chi tiết" từ bảng Danh sách Vùng nước. Hệ thống gọi API `GET /api/v1/vung-nuoc/{id}` để lấy thông tin chi tiết của vùng nước. Đồng thời, hệ thống gọi API để lấy thông tin cảng mẹ (GET /api/v1/cang-bien/{cangBienId}) và hiển thị tên cảng dưới dạng liên kết. Nếu có quyền phê duyệt và trạng thái là CHO_PHE_DUYET, hệ thống hiển thị các nút "Phê duyệt" và "Từ chối". Nếu vùng nước có danh sách attachment, hệ thống gọi API `GET /api/v1/vung-nuoc/{id}/attachments` để lấy danh sách tài liệu, hiển thị tên tệp, định dạng, kích thước (MB) với nút tải xuống (download) và in (print) cho từng tệp. Breadcrumb hiển thị "Danh sách Vùng nước > Chi tiết {tenVungNuoc}". Người dùng click nút "Phê duyệt" hoặc "Từ chối" sẽ chuyển sang trang Phê duyệt Vùng nước (F-092) với ID tương ứng.

## Acceptance Criteria

1. Khi mở trang Chi tiết Vùng nước từ danh sách (click tên hoặc nút "Xem chi tiết"), hệ thống gọi `GET /api/v1/vung-nuoc/{id}` và hiển thị đúng toàn bộ thông tin của vùng nước được chọn.
2. Breadcrumb hiển thị "Danh sách Vùng nước > Chi tiết {tenVungNuoc}", click "Danh sách Vùng nước" quay lại trang danh sách, click tên cảng mẹ (cangBienId) chuyển đến trang Chi tiết Cảng biển tương ứng.
3. Các trường số (dienTich, doSauMax, doSauTrungBinh) hiển thị định dạng số thập phân với đúng số chữ số thập phân theo precision/scale của entity.
4. Badge trạng thái hoạt động: màu xanh lá cho HIEN_HANH, màu đỏ cho TAM_NGUNG; Badge trạng thái phê duyệt: màu vàng cho CHỜ_PHÊ_DUYỆT, màu xanh dương cho ĐƯỢC_PHÊ_DUYỆT, màu đỏ cho TỪ_CHỐI.
5. Nếu có danh sách attachment, hệ thống hiển thị tên tệp, định dạng (PDF/DOCX/JPEG), kích thước (MB), với nút "Tải xuống" và "In" cho từng tệp; các tệp vượt quá 10MB không được phép hiển thị.
6. Khi vùng nước có `trangThaiPheDuyet = CHO_PHE_DUYET` và người dùng có quyền phê duyệt, hiển thị nút "Phê duyệt" và "Từ chối" — click "Phê duyệt" chuyển đến trang Phê duyệt với đúng ID, click "Từ chối" cũng chuyển đến trang Phê duyệt với đúng ID.
7. Các trường hệ thống (createdBy, updatedBy, createdAt, updatedAt) hiển thị dưới dạng chuỗi định dạng thời gian có giờ: phút: giây, ví dụ "2026-07-01 10:30:45".

## In Scope

- Hiển thị toàn bộ thông tin vùng nước (tất cả các field của entity VungNuoc)
- Breadcrumb điều hướng từ Danh sách → Chi tiết, liên kết tên cảng mẹ đến Chi tiết Cảng biển
- Badge màu cho trạng thái hoạt động và trạng thái phê duyệt
- Định dạng số cho các trường diện tích và độ sâu (dienTich, doSauMax, doSauTrungBinh)
- Danh sách attachment (PDF/DOCX/JPEG, max 10MB) với nút download và print
- Nút Phê duyệt/Từ chối hiển thị cho Leaders khi trạng thái = CHO_PHE_DUYET
- Các trường hệ thống (createdBy, updatedBy, createdAt, updatedAt)

## Out of Scope

- Chỉnh sửa vùng nước trực tiếp trên trang chi tiết (thuộc F-091)
- Xóa vùng nước trực tiếp trên trang chi tiết (thuộc F-101)
- Quản lý attachment upload (thuộc tính năng quản lý tài liệu)
- Xem lịch sử thay đổi trên trang chi tiết (thuộc F-102)
- In toàn bộ thông tin vùng nước ra file PDF

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Read + Approve | Xem chi tiết tất cả vùng nước, phê duyệt/từ chối khi CHO_PHE_DUYET |
| NhanVienCangBien (Nhân viên cảng) | Read | Chỉ xem chi tiết, không có quyền phê duyệt hoặc từ chối |
| QuanTramMien (Quan tra miền) | Read | Chỉ xem chi tiết, không có quyền phê duyệt hoặc từ chối |
| LeDuan (Lãnh đạo) | Read + Approve | Xem chi tiết tất cả vùng nước, phê duyệt/từ chối khi CHO_PHE_DUYET |

## Entities

| Entity | Fields |
|---|---|
| VungNuoc | id (UUID), maVungNuoc (string, unique, length≤50), tenVungNuoc (string, length≤255), cangBienId (UUID, parent), dienTich (BigDecimal, precision 15 scale 2), doSauMax (BigDecimal, precision 10 scale 2), doSauTrungBinh (BigDecimal, precision 10 scale 2), loaiVungNuoc (string, length≤100), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (nullable) |
| Attachment (tùy chọn) | id (UUID), vungNuocId (UUID), tenFile (string), duoiFile (string), kichThuocMB (decimal), loai (PDF/DOCX/JPEG), duongDan (string), createdAt |
| CangBien (parent) | id (UUID), tenCangBien (string), diaChi (string), trangThaiHoatDong (enum), orgUnitId (UUID), createdAt, updatedAt |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | Các trường số (dienTich, doSauMax, doSauTrungBinh) hiển thị đúng định dạng BigDecimal theo precision/scale của entity | GET, Display | Type display |
| BR-02 | Tên cảng mẹ (cangBienId) phải được hiển thị dưới dạng liên kết đến trang Chi tiết Cảng biển | GET, Display | Parent link |
| BR-03 | Badge trạng thái phải tuân thủ màu sắc quy định: HIEN_HANH (xanh lá), TAM_NGUNG (đỏ), CHỜ_PHÊ_DUYỆT (vàng), ĐƯỢC_PHÊ_DUYỆT (xanh dương), TỪ_CHỐI (đỏ) | Display | UI standard |
| BR-04 | Attachment chỉ hiển thị nếu có, các tệp vượt quá 10MB không được phép xuất hiện trong danh sách | GET, Display | Attachment policy |
| BR-05 | Nút Phê duyệt/Từ chối chỉ hiển thị khi `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` và người dùng có quyền approve (`@auth.check(authentication, 'vungnuoc:approve')`) | Display, Action | RBAC |

## Testing Strategy

Kiểm thử đơn vị (unit test) xác nhận các business rule về định dạng các trường số (dienTich, doSauMax, doSauTrungBinh) và các rule về hiển thị badge theo trạng thái. Kiểm thử tích hợp (integration test) xác nhận API `GET /api/v1/vung-nuoc/{id}` trả về đúng toàn bộ trường của VungNuoc, bao gồm tên cảng mẹ (tenCangBien) và danh sách attachment (nếu có). Kiểm thử E2E/UI sử dụng browser automation để verify: breadcrumb hiển thị đúng cấu trúc, thông tin vùng nước hiển thị chính xác từng trường, badge màu đúng trạng thái, link cảng mẹ chuyển hướng đúng, danh sách attachment hiển thị đúng (nếu có) với nút download và print hoạt động, nút Phê duyệt/Từ chối chỉ xuất hiện khi điều kiện CHỜ_PHÊ_DUYỆT được thỏa mãn và người dùng có quyền, và các trường hệ thống hiển thị đúng định dạng thời gian.
