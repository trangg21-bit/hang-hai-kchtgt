---
id: AM-fd715eec15111fcd
kind: decision
topic: anchorage-history-berth-parity
tags: []
importance: 0.8
agent: 
created: 2026-08-26T06:06:28.818Z
updated: 2026-08-26T06:06:28.818Z
---

Lịch sử Khu neo đậu (AnchorageListPage.tsx) đã đồng bộ cấu trúc FE với chuẩn BerthListPage 2026-08-26: (1) Radio.Group tabs 'Bản ghi hiện tại/Tất cả bản ghi' bọc <div style={{display:'none'}}> (ẨN — trước đó hiển thị thừa); (2) thêm state historyExpanded/historyVisible (state chết giống Berth, chỉ reset không render); (3) row key đổi từ key={fn} → key={`${fn}-${ri}`} + paddingTop: ri>0?spaceXs:0 (fix React duplicate key khi cùng field đổi nhiều lần trong 1 group cùng giây/actor); (4) group key key={gi}. Verify: npm run build (vite) exit 0 + npx tsc --noEmit exit 0. LƯU Ý: historyFieldValue của Anchorage CHƯA map buoyStationId (buoyStationMap có sẵn nhưng không dùng) → trạm phao tiêu hiển thị UUID thô.
