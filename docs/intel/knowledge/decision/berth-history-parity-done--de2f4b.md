---
id: AM-de2f4bca8d452aa1
kind: decision
topic: berth-history-parity-done
tags: []
importance: 0.75
agent: 
created: 2026-08-18T02:43:42.430Z
updated: 2026-08-18T02:55:35.485Z
---

Berth history parity (tiếp 2026-08-18): historyFieldValue trong BerthList.tsx đã map portId → tên cảng biển (portMap useMemo từ portOptions, thay cho substring(0,8)+'…' cũ) và thêm format changedAt/createdAt DD/MM/YYYY HH:mm — đồng bộ PortListPage. Các field đã map: orgUnitId (orgMap, split ' - ' pop), mapSymbolId (symbolMap), portId (portMap), provinceId (VIETNAM_PROVINCES), approvalStatus/operationalStatus/structureType/coordinateSystem (enum map). spatialId + createdBy/updatedBy vẫn raw như Port (chưa map). Vite build exit 0.
