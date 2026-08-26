---
id: AM-a493f3406dc6bead
kind: gotcha
topic: docs-modules-git-cleanup-deadlock
tags: []
importance: 0.8
agent: 
created: 2026-08-25T10:39:28.933Z
updated: 2026-08-25T10:39:28.933Z
---

DEADLOCK revert docs/modules: build seat bị chặn mọi write dưới docs/modules/** (SDLC-module gate — bash lẫn file-tool apply_patch đều từ chối 'stage artifacts are written by dispatched specialists'); pmo seat bash allowlist chỉ git read-only (status/diff/log/show/blame — git restore bị từ chối BASH_GIT_RESTORE_DENIED); general seat bị chặn dispatch cho work M-002. Hệ quả: 1 file dev artifact do subagent bị hủy git-add (docs/modules/M-002/dev/05-fe-dev-w1-port-edit-keeps-approval-status.md) KHÔNG agent nào xóa được — phải để user chạy 'git restore --staged --worktree -- <path>' (git index là user-owned). Các docs khác (feature-brief, base-pattern) thì revert sạch được vì process ngoài/cancel-cascade tự dọn.
