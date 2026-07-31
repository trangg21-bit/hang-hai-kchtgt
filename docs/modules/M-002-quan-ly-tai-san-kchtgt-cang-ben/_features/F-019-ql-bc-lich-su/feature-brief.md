---
id: F-019
name: Quản lý Bến cảng - Lịch sử
slug: ql-bc-lich-su
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:41:00Z
last-updated: 2026-07-30
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Bến cảng - Lịch sử

## Description

Tính năng cho phép người dùng xem và theo dõi toàn bộ lịch sử thay đổi của một Bến cảng bao gồm các lần tạo, cập nhật, xóa và phê duyệt, hiển thị dưới dạng danh sách chronologically với thông tin chi tiết về từng trường thay đổi, giá trị cũ, giá trị mới, người thực hiện và thời gian, phục vụ công tác kiểm toán và đánh giá tiến trình hạ tầng. Giao diện hỗ trợ phân trang, lọc theo loại sự kiện và trường thay đổi.

## Business Intent

Theo dõi lịch sử thay đổi của Bến cảng là yêu cầu bắt buộc để đảm bảo tính minh bạch, truy xuất nguồn gốc dữ liệu và phục vụ công tác kiểm toán; lịch sử này cũng là cơ sở để phân tích xu hướng phát triển hạ tầng cảng biển trong từng giai đoạn.

## Flow Summary

Người dùng click "Lịch sử" trên danh sách hoặc chi tiết → hệ thống gọi GET /api/v1/ben-cang/:id/history → hiển thị bảng chronologically (mới nhất trên cùng) với các cột: Field, Old Value, New Value, Changed By, Changed At, Event Type. Hỗ trợ phân trang 20/50, lọc theo loại sự kiện (Tạo mới/Cập nhật/Phê duyệt/Từ chối) và theo trường thay đổi. Mỗi sự kiện hiển thị chi tiết oldValue/newValue (Cập nhật) hoặc action/lý do (Phê duyệt/Từ chối).

## Acceptance Criteria

1. Người dùng có vai trò "Quản lý cảng" hoặc "Quản trị viên" có thể truy cập được trang lịch sử thay đổi.
2. Lịch sử hiển thị đầy đủ các sự kiện: tạo mới, cập nhật từng trường, phê duyệt và xóa, sắp xếp theo thời gian giảm dần.
3. Mỗi sự kiện cập nhật hiển thị chi tiết: trường nào thay đổi, giá trị cũ, giá trị mới, người thực hiện và thời gian thực hiện.
4. Người dùng có thể lọc lịch sử theo loại sự kiện, theo người thực hiện, hoặc theo khoảng thời gian.
5. [UI] Bảng lịch sử với phân trang 20/50, filter loại sự kiện + filter theo trường.
6. [UI] Sự kiện Phê duyệt/Từ chối hiển thị action và lý do (nếu có).

## In Scope

- Trang hiển thị lịch sử thay đổi chronologically của Bến cảng
- Chi tiết từng sự kiện: loại, trường thay đổi, giá trị cũ/mới, người thực hiện, thời gian
- Lọc lịch sử theo loại sự kiện, người thực hiện, khoảng thời gian
- Tích hợp với nhật ký phê duyệt (F-017) và xóa (F-016)
- Phân trang 20/50

## Out of Scope

- Sửa hoặc xóa lịch sử đã ghi nhận
- So sánh trực tiếp giữa hai phiên bản bất kỳ
- Xuất lịch sử ra file Excel/PDF
- Thông báo khi có thay đổi mới
- Khôi phục Bến cảng về phiên bản lịch sử bất kỳ

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Xem lịch sử đầy đủ |
| Quản lý cảng | Xem lịch sử đầy đủ |
| Nhân viên vận hành | Xem lịch sử (trường kỹ thuật bị ẩn) |
| KháchExternal | Không có quyền truy cập |

## Entities

- **LichSuThayDoi**: id (UUID), benCangId (UUID), loaiSuKien (enum: tao_moi, cap_nhat, phe_duyet, xoa), truongDuocCapNhat (string, nullable), giaTriCu (text, nullable), giaTriMoi (text, nullable), nguoiThucHien (UUID), thoiGian (timestamp), ghiChu (text, nullable)
- **PheDuyetLog**: id (UUID), benCangId (UUID), quyetDinh (enum: chap_thuan, tu_choi), lyDo (text), nguoiPheDuyet (UUID), thoiGianPheDuyet (timestamp)

## Business Rules

1. Mọi thay đổi về Bến cảng đều phải được ghi nhận vào bảng lịch sử — không cho phép bỏ qua.
2. Lịch sử thay đổi chỉ được phép thêm mới, không cho phép sửa hoặc xóa.
3. Các sự kiện từ F-014, F-015, F-016, F-017 được tích hợp vào cùng một dòng thời gian thống nhất.
4. Giá trị cũ và giá trị mới được lưu trữ dưới dạng văn bản hóa để dễ đọc.

## UI Scope

- **Component:** `BenCangHistoryPage` — bảng lịch sử với filter + phân trang
- **API endpoint:** `GET /api/v1/ben-cang/:id/history`
- **Columns:** Field (tên trường), Old Value, New Value, Changed By (tên người dùng), Changed At (dd/MM/yyyy HH:mm:ss), Event Type (Tạo mới/Cập nhật/Phê duyệt/Từ chối)
- **Sort:** Giảm dần theo changedAt (mới nhất trên cùng)
- **Pagination:** 20 hoặc 50 mục mỗi trang
- **Event filter dropdown:** Tất cả / Tạo mới / Cập nhật / Phê duyệt / Từ chối
- **Field filter dropdown:** Danh sách các trường từng bị thay đổi
- **Create event:** event_type=TAO_MOI, newValue = giá trị ban đầu, oldValue = null
- **Update event:** event_type=CAP_NHAT, field + oldValue + newValue
- **Approve event:** event_type=PHE_DUYET, action=APPROVE, pheDuyetBy, pheDuyetAt
- **Reject event:** event_type=TU_CHOI, action=REJECT, pheDuyetBy, pheDuyetAt, lyDo
- **Navigation:** Từ danh sách (F-073) hoặc chi tiết (F-074) → nút "Lịch sử"

## Testing Strategy

### BE Testing
Kiểm thử đơn vị cho các hàm tạo và truy vấn lịch sử thay đổi; kiểm thử tích hợp cho luồng ghi nhận lịch sử tự động khi tạo, cập nhật, xóa và phê duyệt.

### UI Testing
Bảng hiển thị đúng cấu trúc; sắp xếp giảm dần; phân trang 20/50; filter loại sự kiện và filter theo trường hoạt động đúng; hiển thị detail oldValue/newValue cho Cập nhật; hiển thị action/lyDo cho Phê duyệt/Từ chối.

## Consolidation Note

Merged with UI feature F-096 (ui-ql-bc-lich-su) — 2026-07-30
