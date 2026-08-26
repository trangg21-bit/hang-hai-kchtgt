---
id: AM-43732885b43afb7e
kind: decision
topic: buoy-station-csv-backend-2026-08-19
tags: []
importance: 0.85
agent: 
created: 2026-08-19T09:45:31.968Z
updated: 2026-08-19T09:45:31.968Z
---

Phần backend khớp CSV QL Nhà trạm phao tiêu ĐÃ HOÀN TẤT (2026-08-19, triage TRI-1787132467671-3698 C3, làm inline theo user): (1) Entity BuoyStation +14 cột (operationPlanCode/Name/StartDate/EndDate, maintenancePlanCode/Name/StartTime/EndTime, incidentCode/Type/Location/Time, level1/2ApprovalContent) + migration V20260819130000 (VARCHAR, IF NOT EXISTS); (2) approveL1/L2 nhận thêm @RequestParam(required=false) content → set level1/2ApprovalContent (controller+service); (3) generateCode đổi sang NT-{seq} (đếm toàn bộ nhà trạm, bỏ prefix {portCode}-NTPT) — portId vẫn validate tồn tại; (4) BuoyRepository thêm findByBuoyStationId + controller GET /v1/buoy-station/{id}/buoys trả {id,code,name,classification,classificationBuoy,classificationMark}; (5) Frontend: api approveBuoyStationL1/L2(content?), fetchStationBuoys; types +14 field + StationBuoySummary; List approve modal thêm TextArea 'Nội dung phê duyệt' + detailBuoys state; DetailContent thêm 4 tab (Danh sách phao tiêu bảng 5 cột 34-38, Vận hành 39-42, Bảo trì 43-46, Sự cố 47-50) + 2 dòng Nội dung phê duyệt trong Thông tin hệ thống. Gate: npm run build + mvn compile exit 0. LƯU Ý: cột Phân loại 34-36 CSV ghi Danh sách=TRUE nhưng triển khai như bảng read-only trong detail (interpretation hợp lý).
