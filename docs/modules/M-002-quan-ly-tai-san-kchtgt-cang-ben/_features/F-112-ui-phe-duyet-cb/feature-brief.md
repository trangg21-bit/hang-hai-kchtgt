---
id: F-112
name: "Phe duyet Cang Bien"
slug: ui-phe-duyet-cb
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T07:50:00Z"
last-updated: "2026-07-01T07:50:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phe duyet Cang Bien

## Description

Tính năng Phê duyệt Cảng biển cung cấp giao diện dành riêng cho người dùng có vai trò Lãnh đạo/Phê duyệt để xem, duyệt hoặc từ chối các cảng biển đang trong trạng thái chờ phê duyệt (trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT). Trang bao gồm hai phần: (1) Bảng danh sách các cảng biển chờ duyệt, hiển thị maCang, tenCang, tinhThanhPho, dienTich, khaNangTiepNhan, ngày tạo — với tùy chọn lọc theo tỉnh/thành phố và tìm kiếm theo mã/tên; (2) Trang chi tiết phê duyệt cho từng cảng biển, hiển thị đầy đủ thông tin CangBien (tương tự F-109) cùng các nút "Phê duyệt" và "Từ chối". Khi click nút "Phê duyệt", hệ thống hiển thị hộp thoại xác nhận (confirmation dialog) có nút "Xác nhận" và "Hủy"; sau khi xác nhận, gọi API POST /api/v1/cang-bien/:id/approve và chuyển trạng thái thành ĐƯỢC_PHÊ_DUYỆT kèm tạo bản ghi PheDuyetLog. Khi click nút "Từ chối", hệ thống hiển thị form nhập lý do từ chối (textfield, yêu cầu tối thiểu 10 ký tự) — sau khi xác nhận, gọi API POST /api/v1/cang-bien/:id/reject với lý do, chuyển trạng thái thành TỪ_CHỐI kèm tạo bản ghi PheDuyetLog.

## Business Intent

Cho phép người dùng có thẩm quyền phê duyệt rà soát và quyết định chính thức về việc chấp thuận hoặc từ chối một cảng biển mới được đăng ký, đảm bảo mọi thông tin đăng ký đều trải qua quy trình kiểm tra trước khi đi vào hoạt động chính thức. Điều này đảm bảo tính toàn vẹn và chính xác của dữ liệu cảng biển trong hệ thống.

## Flow Summary

Người dùng có quyền phê duyệt (Lãnh đạo) truy cập trang Phê duyệt Cảng biển từ menu quản lý tài sản cảng biển. Trang hiển thị danh sách cảng biển có trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT với các cột: mã cảng, tên cảng, tỉnh/thành phố, diện tích, khả năng tiếp nhận, ngày tạo. Người dùng có thể lọc theo tỉnh/thành phố hoặc tìm kiếm theo mã/tên. Người dùng click vào một cảng biển trong danh sách để xem chi tiết và quyết định. Khi đã sẵn sàng phê duyệt, người dùng click nút "Phê duyệt" → hộp thoại xác nhận xuất hiện → click "Xác nhận" → hệ thống gọi POST /api/v1/cang-bien/:id/approve → trạng thái chuyển thành ĐƯỢC_PHÊ_DUYỆT, bản ghi PheDuyetLog được tạo, toast "Đã phê duyệt thành công" xuất hiện, cảng biển biến mất khỏi danh sách chờ duyệt. Khi từ chối, người dùng click nút "Từ chối" → form nhập lý do (≥10 ký tự) → xác nhận → gọi POST /api/v1/cang-bien/:id/reject → trạng thái thành TỪ_CHỐI, PheDuyetLog được tạo, toast "Đã từ chối" xuất hiện.

## Acceptance Criteria

1. Trang hiển thị danh sách cảng biển có trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT, các cảng biển đã được phê duyệt (ĐƯỢC_PHÊ_DUYỆT) hoặc bị từ chối (TỪ_CHỐI) không xuất hiện trong danh sách này.
2. Người dùng không có quyền phê duyệt không nhìn thấy tab hoặc nút "Phê duyệt" — giao diện chặn quyền truy cập trang Phê duyệt.
3. Khi click nút "Phê duyệt", hộp thoại xác nhận xuất hiện với tiêu đề "Xác nhận phê duyệt {tenCang}", mô tả "Bạn có chắc chắn muốn phê duyệt cảng biển này?", nút "Hủy" và "Xác nhận".
4. Sau khi click "Xác nhận" trong hộp thoại phê duyệt, hệ thống gọi POST /api/v1/cang-bien/:id/approve — trạng thái chuyển thành ĐƯỢC_PHÊ_DUYỆT, bản ghi PheDuyetLog được tạo, toast "Đã phê duyệt thành công" xuất hiện, cảng biển biến khỏi danh sách chờ duyệt.
5. Khi click nút "Từ chối", form nhập lý do từ chối xuất hiện — trường lý do yêu cầu tối thiểu 10 ký tự, nếu nhập ít hơn 10 ký tự hệ thống hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự" và không cho phép submit.
6. Sau khi submit lý do từ chối hợp lệ, hệ thống gọi POST /api/v1/cang-bien/:id/reject — trạng thái chuyển thành TỪ_CHỐI, bản ghi PheDuyetLog được tạo, toast "Đã từ chối" xuất hiện.
7. Nút "Phê duyệt" và "Từ chối" chỉ hiển thị cho cảng biển có trạng thái CHỜ_PHÊ_DUYỆT; các cảng biển đã ĐƯỢC_PHÊ_DUYỆT hoặc TỪ_CHỐI không hiển thị các nút này.
8. Click "Hủy" trong hộp thoại xác nhận đóng hộp thoại mà không thực hiện bất kỳ hành động nào.

## In Scope

- Bảng danh sách cảng biển chờ phê duyệt (status = CHỜ_PHÊ_DUYỆT)
- Lọc danh sách theo tỉnh/thành phố và tìm kiếm theo mã/tên
- Hộp thoại xác nhận phê duyệt (confirm dialog)
- API POST /:id/approve → trạng thái ĐƯỢC_PHÊ_DUYỆT + PheDuyetLog
- Form nhập lý do từ chối (≥10 ký tự)
- API POST /:id/reject → trạng thái TỪ_CHỐI + PheDuyetLog
- Toast thông báo sau mỗi hành động
- RBAC chặn người dùng không có quyền approve

## Out of Scope

- Tạo mới cảng biển (thuộc F-110)
- Chỉnh sửa thông tin cảng biển (thuộc F-111)
- Xóa cảng biển (thuộc F-113)
- Xem lịch sử thay đổi (thuộc F-114)
- Batch approve/reject nhiều cảng biển cùng lúc
- Email thông báo khi phê duyệt/từ chối

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Lãnh đạo (Leadership) | Read + Approve | Xem danh sách chờ duyệt, phê duyệt/từ chối tất cả cảng biển |
| Admin | Read + Approve | Xem danh sách chờ duyệt, phê duyệt/từ chối tất cả cảng biển |
| Chuyên viên Cục | Read | Chỉ xem danh sách chờ duyệt, không có quyền phê duyệt hoặc từ chối |
| Chuyên viên Cảng vụ | Read | Chỉ xem danh sách chờ duyệt, không có quyền phê duyệt hoặc từ chối |
| Doanh nghiệp cảng | Read | Chỉ xem danh sách chờ duyệt, không có quyền phê duyệt hoặc từ chối |
| Nhân viên vận hành | Read only | Chỉ xem, không có quyền phê duyệt hoặc từ chối |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, length≤50, immutable after creation), tenCang (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), khaNangTiepNhan (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable)
- **PheDuyetLog**: id (UUID), cangBienId (UUID), nguoiPheDuyet (UUID), hanhDong (enum: APPROVE, REJECT), lyDo (text), pheDuyetThoiGian (datetime), createdAt
- **LichSuThayDoi**: id (UUID), cangBienId (UUID), loaiThayDoi (enum CẬP_NHẬT), field (string), oldValue (text), newValue (text), thayDoiBoi (UUID), changedAt

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Chỉ cảng biển có trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT mới được phê duyệt hoặc từ chối | POST /approve, POST /reject | State machine |
| BR-002 | Phê duyệt thành công chuyển trạng thái thành ĐƯỢC_PHÊ_DUYỆT và tạo bản ghi PheDuyetLog(hanhDong=APPROVE) | POST /approve | F-112 |
| BR-003 | Từ chối yêu cầu lý do tối thiểu 10 ký tự — chuyển trạng thái thành TỪ_CHỐI và tạo bản ghi PheDuyetLog(hanhDong=REJECT) | POST /reject | F-112 |
| BR-004 | Chỉ người dùng có quyền approve (Lãnh đạo/Admin) mới thấy và thực hiện được hành động phê duyệt/từ chối | Display, Action | RBAC |
| BR-005 | Không cho phép approve/reject trên cảng biển đã được phê duyệt hoặc bị từ chối (state machine enforcement) | Tất cả | State machine |

## Testing Strategy

Kiểm thử đơn vị (unit test) xác nhận backend: API POST /:id/approve chuyển trạng thái thành ĐƯỢC_PHÊ_DUYỆT và tạo PheDuyetLog(hanhDong=APPROVE); API POST /:id/reject validate lý do ≥10 ký tự, chuyển trạng thái thành TỪ_CHỐI và tạo PheDuyetLog(hanhDong=REJECT). Kiểm thử tích hợp xác nhận trạng thái không cho phép approve/reject trên cảng biển đã ĐƯỢC_PHÊ_DUYỆT hoặc TỪ_CHỐI (state machine enforcement). Kiểm thử E2E/UI xác minh: danh sách chỉ hiển thị cảng biển có status = CHỜ_PHÊ_DUYỆT, người dùng không có quyền approve không thấy nút Phê duyệt/Từ chối, hộp thoại xác nhận xuất hiện đúng khi click Phê duyệt với nút Hủy/Xác nhận, sau approve trạng thái chuyển thành ĐƯỢC_PHÊ_DUYỆT và toast xuất hiện, form lý do từ chối yêu cầu ≥10 ký tự và hiển thị lỗi khi ít hơn 10 ký tự, sau reject trạng thái chuyển thành TỪ_CHỐI, PheDuyetLog được tạo đúng, và cảng biển biến khỏi danh sách chờ duyệt sau khi được phê duyệt hoặc từ chối.
