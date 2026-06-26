---
id: F-286
name: Hiển thị hải đồ GIS (S-52)
slug: hien-thi-hai-do-gis-s-52
module-id: M-012
status: done
classification: local
priority: high
created: 2026-06-16T04:42:41Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Hiển thị hải đồ GIS (S-52)

## Description
Áp dụng quy tắc hiển thị S-52 của IHO để render hải đồ điện tử ENC với ba bảng màu (palette) DAY, DUSK và NIGHT. Component S52StyleService ánh xạ feature codes của IHO S-57 sang màu sắc và kiểu hiển thị chuẩn S-52, bao gồm các loại phao (BOYSPP), đèn chỉ thị (LIGHTS), đường đẳng sâu (DEPCNT), khu vực neo đậu (ACHARE), khu vực đất liền (LNDARE) và khu vực hạn chế (RESARE). Controller ChartController cung cấp endpoint REST để yêu cầu hải đồ đã được style theo S-52.

## Business Intent
Hiển thị hải đồ đúng chuẩn S-52 đảm bảo tính nhận diện và an toàn hàng hải: các đối tượng trên biển (phao, đèn, vùng nước sâu, khu vực hạn chế) phải được thể hiện bằng màu sắc và ký hiệu tiêu chuẩn IHO, giúp thủy thủ và nhân viên kiểm soát giao thông biển phân biệt nhanh chóng các yếu tố nguy hiểm và thông tin điều hướng. Hệ thống hỗ trợ ba chế độ màu DAY/DUSK/NIGHT để phù hợp với điều kiện ánh sáng khác nhau, đặc biệt chế độ NIGHT quan trọng cho hoạt động ban đêm.

## Flow Summary
Quy trình hiển thị S-52 gồm: (1) Người dùng truy vấn hải đồ đã style qua API GET /api/gis/charts/cells/{id}/s52-styled?palette=DAY (default là DAY); (2) ChartIntegrationService.getS52StyledFeatures() tải danh sách ChartFeature entities và ChartFeatureRepository.findByCellId() cho tế bào được yêu cầu; (3) S52StyleService.getStyle(feature, palette) ánh xạ mỗi feature code sang S52Style DTO (fillColor, strokeColor, strokeWidth, strokeDashArray, iconSymbol, fillOpacity) thông qua switch-case; (4) Với chế độ NIGHT, applyNightFilter() được áp dụng để giảm cường độ màu xanh lá/xanh dương và bảo tồn màu đỏ; (5) Kết quả là danh sách features kèm metadata style, sẵn sàng cho client GIS render trên bản đồ. Các feature code không được nhận diện sẽ sử dụng fallback mặc định (đen/xám) theo geometry type.

## Acceptance Criteria
1. API GET /api/gis/charts/cells/{id}/s52-styled?palette=DAY phải trả về HTTP 200 với danh sách các ChartFeature kèm S52Style (fillColor, strokeColor, strokeWidth) đúng với quy tắc IHO S-52 cho DAY palette.
2. S52StyleService phải trả về màu sắc chính xác cho 6 loại feature code được hỗ trợ (BOYSPP, LIGHTS, DEPCNT, ACHARE, LNDARE, RESARE) cho cả 3 palettes (DAY, DUSK, NIGHT).
3. Chế độ NIGHT palette phải làm giảm cường độ màu xanh lá và xanh dương trong khi bảo tồn màu đỏ (thông qua applyNightFilter()), phù hợp với yêu cầu hiển thị ban đêm.
4. API phải chấp nhận query param palette với giá trị DAY (mặc định), DUSK hoặc NIGHT — không phân biệt chữ hoa/thường; trả về HTTP 400 nếu tham số không hợp lệ.

## In Scope
- Ánh xạ 6 feature code IHO S-57 phổ biến sang màu sắc chuẩn S-52 (BOYSPP, LIGHTS, DEPCNT, ACHARE, LNDARE, RESARE)
- Hỗ trợ 3 bảng màu: DAY, DUSK, NIGHT với các giá trị hex khác nhau
- Hàm applyNightFilter() giảm cường độ màu xanh lá/xanh dương cho chế độ ban đêm
- Fallback rendering mặc định cho các feature code không được nhận diện (theo geometry type)
- API endpoint /api/gis/charts/cells/{id}/s52-styled với query param palette
- Parsing JSON attributes từ ChartFeature.attributesJson vào response

## Out of Scope
- Hỗ trợ 200+ feature codes của IHO S-57 (chỉ 6 loại được implement)
- Render vector graphics trực tiếp trên frontend — chỉ cung cấp metadata style cho client GIS
- Tải bảng màu S-52 từ cấu hình bên ngoài (file/config/database) — các giá trị hex được hardcode
- Hỗ trợ các chế độ hiển thị khác (ví dụ: MONOCHROME, HIGH-CONTRAST)
- Caching kết quả style để tối ưu hiệu năng

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User | Xem hải đồ S-52 đã style, Chọn chế độ màu (DAY/DUSK/NIGHT) |
| Admin | Quản lý feature code mapping, Xem logs style rendering |
| System | Tự động áp dụng S52StyleService cho mỗi feature, Tự động parse attributesJson |

## Entities
- **ChartFeature**: id (UUID), cellId (UUID, NotNull), featureName (200 chars), featureCode (NotBlank, 50 chars), geometryType (POINT/LINE/POLYGON), coordinates (TEXT/WKT/GeoJSON), attributesJson (TEXT), deletedAt, createdAt, updatedAt
- **S52Style**: inner DTO class — fillColor (hex), strokeColor (hex), strokeWidth (double), strokeDashArray (String), iconSymbol (String), fillOpacity (double)

## Business Rules
1. Feature code phải được so sánh không phân biệt chữ hoa/thường (toUpperCase()) để xử lý đúng các mã S-57 theo chuẩn IHO.
2. Chế độ NIGHT palette phải luôn bảo tồn màu đỏ (#FF0000) — applyNightFilter() chỉ giảm cường độ màu xanh lá và xanh dương.
3. Các feature code không được nhận diện trong switch-case phải sử dụng fallback: POINT → #000000, LINE → #808080, POLYGON → #C0C0C0 (màu mặc định S-52).
4. Màu hex phải ở định dạng 6 ký tự (#RRGGBB) — nếu nhận được màu 3 ký tự hoặc 8 ký tự, hệ thống chuyển về fallback #220000.
5. Palette param được chấp nhận không phân biệt chữ hoa/thường (equalsIgnoreCase) — giá trị mặc định là "DAY".

## Testing Strategy
Kiểm thử unit sử dụng JUnit 5 và Mockito: ChartIntegrationServiceTest.verifyGetS52StyledFeatures() kiểm tra toàn bộ flow với mock S52StyleService trả về màu BOYSPP vàng cho phao. Kiểm thử trực tiếp S52StyleService với 6 feature codes × 3 palettes = 18 tổ hợp màu sắc. Dữ liệu kiểm thử sử dụng ChartFeature mock với các featureCode tiêu chuẩn IHO và coordinates dạng WKT.
