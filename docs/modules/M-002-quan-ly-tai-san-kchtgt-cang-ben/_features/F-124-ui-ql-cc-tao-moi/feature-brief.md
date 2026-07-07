---
id: F-124
name: "Tạo mới Cầu cảng"
slug: ui-ql-cc-tao-moi
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:27Z"
last-updated: "2026-07-01T04:08:27Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Tạo mới Cầu cảng

## Description

Giao diện form tạo mới Cầu cảng cho phép người dùng nhập đầy đủ thông tin để tạo một cầu cảng mới trong hệ thống. Form bao gồm các trường: maCau (chuỗi duy nhất, người dùng tự nhập, hệ thống kiểm tra tính duy nhất ngay trên client trước khi submit), tenCau (chuỗi bắt buộc), benCangId (dropdown chọn bến cảng cha — chỉ hiển thị các bến cảng có trạng thái HIEN_HANH, việc lọc này được thực hiện từ backend), chieuDai (số thập phân, đơn vị mét), taiTrọng (số thập phân, đơn vị tấn), loaiCau (dropdown chọn loại cầu cảng với các giá trị: DAI_TRO, BIT_NEO, LAN_THANH, DO_BIN_DAU_LOI, THUY_SAN). Hệ thống thực hiện validation phía client: maCau phải duy nhất (kiểm tra qua API), parent BenCang phải tồn tại và có trạng thái HIEN_HANH (validation từ backend), tất cả các trường bắt buộc phải được điền đầy đủ. Sau khi submit thành công (POST /api/v1/cau-cang), cầu cảng được tạo với trạng thái mặc định là CHO_PHE_DUYET, thông báo toast thành công được hiển thị, và người dùng được chuyển hướng về trang danh sách (F-122). Nguồn: F-020 backend, INT-005 parent guard.

## Business Intent

Cho phép quản lý viên đăng ký thông tin mới của cầu cảng vào hệ thống quản lý tài sản cảng biển, đảm bảo mọi thông tin được thu thập đầy đủ và tuân thủ các quy tắc nghiệp vụ trước khi đưa vào quá trình phê duyệt.

## Flow Summary

Người dùng click nút "Tạo mới" từ danh sách (F-122) → hệ thống hiển thị form tạo mới cầu cảng với các trường rỗng để điền. Người dùng nhập maCau → hệ thống kiểm tra tính duy nhất qua API (hiển thị lỗi ngay nếu trùng). Người dùng chọn benCangId từ dropdown — chỉ hiển thị các bến cảng có trạng thái HIEN_HANH (backend filter). Người dùng nhập các trường còn lại: tenCau, chieuDai, taiTrọng, loaiCau. Các trường bắt buộc có validation đỏ nếu để trống. Người dùng click "Lưu" → hệ thống gọi POST /api/v1/cau-cang với dữ liệu form → backend kiểm tra lại mọi business rules (bao gồm parent guard từ INT-005) → nếu thành công, cầu cảng được tạo với trangThaiPheDuyet = CHO_PHE_DUYET → toast "Tạo mới cầu cảng thành công, chờ phê duyệt" hiển thị → người dùng được redirect về danh sách F-122. Nếu có lỗi validation hoặc business rule, thông báo lỗi chi tiết được hiển thị ngay tại trường tương ứng.

## Acceptance Criteria

1. Form tạo mới hiển thị đầy đủ các trường: maCau, tenCau, benCangId, chieuDai, taiTrọng, loaiCau.
2. Trường maCau có validation độc nhất: nếu mã đã tồn tại, hệ thống hiển thị lỗi "Mã cầu cảng đã tồn tại" và không cho phép submit.
3. Trường benCangId là dropdown chỉ hiển thị các bến cảng có trạngThaiHoatDong = HIEN_HANH (backend filter).
4. Trường tenCau là bắt buộc — nếu bỏ trống, hệ thống hiển thị lỗi "Trường này là bắt buộc".
5. Trường benCangId là bắt buộc — nếu không chọn bến cảng, hệ thống hiển thị lỗi tương ứng.
6. Các trường chieuDai và taiTrọng chấp nhận giá trị thập phân dương, có validation định dạng số.
7. Trường loaiCau là dropdown với các tùy chọn: DAI_TRO, BIT_NEO, LAN_THANH, DO_BIN_DAU_LOI, THUY_SAN.
8. Sau khi POST thành công, cầu cảng được tạo với trạng thái mặc định = CHO_PHE_DUYET.
9. Toast thông báo "Tạo mới cầu cảng thành công, chờ phê duyệt" hiển thị sau khi submit thành công.
10. Người dùng được redirect về danh sách F-122 sau khi tạo mới thành công.
11. Nếu POST trả về lỗi từ backend (ví dụ: parent BenCang không tồn tại hoặc không HIEN_HANH), hệ thống hiển thị thông báo lỗi từ phản hồi API.

## In Scope

- Form tạo mới với các trường: maCau, tenCau, benCangId, chieuDai, taiTrọng, loaiCau.
- Validation client-side: maCau unique, trường bắt buộc, định dạng số cho chieuDai/taiTrọng.
- Dropdown benCangId chỉ hiển thị BenCang với status = HIEN_HANH (backend filtered).
- API POST /api/v1/cau-cang.
- Mặc định trangThaiPheDuyet = CHO_PHE_DUYET.
- Toast thông báo thành công và redirect về F-122.
- Hiển thị lỗi validation chi tiết cho từng trường.

## Out of Scope

- Upload tệp đính kèm khi tạo mới (thực hiện sau khi tạo, từ trang F-125).
- Sao chép thông tin từ cầu cảng khác.
- Import nhiều cầu cảng cùng lúc từ file CSV/Excel.
- Auto-generate maCau (người dùng phải tự nhập).
- Preview kết quả sau khi tạo.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quan ly tai san | create | Tạo mới cầu cảng (F-124) |
| Quan ly tai san | read | Xem form tạo mới (không submit) |
| Linh dao | approve | Phê duyệt cầu cảng vừa tạo (F-126) |
| Admin | create | Tạo mới cầu cảng (F-124) |

## Entities

- **CauCang**: id (UUID, auto-generated), maCau (string unique, length≤50, user nhập), tenCau (string, length≤255, required), benCangId (UUID FK → BenCang, required), chieuDai (BigDecimal, precision 15, scale 2, unit: m, required), taiTrọng (BigDecimal, precision 15, scale 2, unit: T, required), loaiCau (string, length≤100, required, enum: DAI_TRO, BIT_NEO, LAN_THANH, DO_BIN_DAU_LOI, THUY_SAN), trangThaiHoatDong (enum: HIEN_HANH, mặc định khi tạo), trangThaiPheDuyet (enum: CHO_PHE_DUYET, mặc định khi tạo), orgUnitId (UUID, tự động từ đăng nhập), createdBy (UUID, tự động), createdAt (auto), updatedAt (auto), deletedAt (nullable)
- **BenCang** (FK parent): id (UUID), tenBenCang (string), trangThaiHoatDong (enum: HIEN_HANH — chỉ các bản ghi này hiển thị trong dropdown)

## Business Rules

| # | Rule | Description |
|---|---|---|
| 1 | maCau duy nhất | maCau phải là duy nhất trong toàn bộ hệ thống — không cho phép tạo mới với mã đã tồn tại, kiểm tra real-time qua API. |
| 2 | Parent BenCang hợp lệ | Parent BenCang (benCangId) phải tồn tại trong hệ thống và có trangThaiHoatDong = HIEN_HANH — backend kiểm tra (INT-005), không cho phép tạo cầu cảng cho bến cảng không tồn tại hoặc đang TAM_NGUNG. |
| 3 | Trạng thái mặc định | Mặc định trangThaiPheDuyet = CHO_PHE_DUYET khi tạo mới — cầu cảng phải được Leader phê duyệt trước khi đưa vào vận hành. |
| 4 | Trường bắt buộc | Tất cả các trường bắt buộc (maCau, tenCau, benCangId, chieuDai, taiTrọng, loaiCau) phải được điền đầy đủ — validation client và server. |
| 5 | Định dạng số dương | chieuDai và taiTrọng phải là số thập phân dương — không chấp nhận giá trị âm hoặc 0. |

## Testing Strategy

Kiểm thử đơn vị cho service method create() xác nhận các business rules: kiểm tra maCau duy nhất, kiểm tra parent BenCang tồn tại và HIEN_HANH (INT-005), và thiết lập trangThaiPheDuyet = CHO_PHE_DUYET mặc định. Kiểm thử integration cho endpoint POST /api/v1/cau-cang với các payload hợp lệ và không hợp lệ (thiếu trường, maCau trùng, benCangId không tồn tại, benCangId TAM_NGUNG). Kiểm thử UI cho form: validation client-side (trường bắt buộc, định dạng số, maCau unique real-time), dropdown benCangId chỉ hiển thị HIEN_HANH, toast sau khi tạo thành công, và redirect về F-122. Kiểm thử các trường hợp lỗi: maCau đã tồn tại, parent BenCang không HIEN_HANH, dữ liệu định dạng sai — xác nhận thông báo lỗi hiển thị chính xác tại từng trường.
