---
id: F-029
name: Phê duyệt Cảng cạn
slug: phe-duyet-cct
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:07Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Cảng cạn

## Description
Quy trình phê duyệt Cảng cạn (Cảng nội địa) do nhân viên Cảng khởi tạo, nhằm xác nhận thông tin và điều kiện khai thác trước khi đưa Cảng cạn vào sử dụng chính thức trong hệ thống quản lý tài sản KCHTGT.

## Business Intent
Đảm bảo mọi Cảng cạn mới hoặc cập nhật đều trải qua quá trình xem xét, kiểm tra và phê duyệt bởi cấp có thẩm quyền trước khi kích hoạt. Điều này tuân thủ quy định quản lý hạ tầng cảng biển và logistics liên quan, tránh rủi ro vận hành do thiếu thẩm định, đồng thời tạo lập hồ sơ pháp lý đầy đủ cho từng Cảng cạn phục vụ quản lý nhà nước về giao thông vận tải.

## Flow Summary
Nhân viên Cảng khởi tạo yêu cầu phê duyệt Cảng cạn bằng cách điền đầy đủ thông tin kỹ thuật, địa chỉ, diện tích, năng lực xử lý, loại hình dịch vụ và các giấy tờ liên quan (giấy phép thành lập, quyết định chủ trương). Yêu cầu được lưu ở trạng thái "chờ phê duyệt" và gửi đến Trưởng phòng Quản lý Cảng để xem xét. Trưởng phòng thực hiện phê duyệt hoặc từ chối kèm lý do; nếu từ chối, nhân viên Cảng có thể chỉnh sửa và gửi lại. Khi được phê duyệt, trạng thái Cảng cạn chuyển sang "đã kích hoạt" và có thể đưa vào khai thác.

## Acceptance Criteria
1. Nhân viên Cảng có thể khởi tạo yêu cầu phê duyệt Cảng cạn với đầy đủ thông tin bắt buộc
2. Trưởng phòng Quản lý Cảng nhận được thông báo và có thể xem, phê duyệt hoặc từ chối yêu cầu
3. Khi được phê duyệt, trạng thái Cảng cạn tự động chuyển sang "đã kích hoạt"
4. Khi bị từ chối, hệ thống ghi nhận lý do và cho phép nhân viên chỉnh sửa, gửi lại

## In Scope
- Khởi tạo yêu cầu phê duyệt Cảng cạn bởi nhân viên Cảng
- Duyệt hoặc từ chối yêu cầu bởi Trưởng phòng Quản lý Cảng
- Cập nhật trạng thái Cảng cạn (chờ phê duyệt / đã phê duyệt / bị từ chối)
- Gửi thông báo cho các bên liên quan
- Chỉnh sửa và gửi lại yêu cầu khi bị từ chối

## Out of Scope
- Phê duyệt bởi cấp Cục (thuộc quy trình phê duyệt hai cấp của Vùng nước)
- Tự động phê duyệt dựa trên quy tắc
- Tích hợp với hệ thống nghiệp vụ bên ngoài

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Khởi tạo, Chỉnh sửa (khi bị từ chối), Xem |
| Trưởng phòng QL Cảng | Xem, Phê duyệt, Từ chối |
| Quản trị viên | Xem toàn bộ, Quản lý vai trò |

## Entities
- **CangCan**: id, ma, ten, diaChi, toDo, loaiHinh, dienTich, nangLxuLy, dichVu, trangThai, ghiChu, createdAt, updatedAt
- **YeuCauPheDuyet**: id, cangCanId, nguoiTao, ngayTao, trangThai, nguoiPheDuyet, ngayPheDuyet, lyDo, createdAt, updatedAt

## Business Rules
1. Chỉ Cảng cạn có trạng thái "chờ phê duyệt" hoặc "bị từ chối" mới được khởi tạo hoặc gửi lại yêu cầu phê duyệt
2. Thông tin bắt buộc bao gồm: mã, tên, địa chỉ, loại hình và năng lực xử lý
3. Chỉ Trưởng phòng Quản lý Cảng mới có quyền phê duyệt hoặc từ chối yêu cầu
4. Mọi thay đổi trạng thái Cảng cạn đều được ghi nhận vào lịch sử
5. Yêu cầu từ chối phải cung cấp lý do rõ ràng

## Testing Strategy
Kiểm thử đơn vị cho từng bước của luồng phê duyệt, kiểm thử tích hợp giữa dịch vụ Cảng cạn và dịch vụ phê duyệt, kiểm thử giao diện người dùng cho các màn hình khởi tạo, xem và phê duyệt yêu cầu, kiểm thử xác thực quyền truy cập theo vai trò, kiểm thử trường hợp từ chối và gửi lại.

## UI Specification

Giao diện phê duyệt Cảng cạn (CangCan) cho phép người dùng có vai trò Lãnh đạo xem danh sách các cảng cạn đang chờ phê duyệt và thực hiện hành động phê duyệt hoặc từ chối. Trang danh sách chờ phê duyệt gọi API GET /api/v1/cang-can với filter `trangThaiPheDuyet=CHO_PHE_DUYET` để lấy danh sách. Người dùng chọn một cảng cạn cần phê duyệt — hệ thống hiển thị chi tiết cảng cạn với các nút "Phê duyệt" và "Từ chối". Khi bấm "Phê duyệt", hệ thống hiển thị hộp thoại xác nhận → bấm "Xác nhận" → gọi POST /:id/approve → trạng thái chuyển thành DUOC_PHE_DUYET → toast "Phê duyệt thành công". Khi bấm "Từ chối", form nhập lý do hiện ra (tối thiểu 10 ký tự) → xác nhận → gọi POST /:id/reject → trạng thái chuyển thành TU_CHOI → toast "Từ chối thành công". PheDuyetLog được ghi nhận trong cả hai trường hợp.

**Business Intent**

Cung cấp cơ chế phê duyệt Cảng cạn cho Lãnh đạo, đảm bảo mọi cảng cạn mới tạo hoặc được cập nhật đều phải được xem xét và chấp thuận trước khi hoạt động chính thức trong hệ thống, đồng thời ghi nhận đầy đủ lý do phê duyệt/từ chối để phục vụ truy xuất trách nhiệm giải trình.

**Flow Summary**

Người dùng có vai trò Lãnh đạo truy cập trang Danh sách (F-083) và nhấp vào nút "Phê duyệt" trên một dòng có trạng thái CHO_PHE_DUYET, hoặc truy cập trực tiếp trang Phê duyệt (F-087). Hệ thống gọi GET /api/v1/cang-can với filter `trangThaiPheDuyet=CHO_PHE_DUYET` để lấy danh sách chờ phê duyệt. Người dùng chọn một cảng cạn cần phê duyệt — hệ thống hiển thị chi tiết cảng cạn. Người dùng bấm "Phê duyệt" → hộp thoại xác nhận hiện ra → bấm "Xác nhận" → hệ thống gọi POST /:id/approve → trạng thái chuyển thành DUOC_PHE_DUYET → toast "Phê duyệt thành công" → danh sách cập nhật (cảng cạn này biến khỏi danh sách chờ). Người dùng bấm "Từ chối" → form nhập lý do hiện ra (≥10 ký tự) → xác nhận → hệ thống gọi POST /:id/reject → trạng thái chuyển thành TU_CHOI → toast "Từ chối thành công" + hiển thị lý do. PheDuyetLog được ghi nhận trong cả hai trường hợp.

**Acceptance Criteria (UI)**

1. Chỉ người dùng có vai trò Leadership/LanhDaoCuc mới thấy tab "Phê duyệt" hoặc nút "Phê duyệt" trên danh sách — người dùng không có quyền không thấy các yếu tố này.
2. Trang Phê duyệt gọi GET /api/v1/cang-can?filterTrangThaiPheDuyet=CHO_PHE_DUYET, hiển thị danh sách tất cả cảng cạn đang chờ phê duyệt với cột: maCangCan, tenCangCan, diaChi, tinhThanh, createdAt, createdBy.
3. Khi bấm "Phê duyệt" trên một bản ghi, hệ thống hiển thị hộp thoại xác nhận với tiêu đề "Xác nhận phê duyệt" và nội dung "Bạn có chắc chắn muốn phê duyệt cảng cạn [maCangCan]?"; bấm "Xác nhận" gọi POST /:id/approve.
4. Sau khi phê duyệt thành công (POST /:id/approve trả về 200), trạng thái của cảng cạn chuyển thành DUOC_PHE_DUYET, PheDuyetLog được ghi nhận với approvedBy=người dùng hiện tại, approvedAt=thời điểm hiện tại, và toast "Phê duyệt thành công" hiển thị.
5. Khi bấm "Từ chối" trên một bản ghi, hệ thống hiển thị form nhập lý do với trường bắt buộc có validation tối thiểu 10 ký tự; nếu nhập <10 ký tự và bấm "Xác nhận", hệ thống hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự".
6. Sau khi từ chối thành công (POST /:id/reject trả về 200), trạng thái của cảng cạn chuyển thành TU_CHOI, PheDuyetLog được ghi nhận với approvedBy=người dùng hiện tại, approvedAt=thời điểm hiện tại, lyDo=nội dung đã nhập, và toast "Từ chối thành công" hiển thị.
7. Một cảng cạn đã có trạng thái DUOC_PHE_DUYET hoặc TU_CHOI không xuất hiện trong danh sách chờ phê duyệt (không thể phê duyệt lại cùng một yêu cầu).
8. Phê duyệt/Từ chối là một hành động đơn định (atomic) — không thể phê duyệt rồi từ chối cùng một yêu cầu trong cùng một phiên.

**In Scope (UI)**

- Danh sách cảng cạn đang chờ phê duyệt (filter trangThaiPheDuyet=CHO_PHE_DUYET)
- Hiển thị chi tiết cảng cạn cần phê duyệt
- Hành động Phê duyệt → POST /:id/approve → DUOC_PHE_DUYET + PheDuyetLog
- Hành động Từ chối → POST /:id/reject + lý do ≥10 ký tự → TU_CHOI + PheDuyetLog
- Hộp thoại xác nhận trước khi phê duyệt
- Form nhập lý do từ chối với validation ≥10 ký tự
- Toast thông báo kết quả

**Out of Scope (UI)**

- Phê duyệt hàng loạt nhiều cảng cạn cùng lúc
- Tự động phê duyệt theo quy tắc (approval workflow)
- Gửi thông báo email cho người tạo khi phê duyệt/từ chối
- Xem chi tiết PheDuyetLog lịch sử (thuộc F-100)
- Từ chối mà không cần lý do (bắt buộc lý do ≥10 ký tự)

**Roles + Permissions (UI)**

| Role | Level | Notes |
|---|---|---|
| NhanVien | read | Không có quyền phê duyệt; chỉ xem danh sách và chi tiết |
| QuanTriCuc | read | Không có quyền phê duyệt; chỉ xem, chỉnh sửa, xem lịch sử |
| LanhDaoCuc | read, approve | Phê duyệt/Từ chối Cảng cạn; xem danh sách chờ phê duyệt, chi tiết, lịch sử |
| QuanTriHeThong | read, update, delete, approve | Toàn quyền phê duyệt/từ chối Cảng cạn; xem, sửa, xóa, xem lịch sử |

**UI Entities**

| Entity | Fields |
|---|---|
| CangCan | id(UUID), maCangCan(string unique), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(text), trangThaiHoatDong(enum), trangThaiPheDuyet(enum), orgUnitId(UUID), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt, deletedAt(nullable) |
| PheDuyetLog | id(UUID), cangCanId(UUID), action(enum APPROVE/REJECT), approvedBy(UUID), approvedAt(timestamp), lyDo(text), ghiChu(text) |
| ApprovalRequest | action(enum APPROVE/REJECT), reason(text) |

**UI Business Rules**

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-087-01 | Chỉ các cảng cạn có trạng thái trangThaiPheDuyet=CHO_PHE_DUYET mới được hiển thị trong danh sách chờ phê duyệt | F-087 | Spec |
| BR-087-02 | Phê duyệt thành công đặt trangThaiPheDuyet=DUOC_PHE_DUYET và ghi nhận PheDuyetLog với approvedBy, approvedAt | F-087 | Spec |
| BR-087-03 | Từ chối thành công đặt trangThaiPheDuyet=TU_CHOI, ghi nhận PheDuyetLog với approvedBy, approvedAt, lyDo (≥10 ký tự) | F-087 | Spec |
| BR-087-04 | Lý do từ chối là bắt buộc và phải có ít nhất 10 ký tự; hệ thống không cho phép từ chối nếu lý do <10 ký tự | F-087 | Spec |
| BR-087-05 | maCangCan phải là duy nhất trong toàn hệ thống; không cho phép tạo mới hoặc sửa có trùng mã | F-087, F-085, F-086 | Spec |

**Testing Strategy (UI)**

Kiểm thử đơn vị (unit test) tập trung vào component danh sách chờ phê duyệt: filter đúng trạng thái CHO_PHE_DUYET, hiển thị đúng các cột, component hộp thoại xác nhận hiện ra khi bấm "Phê duyệt", component form nhập lý do hiện ra khi bấm "Từ chối" với validation ≥10 ký tự. Kiểm thử tích hợp (integration test): gọi POST /:id/approve cho một cảng cạn CHO_PHE_DUYET, xác nhận phản hồi 200 và trạng thái chuyển thành DUOC_PHE_DUYET; kiểm tra PheDuyetLog được tạo với approvedBy đúng; gọi POST /:id/reject với lý do đủ 10 ký tự, xác nhận trạng thái thành TU_CHOI và PheDuyetLog có lý do; gọi POST /:id/reject với lý do <10 ký tự, xác nhận lỗi validation. Kiểm thử nghiệp vụ: tạo 2 cảng cạn mới (CHO_PHE_DUYET), phê duyệt 1, từ chối 1 — xác nhận danh sách chờ còn 0; thử từ chối với lý do 9 ký tự → từ chối thất bại; thử phê duyệt lại cảng cạn đã DUOC_PHE_DUYET → không tìm thấy trong danh sách chờ. Kiểm thử RBAC: chỉ LanhDaoCuc và QuanTriHeThông thấy tab/actions Phê duyệt; NhanVien và QuanTriCuc không thấy.

## Implementation Status
| Layer | Status | Notes |
|-------|--------|-------|
| Backend (API) | Done | API endpoints fully implemented |
| Frontend (UI) | Pending | UI specs exist in merged feature scope; pending implementation |
