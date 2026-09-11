---
feature-id: F-142
feature-name: "Mẫu B04a/BCTC: Thuyết minh chi tiết số liệu tài sản KCHT"
module-id: M-008
status: in-progress
created: 2026-06-26
last-updated: 2026-09-10
---

# Đặc tả nghiệp vụ: Mẫu B04a/BCTC: Thuyết minh chi tiết số liệu tài sản KCHT

Tham chiếu: `implement_plan.md`, source VMD/HH.CSDL và `../../tech-lead/04-plan.md`. Tài liệu nền BA của M-008 chưa có; các quyết định chuyển đổi được ghi tại phần cập nhật nhóm 1 trong tài liệu kỹ thuật. Trạng thái: đang triển khai, chưa nghiệm thu UAT.

## 1. Mô tả ngắn

Chuyển đổi BCC_157 sang F-142 theo template nguồn.
Dữ liệu chính theo quyết định người dùng: infra_assets và các bảng nghiệp vụ liên quan.
Người dùng xem trước và xuất báo cáo trong phạm vi đơn vị được cấp quyền.

## 2. Trường dữ liệu

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị báo cáo | Không khi tổng hợp | UUID, chọn dạng cây | Không chọn: toàn bộ phạm vi được phép |
| 2 | Kỳ/năm/nội dung/hình thức | Theo báo cáo | Ngày bắt đầu không sau ngày kết thúc | Nguồn 1 chỉ lấy báo cáo đã nhập theo đơn vị/năm; không tự chuyển nguồn khi trống. Nguồn 2 tổng hợp tài sản theo năm depreciation_start_date. |
| 3 | Kết quả | Chỉ đọc | STT; chỉ tiêu; mã số; TSHT hàng hải; tổng cộng. | Đơn vị tiền: tỷ đồng |

Form popup nhập/sửa gồm orgUnitId (UUID bắt buộc), reportYear (1900–9999), nguonDuLieu, 10 mã chỉ tiêu (tối đa 20 ký tự), 10 số liệu (không âm, tối đa 16 chữ số nguyên, 4 thập phân). Bốn chỉ tiêu cuối kỳ/còn lại tự tính ở máy chủ. version bắt buộc khi sửa; không đổi đơn vị/năm/nguồn khi sửa. Form mới chỉ nhập nguồn 1; dữ liệu nhập nguồn 2 cũ vẫn được giữ qua API CRUD.

Ma trận CRUD & Filter: bộ lọc đơn vị/kỳ/nội dung/hình thức có Filter=TRUE, List/Create/Edit=FALSE; các cột kết quả có List/Detail=TRUE, Filter/Create/Edit=FALSE. Riêng F-142, mã chỉ tiêu và 6 số liệu đầu vào có Create/Edit=TRUE; 4 số liệu tự tính có Create/Edit=FALSE; đơn vị/năm/nguồn có Create=TRUE, Edit=FALSE; version là trường kỹ thuật ẩn.

## 3. Trạng thái và phê duyệt

Không có bước phê duyệt báo cáo mới trong nhóm này. Tài sản phải APPROVED (5); hồ sơ xử lý BCC162 phải APPROVED (1). Báo cáo nhập BCC157 giữ trạng thái DRAFT hiện có; không suy diễn rằng đã được phê duyệt.

## 4. Quy tắc và phân quyền riêng

Nguồn 1 chỉ lấy báo cáo đã nhập theo đơn vị/năm; không tự chuyển nguồn khi trống. Nguồn 2 tổng hợp tài sản theo năm depreciation_start_date.

Cuối kỳ = đầu kỳ + tăng - giảm. BCC157: giá trị còn lại = nguyên giá - hao mòn; từ chối kết quả âm khi nhập/sửa. Không điền dữ liệu mẫu khi truy vấn lỗi hoặc thiếu trường nguồn.

| Đối tượng | Xem/xuất | Thêm/sửa/xóa BCC157 |
|---|---|---|
| Tài khoản/nhóm được cấp quyền | `report:read`, theo subtree | Từng quyền `report:create/update/delete`, kiểm tra đơn vị khi ghi |
| Admin Cục | Theo quyền hiệu lực; toàn đơn vị khi có `orgunit:scope_all` | Theo từng quyền thao tác; không suy diễn từ tên nhóm |
| Quản trị hệ thống | Theo cơ chế bypass chung | Theo cơ chế bypass chung |

Admin Cục: metadata nhạy cảm tuân thủ cơ chế phân quyền chung; báo cáo tổng hợp không bổ sung cột người tạo/người sửa. API lịch sử BCC157 hiện dùng quyền đọc và kiểm tra scope, cần đối chiếu chính sách metadata trước UAT.

## 5. Điểm khác biệt so với mẫu chung

| # | Điểm cần khai báo | Khai báo |
|---|---|---|
| 1 | Trạng thái riêng | Không thêm; BCC157 giữ DRAFT cũ |
| 2 | Có bước phê duyệt không | Không |
| 3 | Lọc cha-con / theo đơn vị | orgUnitId, subtree giao với scope hiện tại; ghi BCC157 bắt buộc đơn vị từ request và kiểm tra quyền |
| 4 | Trường chỉ hiện trong điều kiện nào | Bộ lọc theo từng mã; nguồn dữ liệu chỉ BCC157, hình thức xử lý chỉ BCC162 |
| 5 | Quyền riêng | report:read; CRUD BCC157 theo create/update/delete |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Preview theo cột template; BCC157 nhập/sửa popup, token và chọn đơn vị dạng cây theo convention |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/reports/preview` | reportCode F-142 hoặc BCC_157 | `report:read` |
| POST | `/api/v1/reports/export` | Cùng bộ lọc preview; EXCEL/PDF/WORD (DOCX ảnh trang) | `report:read` |
| GET/POST | `/api/v1/bcc157` | Tìm kiếm / tạo | `report:read` / `report:create` |
| GET/PUT/DELETE | `/api/v1/bcc157/{id}` | Xem / sửa / xóa | `report:read` / `report:update` / `report:delete` |
| GET | `/api/v1/bcc157/{id}/history` | Lịch sử | `report:read` |

## 7. Phần kỹ thuật — cấu trúc bảng

Nguồn: `bcc157_report hoặc infra_assets`. Giữ bcc157_report; 🔴 version BIGINT NOT NULL DEFAULT 0 qua V20260910103000__add_bcc157_version.sql. Lịch sử ghi infrastructure_history với ref_type REPORT_BCC157 (nối cuối enum, không đổi ordinal cũ). Không thêm bảng lịch sử riêng.

Đọc giới hạn và mục chưa nghiệm thu tại `../../tech-lead/04-plan.md`; không xem brief này là xác nhận hoàn thành.
