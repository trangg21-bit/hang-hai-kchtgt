---
feature-id: F-012
document: business-context
output-mode: lean
last-updated: 2026-06-27
---
# Business Context: Xem chi tiết Cảng biển

## Business Driver

Hệ thống quản lý KCHTGT hàng hải yêu cầu tra cứu thông tin Cảng biển phục vụ điều phối vận tải, lập kế hoạch logistics và báo cáo quản lý nhà nước. Hiện tại không có giao diện tập trung nên cán bộ phải tra cứu thủ công hoặc qua nhiều kênh rời rạc.

## Stakeholders

| Stakeholder | Role | Interest |
|---|---|---|
| Chuyên viên Cảng vụ/Chi cục/Cục (A-003) | Primary user | Tra cứu, kiểm tra thông tin kỹ thuật đầy đủ |
| Người dùng tại Cảng (A-004) | Primary user | Khai thác thông tin cơ bản trong phạm vi quyền |
| Lãnh đạo (A-002) | Secondary user | Xem thông tin để ra quyết định phê duyệt (link sang F-011) |
| Quản trị hệ thống (A-001) | Admin | Xem đầy đủ để hỗ trợ vận hành |

## AS-IS Process

```
flow: Tra cứu thông tin Cảng biển (hiện tại)
actor: Chuyên viên / Người dùng tại Cảng
trigger: Nhu cầu kiểm tra thông tin Cảng biển
steps:
  1. Chuyên viên → Liên hệ đồng nghiệp hoặc tìm file Excel/Word nội bộ
  2. Chuyên viên → Tra cứu thủ công qua nhiều nguồn rời rạc
  3. Chuyên viên → Tổng hợp thông tin từ nhiều file
Pain points: Mất thời gian, dữ liệu không đồng nhất, không có bản đồ, không kiểm soát phiên bản
```

## TO-BE Process

```
flow: Xem chi tiết Cảng biển (tương lai)
actor: Chuyên viên (A-003) / Người dùng tại Cảng (A-004)
trigger: Cần thông tin về một Cảng biển cụ thể
Pre-conditions: Người dùng đã đăng nhập và có permission VIEW_CANG_BIEN
steps:
  1. Người dùng → Truy cập module Quản lý Cảng biển
  2. Người dùng → Nhập từ khóa (mã/tên/tỉnh) hoặc chọn bộ lọc trạng thái
  3. Hệ thống → Trả danh sách kết quả (≤ 50/trang) trong 3 giây
  4. Người dùng → Click vào Cảng biển muốn xem
  5. Hệ thống → Hiển thị trang chi tiết với các trường theo quyền vai trò + bản đồ GPS
  6. Người dùng → Xem thông tin, có thể điều hướng sang cập nhật/xóa nếu có quyền
Post-conditions: Người dùng nắm được thông tin Cảng biển; không thay đổi dữ liệu
Exception flows:
  - GeoServer timeout: hiển thị tọa độ dạng text thay bản đồ
  - toDo null: hiển thị "Chưa có tọa độ"
  - Không có quyền: HTTP 403, UI redirect trang thông báo lỗi
  - Không tìm thấy kết quả: hiển thị empty state gợi ý kiểm tra bộ lọc
```

## Permission Mapping

| Permission | Roles | Trường được xem |
|---|---|---|
| VIEW_CANG_BIEN (basic) | A-004 Nhân viên vận hành | maCang, tenCang, tinhThanh, trangThai |
| VIEW_CANG_BIEN (extended) | A-003 Chuyên viên, A-002 Lãnh đạo | Tất cả 13 trường CangBien |
| VIEW_CANG_BIEN (full admin) | A-001 Quản trị hệ thống | Tất cả trường + metadata hệ thống |
