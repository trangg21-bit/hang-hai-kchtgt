---
id: F-210
name: Chia sẻ KCHTGT đài TTDH
slug: chia-se-kchtgt-dai-ttdh
module-id: M-021
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia sẻ KCHTGT đài TTDH

## Description
Chia sẻ dữ liệu và thông tin kỹ thuật của hệ thống đài Thông tin Tìm kiếm Cứu nạn Hàng hải (TTDH) thuộc Khung Cơ sở dữ liệu Không gian và Công nghệ Giao thông (KCHTGT), bao gồm vị trí, thông số kỹ thuật, chế độ hoạt động và phạm vi phủ sóng của các đài TTDH trên toàn quốc, phục vụ công tác chỉ đạo tìm kiếm cứu nạn hàng hải.

## Business Intent
Đài TTDH là cơ sở hạ tầng quan trọng của hệ thống tìm kiếm cứu nạn hàng hải, có vai trò tiếp nhận tín hiệu báo cứu nạn và điều phối hoạt động cứu hộ. Việc chia sẻ dữ liệu KCHTGT đài TTDH giúp cơ quan chỉ huy tìm kiếm cứu nạn có cái nhìn toàn diện về tình trạng và khả năng vận hành của toàn bộ hệ thống đài TTDH, từ đó tối ưu hóa phản ứng cứu hộ và nâng cao tỷ lệ cứu nạn thành công.

## Flow Summary
Dữ liệu KCHTGT đài TTDH được thu thập từ hệ thống quản lý hạ tầng viễn thông hàng hải, bao gồm vị trí địa lý, thông số kỹ thuật, chế độ trực và tình trạng vận hành. Dữ liệu được chuẩn hóa và lưu trữ trong M-021, sau đó được chia sẻ qua API RESTful (JSON/HTTPS/JWT) và trục LGSP đến các đơn vị chỉ huy tìm kiếm cứu nạn, các đài TTDH thành viên và hệ thống điều phối SAR quốc gia.

## Acceptance Criteria
- Dữ liệu KCHTGT đài TTDH được chia sẻ thành công qua LGSP và RESTful API với dữ liệu vị trí chính xác đến cấp giây
- Thông tin về tình trạng vận hành và phạm vi phủ sóng của từng đài TTDH được đồng bộ đầy đủ
- Hệ thống xác thực JWT và kiểm soát truy cập theo IP whitelist hoạt động đúng yêu cầu bảo mật
- Dữ liệu tình trạng đài TTDH được cập nhật theo thời gian thực (real-time hoặc gần real-time)

## In Scope
- Chia sẻ thông tin đài TTDH (vị trí, thông số kỹ thuật, tình trạng)
- Chia sẻ phạm vi phủ sóng và chế độ hoạt động của từng đài
- Tích hợp với hệ thống chỉ huy tìm kiếm cứu nạn hàng hải
- Đồng bộ dữ liệu với trục LGSP

## Out of Scope
- Xây dựng mới hệ thống đài TTDH
- Vận hành đài TTDH
- Xử lý tín hiệu cứu nạn trực tiếp

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User (Đơn vị vận hành đài) | View, Cập nhật tình trạng đài |
| Admin (Quản lý hệ thống) | Create, Update, Delete, Quản lý truy cập |
| Cơ quan chỉ huy SAR | View, Điều phối hoạt động |
| Đài TTDH thành viên | View, Báo cáo tình trạng |

## Architecture Notes
- Sử dụng RESTful API theo chuẩn JSON với mã hóa HTTPS và xác thực JWT
- Tích hợp qua Trục LGSP để chia sẻ dữ liệu không gian vị trí đài TTDH
- Áp dụng IP whitelist cho các đầu cuối được ủy quyền
- Hỗ trợ cập nhật trạng thái đài theo thời gian thực qua WebSocket hoặc MQTT
- Dữ liệu không gian lưu trữ trong PostGIS

## Entities
- **DaiTTDH**: id, ten_dai, toa_do_vi_tri, loai_dai, tan_so_phat, pham_vi_phu_song, tinh_trang_hoat_dong, don_vien_quan_ly
- **ChuongTrinhTruc**: id, dai_id, ngay_truc, ca_truc, nguoi_truc, tinh_trang
- **PhamViPhuSong**: id, dai_id, ban_kinh_km, che_do_phu_song, kenh_lam_viec

## Business Rules
1. Dữ liệu KCHTGT đài TTDH chỉ được chia sẻ qua Trục LGSP hoặc RESTful API đã được xác thực
2. Chỉ những đơn vị có IP trong danh sách whitelist mới được phép truy cập API
3. Tất cả thay đổi về tình trạng hoạt động của đài đều phải có xác thực JWT hợp lệ
4. Thông tin đài TTDH phải được cập nhật ít nhất mỗi ca trực một lần

## Testing Strategy
- Test tích hợp API với đầu cuối giả lập và hệ thống LGSP
- Test xác thực JWT và kiểm soát truy cập theo IP whitelist
- Test cập nhật trạng thái đài TTDH theo thời gian thực
- Test đồng bộ dữ liệu đài TTDH với hệ thống chỉ huy SAR
