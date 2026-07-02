---
id: F-081
name: "Cập nhật Cầu cảng"
slug: ui-ql-cc-cap-nhat
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:29Z"
last-updated: "2026-07-01T04:08:29Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Cập nhật Cầu cảng

## Description

Giao diện form cập nhật Cầu cảng cho phép quản lý viên chỉnh sửa thông tin của một cầu cảng đã tồn tại trong hệ thống. Form được điền sẵn toàn bộ dữ liệu hiện tại của cầu cảng được chọn từ danh sách (F-078). Trường maCau được khóa (readonly) — không thể thay đổi mã cầu cảng đã được tạo vì đây là định danh duy nhất. Các trường có thể chỉnh sửa bao gồm: tenCau (tên cầu cảng), benCangId (dropdown chọn bến cảng cha — chỉ hiển thị các bến cảng có trạng thái HIEN_HANH), chieuDai (chiều dài, đơn vị mét), chieuRong (chiều rộng, đơn vị mét), loaiCau (dropdown loại cầu cảng: DAI_TRO, BIT_NEO, LAN_THANH, DO_BIN_DAU_LOI, THUY_SAN), và ghiChu (ghi chú tùy chọn). Validation phía client áp dụng tương tự form tạo mới: kiểm tra trường bắt buộc, định dạng số cho chieuDai/chieuRong, và đảm bảo parent BenCang tồn tại cùng trạng thái HIEN_HANH. Sau khi submit thành công (PUT /api/v1/cau-cang/:id), hệ thống tạo một bản ghi LichSuThayDoi (ChangeLog) ghi lại mọi thay đổi, trạng thái phê duyệt được đặt lại về CHO_PHE_DUYET (cầu cảng cần phê duyệt lại), toast thông báo "Cập nhật cầu cảng thành công, chờ phê duyệt lại" được hiển thị, và người dùng được chuyển hướng về trang chi tiết F-079 của cầu cảng đó. Nguồn: F-021 backend, INT-003.

## Business Intent

Cho phép quản lý viên duy trì và cập nhật thông tin cầu cảng khi có thay đổi về thông tin kỹ thuật hoặc tổ chức, đảm bảo dữ liệu luôn chính xác và mọi thay đổi đều phải được phê duyệt lại trước khi đưa vào vận hành thực tế.

## Flow Summary

Người dùng truy cập danh sách cầu cảng (F-078) → click "Chỉnh sửa" trên một dòng cầu cảng cụ thể → hệ thống gọi GET /api/v1/cau-cang/:id để lấy dữ liệu hiện tại → form cập nhật được hiển thị với tất cả các trường đã điền sẵn. Trường maCau hiển thị dưới dạng readonly (không thể sửa). Người dùng chỉnh sửa các trường cần thiết: tenCau, benCangId, chieuDai, chieuRong, loaiCau, ghiChu. Nếu thay đổi benCangId, dropdown chỉ cho phép chọn bến cảng có trạng thái HIEN_HANH. Click "Lưu" → hệ thống gọi PUT /api/v1/cau-cang/:id với payload đã chỉnh sửa → backend kiểm tra business rules (maCau uniqueness không áp dụng vì readonly, parent guard INT-005) → nếu thành công, tạo bản ghi LichSuThayDoi ghi lại tất cả thay đổi, đặt lại trangThaiPheDuyet = CHO_PHE_DUYET, toast "chờ phê duyệt lại" hiển thị → redirect về trang chi tiết F-079. Nếu backend trả lỗi (ví dụ: benCangId không tồn tại hoặc không HIEN_HANH), thông báo lỗi chi tiết được hiển thị tại trường tương ứng.

## Acceptance Criteria

1. Form cập nhật hiển thị đầy đủ các trường: maCau (readonly), tenCau, benCangId, chieuDai, chieuRong, loaiCau, ghiChu — tất cả được điền sẵn từ dữ liệu hiện tại của cầu cảng.
2. Trường maCau không thể chỉnh sửa (readonly/disabled), chỉ hiển thị giá trị hiện tại.
3. Trường benCangId là dropdown chỉ hiển thị các bến cảng có trạngThaiHoatDong = HIEN_HANH (backend filter).
4. Trường tenCau là bắt buộc — nếu bỏ trống sau khi chỉnh sửa, hệ thống hiển thị lỗi "Trường này là bắt buộc".
5. Trường benCangId là bắt buộc — nếu không chọn bến cảng, hệ thống hiển thị lỗi tương ứng.
6. Các trường chieuDai và chieuRong chỉ chấp nhận giá trị thập phân dương, có validation định dạng số.
7. Trường loaiCau là dropdown với các tùy chọn: DAI_TRO, BIT_NEO, LAN_THANH, DO_BIN_DAU_LOI, THUY_SAN.
8. Trường ghiChu là text area tùy chọn, có thể để trống.
9. Sau khi PUT thành công, bản ghi LichSuThayDoi được tạo ghi lại tất cả thay đổi.
10. Sau khi PUT thành công, trạng thái trangThaiPheDuyet được đặt lại về CHO_PHE_DUYET.
11. Toast thông báo "Cập nhật cầu cảng thành công, chờ phê duyệt lại" hiển thị sau khi submit thành công.
12. Người dùng được redirect về trang chi tiết F-079 của cầu cảng sau khi cập nhật thành công.
13. Nếu PUT trả về lỗi từ backend, thông báo lỗi chi tiết được hiển thị ngay tại trường tương ứng.

## In Scope

- Form cập nhật với các trường: maCau (readonly), tenCau, benCangId, chieuDai, chieuRong, loaiCau, ghiChu.
- Pre-fill form với dữ liệu hiện tại của cầu cảng từ GET /api/v1/cau-cang/:id.
- Validation client-side: trường bắt buộc, định dạng số, parent BenCang tồn tại + HIEN_HANH.
- Dropdown benCangId chỉ hiển thị BenCang với status = HIEN_HANH (backend filtered).
- API PUT /api/v1/cau-cang/:id.
- Tạo bản ghi LichSuThayDoi trên mỗi lần cập nhật thành công.
- Đặt lại trangThaiPheDuyet = CHO_PHE_DUYET sau cập nhật.
- Toast thông báo thành công và redirect về F-079.
- Hiển thị lỗi validation chi tiết cho từng trường.

## Out of Scope

- Thay đổi trường maCau (không cho phép, field là readonly).
- Upload hoặc xóa tệp đính kèm từ trang cập nhật (thực hiện ở trang chi tiết F-079).
- Preview thay đổi trước khi submit.
- Khôi phục giá trị gốc của tất cả trường cùng lúc (undo all).
- Cập nhật batch nhiều cầu cảng cùng lúc.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quan ly tai san | update | Chỉnh sửa thông tin cầu cảng (F-081) |
| Quan ly tai san | read | Xem form cập nhật (không submit) |
| Linh dao | approve | Phê duyệt lại cầu cảng sau khi cập nhật (F-082) |
| Admin | update | Chỉnh sửa thông tin cầu cảng (F-081) |

## Entities

- **CauCang**: id (UUID), maCau (string unique, readonly), tenCau (string, required), benCangId (UUID FK → BenCang, required), chieuDai (decimal m), chieuRong (decimal m), loaiCau (enum: DAI_TRO, BIT_NEO, LAN_THANH, DO_BIN_DAU_LOI, THUY_SAN), ghiChu (text), trangThaiHoatDong (enum: HIEN_HANH), trangThaiPheDuyet (enum: CHO_PHE_DUYET — được đặt lại sau cập nhật), orgUnitId (UUID), updatedBy (UUID, tự động), updatedAt (auto), deletedAt (nullable)
- **BenCang** (FK parent): id (UUID), tenBenCang (string), trangThaiHoatDong (enum: HIEN_HANH — chỉ các bản ghi này hiển thị trong dropdown)
- **LichSuThayDoi** (ChangeLog): id (UUID), cauCangId (UUID FK → CauCang), fieldChanged (string), oldValue (text), newValue (text), changedBy (UUID), changedAt (auto), actionType (enum: TAO_MOI/CAP_NHAT)

## Business Rules

1. maCau không thể thay đổi khi cập nhật — trường là readonly, không cho phép submit nếu cố tình thay đổi giá trị.
2. Parent BenCang (benCangId) phải tồn tại trong hệ thống và có trangThaiHoatDong = HIEN_HANH — backend kiểm tra (INT-005), không cho phép cập nhật cầu cảng để trỏ đến bến cảng không tồn tại hoặc đang TAM_NGUNG.
3. Sau khi cập nhật thành công, trạng thái trangThaiPheDuyet được đặt lại về CHO_PHE_DUYET — cầu cảng cần được phê duyệt lại trước khi tiếp tục vận hành.
4. Mỗi lần cập nhật tạo một bản ghi LichSuThayDoi (INT-003) ghi lại: tên field, giá trị cũ, giá trị mới, người thay đổi, thời gian thay đổi.
5. Tất cả các trường bắt buộc (tenCau, benCangId, chieuDai, chieuRong, loaiCau) phải được điền đầy đủ sau khi chỉnh sửa — validation client và server.
6. chieuDai và chieuRong phải là số thập phân dương — không chấp nhận giá trị âm hoặc 0.

## Testing Strategy

Kiểm thử đơn vị cho service method update() xác nhận các business rules: kiểm tra parent BenCang tồn tại và HIEN_HANH (INT-005), đặt lại trangThaiPheDuyet = CHO_PHE_DUYET, và tạo bản ghi LichSuThayDoi đúng cấu trúc. Kiểm thử integration cho endpoint PUT /api/v1/cau-cang/:id với các payload hợp lệ (chỉnh sửa một hoặc nhiều trường) và không hợp lệ (thiếu trường, maCau thay đổi, benCangId không tồn tại, benCangId TAM_NGUNG, chieuDai âm). Kiểm thử UI cho form: pre-fill dữ liệu từ backend, maCau readonly, validation client-side (trường bắt buộc, định dạng số), dropdown benCangId chỉ hiển thị HIEN_HANH, toast sau khi cập nhật thành công, và redirect về F-079. Kiểm thử LichSuThayDoi: xác nhận mỗi trường thay đổi tạo một bản ghi riêng, oldValue và newValue chính xác, changedBy và changedAt được set tự động.
