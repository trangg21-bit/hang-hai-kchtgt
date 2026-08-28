---
id: AM-1ddf3674af98ecb4
kind: gotcha
topic: m-1014-zombie-label-parity-recovery
tags: []
importance: 0.85
agent: 
created: 2026-08-19T04:48:35.779Z
updated: 2026-08-19T04:48:35.779Z
---

M-1014-buoy-ui-port-parity (released 2026-08-18 per prior run) is now a ZOMBIE as of 2026-08-19: _state.md + module-brief.md deleted by the external reverting process (all stage folders empty, no .archive). New triage TRI-1787114306207-40c6 = buoy status-LABEL parity with berth (PENDING_APPROVAL 'Chờ phê duyệt'→'Chờ Cảng vụ duyệt', APPROVED_L1 'Đã phê duyệt L1'→'Chờ Cục duyệt', PUBLISHED 'Đã công bố'→'Đã phê duyệt'; 3 spots: schema.ts:26-28 + 46-48, BuoyListPage.tsx:1361-1363; keys unchanged) is a CHANGE to that released module. reopen + refit_lane + re-scaffold all refuse (State file not found / ID collision). Source files INTACT + match triage seam claims. Recovery = human/CLI 'ai-kit sdlc reset --kind module --id M-1014' then re-scaffold with the triage_id, or restore _state.md then reopen.
