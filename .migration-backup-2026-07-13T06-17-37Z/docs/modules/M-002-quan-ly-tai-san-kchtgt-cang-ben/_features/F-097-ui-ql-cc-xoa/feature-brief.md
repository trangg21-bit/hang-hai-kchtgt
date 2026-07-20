---
id: F-097
name: "Xóa Cầu cảng"
slug: ui-ql-cc-xoa
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:09:10Z"
last-updated: "2026-07-01T04:09:10Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xóa Cầu cảng

## Description

Giao diện xóa Cầu cảng cho phép Leader (Lãnh đạo) và Admin thực hiện xóa mềm (soft-delete) một cầu cảng khỏi danh sách hoạt động của hệ thống quản lý tài sản cảng biển. Đây là thao tác nhạy cảm vì liên quan đến dữ liệu tài sản, nên hệ thống yêu cầu xác nhận trước khi thực hiện. Người dùng truy cập danh sách cầu cảng (F-078) → click "Xóa" trên một dòng cầu cảng cụ thể → hộp thoại xác nhận xuất hiện hiển thị thông tin cầu cảng bị sắp xóa (maCau, tenCau, loại cầu cảng, trạng thái hiện tại) kèm cảnh báo rằng hành động này không thể hoàn tác ở mức độ xóa vật lý. Người dùng xác nhận bằng cách click "Xóa" trong dialog hoặc hủy bằng "Hủy". Nếu xác nhận, hệ thống gọi DELETE /api/v1/cau-cang/:id → backend thực hiện xóa mềm bằng cách set trường deletedAt thành timestamp hiện tại (không xóa bản ghi vật lý khỏi database). Cầu cảng bị xóa mềm sẽ biến mất khỏi danh sách hoạt động thông thường nhưng vẫn tồn tại trong cơ sở dữ liệu và có thể được khôi phục (nếu có cơ chế khôi phục) hoặc tìm thấy trong lịch sử thay đổi. Vì CầuCang là node lá (không có child entities), không cần kiểm tra tồn tại con trước khi xóa — khác với BenCang vốn cần kiểm tra trước khi xóa. Nguồn: F-022 backend.

## Business Intent

Cho phép Leader hoặc Admin loại bỏ các cầu cảng không còn hoạt động hoặc sai lệch thông tin ra khỏi danh sách vận hành mà vẫn giữ nguyên dữ liệu gốc để phục vụ kiểm toán và phân tích lịch sử, tuân thủ nguyên tắc xóa mềm thay vì xóa vật lý.

## Flow Summary

Người dùng (Leader hoặc Admin) truy cập danh sách cầu cảng (F-078) → tìm đến dòng cầu cảng cần xóa → click nút "Xóa" → hộp thoại xác nhận (confirmation dialog) xuất hiện với thông tin: "Bạn có chắc chắn muốn xóa cầu cảng [maCau] - [tenCau]? Hành động này sẽ đánh dấu cầu cảng là đã xóa và nó sẽ không còn xuất hiện trong danh sách hoạt động." cùng 2 nút "Xóa" (xác nhận) và "Hủy" (bỏ qua). Nếu click "Hủy" → dialog đóng, không có thao tác nào. Nếu click "Xóa" → hệ thống gọi DELETE /api/v1/cau-cang/:id → backend set deletedAt = current timestamp cho bản ghi CauCang tương ứng → toast "Xóa cầu cảng thành công" hiển thị → danh sách F-078 được làm mới, cầu cảng bị xóa không còn hiển thị trong kết quả tìm kiếm (vì deletedAt != null). Bản ghi vẫn tồn tại trong database và có thể được kiểm tra qua API history. Nếu DELETE trả về lỗi (ví dụ: bản ghi không tồn tại hoặc đã bị xóa trước đó), toast lỗi được hiển thị.

## Acceptance Criteria

1. Chỉ các role Leader (Linh dao) và Admin mới thấy nút "Xóa" trên danh sách cầu cảng — user thường không thấy nút này.
2. Click "Xóa" mở hộp thoại xác nhận (confirmation dialog) hiển thị thông tin cầu cảng: maCau, tenCau, loại cầu cảng, trạng thái hiện tại.
3. Hộp thoại xác nhận có cảnh báo: "Hành động này sẽ xóa cầu cảng khỏi danh sách hoạt động, không thể hoàn tác."
4. Nút "Hủy" trong dialog đóng hộp thoại mà không thực hiện thao tác xóa.
5. Nút "Xóa" trong dialog xác nhận và gọi DELETE /api/v1/cau-cang/:id.
6. Sau khi DELETE thành công, trường deletedAt của CauCang được set thành timestamp hiện tại (xóa mềm).
7. Cầu cảng bị xóa mềm biến mất khỏi danh sách F-078 và không còn hiển thị khi tìm kiếm bình thường.
8. Toast "Xóa cầu cảng thành công" hiển thị sau khi xóa thành công.
9. Danh sách F-078 được làm mới sau khi xóa để phản ánh thay đổi.
10. Không có kiểm tra child/entities con trước khi xóa (CauCang là node lá) — khác với BenCang.
11. Nếu DELETE trả về lỗi (ví dụ: bản ghi đã bị xóa hoặc không tồn tại), toast lỗi được hiển thị.
12. Cầu cảng bị xóa vẫn tồn tại trong cơ sở dữ liệu và có thể được kiểm tra qua API history.

## In Scope

- API DELETE /api/v1/cau-cang/:id cho Leader/Admin.
- Hộp thoại xác nhận (confirmation dialog) với thông tin cầu cảng bị sắp xóa.
- Nút "Hủy" và nút "Xóa" trong dialog.
- Xóa mềm: set deletedAt = current timestamp.
- Toast thông báo thành công hoặc lỗi.
- Làm mới danh sách sau khi xóa.
- Nút "Xóa" chỉ hiển thị cho role Leader và Admin.

## Out of Scope

- Xóa vật lý bản ghi khỏi database (chỉ xóa mềm qua deletedAt).
- Khôi phục cầu cảng đã xóa (không có tính năng undo/recover từ UI này).
- Xóa nhiều cầu cảng cùng lúc (bulk delete).
- Xóa cầu cảng từ trang chi tiết F-079 (thực hiện từ danh sách F-078).
- In giấy xác nhận xóa.
- Gửi thông báo email khi xóa cầu cảng.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Linh dao | delete | Xóa mềm cầu cảng (F-097) |
| Linh dao | read | Xem danh sách cầu cảng (không xóa) |
| Admin | delete | Xóa mềm cầu cảng (F-097) |
| Admin | read | Xem danh sách cầu cảng (không xóa) |

## Entities

- **CauCang**: id (UUID), maCau (string unique), tenCau (string), benCangId (UUID FK → BenCang), chieuDai (decimal m), chieuRong (decimal m), loaiCau (enum: DAI_TRO, BIT_NEO, LAN_THANH, DO_BIN_DAU_LOI, THUY_SAN), ghiChu (text), trangThaiHoatDong (enum: HIEN_HANH, TAM_NGUNG), trangThaiPheDuyet (enum: CHO_PHE_DUYET, DUOC_PHE_DUYET, TU_CHOI), orgUnitId (UUID), updatedBy (UUID), deletedAt (nullable — được set khi xóa mềm), updatedAt (auto)
- **BenCang** (FK): id (UUID), tenBenCang (string), trangThaiHoatDong (enum: HIEN_HANH)

## Business Rules

1. Chỉ các role Leader (Linh dao) và Admin mới có quyền xóa cầu cảng — các role khác không thấy nút hành động xóa.
2. Xóa cầu cảng là xóa mềm (soft-delete): set deletedAt = current timestamp — bản ghi không bị xóa vật lý khỏi database, chỉ được ẩn khỏi danh sách hoạt động.
3. Không cần kiểm tra tồn tại child/entities con trước khi xóa vì CauCang là node lá (leaf node) — không có entity nào tham chiếu FK đến CauCang.
4. Cầu cảng bị xóa mềm vẫn giữ nguyên toàn bộ dữ liệu và có thể được phát hiện qua API history hoặc database query trực tiếp.
5. Mọi thao tác xóa được ghi nhận vào LichSuThayDoi của cầu cảng (INT-003) để phục vụ kiểm toán.
6. Nếu cầu cảng đã có deletedAt != null (đã bị xóa trước đó), thao tác xóa thêm sẽ trả về lỗi hoặc bỏ qua tùy theo nghiệp vụ.

## Testing Strategy

Kiểm thử đơn vị cho service method delete() xác nhận: chỉ role Leader/Admin mới có quyền xóa, thực hiện set deletedAt thay vì xóa vật lý, không có kiểm tra child entities (vì CauCang là leaf node), và tạo bản ghi LichSuThayDoi cho thao tác xóa. Kiểm thử integration cho endpoint DELETE /api/v1/cau-cang/:id với các trường hợp: xóa thành công cho cầu cảng chưa bị xóa, xóa lại cầu cảng đã deletedAt != null (phải lỗi hoặc bỏ qua), xóa cầu cảng không tồn tại (phải trả về 404). Kiểm thử UI cho flow xóa: nút "Xóa" chỉ hiện cho Leader/Admin, hộp thoại xác nhận hiển thị đúng thông tin, nút Hủy không thực hiện thao tác, toast sau khi xóa thành công, và danh sách được làm mới để loại bỏ cầu cảng đã xóa. Kiểm thử RBAC: user thường không thấy nút xóa.
