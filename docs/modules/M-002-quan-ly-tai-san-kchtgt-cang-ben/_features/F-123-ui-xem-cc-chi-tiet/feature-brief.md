---
id: F-123
name: "Chi tiết Cầu cảng"
slug: ui-xem-cc-chi-tiet
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:26Z"
last-updated: "2026-07-01T04:08:26Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Chi tiết Cầu cảng

## Description

Giao diện chi tiết Cầu cảng hiển thị đầy đủ tất cả thông tin của một cầu cảng cụ thể được chọn từ danh sách (F-122), bao gồm mã cầu cảng (maCau) — trường duy nhất không thể chỉnh sửa tại đây, tên cầu cảng (tenCau), bến cảng cha (benCangId) hiển thị dưới dạng tên bến cảng kèm hyperlink trỏ đến trang chi tiết BenCang, chiều dài (chieuDai, đơn vị mét), tải trọng (taiTrọng, đơn vị tấn), loại cầu cảng (loaiCau) với các giá trị: DAI_TRO, BIT_NEO, LAN_THANH, DO_BIN_DAU_LOI, THUY_SAN, trạng thái hoạt động (trangThaiHoatDong) và trạng thái phê duyệt (trangThaiPheDuyet) — cả hai đều được hiển thị dưới dạng badge có màu sắc phân biệt (ví dụ: xanh lá cho HIEN_HANH, vàng cho CHO_PHE_DUYET, đỏ cho TU_CHOI). Trang hiển thị danh sách các tệp đính kèm (PDF, DOCX, JPEG, tối đa 10MB mỗi tệp) với nút tải xuống và in cho từng file. Leader có thể thực hiện hành động phê duyệt/từ chối ngay trên trang chi tiết thông qua các nút Actions. Breadcrumb điều hướng cho phép quay lại danh sách hoặc trang cha BenCang. Nguồn: TKCT UC 12.

## Business Intent

Cung cấp cái nhìn toàn diện về một cầu cảng cụ thể, bao gồm mọi thông tin kỹ thuật, trạng thái và tài liệu đính kèm, phục vụ cho việc ra quyết định phê duyệt, vận hành và bảo trì tài sản cảng biển.

## Flow Summary

Người dùng click vào mã hoặc tên cầu cảng trong danh sách (F-122) → hệ thống gọi GET /api/v1/cau-cang/:id → trang chi tiết hiển thị tất cả các trường của entity CauCang. BenCangId được hiển thị dưới dạng link trỏ đến chi tiết BenCang. Các badge trạng thái (trangThaiHoatDong và trangThaiPheDuyet) được tô màu tương ứng để dễ nhận biết. Danh sách tệp đính kèm (nếu có) hiển thị tên file, kích thước (tối đa 10MB), loại file và các nút download + print. Nếu người dùng có quyền Leader, các nút "Phê duyệt" và "Từ chối" (F-126) xuất hiện khi trạng thái là CHO_PHE_DUYET. Breadcrumb ở đầu trang cho phép quay lại danh sách hoặc trang BenCang cha. Tất cả thao tác đều có xác nhận trước khi thực hiện.

## Acceptance Criteria

1. Trang chi tiết hiển thị đầy đủ tất cả các trường của entity CauCang: maCau, tenCau, benCangId (tên + link), chieuDai, taiTrọng, loaiCau, trangThaiHoatDong, trangThaiPheDuyet, createdAt, updatedAt, createdBy, updatedBy.
2. Trường benCangId hiển thị dưới dạng tên bến cảng kèm hyperlink trỏ đến trang chi tiết BenCang tương ứng.
3. Badge trạng thái hoạt động (trangThaiHoatDong) có màu sắc phân biệt: xanh lá cho HIEN_HANH, vàng/đen cho TAM_NGUNG.
4. Badge trạng thái phê duyệt (trangThaiPheDuyet) có màu sắc phân biệt: vàng cho CHO_PHE_DUYET, xanh dương cho DUOC_PHE_DUYET, đỏ cho TU_CHOI.
5. Danh sách tệp đính kèm hiển thị đúng các file có định dạng PDF, DOCX, JPEG với kích thước tối đa 10MB mỗi file.
6. Mỗi tệp đính kèm có nút "Tải xuống" và nút "In" riêng biệt.
7. Leader có thể click "Phê duyệt" → chuyển đến F-126 với cầu cảng được chọn sẵn, trạng thái = CHO_PHE_DUYET.
8. Leader có thể click "Từ chối" → chuyển đến F-126 với yêu cầu nhập lý do ≥ 10 ký tự.
9. Breadcrumb hiển thị đường dẫn: Trang chủ > Quản lý Tài sản > Bến cảng > Cầu cảng > [tên cầu cảng].
10. Click "Cầu cảng" trong breadcrumb quay lại danh sách F-122.
11. Click tên BenCang trong breadcrumb hoặc chi tiết quay lại trang chi tiết BenCang.

## In Scope

- API GET /api/v1/cau-cang/:id để lấy thông tin chi tiết.
- Hiển thị đầy đủ tất cả các trường của entity CauCang.
- BenCangId hiển thị dưới dạng link trỏ đến BenCang detail.
- Badge màu cho trangThaiHoatDong và trangThaiPheDuyet.
- Danh sách tệp đính kèm (PDF/DOCX/JPEG ≤ 10MB) với download + print.
- Nút hành động Phê duyệt/Từ chối cho Leader (khi status = CHO_PHE_DUYET).
- Breadcrumb điều hướng về danh sách và BenCang cha.

## Out of Scope

- Chỉnh sửa thông tin trực tiếp trên trang chi tiết (chỉnh sửa phải qua F-125).
- Upload tệp đính kèm mới từ trang chi tiết (thực hiện từ trang tạo/cập nhật).
- Preview hình ảnh JPEG trực tiếp trên trang (chỉ tải xuống hoặc in).
- Xem log chi tiết từng thay đổi trên trang chi tiết (chuyển đến F-128).
- In toàn bộ trang chi tiết ra PDF.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quan ly tai san | read | Xem chi tiết cầu cảng, xem danh sách tệp đính kèm |
| Quan ly tai san | update | Chỉnh sửa thông tin (chuyển qua F-125) |
| Linh dao | approve | Phê duyệt/từ chối cầu cảng ngay từ trang chi tiết (F-126) |
| Admin | approve | Phê duyệt/từ chối cầu cảng ngay từ trang chi tiết (F-126) |

## Entities

- **CauCang**: id (UUID), maCau (string unique, length≤50), tenCau (string, length≤255), benCangId (UUID FK → BenCang), chieuDai (BigDecimal, precision 15, scale 2, unit: m), taiTrọng (BigDecimal, precision 15, scale 2, unit: T), loaiCau (string, length≤100), trangThaiHoatDong (string), trangThaiPheDuyet (enum: CHO_PHE_DUYET, DUOC_PHE_DUYET, TU_CHOI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (auto), updatedAt (auto), deletedAt (nullable)
- **BenCang** (FK): id (UUID), tenBenCang (string), trangThaiHoatDong (enum: HIEN_HANH, TAM_NGUNG)
- **Attachment**: id (UUID), cauCangId (UUID FK → CauCang), tenFile (string), duoiFile (string), kichThuoc (byte, max 10MB), createdAt

## Business Rules

| # | Rule | Description |
|---|---|---|
| 1 | maCau bất biến | maCau phải là duy nhất trong toàn bộ hệ thống — giá trị này không thể thay đổi khi xem chi tiết. |
| 2 | Parent BenCang hợp lệ | Parent BenCang (benCangId) phải tồn tại trong hệ thống và có trangThaiHoatDong = HIEN_HANH — nếu BenCang cha đã bị xóa hoặc không còn hoạt động, cầu cảng không được tạo (hoặc bị cảnh báo). |
| 3 | Trạng thái phê duyệt mặc định | Mặc định trangThaiPheDuyet = CHO_PHE_DUYET khi tạo mới — cầu cảng chỉ hiển thị trạng thái DUOC_PHE_DUYET sau khi được Leader phê duyệt. |
| 4 | Giới hạn tệp đính kèm | Tệp đính kèm bị giới hạn tối đa 10MB mỗi file và chỉ chấp nhận các định dạng PDF, DOCX, JPEG. |

## Testing Strategy

Kiểm thử đơn vị cho endpoint GET /api/v1/cau-cang/:id xác nhận trả về đúng đầy đủ các trường của entity CauCang cùng thông tin BenCang cha và danh sách attachments. Kiểm thử tích hợp cho flow truy cập chi tiết từ danh sách (F-122), xác nhận breadcrumb hoạt động đúng, các badge trạng thái hiển thị màu chính xác tương ứng với giá trị enum, và danh sách attachments hiển thị đúng giới hạn 10MB cùng các định dạng được chấp nhận. Kiểm thử UI xác nhận link BenCang hoạt động, nút download/print cho attachment hoạt động, và các nút phê duyệt/từ chối chỉ xuất hiện cho role Leader khi trạng thái là CHO_PHE_DUYET. Kiểm thử quyền xác nhận user không phải Leader không thấy nút hành động phê duyệt.
