---
id: AM-f94753ffc8b99275
kind: gotcha
topic: port-detail-berth-waterway-map
tags: []
importance: 0.8
agent: 
created: 2026-08-21T07:05:30.406Z
updated: 2026-08-21T07:05:30.406Z
---

Drawer chi tiết bến cảng mở từ màn Cảng biển (PortListPage.tsx) ban đầu KHÔNG truyền waterwayMap vào BerthDetailContent → ô 'Thuộc luồng hàng hải' hiển thị UUID thô hoặc '—' (line 226: waterwayMap.get(r.waterwayId||'') || r.waterwayId || '—'). ĐÃ FIX 2026-08-21: PortListPage thêm state waterwayMap + useEffect gọi lineObjectService.list({status:'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize:1000}) và truyền waterwayMap={waterwayMap} vào <BerthDetailContent> (pattern copy từ BerthListPage.tsx:249-254).
