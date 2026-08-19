---
id: AM-adad2cc17ce3fd29
kind: decision
topic: sdlc-doc-stage-anchor-format-gate
tags: []
importance: 0.9
agent: 
created: 2026-08-17T05:17:18.285Z
updated: 2026-08-17T05:17:18.285Z
---

SYSTEMIC: SDLC document-artifact stages (solution-designer, security-auditor, QA) repeatedly fail the brief_contract_resolution gate because their authoring briefs omit the exact inline anchor format. Every existing-behavior claim must be a backtick-quoted `Basename.ext:line` token — NO parenthesized full paths, NO directory prefix, NO standalone backtick-quoted class names (the gate checks the named symbol against the anchor line ±5), and exactly ONE symbol + its matching anchor per line (conflated pairs mis-associate). Cost 4 rework rounds on M-1004 and visible as the correct-but-hard-won format in M-1003's design plan. PMO fix: every design/security/QA brief MUST state this format explicitly and carry the verified anchor line numbers.
