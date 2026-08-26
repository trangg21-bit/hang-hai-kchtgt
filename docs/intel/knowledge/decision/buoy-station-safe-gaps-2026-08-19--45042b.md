---
id: AM-45042b96880c9c84
kind: decision
topic: buoy-station-safe-gaps-2026-08-19
tags: []
importance: 0.75
agent: 
created: 2026-08-19T09:09:17.289Z
updated: 2026-08-19T09:09:17.289Z
---

Gap an toàn Nhà trạm phao tiêu ĐÃ SỬA (2026-08-19, user chọn gói an toàn, không đụng dữ liệu): (1) BuoyStationFormContent typeLocked đổi APPROVED_L2→APPROVED_L1 (flow nhà trạm dùng APPROVED_L1→PUBLISHED, không có L2); (2) tab File thêm accept .tiff/.tif + nút 'Chọn file' dashed + hint 'Hỗ trợ: PDF...≤20MB'; (3) GPS giây dùng formatter fmtInputNumber (utils/numFmt); (4) BuoyStationDetailContent tab Thông tin vị trí thêm dòng 'Biểu tượng' (r.icon). CÒN LẠI gap lớn nhất chưa sửa (user hoãn): Địa điểm Tỉnh/TP dùng tên tỉnh string→province, KHÔNG dùng mã TCTK→province_id như phao tiêu (cần sửa backend DTO+service+frontend). Gate: npm run build exit 0.
