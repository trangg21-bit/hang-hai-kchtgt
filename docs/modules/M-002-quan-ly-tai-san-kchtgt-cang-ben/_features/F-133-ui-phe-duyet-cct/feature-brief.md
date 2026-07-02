---
id: F-133
name: "Phe duyet Cang Can"
slug: ui-phe-duyet-cct
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T07:51:08Z"
last-updated: "2026-07-01T07:51:08Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phe duyet Cang Can

## Description

Giao diện phê duyệt Cảng cạn (CangCan) cho phép Lãnh đạo xem danh sách các cảng cạn đang chờ phê duyệt (trangThaiPheDuyet=CHỜ_PHÊ_DUYỆT) và thực hiện hành động Phê duyệt hoặc Từ chối. Trang Phê duyệt hiển thị danh sách các bản ghi với các cột: mã cảng cạn (maCangCan), tên cảng cạn (tenCangCan), tỉnh/thành phố (tinhThanhPho), diện tích (dienTich), ngày tạo (createdAt), người tạo (createdBy). Người dùng có thể lọc theo tỉnh/thành (tinhThanhPho) và sắp xếp theo ngày tạo. Khi chọn một bản ghi, chi tiết cảng cạn được hiển thị kèm hai hành động: "Phê duyệt" và "Từ chối". Khi bấm "Phê duyệt", hệ thống hiển thị hộp thoại xác nhận — sau khi người dùng xác nhận, hệ thống gọi POST /:id/approve, cập nhật trạng thái thành ĐƯỢC_PHÊ_DUYỆT, ghi nhận PheDuyetLog và hiển thị toast thành công. Khi bấm "Từ chối", hệ thống yêu cầu nhập lý do từ chối (ít nhất 10 ký tự) — sau khi nhập và xác nhận, hệ thống gọi POST /:id/reject, cập nhật trạng thái thành TỪ_CHỐI, ghi nhận PheDuyetLog với lý do và hiển thị toast thành công.

## Business Intent

Cung cấp cơ chế phê duyệt Cảng cạn cho Lãnh đạo, đảm bảo mọi cảng cạn mới tạo hoặc được cập nhật đều phải được xem xét và chấp thuận trước khi hoạt động chính thức trong hệ thống, đồng thời ghi nhận đầy đủ lý do phê duyệt/từ chối để phục vụ truy xuất trách nhiệm giải trình.

## Flow Summary

Người dùng có vai trò Lãnh đạo truy cập trang Danh sách (F-129) và nhấp vào nút "Phê duyệt" trên một dòng có trạng thái CHỜ_PHÊ_DUYỆT, hoặc truy cập trực tiếp trang Phê duyệt (F-133). Hệ thống gọi GET /api/v1/cang-can với filter trangThaiPheDuyet=CHỜ_PHÊ_DUYỆT để lấy danh sách chờ phê duyệt. Người dùng chọn một cảng cạn cần phê duyệt — hệ thống hiển thị chi tiết cảng cạn. Người dùng bấm "Phê duyệt" → hộp thoại xác nhận hiện ra → bấm "Xác nhận" → hệ thống gọi POST /:id/approve → trạng thái chuyển thành ĐƯỢC_PHÊ_DUYỆT → toast "Phê duyệt thành công" → danh sách cập nhật (cảng cạn này biến khỏi danh sách chờ). Người dùng bấm "Từ chối" → form nhập lý do hiện ra (≥10 ký tự) → xác nhận → hệ thống gọi POST /:id/reject → trạng thái chuyển thành TỪ_CHỐI → toast "Từ chối thành công" + hiển thị lý do. PheDuyetLog được ghi nhận trong cả hai trường hợp.

## Acceptance Criteria

1. Chỉ người dùng có vai trò LanhDaoCuc hoặc Admin mới thấy tab "Phê duyệt" hoặc nút "Phê duyệt" trên danh sách — người dùng không có quyền không thấy các yếu tố này.
2. Trang Phê duyệt gọi GET /api/v1/cang-can?filterTrangThaiPheDuyet=CHỜ_PHÊ_DUYỆT, hiển thị danh sách tất cả cảng cạn đang chờ phê duyệt với cột: maCangCan, tenCangCan, tinhThanhPho, dienTich, createdAt, createdBy.
3. Khi bấm "Phê duyệt" trên một bản ghi, hệ thống hiển thị hộp thoại xác nhận với tiêu đề "Xác nhận phê duyệt" và nội dung "Bạn có chắc chắn muốn phê duyệt cảng cạn [maCangCan]?"; bấm "Xác nhận" gọi POST /:id/approve.
4. Sau khi phê duyệt thành công (POST /:id/approve trả về 200), trạng thái của cảng cạn chuyển thành ĐƯỢC_PHÊ_DUYỆT, PheDuyetLog được ghi nhận với approvedBy=người dùng hiện tại, approvedAt=thời điểm hiện tại, và toast "Phê duyệt thành công" hiển thị.
5. Khi bấm "Từ chối" trên một bản ghi, hệ thống hiển thị form nhập lý do với trường bắt buộc có validation tối thiểu 10 ký tự; nếu nhập <10 ký tự và bấm "Xác nhận", hệ thống hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự".
6. Sau khi từ chối thành công (POST /:id/reject trả về 200), trạng thái của cảng cạn chuyển thành TỪ_CHỐI, PheDuyetLog được ghi nhận với approvedBy=người dùng hiện tại, approvedAt=thời điểm hiện tại, lyDo=nội dung đã nhập, và toast "Từ chối thành công" hiển thị.
7. Một cảng cạn đã có trạng thái ĐƯỢC_PHÊ_DUYỆT hoặc TỪ_CHỐI không xuất hiện trong danh sách chờ phê duyệt (không thể phê duyệt lại cùng một yêu cầu).
8. Phê duyệt/Từ chối là một hành động đơn định (atomic) — không thể phê duyệt rồi từ chối cùng một yêu cầu trong cùng một phiên.

## In Scope

- Danh sách cảng cạn đang chờ phê duyệt (filter trangThaiPheDuyet=CHỜ_PHÊ_DUYỆT)
- Hiển thị chi tiết cảng cạn cần phê duyệt
- Hành động Phê duyệt → POST /:id/approve → ĐƯỢC_PHÊ_DUYỆT + PheDuyetLog
- Hành động Từ chối → POST /:id/reject + lý do ≥10 ký tự → TỪ_CHỐI + PheDuyetLog
- Hộp thoại xác nhận trước khi phê duyệt
- Form nhập lý do từ chối với validation ≥10 ký tự
- Toast thông báo kết quả

## Out of Scope

- Phê duyệt hàng loạt nhiều cảng cạn cùng lúc
- Tự động phê duyệt theo quy tắc (approval workflow)
- Gửi thông báo email cho người tạo khi phê duyệt/từ chối
- Xem chi tiết PheDuyetLog lịch sử (thuộc F-135)
- Từ chối mà không cần lý do (bắt buộc lý do ≥10 ký tự)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| NhanVienCangBien (Nhân viên cảng) | Read | Không có quyền phê duyệt; chỉ xem danh sách và chi tiết |
| QuanTriCangBien (Quản lý cảng biển) | Read/Write | Không có quyền phê duyệt; chỉ xem, chỉnh sửa, xem lịch sử |
| LanhDaoCuc | Read, Approve | Phê duyệt/Từ chối Cảng cạn; xem danh sách chờ phê duyệt, chi tiết, lịch sử |
| Admin | Read, Write, Delete, Approve | Toàn quyền phê duyệt/từ chối Cảng cạn; xem, sửa, xóa, xem lịch sử |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id (UUID), maCangCan (string, unique, length≤50), tenCangCan (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), congSuatTEU (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (nullable) |
| PheDuyetLog | id (UUID), cangCanId (UUID), action (enum APPROVE/REJECT), approvedBy (UUID), approvedAt (timestamp), lyDo (string) |
| ApprovalRequest | action (enum APPROVE/REJECT), reason (string) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-133-01 | Chỉ các cảng cạn có trạng thái trangThaiPheDuyet=CHỜ_PHÊ_DUYỆT mới được hiển thị trong danh sách chờ phê duyệt | F-133 | Spec |
| BR-133-02 | Phê duyệt thành công đặt trangThaiPheDuyet=ĐƯỢC_PHÊ_DUYỆT và ghi nhận PheDuyetLog với approvedBy, approvedAt | F-133 | Spec |
| BR-133-03 | Từ chối thành công đặt trangThaiPheDuyet=TỪ_CHỐI, ghi nhận PheDuyetLog với approvedBy, approvedAt, lyDo (≥10 ký tự) | F-133 | Spec |
| BR-133-04 | Lý do từ chối là bắt buộc và phải có ít nhất 10 ký tự; hệ thống không cho phép từ chối nếu lý do <10 ký tự | F-133 | Spec |
| BR-133-05 | maCangCan phải là duy nhất trong toàn hệ thống; không cho phép tạo mới hoặc sửa có trùng mã | F-133, F-131, F-132 | Spec |

## Testing Strategy

Kiểm thử đơn vị (unit test) tập trung vào component danh sách chờ phê duyệt: filter đúng trạng thái CHỜ_PHÊ_DUYỆT, hiển thị đúng các cột, component hộp thoại xác nhận hiện ra khi bấm "Phê duyệt", component form nhập lý do hiện ra khi bấm "Từ chối" với validation ≥10 ký tự. Kiểm thử tích hợp (integration test): gọi POST /:id/approve cho một cảng cạn CHỜ_PHÊ_DUYỆT, xác nhận phản hồi 200 và trạng thái chuyển thành ĐƯỢC_PHÊ_DUYỆT; kiểm tra PheDuyetLog được tạo với approvedBy đúng; gọi POST /:id/reject với lý do đủ 10 ký tự, xác nhận trạng thái thành TỪ_CHỐI và PheDuyetLog có lý do; gọi POST /:id/reject với lý do <10 ký tự, xác nhận lỗi validation. Kiểm thử nghiệp vụ: tạo 2 cảng cạn mới (CHỜ_PHÊ_DUYỆT), phê duyệt 1, từ chối 1 — xác nhận danh sách chờ còn 0; thử từ chối với lý do 9 ký tự → từ chối thất bại; thử phê duyệt lại cảng cạn đã ĐƯỢC_PHÊ_DUYỆT → không tìm thấy trong danh sách chờ. Kiểm thử RBAC: chỉ LanhDaoCuc và Admin thấy tab/actions Phê duyệt; NhanVienCangBien và QuanTriCangBien không thấy.
