---
id: F-094
name: "Lịch sử Cảng biển"
slug: ui-ql-cb-lich-su
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:09:06Z"
last-updated: "2026-07-01T04:09:06Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Lịch sử Cảng biển

## Description

Giao diện lịch sử Cảng biển (CangBienHistoryPage) hiển thị danh sách đầy đủ các bản ghi LichSuThayDoi của một cảng biển cụ thể, cho phép người dùng truy vết mọi thay đổi đã được thực hiện (tạo mới và cập nhật). Bảng lịch sử hiển thị các cột: Field (tên trường thay đổi), Old Value (giá trị trước khi thay đổi), New Value (giá trị sau khi thay đổi), Changed By (người thay đổi, hiển thị tên người dùng), Changed At (thời gian thay đổi). Các bản ghi được sắp xếp theo changedAt giảm dần (mới nhất trước). Hỗ trợ lọc theo field name (ví dụ: chỉ xem thay đổi của tenCang hoặc viDo). Mỗi bản ghi có indicator "TẠO_MỚI" hoặc "CẬP_NHẬT" để phân biệt thao tác tạo mới ban đầu và các lần cập nhật sau đó. Giao diện cho phép xem chi tiết giá trị cũ/mới bằng tooltip hoặc modal khi giá trị quá dài.

## Business Intent

Cung cấp khả năng truy vết (audit trail) toàn bộ lịch sử thay đổi của một cảng biển, giúp người dùng và người quản lý hiểu rõ ai đã thay đổi gì và khi nào. Điều này đặc biệt quan trọng cho các yêu cầu kiểm toán, giải quyết tranh chấp dữ liệu và đảm bảo tính minh bạch trong quy trình quản lý tài sản cảng biển.

## Flow Summary

Người dùng điều hướng đến trang lịch sử từ danh sách (F-068), chi tiết (F-069) hoặc hành động "Lịch sử" trong menu. Hệ thống gọi GET /api/v1/cang-bien/:id/history để tải danh sách LichSuThayDoi records. Trang hiển thị bảng với 5 cột: Field, Old Value, New Value, Changed By, Changed At — sắp xếp changedAt DESC. Người dùng có thể lọc theo field name qua ô tìm kiếm. Mỗi bản ghi có badge indicator "TẠO_MỚI" (loaiThayDoi = TẠO_MỚI) hoặc "CẬP_NHẬT" (loaiThayDoi = CẬP_NHẬT). Tooltip hiển thị giá trị cũ/mới chi tiết khi hover. Nếu không có bản ghi nào, hiển thị thông báo "Chưa có thay đổi".

## Acceptance Criteria

1. Bảng lịch sử hiển thị tất cả các bản ghi LichSuThayDoi của một cảng biển cụ thể với 5 cột: Field, Old Value, New Value, Changed By, Changed At.
2. Các bản ghi được sắp xếp theo changedAt giảm dần (mới nhất hiển thị đầu tiên).
3. Mỗi bản ghi có indicator "TẠO_MỚI" hoặc "CẬP_NHẬT" phân biệt loại thao tác.
4. Lọc theo field name — hiển thị chỉ các bản ghi có field khớp với từ khóa lọc.
5. Trường "Changed By" hiển thị tên người dùng (từ userId), không chỉ hiển thị UUID.
6. Nếu không có bản ghi lịch sử, hiển thị thông báo "Chưa có thay đổi".

## In Scope

- Bảng danh sách LichSuThayDoi records
- 5 cột: Field, Old Value, New Value, Changed By, Changed At
- Sắp xếp changedAt DESC
- Lọc theo field name
- Indicator "TẠO_MỚI" vs "CẬP_NHẬT"
- Tooltip cho giá trị dài
- Thông báo "Chưa có thay đổi" nếu rỗng

## Out of Scope

- Chỉnh sửa thông tin cảng (thuộc F-071)
- Phê duyệt/từ chối (thuộc F-072)
- Xóa mềm cảng (thuộc F-093)
- Khôi phục giá trị cũ (restore)
- So sánh diff hai phiên bản bất kỳ
- Export lịch sử ra file PDF/Excel
- Phân trang (nếu số bản ghi quá lớn — xem xét trong tương lai)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full | Xem tất cả lịch sử thay đổi của mọi Cảng biển |
| Lãnh đạo | Full + Phê duyệt | Xem tất cả lịch sử thay đổi của mọi Cảng biển |
| Chuyên viên Cục | CRUD | Xem lịch sử thay đổi của Cảng biển Cục mình |
| Chuyên viên Cảng vụ | CRUD | Xem lịch sử thay đổi của Cảng biển Cảng vụ mình |
| Doanh nghiệp cảng | CRUD | Xem lịch sử thay đổi của Cảng biển đơn vị mình |
| Nhân viên vận hành | Read-only | Xem lịch sử thay đổi của Cảng biển được phân quyền |

## Entities

- **LichSuThayDoi**: id (UUID), cangBienId (UUID), loaiThayDoi (enum TẠO_MỚI/CẬP_NHẬT), field (string — tên trường bị thay đổi), oldValue (text — giá trị trước thay đổi), newValue (text — giá trị sau thay đổi), thayDoiBoi (UUID — userId của người thực hiện), changedAt (timestamp)
- **CangBien**: id (UUID), maCang (string, unique, length≤50, immutable after creation), tenCang (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), khaNangTiepNhan (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | LichSuThayDoi được tạo tự động khi tạo mới và cập nhật, ghi nhận tất cả field thay đổi | Lịch sử | F-094, F-013, INT-003 |
| BR-002 | loaiThayDoi = TẠO_MỚI khi tạo mới, CẬP_NHẬT khi sửa — hiển thị indicator trong bảng | Indicator | F-094 |
| BR-003 | changedAt sắp xếp DESC (mới nhất trước), hỗ trợ lọc theo field name | Sắp xếp & Lọc | F-094 |
| BR-004 | oldValue và newValue lưu trữ giá trị text (dạng serialized JSON) | Giá trị | F-094, F-013 |

## Testing Strategy

Giao diện lịch sử Cảng biển được kiểm thử bằng React Testing Library cho việc render đúng bảng với 5 cột, sắp xếp changedAt DESC, indicator "TẠO_MỚI"/"CẬP_NHẬT" trên mỗi hàng, và lọc theo field name. Cypress thực hiện end-to-end test: điều hướng đến lịch sử từ trang chi tiết → xác minh bảng hiển thị đúng các bản ghi LichSuThayDoi → xác minh sắp xếp (mới nhất đầu tiên) → nhập từ khóa lọc field (ví dụ: "tenCang") → xác minh chỉ hiển thị các bản ghi field = "tenCang" → click "Quay lại" → xác minh điều hướng đúng. Negative test: xác minh thông báo "Chưa có thay đổi" khi không có bản ghi lịch sử. Accessibility test: Tab qua bảng, keyboard navigation, tooltip hiển thị đúng giá trị cũ/mới khi hover.
