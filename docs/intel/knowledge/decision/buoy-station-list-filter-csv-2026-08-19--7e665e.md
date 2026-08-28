---
id: AM-7e665eedd817a5ee
kind: decision
topic: buoy-station-list-filter-csv-2026-08-19
tags: []
importance: 0.85
agent: 
created: 2026-08-19T10:23:52.426Z
updated: 2026-08-19T10:23:52.426Z
---

Nhà trạm phao tiêu + phao tiêu — list/filter khớp CSV QL Nhà trạm phao tiêu ĐÃ XONG 2026-08-19 (C1 TRI-1787134791458-562a, inline): (1) BuoyStationList thêm cột Đơn vị khai thác (operatingOrgId), Phân loại + Phân loại phao (aggregate từ searchBuoys group theo buoyStationId), đổi nhãn audit theo CSV (Cán bộ/Ngày gửi phê duyệt, cấp Cảng vụ/Chi cục, cấp Cục), thêm 2 filter Phân loại; (2) xóa nhà trạm chỉ DRAFT|REJECTED (giống phao tiêu, trước đây PUBLISHED); (3) backend BuoyStationService.approveL1 BỎ chặn tự phê duyệt (giống buoy), submitForApproval + create(action=submit) ghi sentApprovedBy/sentApprovedDate; (4) BuoyListPage tách 4 cột gộp thành 8 cột Ngày/Cán bộ riêng. Gate: npm run build + mvn compile exit 0.
