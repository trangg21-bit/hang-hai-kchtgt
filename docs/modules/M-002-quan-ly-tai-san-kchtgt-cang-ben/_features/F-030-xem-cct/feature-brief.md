---
id: F-030
name: Xem chi tiết Cảng cạn
slug: xem-cct
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:08Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Cảng cạn

## Description
Màn hình hiển thị toàn bộ thông tin chi tiết của một Cảng cạn cụ thể, bao gồm dữ liệu kỹ thuật, diện tích, năng lực, dịch vụ cung cấp, trạng thái và các giấy tờ pháp lý liên quan, cho phép người dùng tra cứu nhanh chóng và đầy đủ.

## Business Intent
Cung cấp giao diện xem chi tiết để tất cả các bên liên quan — từ nhân viên vận hành logistics đến quản lý cảng — có thể tiếp cận thông tin chính xác và cập nhật nhất về từng Cảng cạn. Điều này hỗ trợ ra quyết định nhanh chóng trong vận chuyển liên quan đến cảng biển, kiểm toán tuân thủ và báo cáo quản lý, giúp giảm thiểu sai sót do thiếu thông tin về năng lực và tình trạng của Cảng cạn.

## Flow Summary
Người dùng truy cập vào danh sách Cảng cạn, chọn một Cảng cạn cần xem chi tiết. Hệ thống tải thông tin đầy đủ của Cảng cạn bao gồm: mã, tên, địa chỉ, tọa độ, loại hình, diện tích, năng lực xử lý, danh sách dịch vụ cung cấp, trạng thái (đã kích hoạt/chờ phê duyệt/bị đình chỉ), ngày tạo và ngày cập nhật gần nhất. Người dùng có thể xem các giấy tờ đính kèm (giấy phép thành lập, quyết định), lịch sử thay đổi và các yêu cầu phê duyệt liên quan.

## Acceptance Criteria
1. Người dùng có thể xem toàn bộ thông tin chi tiết của một Cảng cạn sau khi chọn từ danh sách
2. Các trường dữ liệu kỹ thuật, pháp lý và trạng thái được hiển thị đầy đủ và chính xác
3. Người dùng có thể xem các giấy tờ đính kèm liên quan đến Cảng cạn
4. Hệ thống cho phép tải/xuống các tài liệu đính kèm (nếu có)
5. Thông tin được làm mới tự động khi dữ liệu nguồn thay đổi

## In Scope
- Hiển thị thông tin chi tiết Cảng cạn (mã, tên, địa chỉ, diện tích, năng lực, trạng thái)
- Hiển thị các giấy tờ đính kèm liên quan
- Xem lịch sử thay đổi của Cảng cạn
- Xem các yêu cầu phê duyệt liên quan
- Tải/xuống tài liệu đính kèm

## Out of Scope
- Chỉnh sửa thông tin Cảng cạn (thuộc F-027)
- Khởi tạo hoặc xóa Cảng cạn (thuộc F-026, F-028)
- Xuất báo cáo định kỳ về Cảng cạn

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Xem chi tiết, Tải tài liệu |
| Trưởng phòng QL Cảng | Xem chi tiết, Tải tài liệu |
| Quản trị viên | Xem chi tiết, Tải tài liệu |

## Entities
- **CangCan**: id, ma, ten, diaChi, toDo, loaiHinh, dienTich, nangLxuLy, dichVu, trangThai, ghiChu, createdAt, updatedAt
- **GiayTo**: id, cangCanId, tenGiayTo, loaiTaiLieu, duongDan, nguoiTanRieng, ngayCapNhat

## Business Rules
1. Mọi người dùng có vai trò trong hệ thống đều có thể xem chi tiết Cảng cạn
2. Chỉ người dùng có quyền quản lý mới có thể tải tài liệu đính kèm
3. Thông tin chi tiết luôn hiển thị trạng thái hiện tại, không phải lịch sử cũ
4. Các trường bắt buộc không được hiển thị trống

## Testing Strategy
Kiểm thử giao diện người dùng cho màn hình chi tiết, kiểm tra hiển thị đầy đủ các trường dữ liệu, kiểm tra tải tài liệu đính kèm, kiểm thử xem khi không có giấy tờ đính kèm, kiểm thử phân quyền xem chi tiết giữa các vai trò.

## UI Specification

Giao diện chi tiết Cảng cạn (CangCan) hiển thị đầy đủ thông tin của một cảng cạn cụ thể theo định dạng form đọc. Các trường hiển thị gồm: mã cảng cạn (maCangCan), tên cảng cạn (tenCangCan), địa chỉ (diaChi), tỉnh/thành (tinhThanh), ghi chú (ghiChu), trạng thái hoạt động (trangThaiHoatDong), trạng thái phê duyệt (trangThaiPheDuyet), orgUnitId, createdBy, updatedBy, createdAt, updatedAt, deletedAt. Trạng thái hoạt động và trạng thái phê duyệt được hiển thị dưới dạng badge có màu sắc riêng: HIEN_HANH (xanh), TAM_NGUNG (cam), CHO_PHE_DUYET (vàng), DUOC_PHE_DUYET (xanh đậm), TU_CHOI (đỏ). Phần danh sách tệp đính kèm (nếu có) hiển thị các file PDF, DOCX, JPEG với kích thước tối đa 10MB mỗi file, cho phép tải xuống và in trực tiếp. Lãnh đạo có thể thực hiện hành động Phê duyệt hoặc Từ chối ngay từ trang chi tiết thông qua các nút hành động. Breadcrumb điều hướng từ trang Danh sách Cảng cạn (F-083) vào trang Chi tiết, giúp người dùng quay lại dễ dàng.

**Business Intent**

Cung cấp trang chi tiết Cảng cạn cho phép người dùng xem toàn bộ thông tin một cảng cạn bao gồm các trường dữ liệu, trạng thái, tệp đính kèm và thực hiện các hành động phê duyệt từ nơi duy nhất, giúp tăng hiệu quả công việc và giảm số bước thao tác.

**Flow Summary**

Người dùng truy cập trang Chi tiết Cảng cạn bằng cách nhấp vào một dòng trong bảng danh sách (F-083). Hệ thống gọi API GET /api/v1/cang-can/:id để tải toàn bộ thông tin cảng cạn. Giao diện hiển thị từng trường dữ liệu theo dạng label: giá trị với trạng thái được thể hiện bằng badge màu. Phần tệp đính kèm liệt kê các file hỗ trợ (PDF, DOCX, JPEG) với kích thước tối đa 10MB mỗi file; mỗi mục có nút Tải xuống và nút In. Nếu người dùng là Lãnh đạo, hiển thị nút Phê duyệt và Từ chối để thực hiện phê duyệt trực tiếp từ trang chi tiết — khi bấm Phê duyệt, hệ thống gọi POST /:id/approve, khi bấm Từ chối yêu cầu nhập lý do (≥10 ký tự) rồi gọi POST /:id/reject. Breadcrumb trên đầu trang hiển thị: "Quản lý Cảng cạn > Chi tiết [maCangCan]" cho phép người dùng quay lại danh sách. Nút "Chỉnh sửa" mở trang Cập nhật (F-086), nút "Lịch sử" mở trang Lịch sử thay đổi (F-100).

**Acceptance Criteria (UI)**

1. Khi mở trang, hệ thống gọi GET /api/v1/cang-can/:id, hiển thị tất cả các trường: maCangCan, tenCangCan, diaChi, tinhThanh, ghiChu, trangThaiHoatDong, trangThaiPheDuyet, orgUnitId, createdBy, updatedBy, createdAt, updatedAt, deletedAt.
2. Badge trạng thái hoạt động có màu đúng: HIEN_HANH (xanh lá), TAM_NGUNG (cam).
3. Badge trạng thái phê duyệt có màu đúng: CHO_PHE_DUYET (vàng), DUOC_PHE_DUYET (xanh đậm), TU_CHOI (đỏ).
4. Tệp đính kèm (nếu có) hiển thị danh sách với tên file, kích thước, loại file; mỗi mục có nút "Tải xuống" và "In". Chỉ hỗ trợ file PDF, DOCX, JPEG với kích thước tối đa 10MB mỗi file.
5. Breadcrumb hiển thị đường dẫn "Quản lý Cảng cạn > Chi tiết [maCangCan]", nút "Quản lý Cảng cạn" điều hướng quay lại danh sách (F-083).
6. Nút "Phê duyệt" hiển thị cho vai trò Leadership, khi bấm gọi POST /:id/approve → trạng thái chuyển sang DUOC_PHE_DUYET, hiển thị toast thành công.
7. Nút "Từ chối" hiển thị cho vai trò Leadership, khi bấm yêu cầu nhập lý do (≥10 ký tự) → gọi POST /:id/reject → trạng thái chuyển sang TU_CHOI, hiển thị toast thành công.
8. Nhấp nút "Chỉnh sửa" mở trang Cập nhật Cảng cạn (F-086) với đúng entityId.
9. Nhấp nút "Lịch sử" mở trang Lịch sử Cảng cạn (F-100) với đúng entityId.
10. Các trường đọc chỉ hiển thị, không cho phép chỉnh sửa trực tiếp trên trang chi tiết — phải qua trang Cập nhật (F-086).

**In Scope (UI)**

- Hiển thị đầy đủ tất cả các trường của thực thể CangCan
- Badge màu cho trangThaiHoatDong và trangThaiPheDuyet
- Danh sách tệp đính kèm (PDF/DOCX/JPEG, max 10MB) với nút Tải xuống và In
- Hành động Phê duyệt/Từ chối dành cho Leadership
- Breadcrumb điều hướng
- Nút Chỉnh sửa → F-086, nút Lịch sử → F-100

**Out of Scope (UI)**

- Tạo mới Cảng cạn (thuộc F-085)
- Chỉnh sửa trực tiếp trên trang chi tiết — phải qua F-086
- Xóa Cảng cạn (thuộc F-099)
- Quản lý danh sách (thuộc F-083)
- Lưu cấu hình hiển thị cột

**Roles + Permissions (UI)**

| Role | Level | Notes |
|---|---|---|
| NhanVien | read | Xem toàn bộ thông tin chi tiết Cảng cạn, xem attachment |
| QuanTriCuc | read, update | Xem chi tiết, chỉnh sửa qua F-086, xem lịch sử |
| LanhDaoCuc | read, approve | Xem chi tiết, phê duyệt/từ chối Cảng cạn, xem lịch sử |
| QuanTriHeThong | read, update, delete, approve | Toàn quyền: xem, sửa, xóa, phê duyệt, xem lịch sử |

**UI Entities**

| Entity | Fields |
|---|---|
| CangCan | id(UUID), maCangCan(string unique), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(text), trangThaiHoatDong(enum), trangThaiPheDuyet(enum), orgUnitId(UUID), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt, deletedAt(nullable) |
| Attachment | fileName(string), fileType(string), fileSizeMB(number), downloadUrl(string), printable(boolean) |
| ApprovalAction | actionType(enum APPROVE/REJECT), reason(text), approvedBy(UUID), approvedAt(timestamp) |

**UI Business Rules**

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-084-01 | maCangCan phải là duy nhất trong toàn hệ thống; không cho phép tạo mới hoặc sửa có trùng mã | F-084, F-085, F-086 | Spec |
| BR-084-02 | Giá trị mặc định của trangThaiPheDuyet khi tạo mới là CHO_PHE_DUYET | F-085 | Spec |
| BR-084-03 | Soft-delete: khi xóa, đặt deletedAt thay vì xóa vật lý; không có guard xóa bản ghi con vì CangCan không có thực thể con | F-099 | Spec |
| BR-084-04 | Reject yêu cầu phê duyệt phải có lý do ít nhất 10 ký tự | F-087 | Spec |
| BR-084-05 | Attachment chỉ hỗ trợ file PDF, DOCX, JPEG với kích thước tối đa 10MB mỗi file | F-084 | Spec |

**Testing Strategy (UI)**

Kiểm thử đơn vị (unit test) cho từng thành phần hiển thị: component chi tiết hiển thị đúng tất cả các trường của CangCan, component badge màu cho trangThaiHoatDong (HIEN_HANH xanh lá, TAM_NGUNG cam) và trangThaiPheDuyet (CHO_PHE_DUYET vàng, DUOC_PHE_DUYET xanh đậm, TU_CHOI đỏ), component danh sách attachment với nút Tải xuống và In chỉ hiển thị cho file PDF/DOCX/JPEG ≤10MB. Component breadcrumb điều hướng đúng về danh sách (F-083). Kiểm thử tích hợp: gọi GET /api/v1/cang-can/:id, xác nhận dữ liệu hiển thị chính xác; khi Leadership bấm Phê duyệt, gọi POST /:id/approve và trạng thái cập nhật thành DUOC_PHE_DUYET; khi bấm Từ chối với lý do ≥10 ký tự, gọi POST /:id/reject và trạng thái chuyển TU_CHOI. Kiểm thử RBAC: chỉ Leadership thấy nút Phê duyệt/Từ chối. Kiểm thử nghiệp vụ: nhập entityId không tồn tại hiển thị lỗi 404, nhập entityId đã bị xóa (deletedAt != null) hiển thị cảnh báo.

## Implementation Status
| Layer | Status | Notes |
|-------|--------|-------|
| Backend (API) | Done | API endpoints fully implemented |
| Frontend (UI) | Pending | UI specs exist in merged feature scope; pending implementation |
