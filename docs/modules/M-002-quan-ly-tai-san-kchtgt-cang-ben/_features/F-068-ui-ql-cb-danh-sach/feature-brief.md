---
id: F-068
name: "Danh sách Cảng biển"
slug: ui-ql-cb-danh-sach
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:08Z"
last-updated: "2026-07-01T04:08:08Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Danh sách Cảng biển

## Description

Giao diện danh sách Cảng biển (CangBienListPage) cho phép người dùng xem toàn bộ danh sách các cảng biển đang tồn tại trong hệ thống với khả năng phân trang, tìm kiếm nâng cao và lọc theo trạng thái hoạt động. Danh sách hiển thị các cột thông tin chính gồm mã cảng (maCang), tên cảng (tenCang), tỉnh/thành phố (tinhThanhPho), trạng thái phê duyệt (trangThaiPheDuyet) và ngày cập nhật gần nhất (updatedAt). Phân trang mặc định 20 bản ghi trên trang, tối đa 100 bản ghi. Sắp xếp mặc định theo updatedAt giảm dần. Hỗ trợ tìm kiếm theo mã cảng, tên cảng hoặc tỉnh/thành phố, đồng thời cho phép lọc theo trạng thái HOẠT_ĐỘNG (HIỆN_HÀNH) hoặc TẠM_NGỨNG (TẠM_NGƯNG). Mỗi hàng trong bảng có các hành động xem chi tiết, chỉnh sửa, xóa và xem lịch sử thay đổi.

## Business Intent

Cung cấp công cụ quản lý tổng quan tất cả cảng biển đã đăng ký trong hệ thống, giúp người dùng nhanh chóng tra cứu, xác minh thông tin cơ bản và dẫn hướng đến các chức năng chi tiết (xem, sửa, xóa, phê duyệt). Đây là điểm vào chính cho mọi tác vụ quản lý cảng biển, đáp ứng yêu cầu nghiệp vụ tại UC 10 của TKCT và đảm bảo nguyên tắc QA W2 về phân trang.

## Flow Summary

Người dùng điều hướng đến trang danh sách Cảng biển từ menu quản lý tài sản cảng biển. Trang tải danh sách qua GET /api/v1/cang-bien?page=1&pageSize=20&sortBy=updatedAt&sortOrder=DESC. Người dùng có thể nhập từ khóa vào ô tìm kiếm (maCang/tenCang/tinhThanhPho), chọn bộ lọc trạng thái hoạt động, hoặc thay đổi kích thước trang. Kết quả được làm mới theo mỗi thao tác. Nhấp vào hành động "Xem chi tiết" mở trang F-069; "Chỉnh sửa" mở F-071; "Xóa" hiển thị hộp thoại xác nhận F-093; "Phê duyệt" (chỉ Lãnh đạo) mở F-072. Bàn phím Tab chuyển giữa các ô tìm kiếm và bộ lọc, Enter kích hoạt tìm kiếm.

## Acceptance Criteria

1. Trang danh sách tải danh sách cảng biển qua API GET /api/v1/cang-bien với phân trang mặc định 20 bản ghi/page, tối đa 100, sắp xếp giảm dần theo updatedAt.
2. Ô tìm kiếm cho phép nhập từ khóa và lọc kết quả theo maCang, tenCang hoặc tinhThanhPho — hiển thị đúng các kết quả khớp và thông báo "Không tìm thấy" khi không có kết quả.
3. Bộ lọc trạng thái hoạt động (HIỆN_HÀNH / TẠM_NGƯNG) áp dụng thêm điều kiện lọc vào query parameters, kết quả hiển thị chính xác theo bộ lọc đã chọn.
4. Bảng hiển thị 5 cột: maCang, tenCang, tinhThanhPho, trạng thái (badge màu theo TRẠNG_THÁI_PHÊ_DUYỆT), updatedAt — sortable theo các cột này.
5. Các hành động (Xem chi tiết, Chỉnh sửa, Xóa, Lịch sử) xuất hiện trong mỗi hàng đúng theo phân quyền: Phê duyệt chỉ hiển thị cho Lãnh đạo, tất cả các hành động khác dựa trên quyền CRUD tương ứng.
6. Hỗ trợ điều hướng bàn phím: Tab di chuyển giữa ô tìm kiếm, bộ lọc và các nút hành động; Enter kích hoạt tìm kiếm và xác nhận hành động.

## In Scope

- Bảng danh sách Cảng biển với phân trang, sắp xếp, tìm kiếm, lọc
- Hiển thị thông tin tóm tắt (maCang, tenCang, tinhThanhPho, status, updatedAt)
- Các hành động: xem chi tiết, chỉnh sửa, xóa, xem lịch sử
- Hành động phê duyệt (chỉ Lãnh đạo)
- Tìm kiếm theo maCang / tenCang / tinhThanhPho
- Lọc theo trangThaiHoatDong (HIỆN_HÀNH / TẠM_NGƯNG)
- Điều hướng bàn phím (Tab / Enter)
- Xuất/xem đính kèm (PDF, DOCX, JPEG)

## Out of Scope

- Thêm mới cảng biển (thuộc F-070)
- Chỉnh sửa chi tiết cảng (thuộc F-071)
- Phê duyệt/từ chối (thuộc F-072)
- Xóa mềm cảng (thuộc F-093)
- Xem lịch sử thay đổi chi tiết (thuộc F-094)
- Phân quyền chi tiết từng cột
- Tích hợp bản đồ GPS trực tiếp trên danh sách

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full | Xem, tạo, chỉnh sửa, xóa, phê duyệt tất cả Cảng biển |
| Lãnh đạo | Full + Phê duyệt | Xem, tạo, chỉnh sửa, xóa, phê duyệt/từ chối tất cả Cảng biển |
| Chuyên viên Cục | CRUD | Xem, tạo, chỉnh sửa Cảng biển của Cục mình; không xóa/phê duyệt |
| Chuyên viên Cảng vụ | CRUD | Xem, tạo, chỉnh sửa Cảng biển của Cảng vụ mình; không xóa/phê duyệt |
| Doanh nghiệp cảng | CRUD | Xem, tạo, chỉnh sửa Cảng biển của đơn vị mình; không xóa/phê duyệt |
| Nhân viên vận hành | Read-only | Chỉ xem danh sách và chi tiết, không thực hiện hành động tạo/sửa/xóa/phê duyệt |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, length≤50, immutable after creation), tenCang (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), khaNangTiepNhan (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable)
- **PheDuyetLog**: id (UUID), cangBienId (UUID), nguoiPheDuyet (UUID), trangThai (DUOC/TU_CHOI), lyDo (text), createdAt
- **LichSuThayDoi**: id (UUID), cangBienId (UUID), loaiThayDoi (TẠO_MỚI/CẬP_NHẬT), field (string), oldValue, newValue, thayDoiBoi (UUID), changedAt

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | maCang phải tuân thủ định dạng VN-36, độ dài 6-10 ký tự và phải là duy nhất trên toàn hệ thống | Tạo / Danh sách | Entity spec, F-070 |
| BR-002 | viDo phải nằm trong [-90, 90], kinhDo trong [-180, 180], dienTich trong [0, 5000] | Tất cả | Entity spec |
| BR-003 | Trang thái phê duyệt mặc định là CHỜ_PHÊ_DUYỆT khi tạo mới | Tạo mới | Entity spec, BR-004 |
| BR-004 | Xóa mềm bị chặn nếu tồn tại con (BenCang/VungNuoc), trả về HTTP 409 | Xóa | F-093, F-010 |
| BR-005 | Chỉ người dùng có vai trò Lãnh đạo mới thấy và thực hiện hành động Phê duyệt/Từ chối | Phê duyệt | F-072 |

## Testing Strategy

Giao diện danh sách Cảng biển được kiểm thử tự động bằng React Testing Library cho các unit test: phân trang hiển thị đúng số bản ghi, tìm kiếm lọc chính xác kết quả theo maCang/tenCang/tinhThanhPho, bộ lọc trạng thái hoạt động áp dụng đúng, hành động Phê duyệt chỉ hiển thị với Leadership. Cypress được sử dụng cho end-to-end test: điều hướng từ menu → danh sách → tìm kiếm + lọc → click hành động xem chi tiết → xác nhận giao diện hiển thị đúng 5 cột và phân trang 20. Negative test: nhập từ khóa tìm kiếm rỗng hiển thị toàn bộ, tìm kiếm không có kết quả hiển thị thông báo "Không tìm thấy". Test bàn phím: Tab di chuyển qua các ô, Enter kích hoạt tìm kiếm và hành động.
