---
id: AM-ffe980310a1ee647
kind: gotcha
topic: anchorage-code-gen-fix
tags: []
importance: 0.5
agent: 
created: 2026-08-25T08:56:47.976Z
updated: 2026-08-25T08:56:47.976Z
---

AnchorageService.generateAnchorageCode() đã fix: dùng findByPortId + parse prefix PORT_CODE-ND-NNN giống hệt BerthService.generateBerthCode(). Thay vì native query regex cố định '^BC-.*-ND-[0-9]+$' (không filter portId → luôn sinh trùng). Format: PORT_CODE-ND-001, PORT_CODE-ND-002, v.v. Repository method: findByPortIdAndDeletedAtIsNull.
