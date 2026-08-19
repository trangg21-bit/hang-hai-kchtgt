---
id: AM-537bd85709ca1604
kind: decision
topic: ba-stage-anchor-gate-rework
tags: []
importance: 0.9
agent: 
created: 2026-08-17T04:56:52.630Z
updated: 2026-08-17T04:56:52.630Z
---

Recurring BA-stage rework across modules (M-001/M-004/M-022): the brief_contract_resolution gate rule 'brief-anchor-symbol-absent' rejects File.java:N code anchors in BA specs whenever the anchor's actual symbol doesn't match the brief's primary subject or the file is outside the triage edit-target list. Systemic fix for PMO BA briefs: instruct the BA to cite code anchors as 'dòng N' line-number format (or quote the exact symbol at each anchor), and never use File.java:N anchors for files NOT in the triage edit-target list (e.g. an unchanged controller whose permissions are merely mentioned).
