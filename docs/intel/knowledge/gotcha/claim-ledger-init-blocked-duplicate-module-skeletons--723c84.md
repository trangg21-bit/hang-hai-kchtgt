---
id: AM-723c84080d1d6ded
kind: gotcha
topic: claim-ledger-init-blocked-duplicate-module-skeletons
tags: []
importance: 0.85
agent: 
created: 2026-08-22T09:51:56.111Z
updated: 2026-08-22T09:51:56.111Z
---

Claim ledger (docs/intel/_run-claim.json) init is REFUSED by 4 pre-existing duplicate module-id folders in docs/modules/: M-1003-fix-permissions-role-key-crash, M-1004-fix-raw-permission-tree-undefined-keys, M-1005-always-allow-port-berth-pier-fix-permission-crash, M-1006-refactor-dryport-ui — each is a SKELETON (only empty stage dirs ba/design/designer/qa/reviewer/security, NO _state.md) colliding with the real content-bearing module of the same id (M-1003-fix-antd-static-message-context-warning, M-1004-field-level-authorization, M-1005-toi-uu-hieu-nang-phan-quyen, M-1006-thong-nhat-phe-duyet-2-cap-kchtgt). New modules (e.g. M-1019) cannot be claimed until init succeeds; the only fix is human/CLI `ai-kit sdlc state update --op delete_module` on the 4 skeleton folders (or manual removal), then re-run `ai-kit-claim init`. PMO has no typed op for this (delete_module is human/CLI-only).
