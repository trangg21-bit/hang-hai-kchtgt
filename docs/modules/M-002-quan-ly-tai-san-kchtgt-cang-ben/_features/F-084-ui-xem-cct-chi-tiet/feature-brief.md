---
id: F-084
name: "Chi tiết Cảng cạn"
slug: ui-xem-cct-chi-tiet
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:37Z"
last-updated: "2026-07-01T04:08:37Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Chi tiết Cảng cạn

## Description

Giao diện chi tiết Cảng cạn (CangCan) hiển thị đầy đủ thông tin của một cảng cạn cụ thể theo định dạng form đọc. Các trường hiển thị gồm: mã cảng cạn (maCangCan), tên cảng cạn (tenCangCan), địa chỉ (diaChi), tỉnh/thành (tinhThanh), ghi chú (ghiChu), trạng thái hoạt động (trangThaiHoatDong), trạng thái phê duyệt (trangThaiPheDuyet), orgUnitId, createdBy, updatedBy, createdAt, updatedAt, deletedAt. Trạng thái hoạt động và trạng thái phê duyệt được hiển thị dưới dạng badge có màu sắc riêng: HIEN_HANH (xanh), TAM_NGUNG (cam), CHO_PHE_DUYET (vàng), DUOC_PHE_DUYET (xanh đậm), TU_CHOI (đỏ). Phần danh sách tệp đính kèm (nếu có) hiển thị các file PDF, DOCX, JPEG với kích thước tối đa 10MB mỗi file, cho phép tải xuống và in trực tiếp. Lãnh đạo có thể thực hiện hành động Phê duyệt hoặc Từ chối ngay từ trang chi tiết thông qua các nút hành động. Breadcrumb điều hướng từ trang Danh sách Cảng cạn (F-083) vào trang Chi tiết, giúp người dùng quay lại dễ dàng.

## Business Intent

Cung cấp trang chi tiết Cảng cạn cho phép người dùng xem toàn bộ thông tin một cảng cạn bao gồm các trường dữ liệu, trạng thái, tệp đính kèm và thực hiện các hành động phê duyệt từ nơi duy nhất, giúp tăng hiệu quả công việc và giảm số bước thao tác.

## Flow Summary

Người dùng truy cập trang Chi tiết Cảng cạn bằng cách nhấp vào một dòng trong bảng danh sách (F-083). Hệ thống gọi API GET /api/v1/cang-can/:id để tải toàn bộ thông tin cảng cạn. Giao diện hiển thị từng trường dữ liệu theo dạng label: giá trị với trạng thái được thể hiện bằng badge màu. Phần tệp đính kèm liệt kê các file hỗ trợ (PDF, DOCX, JPEG) với kích thước tối đa 10MB mỗi file; mỗi mục có nút Tải xuống và nút In. Nếu người dùng là Lãnh đạo, hiển thị nút Phê duyệt và Từ chối để thực hiện phê duyệt trực tiếp từ trang chi tiết — khi bấm Phê duyệt, hệ thống gọi POST /:id/approve, khi bấm Từ chối yêu cầu nhập lý do (≥10 ký tự) rồi gọi POST /:id/reject. Breadcrumb trên đầu trang hiển thị: "Quản lý Cảng cạn > Chi tiết [maCangCan]" cho phép người dùng quay lại danh sách. Nút "Chỉnh sửa" mở trang Cập nhật (F-086), nút "Lịch sử" mở trang Lịch sử thay đổi (F-100).

## Acceptance Criteria

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

## In Scope

- Hiển thị đầy đủ tất cả các trường của thực thể CangCan
- Badge màu cho trangThaiHoatDong và trangThaiPheDuyet
- Danh sách tệp đính kèm (PDF/DOCX/JPEG, max 10MB) với nút Tải xuống và In
- Hành động Phê duyệt/Từ chối dành cho Leadership
- Breadcrumb điều hướng
- Nút Chỉnh sửa → F-086, nút Lịch sử → F-100

## Out of Scope

- Tạo mới Cảng cạn (thuộc F-085)
- Chỉnh sửa trực tiếp trên trang chi tiết — phải qua F-086
- Xóa Cảng cạn (thuộc F-099)
- Quản lý danh sách (thuộc F-083)
- Lưu cấu hình hiển thị cột

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| NhanVien | read | Xem toàn bộ thông tin chi tiết Cảng cạn, xem attachment |
| QuanTriCuc | read, update | Xem chi tiết, chỉnh sửa qua F-086, xem lịch sử |
| LanhDaoCuc | read, approve | Xem chi tiết, phê duyệt/từ chối Cảng cạn, xem lịch sử |
| QuanTriHeThong | read, update, delete, approve | Toàn quyền: xem, sửa, xóa, phê duyệt, xem lịch sử |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id(UUID), maCangCan(string unique), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(text), trangThaiHoatDong(enum), trangThaiPheDuyet(enum), orgUnitId(UUID), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt, deletedAt(nullable) |
| Attachment | fileName(string), fileType(string), fileSizeMB(number), downloadUrl(string), printable(boolean) |
| ApprovalAction | actionType(enum APPROVE/REJECT), reason(text), approvedBy(UUID), approvedAt(timestamp) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-084-01 | maCangCan phải là duy nhất trong toàn hệ thống; không cho phép tạo mới hoặc sửa có trùng mã | F-084, F-085, F-086 | Spec |
| BR-084-02 | Giá trị mặc định của trangThaiPheDuyet khi tạo mới là CHO_PHE_DUYET | F-085 | Spec |
| BR-084-03 | Soft-delete: khi xóa, đặt deletedAt thay vì xóa vật lý; không có guard xóa bản ghi con vì CangCan không có thực thể con | F-099 | Spec |
| BR-084-04 | Reject yêu cầu phê duyệt phải có lý do ít nhất 10 ký tự | F-087 | Spec |
| BR-084-05 | Attachment chỉ hỗ trợ file PDF, DOCX, JPEG với kích thước tối đa 10MB mỗi file | F-084 | Spec |

## Testing Strategy

Kiểm thử đơn vị (unit test) cho từng thành phần hiển thị: component chi tiết hiển thị đúng tất cả các trường của CangCan, component badge màu cho trangThaiHoatDong (HIEN_HANH xanh lá, TAM_NGUNG cam) và trangThaiPheDuyet (CHO_PHE_DUYET vàng, DUOC_PHE_DUYET xanh đậm, TU_CHOI đỏ), component danh sách attachment với nút Tải xuống và In chỉ hiển thị cho file PDF/DOCX/JPEG ≤10MB. Component breadcrumb điều hướng đúng về danh sách (F-083). Kiểm thử tích hợp: gọi GET /api/v1/cang-can/:id, xác nhận dữ liệu hiển thị chính xác; khi Leadership bấm Phê duyệt, gọi POST /:id/approve và trạng thái cập nhật thành DUOC_PHE_DUYET; khi bấm Từ chối với lý do ≥10 ký tự, gọi POST /:id/reject và trạng thái chuyển TU_CHOI. Kiểm thử RBAC: chỉ Leadership thấy nút Phê duyệt/Từ chối. Kiểm thử nghiệp vụ: nhập entityId không tồn tại hiển thị lỗi 404, nhập entityId đã bị xóa (deletedAt != null) hiển thị cảnh báo.
