---
id: AM-5da02a93aa22957f
kind: gotcha
topic: dryport-saveaction-case
tags: []
importance: 0.7
agent: 
created: 2026-08-17T02:09:59.060Z
updated: 2026-08-17T02:09:59.060Z
---

Cảng cạn (DryPort) backend DryPortService.create/update nhận saveAction CHỮ THƯỜNG: 'draft'|'submit'|'approve' (map DRAFT / PENDING_APPROVAL / APPROVED). Frontend DryPortList dùng actionMap {DRAFT:'draft', SUBMIT:'submit', SAVE_AND_APPROVE:'approve'}. KHÁC cảng biển BerthService.applySaveAction nhận CHỮ HOA DRAFT/SUBMIT/APPROVED/SAVE_AND_APPROVE. Không copy nguyên pattern saveAction giữa hai cụm.
