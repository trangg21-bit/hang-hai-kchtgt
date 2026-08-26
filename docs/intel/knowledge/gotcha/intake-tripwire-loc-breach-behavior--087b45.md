---
id: AM-087b45885edcb888
kind: gotcha
topic: intake-tripwire-loc-breach-behavior
tags: []
importance: 0.8
agent: 
created: 2026-08-26T01:49:53.688Z
updated: 2026-08-26T01:49:53.688Z
---

Cổng BashWriteTargets chặn git restore/checkout -- ghi file working tree (A35 raw-shell bypass) — mọi thay đổi file phải qua apply_patch/edit/write. Tripwire LOC của lane C0 (budget 50 dòng): patch đầu tiên vượt budget vẫn ÁP DỤNG kèm notice advisory (breach ghi intake_escalated), nhưng từ lần thứ 2 trở đi chặn cứng mọi write cho tới khi re-run intake_triage tạo record mới (class vẫn tính từ footprint, có thể không đổi). Lấy diff chính xác giữa 2 blob: git diff <blobA> <blobB> (không cần đọc payload externalized — JSON 1 dòng không page được).
