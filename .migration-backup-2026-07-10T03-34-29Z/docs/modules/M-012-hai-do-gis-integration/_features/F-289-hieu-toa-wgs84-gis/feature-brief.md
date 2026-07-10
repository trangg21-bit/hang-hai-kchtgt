---
id: F-289
name: Hiệu tọa WGS84 GIS
slug: hieu-toa-wgs84-gis
module-id: M-012
status: done
classification: local
priority: medium
created: 2026-06-16T04:42:41Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Hiệu tọa WGS84 GIS

## Description
Dịch chuyển và hiệu chỉnh tọa độ giữa 3 hệ quy chiếu: WGS84 (World Geodetic System 1984), VN-2000 (Vietnam Reference Frame 2000) và UTM (Universal Transverse Mercator). Component CoordinateCalibrationService thực hiện Transverse Mercator (TM) inverse projection với đầy đủ series expansion (e1, e1_2, e1_3, e1_4 terms: J1-J4, fact1-fact2, term1-term6) để chuyển đổi giữa tọa độ phẳng và địa lý. Hỗ trợ parsing đa định dạng: DMS (độ-phút-giây với ký hiệu °'/""), DDM (độ thập phân) và decimal degree. Áp dụng datum shift approximation cho VN-2000 (latitude +0.000045°, longitude -0.000085°) và TM inverse cho UTM.

## Business Intent
Hệ thống quản lý hàng hải cần chuẩn hóa tất cả tọa độ về WGS84/EPSG:4326 — tiêu chuẩn quốc tế cho GPS và GIS — để đảm bảo các đối tượng trên bản đồ (phao, đèn, ranh giới vùng biển) được hiển thị chính xác. Việt Nam sử dụng hệ quy chiếu VN-2000 (trên ellipsoid Krassovsky 1940) và các múi UTM khác nhau. Feature cho phép dịch chuyển tọa độ từ các hệ quy chiếu địa phương sang WGS84, giúp tích hợp chính xác dữ liệu hải đồ, bản đồ địa hình và thông tin định vị GPS từ nhiều nguồn khác nhau.

## Flow Summary
Quy trình hiệu tọa gồm: (1) Người dùng gọi API POST /api/gis/charts/calibrate với CalibrationRequest chứa systemType (WGS84/VN2000/UTM), coord1/coord2 (tọa độ đầu vào dạng DMS/DDM/decimal), zoneOrCm (múi UTM hoặc kinh tuyến trung tâm VN-2000), dx/dy (offset hiệu chỉnh); (2) ChartController.calibrate() nhận request, validate các tham số (@Valid); (3) CoordinateCalibrationService.calibrate() dispatch đến phương thức phù hợp dựa trên systemType; (4) parseCoordinateString() tự động nhận dạng định dạng tọa độ (DMS với °'/""/letters hoặc decimal) và chuyển đổi sang decimal degrees; (5) Đối với VN-2000: TM inverse projection với kinh tuyến trung tâm 105.0 (default, có thể cấu hình qua zoneOrCm), sau đó áp dụng datum shift (+0.000045° lat, -0.000085° lon); (6) Đối với UTM: TM inverse projection với zone parsing (48N/49S format, default zone 48, northern hemisphere); (7) Đối với WGS84: chỉ áp dụng dx/dy offset trực tiếp; (8) Kết quả được validate bounds (longitude [-180,180], latitude [-90,90]) trước khi trả về.

## Acceptance Criteria
1. API POST /api/gis/charts/calibrate phải chấp nhận hệ thống WGS84 và trả về tọa độ đã hiệu chỉnh trong cùng hệ quy chiếu (áp dụng dx/dy offset nếu có).
2. Đối với hệ thống VN-2000, API phải thực hiện Transverse Mercator inverse projection với kinh tuyến trung tâm 105.0 (hoặc giá trị tùy chỉnh) và áp dụng datum shift (lat +0.000045°, lon -0.000085°), trả về tọa độ WGS84.
3. Đối với hệ thống UTM, API phải xác định múi từ zoneOrCm (default 48), thực hiện TM inverse projection với tham số ellipsoid WGS-84 (a=6378137.0, f=1/298.257223563), trả về tọa độ WGS84.
4. parseCoordinateString() phải parse thành công ít nhất 6 định dạng: DMS với °'/"" (10°24'36"N), DMS với letters (10D24M36S N), DDM (10.41), decimal (10.41), và các biến thể khoảng trắng.

## In Scope
- 3 hệ quy chiếu: WGS84, VN-2000, UTM
- Transverse Mercator inverse projection với đầy đủ series expansion (J1-J4, fact1-fact2, term1-term6)
- Ellipsoid parameters WGS-84: a=6378137.0, f=1/298.257223563
- DMS/DDM/decimal degree parsing (6+ định dạng)
- Hỗ trợ ký hiệu °'/"" và letters N/S/E/W
- UTM zone parsing (48N/49S format, default zone 48, northern hemisphere)
- VN-2000 central meridian default 105.0, có thể cấu hình
- Datum shift approximation cho VN-2000 (lat +0.000045°, lon -0.000085°)
- Validation bounds: longitude [-180,180], latitude [-90,90]
- API endpoint /api/gis/charts/calibrate với @Valid CalibrationRequest

## Out of Scope
- Bursa-Wolf 7-parameter transformation cho VN-2000 → WGS84 (chỉ dùng datum shift approximation)
- Ellipsoid Krassovsky 1940 đúng (a=6378245, f=1/298.3) — hiện dùng WGS-84 parameters
- Transformation dựa trên NTV2 grids
- Hỗ trợ múi UTM southern hemisphere (49S) — chỉ hỗ trợ northern (48N default)
- Edge case tests cho cực trị (near poles, negative central meridian, empty/null coordinates)
- Unit test cho parseCoordinateString() với các định dạng edge cases

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| User | Xem tọa độ đã hiệu chỉnh, Chọn hệ quy chiếu nguồn |
| Admin | Cấu hình central meridian VN-2000, Cấu hình UTM zone default |
| System | Tự động parse tọa độ từ các định dạng khác nhau, Tự động validate bounds |

## Entities
- **CalibrationRequest**: DTO cho POST /api/gis/charts/calibrate — systemType (WGS84/VN2000/UTM), coord1 (String), coord2 (String), zoneOrCm (String), dx (double), dy (double)
- **CalibrationResult**: DTO trả về từ API — latitude (double), longitude (double), sourceSystem (String), targetSystem ("WGS84"), valid (Boolean), errorMessage (String khi invalid)

## Business Rules
1. Tọa độ kết quả phải luôn được validate bounds: longitude trong [-180, 180], latitude trong [-90, 90]. Nếu vượt quá, hệ thống trả về valid=false với errorMessage.
2. ParseCoordinateString() tự động nhận dạng định dạng: nếu chứa ký hiệu °'/"" thì là DMS, nếu chứa letters N/S/E/W thì áp dụng sign, nếu là số thuần túy thì là decimal degree.
3. Ký hiệu hướng N/E (+) và S/W (-) phải được áp dụng đúng: N/E → multiplier +1.0, S/W → multiplier -1.0.
4. UTM zone default là 48, northern hemisphere (N) — nếu zoneOrCm không chứa chữ cái thì giả định northern.
5. VN-2000 central meridian default là 105.0° — có thể thay đổi qua tham số zoneOrCm.
6. Datum shift cho VN-2000 là giá trị cố định (+0.000045° lat, -0.000085° lon) — đây là approximation, không phải Bursa-Wolf chính xác.

## Testing Strategy
Kiểm thử unit sử dụng JUnit 5: CoordinateCalibrationServiceTest gồm 5 test cases: (1) parseCoordinateString() với 6 variant định dạng DMS; (2) WGS84 calibration với dx/dy offset; (3) VN-2000 → WGS84 conversion với TM inverse và datum shift; (4) UTM → WGS84 conversion với TM inverse; (5) Bounds validation với tọa độ invalid (lon > 180, lat > 90). Dữ liệu kiểm thử sử dụng tọa độ thực tế của Việt Nam (ví dụ: Hà Nội ~21.0285°N, 105.8542°E; TP.HCM ~10.8231°N, 106.6297°E) để đảm bảo tính chính xác thực tế.
