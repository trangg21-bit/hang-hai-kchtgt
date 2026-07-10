---
id: F-096
name: "Lịch sử Bến cảng"
slug: ui-ql-bc-lich-su
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:09:08Z"
last-updated: "2026-07-01T04:09:08Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Lịch sử Bến cảng

## Description

Tính năng "Lịch sử Bến cảng" (F-096) cung cấp giao diện xem lịch sử thay đổi chi tiết của một Bến cảng cụ thể, hiển thị toàn bộ các bản ghi từ bảng LichSuThayDoi (hoặc PheDuyetLog cho các thao tác phê duyệt). Bảng danh sách các sự kiện thay đổi bao gồm các cột: field (tên trường bị thay đổi), oldValue (giá trị cũ), newValue (giá trị mới), changedBy (người thực hiện thay đổi — hiển thị tên người dùng), changedAt (thời gian thay đổi — định dạng dd/MM/yyyy HH:mm:ss), loại sự kiện (Tạo mới / Cập nhật / Phê duyệt / Từ chối). Dữ liệu được sắp xếp giảm dần theo changedAt (mới nhất trên cùng), hỗ trợ phân trang, và cho phép lọc theo loại sự kiện hoặc theo tên trường (field filter dropdown). Mỗi bản ghi cho biết đây là lần "Tạo mới" (khi BenCang được tạo lần đầu), "Cập nhật" (khi BenCang được chỉnh sửa), "Phê duyệt" (khi BenCang được phê duyệt bởi Leader), hoặc "Từ chối" (khi BenCang bị từ chối bởi Leader). Đối với các lần "Cập nhật", bảng hiển thị chi tiết từng trường bị thay đổi với oldValue và newValue. Đối với các lần "Phê duyệt"/"Từ chối", bảng hiển thị action (APPROVE/REJECT), pheDuyetBy (người phê duyệt), và lyDo (lý do từ chối nếu có). Người dùng truy cập màn hình này qua nút "Lịch sử" trên màn hình danh sách (F-073) hoặc chi tiết (F-074), truyền benCangId để lọc lịch sử.

## Business Intent

Tạo lập khả năng追溯 toàn bộ lịch sử thay đổi và phê duyệt của từng Bến cảng, phục vụ mục đích kiểm toán, phân tích nguyên nhân sự cố, và xác minh các thay đổi được thực hiện bởi ai, khi nào, và nội dung thay đổi — đảm bảo tính minh bạch và trách nhiệm giải trình trong quản lý tài sản cảng biển.

## Flow Summary

Người dùng click nút "Lịch sử" trên màn hình danh sách (F-073) hoặc màn hình chi tiết (F-074) của một BenCang → hệ thống mở màn hình lịch sử với benCangId được truyền từ điểm xuất phát → gọi `GET /api/v1/ben-cang/:id/history` để lấy toàn bộ LichSuThayDoi và PheDuyetLog liên quan → hiển thị bảng danh sách các sự kiện thay đổi với các cột: Field, Old Value, New Value, Changed By, Changed At, Event Type (Tạo mới/Cập nhật/Phê duyệt/Từ chối). Bảng được sắp xếp giảm dần theo changedAt, hỗ trợ phân trang với tùy chọn 20 hoặc 50 mục mỗi trang. Người dùng có thể dùng dropdown filter để lọc theo loại sự kiện (Tất cả / Tạo mới / Cập nhật / Phê duyệt / Từ chối) hoặc theo tên trường (Field filter). Khi filter được chọn, bảng được render lại với kết quả tương ứng. Mỗi hàng cho biết chi tiết oldValue và newValue (cho loại "Cập nhật") hoặc action và lý do (cho loại "Phê duyệt"/"Từ chối"). Nút "Quay lại" để trở về danh sách hoặc chi tiết.

## Acceptance Criteria

1. Màn hình hiển thị danh sách lịch sử thay đổi của BenCang khi gọi `GET /api/v1/ben-cang/:id/history` thành công.
2. Bảng hiển thị các cột: Field (hoặc Event Type cho phê duyệt/từ chối), Old Value, New Value (hoặc Action/Lý do cho phê duyệt/từ chối), Changed By (tên người dùng), Changed At (định dạng dd/MM/yyyy HH:mm:ss).
3. Dữ liệu được sắp xếp giảm dần theo changedAt (sự kiện mới nhất trên cùng).
4. Hỗ trợ phân trang với tùy chọn 20 hoặc 50 mục mỗi trang, mặc định 20 mục.
5. Dropdown filter loại sự kiện hiển thị các tùy chọn: "Tất cả", "Tạo mới", "Cập nhật", "Phê duyệt", "Từ chối"; khi chọn, bảng được lọc tương ứng.
6. Dropdown filter theo trường (Field filter) hiển thị danh sách các trường từng bị thay đổi; khi chọn một trường, bảng chỉ hiển thị các bản ghi liên quan đến trường đó.
7. Đối với sự kiện "Tạo mới", bảng hiển thị event_type=TaoMoi với các trường được populate bằng giá trị ban đầu (new value), oldValue = null.
8. Đối với sự kiện "Cập nhật", bảng hiển thị event_type=CapNhat với field, oldValue, newValue tương ứng của từng thay đổi.
9. Đối với sự kiện "Phê duyệt", bảng hiển thị event_type=PheDuyet với action=APPROVE, pheDuyetBy, pheDuyetAt.
10. Đối với sự kiện "Từ chối", bảng hiển thị event_type=TuChoi với action=REJECT, pheDuyetBy, pheDuyetAt, lyDo.
11. Nút "Quay lại" trở về danh sách (F-073) hoặc chi tiết (F-074) tùy điểm xuất phát.
12. Toast thông báo lỗi "Không thể tải lịch sử: [error message]" được hiển thị khi API trả về HTTP 4xx/5xx.

## In Scope

- Bảng danh sách LichSuThayDoi và PheDuyetLog của BenCang.
- Các cột: Field, Old Value, New Value, Changed By, Changed At, Event Type.
- Sắp xếp giảm dần theo changedAt.
- Phân trang 20/50 mục mỗi trang.
- Dropdown filter loại sự kiện (Tạo mới/Cập nhật/Phê duyệt/Từ chối).
- Dropdown filter theo trường (Field filter).
- Hiển thị detail oldValue/newValue cho "Cập nhật".
- Hiển thị action/lyDo cho "Phê duyệt"/"Từ chối".
- Nút "Quay lại" về danh sách hoặc chi tiết.
- Loading state và error handling khi fetch lịch sử.

## Out of Scope

- Tạo mới Bến cảng (thuộc F-075).
- Chỉnh sửa Bến cảng (thuộc F-076).
- Phê duyệt / Từ chối Bến cảng (thuộc F-077).
- Xóa Bến cảng (thuộc F-095).
- Export lịch sử ra Excel/PDF.
- So sánh trực tiếp 2 phiên bản của Bến cảng.
- Chỉnh sửa hoặc xóa bản ghi lịch sử.
- So sánh lịch sử giữa 2 BenCang khác nhau.
- Thông báo khi có thay đổi mới (notification).

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien | Full access | Được xem toàn bộ lịch sử thay đổi của tất cả Bến cảng trong hệ thống. Quyền `bencang:read`. |
| QuanLyDonVi | Read | Được xem lịch sử thay đổi của Bến cảng thuộc đơn vị mình; không có quyền xem Bến cảng của đơn vị khác. |
| NhanVien | Read only | Được xem lịch sử thay đổi của Bến cảng thuộc đơn vị mình. |
| ThanhVienPheDuyet | Read only | Được xem lịch sử thay đổi để phục vụ công tác phê duyệt. |

## Entities

| Entity | Fields |
|---|---|
| BenCang | id (UUID), maBen (string, unique, length≤50), tenBen (string, length≤255), cangBienId (UUID, parent ref), tuyenDuongThuy (string, length≤255), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), chieuDai (BigDecimal, precision 15 scale 2), chieuRong (BigDecimal, precision 15 scale 2), loaiBen (string, length≤100), doSauLuong (BigDecimal, precision 10 scale 2), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string, length≤50: CHO_PHE_DUYET/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime) — được join qua benCangId để lấy thông tin chi tiết |
| LichSuThayDoi | id (UUID), benCangId (UUID FK → BenCang), fieldChanged (string — tên trường bị thay đổi), oldValue (text — giá trị cũ trước khi thay đổi), newValue (text — giá trị mới sau khi thay đổi), changedBy (string → user — tên người tạo thay đổi), changedAt (LocalDateTime — thời gian thay đổi) — tạo tự động khi tạo mới hoặc cập nhật |
| PheDuyetLog | id (UUID), benCangId (UUID FK → BenCang), pheDuyetAction (string: APPROVE/REJECT), pheDuyetBy (string → user — tên người phê duyệt), pheDuyetAt (LocalDateTime — thời gian phê duyệt/từ chối), lyDo (text — lý do từ chối, chỉ có khi REJECT) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-096-01 | Lịch sử thay đổi bao gồm cả LichSuThayDoi (tạo mới, cập nhật) và PheDuyetLog (phê duyệt, từ chối) của BenCang. | Read | INT-003 |
| BR-096-02 | Dữ liệu được sắp xếp giảm dần theo changedAt (mới nhất trên cùng). | Display | Sort rule |
| BR-096-03 | LichSuThayDoi được tạo tự động mỗi lần BenCang được tạo mới hoặc cập nhật (ghi lại fieldChanged, oldValue, newValue, changedBy, changedAt). | Create/Update | INT-003 |
| BR-096-04 | PheDuyetLog được tạo tự động mỗi lần BenCang được phê duyệt hoặc từ chối (ghi lại action, pheDuyetBy, pheDuyetAt, lyDo). | Approve/Reject | F-017 backend |
| BR-096-05 | Người dùng chỉ xem được lịch sử của BenCang thuộc đơn vị mình hoặc tất cả (nếu là QuanTriCangBien). | RBAC | Auth |

## Testing Strategy

Kiểm thử chấp nhận tập trung vào các kịch bản: (1) fetch lịch sử BenCang thành công, bảng hiển thị đúng cấu trúc với tất cả các cột (Field, Old Value, New Value, Changed By, Changed At, Event Type); (2) dữ liệu được sắp xếp giảm dần theo changedAt (sự kiện mới nhất trên cùng); (3) phân trang 20/50 mục hoạt động đúng, số lượng mục hiển thị đúng; (4) dropdown filter loại sự kiện: "Tất cả" hiển thị toàn bộ, "Tạo mới" chỉ hiển thị bản ghi eventType=TAO_MOI, "Cập nhật" chỉ hiển thị CAP_NHAT, "Phê duyệt" chỉ hiển thị APPROVE, "Từ chối" chỉ hiển thị REJECT; (5) dropdown filter theo trường: chọn một trường → bảng chỉ hiển thị bản ghi có fieldChanged = trường đó; (6) sự kiện "Tạo mới" hiển thị newValue với giá trị ban đầu, oldValue = null; (7) sự kiện "Cập nhật" hiển thị đúng field, oldValue, newValue của từng thay đổi; (8) sự kiện "Phê duyệt" hiển thị action=APPROVE, pheDuyetBy, pheDuyetAt; (9) sự kiện "Từ chối" hiển thị action=REJECT, pheDuyetBy, pheDuyetAt, lyDo (≥10 ký tự); (10) nút "Quay lại" trở về đúng màn hình danh sách hoặc chi tiết; (11) xử lý lỗi API (404, 500) hiển thị toast thông báo phù hợp.
