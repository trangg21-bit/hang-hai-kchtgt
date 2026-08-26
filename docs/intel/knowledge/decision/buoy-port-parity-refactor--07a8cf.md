---
id: AM-07a8cf179375cce7
kind: decision
topic: buoy-port-parity-refactor
tags: []
importance: 0.8
agent: 
created: 2026-08-18T04:07:35.365Z
updated: 2026-08-18T05:49:12.241Z
---

HOÀN TẤT 2026-08-18: Refactor màn Phao tiêu theo chuẩn Cảng biển đã delivered + released qua module M-1014-buoy-ui-port-parity (6/6 stage Pass: designer, QA w1, backend w1 contract, frontend w1, QA w2, code reviewer). Cấu trúc mới: frontend/src/services/buoy/{types,api,schema,BuoyListPage,BuoyFormContent,BuoyDetailContent}; App.tsx gom 3 route /buoys(+create/:id) về 1 route Drawer flow; beaconService.buoyCRUD delegate sang services/buoy/api giữ export surface (GISChartView/BeaconList/BuoyStation* vẫn dùng được); pages/buoys/* đã xóa. Gate verify: npm run build exit 0; tsc -p tsconfig.app.json --noEmit = 960 lỗi/111 file baseline, 0 lỗi trong services/buoy+pages/buoys. Triage: TRI-1787025988053-0497.json. LƯU Ý: process ngoài vẫn đang làm M-1015 (nhà trạm phao tiêu) + sửa pages/station — đừng đụng vào.
