---
id: F-098
name: "Lịch sử Cầu cảng"
slug: ui-ql-cc-lich-su
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:09:11Z"
last-updated: "2026-07-01T04:09:11Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Lịch sử Cầu cảng

## Description

Giao diện Lịch sử Cầu cảng hiển thị toàn bộ lịch sử thay đổi của một cầu cảng cụ thể dưới dạng bảng dữ liệu, bao gồm mọi thao tác tạo mới, cập nhật, phê duyệt, từ chối và xóa mềm. Bảng liệt kê các bản ghi LichSuThayDoi (ChangeLog) được sắp xếp theo thời gian thay đổi giảm dần (changedAt DESC — thay đổi mới nhất hiển thị đầu tiên). Mỗi hàng hiển thị các thông tin: tên trường bị thay đổi (fieldChanged), giá trị cũ (oldValue), giá trị mới (newValue), người thực hiện thay đổi (changedBy — hiển thị tên người dùng), thời gian thay đổi (changedAt — định dạng ngày/giờ), và loại hành động (actionType: TAO_MOI hoặc CAP_NHAT) giúp phân biệt giữa lần tạo mới ban đầu và các lần cập nhật sau này. Bảng hỗ trợ lọc theo trường bị thay đổi bằng dropdown filter (cho phép chọn một hoặc tất cả các trường). Khi cầu cảng bị xóa mềm, một bản ghi lịch sử cũng được tạo với actionType tương ứng. Giao diện cho phép người dùng xem lại toàn bộ quá trình thay đổi của cầu cảng từ khi được tạo đến hiện tại, phục vụ mục đích kiểm toán, debugging và phân tích. Nguồn: F-025 backend, INT-003.

## Business Intent

Cung cấp tính năng kiểm toán (audit trail) cho mọi thay đổi đối với cầu cảng, cho phép quản lý viên và lãnh đạo xem lại ai đã thay đổi thông tin gì, khi nào, và từ giá trị nào sang giá trị nào — đảm bảo tính minh bạch, trách nhiệm giải trình và khả năng truy vết lỗi dữ liệu.

## Flow Summary

Người dùng truy cập danh sách cầu cảng (F-078) → click "Lịch sử" trên một dòng cầu cảng cụ thể → hệ thống gọi GET /api/v1/cau-cang/:id/history → trả về danh sách các bản ghi LichSuThayDoi được sắp xếp theo changedAt DESC → giao diện hiển thị bảng với các cột: fieldChanged, oldValue, newValue, changedBy (tên người dùng), changedAt (ngày/giờ), actionType. Dropdown filter ở đầu bảng cho phép chọn lọc theo tên trường (ví dụ: lọc chỉ xem thay đổi của tenCau, chieuDai, hoặc trangThaiPheDuyet). Khi chọn một giá trị lọc từ dropdown, bảng được làm mới chỉ hiển thị các bản ghi tương ứng. Hành động TAO_MOI được đánh dấu khác biệt (ví dụ: badge màu xanh) để dễ phân biệt với CAP_NHAT (badge màu vàng). Khi cầu cảng bị xóa mềm, một bản ghi lịch sử cũng được tạo. Không có phân trang hiển thị trong UI nhưng backend có thể trả về giới hạn (ví dụ: tối đa 100 bản ghi gần nhất). Tất cả thông tin đều là read-only — không cho phép chỉnh sửa từ trang lịch sử.

## Acceptance Criteria

1. Bảng lịch sử hiển thị tất cả các bản ghi LichSuThayDoi của cầu cảng, sắp xếp theo changedAt giảm dần (mới nhất lên đầu).
2. Mỗi hàng hiển thị đúng các cột: fieldChanged, oldValue, newValue, changedBy (tên người dùng), changedAt (ngày/giờ), actionType.
3. Cột fieldChanged hiển thị tên trường tiếng Việt dễ hiểu (ví dụ: "Tên cầu cảng", "Chiều dài", "Loại cầu cảng").
4. Trường changedBy hiển thị tên người dùng thực hiện thay đổi (không chỉ UUID).
5. Trường changedAt hiển thị ngày và giờ theo định dạng dễ đọc (ví dụ: dd/MM/yyyy HH:mm).
6. ActionType được hiển thị dưới dạng badge: "Tạo mới" (màu xanh) và "Cập nhật" (màu vàng).
7. Dropdown filter cho phép chọn lọc theo tên trường — chọn "Tất cả" hiển thị mọi thay đổi.
8. Khi chọn một giá trị lọc từ dropdown, bảng làm mới và chỉ hiển thị các bản ghi tương ứng.
9. Các bản ghi PheDuyetLog (phê duyệt/từ chối) cũng được hiển thị trong bảng với actionType tương ứng.
10. Giao diện read-only — không cho phép chỉnh sửa hoặc xóa bản ghi lịch sử.
11. Nếu không có bản ghi lịch sử nào, hiển thị thông báo "Không có lịch sử thay đổi".
12. Link "Lịch sử" từ danh sách F-078 mở trang lịch sử cho đúng cầu cảng được chọn.

## In Scope

- API GET /api/v1/cau-cang/:id/history để lấy danh sách LichSuThayDoi.
- Bảng lịch sử với các cột: fieldChanged, oldValue, newValue, changedBy, changedAt, actionType.
- Sắp xếp mặc định theo changedAt DESC.
- Dropdown filter theo tên trường (fieldChanged).
- Badge màu phân biệt actionType: TAO_MOI (xanh) và CAP_NHAT (vàng).
- Hiển thị tên người dùng cho changedBy.
- Hiển thị tên tiếng Việt cho fieldChanged.
- Hiển thị PheDuyetLog trong cùng bảng.
- Thông báo "Không có lịch sử thay đổi" khi bảng rỗng.
- Read-only — không cho phép chỉnh sửa từ trang lịch sử.

## Out of Scope

- Chỉnh sửa hoặc xóa bản ghi lịch sử.
- Xuất lịch sử ra Excel/PDF.
- So sánh hai phiên bản của cầu cảng (diff view giữa hai thời điểm).
- Lọc theo khoảng thời gian (từ đến).
- Lọc theo người thực hiện thay đổi.
- Phân trang hiển thị trong UI (backend trả về giới hạn cố định).
- Khôi phục dữ liệu từ bản ghi lịch sử (restore).

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quan ly tai san | read | Xem lịch sử thay đổi của cầu cảng |
| Quan ly tai san | approve | Xem lịch sử phê duyệt từ trang F-098 |
| Linh dao | read | Xem lịch sử thay đổi của cầu cảng |
| Admin | read | Xem lịch sử thay đổi của cầu cảng |

## Entities

- **LichSuThayDoi** (ChangeLog): id (UUID), cauCangId (UUID FK → CauCang), fieldChanged (string — tên trường: tenCau, chieuDai, chieuRong, loaiCau, ghiChu, trangThaiHoatDong, trangThaiPheDuyet, benCangId), oldValue (text — giá trị cũ của trường), newValue (text — giá trị mới của trường), changedBy (UUID FK → User — người thực hiện thay đổi), changedAt (auto timestamp), actionType (enum: TAO_MOI, CAP_NHAT, PHE_DUYET, TU_CHOI, XOA_MEM)
- **PheDuyetLog**: id (UUID), cauCangId (UUID FK → CauCang), pheDuyetBy (UUID FK → User), pheDuyetAt (auto timestamp), ketQua (enum: DUOC_PHE_DUYET, TU_CHOI), lyDoTuChoi (text)
- **CauCang**: id (UUID), maCau (string unique), tenCau (string), trangThaiPheDuyet (enum: CHO_PHE_DUYET, DUOC_PHE_DUYET, TU_CHOI), deletedAt (nullable)
- **User** (FK cho changedBy/pheDuyetBy): id (UUID), hoTen (string)

## Business Rules

1. Mọi thay đổi đối với cầu cảng (tạo mới, cập nhật, phê duyệt, từ chối, xóa mềm) đều tạo một bản ghi LichSuThayDoi — không có thay đổi nào bị bỏ qua.
2. Các bản ghi được sắp xếp theo changedAt DESC — thay đổi mới nhất luôn hiển thị đầu tiên trong bảng.
3. Trường fieldChanged được ánh xạ sang tên tiếng Việt để hiển thị cho người dùng (ví dụ: "chieuDai" → "Chiều dài", "trangThaiPheDuyet" → "Trạng thái phê duyệt").
4. Trường changedBy được hiển thị dưới dạng tên người dùng (hoTen) — không chỉ hiển thị UUID.
5. ActionType phân biệt rõ ràng các loại hành động: TAO_MOI (lần tạo đầu tiên), CAP_NHAT (cập nhật thông tin), PHE_DUYET (phê duyệt), TU_CHOI (từ chối), XOA_MEM (xóa mềm).
6. PheDuyetLog cũng được tích hợp vào cùng bảng lịch sử với LichSuThayDoi để người dùng có cái nhìn toàn diện về toàn bộ biến động của cầu cảng.
7. Dữ liệu lịch sử là read-only — không cho phép người dùng chỉnh sửa, xóa hoặc hoàn tác từ giao diện này.

## Testing Strategy

Kiểm thử đơn vị cho service method getHistory() xác nhận trả về danh sách LichSuThayDoi sắp xếp theo changedAt DESC, bao gồm cả PheDuyetLog, và fieldChanged được ánh xạ sang tên tiếng Việt. Kiểm thử integration cho endpoint GET /api/v1/cau-cang/:id/history với các trường hợp: cầu cảng có nhiều thay đổi (tạo mới + cập nhật + phê duyệt + xóa), cầu cảng không có thay đổi nào (trả về danh sách rỗng), cầu cảng đã bị xóa mềm (vẫn trả về lịch sử). Kiểm thử UI cho bảng: sắp xếp đúng thứ tự DESC, badge màu actionType chính xác, dropdown filter hoạt động (chọn "Tất cả" và chọn từng trường riêng lẻ), changedBy hiển thị tên người dùng, changedAt định dạng ngày/giờ, thông báo rỗng khi không có dữ liệu. Kiểm thử RBAC: tất cả role đều có thể xem lịch sử (không yêu cầu approve permission).
