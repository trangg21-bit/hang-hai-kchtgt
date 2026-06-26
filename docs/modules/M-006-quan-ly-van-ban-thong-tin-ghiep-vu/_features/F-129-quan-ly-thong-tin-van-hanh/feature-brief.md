---
id: F-129
name: "Quản lý thông tin vận hành"
slug: quan-ly-thong-tin-van-hanh
module-id: M-006
status: proposed
classification: local
priority: high
created: "2026-06-16T04:40:21Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý thông tin vận hành

## Description

Hệ thống quản lý thông tin vận hành kết cấu hạ tầng cảng biển (KCHT), bao gồm việc đăng ký, theo dõi và báo cáo các kế hoạch vận hành hàng ngày, lịch trình hoạt động của cầu cảng, thiết bị xếp dỡ, cũng như các quy trình vận hành tiêu chuẩn đảm bảo an toàn và hiệu quả khai thác cảng.

## Business Intent

Nâng cao năng lực điều độ và quản lý vận hành cảng biển thông qua việc số hóa toàn bộ thông tin vận hành, giúp người quản lý có cái nhìn tổng quan về tình trạng khai thác, tối ưu hóa lịch trình hoạt động của các thiết bị và khu vực bến cảng, giảm thiểu thời gian chờ đợi và tăng công suất khai thác tổng thể.

## Flow Summary

Người vận hành đăng nhập hệ thống, nhập kế hoạch vận hành hàng ngày bao gồm lịch trình hoạt động của từng cầu cảng, thiết bị xếp dỡ và khu vực bốc xếp. Hệ thống tự động kiểm tra xung đột lịch trình và cảnh báo nếu có sự chồng chéo. Người quản lý xem dashboard tổng quan để theo dõi tiến độ vận hành, phê duyệt kế hoạch và điều chỉnh khi cần. Hệ thống tự động sinh báo cáo vận hàng ngày, tuần, tháng và xuất ra định dạng PDF hoặc Excel để lưu trữ hoặc trình báo cấp trên.

## Acceptance Criteria

- Người vận hành có thể tạo mới kế hoạch vận hành với đầy đủ thông tin (ngày, cầu cảng, thiết bị, thời gian dự kiến)
- Hệ thống tự động kiểm tra và cảnh báo khi có xung đột lịch trình giữa các kế hoạch
- Người quản lý có thể xem dashboard tổng quan, phê duyệt hoặc từ chối kế hoạch vận hành
- Hệ thống tự động sinh báo cáo vận hành theo ngày, tuần, tháng với các chỉ số chính
- Chỉ người có quyền Admin mới được phép xóa kế hoạch vận hành đã được phê duyệt

## In Scope

- Đăng ký và quản lý kế hoạch vận hành hàng ngày, tuần, tháng
- Theo dõi trạng thái thực hiện của từng kế hoạch (đang diễn ra, hoàn thành, trì hoãn, hủy)
- Kiểm tra xung đột lịch trình và tự động cảnh báo
- Dashboard tổng quan tình trạng vận hành cảng
- Sinh báo cáo vận hành tự động theo chu kỳ

## Out of Scope

- Quản lý nhân sự và phân công ca làm việc
- Tích hợp trực tiếp với hệ thống giám sát thiết bị IoT tại cảng
- Quản lý chi phí vận hành chi tiết cho từng ca
- Tự động điều độ tàu vào/ra dựa trên AI

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem kế hoạch vận hành, Báo cáo tình trạng |
| Operator | Tạo, Chỉnh sửa kế hoạch vận hành, Đính kèm tài liệu |
| Admin | Phê duyệt, Từ chối, Xóa, Vô hiệu hóa kế hoạch, Quản lý phân quyền |

## Entities

- **KeHoachVanHanh**: id, ngayVanHanh, cauCangId, thietBiId, thoiGianBatDau, thoiGianKetThuc, tinhTrang, nguoiTao, ngayTao, nguoiSuaDoi, ngaySuaDoi
- **VanHanhChiTiet**: id, keHoachId, moTa, sanLuongDuKien, sanLuongThucTe, ghiChu
- **BaoCaoVanHanh**: id, loaiBaoCao, kyBatDau, kyKetThuc, duongDanFile, nguoiTao, ngayTao

## Business Rules

1. Kế hoạch vận hành phải có ngày và thời gian bắt đầu kết thúc hợp lệ (bắt đầu < kết thúc)
2. Một cầu cảng hoặc thiết bị chỉ được xếp lịch cho một kế hoạch vận hành duy nhất tại cùng một khung giờ
3. Kế hoạch vận hành chưa được phê duyệt có thể được chỉnh sửa bởi người tạo
4. Báo cáo vận hành chỉ được sinh khi có ít nhất một kế hoạch vận hành đã hoàn thành trong kỳ báo cáo

## Testing Strategy

- Test đơn vị hàm tạo kế hoạch vận hành và kiểm tra xung đột lịch trình
- Test tích hợp luồng đăng ký → kiểm tra xung đột → phê duyệt → sinh báo cáo
- Test dashboard với dữ liệu vận hành mẫu để đảm bảo hiển thị đúng chỉ số
- Test sinh báo cáo theo các chu kỳ ngày, tuần, tháng với bộ dữ liệu khác nhau
- Test phân quyền: Operator không được phép xóa, Admin mới có quyền phê duyệt
