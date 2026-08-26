---
id: AM-2faeca008604be7f
kind: decision
topic: reject-2-cap-fe-be-2026-08-26
tags: []
importance: 0.9
agent: 
created: 2026-08-26T04:37:39.635Z
updated: 2026-08-26T04:37:39.635Z
---

REJECT 2 CẤP ĐÃ HOÀN THIỆN FE+BE (2026-08-26, user yêu cầu làm đủ 6 màn): BE reject path giờ ghi theo trạng thái hiện tại — cụm cảng (Berth/Pier/DryPort/AnchorageApprovalService): APPROVED_LEVEL2→REJECTED_LEVEL2, còn lại→REJECTED_LEVEL1; cụm phao (BuoyService/BuoyStationService): status APPROVED_L1→'REJECTED_L2'/'REJECTED_L1' + approvalStatus REJECTED_LEVEL2/1 tương ứng. StationStatus enum THÊM REJECTED_L1, REJECTED_L2 (cuối enum, ORDINAL-safe, không cần migration). DryPort/Berth 3-arg reject cũ delegate InfrastructureApprovalService với semantics sai (APPROVED_LEVEL1→approveC2) → đã thay bằng ghi trực tiếp (đồng thời fix lỗi dryport reject đang 500 IllegalStateException). FE: tab 'Từ chối cấp Cảng vụ/Chi cục' đổi key REJECTED→REJECTED_LEVEL1 (cụm cảng) / REJECTED_L1 (cụm phao) + TAB_QUERY_MAP + filter dropdown thêm REJECTED_LEVEL2/REJECTED_L2 + badge REJECTED_L1 (BuoyListPage/schema) + anchorage reject cap theo trạng thái. LƯU Ý: dữ liệu REJECTED(6) legacy cũ giờ chỉ hiện ở tab Tất cả (badge vẫn fallback 'Từ chối cấp Cảng vụ/Chi cục'); các màn khác (Port/Cảng biển, VTS, AIS, BeaconStation) chưa đổi. Gate: mvn clean compile + npx tsc --noEmit + npm run build đều exit 0.
