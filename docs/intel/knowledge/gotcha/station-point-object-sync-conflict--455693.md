---
id: AM-4556934177798511
kind: gotcha
topic: station-point-object-sync-conflict
tags: []
importance: 0.8
agent: 
created: 2026-08-20T03:47:12.806Z
updated: 2026-08-20T03:47:12.806Z
---

PointObjectSyncService.java (station) từng dính conflict stash chưa giải quyết: block syncToMapDen/hideFromMapDen tham chiếu class LighthouseStation KHÔNG tồn tại (den/đèn biển sync đã có sẵn ở beacon package qua BeaconLight). Cách sửa: bỏ block conflict theo phía upstream. Lưu ý: mvn không có trên PATH máy manhhv1 — dùng Maven bundled của IntelliJ: "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd".
