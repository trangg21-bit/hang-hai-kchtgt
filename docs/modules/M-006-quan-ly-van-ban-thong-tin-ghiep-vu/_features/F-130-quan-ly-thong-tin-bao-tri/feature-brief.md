---
id: F-130
name: "Quản lý thông tin bảo trì"
slug: quan-ly-thong-tin-bao-tri
module-id: M-006
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:29Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý thông tin bảo trì

## Description

Hệ thống quản lý thông tin bảo trì kết cấu hạ tầng cảng biển (KCHT), bao gồm việc lập kế hoạch bảo trì định kỳ, theo dõi tiến độ thực hiện, ghi nhận kết quả bảo trì, quản lý hồ sơ thiết bị và tính toán chi phí bảo trì cho các cầu cảng, thiết bị xếp dỡ và các hạng mục hạ tầng cảng biển.

## Business Intent

Đảm bảo các thiết bị và hạng mục kết cấu hạ tầng cảng biển luôn được bảo trì đúng định kỳ, giảm thiểu thời gian ngừng hoạt động ngoài dự kiến, kéo dài tuổi thọ thiết bị và đảm bảo an toàn lao động trong quá trình khai thác vận hành cảng, từ đó nâng cao năng lực cạnh tranh của cảng biển.

## Flow Summary

Quản lý bảo trì đăng ký kế hoạch bảo trì định kỳ cho từng thiết bị hoặc hạng mục KCHT, chọn loại bảo trì (định kỳ, sửa chữa lớn, sửa chữa khẩn cấp). Hệ thống tự động nhắc lịch bảo trì dựa trên chu kỳ được quy định. Khi bảo trì được thực hiện, kỹ thuật viên ghi nhận kết quả, thay thế phụ tùng và thời gian ngừng hoạt động. Hệ thống tổng hợp báo cáo bảo trì theo thiết bị, theo kỳ và theo chi phí, giúp nhà quản lý đánh giá hiệu quả công tác bảo trì và dự báo ngân sách.

## Acceptance Criteria

- Người dùng có thể tạo kế hoạch bảo trì cho từng thiết bị hoặc hạng mục KCHT với đầy đủ thông tin (loại bảo trì, thời gian dự kiến, phụ tùng cần thiết)
- Hệ thống tự động gửi nhắc nhở khi đến kỳ bảo trì định kỳ theo chu kỳ đã quy định
- Kỹ thuật viên có thể ghi nhận kết quả bảo trì thực tế, bao gồm thời gian ngừng hoạt động và phụ tùng đã thay thế
- Hệ thống tự động sinh báo cáo bảo trì theo thiết bị, theo kỳ và theo chi phí
- Chỉ Admin mới được phép xóa kế hoạch bảo trì đã hoàn thành

## In Scope

- Lập kế hoạch bảo trì định kỳ cho thiết bị và hạng mục KCHT
- Theo dõi tiến độ thực hiện bảo trì (đang diễn ra, hoàn thành, trì hoãn)
- Ghi nhận kết quả bảo trì, phụ tùng thay thế và thời gian ngừng hoạt động
- Quản lý lịch sử bảo trì của từng thiết bị
- Sinh báo cáo bảo trì theo chu kỳ và theo chi phí

## Out of Scope

- Quản lý kho phụ tùng và nhập xuất kho vật tư
- Tích hợp trực tiếp với hệ thống quản lý bảo trì CMMS chuyên dụng
- Quản lý hợp đồng bảo trì với nhà thầu bên ngoài
- Tự động phát hiện hư hỏng dựa trên cảm biến IoT

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem kế hoạch bảo trì, Xem báo cáo bảo trì |
| Technician | Tạo, Chỉnh sửa kế hoạch bảo trì, Ghi nhận kết quả bảo trì |
| Admin | Phê duyệt, Xóa, Vô hiệu hóa kế hoạch, Quản lý phân quyền |

## Entities

- **KeHoachBaoTri**: id, thietBiId, loaiBaoTri, ngayBatDauDuKien, ngayKetThucDuKien, tinhTrang, chiPhiDuKien, nguoiTao, ngayTao, nguoiSuaDoi, ngaySuaDoi
- **KetQuaBaoTri**: id, keHoachId, thoiGianBatDauThucTe, thoiGianKetThucThucTe, moTaKetQua, phuTonThayThe, thoiGianNgungHoatDong, nguoiGhiNhan, ngayGhiNhan
- **BaoCaoBaoTri**: id, loaiBaoCao, kyBatDau, kyKetThuc, tongChiPhi, duongDanFile, nguoiTao, ngayTao

## Business Rules

1. Kế hoạch bảo trì phải có loại bảo trì hợp lệ (định kỳ, sửa chữa lớn, sửa chữa khẩn cấp)
2. Thời gian kết thúc dự kiến phải lớn hơn thời gian bắt đầu dự kiến
3. Kết quả bảo trì chỉ được ghi nhận sau khi kế hoạch bảo trì ở trạng thái "Đang diễn ra"
4. Chi phí bảo trì thực tế được tính tự động từ tổng chi phí phụ tùng và nhân công ghi nhận

## Testing Strategy

- Test đơn vị hàm tạo kế hoạch bảo trì và tự động nhắc lịch theo chu kỳ
- Test tích hợp luồng đăng ký → nhắc lịch → ghi nhận kết quả → sinh báo cáo
- Test báo cáo bảo trì với dữ liệu mẫu cho nhiều thiết bị và kỳ khác nhau
- Test cảnh báo nhắc lịch với các chu kỳ khác nhau (7 ngày, 30 ngày, 90 ngày)
- Test phân quyền: Technician không được phép xóa, Admin mới có quyền xóa
