---
id: F-131
name: "Quản lý thông tin sự cố"
slug: quan-ly-thong-tin-su-co
module-id: M-006
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:29Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý thông tin sự cố

## Description

Hệ thống quản lý thông tin sự cố kết cấu hạ tầng cảng biển (KCHT), bao gồm việc tiếp nhận, phân loại, theo dõi xử lý và báo cáo các sự cố liên quan đến cầu cảng, thiết bị xếp dỡ, hệ thống an toàn và các hạng mục hạ tầng cảng, cùng việc lưu trữ biên bản sự cố và hồ sơ xử lý sự cố đầy đủ, hệ thống.

## Business Intent

Nâng cao năng lực ứng phó và xử lý sự cố tại cảng biển bằng cách số hóa toàn bộ quy trình tiếp nhận, phân tích và xử lý sự cố, giúp nhà quản lý có cái nhìn tổng quan về tình trạng an toàn KCHT, rút ngắn thời gian phản ứng sự cố và phục vụ công tác phòng ngừa, phân tích nguyên nhân để tránh tái diễn trong tương lai.

## Flow Summary

Người phát hiện sự cố đăng nhập hệ thống, khai báo sự cố mới với đầy đủ thông tin (thời gian phát hiện, vị trí, mức độ nghiêm trọng, mô tả sơ bộ, hình ảnh đính kèm). Hệ thống tự động phân loại mức độ sự cố (nhẹ, trung bình, nghiêm trọng, cực nghiêm trọng) và gửi thông báo khẩn cấp đến người phụ trách tương ứng. Đội xử lý sự cố cập nhật tiến độ xử lý, biện pháp khắc phục và kết quả cuối cùng. Hệ thống tự động sinh biên bản sự cố và báo cáo phân tích nguyên nhân gốc rễ, lưu trữ toàn bộ hồ sơ để tra cứu và học kinh nghiệm.

## Acceptance Criteria

- Người dùng có thể khai báo sự cố mới với đầy đủ thông tin (thời gian, vị trí, mức độ, mô tả, hình ảnh đính kèm)
- Hệ thống tự động phân loại mức độ sự cố và gửi thông báo đến người phụ trách tương ứng
- Đội xử lý sự cố có thể cập nhật tiến độ xử lý và biện pháp khắc phục theo thời gian thực
- Hệ thống tự động sinh biên bản sự cố và báo cáo phân tích sau khi sự cố được xử lý xong
- Chỉ Admin mới được phép đóng sự cố hoặc xóa hồ sơ sự cố

## In Scope

- Khai báo và quản lý sự cố liên quan đến KCHT
- Tự động phân loại mức độ và gửi thông báo khẩn cấp
- Theo dõi tiến độ xử lý sự cố theo thời gian thực
- Sinh biên bản sự cố và báo cáo phân tích nguyên nhân gốc rễ
- Lưu trữ hồ sơ xử lý sự cố để tra cứu và học kinh nghiệm

## Out of Scope

- Tích hợp với hệ thống báo động cháy và an ninh tại cảng
- Quản lý bảo hiểm bồi thường cho các sự cố
- Tự động cảnh báo thời tiết nguy hiểm ảnh hưởng đến cảng
- Quản lý trách nhiệm pháp lý và tranh chấp sau sự cố

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem danh sách sự cố, Xem chi tiết sự cố đã đóng |
| Reporter | Khai báo sự cố mới, Đính kèm hình ảnh, Tài liệu |
| Handler | Cập nhật tiến độ xử lý, Ghi nhận biện pháp khắc phục |
| Admin | Đóng sự cố, Xóa, Vô hiệu hóa hồ sơ, Quản lý phân quyền |

## Entities

- **SuCo**: id, thoiGianPhatHien, viTri, mucDoNghiemTrong, moTa, tinhTrangXuLy, nguoiBaoCao, ngayTao, nguoiSuaDoi, ngaySuaDoi
- **BienBanSuCo**: id, suCoId, moTaChiTiet, bienPhapKacPhuc, thoiGianXuLyKetThuc, nguoiLapBienBan, ngayLap, taiLieuDinhKem
- **TienDoXuLy**: id, suCoId, thoiGianCapNhat, moTaTienDo, nguoiCapNhat

## Business Rules

1. Sự cố phải có mức độ nghiêm trọng hợp lệ (nhẹ, trung bình, nghiêm trọng, cực nghiêm trọng)
2. Thông báo khẩn cấp tự động gửi đến người phụ trách khi mức độ là "nghiêm trọng" hoặc "cực nghiêm trọng"
3. Trạng thái sự cố phải được cập nhật theo trình tự: Tiếp nhận → Đang xử lý → Đã xử lý → Đã đóng
4. Biên bản sự cố chỉ được lập khi sự cố ở trạng thái "Đã xử lý" hoặc "Đã đóng"

## Testing Strategy

- Test đơn vị hàm khai báo sự cố và tự động phân loại mức độ
- Test tích hợp luồng khai báo → phân loại → thông báo → xử lý → sinh biên bản
- Test thông báo khẩn cấp với các mức độ sự cố khác nhau
- Test sinh biên bản sự cố với dữ liệu xử lý mẫu
- Test phân quyền: Reporter không được phép đóng sự cố, Admin mới có quyền xóa
