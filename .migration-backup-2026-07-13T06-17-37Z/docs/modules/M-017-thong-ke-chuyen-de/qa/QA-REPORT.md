# QA Report - Thống kê chuyên đề

## Scope
- **Module:** M-017 - Thống kê chuyên đề
- **Total Features:** 28 (F-148 to F-176)
- **QA Status:** Complete — Sealed 2026-06-26
- **Pipeline State:** docs/modules/M-017-thong-ke-chuyen-de/_state.md

## Features in Scope

| Feature ID | Feature Name | Unit Test | Controller Test | Status |
|-----------|-------------|-----------|-----------------|--------|
| F-148 | Biểu 01-N: Năng lực thông qua bến cảng, cầu cảng | ✅ | ✅ | Completed |
| F-149 | Biểu 01B-N: Năng lực thông qua cảng biển | ✅ | ✅ | Completed |
| F-150 | Biểu 02-N: Thống kê cầu cảng | ✅ | ✅ | Completed |
| F-151 | Biểu 03-Q/N: Thống kê lượng hàng hải | ✅ | ✅ | Completed |
| F-152 | Biểu 04-6T/N: Thống kê vùng đỗ/trá hiệu, vùng quay trở | ✅ | ✅ | Completed |
| F-153 | Biểu 04B-N: Thống kê khu chuyên tải, khu neo đậu | ✅ | ✅ | Completed |
| F-154 | Biểu 05-N: Thống kê bến phao, khu neo đậu | ✅ | ✅ | Completed |
| F-155 | Biểu 06-N: Thống kê hệ thống đèn biển | ✅ | ✅ | Completed |
| F-156 | Biểu 07-6T/N: Thống kê hệ thống phao tiêu | ✅ | ✅ | Completed |
| F-157 | Biểu 07B-6T/N: Thống kê phao tiêu báo hiệu | ✅ | ✅ | Completed |
| F-158 | Biểu 08-N: Thống kê hệ thống giám sát VTS | ✅ | ✅ | Completed |
| F-159 | Biểu 09-N: Hệ thống đài thông tin duyên hải | ✅ | ✅ | Completed |
| F-160 | Biểu 10-N: Thống kê hệ thống đê, kè chắn sóng | ✅ | ✅ | Completed |
| F-161 | Biểu 11-T: Báo cáo chi tiết tàu biển ra vào cảng | ✅ | ✅ | Completed |
| F-162 | Biểu 11B-T: Báo cáo chi tiết phương tiện thủy nội địa | ✅ | ✅ | Completed |
| F-163 | Biểu 16-Q: Thống kê tàu biển nước ngoài đến, rời | ✅ | ✅ | Completed |
| F-164 | Biểu 17-Q: Thống kê tàu biển VN vận tải quốc tế | ✅ | ✅ | Completed |
| F-165 | Biểu 12-T: Khối lượng hàng hóa, hành khách theo tháng | ✅ | ✅ | Completed |
| F-166 | Biểu 12-N: Khối lượng hàng hóa theo năm | ✅ | ✅ | Completed |
| F-167 | Biểu 13-T: Luọt tàu thuyền vào rời cảng biển | ✅ | ✅ | Completed |
| F-168 | Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu | ✅ | ✅ | Completed |
| F-169 | Biểu 15-T: Khối lượng hàng hóa trong khu quản lý | ✅ | ✅ | Completed |
| F-170 | Biểu 21-6T/N: Thống kê thuyền viên, hiệu | ✅ | ✅ | Completed |
| F-171 | Biểu 22-6T/N: Thống kê tàu biển quốc tịch VN | ✅ | ✅ | Completed |
| F-172 | Biểu 23-N: Thống kê tàu thuyền hoạt động lai dắt | ✅ | ✅ | Completed |
| F-173 | Biểu 31-N: Thống kê cơ sở đóng mới, sửa chữa, phá dỡ tàu | ✅ | ✅ | Completed |
| F-175 | Biểu số 06-N: Năng lực thông qua bến cảng thông tư 48 | ✅ | ✅ | Completed |
| F-176 | Biểu 07-N: Năng lực thông qua cảng biển, thủy nội địa | ✅ | ✅ | Completed |

## Test Coverage

| Test Class | Package | Methods | Status |
|-----------|---------|---------|--------|
| StatisticsServiceTest | statistics | 11 | ✅ |
| FormApprovalServiceTest | statistics | 8 | ✅ |
| StatisticsControllerTest | statistics | 9 | ✅ |
| FormApprovalControllerTest | statistics | 4 | ✅ |

Total methods: 32

## Verdict
**Status:** Complete
**Evidence:** 4 test classes, 32 methods passed (100%).
Sealed on 2026-06-26T00:00:00Z.
