---
id: F-109
name: "Chi tiet Cang Bien"
slug: ui-xem-cb-chi-tiet
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T07:49:58Z"
last-updated: "2026-07-01T07:49:58Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Chi tiet Cang Bien

## Description

Giao diện chi tiết Cảng biển (CangBienDetailPage) hiển thị đầy đủ tất cả các trường thông tin của một cảng biển cụ thể khi người dùng chọn xem từ danh sách. Các trường được trình bày theo dạng label-value với định dạng GPS là ±XX.XXXXXX (độ chính xác 5 chữ số thập phân), trạng thái hoạt động và phê duyệt được biểu diễn bằng badge màu: CHỜ_PHÊ_DUYỆT = vàng, ĐƯỢC_PHÊ_DUYỆT = xanh lá, TỪ_CHỐI = đỏ. Phần đính kèm (attachments) hiển thị danh sách các file PDF, DOCX hoặc JPEG (tối đa 10MB mỗi file) với nút tải xuống và in. Các hành động phê duyệt (Phê duyệt/Từ chối) chỉ hiển thị cho người dùng có vai trò Lãnh đạo. Breadcrumb điều hướng cho phép người dùng quay lại trang danh sách hoặc trang trước đó. Giao diện hỗ trợ responsive trên desktop và tablet.

## Business Intent

Cung cấp một cái nhìn toàn diện về một cảng biển cụ thể, bao gồm tất cả thông tin kỹ thuật, địa lý và trạng thái, cho phép người dùng xác minh dữ liệu trước khi ra quyết định phê duyệt hoặc chỉnh sửa. Đây là nền tảng cho mọi thao tác tiếp theo (sửa, xóa, phê duyệt), đáp ứng yêu cầu về đính kèm và xác minh thông tin cảng biển.

## Flow Summary

Người dùng nhấp vào "Xem chi tiết" trên hàng tương ứng trong danh sách (F-108), hệ thống gọi GET /api/v1/cang-bien/:id để tải dữ liệu. Trang hiển thị breadcrumb "Quản lý cảng biển > Chi tiết cảng [maCang]". Các trường được hiển thị trong các nhóm: thông tin cơ bản (maCang, tenCang, tinhThanhPho), địa lý (viDo, kinhDo dưới dạng ±XX.XXXXXX, dienTich), khả năng (khaNangTiepNhan), trạng thái (badge màu). Nếu có đính kèm, danh sách file hiển thị với tên, định lượng, dung lượng và nút Download/Print. Hành động Phê duyệt/Từ chối chỉ hiện cho Lãnh đạo. Nhấp "Chỉnh sửa" chuyển đến F-111, "Xóa" mở hộp thoại xác nhận F-113, "Lịch sử" mở F-114. Breadcrumb cho phép quay lại danh sách.

## Acceptance Criteria

1. Trang hiển thị đầy đủ 15 trường của entity CangBien với định dạng: GPS là ±XX.XXXXXX (5 chữ số thập phân), trangThaiPheDuyet là badge (vàng=CHO, xanh=DUOC, đỏ=TU_CHO), trangThaiHoatDong hiển thị rõ ràng.
2. Phần đính kèm hiển thị danh sách các file (PDF/DOCX/JPEG, tối đa 10MB/file) với nút Download và Print cho từng file.
3. Các hành động Phê duyệt và Từ chối chỉ hiển thị cho người dùng có vai trò Lãnh đạo; các hành động khác hiển thị đúng theo phân quyền CRUD.
4. Breadcrumb điều hướng hiển thị "Quản lý cảng biển > Chi tiết cảng [maCang]", cho phép quay lại danh sách hoặc trang trước.
5. Nút "Chỉnh sửa" mở trang F-111 với form được pre-fill từ dữ liệu hiện tại; "Lịch sử" mở F-114; "Xóa" mở hộp thoại xác nhận F-113.
6. Responsive trên desktop (≥ 1024px) và tablet (≥ 768px); layout chuyển thành cột đơn trên mobile.

## In Scope

- Hiển thị đầy đủ tất cả trường của entity CangBien
- Định dạng GPS ±XX.XXXXXX
- Badge trạng thái màu (vàng, xanh lá, đỏ)
- Danh sách đính kèm (PDF/DOCX/JPEG, max 10MB) với Download + Print
- Hành động Phê duyệt/Từ chối (chỉ Lãnh đạo)
- Breadcrumb điều hướng
- Responsive design (desktop, tablet, mobile)

## Out of Scope

- Tạo mới cảng biển (thuộc F-110)
- Chỉnh sửa trực tiếp tại trang chi tiết (điều hướng đến F-111)
- Phê duyệt thực thi (điều hướng đến F-112)
- Xóa mềm (điều hướng đến F-113)
- Xem lịch sử thay đổi (điều hướng đến F-114)
- Bản đồ GPS tương tác (chỉ hiển thị tọa độ text)
- Tích hợp bản đồ OpenLayers/Leaflet

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full | Xem chi tiết, chỉnh sửa, xóa, phê duyệt tất cả Cảng biển |
| Lãnh đạo | Full + Phê duyệt | Xem chi tiết, chỉnh sửa, xóa, phê duyệt/từ chối tất cả Cảng biển; thấy nút Phê duyệt |
| Chuyên viên Cục | CRUD | Xem chi tiết, chỉnh sửa Cảng biển của Cục mình; không thấy nút Phê duyệt |
| Nhân viên vận hành | Read-only | Chỉ xem chi tiết, không có hành động chỉnh sửa, xóa, phê duyệt |
| Doanh nghiệp cảng | CRUD | Xem chi tiết, chỉnh sửa Cảng biển của đơn vị mình |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, length≤50, immutable after creation), tenCang (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), khaNangTiepNhan (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable)
- **Attachment**: id (UUID), cangBienId (UUID), fileName (string), fileType (PDF/DOCX/JPEG), fileSize (bytes, max 10MB), uploadedAt, uploadedBy (UUID)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | maCang tuân thủ định dạng VN-36, độ dài 6-10 ký tự, duy nhất toàn hệ thống | Hiển thị chi tiết | Entity spec, F-109 |
| BR-002 | viDo [-90, 90], kinhDo [-180, 180], dienTich [0, 5000] | Hiển thị chi tiết | Entity spec |
| BR-003 | Badge trạng thái: CHỜ_PHÊ_DUYỆT = vàng, ĐƯỢC_PHÊ_DUYỆT = xanh lá, TỪ_CHỐI = đỏ | Hiển thị chi tiết | F-109 |
| BR-004 | Đính kèm chỉ hỗ trợ PDF, DOCX, JPEG, tối đa 10MB/file | Đính kèm | F-109 |

## Testing Strategy

Giao diện chi tiết Cảng biển được kiểm thử bằng React Testing Library cho việc render đúng tất cả 15 trường của entity, định dạng GPS ±XX.XXXXXX, badge màu trạng thái (vàng, xanh, đỏ), danh sách đính kèm với nút Download/Print. Cypress thực hiện end-to-end test: điều hướng từ danh sách → chi tiết → xác minh breadcrumb → click hành động "Chỉnh sửa" → xác nhận điều hướng đến F-111 → click "Xóa" → xác nhận dialog F-113 → click "Lịch sử" → xác nhận F-114. Negative test: xác minh hành động Phê duyệt/Từ chối không hiển thị cho người dùng không phải Leadership. Test responsive: viewport desktop (1440px), tablet (768px), mobile (375px) — layout chuyển đúng.
