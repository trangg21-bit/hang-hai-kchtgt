---
id: AM-92c1bebf0013c392
kind: decision
topic: dryport-berth-detail-merge-loss
tags: []
importance: 0.9
agent: 
created: 2026-08-26T01:49:53.146Z
updated: 2026-08-26T02:08:41.054Z
---

Merge 7e83ae68 (24/08/2026) làm rơi bản refactored của DryPortDetailContent.tsx (blob origin 579d793a) và BerthDetailContent.tsx (cb0895d1) — merge giữ bản cũ. Nguồn khôi phục: d0d72b6c / feature/sprint-3/refactor-ports (78d93d6a). DryPortDetailContent contract = organizations: any[] (DryPortListPage.tsx:1122) — bản cũ orgMap crash runtime. QUYẾT ĐỊNH 26/08/2026 (user): back 4 file về d0d72b6c — WaterZoneList.tsx + BerthListPage.tsx BYTE-EXACT origin (BerthListPage back = MẤT cột 'Cán bộ cập nhật' thêm bởi dca1162e 25/08); DryPortDetailContent + BerthDetailContent = origin + 3 dòng token/label (token thay hex, giữ đúng chuẩn); PierDetailContent/PierListPage giữ nguyên (đã đúng). Lane C1 chạm LOC hard-stop 947/400 — sửa tiếp khu vực này phải re-triage C2 + dispatch pmo. TRI-1787709209010-bc5b.
