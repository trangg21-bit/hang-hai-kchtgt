---
feature-id: F-146
feature-name: "Mẫu số 05: Báo cáo tình hình khai thác tài sản KCHT hàng hải"
module-id: M-008
status: in-progress
created: 2026-06-26
last-updated: 2026-09-10
---

# Đặc tả nghiệp vụ: Mẫu số 05: Báo cáo tình hình khai thác tài sản KCHT hàng hải

Tham chiếu: `implement_plan.md`, source VMD/HH.CSDL và `../../tech-lead/04-plan.md`. Tài liệu nền BA của M-008 chưa có; các quyết định chuyển đổi được ghi tại phần cập nhật nhóm 1 trong tài liệu kỹ thuật. Trạng thái: đang triển khai, chưa nghiệm thu UAT.

## 1. Mô tả ngắn

Chuyển đổi BCC_161 sang F-146 theo template nguồn.
Dữ liệu chính theo quyết định người dùng: infra_assets và các bảng nghiệp vụ liên quan.
Người dùng xem trước và xuất báo cáo trong phạm vi đơn vị được cấp quyền.

## 2. Trường dữ liệu

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị báo cáo | Không khi tổng hợp | UUID, chọn dạng cây | Không chọn: toàn bộ phạm vi được phép |
| 2 | Kỳ/năm/nội dung/hình thức | Theo báo cáo | Ngày bắt đầu không sau ngày kết thúc | Lọc ngày ghi nhận khai thác; cộng các khoản theo tài sản, lấy hạn khai thác lớn nhất và danh sách đơn vị không trùng. Khối theo thứ tự Sử dụng, Cho thuê, Chuyển nhượng. |
| 3 | Kết quả | Chỉ đọc | STT; danh mục; đơn vị tính; số lượng; đất/sàn; nguyên giá/còn lại; thời hạn; đơn vị khai thác; thu/chi/nộp ngân sách/tiền dự án; ghi chú. | Đơn vị tiền: nghìn đồng |

Không có form nhập/sửa; chỉ bộ lọc và kết quả tổng hợp.

Ma trận CRUD & Filter: bộ lọc đơn vị/kỳ/nội dung/hình thức có Filter=TRUE, List/Create/Edit=FALSE; các cột kết quả có List/Detail=TRUE, Filter/Create/Edit=FALSE. Riêng F-142, mã chỉ tiêu và 6 số liệu đầu vào có Create/Edit=TRUE; 4 số liệu tự tính có Create/Edit=FALSE; đơn vị/năm/nguồn có Create=TRUE, Edit=FALSE; version là trường kỹ thuật ẩn.

## 3. Trạng thái và phê duyệt

Không có bước phê duyệt báo cáo mới trong nhóm này. Tài sản phải APPROVED (5); hồ sơ xử lý BCC162 phải APPROVED (1). Báo cáo nhập BCC157 giữ trạng thái DRAFT hiện có; không suy diễn rằng đã được phê duyệt.

## 4. Quy tắc và phân quyền riêng

Lọc ngày ghi nhận khai thác; cộng các khoản theo tài sản, lấy hạn khai thác lớn nhất và danh sách đơn vị không trùng. Khối theo thứ tự Sử dụng, Cho thuê, Chuyển nhượng.

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
| POST | `/api/v1/reports/preview` | reportCode F-146 hoặc BCC_161 | `report:read` |
| POST | `/api/v1/reports/export` | Cùng bộ lọc preview; EXCEL/PDF/WORD (DOCX ảnh trang) | `report:read` |

## 7. Phần kỹ thuật — cấu trúc bảng

Nguồn: `infra_assets + asset_exploitations`. Không tạo bảng tổng hợp; đọc dữ liệu nghiệp vụ đã duyệt, loại bản ghi xóa mềm.

Đọc giới hạn và mục chưa nghiệm thu tại `../../tech-lead/04-plan.md`; không xem brief này là xác nhận hoàn thành.
