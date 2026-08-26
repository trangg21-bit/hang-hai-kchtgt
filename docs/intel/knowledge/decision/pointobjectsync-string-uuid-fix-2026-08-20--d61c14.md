---
id: AM-d61c149d4b5f6301
kind: decision
topic: pointobjectsync-string-uuid-fix-2026-08-20
tags: []
importance: 0.7
agent: 
created: 2026-08-20T02:10:43.405Z
updated: 2026-08-20T02:10:43.405Z
---

Lỗi compile BE String→UUID (2026-08-20, TRI-1787191721611-aea7 C1 hotfix) ĐÃ SỬA: PointObjectSyncService.syncToMapDen:40 point.setApprovedBy(entity.getApprovedBy()) — LighthouseStation.approvedBy là String (entity:65, set = approverId.toString()) còn PointObject.approvedBy là UUID → incompatible types. Fix: UUID.fromString + null guard (pattern LighthouseStationService.java:410) + import java.util.UUID. syncToMapPhao (BuoyStation) không bị vì BuoyStation.approvedBy là UUID.
