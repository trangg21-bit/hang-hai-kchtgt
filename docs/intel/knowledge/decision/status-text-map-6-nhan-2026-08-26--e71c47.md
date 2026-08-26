---
id: AM-e71c4747fd90b031
kind: decision
topic: status-text-map-6-nhan-2026-08-26
tags: []
importance: 0.8
agent: 
created: 2026-08-26T04:07:25.734Z
updated: 2026-08-26T04:20:15.107Z
---

Đổi text map trạng thái phê duyệt 6 nhãn chuẩn (2026-08-26, inline KHÔNG PMO theo yêu cầu user; triage TRI-1787716698925-0b3a): Lưu tạm (DRAFT), Chờ phê duyệt cấp Cảng vụ/Chi cục (PENDING_APPROVAL/APPROVED_LEVEL1), Chờ phê duyệt cấp cục (APPROVED_LEVEL2/APPROVED_L1), Từ chối cấp Cảng vụ/Chi cục (REJECTED/REJECTED_LEVEL1), Từ chối cấp cục (REJECTED_LEVEL2/REJECTED_L2), Đã phê duyệt (APPROVED/PUBLISHED). Đã áp cho 7 màn: DryPortListPage, PierListPage, AnchorageListPage, BerthListPage (bổ sung theo yêu cầu lượt 2), BuoyListPage, BuoyStationListPage, + schema.ts chung (APPROVAL_STYLE_MAP + TAB_STATUS_LIST có thêm tab REJECTED_L2). Lượt 2 thêm tab 'Từ chối cấp cục' (REJECTED_LEVEL2 cụm cảng / REJECTED_L2 cụm phao) + TAB_QUERY_MAP bổ sung key tương ứng (anchorage/pier/berth/buoy) — dryport & buoy-station dùng key tab trực tiếp. LƯU Ý: backend reject vẫn ghi REJECTED(6) chung cho cả 2 cấp nên tab 'Từ chối cấp cục' chưa có dữ liệu (count 0) — muốn có số liệu phải sửa reject path ghi REJECTED_LEVEL1/2 theo trạng thái hiện tại. Gate: npx tsc --noEmit + npm run build exit 0. Cảng biển PortListPage, Trạm phao tiêu BeaconStationList, AIS, VTS vẫn label cũ — ngoài phạm vi user.
