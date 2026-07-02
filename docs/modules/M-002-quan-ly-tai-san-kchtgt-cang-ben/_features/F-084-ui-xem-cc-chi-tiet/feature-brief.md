---
id: F-084
name: "Chi tiết Cảng cạn"
slug: ui-xem-cc-chi-tiet
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T06:56:21Z"
last-updated: "2026-07-01T06:56:21Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Chi tiết Cảng cạn

## Description

Tính năng Chi tiết Cảng cạn cung cấp giao diện hiển thị toàn bộ thông tin của một cảng cạn cụ thể, bao gồm tất cả các trường dữ liệu từ thực thể CangCan: mã cảng cạn (`maCangCan`), tên cảng cạn (`tenCangCan`), tỉnh/thành phố (`tinhThanhPho`), vĩ độ (`viDo`), kinh độ (`kinhDo`), diện tích (`dienTich`), công suất TEU (`congSuatTEU`), trạng thái hoạt động (`trangThaiHoatDong`), trạng thái phê duyệt (`trangThaiPheDuyet`), đơn vị tổ chức (`orgUnitId`), cùng các metadata hệ thống (người tạo, người sửa, ngày tạo, ngày cập nhật cuối). Giao diện được chia thành các vùng thông tin rõ ràng: thông tin cơ bản (mã, tên, tỉnh/thành), thông tin kỹ thuật (diện tích, công suất TEU, tọa độ GPS), trạng thái (hoạt động, phê duyệt), và metadata. Các trường trạng thái được hiển thị dưới dạng badge màu: xanh lá cho HIEN_HANH, đỏ cho TAM_NGUNG, vàng cho CHỜ_PHÊ_DUYỆT, xanh dương cho DUOC_PHE_DUYET, và đỏ đậm cho TU_CHOI. Dưới phần thông tin, có các nút hành động: Chỉnh sửa (đến F-086), Xóa (F-097 với xác nhận), Phê duyệt (dành cho Leader, F-092), Xem lịch sử (F-098), và quản lý văn bản đính kèm (F-106).

## Business Intent

Cho phép người dùng xem toàn bộ thông tin chi tiết của một cảng cạn cụ thể một cách tổng quan, hỗ trợ việc rà soát dữ liệu, kiểm tra trạng thái phê duyệt và thực hiện các hành động quản lý như chỉnh sửa, phê duyệt, xem lịch sử hoặc đính kèm văn bản liên quan.

## Flow Summary

Người dùng truy cập trang Chi tiết Cảng cạn bằng cách click vào tên cảng cạn từ danh sách (F-083) hoặc từ kết quả tìm kiếm. Hệ thống gọi API `GET /api/v1/cang-can/{id}` để lấy thông tin chi tiết của cảng cạn. Dữ liệu trả về được hiển thị trên trang với các trường được sắp xếp theo nhóm: thông tin cơ bản, thông tin kỹ thuật, trạng thái, và metadata. Các badge màu được áp dụng cho trạng thái hoạt động và trạng thái phê duyệt để người dùng dễ nhận biết. Nếu người dùng có quyền phê duyệt và cảng cạn có trạng thái CHỜ_PHÊ_DUYỆT, nút "Phê duyệt" được hiển thị. Người dùng click vào các nút hành động để thực hiện chỉnh sửa (F-086), xóa (F-097), phê duyệt (F-092), xem lịch sử (F-098) hoặc quản lý văn bản đính kèm (F-106). Nếu không tìm thấy cảng cạn với ID yêu cầu, hiển thị thông báo 404 "Không tìm thấy cảng cạn".

## Acceptance Criteria

1. Khi mở trang với ID hợp lệ, hệ thống gọi `GET /api/v1/cang-can/{id}` và hiển thị đầy đủ các trường: maCangCan, tenCangCan, tinhThanhPho, viDo, kinhDo, dienTich, congSuatTEU, trangThaiHoatDong, trangThaiPheDuyet, orgUnitId.
2. Các trường BigDecimal được định dạng đúng: `dienTich` hiển thị 2 chữ số thập phân (m²), `congSuatTEU` hiển thị 2 chữ số thập phân (TEU), `viDo` hiển thị 6 chữ số thập phân, `kinhDo` hiển thị 6 chữ số thập phân.
3. Badge trạng thái hoạt động hiển thị đúng màu: xanh lá cho HIEN_HANH, đỏ cho TAM_NGUNG; badge trạng thái phê duyệt hiển thị đúng màu: vàng cho CHỜ_PHÊ_DUYỆT, xanh dương cho DUOC_PHE_DUYET, đỏ đậm cho TU_CHOI.
4. Nút "Chỉnh sửa" hiển thị trên trang và khi click chuyển người dùng đến trang Cập nhật Cảng cạn (F-086) với đúng ID được chọn.
5. Nút "Xóa" hiển thị trên trang và khi click hiển thị hộp thoại xác nhận có nút "Hủy" và "Xác nhận xóa"; sau khi xác nhận gọi DELETE /api/v1/cang-can/{id} và chuyển hướng về danh sách (F-083).
6. Nút "Phê duyệt" chỉ hiển thị cho người dùng có quyền approve và khi cảng cạn có `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT`; khi click chuyển đến trang Phê duyệt Cảng cạn (F-092).
7. Nút "Lịch sử" hiển thị trên trang và khi click chuyển người dùng đến trang Lịch sử Cảng cạn (F-098) với đúng ID.
8. Nút "Quản lý văn bản đính kèm" hiển thị trên trang và khi click chuyển đến phần upload GiayTo (F-106).
9. Khi không tìm thấy cảng cạn (HTTP 404), hiển thị thông báo "Không tìm thấy cảng cạn" và nút "Quay lại danh sách".
10. Thông tin createdBy, updatedBy, createdAt, updatedAt được hiển thị dưới dạng ngày/giờ định dạng theo locale Việt Nam (dd/MM/yyyy HH:mm).

## In Scope

- Hiển thị tất cả các trường của thực thể CangCan (10 trường dữ liệu chính + 4 trường metadata)
- Badge màu cho trạng thái hoạt động và trạng thái phê duyệt
- Các nút hành động: Chỉnh sửa, Xóa, Phê duyệt (Leader), Lịch sử, Quản lý văn bản
- Định dạng số cho các trường BigDecimal
- Xử lý trường hợp không tìm thấy (404)
- Thông tin metadata (createdBy, updatedBy, createdAt, updatedAt)

## Out of Scope

- Chỉnh sửa trực tiếp trên trang chi tiết (inline editing)
- Chỉnh sửa nhiều cảng cạn cùng lúc
- Export thông tin cảng cạn ra file PDF/Excel
- Hiển thị bản đồ hoặc vị trí GPS trên bản đồ (GIS)
- Thống kê hoặc báo cáo liên quan đến cảng cạn cụ thể
- So sánh thông tin cảng cạn với các cảng cạn khác

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Full access | Xem, chỉnh sửa, xóa, phê duyệt tất cả cảng cạn của cảng |
| NhanVienCangBien (Nhân viên cảng) | Read/Write | Xem và chỉnh sửa cảng cạn; không có quyền xóa hoặc phê duyệt |
| QuanTramMien (Quan tra miền) | Read | Chỉ xem thông tin cảng cạn, không có quyền chỉnh sửa, xóa hoặc phê duyệt |
| LeDuan (Lãnh đạo) | Full + Approve | Xem, chỉnh sửa, xóa và phê duyệt/từ chối cảng cạn trong trạng thái chờ duyệt |
| Admin | Full + Approve | Toàn quyền xem, chỉnh sửa, xóa và phê duyệt cảng cạn |
| Doanh nghiệp cảng | Read/Write | Xem và chỉnh sửa cảng cạn thuộc cảng của mình, không có quyền xóa hoặc phê duyệt |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id (UUID), maCangCan (string, unique, length≤50), tenCangCan (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), congSuatTEU (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (nullable) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | Tất cả các trường của CangCan phải được hiển thị đầy đủ trên trang chi tiết, bao gồm cả các trường nullable (tinhThanhPho) | GET | Entity constraint |
| BR-02 | Badge trạng thái hoạt động phải phản ánh đúng giá trị hiện tại của `trangThaiHoatDong` trên thực thể | GET | UI rendering |
| BR-03 | Nút "Phê duyệt" chỉ hiển thị cho người dùng có quyền approve và khi `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` | GET | RBAC + State check |
| BR-04 | Nút "Chỉnh sửa" chỉ hiển thị khi cảng cạn chưa bị xóa mềm (`deletedAt IS NULL`) | GET | Soft-delete guard |
| BR-05 | Nút "Xóa" chỉ hiển thị cho người dùng có quyền `cangcan:delete` và khi cảng cạn chưa bị xóa mềm | GET | RBAC + Soft-delete guard |

## Testing Strategy

Kiểm thử đơn vị (unit test) xác nhận các service phương thức lấy chi tiết cảng cạn trả về đúng dữ liệu, kiểm tra RBAC cho từng role với các hành động trên trang chi tiết. Kiểm thử tích hợp (integration test) xác nhận API `GET /api/v1/cang-can/{id}` trả về 200 với đầy đủ các trường cho ID hợp lệ, trả về 404 cho ID không tồn tại, và kiểm tra xử lý các giá trị BigDecimal (dienTich, congSuatTEU, viDo, kinhDo) chính xác đến đúng scale quy định. Kiểm thử E2E/UI sử dụng browser automation để verify: trang chi tiết hiển thị đúng tất cả các trường, badge màu đúng với trạng thái, các nút hành động hiển thị ẩn đúng theo quyền và trạng thái, click vào các nút chuyển hướng đúng trang tương ứng (F-086, F-097, F-092, F-098, F-106), và xử lý 404 đúng thông báo. Kiểm thử định dạng số xác nhận BigDecimal được hiển thị với đúng số chữ số thập phân.
